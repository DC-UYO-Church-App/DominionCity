"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldAlert,
  X,
} from "lucide-react"

const UPLOADS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "")

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

type Member = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  role: string
  departmentId: string | null
  departmentName: string | null
  cellGroupId: string | null
  cellGroupName: string | null
  dateOfBirth: string | null
  address: string | null
  isFirstTimer: boolean
  joinDate: string | null
  profileImage: string | null
  isActive: boolean
  activityStatus: "active" | "non_active" | "deactivated"
  missedServices: number
  totalServices: number
  servicesAttended: number
  lastAttended: string | null
}

type Option = { id: string; name: string }

type Draft = {
  firstName: string
  lastName: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  role: string
  departmentId: string
  cellGroupId: string
  isFirstTimer: boolean
  isActive: boolean
}

function resolveAvatar(img?: string | null) {
  if (!img) return null
  if (img.startsWith("http")) return img
  if (img.startsWith("/uploads/")) return `${UPLOADS_BASE}${img}`
  return `${UPLOADS_BASE}/uploads/${img}`
}

function formatDate(value: string | null) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

/** yyyy-mm-dd for a date input, which rejects a full ISO timestamp. */
function toDateInput(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function draftFrom(member: Member): Draft {
  return {
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    phoneNumber: member.phoneNumber || "",
    address: member.address || "",
    dateOfBirth: toDateInput(member.dateOfBirth),
    role: member.role,
    departmentId: member.departmentId || "",
    cellGroupId: member.cellGroupId || "",
    isFirstTimer: member.isFirstTimer,
    isActive: member.isActive,
  }
}

export function AdminMemberProfileScreen({ memberId }: { memberId: string }) {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [threshold, setThreshold] = useState(3)
  const [departments, setDepartments] = useState<Option[]>([])
  const [cellGroups, setCellGroups] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)

  const load = useCallback(() => {
    setIsLoading(true)
    setLoadError(null)
    apiClient
      .getAdminMember(memberId)
      .then((response) => {
        setMember(response.member)
        setThreshold(response.inactiveThreshold || 3)
        setDraft(draftFrom(response.member))
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load the member"))
      .finally(() => setIsLoading(false))
  }, [memberId])

  useEffect(() => load(), [load])

  // Dropdown options are only needed once the form is open.
  useEffect(() => {
    if (!isEditing || departments.length > 0 || cellGroups.length > 0) return
    apiClient
      .getAdminDepartments()
      .then((r) => setDepartments(r.departments || []))
      .catch(() => setDepartments([]))
    apiClient
      .getAdminCellGroups()
      .then((r) => setCellGroups(r.cellGroups || []))
      .catch(() => setCellGroups([]))
  }, [isEditing, departments.length, cellGroups.length])

  const fullName = member ? `${member.firstName} ${member.lastName}`.trim() : ""

  /* Only changed fields are sent, so a save cannot quietly rewrite a field the
     admin never touched with a stale value from when the page loaded. */
  const changes = useMemo(() => {
    if (!member || !draft) return {} as Record<string, unknown>
    const original = draftFrom(member)
    const diff: Record<string, unknown> = {}
    ;(Object.keys(draft) as (keyof Draft)[]).forEach((key) => {
      if (draft[key] === original[key]) return
      if (key === "departmentId" || key === "cellGroupId" || key === "address") {
        diff[key] = draft[key] === "" ? null : draft[key]
      } else if (key === "dateOfBirth") {
        diff[key] = draft[key] === "" ? null : draft[key]
      } else {
        diff[key] = draft[key]
      }
    })
    return diff
  }, [member, draft])

  const hasChanges = Object.keys(changes).length > 0

  const handleSave = useCallback(async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      await apiClient.updateAdminMember(memberId, changes as any)
      toast.success("Profile updated")
      setIsEditing(false)
      load()
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }, [changes, hasChanges, memberId, load])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-400" />
          <p className="text-sm text-slate-400">Loading profile...</p>
        </div>
      </AdminLayout>
    )
  }

  if (loadError || !member || !draft) {
    return (
      <AdminLayout>
        <div className="p-12 text-center">
          <p className="text-sm font-semibold text-rose-600">{loadError || "Member not found"}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/members")}
            className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Back to members
          </button>
        </div>
      </AdminLayout>
    )
  }

  const avatar = resolveAvatar(member.profileImage)
  const statusTone =
    member.activityStatus === "active"
      ? "bg-emerald-100 text-emerald-700"
      : member.activityStatus === "non_active"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-200 text-slate-600"
  const statusLabel =
    member.activityStatus === "active"
      ? "Active"
      : member.activityStatus === "non_active"
      ? "Non-active"
      : "Deactivated"

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link
          href="/dashboard/admin/members"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1A3A6E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to members
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {avatar ? (
                <img src={avatar} alt={fullName} className="h-16 w-16 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#1A3A6E]/15 text-lg font-bold text-[#1A3A6E]">
                  {fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900">{fullName || "Unnamed"}</h1>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {member.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusTone}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0a1f44]"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(draftFrom(member))
                    setIsEditing(false)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0a1f44] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-semibold text-slate-900">Details</h2>

              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <TextInput
                      value={draft.firstName}
                      onChange={(v) => setDraft({ ...draft, firstName: v })}
                    />
                  </Field>
                  <Field label="Last name">
                    <TextInput
                      value={draft.lastName}
                      onChange={(v) => setDraft({ ...draft, lastName: v })}
                    />
                  </Field>
                  <Field label="Phone number">
                    <TextInput
                      value={draft.phoneNumber}
                      onChange={(v) => setDraft({ ...draft, phoneNumber: v })}
                    />
                  </Field>
                  <Field label="Date of birth">
                    <TextInput
                      type="date"
                      value={draft.dateOfBirth}
                      onChange={(v) => setDraft({ ...draft, dateOfBirth: v })}
                    />
                  </Field>
                  <Field label="Role">
                    <select
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Department">
                    <select
                      value={draft.departmentId}
                      onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
                    >
                      <option value="">None</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cell group">
                    <select
                      value={draft.cellGroupId}
                      onChange={(e) => setDraft({ ...draft, cellGroupId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
                    >
                      <option value="">None</option>
                      {cellGroups.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Address">
                    <TextInput
                      value={draft.address}
                      onChange={(v) => setDraft({ ...draft, address: v })}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Account
                    </p>
                    <div className="space-y-2">
                      <Toggle
                        checked={draft.isActive}
                        onChange={(v) => setDraft({ ...draft, isActive: v })}
                        label="Account enabled"
                        hint="A disabled account cannot sign in and is never emailed."
                      />
                      <Toggle
                        checked={draft.isFirstTimer}
                        onChange={(v) => setDraft({ ...draft, isFirstTimer: v })}
                        label="First timer"
                      />
                    </div>
                  </div>

                  <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 sm:col-span-2">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    Email address and password are not editable here. Changing an email needs a
                    re-verification flow, and passwords are only set through a reset.
                  </p>
                </div>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadOnly label="Phone" value={member.phoneNumber || "Not set"} icon={Phone} />
                  <ReadOnly label="Date of birth" value={formatDate(member.dateOfBirth)} icon={CalendarDays} />
                  <ReadOnly label="Department" value={member.departmentName || "None"} />
                  <ReadOnly label="Cell group" value={member.cellGroupName || "None"} />
                  <ReadOnly label="Address" value={member.address || "Not set"} icon={MapPin} />
                  <ReadOnly label="Joined" value={formatDate(member.joinDate)} />
                  <ReadOnly label="First timer" value={member.isFirstTimer ? "Yes" : "No"} />
                  <ReadOnly label="Account" value={member.isActive ? "Enabled" : "Disabled"} />
                </dl>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Attendance</h2>
              <dl className="space-y-3">
                <Stat label="Services attended" value={member.servicesAttended} />
                <Stat label="Services since joining" value={member.totalServices} />
                <Stat
                  label="Missed recently"
                  value={member.missedServices}
                  tone={member.missedServices >= threshold ? "text-amber-600" : undefined}
                />
                <div>
                  <dt className="text-xs text-slate-500">Last attended</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                    {formatDate(member.lastAttended)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Non-active after missing {threshold} services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  type = "text",
}: {
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
    />
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1A3A6E] focus:ring-[#1A3A6E]/30"
      />
      <span>
        <span className="block text-sm text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      </span>
    </label>
  )
}

function ReadOnly({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        <span className="break-words">{value}</span>
      </dd>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-xl font-bold ${tone || "text-[#1A3A6E]"}`}>{value.toLocaleString()}</dd>
    </div>
  )
}
