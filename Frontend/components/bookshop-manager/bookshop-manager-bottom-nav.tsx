"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LayoutDashboard } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard/bookshop-manager", icon: LayoutDashboard },
  { label: "Books", href: "/dashboard/bookshop-manager/books", icon: BookOpen },
]

export function BookshopManagerBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-900/70 px-4 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur sm:bottom-4 sm:w-[90%]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-white" : "text-white/70"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
