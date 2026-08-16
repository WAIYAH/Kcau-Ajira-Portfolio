import { motion } from 'motion/react'
import SidebarNav from './SidebarNav'

const EXPANDED_WIDTH = 264
const COLLAPSED_WIDTH = 76

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      // No overflow-hidden here: collapsed-state tooltips (Tooltip in SidebarNav)
      // pop out to the right via `left-full` and would otherwise get clipped.
      // Content already switches icon-only vs. labelled via the `collapsed` prop,
      // so nothing needs clipping to look right mid-animation.
      className="hidden shrink-0 border-r border-border bg-surface md:block"
    >
      <SidebarNav collapsed={collapsed} showCollapseToggle onToggleCollapse={onToggleCollapse} />
    </motion.aside>
  )
}
