"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    value || 0
  )

export function AdminProgramsScreen() {
  const { toast } = useToast()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]

  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [scope, setScope] = useState<"national" | "state">("national")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [status, setStatus] = useState("scheduled")
  const [description, setDescription] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const resolveImageUrl = (value: string | null | undefined) => {
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  }

  const load = () => {
    apiClient
      .getPrograms()
      .then((res) => setPrograms(res.programs || []))
      .catch(() => setPrograms([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const grouped = useMemo(
    () => ({
      national: programs.filter((p) => p.scope === "national"),
      state: programs.filter((p) => p.scope === "state"),
    }),
    [programs]
  )

  const resetForm = () => {
    setTitle("")
    setScope("national")
    setLocation("")
    setStartDate("")
    setStatus("scheduled")
    setDescription("")
    setCoverFile(null)
    setCoverPreview(null)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Missing details", description: "Program title is required.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        title,
        scope,
        location: location || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        status,
        description: description || undefined,
        coverFile: coverFile || undefined,
      }
      const res = editingId
        ? await apiClient.updateProgram(editingId, payload)
        : await apiClient.createProgram(payload)
      if (res?.program) {
        setPrograms((prev) =>
          editingId ? prev.map((p) => (p.id === editingId ? { ...p, ...res.program } : p)) : [res.program, ...prev]
        )
      }
      toast({ title: editingId ? "Program updated" : "Program created" })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save program",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (program: any) => {
    setEditingId(program.id)
    setTitle(program.title || "")
    setScope(program.scope || "national")
    setLocation(program.location || "")
    setStartDate(program.startDate ? new Date(program.startDate).toISOString().slice(0, 10) : "")
    setStatus(program.status || "scheduled")
    setDescription(program.description || "")
    setCoverFile(null)
    setCoverPreview(resolveImageUrl(program.imageUrl))
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteProgram(id)
      setPrograms((prev) => prev.filter((p) => p.id !== id))
      toast({ title: "Program deleted" })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      })
    }
  }

  const renderList = (list: any[]) => {
    if (isLoading) return <div className="py-10 text-center text-sm text-slate-400">Loading programs...</div>
    if (list.length === 0) return <div className="py-10 text-center text-sm text-slate-400">No programs here yet.</div>
    return (
      <div className="space-y-4">
        {list.map((program) => {
          const cover = resolveImageUrl(program.imageUrl)
          return (
            <div
              key={program.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                  {cover ? (
                    <img src={cover} alt={program.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{program.title}</p>
                  <p className="text-sm text-slate-500">
                    {program.startDate ? new Date(program.startDate).toLocaleDateString() : "No date"}
                    {program.location ? ` · ${program.location}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    Raised {naira(Number(program.totalRaised || 0))} · {program.contributorCount || 0} givers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-500">
                  {program.status}
                </span>
                <Button variant="outline" onClick={() => handleEdit(program)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(program.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Programs</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Add Program
          </Button>
        </div>

        <Tabs defaultValue="national" className="space-y-4">
          <TabsList className="h-auto w-full max-w-full justify-start gap-1 overflow-x-auto hide-scrollbar rounded-full bg-white p-1 shadow-sm">
            <TabsTrigger value="national" className="shrink-0 rounded-full px-4 sm:px-6">
              National Programs
            </TabsTrigger>
            <TabsTrigger value="state" className="shrink-0 rounded-full px-4 sm:px-6">
              State Programs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="national">
            <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {renderList(grouped.national)}
            </Card>
          </TabsContent>
          <TabsContent value="state">
            <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {renderList(grouped.state)}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Program" : "Add New Program"}</DialogTitle>
            <DialogDescription>Members can support this program from their dashboard.</DialogDescription>
          </DialogHeader>

          <Card className="rounded-2xl border-none bg-white p-0 shadow-none sm:p-6 sm:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                {coverPreview ? (
                  <img src={coverPreview} alt="Program cover" className="h-full w-full object-cover" />
                ) : (
                  <UploadCloud className="h-7 w-7" />
                )}
              </div>
              <label className="cursor-pointer text-sm font-semibold text-[#3c6eea]">
                Upload Cover Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (file && !allowedImageTypes.includes(file.type)) {
                      toast({ title: "Invalid image", description: "Only JPG or PNG allowed.", variant: "destructive" })
                      e.target.value = ""
                      return
                    }
                    setCoverFile(file)
                    setCoverPreview(file ? URL.createObjectURL(file) : null)
                  }}
                />
              </label>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Program Title</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Scope</label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "national" | "state")}
                >
                  <option value="national">National</option>
                  <option value="state">State</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Start Date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Location</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Venue / city"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Status</label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Program details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                className="rounded-full bg-[#5b8cff] px-16 text-white hover:bg-[#4a78e0]"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Add Now"}
              </Button>
            </div>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
