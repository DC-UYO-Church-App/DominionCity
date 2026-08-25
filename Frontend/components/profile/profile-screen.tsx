"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Edit,
  Camera,
  CheckCircle,
  Lock,
  Medal,
  GraduationCap,
  Mail,
  Calendar,
  Users,
  Music,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function ProfileScreen() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [user, setUser] = useState({
    firstName: "Member",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    cellGroup: "",
    role: "member",
    joinDate: "",
    department: "",
    avatar: "",
  })

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  })

  useEffect(() => {
    apiClient
      .getProfile()
      .then((response) => {
        const profile = response?.user
        if (!profile) return
        const resolvedAvatar = (() => {
          const v = profile.profileImage
          if (!v) return ""
          if (v.startsWith("http")) return v
          if (v.startsWith("/uploads/")) return `${uploadsBaseUrl}${v}`
          if (v.startsWith("uploads/")) return `${uploadsBaseUrl}/${v}`
          return `${uploadsBaseUrl}/uploads/${v}`
        })()
        const data = {
          firstName: profile.firstName || "Member",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phoneNumber || "",
          address: profile.address || "",
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
          cellGroup: profile.cellGroupId || "",
          role: profile.role || "member",
          joinDate: profile.joinDate
            ? new Date(profile.joinDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "",
          department: profile.departmentId || "",
          avatar: resolvedAvatar,
        }
        setUser(data)
        setDraft({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
        })
      })
      .catch(() => {})
  }, [uploadsBaseUrl])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG or PNG images are allowed.", variant: "destructive" })
      return
    }
    try {
      const res = await apiClient.uploadProfileImage(file)
      const raw = res?.imageUrl || res?.user?.profileImage
      const url = raw?.startsWith("/uploads/") ? `${uploadsBaseUrl}${raw}` : raw
      if (url) setUser((prev) => ({ ...prev, avatar: url }))
      toast({ title: "Profile updated", description: "Your profile picture has been updated." })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await apiClient.updateProfile({
        firstName: draft.firstName,
        lastName: draft.lastName,
        phoneNumber: draft.phone,
        address: draft.address,
        dateOfBirth: draft.dateOfBirth || undefined,
      })
      const u = res?.user
      setUser((prev) => ({
        ...prev,
        firstName: u?.firstName || draft.firstName,
        lastName: u?.lastName || draft.lastName,
        phone: u?.phoneNumber || draft.phone,
        address: u?.address || draft.address,
        dateOfBirth: u?.dateOfBirth ? u.dateOfBirth.split("T")[0] : draft.dateOfBirth,
      }))
      setIsEditing(false)
      toast({ title: "Profile saved", description: "Your changes have been saved." })
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Save failed",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const fullName = useMemo(() => `${user.firstName} ${user.lastName}`.trim(), [user.firstName, user.lastName])

  const initials = useMemo(() => {
    const parts = fullName.split(" ").filter(Boolean)
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.[0] || "U"
  }, [fullName])

  const roleLabel = user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const programs = [
    { name: "DCA Basic", completed: false, date: "" },
    { name: "DCA Advance", completed: false, date: "" },
    { name: "Encounter", completed: false, date: "" },
    { name: "DLI Basic", completed: false, date: "" },
    { name: "DLI Advance", completed: false, date: "" },
  ]

  const inputClass = (editing: boolean) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm transition-all ${
      editing
        ? "bg-white border-gray-300 text-gray-900 focus:border-[#415e94] focus:ring-2 focus:ring-[#415e94]/10"
        : "bg-gray-50 border-gray-200 text-gray-500 cursor-default"
    }`

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
        <Link href="/dashboard" className="hover:text-[#1A3A6E] transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#1A3A6E]">Profile Settings</span>
      </nav>

      {/* Profile Header */}
      <section className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="h-28 bg-[#0a1f44] w-full" />
        <div className="relative -mt-14 flex flex-col items-start gap-4 px-4 pb-6 sm:px-6 md:flex-row md:items-end">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            <div className="w-28 h-28 rounded-full border-4 border-white ring-4 ring-[#0a1f44]/10 overflow-hidden bg-gray-100 shadow-md">
              {user.avatar ? (
                <img src={user.avatar} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1A3A6E] text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-1 right-1 bg-[#415e94] text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name & meta */}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="break-words text-xl font-bold text-[#00081e] sm:text-2xl">{fullName}</h2>
              <span className="inline-flex items-center px-3 py-0.5 bg-[#a5c1fe]/30 text-[#28467b] text-xs rounded-full font-bold tracking-wide w-fit">
                {roleLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {user.joinDate ? `Active since ${user.joinDate}` : "Dominion City Uyo"} &bull; Uyo Central Branch
            </p>
          </div>

          {/* Edit / Save buttons */}
          <div className="pb-1 w-full md:w-auto">
            {!isEditing ? (
              <button
                onClick={() => {
                  setDraft({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    address: user.address,
                    dateOfBirth: user.dateOfBirth,
                  })
                  setIsEditing(true)
                }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0a1f44] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 md:flex-none px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-[#0a1f44] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Personal Information */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 p-4 sm:p-6 h-full">
            <h3 className="text-lg font-bold text-[#0a1f44] mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#a5c1fe]/30 flex items-center justify-center">
                <Edit className="h-3.5 w-3.5 text-[#415e94]" />
              </div>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  label: "First Name",
                  type: "text",
                  value: isEditing ? draft.firstName : user.firstName,
                  onChange: (v: string) => setDraft((d) => ({ ...d, firstName: v })),
                },
                {
                  label: "Last Name",
                  type: "text",
                  value: isEditing ? draft.lastName : user.lastName,
                  onChange: (v: string) => setDraft((d) => ({ ...d, lastName: v })),
                },
                {
                  label: "Phone Number",
                  type: "tel",
                  value: isEditing ? draft.phone : user.phone,
                  onChange: (v: string) => setDraft((d) => ({ ...d, phone: v })),
                },
                {
                  label: "Home Address",
                  type: "text",
                  value: isEditing ? draft.address : user.address,
                  onChange: (v: string) => setDraft((d) => ({ ...d, address: v })),
                },
                {
                  label: "Date of Birth",
                  type: "date",
                  value: isEditing ? draft.dateOfBirth : user.dateOfBirth,
                  onChange: (v: string) => setDraft((d) => ({ ...d, dateOfBirth: v })),
                },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#1A3A6E] uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={!isEditing}
                    className={inputClass(isEditing)}
                  />
                </div>
              ))}
            </div>

            {/* Account & Ministry Details */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="font-semibold text-[#0a1f44] mb-4 text-sm">Account &amp; Ministry Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                {[
                  { Icon: Mail, label: "Email Address", value: user.email || "—" },
                  { Icon: Calendar, label: "Join Date", value: user.joinDate || "—" },
                  { Icon: Music, label: "Ministry Department", value: user.department || "Not assigned" },
                  { Icon: Users, label: "Cell Group", value: user.cellGroup || "Not assigned" },
                ].map(({ Icon, label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-[#415e94] flex-shrink-0" />
                      <p className="text-sm text-[#00081e] font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Academy Progress */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100 p-4 sm:p-6 h-full">
            <h3 className="text-lg font-bold text-[#0a1f44] mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#a5c1fe]/30 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-[#415e94]" />
              </div>
              Academy Progress
            </h3>
            <div className="space-y-3">
              {programs.map((program) =>
                program.completed ? (
                  <div
                    key={program.name}
                    className="flex items-center gap-3 p-3 bg-[#a5c1fe]/10 border border-[#a5c1fe]/30 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-[#a5c1fe] flex items-center justify-center rounded-full shadow-sm flex-shrink-0">
                      <Medal className="h-6 w-6 text-[#28467b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#00081e] text-sm">{program.name}</p>
                      <p className="text-xs text-[#28467b]">
                        Completed{program.date ? ` • ${program.date}` : ""}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-[#415e94] flex-shrink-0" />
                  </div>
                ) : (
                  <div
                    key={program.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60 grayscale"
                  >
                    <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-full flex-shrink-0">
                      <GraduationCap className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-500 text-sm">{program.name}</p>
                      <p className="text-xs text-gray-400">Not started</p>
                    </div>
                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Logout */}
      <button
        onClick={() => {
          apiClient.logout()
          router.replace("/login")
        }}
        className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-red-50 transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
          <LogOut className="h-4 w-4 text-red-600" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-red-600 text-sm">Logout</p>
          <p className="text-xs text-gray-400">Sign out of your account</p>
        </div>
      </button>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 pb-4">
        © 2024 Dominion City Uyo. All spiritual and administrative data secured.
      </p>
    </div>
  )
}
