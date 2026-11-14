"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UploadCloud } from "lucide-react"
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

export function AdminEventsScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("")
  const [isLocating, setIsLocating] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]

  const resetForm = () => {
    setTitle("")
    setTime("")
    setDate("")
    setAddress("")
    setDescription("")
    setLatitude("")
    setLongitude("")
    setRadius("")
    setCoverFile(null)
    setCoverPreview(null)
    setEditingId(null)
  }

  const handleUseMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location unavailable", { description: "This device can't share its location." })
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        if (!radius.trim()) setRadius("100")
        setIsLocating(false)
        toast.success("Location captured", { description: "Centred the check-in area on your current position." })
      },
      () => {
        setIsLocating(false)
        toast.error("Couldn't get location", { description: "Allow location access, or enter the coordinates manually." })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    apiClient
      .getEvents()
      .then((response) => setEvents(response.events || []))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false))
  }, [])

  const categorizedEvents = useMemo(() => {
    const now = new Date()
    const mapped = events
      .map((event) => ({
        ...event,
        eventDate: event.eventDate ? new Date(event.eventDate) : null,
        status: event.status || "scheduled",
        cover: (() => {
          const value = event.imageUrl
          if (!value) return null
          if (value.startsWith("http")) return value
          if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
          if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
          if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
          return value
        })(),
      }))
      .filter((event) => event.eventDate)
    return {
      ongoing: mapped.filter((event) => event.status !== "cancelled" && event.eventDate >= now),
      past: mapped.filter((event) => event.status !== "cancelled" && event.eventDate < now),
      cancelled: mapped.filter((event) => event.status === "cancelled"),
    }
  }, [events])

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time) {
      toast.error("Missing details", { description: "Event name, date, and time are required." })
      return
    }

    const eventDate = new Date(`${date}T${time}`)
    if (Number.isNaN(eventDate.getTime())) {
      toast.error("Invalid date", { description: "Please provide a valid event date and time." })
      return
    }

    // Geofence is optional, but all three parts move together.
    const latStr = latitude.trim()
    const lngStr = longitude.trim()
    const radStr = radius.trim()
    const hasAny = latStr !== "" || lngStr !== "" || radStr !== ""
    const hasAll = latStr !== "" && lngStr !== "" && radStr !== ""

    if (hasAny && !hasAll) {
      toast.error("Incomplete check-in area", {
        description: "Enter latitude, longitude, and radius together, or leave all three empty.",
      })
      return
    }

    const latNum = Number(latStr)
    const lngNum = Number(lngStr)
    const radNum = Number(radStr)

    if (hasAll) {
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        toast.error("Invalid latitude", { description: "Latitude must be between -90 and 90." })
        return
      }
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
        toast.error("Invalid longitude", { description: "Longitude must be between -180 and 180." })
        return
      }
      if (!Number.isInteger(radNum) || radNum <= 0) {
        toast.error("Invalid radius", { description: "Radius must be a whole number of metres greater than 0." })
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = editingId
        ? await apiClient.updateEvent(editingId, {
            title,
            description,
            eventDate: eventDate.toISOString(),
            address: address || undefined,
            // On edit, all-three-empty clears any existing geofence.
            latitude: hasAll ? latNum : null,
            longitude: hasAll ? lngNum : null,
            geofenceRadiusM: hasAll ? radNum : null,
            coverFile: coverFile || undefined,
          })
        : await apiClient.createEvent({
            title,
            description,
            eventDate: eventDate.toISOString(),
            address: address || undefined,
            latitude: hasAll ? latNum : undefined,
            longitude: hasAll ? lngNum : undefined,
            geofenceRadiusM: hasAll ? radNum : undefined,
            coverFile: coverFile || undefined,
          })

      if (response?.event) {
        setEvents((prev) =>
          editingId ? prev.map((item) => (item.id === editingId ? response.event : item)) : [response.event, ...prev]
        )
      }

      toast.success(editingId ? "Event updated" : "Event saved", { description: editingId ? "Your event has been updated." : "Your event has been posted." })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save event"
      toast.error("Save failed", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (event: any) => {
    setEditingId(event.id)
    setTitle(event.title || "")
    setDescription(event.description || "")
    const eventDate = event.eventDate ? new Date(event.eventDate) : null
    if (eventDate) {
      setDate(eventDate.toISOString().slice(0, 10))
      setTime(eventDate.toISOString().slice(11, 16))
    } else {
      setDate("")
      setTime("")
    }
    setAddress(event.address || "")
    setLatitude(event.latitude != null ? String(event.latitude) : "")
    setLongitude(event.longitude != null ? String(event.longitude) : "")
    setRadius(event.geofenceRadiusM != null ? String(event.geofenceRadiusM) : "")
    setCoverFile(null)
    setCoverPreview(event.cover || null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteEvent(id)
      setEvents((prev) => prev.filter((item) => item.id !== id))
      toast.success("Event deleted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete event"
      toast.error("Delete failed", { description: message })
    }
  }

  const handleCancelEvent = async (id: string) => {
    try {
      const response = await apiClient.updateEvent(id, { status: "cancelled" })
      if (response?.event) {
        setEvents((prev) => prev.map((item) => (item.id === id ? response.event : item)))
      }
      toast.success("Event cancelled")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel event"
      toast.error("Cancel failed", { description: message })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Events</h1>
          <Button
            className="rounded-lg bg-[#3c6eea] px-6 text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Create Event
          </Button>
        </div>

        <Tabs defaultValue="ongoing" className="space-y-4">
          <TabsList className="h-auto w-full max-w-full justify-start gap-1 overflow-x-auto hide-scrollbar rounded-full bg-white p-1 shadow-sm">
            <TabsTrigger value="ongoing" className="shrink-0 rounded-full px-4 sm:px-6">Ongoing Events</TabsTrigger>
            <TabsTrigger value="past" className="shrink-0 rounded-full px-4 sm:px-6">Past Events</TabsTrigger>
            <TabsTrigger value="cancelled" className="shrink-0 rounded-full px-4 sm:px-6">Cancelled Events</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing">
            <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading events...</div>
              ) : categorizedEvents.ongoing.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No ongoing events.</div>
              ) : (
                <div className="space-y-4">
                  {categorizedEvents.ongoing.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                          {event.cover ? (
                            <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{event.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(event.eventDate).toLocaleString()}
                          </p>
                          {event.address ? <p className="text-sm text-slate-500">{event.address}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleEdit(event)}>
                          Edit
                        </Button>
                        <Button variant="outline" onClick={() => handleCancelEvent(event.id)}>
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="past">
            <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading events...</div>
              ) : categorizedEvents.past.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No past events.</div>
              ) : (
                <div className="space-y-4">
                  {categorizedEvents.past.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                          {event.cover ? (
                            <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{event.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(event.eventDate).toLocaleString()}
                          </p>
                          {event.address ? <p className="text-sm text-slate-500">{event.address}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleEdit(event)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="cancelled">
            <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading events...</div>
              ) : categorizedEvents.cancelled.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No cancelled events.</div>
              ) : (
                <div className="space-y-4">
                  {categorizedEvents.cancelled.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                          {event.cover ? (
                            <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{event.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(event.eventDate).toLocaleString()}
                          </p>
                          {event.address ? <p className="text-sm text-slate-500">{event.address}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>Fill in the event details below.</DialogDescription>
          </DialogHeader>

          <Card className="rounded-2xl border-none bg-white p-0 shadow-none sm:p-6 sm:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                {coverPreview ? (
                  <img src={coverPreview} alt="Event cover" className="h-full w-full object-cover" />
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
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    if (file && !allowedImageTypes.includes(file.type)) {
                      toast.error("Invalid image", { description: "Only JPG or PNG images are allowed." })
                      event.target.value = ""
                      setCoverFile(null)
                      setCoverPreview(null)
                      return
                    }
                    setCoverFile(file)
                    if (file) {
                      setCoverPreview(URL.createObjectURL(file))
                    } else {
                      setCoverPreview(null)
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Event Name</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Enter event name"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Time</label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Address</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Optional event details"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Location check-in (optional)</label>
                    <p className="text-xs text-slate-400">
                      Set a centre point and radius to require members to be at the venue to check in. Leave empty to
                      allow check-in from anywhere.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? "Locating..." : "Use my current location"}
                  </Button>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      placeholder="e.g. 5.038811"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      placeholder="e.g. 7.909568"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Radius (metres)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      placeholder="e.g. 100"
                      value={radius}
                      onChange={(event) => setRadius(event.target.value)}
                    />
                  </div>
                </div>
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
