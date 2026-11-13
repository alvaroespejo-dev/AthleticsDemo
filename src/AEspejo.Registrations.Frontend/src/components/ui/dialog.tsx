'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from './primitives'

interface DialogProps {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/** Simple modal: overlay + centred panel. Closes on Esc or on a click outside. */
export function Dialog({ open, title, onClose, children, className }: DialogProps) {
  const { t } = useTranslation()

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
      onMouseDown={onClose}
    >
      <div
        className={cn('relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg', className)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>

        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

interface FormDialogProps extends DialogProps {
  onSave: () => void
  saveText?: string
  saving?: boolean
  /**
   * Disables the save button without touching the rest of the form, for example while the content
   * does not yet have the minimum needed to be submitted.
   */
  disabled?: boolean
}

/** Dialog with a form and an action footer, the case that repeats across the panel. */
export function FormDialog({
  open,
  title,
  onClose,
  onSave,
  saveText,
  saving = false,
  disabled = false,
  children,
  className,
}: FormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} title={title} onClose={onClose} className={className}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        <div className="space-y-4">{children}</div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={saving} disabled={disabled}>
            {saving ? t('common.saving') : (saveText ?? t('common.save'))}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
