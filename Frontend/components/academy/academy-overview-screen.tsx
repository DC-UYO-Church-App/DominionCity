"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AcademyLayout } from "./academy-layout"
import { apiClient } from "@/lib/api"
import { GraduationCap, Layers, Loader2, Users2, Award } from "lucide-react"

type FunnelRow = { trackId: string; name: string; completed: number; inProgress: number; cohorts: number }
type Totals = { tracks: number; activeCohorts: number; membersEnrolled: number; completions: number }

export function AcademyOverviewScreen() {
  const router = useRouter()
  const [funnel, setFunnel] = useState<FunnelRow[]>([])
  const [totals, setTotals] = useState<Totals>({
    tracks: 0,
    activeCohorts: 0,
    membersEnrolled: 0,
    completions: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .getAcademyOverview()
      .then((response) => {
        setFunnel(response.funnel || [])
        setTotals(response.totals || totals)
        setIsLoading(false)
      })
      .catch((err) => {
        /* The overview belongs to the academy admin. A coordinator who lands
           here by URL is sent to the cohorts they actually run rather than
           shown a permission error for a page they never asked for. */
        if (err && typeof err === "object" && "status" in err && err.status === 403) {
          router.replace("/dashboard/academy/cohorts")
          return
        }
        setError(err instanceof Error ? err.message : "Failed to load the overview")
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The widest bar sets the scale, so a young academy still reads clearly.
  const peak = Math.max(1, ...funnel.map((row) => row.completed + row.inProgress))

  const cards = [
    { label: "Tracks", value: totals.tracks, icon: Layers, tone: "bg-indigo-100 text-indigo-600" },
    { label: "Active cohorts", value: totals.activeCohorts, icon: Users2, tone: "bg-amber-100 text-amber-600" },
    { label: "Members enrolled", value: totals.membersEnrolled, icon: GraduationCap, tone: "bg-emerald-100 text-emerald-600" },
    { label: "Completions", value: totals.completions, icon: Award, tone: "bg-rose-100 text-rose-600" },
  ]

  return (
    <AcademyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Academy overview</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            How far the congregation has moved through the discipleship tracks
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        ) : error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {cards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <p className="text-2xl font-bold text-[#1A3A6E]">{card.value.toLocaleString()}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                      <card.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-semibold text-slate-900">Discipleship funnel</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Members who have completed each track, and those still working through it
              </p>

              {funnel.length === 0 ? (
                <p className="mt-6 text-sm text-slate-400">No tracks yet.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {funnel.map((row) => {
                    const total = row.completed + row.inProgress
                    return (
                      <div key={row.trackId}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-800">{row.name}</span>
                          <span className="text-xs text-slate-500">
                            {row.completed} completed
                            {row.inProgress > 0 ? `, ${row.inProgress} in progress` : ""}
                          </span>
                        </div>
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-[#1A3A6E] transition-all"
                            style={{ width: `${(row.completed / peak) * 100}%` }}
                          />
                          <div
                            className="bg-[#a5c1fe] transition-all"
                            style={{ width: `${(row.inProgress / peak) * 100}%` }}
                          />
                        </div>
                        {total === 0 && (
                          <p className="mt-1 text-[11px] text-slate-400">Nobody has started this track.</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/dashboard/academy/tracks"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Manage tracks
                </Link>
                <Link
                  href="/dashboard/academy/cohorts"
                  className="rounded-lg bg-[#1A3A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a1f44]"
                >
                  Manage cohorts
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AcademyLayout>
  )
}
