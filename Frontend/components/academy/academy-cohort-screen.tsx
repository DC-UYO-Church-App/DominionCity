"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AcademyLayout } from "./academy-layout"
import { formatDate } from "./academy-cohorts-screen"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, CalendarPlus, Loader2, Trash2, UserPlus, Users2, X } from "lucide-react"

type Staff = { userId: string; firstName: string; lastName: string; email: string; staffRole: string }
type Cohort = {
  id: string
  trackName: string
  name: string
  startDate: string | null
  endDate: string | null
  status: string
  enrolledCount: number
  completedCount: number
  staff: Staff[]
}
type Enrollment = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  status: string
  certificateNumber: string | null
  sessionsAttended: number
}
type Session = {
  id: string
  title: string
  topic: string | null
  sessionDate: string
  facilitatorName: string | null
  presentCount: number
  recordedCount: number
}
type Register = { enrollmentId: string; firstName: string; lastName: string; status: string }
type JoinRequest = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

const ENROLLMENT_STATUSES = ["enrolled", "in_progress", "completed", "withdrawn"]
const COHORT_STATUSES = ["planned", "open", "running", "closed"]

export function AcademyCohortScreen({ cohortId }: { cohortId: string }) {
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [canManageAll, setCanManageAll] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [memberQuery, setMemberQuery] = useState("")
  const [memberResults, setMemberResults] = useState<any[]>([])
  const [picker, setPicker] = useState<"enrol" | "staff" | null>(null)

  const [sessionDraft, setSessionDraft] = useState({ title: "", topic: "", sessionDate: "" })
  const [isAddingSession, setIsAddingSession] = useState(false)

  const [openRegister, setOpenRegister] = useState<Session | null>(null)
  const [register, setRegister] = useState<Register[]>([])

  const load = useCallback(() => {
    setIsLoading(true)
    apiClient
      .getAcademyCohort(cohortId)
      .then((r) => {
        setCohort(r.cohort)
        setEnrollments(r.enrollments || [])
        setSessions(r.sessions || [])
        setCanManageAll(Boolean(r.canManageAll))
        setLoadError(null)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load the cohort"))
      .finally(() => setIsLoading(false))

    // Pending join requests sit outside the cohort payload. A failure here
    // leaves the rest of the cohort usable, so it only clears the list.
    apiClient
      .getAcademyCohortJoinRequests(cohortId)
      .then((r) => setJoinRequests(r.requests || []))
      .catch(() => setJoinRequests([]))
  }, [cohortId])

  useEffect(() => load(), [load])

  // Debounced member search, shared by the enrol and staff pickers.
  useEffect(() => {
    if (!picker) return
    const timer = setTimeout(() => {
      apiClient
        .getAdminMembers({ status: "active", q: memberQuery, limit: 10 })
        .then((r) => setMemberResults(r.members || []))
        .catch(() => setMemberResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [memberQuery, picker])

  const act = async (fn: () => Promise<any>, success: string) => {
    try {
      await fn()
      toast.success(success)
      load()
    } catch (err) {
      toast.error("Could not save", { description: err instanceof Error ? err.message : undefined })
    }
  }

  const openRegisterFor = async (session: Session) => {
    try {
      const r = await apiClient.getAcademySessionAttendance(session.id)
      setRegister(r.attendance || [])
      setOpenRegister(session)
    } catch (err) {
      toast.error("Could not open the register", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const saveRegister = async () => {
    if (!openRegister) return
    await act(
      () =>
        apiClient.recordAcademySessionAttendance(
          openRegister.id,
          register.map((r) => ({ enrollmentId: r.enrollmentId, status: r.status }))
        ),
      "Register saved"
    )
    setOpenRegister(null)
  }

  if (isLoading) {
    return (
      <AcademyLayout>
        <div className="p-12 text-center">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
          <p className="text-sm text-slate-400">Loading cohort...</p>
        </div>
      </AcademyLayout>
    )
  }

  if (loadError || !cohort) {
    return (
      <AcademyLayout>
        <div className="p-12 text-center">
          <p className="text-sm font-semibold text-rose-600">{loadError || "Cohort not found"}</p>
          <Link
            href="/dashboard/academy/cohorts"
            className="mt-3 inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Back to cohorts
          </Link>
        </div>
      </AcademyLayout>
    )
  }

  const enrolledIds = new Set(enrollments.map((e) => e.userId))
  const staffIds = new Set(cohort.staff.map((s) => s.userId))

  return (
    <AcademyLayout>
      <div className="space-y-6">
        <Link
          href="/dashboard/academy/cohorts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1A3A6E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cohorts
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {cohort.trackName}
              </p>
              <h1 className="mt-0.5 text-xl font-bold text-slate-900">{cohort.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(cohort.startDate)} to {formatDate(cohort.endDate)}
              </p>
            </div>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Status</span>
              <select
                value={cohort.status}
                onChange={(e) =>
                  act(() => apiClient.updateAcademyCohort(cohort.id, { status: e.target.value }), "Status updated")
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize focus:border-[#1A3A6E] focus:outline-none"
              >
                {COHORT_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Who runs it. Appointing staff stays with the academy admin. */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Users2 className="h-4 w-4 text-slate-400" />
              Who runs this cohort
            </h2>
            {canManageAll && (
              <button
                type="button"
                onClick={() => {
                  setPicker("staff")
                  setMemberQuery("")
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1A3A6E] hover:bg-slate-50"
              >
                Assign
              </button>
            )}
          </div>
          {cohort.staff.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Nobody is assigned. A cohort without a coordinator has nobody to mark its register.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {cohort.staff.map((s) => (
                <span
                  key={s.userId}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs"
                >
                  <span className="font-semibold text-slate-700">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="text-slate-400 capitalize">{s.staffRole}</span>
                  {canManageAll && (
                    <button
                      type="button"
                      onClick={() =>
                        act(() => apiClient.removeAcademyCohortStaff(cohort.id, s.userId), "Removed")
                      }
                      aria-label={`Remove ${s.firstName} ${s.lastName}`}
                      className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Join requests: members who asked to join this open cohort. */}
        {joinRequests.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
            <div className="border-b border-amber-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Join requests
                <span className="ml-2 text-xs font-normal text-amber-700">
                  ({joinRequests.length} waiting)
                </span>
              </h2>
            </div>
            <ul className="divide-y divide-amber-100">
              {joinRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {`${r.firstName} ${r.lastName}`.trim()}
                    </p>
                    <p className="truncate text-xs text-slate-500">{r.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => act(() => apiClient.acceptAcademyJoinRequest(r.id), "Member enrolled")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => act(() => apiClient.rejectAcademyJoinRequest(r.id), "Request declined")}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Roster */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Members
              <span className="ml-2 text-xs font-normal text-slate-400">({enrollments.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setPicker("enrol")
                setMemberQuery("")
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1A3A6E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a1f44]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Enrol
            </button>
          </div>

          {enrollments.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-400">Nobody is enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Member", "Status", "Attended", "Certificate", ""].map((h) => (
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
                  {enrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {e.firstName} {e.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={e.status}
                          onChange={(ev) =>
                            act(
                              () => apiClient.updateAcademyEnrollment(e.id, { status: ev.target.value }),
                              "Updated"
                            )
                          }
                          aria-label={`Status for ${e.firstName}`}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs capitalize focus:border-[#1A3A6E] focus:outline-none"
                        >
                          {ENROLLMENT_STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {e.sessionsAttended} of {sessions.length}
                      </td>
                      <td className="px-5 py-3">
                        <input
                          defaultValue={e.certificateNumber || ""}
                          placeholder="--"
                          onBlur={(ev) => {
                            if (ev.target.value !== (e.certificateNumber || "")) {
                              act(
                                () =>
                                  apiClient.updateAcademyEnrollment(e.id, {
                                    certificateNumber: ev.target.value,
                                  }),
                                "Certificate saved"
                              )
                            }
                          }}
                          aria-label={`Certificate number for ${e.firstName}`}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#1A3A6E] focus:outline-none"
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            act(() => apiClient.removeAcademyEnrollment(e.id), "Removed from cohort")
                          }
                          aria-label={`Remove ${e.firstName}`}
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

        {/* Sessions: the activities inside the cohort */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Sessions
              <span className="ml-2 text-xs font-normal text-slate-400">({sessions.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsAddingSession((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-[#1A3A6E] hover:bg-slate-50"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {isAddingSession ? "Cancel" : "Add session"}
            </button>
          </div>

          {isAddingSession && (
            <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-4">
              <input
                value={sessionDraft.title}
                onChange={(e) => setSessionDraft({ ...sessionDraft, title: e.target.value })}
                placeholder="Session title"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
              />
              <input
                value={sessionDraft.topic}
                onChange={(e) => setSessionDraft({ ...sessionDraft, topic: e.target.value })}
                placeholder="Topic (optional)"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
              />
              <input
                type="date"
                value={sessionDraft.sessionDate}
                onChange={(e) => setSessionDraft({ ...sessionDraft, sessionDate: e.target.value })}
                aria-label="Session date"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!sessionDraft.title.trim() || !sessionDraft.sessionDate) return
                  await act(
                    () =>
                      apiClient.createAcademySession(cohort.id, {
                        title: sessionDraft.title.trim(),
                        topic: sessionDraft.topic.trim() || undefined,
                        sessionDate: sessionDraft.sessionDate,
                      }),
                    "Session added"
                  )
                  setSessionDraft({ title: "", topic: "", sessionDate: "" })
                  setIsAddingSession(false)
                }}
                className="rounded-lg bg-[#1A3A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a1f44]"
              >
                Add
              </button>
            </div>
          )}

          {sessions.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-400">No sessions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(s.sessionDate)}
                      {s.topic ? ` - ${s.topic}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {s.presentCount} present of {enrollments.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => openRegisterFor(s)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1A3A6E] hover:bg-slate-50"
                  >
                    {s.recordedCount > 0 ? "Edit register" : "Mark register"}
                  </button>
                  <button
                    type="button"
                    onClick={() => act(() => apiClient.deleteAcademySession(s.id), "Session deleted")}
                    aria-label={`Delete ${s.title}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Member picker, shared by enrolling and staffing. */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setPicker(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                {picker === "enrol" ? "Enrol a member" : "Assign a coordinator"}
              </h2>
              <button
                type="button"
                onClick={() => setPicker(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none"
              />
              <div className="mt-3 space-y-1">
                {memberResults.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">No members found.</p>
                )}
                {memberResults.map((m) => {
                  const already = picker === "enrol" ? enrolledIds.has(m.id) : staffIds.has(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={already}
                      onClick={async () => {
                        await act(
                          () =>
                            picker === "enrol"
                              ? apiClient.enrollInAcademyCohort(cohort.id, [m.id])
                              : apiClient.addAcademyCohortStaff(cohort.id, { userId: m.id }),
                          picker === "enrol" ? "Enrolled" : "Assigned"
                        )
                        setPicker(null)
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {m.firstName} {m.lastName}
                        </span>
                        <span className="block truncate text-xs text-slate-400">{m.email}</span>
                      </span>
                      {already && <span className="text-[11px] text-slate-400">Added</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register for one session */}
      {openRegister && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpenRegister(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">{openRegister.title}</h2>
                <p className="text-xs text-slate-400">{formatDate(openRegister.sessionDate)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenRegister(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {register.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-400">Nobody is enrolled yet.</p>
              )}
              {register.map((row, index) => (
                <div key={row.enrollmentId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm text-slate-800">
                    {row.firstName} {row.lastName}
                  </span>
                  <div className="flex gap-1">
                    {["present", "absent", "excused"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setRegister((rows) =>
                            rows.map((r, i) => (i === index ? { ...r, status } : r))
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                          row.status === status
                            ? status === "present"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "absent"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                            : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setOpenRegister(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRegister}
                className="rounded-xl bg-[#1A3A6E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0a1f44]"
              >
                Save register
              </button>
            </div>
          </div>
        </div>
      )}
    </AcademyLayout>
  )
}
