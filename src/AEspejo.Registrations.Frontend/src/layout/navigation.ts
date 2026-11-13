import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Contact,
  Inbox,
  MessageCircle,
  Receipt,
  Search,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/api/types'

export interface NavigationItem {
  key: string
  /** Translation key suffix: the label is `nav.{label}`. */
  label: string
  href: string
  icon: LucideIcon
  group: string
  /** Roles that see the item. Empty = every signed-in user. */
  roles?: UserRole[]
  /**
   * Section not built yet. It is shown disabled with a badge instead of being hidden: this gives the
   * whole map of the system without offering links that would lead to a 404.
   */
  pending?: boolean
}

export const NAV_GROUPS = ['operation', 'finance', 'analysis', 'marketing', 'system'] as const

export const NAVIGATION: NavigationItem[] = [
  { key: 'events', label: 'events', href: '/events', icon: CalendarDays, group: 'operation' },
  { key: 'registrations', label: 'registrants', href: '/registrations', icon: Users, group: 'operation' },
  { key: 'athletes', label: 'athletes', href: '/athletes', icon: Contact, group: 'operation' },
  { key: 'event-day', label: 'eventDay', href: '/event-day', icon: ClipboardCheck, group: 'operation', pending: true },
  {
    key: 'payments',
    label: 'payments',
    href: '/payments',
    icon: Receipt,
    group: 'finance',
    roles: ['Admin', 'Cashier'],
    pending: true,
  },
  { key: 'reports', label: 'reports', href: '/reports', icon: BarChart3, group: 'analysis' },
  {
    key: 'audience',
    label: 'audience',
    href: '/marketing/audience',
    icon: Search,
    group: 'marketing',
    roles: ['Admin'],
  },
  {
    key: 'inbox',
    label: 'inbox',
    href: '/marketing/inbox',
    icon: Inbox,
    group: 'marketing',
    // Answering customer messages is operational work, not only administration: any internal staff
    // member can do it, matching the backend policy.
    roles: ['Admin', 'Cashier', 'KitStaff'],
  },
  {
    key: 'campaigns',
    label: 'campaigns',
    href: '/marketing/campaigns',
    icon: MessageCircle,
    group: 'marketing',
    roles: ['Admin'],
  },
  {
    key: 'imports',
    label: 'imports',
    href: '/imports',
    icon: Upload,
    group: 'system',
    roles: ['Admin'],
    pending: true,
  },
  { key: 'settings', label: 'settings', href: '/settings', icon: Settings, group: 'system', roles: ['Admin'] },
]
