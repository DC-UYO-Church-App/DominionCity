"use client"

/* Phone/tablet drawer — the rail's contents in a sheet, same groups and same
   order, so moving between a phone and a laptop never means relearning where
   anything lives. */

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isActive, navGroups } from "@/components/dashboard/nav"
import { apiClient } from "@/lib/api"

interface SideDrawerProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  /* The layout has already fetched these; passing them down avoids a second
     request and a fourth copy of the upload-URL resolution. */
  profile?: any | null
  profileImage?: string | null
}

export function SideDrawer({ isOpen, setIsOpen, profile, profileImage }: SideDrawerProps) {
  const pathname = usePathname() || "/dashboard"
  const router = useRouter()

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U"
  const roleLabel = (profile?.role || "member")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const handleLogout = () => {
    apiClient.logout()
    setIsOpen(false)
    router.replace("/login")
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* The skin comes from `.dash-rail`, the drawer layout from
          `.dash-rail--drawer`. No inline `display` here: it would outrank every
          responsive rule and was what kept the drawer alive on desktop. */}
      <SheetContent side="left" className="dash-rail dash-rail--drawer w-[300px] sm:w-[320px]">
        <SheetHeader className="shrink-0 px-4 pt-4 pb-3">
          <SheetTitle asChild>
            <span className="dash-rail__brand !p-0">
              <img src="/logo.png" alt="" />
              <span className="dash-rail__wordmark">
                <span className="dash-rail__name">Dominion City</span>
                <span className="dash-rail__sub">Uyo HQ</span>
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Who you are, before what you can do — the drawer is the one place a
            member sees their own name and role on a phone. */}
        <div className="flex shrink-0 items-center gap-3 border-y border-[var(--line-invert)] px-4 py-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={profileImage || ""} alt="" />
            <AvatarFallback className="bg-[rgba(247,242,231,0.12)] text-sm font-semibold text-[var(--accent)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--text-invert)]">
              {fullName || "Member"}
            </span>
            <span className="dash-rail__sub">{roleLabel}</span>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <div className="dash-rail__group" key={group.label}>
              <p className="dash-rail__label">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="dash-rail__link"
                  aria-current={isActive(item.href, pathname) ? "page" : undefined}
                >
                  <item.icon />
                  {item.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          className="shrink-0 border-t border-[var(--line-invert)] px-3 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button type="button" onClick={handleLogout} className="dash-rail__link w-full text-left">
            <LogOut />
            Log out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
