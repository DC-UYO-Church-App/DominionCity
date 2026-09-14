"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Mail, Search, Users } from "lucide-react"
import { MemberEmailDialog, type Audience } from "@/components/admin/member-email-dialog"

const UPLOADS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "")

const PAGE_SIZE = 25

type Status = "all" | "active" | "non_active" | "deactivated"

type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  activityStatus: "active" | "non_active" | "deactivated"
  missedServices: number
  joinDate: string | null
  createdAt: string | null
  profileImage: string | null
  departmentName: string | null
  cellGroupName: string | null
}

type Counts = { all: number; active: number; nonActive: number; deactivated: number }

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  pastor: "Pastor",
  hod: "HOD",
  cell_leader: "Cell Leader",
  worker: "Worker",
  bookshop_manager: "Bookshop Manager",
  member: "Member",
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-rose-100 text-rose-700",
  admin: "bg-orange-100 text-orange-700",
  pastor: "bg-violet-100 text-violet-700",
  hod: "bg-indigo-100 text-indigo-700",
  cell_leader: "bg-sky-100 text-sky-700",
  worker: "bg-teal-100 text-teal-700",
  bookshop_manager: "bg-amber-100 text-amber-700",
  member: "bg-slate-100 text-slate-600",
}

function resolveAvatar(img?: string | null) {
  if (!img) return null
  if (img.startsWith("http")) return img
  if (img.startsWith("/uploads/")) return `${UPLOADS_BASE}${img}`
  return `${UPLOADS_BASE}/uploads/${img}`
}

function Initials({ name }: { name: string }) {
  const letters = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1A3A6E]/15 text-sm font-bold text-[#1A3A6E]">
      {letters || "?"}
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AdminMembersScreen() {
  const [status, setStatus] = useState<Status>("all")
  const [roleFilter, setRoleFilter] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [members, setMembers] = useState<Member[]>([])
  const [counts, setCounts] = useState<Counts>({ all: 0, active: 0, nonActive: 0, deactivated: 0 })
  const [threshold, setThreshold] = useState(3)
  const [emailAudience, setEmailAudience] = useState<Audience | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* Debounced so typing a name is one request at the end, not one per key.
     Every filter resets the page at the moment it changes, rather than in a
     follow-up effect, so a change made on page 2 fires one fetch and not two. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    apiClient
      .getAdminMembers({ status, role: roleFilter || undefined, q: search, page, limit: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return
        setMembers(response.members || [])
        setCounts(response.counts || { all: 0, active: 0, nonActive: 0, deactivated: 0 })
        setThreshold(response.inactiveThreshold || 3)
        setTotal(response.pagination?.total || 0)
        setTotalPages(response.pagination?.totalPages || 1)
      })
      .catch((err) => {
        if (cancelled) return
        setMembers([])
        setTotal(0)
        setTotalPages(1)
        setError(err instanceof Error ? err.message : "Failed to load members")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, roleFilter, search, page])

  useEffect(() => load(), [load])

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All Registered", count: counts.all },
      { key: "active" as const, label: "Active Members", count: counts.active },
      { key: "non_active" as const, label: "Non-Active Members", count: counts.nonActive },
      { key: "deactivated" as const, label: "Deactivated Accounts", count: counts.deactivated },
    ],
    [counts]
  )

  // Email targets a whole audience, which only the two activity tabs describe.
  const audienceForTab: Audience | null =
    status === "active" ? "active" : status === "non_active" ? "non_active" : null

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, total)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Members</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              A member turns non-active after missing {threshold} services
            </p>
          </div>
          {audienceForTab && (
            <button
              type="button"
              onClick={() => setEmailAudience(audienceForTab)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a1f44]"
            >
              <Mail className="h-4 w-4" />
              Email {audienceForTab === "active" ? "active" : "non-active"} members
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tabs.map((tab) => {
            const isActive = status === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key)
                  setPage(1)
                }}
                aria-pressed={isActive}
                className={`rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-[#1A3A6E] bg-[#1A3A6E] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-[#1A3A6E]/40"
                }`}
              >
                <p className={`text-2xl font-bold ${isActive ? "text-white" : "text-[#1A3A6E]"}`}>
                  {tab.count.toLocaleString()}
                </p>
                <p className={`mt-0.5 text-xs ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {tab.label}
                </p>
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-900">
              {tabs.find((t) => t.key === status)?.label}
              <span className="ml-2 text-xs font-normal text-slate-400">({total.toLocaleString()})</span>
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by role"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
              >
                <option value="">All roles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm text-slate-400">Loading members...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {search || roleFilter ? "No members match your filters" : "No members in this group yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Member</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Department / Cell</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Joined</th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const fullName = `${member.firstName} ${member.lastName}`.trim()
                    const avatar = resolveAvatar(member.profileImage)
                    return (
                      <tr key={member.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img src={avatar} alt={fullName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                            ) : (
                              <Initials name={fullName} />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{fullName || "Unnamed"}</p>
                              <p className="truncate text-xs text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              ROLE_COLORS[member.role] || ROLE_COLORS.member
                            }`}
                          >
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{member.phoneNumber || "--"}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {member.departmentName || member.cellGroupName ? (
                            <span>
                              {member.departmentName || "--"}
                              <span className="text-slate-300"> / </span>
                              {member.cellGroupName || "--"}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              member.activityStatus === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : member.activityStatus === "non_active"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.activityStatus === "active"
                                  ? "bg-emerald-500"
                                  : member.activityStatus === "non_active"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {member.activityStatus === "active"
                              ? "Active"
                              : member.activityStatus === "non_active"
                              ? "Non-active"
                              : "Deactivated"}
                          </span>
                          {member.activityStatus === "non_active" && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Missed {member.missedServices}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(member.joinDate)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/admin/members/${member.id}`}
                            className="inline-flex whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1A3A6E] transition-colors hover:border-[#1A3A6E] hover:bg-[#1A3A6E]/5"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !error && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()} of {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-slate-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MemberEmailDialog
        audience={emailAudience ?? "active"}
        open={emailAudience !== null}
        onClose={() => {
          setEmailAudience(null)
          load()
        }}
      />
    </AdminLayout>
  )
}
