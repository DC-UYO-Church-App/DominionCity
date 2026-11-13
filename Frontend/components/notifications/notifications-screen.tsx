"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, ChevronRight, Loader2, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, any> | null
}

// Where a notification takes the member when they open it. Falls back to no
// link, so an unknown type still reads fine as plain text.
function linkFor(n: Notification): string | null {
  switch (n.type) {
    case "academy_cohort_open":
    case "academy_join_response":
      return "/dashboard/profile"
    case "academy_join_request":
      return n.metadata?.cohortId
        ? `/dashboard/academy/cohorts/${n.metadata.cohortId}`
        : "/dashboard/academy/cohorts"
    case "cell_join_response":
    case "cell_join_request":
      return "/dashboard/cell-groups"
    default:
      return null
  }
}

function timeAgo(value: string): string {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ""
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export function NotificationsScreen() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = () =>
    apiClient
      .getNotifications()
      .then((r) => setNotifications(r.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setIsLoading(false))

  useEffect(() => {
    load()
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const open = async (n: Notification) => {
    // Optimistic: flip to read locally, persist, then follow any deep link.
    if (!n.isRead) {
      setNotifications((list) =>
        list.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      )
      apiClient.markNotificationRead(n.id).catch(() => undefined)
    }
    const href = linkFor(n)
    if (href) router.push(href)
  }

  const markAll = async () => {
    setNotifications((list) => list.map((item) => ({ ...item, isRead: true })))
    try {
      await apiClient.markAllNotificationsRead()
    } catch {
      toast.error("Could not mark all as read")
      load()
    }
  }

  const remove = async (id: string) => {
    const previous = notifications
    setNotifications((list) => list.filter((item) => item.id !== id))
    try {
      await apiClient.deleteNotification(id)
    } catch {
      toast.error("Could not delete")
      setNotifications(previous)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        <Link href="/dashboard" className="transition-colors hover:text-[#1A3A6E]">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#1A3A6E]">Notifications</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a5c1fe]/30">
            <Bell className="h-5 w-5 text-[#415e94]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0a1f44]">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading your notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No notifications yet</p>
          <p className="mt-1 text-xs text-gray-400">
            We'll let you know when an academy opens or there's news for you.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const href = linkFor(n)
            return (
              <li
                key={n.id}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  n.isRead
                    ? "border-gray-100 bg-white"
                    : "border-[#a5c1fe]/40 bg-[#a5c1fe]/10"
                }`}
              >
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#3c6eea]" />
                )}
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`min-w-0 flex-1 text-left ${href ? "cursor-pointer" : "cursor-default"}`}
                >
                  <p className="text-sm font-semibold text-[#00081e]">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  aria-label="Delete notification"
                  className="flex-shrink-0 rounded-full p-1.5 text-gray-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
