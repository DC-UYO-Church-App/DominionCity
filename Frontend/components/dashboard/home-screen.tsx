"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Bell,
  Calendar,
  Clock,
  Play,
  Users,
  TrendingUp,
  Mail,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  CreditCard,
  MapPin,
  Navigation,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { apiClient } from "@/lib/api"

const IMG_WORSHIP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDyeWBD5jFAi-dIGpQVwI_axFPYAkEBadgazc2jxnKannDimv2BOBBAIROassyuo4DmvE5U5wnERbJfKyLfJxbEd1tAriIjmR3-X4KzROh1oA9dyrggFM6xv_T6k_T0ifwX8AnVz3r-z-kyw4QvvgeZeeuR8OQMeSJ7pMvAoOGMrTBIGPzTQJRP6wEQWrvRNFuYQuzY5uFdZhNeDiOj2jKQi-o_Xx4aZ3kzLzVGU6loKTqTIX22SZzrxiQQtaMaMnjXNV8NjqofJg"
const IMG_LEADERSHIP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-lLWudXBvwPJWwnWZHIUzjPD1Gurz5i9gX25MH9GpULaCRdZATwPaZeheBFNlCWADfcHcWV4sbaRuK015uROfqFLlVSMRwn62s5Zd8bBdh8KTltLa3xT9hvi1ggV1AVdvhoEPmuwOiviT06xu5zLsOeGBjFB2AfqyZrah9j2h0pRfySVyitOooWrPlUhKujOUmZyhE_P2nLeHIRhPjCEayFlxRsURsUnDiYfrE1QV94a0M8ptjivM-pFEj9v0fZsxN4ZZey3VvQ"
const IMG_COMMUNITY =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpHaroF2BnDeuXUG4dKQTPHp-Zrya9UyM5M8wnZUSCc4e6m9abz5ZkTzLG9PoB7qgx4hslDkeUBMZogGf-S6VBw9g6s39c48oDkImhkORdHs7dTBacVA226FnKV2RGQVAK2pXvmTorNcpeEoSivpvSOmLTJmDXZqxst_TQ0xsQZyRY-18xqGCmXrTKoaUdEV8AxOScrL_fBN2VUorumyAH9AL7o3G9tW_V-TV217YjxJ9VQehM7eeaGWQLt0h3p3WYTXLwyMVaIA"

export function HomeScreen() {
  const [firstName, setFirstName] = useState("Member")
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [recentSermons, setRecentSermons] = useState<any[]>([])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [titheStats, setTitheStats] = useState<any>(null)
  const [cellGroup, setCellGroup] = useState<any>(null)
  const [isLeaderOfCell, setIsLeaderOfCell] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [sermonsLoading, setSermonsLoading] = useState(true)
  const [showNearbyModal, setShowNearbyModal] = useState(false)
  const [nearbyGroups, setNearbyGroups] = useState<any[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userCellGroupId, setUserCellGroupId] = useState<string | null>(null)
  const [myJoinRequest, setMyJoinRequest] = useState<any>(null)
  const [joiningCellId, setJoiningCellId] = useState<string | null>(null)
  const [featuredProject, setFeaturedProject] = useState<any>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  const getNextWeekday = (weekday: number) => {
    const today = new Date()
    const daysAhead = (weekday + 7 - today.getDay()) % 7 || 7
    const next = new Date(today)
    next.setDate(today.getDate() + daysAhead)
    next.setHours(0, 0, 0, 0)
    return next
  }

  const resolveImageUrl = (value: string | null | undefined) => {
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  }

  useEffect(() => {
    apiClient
      .getProfile()
      .then((res) => {
        const user = res?.user
        if (!user) return
        if (user.firstName) setFirstName(user.firstName)
        if (user.id) {
          setCurrentUserId(user.id)
          apiClient.getAttendanceStats(user.id).then(setAttendanceStats).catch(() => {})
          apiClient.getTitheStats(user.id).then(setTitheStats).catch(() => {})
          apiClient.getMyJoinRequest().then((r) => setMyJoinRequest(r?.joinRequest ?? null)).catch(() => {})
        }
        if (user.cellGroupId) {
          setUserCellGroupId(user.cellGroupId)
          apiClient
            .getCellGroup(user.cellGroupId)
            .then((r) => {
              const cg = r?.cellGroup || r
              setCellGroup(cg)
              if (cg?.leaderId === user.id) setIsLeaderOfCell(true)
            })
            .catch(() => {})
        } else {
          // User has no assigned cell group — check if they lead one
          apiClient
            .getCellGroups()
            .then((r) => {
              const groups: any[] = r?.cellGroups || []
              const led = groups.find((g) => g.leaderId === user.id)
              if (led) {
                setCellGroup(led)
                setIsLeaderOfCell(true)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const now = new Date()
    apiClient
      .getEvents()
      .then((res) => {
        const events = (res?.events || [])
          .map((e: any) => ({
            ...e,
            eventDate: e.eventDate ? new Date(e.eventDate) : null,
            cover: resolveImageUrl(e.imageUrl),
          }))
          .filter((e: any) => e.eventDate && e.status !== "cancelled" && e.eventDate >= now)
          .sort((a: any, b: any) => a.eventDate - b.eventDate)

        const fixed = [
          { id: "weekly-sunday", title: "Sunday Service", eventDate: getNextWeekday(0), cover: IMG_WORSHIP },
          { id: "weekly-wednesday", title: "Midweek Service", eventDate: getNextWeekday(3), cover: IMG_LEADERSHIP },
        ]

        setUpcomingEvents(
          [...fixed, ...events]
            .filter((e) => e.eventDate && e.eventDate >= now)
            .sort((a, b) => a.eventDate - b.eventDate)
            .slice(0, 4),
        )
      })
      .catch(() => setUpcomingEvents([]))
      .finally(() => setEventsLoading(false))
  }, [uploadsBaseUrl])

  useEffect(() => {
    apiClient
      .getSermons({ limit: 3 })
      .then((res) => {
        setRecentSermons(
          (res?.sermons || []).map((s: any) => ({
            ...s,
            thumbnail: resolveImageUrl(s.thumbnailUrl),
          })),
        )
      })
      .catch((err) => {
        console.error("Failed to load sermons:", err?.message || err)
        setRecentSermons([])
      })
      .finally(() => setSermonsLoading(false))
  }, [uploadsBaseUrl])

  useEffect(() => {
    apiClient
      .getProjects()
      .then((res) => {
        const projects = (res?.projects || []).filter((p: any) => p.status !== "archived")
        // Prefer a project with a cover image, otherwise fall back to the first
        const withImage = projects.find((p: any) => p.imageUrl)
        setFeaturedProject(withImage || projects[0] || null)
      })
      .catch(() => setFeaturedProject(null))
  }, [])

  const findNearbyGroups = () => {
    setShowNearbyModal(true)
    setNearbyGroups([])
    setNearbyError(null)
    setNearbyLoading(true)

    if (!navigator.geolocation) {
      setNearbyError("Your browser does not support location access.")
      setNearbyLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await apiClient.getNearestCellGroups(
            pos.coords.latitude,
            pos.coords.longitude,
            6,
          )
          setNearbyGroups(res?.cellGroups || res || [])
        } catch {
          setNearbyError("Could not load nearby cell groups. Please try again.")
        } finally {
          setNearbyLoading(false)
        }
      },
      () => {
        setNearbyError("Location access was denied. Please allow location permission and try again.")
        setNearbyLoading(false)
      },
      { timeout: 10000 },
    )
  }

  const handleJoinCell = async (cellGroupId: string) => {
    setJoiningCellId(cellGroupId)
    try {
      const res = await apiClient.sendCellJoinRequest(cellGroupId)
      setMyJoinRequest(res?.joinRequest ?? null)
    } catch (err: any) {
      // Show the server error briefly via nearbyError so the user sees it
      setNearbyError(err?.message || "Failed to send join request. Please try again.")
      setTimeout(() => setNearbyError(null), 4000)
    } finally {
      setJoiningCellId(null)
    }
  }

  const attendanceRate = attendanceStats?.attendanceRate
    ? `${Math.round(attendanceStats.attendanceRate)}%`
    : "—"

  const lastTitheDate = titheStats?.lastPaymentDate
    ? new Date(titheStats.lastPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "No record"

  const titheStatus = titheStats?.lastPaymentDate ? "Active" : "Inactive"

  const staticNotifications = [
    {
      id: 1,
      Icon: CheckCircle2,
      color: "bg-blue-100 text-blue-600",
      title: "Attendance Recorded",
      message: "Your attendance for Sunday Service has been marked.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      Icon: CreditCard,
      color: "bg-green-100 text-green-600",
      title: "Tithe Reminder",
      message: "This week's tithe reminder — don't forget to give.",
      time: "Yesterday",
      unread: true,
    },
    {
      id: 3,
      Icon: Calendar,
      color: "bg-amber-100 text-amber-600",
      title: "Upcoming Event",
      message: "Friday Night Fire starts in 2 days. See you there!",
      time: "2 days ago",
      unread: false,
    },
    {
      id: 4,
      Icon: Bell,
      color: "bg-[#1A3A6E]/10 text-[#1A3A6E]",
      title: "General Announcement",
      message: "New building project updates — check the notice board.",
      time: "3 days ago",
      unread: false,
    },
  ]

  const sermonsToShow = recentSermons

  return (
    <div className="space-y-6 pb-28">
      {/* Welcome Banner */}
      <section className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg min-h-[140px]">
        <img
          src="/dark.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A3A6E]/80 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[11px] uppercase tracking-widest opacity-70 mb-1 font-semibold">{todayLabel}</p>
          <h2 className="text-2xl font-bold mb-1">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-sm opacity-80 max-w-[260px] leading-relaxed">
            Welcome back to Dominion City Uyo. Here's what's happening today.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            Icon: CheckCircle2,
            label: "Attendance Rate",
            value: attendanceRate,
            sub: "+5.2%",
            subColor: "text-green-600",
            SubIcon: TrendingUp,
          },
          {
            Icon: CreditCard,
            label: "Tithe Status",
            value: titheStatus,
            sub: `Last: ${lastTitheDate}`,
            subColor: "text-gray-400",
            SubIcon: null,
          },
          {
            Icon: Calendar,
            label: "Upcoming Events",
            value: eventsLoading ? "—" : String(upcomingEvents.length),
            sub: "This month",
            subColor: "text-gray-400",
            SubIcon: null,
          },
          {
            Icon: Mail,
            label: "Unread Messages",
            value: "04",
            sub: "Needs attention",
            subColor: "text-red-500",
            SubIcon: null,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center text-center"
          >
            <div className="w-9 h-9 rounded-full bg-[#1A3A6E]/10 flex items-center justify-center mb-2">
              <stat.Icon className="h-4 w-4 text-[#1A3A6E]" />
            </div>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
              {stat.label}
            </p>
            <p className="text-lg font-bold text-[#1A3A6E] mt-1 leading-none">{stat.value}</p>
            <span className={`text-[10px] mt-1.5 font-medium flex items-center gap-0.5 ${stat.subColor}`}>
              {stat.SubIcon && <stat.SubIcon className="h-3 w-3" />}
              {stat.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Cell Group + Ongoing Project + Upcoming Events in one line */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

        {/* My Cell Group */}
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#1A3A6E]">
              {isLeaderOfCell ? "My Cell (Leader)" : "My Cell Group"}
            </h3>
            <Users className="h-5 w-5 text-[#1A3A6E]/40" />
          </div>
          {cellGroup ? (
            <>
              {isLeaderOfCell && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-2">
                  You are the leader
                </span>
              )}
              <p className="font-bold text-gray-800">{cellGroup.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                Meeting: {cellGroup.meetingDay}s @ {cellGroup.meetingTime}
              </p>
              {cellGroup.address && (
                <p className="text-xs text-gray-400 mt-1 truncate">{cellGroup.address}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No active cell group yet</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Find and join a cell group closer to you.
              </p>
            </div>
          )}
          {cellGroup ? (
            <Link
              href="/dashboard/cell-groups"
              className="mt-4 text-[#1E5EC8] text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              {isLeaderOfCell ? "View My Cell" : "View Details"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={findNearbyGroups}
              className="mt-4 text-[#1E5EC8] text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              <Navigation className="h-4 w-4" />
              Find a Cell Group Near Me
            </button>
          )}
        </div>

        {/* Ongoing Project */}
        {featuredProject && (
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
            <div className="h-32 bg-[#1A3A6E]/10">
              {resolveImageUrl(featuredProject.imageUrl) ? (
                <img
                  src={resolveImageUrl(featuredProject.imageUrl) as string}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-[#1A3A6E]/25" />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1A3A6E]">Ongoing Project</h3>
                <Link
                  href="/dashboard/projects"
                  className="text-[#1E5EC8] text-sm font-semibold flex items-center gap-1 hover:underline"
                >
                  See More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-2 font-bold text-gray-800">{featuredProject.title}</p>
              {featuredProject.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {featuredProject.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1A3A6E]">Upcoming Events</h3>
          <Link href="/dashboard/events" className="text-[#1E5EC8] text-sm font-semibold hover:underline">
            See All
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {eventsLoading ? (
            <>
              <div className="min-w-[260px] flex-shrink-0 bg-white rounded-xl h-52 animate-pulse border border-gray-100" />
              <div className="min-w-[260px] flex-shrink-0 bg-white rounded-xl h-52 animate-pulse border border-gray-100" />
            </>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming events.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="min-w-[260px] flex-shrink-0 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-all"
              >
                <div className="h-32 bg-[#1A3A6E]/10 relative">
                  {event.cover ? (
                    <img
                      src={event.cover}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img src={IMG_COMMUNITY} alt={event.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-[#1A3A6E] shadow-sm">
                    {event.eventDate
                      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      .toUpperCase()}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight">{event.title}</h4>
                  {event.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
                  )}
                  <div className="flex items-center text-xs text-gray-400 mt-2.5 gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {event.eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                    {event.location && (
                      <>
                        <span className="mx-1">·</span>
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Recent Sermons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1A3A6E]">Recent Sermons</h3>
          <Link href="/dashboard/sermons" className="text-[#1E5EC8] text-sm font-semibold hover:underline">
            View Library
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sermonsLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse">
                  <div className="aspect-video bg-gray-100 rounded-t-xl" />
                  <div className="p-2 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                  </div>
                </div>
              ))
            : sermonsToShow.length === 0
            ? (
                <div className="col-span-3 py-8 text-center text-sm text-gray-400">
                  No sermons available yet.
                </div>
              )
            : sermonsToShow.map((sermon: any) => (
                <Link
                  key={sermon.id}
                  href="/dashboard/sermons"
                  className="bg-white p-2 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 group block"
                >
                  <div className="aspect-video bg-[#1A3A6E]/10 rounded-lg overflow-hidden relative mb-2">
                    {sermon.thumbnail ? (
                      <img
                        src={sermon.thumbnail}
                        alt={sermon.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-[#1A3A6E]/25" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1 px-1 leading-snug">
                    {sermon.title}
                  </p>
                  <p className="text-[10px] text-gray-400 px-1 mt-0.5">
                    {sermon.sermonDate
                      ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : sermon.date ?? ""}{" "}
                    · {sermon.preacher}
                  </p>
                </Link>
              ))}
        </div>
      </div>

      {/* Notifications Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1A3A6E]">Notifications</h3>
          <Link href="/dashboard/notifications" className="text-[#1E5EC8] text-sm font-semibold hover:underline">
            See All
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {staticNotifications.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}
              >
                <item.Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
              </div>
              {item.unread && <span className="w-2 h-2 bg-[#1E5EC8] rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-3 bg-gray-50 text-[#1A3A6E] text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
          View All Notifications
        </button>
      </div>

      {/* ── Nearby Cell Groups Modal ─────────────────────────────────────── */}
      {showNearbyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNearbyModal(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1A3A6E]/10 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-[#1A3A6E]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1F44] text-base">Cell Groups Near You</h3>
                  <p className="text-[11px] text-gray-400">Sorted by distance</p>
                </div>
              </div>
              <button
                onClick={() => setShowNearbyModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {nearbyLoading && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-[#1A3A6E]" />
                  <p className="text-sm text-gray-500">Getting your location…</p>
                </div>
              )}

              {nearbyError && !nearbyLoading && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{nearbyError}</p>
                  <button
                    onClick={findNearbyGroups}
                    className="text-sm text-[#1E5EC8] font-semibold hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!nearbyLoading && !nearbyError && nearbyGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No cell groups found nearby</p>
                  <p className="text-xs text-gray-400">Contact the church office to be assigned to a group.</p>
                </div>
              )}

              {!nearbyLoading && nearbyGroups.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {nearbyGroups.map((group: any) => {
                    const distKm = typeof group.distance === "number"
                      ? group.distance < 1
                        ? `${Math.round(group.distance * 1000)} m`
                        : `${group.distance.toFixed(1)} km`
                      : null
                    const mapsUrl = group.address
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.address)}`
                      : null

                    const alreadyInCell = !!userCellGroupId
                    const pendingThisCell = myJoinRequest?.cellGroupId === group.id
                    const pendingOtherCell = !!myJoinRequest && myJoinRequest.cellGroupId !== group.id
                    const isJoiningThis = joiningCellId === group.id

                    let joinBtn: React.ReactNode
                    if (alreadyInCell) {
                      joinBtn = (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          In a cell
                        </span>
                      )
                    } else if (pendingThisCell) {
                      joinBtn = (
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          Request sent
                        </span>
                      )
                    } else if (pendingOtherCell) {
                      joinBtn = (
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                          Request pending
                        </span>
                      )
                    } else {
                      joinBtn = (
                        <button
                          onClick={() => handleJoinCell(group.id)}
                          disabled={isJoiningThis}
                          className="text-[11px] font-bold text-white bg-[#1E5EC8] hover:bg-[#1A3A6E] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors disabled:opacity-60 flex items-center gap-1"
                        >
                          {isJoiningThis && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          Join Cell
                        </button>
                      )
                    }

                    return (
                      <li key={group.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#1A3A6E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Users className="h-4 w-4 text-[#1A3A6E]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#0A1F44] text-sm">{group.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {group.meetingDay}s @ {group.meetingTime}
                              </p>
                              {group.address && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{group.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {distKm && (
                              <span className="text-[11px] font-bold text-[#1E5EC8] bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {distKm} away
                              </span>
                            )}
                            {joinBtn}
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-gray-400 hover:text-[#1E5EC8] flex items-center gap-0.5 transition-colors"
                              >
                                Directions <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              {myJoinRequest ? (
                <p className="text-[11px] text-amber-600 text-center font-medium">
                  Your request to join &quot;{myJoinRequest.cellGroupName}&quot; is pending. You&apos;ll be notified when the leader responds.
                </p>
              ) : userCellGroupId ? (
                <p className="text-[11px] text-emerald-600 text-center font-medium">
                  You are already a member of a cell group.
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 text-center">
                  Tap &quot;Join Cell&quot; to send a request to the cell leader.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
