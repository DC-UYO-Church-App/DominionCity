"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AcademyLayout } from "./academy-layout"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { ArrowRight, Loader2, Plus, X } from "lucide-react"

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
  staff: { userId: string; firstName: string; lastName: string; staffRole: string }[]
}

const STATUS_TONE: Record<string, string> = {
  planned: "bg-slate-100 text-slate-600",
  open: "bg-sky-100 text-sky-700",
  running: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-500",
}

export function formatDate(value: string | null) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AcademyCohortsScreen() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [tracks, setTracks] = useState<{ id: string; name: string }[]>([])
  const [canManageAll, setCanManageAll] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [draft, setDraft] = useState({ trackId: "", name: "", startDate: "", endDate: "" })

  const load = useCallback(() => {
    setIsLoading(true)
    Promise.all([apiClient.getAcademyCohorts(), apiClient.getAcademyTracks()])
      .then(([cohortRes, trackRes]) => {
        setCohorts(cohortRes.cohorts || [])
        setCanManageAll(Boolean(cohortRes.canManageAll))
        setTracks(trackRes.tracks || [])
      })
      .catch((err) => toast.error("Could not load cohorts", { description: err?.message }))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => load(), [load])

  const create = async () => {
    if (!draft.trackId || !draft.name.trim()) return
    try {
      await apiClient.createAcademyCohort({
        trackId: draft.trackId,
        name: draft.name.trim(),
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
      })
      toast.success("Cohort created")
      setDraft({ trackId: "", name: "", startDate: "", endDate: "" })
      setIsCreating(false)
      load()
    } catch (err) {
      toast.error("Could not create the cohort", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <AcademyLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Cohorts</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {canManageAll
                ? "Every run of every track"
                : "The cohorts you run"}
            </p>
          </div>
          {canManageAll && (
            <button
              type="button"
              onClick={() => setIsCreating((open) => !open)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f44]"
            >
              {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Cancel" : "New cohort"}
            </button>
          )}
        </div>

        {isCreating && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-5">
            <select
              value={draft.trackId}
              onChange={(e) => setDraft({ ...draft, trackId: e.target.value })}
              aria-label="Track"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            >
              <option value="">Choose a track</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Cohort name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            />
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              aria-label="Start date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            />
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              aria-label="End date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            />
            <button
              type="button"
              onClick={create}
              className="rounded-lg bg-[#1A3A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a1f44]"
            >
              Create
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Loading cohorts...</p>
          </div>
        ) : cohorts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              {canManageAll ? "No cohorts yet" : "You do not run any cohorts yet"}
            </p>
            {canManageAll && (
              <p className="mt-1 text-xs text-slate-400">
                A cohort is one run of a track, with dates and its own coordinator.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/dashboard/academy/cohorts/${cohort.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#1A3A6E]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {cohort.trackName}
                    </p>
                    <h2 className="mt-0.5 truncate font-semibold text-slate-900">{cohort.name}</h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                      STATUS_TONE[cohort.status] || STATUS_TONE.planned
                    }`}
                  >
                    {cohort.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(cohort.startDate)} to {formatDate(cohort.endDate)}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  {[
                    { label: "Enrolled", value: cohort.enrolledCount },
                    { label: "Completed", value: cohort.completedCount },
                    { label: "Sessions", value: cohort.sessionCount },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-lg font-bold text-[#1A3A6E]">{stat.value}</p>
                      <p className="text-[11px] text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="min-w-0 truncate text-xs text-slate-500">
                    {cohort.staff.length > 0
                      ? cohort.staff.map((s) => `${s.firstName} ${s.lastName}`).join(", ")
                      : "No coordinator yet"}
                  </p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AcademyLayout>
  )
}
