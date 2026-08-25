"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Church,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  Search,
  Settings,
  Users,
  Users2,
} from "lucide-react"

type AdminLayoutProps = {
  children: ReactNode
}

const primaryNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/admin" },
  { icon: BookOpen, label: "Sermons", href: "/dashboard/admin/sermons" },
  { icon: HandCoins, label: "Giving", href: "/dashboard/admin/giving" },
  { icon: FolderKanban, label: "Projects", href: "/dashboard/admin/projects" },
  { icon: CalendarDays, label: "Programs", href: "/dashboard/admin/programs" },
  { icon: Users2, label: "Departments", href: "/dashboard/admin/community" },
  { icon: BookOpen, label: "Book Shop", href: "/dashboard/admin/book-shop" },
]

const secondaryNav = [
  { icon: Repeat, label: "Weekly Activities", href: "/dashboard/admin/activities" },
  { icon: Church, label: "Satellite Churches", href: "/dashboard/admin/satellite-churches" },
  { icon: CalendarDays, label: "Events", href: "/dashboard/admin/events" },
  { icon: Users, label: "Team", href: "/dashboard/admin/team" },
  { icon: Users2, label: "Cells", href: "/dashboard/admin/cells" },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)

  const handleLogout = () => {
    apiClient.logout()
    router.replace("/super-admin/login")
  }

  useEffect(() => {
    apiClient
      .getProfile()
      .then((response) => {
        if (response?.user?.role !== "super_admin") {
          router.replace("/dashboard")
        }
      })
      .catch(() => {
        router.replace("/login")
      })
  }, [router])

  // Close the mobile drawer whenever navigation lands on a new page.
  useEffect(() => {
    setIsNavOpen(false)
  }, [pathname])

  /* One nav body, rendered twice: inside the static desktop rail and inside
     the mobile drawer. Keeping it in a single place means the two can't drift. */
  const navBody = (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <img src="/logo.png" alt="Dominion City" className="h-8 w-auto" />
        <span className="text-sm font-semibold text-[#0E1330]">Dominion City</span>
      </div>
      <div className="px-4">
        <p className="px-3 text-xs font-semibold uppercase text-slate-400">Menu</p>
        <nav className="mt-3 space-y-1">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-[#3c6eea] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-6 px-4">
        <p className="px-3 text-xs font-semibold uppercase text-slate-400">Pages</p>
        <nav className="mt-3 space-y-1">
          {secondaryNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-[#3c6eea] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-6 px-4 pb-6 lg:mt-auto">
        <nav className="space-y-1">
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </nav>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
          {navBody}
        </aside>

        {/* Same nav in a drawer for tablet and phone, where the rail is hidden */}
        <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
          <SheetContent side="left" className="w-[280px] overflow-y-auto p-0 lg:hidden">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            {navBody}
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="shrink-0 rounded-lg border border-slate-200 p-2 lg:hidden"
              >
                <Menu className="h-4 w-4 text-slate-600" />
                <span className="sr-only">Open navigation</span>
              </button>
              <div className="relative w-full max-w-xs sm:max-w-sm lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-600"
                  placeholder="Search"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-500" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff5b5b] text-[10px] font-semibold text-white">
                  6
                </span>
              </div>
              {/* Language picker and the name/role block are secondary — they
                  drop away before they can crowd out the search field. */}
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 xl:flex">
                <img
                  src="https://flagcdn.com/w40/gb.png"
                  alt="English"
                  className="h-4 w-6 rounded-sm object-cover"
                />
                English
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/48?img=47"
                  alt="Admin"
                  className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                />
                <div className="hidden text-sm md:block">
                  <p className="font-semibold">Moni Roy</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 md:block" />
              </div>
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
