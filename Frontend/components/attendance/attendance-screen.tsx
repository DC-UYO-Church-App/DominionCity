"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, QrCode, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

export function AttendanceScreen() {
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<
    { id: string; serviceDate: string; status: string; title: string; eventId?: string | null }[]
  >([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const today = useMemo(() => new Date(), [])
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const todaysEvents = useMemo(() => {
    const todayDate = today.toISOString().slice(0, 10)
    return events
      .map((event) => ({
        ...event,
        eventDate: event.eventDate ? new Date(event.eventDate) : null,
      }))
      .filter(
        (event) =>
          event.eventDate &&
          event.status !== "cancelled" &&
          event.eventDate.toISOString().slice(0, 10) === todayDate
      )
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
  }, [events, today])

  const checkedEventIds = useMemo(() => new Set(history.map((record) => record.eventId).filter(Boolean)), [history])

  const activeEvent = useMemo(() => {
    return todaysEvents.find((event) => !checkedEventIds.has(event.id)) || null
  }, [todaysEvents, checkedEventIds])

  useEffect(() => {
    apiClient
      .getProfile()
      .then((response) => {
        const profile = response?.user
        if (profile?.id) {
          setUserId(profile.id)
          return apiClient.getUserAttendance(profile.id)
        }
        return null
      })
      .then((attendanceResponse) => {
        if (!attendanceResponse?.attendance) return
        const mapped = attendanceResponse.attendance.map((record: any) => ({
          id: record.id,
          serviceDate: new Date(record.serviceDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          status: record.status,
          title: record.eventTitle || record.notes || "Service",
          eventId: record.eventId,
        }))
        setHistory(mapped)
      })
      .catch(() => {
        setHistory([])
      })
      .finally(() => setIsLoadingHistory(false))
  }, [])

  useEffect(() => {
    apiClient
      .getEvents()
      .then((response) => setEvents(response.events || []))
      .catch(() => setEvents([]))
      .finally(() => setIsLoadingEvents(false))
  }, [])

  const handleCheckIn = async () => {
    if (!userId || !activeEvent) {
      return
    }
    setIsCheckInDialogOpen(false)
    try {
      await apiClient.recordAttendance({
        userId,
        eventId: activeEvent.id,
        serviceDate: today.toISOString().slice(0, 10),
        status: "present",
        isFirstTimer: isFirstTimeVisitor,
        notes: activeEvent.title,
      })
      setIsConfirmationOpen(true)
      const newRecord = {
        id: `${userId}-${today.toISOString()}`,
        serviceDate: today.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        status: "present",
        title: activeEvent.title,
        eventId: activeEvent.id,
      }
      setHistory((prev) => [newRecord, ...prev])
      setTimeout(() => {
        setIsConfirmationOpen(false)
      }, 2000)
    } catch {
      setIsConfirmationOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Attendance</h1>
        <p className="text-muted-foreground">Check-in and view your attendance history</p>
      </div>

      <Card>
        <CardHeader className="bg-church-gold/10 border-b">
          <CardTitle className="text-lg">Today&apos;s Service</CardTitle>
          <CardDescription>{todayLabel}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-church-gold/20 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-church-gold" />
            </div>
            {isLoadingEvents ? (
              <div>
                <h3 className="font-semibold text-lg">Loading events...</h3>
              </div>
            ) : activeEvent ? (
              <div>
                <h3 className="font-semibold text-lg">{activeEvent.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {activeEvent.eventDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {todaysEvents.length > 1 ? (
                  <p className="text-xs text-muted-foreground">
                    {todaysEvents.length - checkedEventIds.size} event(s) remaining today.
                  </p>
                ) : null}
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg">No event today</h3>
                <p className="text-sm text-muted-foreground">Check back on the next service day.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            onClick={() => setIsCheckInDialogOpen(true)}
            className="bg-church-gold hover:bg-amber-400 text-church-navy"
            disabled={!activeEvent}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Check-in Now
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Attendance History</h2>
        <Card>
          <CardContent className="pt-6">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading attendance history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No attendance history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{record.title}</p>
                      <p className="text-xs text-muted-foreground">{record.serviceDate}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold uppercase text-emerald-600">
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in for Service</DialogTitle>
            <DialogDescription>Choose your preferred check-in method</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4 sm:gap-4">
            <Button variant="outline" className="h-24 flex flex-col">
              <QrCode className="h-8 w-8 mb-2" />
              <span>Scan QR Code</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col">
              <UserPlus className="h-8 w-8 mb-2" />
              <span>Manual Entry</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="first-time" checked={isFirstTimeVisitor} onCheckedChange={setIsFirstTimeVisitor} />
            <Label htmlFor="first-time">I am a first-time visitor</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} className="bg-church-gold hover:bg-amber-400 text-church-navy">
              Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check-in Successful!</h2>
            <p className="text-muted-foreground">You have successfully checked in for today&apos;s service.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
