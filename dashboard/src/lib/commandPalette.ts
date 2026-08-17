import type { LucideIcon } from 'lucide-react'
import { memberLinks, staffLinks, adminLinks } from '@/components/layout/navConfig'

export interface PaletteNavItem {
  id: string
  label: string
  section: string
  to: string
  icon: LucideIcon
}

// Same role-gating SidebarNav uses (memberLinks always, staffLinks when
// isStaff, adminLinks when isAdmin) so the palette never offers a
// destination a given user's sidebar wouldn't also show.
export function buildNavItems(isStaff: boolean, isAdmin: boolean): PaletteNavItem[] {
  const items: PaletteNavItem[] = memberLinks.map((link) => ({
    id: `nav-${link.to}`,
    label: link.label,
    section: 'Go to',
    to: link.to,
    icon: link.icon,
  }))
  if (isStaff) {
    items.push(
      ...staffLinks.map((link) => ({
        id: `nav-${link.to}`,
        label: link.label,
        section: 'Go to',
        to: link.to,
        icon: link.icon,
      })),
    )
  }
  if (isAdmin) {
    items.push(
      ...adminLinks.map((link) => ({
        id: `nav-${link.to}`,
        label: link.label,
        section: 'Go to',
        to: link.to,
        icon: link.icon,
      })),
    )
  }
  return items
}

export function filterNavItems(items: PaletteNavItem[], query: string): PaletteNavItem[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return items
  return items.filter((item) => item.label.toLowerCase().includes(trimmed))
}
