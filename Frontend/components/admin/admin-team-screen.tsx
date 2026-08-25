"use client"

import { useCallback, useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  UserPlus,
  ChevronDown,
  Loader2,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────
type RoleType = "pastor" | "cell_leader" | "department_leader"

interface Role {
  type: RoleType
  detail?: string
}

interface TeamMember {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  profileImage?: string
  roles: Role[]
  createdAt: string
}

interface UserResult {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  profileImage?: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<RoleType, string> = {
  pastor: "Pastor",
  cell_leader: "Cell Leader",
  department_leader: "Department Leader",
}

const ROLE_COLORS: Record<RoleType, string> = {
  pastor: "bg-[#1A3A6E] text-white",
  cell_leader: "bg-emerald-600 text-white",
  department_leader: "bg-purple-600 text-white",
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
const UPLOADS_BASE = API_BASE.replace(/\/api$/, "")

function resolveAvatar(img?: string | null) {
  if (!img) return null
  if (img.startsWith("http")) return img
  if (img.startsWith("/uploads/")) return `${UPLOADS_BASE}${img}`
  return `${UPLOADS_BASE}/uploads/${img}`
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const letters = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={`${cls} rounded-full bg-[#1A3A6E]/15 text-[#1A3A6E] font-bold flex items-center justify-center flex-shrink-0`}>
      {letters || "?"}
    </div>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const label = role.type === "pastor"
    ? "Pastor"
    : role.type === "cell_leader"
    ? `Cell Leader${role.detail ? `: ${role.detail}` : ""}`
    : `Dept. Leader${role.detail ? `: ${role.detail}` : ""}`
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${ROLE_COLORS[role.type]}`}>
      {label}
    </span>
  )
}

// ── Role Builder ───────────────────────────────────────────────────────────
function RoleBuilder({ roles, onChange }: { roles: Role[]; onChange: (r: Role[]) => void }) {
  const [type, setType] = useState<RoleType>("pastor")
  const [detail, setDetail] = useState("")

  const needsDetail = type === "cell_leader" || type === "department_leader"

  const addRole = () => {
    if (needsDetail && !detail.trim()) return
    const newRole: Role = { type, detail: needsDetail ? detail.trim() : undefined }
    onChange([...roles, newRole])
    setDetail("")
    setType("pastor")
  }

  const removeRole = (i: number) => onChange(roles.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Roles</label>

      {/* Existing roles */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {roles.length === 0 && (
          <span className="text-xs text-slate-400 italic">No roles yet — add one below.</span>
        )}
        {roles.map((r, i) => (
          <span key={i} className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-bold ${ROLE_COLORS[r.type]}`}>
            <RoleBadge role={r} />
            <button type="button" onClick={() => removeRole(i)} className="ml-0.5 hover:opacity-70 transition-opacity">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Add role row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Role Type</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as RoleType); setDetail("") }}
              className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E]"
            >
              <option value="pastor">Pastor</option>
              <option value="cell_leader">Cell Leader</option>
              <option value="department_leader">Department Leader</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {needsDetail && (
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
              {type === "cell_leader" ? "Cell Group Name" : "Department Name"}
            </label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={type === "cell_leader" ? "e.g. Grace & Fire Cell" : "e.g. Media Department"}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E]"
            />
          </div>
        )}

        <button
          type="button"
          onClick={addRole}
          disabled={needsDetail && !detail.trim()}
          className="px-4 py-2 bg-[#1A3A6E] text-white rounded-lg text-sm font-semibold hover:bg-[#0a1f44] transition-colors disabled:opacity-40 flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ── Add Member Modal ───────────────────────────────────────────────────────
function AddMemberModal({
  onClose,
  onSaved,
  existingIds,
}: {
  onClose: () => void
  onSaved: () => void
  existingIds: Set<string>
}) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [saving, setSaving] = useState(false)

  const search = useCallback(async (q: string) => {
    setSearching(true)
    try {
      const res = await apiClient.searchUsers(q)
      setUsers((res?.users || []).filter((u: UserResult) => !existingIds.has(u.id)))
    } catch {
      setUsers([])
    } finally {
      setSearching(false)
    }
  }, [existingIds])

  useEffect(() => {
    search("")
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  const save = async () => {
    if (!selected) return
    if (roles.length === 0) {
      toast({ title: "No roles", description: "Add at least one role.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await apiClient.addTeamMember({ userId: selected.id, roles })
      toast({ title: "Member added", description: `${selected.firstName} ${selected.lastName} added to the team.` })
      onSaved()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A3A6E]/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-[#1A3A6E]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Team Member</h2>
              <p className="text-xs text-slate-500">Select a member and assign roles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* User search */}
          {!selected ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Search Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name or email..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E]"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    {searching ? "Searching..." : "No members found"}
                  </div>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelected(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                    >
                      {resolveAvatar(u.profileImage) ? (
                        <img src={resolveAvatar(u.profileImage)!} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <Initials name={`${u.firstName} ${u.lastName}`} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Selected member + role builder */
            <div className="space-y-5">
              {/* Selected member chip */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {resolveAvatar(selected.profileImage) ? (
                  <img src={resolveAvatar(selected.profileImage)!} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <Initials name={`${selected.firstName} ${selected.lastName}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{selected.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelected(null); setRoles([]) }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <RoleBuilder roles={roles} onChange={setRoles} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!selected || roles.length === 0 || saving}
            className="px-5 py-2.5 bg-[#1A3A6E] text-white rounded-lg text-sm font-semibold hover:bg-[#0a1f44] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add to Team
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Roles Modal ───────────────────────────────────────────────────────
function EditRolesModal({
  member,
  onClose,
  onSaved,
}: {
  member: TeamMember
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>(member.roles)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (roles.length === 0) {
      toast({ title: "No roles", description: "Assign at least one role.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await apiClient.updateTeamMemberRoles(member.id, roles)
      toast({ title: "Roles updated", description: `${member.firstName}'s roles have been updated.` })
      onSaved()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white p-4 sm:p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Roles</h2>
            <p className="text-xs text-slate-500">{member.firstName} {member.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-6">
          <RoleBuilder roles={roles} onChange={setRoles} />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={roles.length === 0 || saving}
            className="px-5 py-2.5 bg-[#1A3A6E] text-white rounded-lg text-sm font-semibold hover:bg-[#0a1f44] disabled:opacity-40 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Screen ────────────────────────────────────────────────────────────
export function AdminTeamScreen() {
  const { toast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.getTeamMembers()
      setMembers(res?.members || [])
    } catch {
      setMembers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName} from the team?`)) return
    setDeletingId(member.id)
    try {
      await apiClient.removeTeamMember(member.id)
      toast({ title: "Removed", description: `${member.firstName} has been removed from the team.` })
      load()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to remove", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = members.filter((m) => {
    const q = searchQuery.toLowerCase()
    return !q || `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
  })

  const existingIds = new Set(members.map((m) => m.userId))

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Team</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage church leadership and assigned roles</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A3A6E] text-white rounded-xl font-semibold text-sm hover:bg-[#0a1f44] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: members.length },
            { label: "Pastors", value: members.filter((m) => m.roles.some((r) => r.type === "pastor")).length },
            { label: "Cell Leaders", value: members.filter((m) => m.roles.some((r) => r.type === "cell_leader")).length },
            { label: "Dept. Leaders", value: members.filter((m) => m.roles.some((r) => r.type === "department_leader")).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-[#1A3A6E]">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              All Members
              <span className="ml-2 text-xs font-normal text-slate-400">({filtered.length})</span>
            </h2>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading team members...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {searchQuery ? "No members match your search" : "No team members yet"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-slate-400 mt-1">
                  Click "Add Member" to assign roles to church members.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Member</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Roles</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Added</th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((member) => {
                    const avatar = resolveAvatar(member.profileImage)
                    const fullName = `${member.firstName} ${member.lastName}`
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img src={avatar} alt={fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <Initials name={fullName} />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                              <p className="text-xs text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {member.roles.map((role, i) => (
                              <RoleBadge key={i} role={role} />
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {member.phoneNumber || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">
                          {new Date(member.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditMember(member)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-[#1A3A6E]"
                              title="Edit roles"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(member)}
                              disabled={deletingId === member.id}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600 disabled:opacity-40"
                              title="Remove from team"
                            >
                              {deletingId === member.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSaved={load}
          existingIds={existingIds}
        />
      )}

      {editMember && (
        <EditRolesModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
