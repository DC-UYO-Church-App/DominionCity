"use client"

/* Phone tab bar — five thumb-reachable destinations, floating clear of the
   home indicator. Hidden from 1024px up, where the rail takes over. Skin lives
   in dashboard-ui.css (.dash-tabs); destinations in dashboard/nav.ts. */

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActive, tabItems } from "@/components/dashboard/nav"

export function BottomNavigation() {
  const pathname = usePathname() || "/dashboard"

  return (
    <nav className="dash-tabs" aria-label="Sections">
      {tabItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="dash-tabs__link"
          aria-current={isActive(item.href, pathname) ? "page" : undefined}
        >
          <item.icon />
          <span className="dash-tabs__label">{item.name}</span>
        </Link>
      ))}
    </nav>
  )
}
