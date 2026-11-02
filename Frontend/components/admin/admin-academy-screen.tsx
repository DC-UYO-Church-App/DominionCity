"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AdminLayout } from "@/components/admin/admin-layout"
import { apiClient } from "@/lib/api"
import {
  Award,
  GraduationCap,
  Layers,
  Loader2,
  Users2,
} from "lucide-react"

type FunnelRow = {
  trackId: string
  name: string
  completed: number
  inProgress: number
  cohorts: number
}
type Totals = {
  tracks: number
  activeCohorts: number
  membersEnrolled: number
  completions: number
}
type Staff = { userId: string; firstName: string; lastName: string; staffRole: string }
type Cohort = {
  id: string
  trackName: string
  name: string
  startDate: string | null
  endDate: string | null
  status: string
  enrolledCount: number
  completedCount: number
  sessionCount: number
  staff: Staff[]
}

const ONGOING = new Set(["open", "running"])

const STATUS_STYLES: Record<string, string> = {
  planned: "bg-slate-100 text-slate-600",
  open: "bg-emerald-100 text-emerald-700",
  running: "bg-blue-100 text-blue-700",
  closed: "bg-slate-200 text-slate-500",
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export function AdminAcademyScreen() {
  const [funnel, setFunnel] = useState<FunnelRow[]>([])
  const [totals, setTotals] = useState<Totals>({
    tracks: 0,
    activeCohorts: 0,
    membersEnrolled: 0,
    completions: 0,
  })
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiClient.getAcademyOverview(), apiClient.getAcademyCohorts()])
      .then(([overview, cohortsRes]) => {
        setFunnel(overview.funnel || [])
        if (overview.totals) setTotals(overview.totals)
        setCohorts(cohortsRes.cohorts || [])
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load the academy")
      )
      .finally(() => setIsLoading(false))
  }, [])

  // The page is about what is happening now, so ongoing runs lead; everything
  // else is available through the academy area itself.
  const ongoing = useMemo(
    () => cohorts.filter((c) => ONGOING.has(c.status)),
    [cohorts]
  )

  // Scales the funnel bars against the busiest track so they read as a shape.
  const funnelMax = useMemo(
    () => Math.max(1, ...funnel.map((row) => row.completed + row.inProgress)),
    [funnel]
  )

  const stats = [
    { label: "Tracks", value: totals.tracks, icon: Layers },
    { label: "Active cohorts", value: totals.activeCohorts, icon: GraduationCap },
    { label: "Members enrolled", value: totals.membersEnrolled, icon: Users2 },
    { label: "Completions", value: totals.completions, icon: Award },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Academy</h1>
            <p className="text-sm text-slate-500">
              Discipleship tracks, the cohorts running now, and how members are moving through them.
            </p>
          </div>
          <Link
            href="/dashboard/academy"
            className="rounded-lg bg-[#3c6eea] px-4 py-2 text-sm font-medium text-white hover:bg-[#3360d4]"
          >
            Manage academy
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Loading the academy...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3c6eea]/10">
                      <stat.icon className="h-5 w-5 text-[#3c6eea]" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Ongoing cohorts */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">Ongoing cohorts</h2>
                    <span className="text-xs text-slate-400">{ongoing.length} running</span>
                  </div>
                  {ongoing.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-400">
                      No cohorts are open or running right now.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {ongoing.map((cohort) => (
                        <li key={cohort.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/academy/cohorts/${cohort.id}`}
                                className="font-medium text-slate-900 hover:text-[#3c6eea]"
                              >
                                {cohort.name}
                              </Link>
                              <p className="text-xs text-slate-500">{cohort.trackName}</p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                STATUS_STYLES[cohort.status] || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {cohort.status}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{cohort.enrolledCount} enrolled</span>
                            <span>{cohort.completedCount} completed</span>
                            <span>{cohort.sessionCount} sessions</span>
                            <span>
                              {formatDate(cohort.startDate)} – {formatDate(cohort.endDate)}
                            </span>
                          </div>
                          {cohort.staff.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400">
                              Led by{" "}
                              {cohort.staff
                                .map((s) => `${s.firstName} ${s.lastName}`.trim())
                                .join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Discipleship funnel */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">Discipleship funnel</h2>
                    <p className="text-xs text-slate-400">Members reached, per track</p>
                  </div>
                  {funnel.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-400">
                      No tracks have been set up yet.
                    </p>
                  ) : (
                    <ul className="space-y-4 px-5 py-4">
                      {funnel.map((row) => (
                        <li key={row.trackId}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{row.name}</span>
                            <span className="text-slate-400">
                              {row.completed} done · {row.inProgress} active
                            </span>
                          </div>
                          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="bg-[#3c6eea]"
                              style={{ width: `${(row.completed / funnelMax) * 100}%` }}
                            />
                            <div
                              className="bg-[#a5c1fe]"
                              style={{ width: `${(row.inProgress / funnelMax) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
