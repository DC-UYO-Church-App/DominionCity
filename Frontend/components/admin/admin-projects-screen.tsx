"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadCloud, Users } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
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

export function AdminProjectsScreen() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]

  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [status, setStatus] = useState("active")
  const [description, setDescription] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Givers modal
  const [giversOpen, setGiversOpen] = useState(false)
  const [givers, setGivers] = useState<any[]>([])
  const [giversTitle, setGiversTitle] = useState("")

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
      .getProjects()
      .then((res) => setProjects(res.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const resetForm = () => {
    setTitle("")
    setTargetAmount("")
    setStatus("active")
    setDescription("")
    setCoverFile(null)
    setCoverPreview(null)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Missing details", { description: "Project title is required." })
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        title,
        description: description || undefined,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
        status,
        coverFile: coverFile || undefined,
      }
      const res = editingId
        ? await apiClient.updateProject(editingId, payload)
        : await apiClient.createProject(payload)
      if (res?.project) {
        setProjects((prev) =>
          editingId ? prev.map((p) => (p.id === editingId ? { ...p, ...res.project } : p)) : [res.project, ...prev]
        )
      }
      toast.success(editingId ? "Project updated" : "Project created")
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Failed to save project",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (project: any) => {
    setEditingId(project.id)
    setTitle(project.title || "")
    setTargetAmount(project.targetAmount ? String(project.targetAmount) : "")
    setStatus(project.status || "active")
    setDescription(project.description || "")
    setCoverFile(null)
    setCoverPreview(resolveImageUrl(project.imageUrl))
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success("Project deleted")
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Failed to delete",
      })
    }
  }

  const viewGivers = async (project: any) => {
    setGiversTitle(project.title)
    setGivers([])
    setGiversOpen(true)
    try {
      const res = await apiClient.getProject(project.id)
      setGivers(res.givers || [])
    } catch {
      setGivers([])
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Ongoing Projects</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Add Project
          </Button>
        </div>

        <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No projects yet.</div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const cover = resolveImageUrl(project.imageUrl)
                const raised = Number(project.totalRaised || 0)
                const target = Number(project.targetAmount || 0)
                const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null
                return (
                  <div
                    key={project.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                        {cover ? (
                          <img src={cover} alt={project.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{project.title}</p>
                        <p className="text-sm text-slate-500">
                          Raised {naira(raised)}
                          {target > 0 ? ` of ${naira(target)}${pct !== null ? ` (${pct}%)` : ""}` : ""}
                        </p>
                        <button
                          onClick={() => viewGivers(project)}
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#3c6eea] hover:underline"
                        >
                          <Users className="h-3 w-3" />
                          {project.contributorCount || 0} givers
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-500">
                        {project.status}
                      </span>
                      <Button variant="outline" onClick={() => handleEdit(project)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Create / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "Add New Project"}</DialogTitle>
            <DialogDescription>Members will be able to give toward this project.</DialogDescription>
          </DialogHeader>

          <Card className="rounded-2xl border-none bg-white p-0 shadow-none sm:p-6 sm:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                {coverPreview ? (
                  <img src={coverPreview} alt="Project cover" className="h-full w-full object-cover" />
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
                      toast.error("Invalid image", { description: "Only JPG or PNG allowed." })
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
                <label className="text-sm font-semibold text-slate-600">Project Title</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Target Amount (optional)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="e.g. 5000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Status</label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="What is this project about?"
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

      {/* Givers modal */}
      <Dialog open={giversOpen} onOpenChange={setGiversOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Givers — {giversTitle}</DialogTitle>
            <DialogDescription>Confirmed contributions toward this project.</DialogDescription>
          </DialogHeader>
          {givers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No confirmed givers yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {givers.map((g) => (
                <li key={g.contributionId} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-700">{g.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{naira(Number(g.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
