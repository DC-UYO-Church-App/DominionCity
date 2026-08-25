"use client"

import { Home, Users, MessageSquare, CheckSquare, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Attendance",
      href: "/dashboard/attendance",
      icon: CheckSquare,
    },
    {
      name: "Sermons",
      href: "/dashboard/sermons",
      icon: MessageSquare,
    },
    {
      name: "Cell Groups",
      href: "/dashboard/cell-groups",
      icon: Users,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ]

  return (
    <div
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 sm:bottom-4 sm:w-[92%]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="flex h-16 rounded-2xl border border-slate-900/10 bg-slate-900 shadow-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5",
                isActive ? "text-white" : "text-white/70 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-center text-[10px] leading-tight sm:text-xs">
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
