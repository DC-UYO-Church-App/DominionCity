"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Loader2,
  ScanFace,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { FaceCapture } from "@/components/face/face-capture"

type FaceUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profileImage: string | null
  isActive: boolean
  faceEnrolled: boolean
  enrolledAt: string | null
}

type Candidate = {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: string
  score: number
}

type ScanResult = {
  matched: boolean
  threshold: number
  facesDetected: number
  match: Candidate | null
  candidates: Candidate[]
}

const ALLOWED = new Set(["technical", "super_admin"])

export function TechnicalScreen() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    apiClient
      .getProfile()
      .then((r) => {
        if (ALLOWED.has(r?.user?.role)) setAuthorized(true)
        else {
          setAuthorized(false)
          router.replace("/dashboard")
        }
      })
      .catch(() => router.replace("/login"))
  }, [router])

  if (authorized !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3c6eea]/10">
            <ScanFace className="h-6 w-6 text-[#3c6eea]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Technical</h1>
            <p className="text-sm text-slate-500">
              Registered users and facial-recognition scanning.
            </p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="scan">Face scan</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="scan">
            <ScanTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Loads a user's enrolled face still (an authenticated endpoint, so it is
 * fetched as a blob and shown via an object URL) and renders it as a round
 * thumbnail. Clicking it opens the larger view. The object URL is revoked on
 * unmount so blobs are not leaked.
 */
function FaceThumb({ userId, onOpen }: { userId: string; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let created: string | null = null
    apiClient
      .getFaceUserImageUrl(userId)
      .then((u) => {
        if (active) {
          created = u
          setUrl(u)
        } else {
          URL.revokeObjectURL(u)
        }
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [userId])

  if (failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <ScanFace className="h-4 w-4" />
      </div>
    )
  }
  if (!url) {
    return <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-200 transition hover:ring-emerald-400"
      aria-label="View enrolled face"
    >
      <img src={url} alt="" className="h-full w-full object-cover" />
    </button>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<FaceUser[]>([])
  const [totals, setTotals] = useState({ users: 0, enrolled: 0 })
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | "true" | "false">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)

  const load = useCallback(() => {
    setIsLoading(true)
    apiClient
      .getFaceUsers({ q: q || undefined, enrolled: filter === "all" ? undefined : filter })
      .then((r) => {
        setUsers(r.users || [])
        if (r.totals) setTotals(r.totals)
      })
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false))
  }, [q, filter])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [load])

  const removeEnrollment = async (user: FaceUser) => {
    try {
      await apiClient.deleteUserFaceEnrollment(user.id)
      toast.success(`Removed ${user.firstName}'s face registration`)
      load()
    } catch (error) {
      toast.error("Could not remove", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-semibold">{totals.users}</p>
          <p className="text-xs text-slate-500">Registered users</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-semibold">{totals.enrolled}</p>
          <p className="text-xs text-slate-500">Faces on file</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          {([["all", "All"], ["true", "Enrolled"], ["false", "Not enrolled"]] as const).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  filter === value ? "bg-[#3c6eea] text-white" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No users found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                {u.faceEnrolled ? (
                  <FaceThumb userId={u.id} onOpen={setPreview} />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-400">
                    {`${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}` || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {`${u.firstName} ${u.lastName}`.trim()}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {u.email} · <span className="capitalize">{u.role.replace(/_/g, " ")}</span>
                  </p>
                </div>
                {u.faceEnrolled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <UserCheck className="h-3.5 w-3.5" /> Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    <UserX className="h-3.5 w-3.5" /> None
                  </span>
                )}
                {u.faceEnrolled && (
                  <button
                    type="button"
                    onClick={() => removeEnrollment(u)}
                    aria-label="Remove face registration"
                    className="rounded-full p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt="Enrolled face"
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Close"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ScanTab() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [mode, setMode] = useState<"capture" | "result">("capture")

  const onCapture = async (dataUrl: string) => {
    setScanning(true)
    try {
      const r = await apiClient.recognizeFace(dataUrl)
      setResult(r)
      setMode("result")
    } catch (error) {
      toast.error("Scan failed", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setScanning(false)
    }
  }

  const pct = (score: number) => `${Math.round(score * 100)}%`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      {mode === "capture" ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-500">
            Position the person's face in the frame and capture to identify them.
          </p>
          <FaceCapture captureLabel="Scan face" busy={scanning} onCapture={onCapture} />
          {scanning && (
            <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Identifying...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {result?.matched && result.match ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">
                  {`${result.match.firstName} ${result.match.lastName}`.trim()}
                </p>
                <p className="text-xs text-emerald-700">
                  {result.match.email} · match {pct(result.match.score)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">No confident match</p>
                <p className="text-xs text-amber-700">
                  {result?.facesDetected
                    ? "This face isn't registered, or the match was below the threshold."
                    : "No face was detected."}
                </p>
              </div>
            </div>
          )}

          {result && result.candidates.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Closest matches
              </p>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {result.candidates.map((c) => (
                  <li key={c.userId} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate">{`${c.firstName} ${c.lastName}`.trim()}</span>
                    <span
                      className={`ml-3 shrink-0 text-xs font-medium ${
                        c.score >= result.threshold ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {pct(c.score)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null)
              setMode("capture")
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3c6eea] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3360d4]"
          >
            <X className="h-4 w-4" /> Scan another
          </button>
        </div>
      )}
    </div>
  )
}
