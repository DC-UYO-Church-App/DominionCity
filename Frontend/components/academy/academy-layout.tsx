"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Users2,
} from "lucide-react"

/* Overview and Tracks shape the whole academy, so they belong to the admin.
   A coordinator sees only the cohorts they run. */
const ADMIN_NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard/academy" },
  { icon: Layers, label: "Tracks", href: "/dashboard/academy/tracks" },
  { icon: Users2, label: "Cohorts", href: "/dashboard/academy/cohorts" },
]

const STAFF_NAV = [{ icon: Users2, label: "My cohorts", href: "/dashboard/academy/cohorts" }]

/**
 * Shell for the admin dashboard, shared with cohort staff.
 *
 * Entry is granted two ways: the admin role, which owns the whole academy, or
 * a staff grant on at least one cohort. A coordinator normally holds no
 * elevated role, so checking the role alone would shut them out of the very
 * cohort they were appointed to run.
 *
 * This is a convenience guard. Every academy route re-checks authority on the
 * server, and the admin-only navigation is simply not shown to staff.
 */
export function AcademyLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [canManageAll, setCanManageAll] = useState(false)

  useEffect(() => {
    apiClient
      .getAcademyAccess()
      .then((response) => {
        if (!response?.hasAccess) {
          router.replace("/dashboard")
          return
        }
        setCanManageAll(Boolean(response.canManageAll))
        setIsChecking(false)
      })
      .catch(() => router.replace("/dashboard"))
  }, [router])

  useEffect(() => {
    setIsNavOpen(false)
  }, [pathname])

  const navBody = (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A3A6E] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0E1330]">Academy</p>
          <p className="text-[11px] text-slate-400">
            {canManageAll ? "Admin dashboard" : "Coordinator"}
          </p>
        </div>
      </div>
      <div className="px-4">
        <nav className="space-y-1">
          {(canManageAll ? ADMIN_NAV : STAFF_NAV).map((item) => {
            // Overview is an exact match; the others own their subtrees.
            const isActive =
              item.href === "/dashboard/academy"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#1A3A6E] font-semibold text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto px-4 pb-6">
        <button
          type="button"
          onClick={() => {
            apiClient.logout()
            router.replace("/login")
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  )

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <p className="text-sm text-slate-400">Checking access...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{navBody}</aside>

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Academy navigation</SheetTitle>
          <div className="flex h-full flex-col">{navBody}</div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">Academy</span>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
