"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Bell,
  BookOpen,
  LogOut,
  Headphones,
  Users,
  Home,
  CheckSquare,
  MessageSquare,
  User,
  HandCoins,
  FolderKanban,
  CalendarDays,
  Repeat,
  Church,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
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
  const pathname = usePathname()
  const router = useRouter()

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U"
  const roleLabel = (profile?.role || "member")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const mainNavItems = [
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
      name: "Messages",
      href: "/dashboard/messages",
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

  const drawerNavItems = [
    {
      name: "Giving",
      href: "/dashboard/giving",
      icon: HandCoins,
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      name: "Programs",
      href: "/dashboard/programs",
      icon: CalendarDays,
    },
    {
      name: "Weekly Activities",
      href: "/dashboard/activities",
      icon: Repeat,
    },
    {
      name: "Satellite Churches",
      href: "/dashboard/satellite",
      icon: Church,
    },
    {
      name: "Sermons",
      href: "/dashboard/sermons",
      icon: Headphones,
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  const handleLogout = () => {
    apiClient.logout()
    setIsOpen(false)
    router.replace("/login")
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="flex w-[280px] flex-col p-0 sm:w-[300px]">
        <SheetHeader className="shrink-0 border-b p-4">
          <SheetTitle className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-church-gold flex items-center justify-center mr-2">
              <span className="text-xs font-bold text-church-navy">GH</span>
            </div>
            Dominion City Church
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-6 flex flex-col items-center text-center">
            <Avatar className="mb-2 h-20 w-20">
              <AvatarImage src={profileImage || ""} alt={fullName || "Profile"} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <h3 className="break-words font-semibold">{fullName || "Member"}</h3>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>

          <div className="space-y-1 mb-6">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              )
            })}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            {drawerNavItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        <div
          className="shrink-0 border-t p-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
