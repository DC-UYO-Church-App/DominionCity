/* ============================================================================
   DASHBOARD NAVIGATION — one source of truth
   ----------------------------------------------------------------------------
   The rail, the phone tab bar, the drawer and the top-bar page title all read
   from this file, so a destination can never again exist in one navigation and
   be missing from another. (Before this, Attendance, Sermons, Cell Groups and
   Profile were reachable only from the mobile drawer and the phone tab bar —
   on a laptop they had no link at all.)

   The grouping follows how a member actually thinks about church life rather
   than how the database is organised: what is happening, who I belong to, what
   I give, how I grow, and my own account.
   ========================================================================== */
import {
  Bell, BookOpen, CalendarDays, Church, CheckSquare, FolderKanban, HandCoins,
  Home, MessageSquare, Repeat, Settings, Sparkles, User, Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Shown as the top-bar page title; defaults to `name`. */
  title?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'This week',
    items: [
      { name: 'Home', href: '/dashboard', icon: Home, title: 'Home' },
      { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
      { name: 'Events', href: '/dashboard/events', icon: CalendarDays },
      { name: 'Weekly activities', href: '/dashboard/activities', icon: Repeat },
      { name: 'Programs', href: '/dashboard/programs', icon: Sparkles },
    ],
  },
  {
    label: 'My church',
    items: [
      { name: 'Cell groups', href: '/dashboard/cell-groups', icon: Users },
      { name: 'Satellite churches', href: '/dashboard/satellite', icon: Church },
      { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Giving',
    items: [
      { name: 'Give', href: '/dashboard/giving', icon: HandCoins, title: 'Giving' },
      { name: 'Tithe record', href: '/dashboard/tithing', icon: BookOpen, title: 'Tithe record' },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Grow',
    items: [{ name: 'Sermons', href: '/dashboard/sermons', icon: BookOpen }],
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile', href: '/dashboard/profile', icon: User },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

/** The five destinations that earn a thumb position on a phone. */
export const tabItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Attend', href: '/dashboard/attendance', icon: CheckSquare },
  { name: 'Sermons', href: '/dashboard/sermons', icon: BookOpen },
  { name: 'Groups', href: '/dashboard/cell-groups', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

const allItems = navGroups.flatMap((g) => g.items)

/** Exact match for /dashboard, prefix match for everything below it. */
export function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

/** Page title for the top bar — the deepest matching destination. */
export function titleFor(pathname: string): string {
  const match = allItems
    .filter((i) => isActive(i.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match ? match.title ?? match.name : 'Dashboard'
}
