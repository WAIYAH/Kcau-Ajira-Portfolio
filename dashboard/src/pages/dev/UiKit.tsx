import { useState, type ReactNode } from 'react'
import { Bell, Inbox, Mail, Settings, LogOut, User } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, Button, Input, Select, Textarea, Avatar, Tooltip, Skeleton, EmptyState, Modal, Drawer, Dropdown } from '@/components/ui'
import { StatusBadge, RoleBadge } from '../../components/Badge'

// Tailwind's scanner needs literal class strings — no bg-${name} interpolation.
const tokenSwatches = [
  { label: 'Primary', className: 'bg-primary' },
  { label: 'Accent', className: 'bg-accent' },
  { label: 'Secondary', className: 'bg-secondary' },
  { label: 'Success', className: 'bg-success' },
  { label: 'Danger', className: 'bg-danger' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

export default function UiKit() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="space-y-10 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Internal / Dev</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-fg">Component &amp; token reference</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every primitive from the Phase 1 redesign, in one place, so light/dark and every state gets checked once
          before it's load-bearing across real pages. Current theme setting: <strong>{theme}</strong> (resolved:{' '}
          {resolvedTheme}).
        </p>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>
            Light
          </Button>
          <Button size="sm" variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>
            Dark
          </Button>
          <Button size="sm" variant={theme === 'system' ? 'primary' : 'secondary'} onClick={() => setTheme('system')}>
            System
          </Button>
        </div>
      </div>

      <Section title="Color tokens">
        <div className="flex flex-wrap gap-4">
          {tokenSwatches.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2">
              <div className={`h-14 w-14 rounded-surface shadow-elevate-sm ${t.className}`} />
              <span className="text-xs text-fg-muted">{t.label}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-surface border border-border bg-surface shadow-elevate-sm" />
            <span className="text-xs text-fg-muted">Surface</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-surface border border-border bg-bg" />
            <span className="text-xs text-fg-muted">Canvas</span>
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="surface">
            <p className="text-sm font-medium text-fg">Surface</p>
            <p className="mt-1 text-xs text-fg-muted">Resting state, subtle shadow.</p>
          </Card>
          <Card variant="raised">
            <p className="text-sm font-medium text-fg">Raised</p>
            <p className="mt-1 text-xs text-fg-muted">Always-elevated (e.g. popovers).</p>
          </Card>
          <Card variant="interactive" tabIndex={0}>
            <p className="text-sm font-medium text-fg">Interactive</p>
            <p className="mt-1 text-xs text-fg-muted">Hover me — lift + shadow.</p>
          </Card>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-md gap-4">
          <Input placeholder="Default input" />
          <Input placeholder="Invalid input" invalid />
          <Input placeholder="Disabled input" disabled />
          <Select defaultValue="">
            <option value="" disabled>
              Choose a role
            </option>
            <option value="member">Member</option>
            <option value="leader">Leader</option>
            <option value="admin">Admin</option>
          </Select>
          <Textarea placeholder="Textarea" />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="pending" />
          <StatusBadge status="active" />
          <StatusBadge status="suspended" />
          <StatusBadge status="alumni" />
          <RoleBadge role="member" />
          <RoleBadge role="leader" />
          <RoleBadge role="admin" />
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-3">
          <Avatar name="Lucky Waiyah" size="sm" />
          <Avatar name="Amina Otieno" size="md" />
          <Avatar name="Brian Kiptoo" size="lg" />
        </div>
      </Section>

      <Section title="Tooltip">
        <Tooltip label="Collapsed sidebar label" side="right">
          <Button variant="secondary" size="sm">
            Hover me
          </Button>
        </Tooltip>
      </Section>

      <Section title="Dropdown">
        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm text-fg">
              <User size={16} strokeWidth={1.75} /> Account menu
            </span>
          }
          items={[
            { label: 'Profile', icon: User, onClick: () => {} },
            { label: 'Settings', icon: Settings, onClick: () => {} },
            { divider: true },
            { label: 'Sign out', icon: LogOut, onClick: () => {}, danger: true },
          ]}
        />
      </Section>

      <Section title="Skeleton">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Inbox}
          title="No inquiries yet"
          description="New contact and join-form submissions will show up here."
          action={
            <Button size="sm" variant="secondary">
              Refresh
            </Button>
          }
        />
      </Section>

      <Section title="Notification bell (reference)">
        <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface text-fg-muted">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </div>
      </Section>

      <Section title="Modal & Drawer">
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal" description="Focus-trapped, closes on Escape.">
          <p className="text-sm text-fg-muted">Modal body content goes here.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Example drawer">
          <p className="text-sm text-fg-muted">Drawer body content goes here.</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-fg-muted">
            <Mail size={16} strokeWidth={1.75} /> Slides in from the right, traps focus.
          </div>
        </Drawer>
      </Section>
    </div>
  )
}
