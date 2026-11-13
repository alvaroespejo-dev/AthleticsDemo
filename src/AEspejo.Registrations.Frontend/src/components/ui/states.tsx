'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Loader2, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { Button } from './primitives'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-12">
      {Icon && <Icon size={48} className="mb-4 text-muted-foreground opacity-40" />}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {message && <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">{message}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Shows the message the API wrote. The backend explains what is missing and why ("cannot publish
 * because it has no age categories defined"), so replacing it with a generic text would only take
 * information away from the operator.
 */
export function ErrorNotice({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (!error) return null

  const message =
    error instanceof ApiError ? error.message : error instanceof Error ? error.message : t('common.unexpectedError')

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function InfoNotice({ children }: { children: ReactNode }) {
  return <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">{children}</div>
}

export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
      {children}
    </div>
  )
}

export function Loading({ text }: { text?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 size={16} className="animate-spin" />
      {text ?? t('common.loading')}
    </div>
  )
}
