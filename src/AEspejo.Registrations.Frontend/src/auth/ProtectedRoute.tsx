'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import { EmptyState, Loading } from '@/components/ui/states'
import type { UserRole } from '@/api/types'

/**
 * Client-side guard. It is not a security control (the API enforces roles with its policies); it
 * just avoids showing screens that would end in a 403 anyway.
 */
export function ProtectedRoute({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`)
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading text={t('auth.checkingSession')} />
      </div>
    )
  }

  if (!user) return null

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <EmptyState
          icon={ShieldX}
          title={t('common.noAccessTitle')}
          message={t('common.noAccessMessage', { role: user.role })}
        />
      </div>
    )
  }

  return <>{children}</>
}

