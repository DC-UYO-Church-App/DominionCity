"use client"

import { useEffect, useRef, useState } from "react"
import { apiClient } from "@/lib/api"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
  Building2,
  ChevronDown,
  Crown,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"

type Department = {
  id: string
  name: string
  hodId?: string
  hodName?: string
  hodImage?: string
  assistantId?: string
  assistantName?: string
  assistantImage?: string
  memberCount: number
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
}

function Avatar({ name, image, size = 8 }: { name: string; image?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`h-${size} w-${size} rounded-full object-cover ring-2 ring-white`}
      />
    )
  }
  return (
    <div
      className={`flex h-${size} w-${size} items-center justify-center rounded-full bg-[#3c6eea] text-xs font-semibold text-white ring-2 ring-white`}
    >
      {initials}
    </div>
  )
}

function UserSearch({
  label,
  value,
  onChange,
}: {
  label: string
  value: User | null
  onChange: (user: User | null) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const timer = setTimeout(() => {
      apiClient
        .searchUsers(query || undefined)
        .then((res) => setResults(res?.users || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, open])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar
              name={`${value.firstName} ${value.lastName}`}
              image={value.profileImage}
              size={7}
            />
            <div>
              <p className="text-sm font-medium text-slate-800">
                {value.firstName} {value.lastName}
              </p>
              <p className="text-xs text-slate-500">{value.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Type a name or email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#3c6eea] focus:outline-none"
          />
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      )}

      {open && !value && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c6eea] border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No users found</p>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(user)
                      setQuery("")
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <Avatar
                      name={`${user.firstName} ${user.lastName}`}
                      image={user.profileImage}
                      size={8}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

type FormState = {
  name: string
  leader: User | null
  assistant: User | null
}

const emptyForm: FormState = { name: "", leader: null, assistant: null }

function DepartmentModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Department name is required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiClient.createAdminDepartment({
        name: form.name.trim(),
        hodId: form.leader?.id,
        assistantId: form.assistant?.id,
      })
      onSave()
    } catch (err: any) {
      setError(err.message || "Failed to create department.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-800">Create Department</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4 py-5 sm:px-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Department Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Worship, Media, Ushering"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#3c6eea] focus:outline-none"
            />
          </div>

          <UserSearch
            label="Department Leader Name *"
            value={form.leader}
            onChange={(user) => setForm((f) => ({ ...f, leader: user }))}
          />

          <UserSearch
            label="Department Assistant Name (optional)"
            value={form.assistant}
            onChange={(user) => setForm((f) => ({ ...f, assistant: user }))}
          />

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#3c6eea] px-5 py-2 text-sm font-medium text-white hover:bg-[#2e5bd4] disabled:opacity-60"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminDepartmentsScreen() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadDepartments = () => {
    setLoading(true)
    apiClient
      .getAdminDepartments()
      .then((res) => setDepartments(res?.departments || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.hodName || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.deleteAdminDepartment(deleteTarget.id)
      setDeleteTarget(null)
      loadDepartments()
    } catch {
      // keep modal open on error
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Departments</h1>
            <p className="text-sm text-slate-500">
              {departments.length} department{departments.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3c6eea] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2e5bd4]"
          >
            <Plus className="h-4 w-4" />
            Create Department
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Departments</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{departments.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Members</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {departments.reduce((sum, d) => sum + d.memberCount, 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#f59e0b]">No Leader Yet</p>
            <p className="mt-1 text-2xl font-bold text-[#f59e0b]">
              {departments.filter((d) => !d.hodId).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by department or leader name..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#3c6eea] focus:outline-none"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3c6eea] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-700">
              {search ? "No departments match your search" : "No departments yet"}
            </p>
            {!search && (
              <p className="mt-1 text-sm text-slate-400">
                Click "Create Department" to get started
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dept) => (
              <div key={dept.id} className="rounded-2xl bg-white p-5 shadow-sm">
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3c6eea]/10">
                      <Building2 className="h-5 w-5 text-[#3c6eea]" />
                    </div>
                    <div>
                      <h3 className="break-words font-semibold leading-tight text-slate-800">{dept.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Users className="h-3 w-3" />
                        {dept.memberCount} member{dept.memberCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(dept)}
                    className="shrink-0 rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Leader */}
                <div className="mt-4 border-t border-slate-100 pt-3 space-y-2.5">
                  {dept.hodName ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={dept.hodName} image={dept.hodImage} size={7} />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{dept.hodName}</p>
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span className="text-[11px] font-medium text-amber-600">
                            Department Leader
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300">
                        <Crown className="h-3 w-3 text-slate-300" />
                      </div>
                      <span className="text-xs italic text-slate-400">No leader assigned</span>
                    </div>
                  )}

                  {dept.assistantName && (
                    <div className="flex items-center gap-2">
                      <Avatar name={dept.assistantName} image={dept.assistantImage} size={7} />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{dept.assistantName}</p>
                        <span className="text-[11px] font-medium text-slate-400">
                          Assistant
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <DepartmentModal
            onClose={() => setShowCreate(false)}
            onSave={() => {
              setShowCreate(false)
              loadDepartments()
            }}
          />
        )}

        {/* Delete confirm */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-800">Delete Department?</h3>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{deleteTarget.name}</span> will be
                permanently deleted. Members in this department will be unassigned.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
