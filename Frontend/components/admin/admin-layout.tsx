"use client"

import { ReactNode, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Church,
  CreditCard,
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

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <div className="flex">
        <aside className="hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
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
                    <item.icon className="h-4 w-4" />
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
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto px-4 pb-6">
            <nav className="space-y-1">
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-lg border border-slate-200 p-2 lg:hidden">
                <Menu className="h-4 w-4 text-slate-600" />
              </button>
              <div className="relative w-72 max-w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-600"
                  placeholder="Search"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-500" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff5b5b] text-[10px] font-semibold text-white">
                  6
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
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
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="text-sm">
                  <p className="font-semibold">Moni Roy</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </header>

          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
