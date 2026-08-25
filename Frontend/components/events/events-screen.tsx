"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"

export function EventsScreen() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

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
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())

    return {
      ongoing: mapped.filter((event) => event.status !== "cancelled" && event.eventDate >= now),
      past: mapped.filter((event) => event.status !== "cancelled" && event.eventDate < now),
      cancelled: mapped.filter((event) => event.status === "cancelled"),
    }
  }, [events, uploadsBaseUrl])

  const renderList = (items: any[], emptyLabel: string) => {
    if (isLoading) {
      return <div className="py-10 text-center text-sm text-slate-400">Loading events...</div>
    }
    if (items.length === 0) {
      return <div className="py-10 text-center text-sm text-slate-400">{emptyLabel}</div>
    }

    return (
      <div className="space-y-4">
        {items.map((event) => (
          <div
            key={event.id}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-20 sm:w-28">
                {event.cover ? (
                  <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">{event.title}</p>
                <p className="text-sm text-slate-500">{event.eventDate.toLocaleString()}</p>
                {event.address ? (
                  <p className="break-words text-sm text-slate-500">{event.address}</p>
                ) : null}
              </div>
            </div>
            <Badge variant="outline" className="w-fit">
              {event.status === "cancelled" ? "Cancelled" : event.eventDate >= new Date() ? "Upcoming" : "Past"}
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Events</h1>
        <p className="text-sm text-slate-400">All events added by the admin.</p>
      </div>

      <Tabs defaultValue="ongoing" className="space-y-4">
        <TabsList className="h-auto w-full max-w-full justify-start gap-1 overflow-x-auto hide-scrollbar rounded-full bg-white p-1 shadow-sm text-slate-900">
          <TabsTrigger value="ongoing" className="shrink-0 rounded-full px-4 sm:px-6">
            Ongoing Events
          </TabsTrigger>
          <TabsTrigger value="past" className="shrink-0 rounded-full px-4 sm:px-6">
            Past Events
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="shrink-0 rounded-full px-4 sm:px-6">
            Cancelled Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing">
          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {renderList(categorizedEvents.ongoing, "No ongoing events.")}
          </Card>
        </TabsContent>
        <TabsContent value="past">
          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {renderList(categorizedEvents.past, "No past events.")}
          </Card>
        </TabsContent>
        <TabsContent value="cancelled">
          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {renderList(categorizedEvents.cancelled, "No cancelled events.")}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
