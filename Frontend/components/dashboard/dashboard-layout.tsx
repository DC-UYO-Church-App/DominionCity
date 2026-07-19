"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import { SideDrawer } from "@/components/navigation/side-drawer"
import { Button } from "@/components/ui/button"
import { Menu, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const navLinks = [
    { label: "Giving", href: "/dashboard/giving" },
    { label: "Projects", href: "/dashboard/projects" },
    { label: "Programs", href: "/dashboard/programs" },
    { label: "Activities", href: "/dashboard/activities" },
  ]

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      router.replace("/login")
      return
    }

    apiClient
      .getProfile()
      .then((response) => {
        setProfile(response?.user || null)
        setIsCheckingAuth(false)
      })
      .catch(() => {
        apiClient.clearToken()
        router.replace("/login")
      })
  }, [router])

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const profileImage = (() => {
    const value = profile?.profileImage
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  })()

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#EFF6FF]" />
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#EFF6FF] text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white">
        <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(true)} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <div className="flex items-center">
          <img src="/logo.png" alt="Dominion City" className="h-8 w-auto mr-2" />
          <h1 className="text-lg font-bold text-slate-900">Golden Heart</h1>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#1E5EC8] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#1A3A6E]"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

        <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
          <div
            onMouseEnter={() => setIsProfileMenuOpen(true)}
            onMouseLeave={() => setIsProfileMenuOpen(false)}
          >
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border border-slate-200 p-1 hover:bg-slate-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profileImage || ""} alt={profile?.firstName || "Profile"} />
                  <AvatarFallback>{profile?.firstName?.slice(0, 1) || "U"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  apiClient.logout()
                  router.replace("/login")
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </div>
        </DropdownMenu>
        </div>
      </header>

      {/* Side Drawer (Mobile) */}
      <SideDrawer isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="w-[80%] mx-auto py-6">{children}</div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
