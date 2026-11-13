"use client"

import { useCallback, useEffect, useState } from "react"
import { AcademyLayout } from "./academy-layout"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Lock, Plus, Trash2, X } from "lucide-react"

type Track = {
  id: string
  name: string
  description: string | null
  sequence: number
  prerequisiteTrackId: string | null
  prerequisiteName: string | null
  isActive: boolean
  cohortCount: number
  enrollmentCount: number
}

export function AcademyTracksScreen() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: "", description: "", sequence: "" })

  const load = useCallback(() => {
    setIsLoading(true)
    apiClient
      .getAcademyTracks()
      .then((r) => setTracks(r.tracks || []))
      .catch((err) => toast.error("Could not load tracks", { description: err?.message }))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => load(), [load])

  const create = async () => {
    if (!draft.name.trim()) return
    try {
      await apiClient.createAcademyTrack({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        sequence: Number(draft.sequence) || tracks.length + 1,
      })
      toast.success("Track created")
      setDraft({ name: "", description: "", sequence: "" })
      setIsCreating(false)
      load()
    } catch (err) {
      toast.error("Could not create the track", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const patch = async (id: string, data: Parameters<typeof apiClient.updateAcademyTrack>[1]) => {
    setSaving(id)
    try {
      await apiClient.updateAcademyTrack(id, data)
      load()
    } catch (err) {
      toast.error("Could not save", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(null)
    }
  }

  const remove = async (track: Track) => {
    try {
      await apiClient.deleteAcademyTrack(track.id)
      toast.success("Track deleted")
      load()
    } catch (err) {
      toast.error("Could not delete", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <AcademyLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tracks</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              The catalogue. A prerequisite is what locks a track on a member's profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating((open) => !open)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f44]"
          >
            {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isCreating ? "Cancel" : "New track"}
          </button>
        </div>

        {isCreating && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[2fr_3fr_auto_auto]">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Track name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            />
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Description (optional)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
            />
            <input
              value={draft.sequence}
              onChange={(e) => setDraft({ ...draft, sequence: e.target.value })}
              placeholder="Order"
              inputMode="numeric"
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
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

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm text-slate-400">Loading tracks...</p>
            </div>
          ) : tracks.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-400">No tracks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Track", "Order", "Prerequisite", "Cohorts", "Enrolments", "Active", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tracks.map((track) => (
                    <tr key={track.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{track.name}</p>
                        {track.description && (
                          <p className="text-xs text-slate-400">{track.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{track.sequence}</td>
                      <td className="px-5 py-4">
                        <select
                          value={track.prerequisiteTrackId || ""}
                          onChange={(e) => patch(track.id, { prerequisiteTrackId: e.target.value || null })}
                          aria-label={`Prerequisite for ${track.name}`}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-[#1A3A6E] focus:outline-none"
                        >
                          <option value="">None</option>
                          {tracks
                            .filter((other) => other.id !== track.id)
                            .map((other) => (
                              <option key={other.id} value={other.id}>
                                {other.name}
                              </option>
                            ))}
                        </select>
                        {track.prerequisiteTrackId && (
                          <Lock className="ml-1.5 inline h-3 w-3 text-slate-400" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{track.cohortCount}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{track.enrollmentCount}</td>
                      <td className="px-5 py-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={track.isActive}
                            onChange={(e) => patch(track.id, { isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-[#1A3A6E]"
                          />
                          {saving === track.id && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                        </label>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => remove(track)}
                          aria-label={`Delete ${track.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          A track with enrolment history cannot be deleted. Untick Active to retire it instead, so
          members keep their completions.
        </p>
      </div>
    </AcademyLayout>
  )
}
