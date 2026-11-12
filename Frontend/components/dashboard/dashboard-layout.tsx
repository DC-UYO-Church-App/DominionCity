"use client"

/* The member-area shell: persistent rail on desktop, drawer + tab bar on
   phones, one calm top bar in between. See dashboard-ui.css for the design
   system and nav.ts for the destinations — this file only assembles them. */

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Bell, LogOut, Menu } from "lucide-react"
import { RoleDashboardButton } from "./role-dashboard-button"

import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import { SideDrawer } from "@/components/navigation/side-drawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api"
import { navGroups, titleFor } from "./nav"
import { NavGroupSection } from "./nav-group-section"
import "./dashboard-ui.css"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname() || "/dashboard"

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

  // Keep the bell badge in step. Re-checked on every navigation so opening the
  // notifications page (which marks items read) clears the dot on the way back.
  useEffect(() => {
    apiClient
      .getUnreadNotificationCount()
      .then((r) => setUnreadCount(r?.count || 0))
      .catch(() => setUnreadCount(0))
  }, [pathname])

  /* The drawer belongs to phones and tablets. If the viewport grows into rail
     territory while it is open, close it outright — hiding just the panel in
     CSS leaves the sheet's overlay dimming and blocking the page behind it. */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => {
      if (mq.matches) setIsDrawerOpen(false)
    }
    closeOnDesktop()
    mq.addEventListener("change", closeOnDesktop)
    return () => mq.removeEventListener("change", closeOnDesktop)
  }, [])

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

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U"
  const roleLabel = (profile?.role || "member")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const logout = () => {
    apiClient.logout()
    router.replace("/login")
  }

  if (isCheckingAuth) return <div className="dash" />

  return (
    <div className="dash">
      <div className="dash__shell">
        {/* ---- Desktop rail ---- */}
        <aside className="dash-rail dash-rail--aside" aria-label="Dashboard">
          <Link href="/dashboard" className="dash-rail__brand">
            <img src="/logo.png" alt="" />
            <span className="dash-rail__wordmark">
              <span className="dash-rail__name">Dominion City</span>
              <span className="dash-rail__sub">Uyo HQ</span>
            </span>
          </Link>

          <nav className="flex-1">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} pathname={pathname} />
            ))}
          </nav>

          <div className="dash-rail__foot">
            <button type="button" onClick={logout} className="dash-rail__link w-full text-left">
              <LogOut />
              Log out
            </button>
          </div>
        </aside>

        {/* ---- Main column ---- */}
        <div className="dash__main">
          <header className="dash-top">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="dash-icon-btn dash-only-mobile"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="dash-top__title">{titleFor(pathname)}</h1>
            <span className="dash-top__spacer" />

            {/* Renders nothing for a member with no role dashboard of their own. */}
            <RoleDashboardButton />

            <Link href="/dashboard/notifications" className="dash-icon-btn" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="dash-icon-btn__dot" />}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="dash-icon-btn" aria-label="Account">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileImage || ""} alt="" />
                    <AvatarFallback className="bg-[var(--dash-surface-2)] text-[var(--accent-ink)] text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <span className="block font-semibold">{fullName || "Member"}</span>
                  <span className="block text-xs text-[var(--text-soft)]">{roleLabel}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/face")}>Face ID</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
                {/* Only the technical team and super admins see the technical area. */}
                {(profile?.role === "technical" || profile?.role === "super_admin") && (
                  <DropdownMenuItem onClick={() => router.push("/dashboard/technical")}>
                    Technical dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="dash__content">{children}</main>
        </div>
      </div>

      <SideDrawer
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        profile={profile}
        profileImage={profileImage}
      />
      <BottomNavigation />
    </div>
  )
}
