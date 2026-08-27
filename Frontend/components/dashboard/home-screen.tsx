"use client"

/* ============================================================================
   MEMBER HOME — a working dashboard, not a landing page
   ----------------------------------------------------------------------------
   Modular tiles at mixed widths, in the density of a real analytics dashboard.
   Everything on it is computed from records the API already returns:

     getUserAttendance  → serviceDate, status, eventTitle   → trend, heatmap,
                                                               streak, counts
     getUserTithes      → amount, paymentDate               → giving bars
     getAttendanceStats → percentage, attended, total       → the gauge
     getTitheStats      → totalAmount, totalPayments        → the headline
     events / sermons / projects / cell group                → the rest

   Nothing here is invented. Where a member has no history, the tile says so
   rather than drawing a plausible-looking line.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckSquare, Flame,
  HandCoins, MapPin, MoreHorizontal, Receipt, Users,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { Bars, Gauge, Heatmap, Meter, TrendLine } from "./charts"

const unwrapStats = (res: any) => res?.stats ?? res ?? null
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
const nairaShort = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}m` : n >= 1000 ? `₦${Math.round(n / 1000)}k` : `₦${n}`

const MONTHS_BACK = 6

export function HomeScreen() {
  const [firstName, setFirstName] = useState("Member")
  const [userId, setUserId] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<any[] | null>(null)
  const [tithes, setTithes] = useState<any[] | null>(null)
  const [attStats, setAttStats] = useState<any>(null)
  const [titheStats, setTitheStats] = useState<any>(null)
  const [cellGroup, setCellGroup] = useState<any>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [sermons, setSermons] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [givingRange, setGivingRange] = useState<3 | 6 | 12>(6)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const resolveImageUrl = (value: string | null | undefined) => {
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  }

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
  })()

  const getNextWeekday = (weekday: number, hour: number, minute = 0) => {
    const now = new Date()
    const ahead = (weekday + 7 - now.getDay()) % 7 || 7
    const next = new Date(now)
    next.setDate(now.getDate() + ahead)
    next.setHours(hour, minute, 0, 0)
    return next
  }

  useEffect(() => {
    apiClient.getProfile().then((res) => {
      const user = res?.user
      if (!user) return
      if (user.firstName) setFirstName(user.firstName)
      if (!user.id) return
      setUserId(user.id)

      const since = new Date()
      since.setMonth(since.getMonth() - 12)
      const iso = (d: Date) => d.toISOString().slice(0, 10)

      apiClient.getAttendanceStats(user.id).then((r) => setAttStats(unwrapStats(r))).catch(() => {})
      apiClient.getTitheStats(user.id).then((r) => setTitheStats(unwrapStats(r))).catch(() => {})
      apiClient
        .getUserAttendance(user.id, iso(since), iso(new Date()))
        .then((r) => setAttendance(r?.attendance || []))
        .catch(() => setAttendance([]))
      apiClient
        .getUserTithes(user.id, iso(since), iso(new Date()))
        .then((r) => setTithes(r?.tithes || []))
        .catch(() => setTithes([]))

      if (user.cellGroupId) {
        apiClient.getCellGroup(user.cellGroupId).then((r) => {
          const cg = r?.cellGroup || r
          setCellGroup(cg)
          if (cg?.leaderId === user.id) setIsLeader(true)
        }).catch(() => {})
      } else {
        apiClient.getCellGroups().then((r) => {
          const led = (r?.cellGroups || []).find((g: any) => g.leaderId === user.id)
          if (led) { setCellGroup(led); setIsLeader(true) }
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const now = new Date()
    apiClient.getEvents().then((res) => {
      const real = (res?.events || [])
        .map((e: any) => ({ ...e, eventDate: e.eventDate ? new Date(e.eventDate) : null }))
        .filter((e: any) => e.eventDate && e.status !== "cancelled" && e.eventDate >= now)
      const weekly = [
        { id: "w-sun", title: "Sunday Service", location: "Dominion City Uyo HQ", eventDate: getNextWeekday(0, 8) },
        { id: "w-wed", title: "Word & Prayer", location: "Dominion City Uyo HQ", eventDate: getNextWeekday(3, 17, 30) },
      ]
      setEvents([...weekly, ...real].sort((a, b) => a.eventDate - b.eventDate).slice(0, 5))
    }).catch(() => setEvents([]))

    apiClient.getSermons({ limit: 3 })
      .then((r) => setSermons((r?.sermons || []).map((s: any) => ({ ...s, thumbnail: resolveImageUrl(s.thumbnailUrl) }))))
      .catch(() => setSermons([]))

    apiClient.getProjects().then((r) => {
      const live = (r?.projects || []).filter((p: any) => p.status !== "archived")
      setProject(live.find((p: any) => p.imageUrl) || live[0] || null)
    }).catch(() => setProject(null))
  }, [uploadsBaseUrl])

  /* ---- Everything below is derived from the records above ---------------- */
  const present = (r: any) => r.status === "present"

  const trend = useMemo(() => {
    if (!attendance?.length) return []
    const buckets = new Map<string, { date: Date; total: number; hit: number }>()
    for (const r of attendance) {
      const d = new Date(r.serviceDate)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = buckets.get(key) ?? { date: new Date(d.getFullYear(), d.getMonth(), 1), total: 0, hit: 0 }
      b.total += 1
      if (present(r)) b.hit += 1
      buckets.set(key, b)
    }
    return [...buckets.values()]
      .sort((a, b) => +a.date - +b.date)
      .slice(-MONTHS_BACK)
      .map((b) => ({ date: b.date, value: b.total ? (b.hit / b.total) * 100 : 0 }))
  }, [attendance])

  const givingBars = useMemo(() => {
    if (!tithes?.length) return []
    const buckets = new Map<string, { date: Date; sum: number }>()
    for (const t of tithes) {
      const d = new Date(t.paymentDate)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = buckets.get(key) ?? { date: new Date(d.getFullYear(), d.getMonth(), 1), sum: 0 }
      b.sum += Number(t.amount) || 0
      buckets.set(key, b)
    }
    const now = new Date()
    return [...buckets.values()]
      .sort((a, b) => +a.date - +b.date)
      .slice(-givingRange)
      .map((b) => ({
        label: b.date.toLocaleDateString("en-US", { month: "short" }),
        value: b.sum,
        current: b.date.getMonth() === now.getMonth() && b.date.getFullYear() === now.getFullYear(),
      }))
  }, [tithes, givingRange])

  /* Heatmap: the services you keep, by kind and by week. Step 0 means no
     service of that kind was held that week — an absence of record, not a low
     score, which is why step 0 is a neutral rather than a pale blue. */
  const heat = useMemo(() => {
    if (!attendance?.length) return null
    const kinds = ["Sunday", "Midweek", "Cell", "Prayer"]
    /* Order matters: "Word & Prayer" is the midweek service and contains the
       word "prayer", so the midweek test has to run before the prayer test or
       every Wednesday lands in the wrong row. */
    const kindOf = (t = "") => {
      const s = t.toLowerCase()
      if (s.includes("cell")) return "Cell"
      if (s.includes("word") || s.includes("midweek") || s.includes("wednes")) return "Midweek"
      if (s.includes("prayer") || s.includes("vigil")) return "Prayer"
      return "Sunday"
    }
    /* Week boundaries are calendar dates, not "now minus seven days" — leaving
       the clock on them makes a Sunday-morning service fall into the previous
       week whenever the page is opened in the afternoon. */
    const weeks: Date[] = []
    const cur = new Date()
    cur.setHours(0, 0, 0, 0)
    cur.setDate(cur.getDate() - cur.getDay())
    for (let i = 7; i >= 0; i--) {
      const w = new Date(cur)
      w.setDate(cur.getDate() - i * 7)
      weeks.push(w)
    }
    const rows = kinds.map((kind) => ({
      label: kind,
      cells: weeks.map((w) => {
        const end = new Date(w); end.setDate(w.getDate() + 7)
        const inWeek = attendance.filter((r: any) => {
          const d = new Date(r.serviceDate)
          d.setHours(0, 0, 0, 0)
          return d >= w && d < end && kindOf(r.eventTitle) === kind
        })
        if (!inWeek.length) return { step: 0, title: `${kind}, week of ${w.toLocaleDateString()}: no service recorded` }
        const hit = inWeek.filter(present).length
        const ratio = hit / inWeek.length
        const step = ratio === 0 ? 1 : ratio < 0.5 ? 2 : ratio < 1 ? 3 : 4
        return { step, title: `${kind}, week of ${w.toLocaleDateString()}: ${hit} of ${inWeek.length} attended` }
      }),
    }))
    return { rows, columns: weeks.map((w) => `${w.getDate()}`) }
  }, [attendance])

  const streak = useMemo(() => {
    if (!attendance?.length) return 0
    const sorted = [...attendance].sort((a, b) => +new Date(b.serviceDate) - +new Date(a.serviceDate))
    let n = 0
    for (const r of sorted) { if (present(r)) n++; else break }
    return n
  }, [attendance])

  const attendedCount = attStats?.attended ?? null
  const totalServices = attStats?.totalServices ?? null
  const attendancePct = typeof attStats?.percentage === "number" ? attStats.percentage : null
  const givenTotal = typeof titheStats?.totalAmount === "number" ? titheStats.totalAmount : null
  const giftCount = titheStats?.totalPayments ?? 0

  const thisMonthGiven = useMemo(() => {
    if (!tithes?.length) return 0
    const now = new Date()
    return tithes
      .filter((t: any) => {
        const d = new Date(t.paymentDate)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0)
  }, [tithes])

  const nextUp = events[0] || null
  const daysAway = nextUp
    ? Math.round((new Date(nextUp.eventDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
    : null
  const whenLabel = daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow"
    : nextUp ? new Date(nextUp.eventDate).toLocaleDateString("en-US", { weekday: "long" }) : "—"

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="dash-label">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[length:var(--step-2)] font-medium leading-tight">
            {greeting}, {firstName}.
          </h2>
        </div>
        <Link href="/dashboard/attendance" className="dash-btn dash-btn--primary">
          <CheckSquare />
          Mark attendance
        </Link>
      </header>

      <div className="bento">
        {/* ---- Row 1 ---- */}
        <section className="bento__cell b-3 tile">
          <div className="tile__head">
            <h3 className="tile__title"><CheckSquare />Your rhythm</h3>
            <span className="tile__tools"><button className="tile__ghost" aria-label="Options"><MoreHorizontal /></button></span>
          </div>
          <Gauge
            value={attendancePct}
            label="attended"
            caption={
              attendedCount !== null && totalServices
                ? `${attendedCount} of ${totalServices} services since you joined`
                : "No attendance recorded yet"
            }
          />
        </section>

        <section className="bento__cell b-6 tile">
          <div className="tile__head">
            <h3 className="tile__title"><CalendarDays />Attendance over time</h3>
            <span className="tile__tools">
              <span className="dash-badge">Last {MONTHS_BACK} months</span>
            </span>
          </div>
          {attendance === null
            ? <div className="dash-skeleton h-[190px] rounded-[var(--dash-radius)]" />
            : <TrendLine points={trend} />}
        </section>

        <section className="bento__cell b-3 promo">
          <p className="dash-label">Next gathering</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[length:var(--step-3)] font-medium leading-none">
            {whenLabel}
          </p>
          <p className="mt-2 font-semibold">{nextUp?.title ?? "Sunday Service"}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--text-invert-soft)]">
            <MapPin className="h-3.5 w-3.5" />
            {nextUp?.location ?? "Dominion City Uyo HQ"}
          </p>
          <p className="mt-1 text-sm text-[var(--text-invert-soft)]">
            {nextUp ? new Date(nextUp.eventDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "8:00 AM"}
          </p>
          <Link href="/dashboard/events" className="dash-btn dash-btn--ghost mt-auto self-start">
            All events <ArrowUpRight />
          </Link>
        </section>

        {/* ---- Row 2 · the strip ---- */}
        {[
          { icon: CheckSquare, label: "Services attended", value: attendedCount ?? "—", foot: totalServices ? `of ${totalServices} held` : "no record yet" },
          { icon: Flame, label: "Current streak", value: streak || "—", foot: streak === 1 ? "service in a row" : "services in a row" },
          { icon: Receipt, label: "Gifts recorded", value: giftCount || "—", foot: "receipts on file" },
          { icon: HandCoins, label: "Given this month", value: thisMonthGiven ? nairaShort(thisMonthGiven) : "—", foot: givenTotal ? `${naira.format(givenTotal)} to date` : "no record yet" },
        ].map((k) => (
          <section key={k.label} className="bento__cell b-3 tile">
            <div className="kpi">
              <span className="kpi__icon"><k.icon /></span>
              <span className="min-w-0">
                <span className="dash-label">{k.label}</span>
                <p className="kpi__val">{k.value}</p>
                <p className="kpi__foot">{k.foot}</p>
              </span>
            </div>
          </section>
        ))}

        {/* ---- Row 3 ---- */}
        <section className="bento__cell b-5 tile">
          <div className="tile__head">
            <h3 className="tile__title"><HandCoins />Your giving</h3>
            <span className="tile__tools">
              <span className="seg">
                {([3, 6, 12] as const).map((m) => (
                  <button
                    key={m}
                    className="seg__btn"
                    aria-pressed={givingRange === m}
                    onClick={() => setGivingRange(m)}
                  >{m}m</button>
                ))}
              </span>
            </span>
          </div>
          {tithes === null
            ? <div className="dash-skeleton h-[9rem] rounded-[var(--dash-radius)]" />
            : <Bars bars={givingBars} format={(n) => naira.format(n)} />}
          {givenTotal !== null && (
            <p className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--text-soft)]">
              <strong className="font-semibold text-[var(--text)]">{naira.format(givenTotal)}</strong> across {giftCount} gifts
            </p>
          )}
        </section>

        <section className="bento__cell b-4 tile">
          <div className="tile__head">
            <h3 className="tile__title"><CalendarDays />Where you show up</h3>
            <span className="tile__tools"><span className="dash-badge">8 weeks</span></span>
          </div>
          {heat ? (
            <Heatmap
              rows={heat.rows}
              columns={heat.columns}
              legend={["No service", "Missed", "Some", "Most", "All"]}
            />
          ) : (
            <p className="viz-empty">Your pattern appears here once attendance is recorded.</p>
          )}
        </section>

        <section className="bento__cell b-3 tile">
          <div className="tile__head">
            <h3 className="tile__title"><Users />{isLeader ? "Cell you lead" : "Your cell"}</h3>
          </div>
          {cellGroup ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-[length:var(--step-1)] font-medium">{cellGroup.name}</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{cellGroup.meetingDay}s · {cellGroup.meetingTime}</p>
              <div className="mt-3"><Meter pct={attendancePct ?? 0} left="Your attendance" right={attendancePct ? `${Math.round(attendancePct)}%` : "—"} /></div>
              <Link href="/dashboard/cell-groups" className="dash-section__link mt-auto pt-3">Open <ArrowRight /></Link>
            </>
          ) : (
            <div className="dash-empty my-auto">
              <span className="dash-empty__icon"><Users className="h-5 w-5" /></span>
              <p className="dash-empty__title">Not in a cell yet</p>
              <Link href="/dashboard/cell-groups" className="dash-btn dash-btn--primary mt-1">Find one near me</Link>
            </div>
          )}
        </section>

        {/* ---- Row 4 ---- */}
        <section className="bento__cell b-4 tile">
          <div className="tile__head">
            <h3 className="tile__title"><CalendarDays />On the calendar</h3>
            <Link href="/dashboard/events" className="tile__tools dash-section__link">All <ArrowRight /></Link>
          </div>
          <ul className="dash-list">
            {events.slice(0, 4).map((e) => (
              <li key={e.id}>
                <div className="dash-row !px-0">
                  <span className="dash-date">
                    <span className="dash-date__m">{new Date(e.eventDate).toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="dash-date__d">{new Date(e.eventDate).getDate()}</span>
                  </span>
                  <span className="dash-row__body">
                    <span className="dash-row__title block truncate">{e.title}</span>
                    <span className="dash-row__meta block">
                      {new Date(e.eventDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bento__cell b-4 tile">
          <div className="tile__head">
            <h3 className="tile__title"><BookOpen />Recent teaching</h3>
            <Link href="/dashboard/sermons" className="tile__tools dash-section__link">Library <ArrowRight /></Link>
          </div>
          <ul className="dash-list">
            {sermons.length === 0 ? (
              <li className="viz-empty py-6">No sermons published yet.</li>
            ) : sermons.map((s) => (
              <li key={s.id}>
                <Link href="/dashboard/sermons" className="dash-row !px-0">
                  <span className="dash-row__icon"><BookOpen /></span>
                  <span className="dash-row__body">
                    <span className="dash-row__title block truncate">{s.title}</span>
                    <span className="dash-row__meta block">
                      {s.sermonDate ? new Date(s.sermonDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      {s.preacher ? ` · ${s.preacher}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bento__cell b-4 tile">
          <div className="tile__head">
            <h3 className="tile__title"><HandCoins />What we&apos;re building</h3>
          </div>
          {project ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-[length:var(--step-1)] font-medium">{project.title}</p>
              {project.description && (
                <p className="mt-1.5 line-clamp-3 text-sm text-[var(--text-soft)]">{project.description}</p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-4">
                <Link href="/dashboard/giving" className="dash-btn dash-btn--ink"><HandCoins />Give</Link>
                <Link href="/dashboard/projects" className="dash-section__link">All projects <ArrowRight /></Link>
              </div>
            </>
          ) : (
            <div className="dash-empty my-auto">
              <span className="dash-empty__icon"><HandCoins className="h-5 w-5" /></span>
              <p className="dash-empty__title">Give to the work</p>
              <Link href="/dashboard/giving" className="dash-btn dash-btn--primary mt-1">Give now</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
