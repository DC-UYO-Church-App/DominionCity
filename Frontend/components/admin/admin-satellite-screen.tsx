"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Church, MapPin, UserCircle2 } from "lucide-react"
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

export function AdminSatelliteScreen() {
  const { toast } = useToast()

  const [churches, setChurches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [assignedUserId, setAssignedUserId] = useState<string>("")
  const [assignedLabel, setAssignedLabel] = useState<string>("")

  // User search
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const load = () => {
    apiClient
      .getSatelliteChurches()
      .then((res) => setChurches(res.satelliteChurches || []))
      .catch(() => setChurches([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  // Debounced user search
  useEffect(() => {
    if (!userQuery.trim()) {
      setUserResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      apiClient
        .searchUsers(userQuery)
        .then((res) => setUserResults(res.users || []))
        .catch(() => setUserResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [userQuery])

  const resetForm = () => {
    setName("")
    setLocation("")
    setDescription("")
    setAssignedUserId("")
    setAssignedLabel("")
    setUserQuery("")
    setUserResults([])
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Missing details", description: "Church name is required.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        name,
        location: location || undefined,
        description: description || undefined,
        assignedUserId: assignedUserId || undefined,
      }
      const res = editingId
        ? await apiClient.updateSatelliteChurch(editingId, {
            ...payload,
            assignedUserId: assignedUserId || null,
          })
        : await apiClient.createSatelliteChurch(payload)
      if (res?.satelliteChurch) {
        load()
      }
      toast({ title: editingId ? "Satellite church updated" : "Satellite church created" })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (church: any) => {
    setEditingId(church.id)
    setName(church.name || "")
    setLocation(church.location || "")
    setDescription(church.description || "")
    setAssignedUserId(church.assignedUserId || "")
    setAssignedLabel(church.assignedUserName || "")
    setUserQuery("")
    setUserResults([])
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteSatelliteChurch(id)
      setChurches((prev) => prev.filter((c) => c.id !== id))
      toast({ title: "Satellite church deleted" })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Satellite Churches</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Create Satellite Church
          </Button>
        </div>

        <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
          ) : churches.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No satellite churches yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {churches.map((church) => (
                <div key={church.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3c6eea]/10">
                        <Church className="h-5 w-5 text-[#3c6eea]" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{church.name}</p>
                        {church.location && (
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" /> {church.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {church.description && (
                    <p className="mt-3 text-sm text-slate-500">{church.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <UserCircle2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {church.assignedUserName ? `Assigned to ${church.assignedUserName}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(church)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(church.id)}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Satellite Church" : "Create Satellite Church"}</DialogTitle>
            <DialogDescription>Assign it to a member to give them a satellite dashboard.</DialogDescription>
          </DialogHeader>

          <Card className="rounded-2xl border-none bg-white p-0 shadow-none sm:p-6 sm:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="grid gap-5 sm:gap-6">
              <div>
                <label className="text-sm font-semibold text-slate-600">Church Name</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Location</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="City / area"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Assign to Member</label>
                {assignedUserId ? (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className="min-w-0 break-words text-slate-700">{assignedLabel || "Selected member"}</span>
                    <button
                      className="shrink-0 text-xs font-semibold text-red-500 hover:underline"
                      onClick={() => {
                        setAssignedUserId("")
                        setAssignedLabel("")
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      placeholder="Search member by name or email"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                    />
                    {userQuery.trim() && (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {searching ? (
                          <p className="px-4 py-3 text-sm text-slate-400">Searching...</p>
                        ) : userResults.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-400">No members found.</p>
                        ) : (
                          userResults.map((u) => (
                            <button
                              key={u.id}
                              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
                              onClick={() => {
                                setAssignedUserId(u.id)
                                setAssignedLabel(`${u.firstName} ${u.lastName}`.trim())
                                setUserQuery("")
                                setUserResults([])
                              }}
                            >
                              <span className="text-slate-700">
                                {u.firstName} {u.lastName}
                              </span>
                              <span className="text-xs text-slate-400">{u.email}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  className="mt-2 h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Optional details"
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
                {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Create"}
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
