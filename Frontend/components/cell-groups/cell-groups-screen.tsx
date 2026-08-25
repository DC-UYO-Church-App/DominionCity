"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Phone, MessageSquare, Mail, Check, X, Users, Search, ArrowLeftRight, ExternalLink, Bell, UserCheck, UserX } from "lucide-react"
import { apiClient } from "@/lib/api"

const FALLBACK_LEADER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDeT3DgP9GBa-8_WPtOyF4fpP3Bk5K4s3L-t5tAmczcpUOhso8Lhpxb-9WEFGlwXz-6dswO5UlKzukxk3RlRV8myoR2guE7SrjPbiOjdchT6cHb7h8Ju9DXI1M1PW2EvVRqAd3bXbvEruz9_le2SFQFHYnH_75lfjqI38pfjNTeGg6QwZM-F2PCA-jlzEzShJk0-CPZy-GSO6oah6M3YFpfse0K20kkeTqcf-nFSlGJVmY47qGA-JFioMxr8KikuAbYgXNnPAJ1XA"

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

function getNextOccurrence(dayName: string): Date {
  const today = new Date()
  const target = DAY_INDEX[dayName] ?? 0
  const diff = (target + 7 - today.getDay()) % 7 || 7
  const next = new Date(today)
  next.setDate(today.getDate() + diff)
  return next
}

function getPastOccurrences(dayName: string, count: number): Date[] {
  const target = DAY_INDEX[dayName] ?? 0
  const results: Date[] = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - 1)
  while (results.length < count) {
    if (cursor.getDay() === target) results.push(new Date(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return results
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-28 h-28 text-2xl",
  }[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#1A3A6E]/15 flex items-center justify-center font-bold text-[#1A3A6E] flex-shrink-0`}
    >
      {initials || "?"}
    </div>
  )
}

export function CellGroupsScreen() {
  const [cellGroup, setCellGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState("")
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: "accept" | "reject"; requestId: string; userName: string } | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const resolveAvatar = (img?: string | null) => {
    if (!img) return null
    if (img.startsWith("http")) return img
    if (img.startsWith("/uploads/")) return `${uploadsBaseUrl}${img}`
    return `${uploadsBaseUrl}/uploads/${img}`
  }

  useEffect(() => {
    apiClient
      .getProfile()
      .then(async (res) => {
        const user = res?.user
        if (!user) return
        setCurrentUser(user)

        if (user.id) {
          apiClient.getAttendanceStats(user.id).then(setAttendanceStats).catch(() => {})
          apiClient
            .getUserAttendance(user.id)
            .then((r) => setAttendanceHistory((r?.attendance || []).slice(0, 3)))
            .catch(() => {})
        }

        let cellGroupId = user.cellGroupId

        if (!cellGroupId) {
          // Check if the user leads a cell group
          const allRes = await apiClient.getCellGroups()
          const allGroups: any[] = allRes?.cellGroups || allRes || []
          const led = allGroups.find((cg: any) => cg.leaderId === user.id)
          if (led) cellGroupId = led.id
        }

        if (cellGroupId) {
          const [cgRes, membersRes] = await Promise.all([
            apiClient.getCellGroup(cellGroupId),
            apiClient.getCellGroupMembers(cellGroupId),
          ])
          const cg = cgRes?.cellGroup || cgRes
          setCellGroup(cg)
          setMembers(membersRes?.members || [])
          // Load pending join requests if this user is the cell leader
          if (cg?.leaderId === user.id) {
            apiClient
              .getCellJoinRequests(cellGroupId)
              .then((r) => setJoinRequests(r?.requests || []))
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const leader = useMemo(() => {
    if (!cellGroup?.leaderId) return null
    const fromMembers = members.find((m) => m.id === cellGroup.leaderId)
    if (fromMembers) return fromMembers
    // Cell leader may not appear in the members list if their cellGroupId isn't set
    if (currentUser?.id === cellGroup.leaderId) return currentUser
    return null
  }, [cellGroup, members, currentUser])

  const nextMeeting = useMemo(
    () => (cellGroup?.meetingDay ? getNextOccurrence(cellGroup.meetingDay) : null),
    [cellGroup],
  )

  const pastMeetings = useMemo(
    () => (cellGroup?.meetingDay ? getPastOccurrences(cellGroup.meetingDay, 3) : []),
    [cellGroup],
  )

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const q = memberSearch.toLowerCase()
    return members.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q),
    )
  }, [members, memberSearch])

  const isLeaderOfThisCell = cellGroup && currentUser && cellGroup.leaderId === currentUser.id

  const handleConfirm = async () => {
    if (!confirmAction) return
    const { type, requestId } = confirmAction
    setConfirmAction(null)
    setRespondingId(requestId)
    setRequestError(null)
    try {
      if (type === "accept") {
        await apiClient.acceptCellJoinRequest(requestId)
        setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
        if (cellGroup?.id) {
          apiClient.getCellGroupMembers(cellGroup.id).then((r) => setMembers(r?.members || [])).catch(() => {})
        }
      } else {
        await apiClient.rejectCellJoinRequest(requestId)
        setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      }
    } catch (err: any) {
      setRequestError(
        err?.message || `Failed to ${type} request. Please try again.`
      )
    } finally {
      setRespondingId(null)
    }
  }

  const attendanceRate = attendanceStats?.attendanceRate
    ? `${Math.round(attendanceStats.attendanceRate)}%`
    : "—"

  const leaderName = leader
    ? `${leader.firstName} ${leader.lastName}`
    : "Cell Leader"

  const leaderAvatar = leader ? resolveAvatar(leader.profileImage) : FALLBACK_LEADER

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-white rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 h-80 bg-white rounded-xl" />
          <div className="md:col-span-8 h-80 bg-white rounded-xl" />
          <div className="md:col-span-12 h-60 bg-white rounded-xl" />
        </div>
      </div>
    )
  }

  // ── No cell group assigned ────────────────────────────────────────────────
  if (!cellGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[#1A3A6E]/10 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-[#1A3A6E]/40" />
        </div>
        <h3 className="text-lg font-bold text-[#0A1F44] mb-1">No Cell Group Assigned</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          You haven't been assigned to a cell group yet. Please contact the church office for assistance.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="inline-block bg-[#a5c1fe] text-[#314e83] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            Member Portal
          </span>
          <h1 className="text-2xl font-bold text-[#0A1F44] mb-1.5 sm:text-3xl">My Cell Group</h1>
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin className="h-4 w-4 text-[#415e94] flex-shrink-0" />
            <p className="text-base font-medium">
              {cellGroup.name}
              {cellGroup.address ? ` • ${cellGroup.address}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={leader?.phoneNumber ? `mailto:${leader?.email}` : "#"}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#415e94] px-5 py-2.5 text-sm font-bold text-[#415e94] transition-colors hover:bg-[#415e94]/5"
          >
            <Mail className="h-4 w-4 shrink-0" />
            Contact Leadership
          </a>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-[#0A1F44] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#0A1F44]/90">
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            Request Move
          </button>
        </div>
      </div>

      {/* ── Bento Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Cell Leader Card */}
        <div className="md:col-span-4 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200/50 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={leaderAvatar || FALLBACK_LEADER}
              alt={leaderName}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#415e94]/20 p-0.5"
            />
            <span className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-[3px] border-white" />
          </div>
          <h3 className="text-xl font-bold text-[#0A1F44] mb-0.5">{leaderName}</h3>
          <p className="text-sm text-gray-500 mb-5">Cell Leader &amp; Mentor</p>

          <div className="w-full space-y-2.5">
            <a
              href={leader?.phoneNumber ? `tel:${leader.phoneNumber}` : "#"}
              className="w-full py-2.5 bg-[#1E5EC8] text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-sm hover:bg-[#1A3A6E] transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call Leader
            </a>
            <a
              href={leader?.email ? `mailto:${leader.email}` : "#"}
              className="w-full py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </a>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 w-full text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Announcements
            </p>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "Don't forget to bring your Bible and a heart ready to receive."
            </p>
          </div>
        </div>

        {/* Right column: Next Meeting + Attendance side by side */}
        <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Next Meeting card */}
          <div className="bg-[#0A1F44] text-white rounded-xl p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
              <svg className="w-28 h-28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#b4c6f4] mb-4">
              Next Meeting
            </p>
            {nextMeeting ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-black">
                    {nextMeeting.getDate()}
                  </span>
                  <span className="text-2xl font-bold">
                    {nextMeeting.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                  </span>
                </div>
                <p className="text-lg font-semibold mb-6">
                  {cellGroup.meetingDay} @ {cellGroup.meetingTime}
                </p>
              </>
            ) : (
              <p className="text-lg mb-6">Schedule not set</p>
            )}

            <div className="space-y-3 relative z-10">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-[#a5c1fe] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">
                    {cellGroup.address || "Location TBD"}
                  </p>
                </div>
              </div>
              {cellGroup.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cellGroup.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#a5c1fe] font-bold text-sm hover:underline"
                >
                  Get Directions
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200/50">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-semibold text-[#0A1F44] text-base">Attendance History</h4>
              {attendanceStats?.attendanceRate != null && (
                <span className="text-[11px] bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                  {attendanceRate} Consistency
                </span>
              )}
            </div>

            <div className="space-y-3">
              {attendanceHistory.length > 0
                ? attendanceHistory.map((rec: any, i) => {
                    const isPresent = rec.status === "present" || rec.status === "late"
                    const dateLabel = rec.serviceDate
                      ? new Date(rec.serviceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${!isPresent ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${isPresent ? "bg-green-500" : "bg-red-500"}`}
                          >
                            {isPresent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {rec.eventTitle || `${dateLabel} Service`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{rec.status}</span>
                      </div>
                    )
                  })
                : pastMeetings.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} Meeting
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">Present</span>
                    </div>
                  ))}
            </div>

            <button className="w-full mt-5 text-sm text-[#415e94] font-bold hover:underline">
              View Full Record
            </button>
          </div>
        </div>

        {/* Join Requests Panel — visible to cell leader only */}
        {isLeaderOfThisCell && (
          <div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-[#1A3A6E]" />
                <h3 className="text-base font-bold text-[#0A1F44]">Join Requests</h3>
                {joinRequests.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E5EC8] text-[10px] font-bold text-white">
                    {joinRequests.length}
                  </span>
                )}
              </div>
            </div>
            {requestError && (
              <div className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {requestError}
              </div>
            )}

            {joinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No pending join requests</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {joinRequests.map((req) => {
                  const fullName = `${req.user.firstName} ${req.user.lastName}`
                  const avatar = req.user.profileImage
                    ? req.user.profileImage.startsWith("http")
                      ? req.user.profileImage
                      : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "")}${req.user.profileImage.startsWith("/") ? "" : "/"}${req.user.profileImage}`
                    : null
                  const isBusy = respondingId === req.id

                  return (
                    <li key={req.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={avatar} name={fullName} size="md" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0A1F44] truncate">{fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{req.user.email}</p>
                          {req.user.phoneNumber && (
                            <p className="text-xs text-gray-400">{req.user.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmAction({ type: "accept", requestId: req.id, userName: fullName })}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {isBusy && respondingId === req.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: "reject", requestId: req.id, userName: fullName })}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Members Table */}
        <div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-4 sm:p-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-lg font-bold text-[#0A1F44] sm:text-xl">Cell Members</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                You are connected with {members.length} {members.length === 1 ? "person" : "others"} in this group.
              </p>
            </div>
            <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-[#415e94] focus-within:ring-2 focus-within:ring-[#415e94]/20 md:w-auto">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full min-w-0 border-none bg-transparent text-sm outline-none focus:ring-0 md:w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#0A1F44] text-white text-[11px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      {memberSearch ? "No members match your search." : "No members found."}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isLeader = member.id === cellGroup.leaderId
                    const fullName = `${member.firstName} ${member.lastName}`
                    const avatar = resolveAvatar(member.profileImage)
                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-blue-50/40 transition-colors ${isLeader ? "bg-blue-50/20" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={avatar} name={fullName} size="md" />
                            <div>
                              <p className="font-bold text-[#0A1F44] text-sm">{fullName}</p>
                              <p className="text-xs text-gray-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">
                            {isLeader ? "Cell Leader" : "Member"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {member.phoneNumber || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold uppercase">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={member.email ? `mailto:${member.email}` : "#"}
                            className="inline-flex p-2 hover:bg-gray-100 rounded-full text-[#415e94] transition-colors"
                            title="Send email"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${confirmAction.type === "accept" ? "bg-emerald-100" : "bg-red-100"}`}>
              {confirmAction.type === "accept"
                ? <UserCheck className="h-5 w-5 text-emerald-600" />
                : <UserX className="h-5 w-5 text-red-500" />
              }
            </div>
            <h3 className="mt-3 text-base font-bold text-[#0A1F44]">
              {confirmAction.type === "accept" ? "Accept Join Request?" : "Decline Join Request?"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {confirmAction.type === "accept"
                ? <><span className="font-semibold text-gray-700">{confirmAction.userName}</span> will be added to your cell group.</>
                : <>Are you sure you want to decline <span className="font-semibold text-gray-700">{confirmAction.userName}</span>&apos;s request?</>
              }
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white transition-colors ${
                  confirmAction.type === "accept"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {confirmAction.type === "accept" ? "Yes, Accept" : "Yes, Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
