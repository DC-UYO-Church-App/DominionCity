"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function AdminActivitiesScreen() {
  const { toast } = useToast()

  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState("Sunday")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)

  const load = () => {
    apiClient
      .getWeeklyActivities()
      .then((res) => setActivities(res.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const resetForm = () => {
    setTitle("")
    setDayOfWeek("Sunday")
    setStartTime("")
    setEndTime("")
    setLocation("")
    setDescription("")
    setIsActive(true)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Missing details", description: "Activity title is required.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        title,
        dayOfWeek,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
        description: description || undefined,
        isActive,
      }
      const res = editingId
        ? await apiClient.updateWeeklyActivity(editingId, payload)
        : await apiClient.createWeeklyActivity(payload)
      if (res?.activity) {
        setActivities((prev) =>
          editingId ? prev.map((a) => (a.id === editingId ? res.activity : a)) : [...prev, res.activity]
        )
      }
      toast({ title: editingId ? "Activity updated" : "Activity created" })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save activity",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (activity: any) => {
    setEditingId(activity.id)
    setTitle(activity.title || "")
    setDayOfWeek(activity.dayOfWeek || "Sunday")
    setStartTime(activity.startTime ? String(activity.startTime).slice(0, 5) : "")
    setEndTime(activity.endTime ? String(activity.endTime).slice(0, 5) : "")
    setLocation(activity.location || "")
    setDescription(activity.description || "")
    setIsActive(activity.isActive !== false)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteWeeklyActivity(id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
      toast({ title: "Activity deleted" })
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Weekly Activities</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Add Activity
          </Button>
        </div>

        <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No weekly activities yet.</div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-[#3c6eea]/10 text-center">
                      <span className="text-[10px] font-semibold uppercase text-[#3c6eea]">
                        {String(activity.dayOfWeek).slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{activity.title}</p>
                      <p className="text-sm text-slate-500">
                        {activity.dayOfWeek}
                        {activity.startTime ? ` · ${String(activity.startTime).slice(0, 5)}` : ""}
                        {activity.endTime ? ` - ${String(activity.endTime).slice(0, 5)}` : ""}
                        {activity.location ? ` · ${activity.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        activity.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {activity.isActive ? "Active" : "Hidden"}
                    </span>
                    <Button variant="outline" onClick={() => handleEdit(activity)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(activity.id)}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Activity" : "Add Weekly Activity"}</DialogTitle>
            <DialogDescription>This appears in the members' activities section.</DialogDescription>
          </DialogHeader>

          <Card className="rounded-2xl border-none bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Activity Title</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="e.g. Choir Rehearsal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Day of Week</label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Start Time</label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">End Time</label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Location</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Venue"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  id="activity-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="activity-active" className="text-sm font-semibold text-slate-600">
                  Visible to members
                </label>
              </div>
              <div className="md:col-span-2">
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
