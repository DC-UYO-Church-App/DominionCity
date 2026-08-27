"use client"

/* ============================================================================
   MEMBER HOME — "the order of service"
   ----------------------------------------------------------------------------
   The page is arranged the way a bulletin is, and in the order a member
   actually needs it:

     1. Where we are        — the date and a greeting, set on the page itself.
     2. What is next        — the one deep panel on the page. Church Center and
                              Planning Center both hang their whole product on
                              this; so does this screen.
     3. Your rhythm         — honest figures, hairline-divided, no growth arrows.
                              A member's attendance is pastoral information, not
                              a KPI, so it is never dressed as one.
     4. Your people         — cell group and the project the church is building.
     5. Keep growing        — events and sermons, the reward at the bottom.

   What was removed and why: a fabricated notifications feed (four hardcoded
   items), an invented "+5.2%" trend and a hardcoded "04 unread messages". None
   were connected to anything. Real notifications live behind the top-bar bell.

   Data paths are unchanged from the previous screen except for two fixes noted
   at `unwrapStats` — the stats endpoints were being read one level too high.
   ========================================================================== */

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  ExternalLink,
  HandCoins,
  Loader2,
  MapPin,
  Navigation,
  Play,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { apiClient } from "@/lib/api"

const IMG_WORSHIP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDyeWBD5jFAi-dIGpQVwI_axFPYAkEBadgazc2jxnKannDimv2BOBBAIROassyuo4DmvE5U5wnERbJfKyLfJxbEd1tAriIjmR3-X4KzROh1oA9dyrggFM6xv_T6k_T0ifwX8AnVz3r-z-kyw4QvvgeZeeuR8OQMeSJ7pMvAoOGMrTBIGPzTQJRP6wEQWrvRNFuYQuzY5uFdZhNeDiOj2jKQi-o_Xx4aZ3kzLzVGU6loKTqTIX22SZzrxiQQtaMaMnjXNV8NjqofJg"
const IMG_LEADERSHIP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-lLWudXBvwPJWwnWZHIUzjPD1Gurz5i9gX25MH9GpULaCRdZATwPaZeheBFNlCWADfcHcWV4sbaRuK015uROfqFLlVSMRwn62s5Zd8bBdh8KTltLa3xT9hvi1ggV1AVdvhoEPmuwOiviT06xu5zLsOeGBjFB2AfqyZrah9j2h0pRfySVyitOooWrPlUhKujOUmZyhE_P2nLeHIRhPjCEayFlxRsURsUnDiYfrE1QV94a0M8ptjivM-pFEj9v0fZsxN4ZZey3VvQ"
const IMG_COMMUNITY =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpHaroF2BnDeuXUG4dKQTPHp-Zrya9UyM5M8wnZUSCc4e6m9abz5ZkTzLG9PoB7qgx4hslDkeUBMZogGf-S6VBw9g6s39c48oDkImhkORdHs7dTBacVA226FnKV2RGQVAK2pXvmTorNcpeEoSivpvSOmLTJmDXZqxst_TQ0xsQZyRY-18xqGCmXrTKoaUdEV8AxOScrL_fBN2VUorumyAH9AL7o3G9tW_V-TV217YjxJ9VQehM7eeaGWQLt0h3p3WYTXLwyMVaIA"

/* The stats endpoints answer `{ stats: {...} }`. The old screen stored the
   envelope and then read `.attendanceRate` — a field the API has never sent
   (it sends `percentage`) — so both figures rendered "—" whatever the record
   said. Unwrap once, here, and use the real field names. */
const unwrapStats = (res: any) => res?.stats ?? res ?? null

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

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
  const [userCellGroupId, setUserCellGroupId] = useState<string | null>(null)
  const [myJoinRequest, setMyJoinRequest] = useState<any>(null)
  const [joiningCellId, setJoiningCellId] = useState<string | null>(null)
  const [featuredProject, setFeaturedProject] = useState<any>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const today = new Date()
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  /* The weekly services are synthesised rather than fetched, so they carry the
     start times published on the public site (data/site.ts). Zeroing the clock
     here is what used to make every Sunday announce itself as "12:00 AM". */
  const getNextWeekday = (weekday: number, hour: number, minute = 0) => {
    const now = new Date()
    const daysAhead = (weekday + 7 - now.getDay()) % 7 || 7
    const next = new Date(now)
    next.setDate(now.getDate() + daysAhead)
    next.setHours(hour, minute, 0, 0)
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
          apiClient.getAttendanceStats(user.id).then((r) => setAttendanceStats(unwrapStats(r))).catch(() => {})
          apiClient.getTitheStats(user.id).then((r) => setTitheStats(unwrapStats(r))).catch(() => {})
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
          {
            id: "weekly-sunday",
            title: "Sunday Service",
            location: "Dominion City Uyo HQ",
            eventDate: getNextWeekday(0, 8),
            cover: IMG_WORSHIP,
          },
          {
            id: "weekly-wednesday",
            title: "Word & Prayer",
            location: "Dominion City Uyo HQ",
            eventDate: getNextWeekday(3, 17, 30),
            cover: IMG_LEADERSHIP,
          },
        ]

        setUpcomingEvents(
          [...fixed, ...events]
            .filter((e) => e.eventDate && e.eventDate >= now)
            .sort((a, b) => a.eventDate - b.eventDate)
            .slice(0, 6),
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
          const res = await apiClient.getNearestCellGroups(pos.coords.latitude, pos.coords.longitude, 6)
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

  /* ---- Derived figures — every one of them from a real record ---- */
  const attended = attendanceStats?.attended ?? null
  const totalServices = attendanceStats?.totalServices ?? null
  const attendancePct =
    typeof attendanceStats?.percentage === "number" ? Math.round(attendanceStats.percentage) : null
  const missed = attendanceStats?.consecutiveAbsences ?? 0

  const givenTotal = typeof titheStats?.totalAmount === "number" ? titheStats.totalAmount : null
  const giftCount = titheStats?.totalPayments ?? 0
  const lastGift = titheStats?.lastPaymentDate
    ? new Date(titheStats.lastPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null

  /* A cell meets on a named day; turn that into the actual next date so the
     card answers "when do I next see my people" rather than restating the rule. */
  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const cellDayIndex = cellGroup?.meetingDay ? DAYS.indexOf(String(cellGroup.meetingDay).toLowerCase()) : -1
  const nextCellMeeting =
    cellDayIndex >= 0
      ? (() => {
          const now = new Date()
          const ahead = (cellDayIndex + 7 - now.getDay()) % 7
          const next = new Date(now)
          next.setDate(now.getDate() + ahead)
          return next
        })()
      : null

  const nextUp = upcomingEvents[0] || null
  const daysAway = nextUp
    ? Math.round((new Date(nextUp.eventDate).setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000)
    : null
  const whenLabel = daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : nextUp
    ? new Date(nextUp.eventDate).toLocaleDateString("en-US", { weekday: "long" })
    : null

  return (
    <div>
      {/* ---- 1. Where we are ---- */}
      <header className="mb-[var(--space-lg)]">
        <p className="dash-label">{todayLabel}</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-[length:var(--step-3)] font-medium leading-[1.05] tracking-[-0.015em]">
          {getGreeting()}, {firstName}.
        </h2>
      </header>

      {/* ---- 2. What is next ---- */}
      <section className="dash-panel" aria-labelledby="next-h">
        <p className="dash-label">Next gathering</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-[var(--space-md)]">
          <div className="min-w-0">
            {nextUp ? (
              <>
                <p className="dash-figure">
                  {whenLabel}
                  <span className="dash-figure__unit !text-[var(--text-invert-soft)]">
                    {new Date(nextUp.eventDate).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                <h3 id="next-h" className="mt-2 text-[length:var(--step-1)] font-semibold">
                  {nextUp.title}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--text-invert-soft)]">
                  {nextUp.location || "Dominion City Uyo HQ"}
                </p>
              </>
            ) : (
              <>
                <p className="dash-figure">This Sunday</p>
                <h3 id="next-h" className="mt-2 text-[length:var(--step-1)] font-semibold">
                  {eventsLoading ? "Checking the calendar…" : "Sunday Service"}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--text-invert-soft)]">Dominion City Uyo HQ</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/attendance" className="dash-btn dash-btn--primary">
              <CheckSquare />
              Mark attendance
            </Link>
            <Link href="/dashboard/events" className="dash-btn dash-btn--ghost">
              All events
            </Link>
          </div>
        </div>
      </section>

      {/* ---- 3. Your rhythm ---- */}
      <div className="dash-section">
        <div className="dash-section__row">
          <div>
            <h3 className="dash-section__title">Your rhythm</h3>
            <p className="dash-section__note">Your own record, kept quietly.</p>
          </div>
        </div>
      </div>

      <div className="dash-strip">
        <div className="dash-stat">
          <p className="dash-label">Attendance</p>
          <p className="dash-figure dash-figure--sm">
            {attendancePct === null ? "—" : `${attendancePct}`}
            {attendancePct !== null && <span className="dash-figure__unit">%</span>}
          </p>
          <p className="dash-stat__foot">
            {attended !== null && totalServices
              ? `${attended} of ${totalServices} services`
              : "No record yet"}
          </p>
        </div>

        <div className="dash-stat">
          <p className="dash-label">Given to date</p>
          <p className="dash-figure dash-figure--sm">
            {givenTotal === null ? "—" : naira.format(givenTotal)}
          </p>
          <p className="dash-stat__foot">
            {lastGift ? `${giftCount} gifts · last ${lastGift}` : "No record yet"}
          </p>
        </div>

        <div className="dash-stat">
          <p className="dash-label">Cell group</p>
          <p className="dash-figure dash-figure--sm dash-figure--text">
            {cellGroup ? cellGroup.name : "—"}
          </p>
          <p className="dash-stat__foot">
            {cellGroup
              ? `${cellGroup.meetingDay}s · ${cellGroup.meetingTime}`
              : "Not joined yet"}
          </p>
        </div>

        <div className="dash-stat">
          <p className="dash-label">Coming up</p>
          <p className="dash-figure dash-figure--sm">
            {eventsLoading ? "—" : upcomingEvents.length}
          </p>
          <p className="dash-stat__foot">gatherings on the calendar</p>
        </div>
      </div>

      {/* A pastoral note, not a red alert — and only when the record says so. */}
      {missed >= 3 && (
        <p className="mt-3 flex items-start gap-2 rounded-[var(--dash-radius)] border border-[var(--line)] bg-[var(--dash-surface)] p-3 text-sm text-[var(--text-soft)]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
          <span>
            We&apos;ve missed you the last {missed} services — there is a seat with your name on it
            whenever you&apos;re ready.
          </span>
        </p>
      )}

      {/* ---- 4. Your people ---- */}
      <div className="dash-section">
        <div className="dash-section__row">
          <h3 className="dash-section__title">Your people</h3>
        </div>
      </div>

      <div className="grid gap-[var(--space-sm)] md:grid-cols-2">
        {/* Cell group */}
        <section className="dash-card flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="dash-label">{isLeaderOfCell ? "Cell you lead" : "My cell group"}</p>
              {cellGroup ? (
                <h4 className="mt-1.5 font-[family-name:var(--font-display)] text-[length:var(--step-1)] font-medium">
                  {cellGroup.name}
                </h4>
              ) : null}
            </div>
            {isLeaderOfCell && <span className="dash-badge dash-badge--gold">Leader</span>}
          </div>

          {cellGroup ? (
            <>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Meets {cellGroup.meetingDay}s at {cellGroup.meetingTime}
              </p>
              {cellGroup.address && (
                <p className="mt-1 truncate text-sm text-[var(--text-faint)]">{cellGroup.address}</p>
              )}
              {nextCellMeeting && (
                <p className="mt-4 flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                  <span>
                    Next meeting{" "}
                    <strong className="font-semibold">
                      {nextCellMeeting.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </strong>
                  </span>
                </p>
              )}
              <Link href="/dashboard/cell-groups" className="dash-section__link mt-auto pt-4">
                {isLeaderOfCell ? "Open my cell" : "View details"}
                <ArrowRight />
              </Link>
            </>
          ) : (
            <div className="dash-empty my-auto">
              <span className="dash-empty__icon">
                <Users className="h-5 w-5" />
              </span>
              <p className="dash-empty__title">You&apos;re not in a cell yet</p>
              <p className="dash-empty__note">
                Cells are where a big church becomes a small one. There is almost certainly one on
                your street.
              </p>
              <button onClick={findNearbyGroups} className="dash-btn dash-btn--primary mt-1">
                <Navigation />
                Find one near me
              </button>
            </div>
          )}
        </section>

        {/* Project the church is building */}
        {featuredProject ? (
          <section className="dash-card dash-card--flush flex flex-col overflow-hidden">
            <div className="dash-media h-36">
              {resolveImageUrl(featuredProject.imageUrl) ? (
                <img src={resolveImageUrl(featuredProject.imageUrl) as string} alt="" />
              ) : (
                <HandCoins className="dash-media__ph h-7 w-7" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-[var(--space-sm)]">
              <p className="dash-label">What we&apos;re building</p>
              <h4 className="mt-1.5 font-[family-name:var(--font-display)] text-[length:var(--step-1)] font-medium">
                {featuredProject.title}
              </h4>
              {featuredProject.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-soft)]">
                  {featuredProject.description}
                </p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-4">
                <Link href="/dashboard/giving" className="dash-btn dash-btn--ink">
                  <HandCoins />
                  Give
                </Link>
                <Link href="/dashboard/projects" className="dash-section__link">
                  All projects
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="dash-card flex flex-col justify-center">
            <div className="dash-empty">
              <span className="dash-empty__icon">
                <HandCoins className="h-5 w-5" />
              </span>
              <p className="dash-empty__title">Give to the work</p>
              <p className="dash-empty__note">
                Tithes and offerings, recorded and receipted — wherever you are.
              </p>
              <Link href="/dashboard/giving" className="dash-btn dash-btn--primary mt-1">
                Give now
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ---- 5. Keep growing: events ---- */}
      <div className="dash-section">
        <div className="dash-section__row">
          <h3 className="dash-section__title">On the calendar</h3>
          <Link href="/dashboard/events" className="dash-section__link">
            See all
            <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="dash-rail-x">
        {eventsLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="dash-skeleton h-56 rounded-[var(--dash-radius)]" />)
        ) : upcomingEvents.length === 0 ? (
          <div className="dash-card dash-empty w-full">
            <span className="dash-empty__icon">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="dash-empty__title">Nothing on the calendar yet</p>
            <p className="dash-empty__note">Sunday and midweek services carry on as always.</p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <Link
              key={event.id}
              href="/dashboard/events"
              className="dash-card dash-card--flush dash-card--link"
            >
              <div className="dash-media h-32">
                {event.cover ? (
                  <img src={event.cover} alt="" />
                ) : (
                  <img src={IMG_COMMUNITY} alt="" />
                )}
              </div>
              <div className="flex gap-3 p-[var(--space-sm)]">
                <span className="dash-date">
                  <span className="dash-date__m">
                    {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="dash-date__d">
                    {new Date(event.eventDate).getDate()}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold leading-snug">{event.title}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-[var(--text-soft)]">
                    <Clock className="h-3 w-3" />
                    {new Date(event.eventDate).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {event.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </span>
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ---- 5b. Keep growing: sermons ---- */}
      <div className="dash-section">
        <div className="dash-section__row">
          <h3 className="dash-section__title">Recent teaching</h3>
          <Link href="/dashboard/sermons" className="dash-section__link">
            The library
            <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-sm)] md:grid-cols-3">
        {sermonsLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="dash-skeleton aspect-[4/3] rounded-[var(--dash-radius)]" />
          ))
        ) : recentSermons.length === 0 ? (
          <div className="dash-card dash-empty col-span-full">
            <span className="dash-empty__icon">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="dash-empty__title">No sermons published yet</p>
            <p className="dash-empty__note">Sunday&apos;s teaching appears here once it is uploaded.</p>
          </div>
        ) : (
          recentSermons.map((sermon: any) => (
            <Link
              key={sermon.id}
              href="/dashboard/sermons"
              className="dash-card dash-card--flush dash-card--link group"
            >
              <div className="dash-media aspect-video">
                {sermon.thumbnail ? (
                  <img src={sermon.thumbnail} alt="" />
                ) : (
                  <BookOpen className="dash-media__ph h-7 w-7" />
                )}
                <span className="absolute inset-0 grid place-items-center bg-[rgba(14,19,48,0.45)] opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-9 w-9 fill-[var(--c-daybreak)] text-[var(--c-daybreak)]" />
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{sermon.title}</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  {sermon.sermonDate
                    ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : sermon.date ?? ""}
                  {sermon.preacher ? ` · ${sermon.preacher}` : ""}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ---- Nearby cell groups ---- */}
      {showNearbyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(14,19,48,0.55)] p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearby-h"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--dash-radius-lg)] bg-[var(--dash-surface)] sm:rounded-[var(--dash-radius-lg)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-[var(--space-sm)]">
              <div>
                <p className="dash-label">Cell groups</p>
                <h3
                  id="nearby-h"
                  className="mt-1 font-[family-name:var(--font-display)] text-[length:var(--step-1)] font-medium"
                >
                  Closest to you
                </h3>
              </div>
              <button
                onClick={() => setShowNearbyModal(false)}
                className="dash-icon-btn"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {nearbyLoading && (
                <div className="dash-empty py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-ink)]" />
                  <p className="dash-empty__note">Finding your location…</p>
                </div>
              )}

              {nearbyError && !nearbyLoading && (
                <div className="dash-empty py-12">
                  <span className="dash-empty__icon">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <p className="dash-empty__title">{nearbyError}</p>
                  <button onClick={findNearbyGroups} className="dash-btn mt-1">
                    Try again
                  </button>
                </div>
              )}

              {!nearbyLoading && !nearbyError && nearbyGroups.length === 0 && (
                <div className="dash-empty py-12">
                  <span className="dash-empty__icon">
                    <Users className="h-5 w-5" />
                  </span>
                  <p className="dash-empty__title">No cell groups found nearby</p>
                  <p className="dash-empty__note">
                    The church office can assign you to the closest group.
                  </p>
                </div>
              )}

              {!nearbyLoading && nearbyGroups.length > 0 && (
                <ul className="dash-list">
                  {nearbyGroups.map((group: any) => {
                    const distKm =
                      typeof group.distance === "number"
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
                      joinBtn = <span className="dash-badge">In a cell</span>
                    } else if (pendingThisCell) {
                      joinBtn = <span className="dash-badge dash-badge--gold">Request sent</span>
                    } else if (pendingOtherCell) {
                      joinBtn = <span className="dash-badge">Request pending</span>
                    } else {
                      joinBtn = (
                        <button
                          onClick={() => handleJoinCell(group.id)}
                          disabled={isJoiningThis}
                          className="dash-btn dash-btn--primary !min-h-0 !px-3 !py-1.5 !text-xs disabled:opacity-60"
                        >
                          {isJoiningThis && <Loader2 className="h-3 w-3 animate-spin" />}
                          Ask to join
                        </button>
                      )
                    }

                    return (
                      <li key={group.id}>
                        <div className="dash-row">
                          <span className="dash-row__icon">
                            <Users />
                          </span>
                          <span className="dash-row__body">
                            <span className="dash-row__title block">{group.name}</span>
                            <span className="dash-row__meta block">
                              {group.meetingDay}s · {group.meetingTime}
                              {distKm ? ` · ${distKm} away` : ""}
                            </span>
                            {group.address && (
                              <span className="dash-row__meta block truncate">{group.address}</span>
                            )}
                          </span>
                          <span className="flex flex-none flex-col items-end gap-1.5">
                            {joinBtn}
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[var(--text-soft)] hover:text-[var(--accent-ink)]"
                              >
                                Directions <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-[var(--line)] bg-[var(--dash-surface-2)] px-[var(--space-sm)] py-3">
              {myJoinRequest ? (
                <p className="text-center text-xs text-[var(--text-soft)]">
                  Your request to join &quot;{myJoinRequest.cellGroupName}&quot; is with the leader —
                  you&apos;ll be notified when they respond.
                </p>
              ) : userCellGroupId ? (
                <p className="text-center text-xs text-[var(--text-soft)]">
                  You already belong to a cell group.
                </p>
              ) : (
                <p className="text-center text-xs text-[var(--text-soft)]">
                  Asking to join sends a note to that cell&apos;s leader.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
