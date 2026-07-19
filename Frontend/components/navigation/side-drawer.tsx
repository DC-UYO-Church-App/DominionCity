"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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

interface SideDrawerProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function SideDrawer({ isOpen, setIsOpen }: SideDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()

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
    // In a real app, we would handle logout logic
    router.push("/")
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-church-gold flex items-center justify-center mr-2">
              <span className="text-xs font-bold text-church-navy">GH</span>
            </div>
            Dominion City Church
          </SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 mb-2"></div>
            <h3 className="font-semibold">John Doe</h3>
            <p className="text-xs text-muted-foreground">Member</p>
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

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50"
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
