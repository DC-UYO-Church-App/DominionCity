"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminSermonsScreen() {
  const { toast } = useToast()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const [title, setTitle] = useState("")
  const [preacher, setPreacher] = useState("")
  const [duration, setDuration] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sermons, setSermons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetForm = () => {
    setTitle("")
    setPreacher("")
    setDuration("")
    setDescription("")
    setYoutubeLink("")
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setEditingId(null)
  }

  useEffect(() => {
    apiClient
      .getSermons()
      .then((response) => {
        setSermons(response.sermons || [])
      })
      .catch(() => {
        setSermons([])
      })
      .finally(() => setIsLoading(false))
  }, [])

  const listItems = useMemo(
    () =>
      sermons.map((sermon) => ({
        ...sermon,
        cover: (() => {
          const value = sermon.thumbnailUrl
          if (!value) return null
          if (value.startsWith("http")) return value
          if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
          if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
          if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
          return value
        })(),
      })),
    [sermons, uploadsBaseUrl]
  )

  const handleSubmit = async () => {
    if (!title.trim() || !preacher.trim()) {
      toast({
        title: "Missing details",
        description: "Sermon title and pastor name are required.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await apiClient.updateSermon(editingId, {
          title,
          preacher,
          description,
          videoUrl: youtubeLink || undefined,
        })
        setSermons((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? { ...item, title, preacher, description, videoUrl: youtubeLink }
              : item
          )
        )
      } else {
        const response = await apiClient.createSermon({
          title,
          preacher,
          duration: duration || undefined,
          description,
          videoUrl: youtubeLink || undefined,
          thumbnailFile,
          category: "general",
        })
        if (response?.sermon) {
          setSermons((prev) => [response.sermon, ...prev])
          if (thumbnailFile && !response.sermon.thumbnailUrl) {
            const refreshed = await apiClient.getSermons()
            setSermons(refreshed.sermons || [])
          }
        }
      }
      toast({
        title: editingId ? "Sermon updated" : "Sermon saved",
        description: editingId ? "Your sermon has been updated." : "Your sermon has been posted.",
      })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save sermon"
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (sermon: any) => {
    setEditingId(sermon.id)
    setTitle(sermon.title || "")
    setPreacher(sermon.preacher || "")
    setDescription(sermon.description || "")
    setYoutubeLink(sermon.videoUrl || "")
    setDuration("")
    setThumbnailFile(null)
    setThumbnailPreview(sermon.thumbnailUrl || null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteSermon(id)
      setSermons((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Sermon deleted" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete sermon"
      toast({ title: "Delete failed", description: message, variant: "destructive" })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Sermons</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Add Sermon
          </Button>
        </div>

        <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <div className="relative h-56 w-full">
            <img src="/Dr.jpg" alt="Live sermon" className="h-full w-full object-cover" />
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Uploaded Sermons</p>
          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading sermons...</div>
            ) : listItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No uploaded sermon at the moment.</div>
            ) : (
              <div className="space-y-4">
                {listItems.map((sermon) => (
                  <div
                    key={sermon.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center"
                  >
                    <div className="h-24 w-40 overflow-hidden rounded-lg bg-slate-100">
                      {sermon.cover ? (
                        <img src={sermon.cover} alt={sermon.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{sermon.title}</p>
                      <p className="text-sm text-slate-500">{sermon.preacher}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => handleEdit(sermon)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(sermon.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Sermon" : "Add New Sermon"}</DialogTitle>
            <DialogDescription>Fill in the sermon details below.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Sermon" className="h-full w-full object-cover" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>
            <label className="cursor-pointer text-sm font-semibold text-[#3c6eea]">
              Upload Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  if (file && !allowedImageTypes.includes(file.type)) {
                    toast({
                      title: "Invalid image",
                      description: "Only JPG or PNG images are allowed.",
                      variant: "destructive",
                    })
                    event.target.value = ""
                    setThumbnailFile(null)
                    setThumbnailPreview(null)
                    return
                  }
                  setThumbnailFile(file)
                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file))
                  } else {
                    setThumbnailPreview(null)
                  }
                }}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-600">Sermon Title</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Give your Life to Christ"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Pastor's Name</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Nonso Agu"
                value={preacher}
                onChange={(event) => setPreacher(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Duration (minutes)</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="45"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Sermon YouTube Link</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeLink}
                onChange={(event) => setYoutubeLink(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-600">Sermons Description</label>
              <textarea
                className="mt-2 h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Give your Life to Christ NOW"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#5b8cff] px-10 text-white hover:bg-[#4a78e0]"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Posting..." : editingId ? "Save Changes" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
