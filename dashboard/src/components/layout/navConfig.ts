import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  UserCircle,
  CalendarDays,
  Vote,
  GraduationCap,
  Users,
  Wallet,
  Megaphone,
  FileBarChart,
  ShieldCheck,
} from 'lucide-react'

export interface NavLinkItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const memberLinks: NavLinkItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'My Profile', icon: UserCircle },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/voting', label: 'Voting', icon: Vote },
  { to: '/learning', label: 'Learning Hub', icon: GraduationCap },
]

export const staffLinks: NavLinkItem[] = [
  { to: '/members', label: 'Members', icon: Users },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/communications', label: 'Communications', icon: Megaphone },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]

export const adminLinks: NavLinkItem[] = [{ to: '/settings/audit-log', label: 'Audit Log', icon: ShieldCheck }]
