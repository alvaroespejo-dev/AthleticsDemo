'use client'

import { useCurrencyCode } from '@/lib/currency'
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LogOut, Menu, Timer, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Badge, Button } from '@/components/ui/primitives'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { currentBrand } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, NAVIGATION } from './navigation'

export function AppLayout({ children }: { children: ReactNode }) {
  useCurrencyCode()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const pathname = usePathname()
  const brand = currentBrand()
  // On wide screens the sidebar is part of the layout; on mobile it overlays content, so starting
  // it open would cover the page as soon as it loads.
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024)

  if (!user) return null

  const items = NAVIGATION.filter((item) => !item.roles || item.roles.includes(user.role))

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
    )

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Timer size={18} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold">{brand.name}</div>
          <div className="text-xs text-muted-foreground">AEspejo</div>
        </div>
      </div>

      <nav className="space-y-4">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group)
          if (groupItems.length === 0) return null

          return (
            <div key={group}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`groups.${group}`)}
              </p>

              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon

                  // Sections not built yet are shown but do not navigate: they give the map of the system
                  // without offering a link that would end on an empty screen.
                  if (item.pending) {
                    return (
                      <div
                        key={item.key}
                        className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground/60"
                        title={t('underConstruction')}
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="truncate">{t(`nav.${item.label}`)}</span>
                        <Badge variant="default" className="ml-auto shrink-0 text-[10px]">
                          {t('soon')}
                        </Badge>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={linkClass(isActive(item.href))}
                      onClick={closeOnMobile}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="truncate">{t(`nav.${item.label}`)}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        className={cn(
          // shrink-0 is essential: without it, a wide table in the content squeezes the sidebar down to a few pixels.
          'fixed inset-y-0 left-0 z-50 w-60 shrink-0 transform overflow-y-auto border-r bg-card p-3 transition-transform lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="mb-4 ml-auto block rounded-md p-1 hover:bg-accent lg:hidden"
          aria-label={t('closeMenu')}
        >
          <X size={20} />
        </button>

        {sidebarContent}
      </aside>

      {/* min-w-0 cancels the min-width:auto that flex children carry. Without it, wide content, such as a
          fifteen-column table, stops this column from shrinking and it overflows over the sidebar instead of
          scrolling inside itself. */}
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b bg-card px-3 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1 hover:bg-accent lg:hidden"
            aria-label={t('openMenu')}
          >
            <Menu size={20} />
          </button>

          <div className="hidden text-sm text-muted-foreground lg:block">{user.name}</div>

          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            <LanguageSelector />
            <Badge variant="info">{user.role}</Badge>
            <span className="text-xs text-muted-foreground lg:hidden">{user.name}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut size={14} />
              {t('logout')}
            </Button>
          </div>
        </header>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="min-w-0 flex-1 overflow-auto p-3 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
