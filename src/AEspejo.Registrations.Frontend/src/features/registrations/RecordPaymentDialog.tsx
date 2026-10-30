'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { payments, registrationAccess } from '@/api/endpoints'
import type { PaymentItem, RegisterPayment, RegistrationDetail, RegistrationStatus } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { ErrorNotice, InfoNotice } from '@/components/ui/states'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import { centsToText, formatDateTime, formatMoney, fromDateTimeInput, textToCents, toDateTimeInput } from '@/lib/format'

interface Props {
  registration: RegistrationDetail
  onClose: () => void
  onDone: (message: string) => void
}

/** Statuses that accept a new payment. */
const COLLECTABLE: RegistrationStatus[] = ['Pending', 'UnderReview']

/** Local time as a value for a datetime-local input. */
function nowLocal(): string {
  return toDateTimeInput(new Date().toISOString())
}

/**
 * Receipt the athlete uploaded on the confirmation screen. The file is protected by the session, so it is fetched
 * with the token and shown from an object URL (it cannot be used directly as an image source).
 */
export function ReceiptPreview({ registrationId }: { registrationId: number }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [type, setType] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    registrationAccess.receiptBlob(registrationId).then((blob) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setType(blob.type)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [registrationId])

  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noreferrer" className="mb-4 flex items-center gap-3 rounded-md border p-2 transition-colors hover:bg-accent">
      {type.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element -- object URL of a fetched file
        <img src={url} alt={t('operation.viewReceipt')} className="h-16 w-16 rounded object-cover" />
      ) : (
        <FileText size={32} className="shrink-0 text-muted-foreground" />
      )}
      <span className="text-sm font-medium text-primary">{t('operation.viewReceipt')}</span>
    </a>
  )
}

export function RecordPaymentDialog({ registration, onClose, onDone }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const locale = i18n.language
  const collectable = COLLECTABLE.includes(registration.status)

  // Pre-fills what is missing, which is the normal case: usually the exact balance is transferred.
  const missing = Math.max(0, registration.amountCents - registration.totalPaidCents)

  const [draft, setDraft] = useState({
    transactionNumber: '',
    amountCents: missing > 0 ? missing : registration.amountCents,
    creditedAt: nowLocal(),
    sourceBank: '',
    payerName: registration.athlete.firstNames + ' ' + registration.athlete.lastNames,
    notes: '',
  })
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [reasons, setReasons] = useState<Record<number, string>>({})
  const [editing, setEditing] = useState<Record<number, RegisterPayment & { creditedAtLocal: string }>>({})

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['registrations'] })
    void queryClient.invalidateQueries({ queryKey: ['registration', registration.id] })
    void queryClient.invalidateQueries({ queryKey: ['event'] })
  }

  const record = useMutation({
    mutationFn: (body: RegisterPayment) => payments.record(registration.id, body),
    onSuccess: (outcome) => {
      refresh()
      onDone(outcome.message)
      onClose()
    },
  })

  const revert = useMutation({
    mutationFn: (paymentId: number) => payments.revert(paymentId, reasons[paymentId] ?? ''),
    onSuccess: (outcome) => {
      refresh()
      setExpanded(new Set())
      setReasons({})
      onDone(outcome.message)
    },
  })

  const update = useMutation({
    mutationFn: (paymentId: number) => {
      const data = editing[paymentId]
      return payments.update(paymentId, {
        transactionNumber: data.transactionNumber,
        amountCents: data.amountCents,
        creditedAt: fromDateTimeInput(data.creditedAtLocal),
        sourceBank: data.sourceBank?.trim() || null,
        payerName: data.payerName?.trim() || null,
        notes: data.notes?.trim() || null,
      })
    },
    onSuccess: (outcome) => {
      refresh()
      setEditing({})
      onDone(outcome.message)
    },
  })

  const difference = draft.amountCents + registration.totalPaidCents - registration.amountCents

  const submit = () => {
    if (!collectable) return
    record.mutate({
      transactionNumber: draft.transactionNumber,
      amountCents: draft.amountCents,
      creditedAt: fromDateTimeInput(draft.creditedAt),
      sourceBank: draft.sourceBank.trim() || null,
      payerName: draft.payerName.trim() || null,
      notes: draft.notes.trim() || null,
    })
  }

  const busy = record.isPending || revert.isPending || update.isPending

  return (
    <FormDialog
      open
      title={t('operation.registerPayment')}
      onClose={onClose}
      onSave={submit}
      saveText={collectable ? t('operation.registerPayment') : undefined}
      saving={busy}
      disabled={!collectable}
    >
      {(record.isError || revert.isError || update.isError) && (
        <ErrorNotice error={record.error ?? revert.error ?? update.error} />
      )}

      {registration.hasReceipt && <ReceiptPreview registrationId={registration.id} />}

      {!collectable && (
        <InfoNotice>
          {t('operation.alreadyState', { estado: t(`registrations.statusLabel.${registration.status}`).toLowerCase() })}.{' '}
          {t('operation.revertPaymentHint')}
        </InfoNotice>
      )}

      {collectable && (
        <>
          <InfoNotice>
            <div className="flex justify-between gap-4">
              <span>{t('operation.amount')}</span>
              <strong className="tabular-nums">{formatMoney(registration.amountCents, locale)}</strong>
            </div>
            {registration.totalPaidCents > 0 && (
              <div className="mt-1 flex justify-between gap-4">
                <span>{t('operation.alreadyCredited')}</span>
                <strong className="tabular-nums">{formatMoney(registration.totalPaidCents, locale)}</strong>
              </div>
            )}
          </InfoNotice>

          <Field id="payment-transaction" label={t('operation.transactionNumber')} hint={t('registrations.transactionHelp')}>
            <Input
              id="payment-transaction"
              required
              autoFocus
              value={draft.transactionNumber}
              onChange={(e) => setDraft((d) => ({ ...d, transactionNumber: e.target.value }))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="payment-amount" label={t('operation.amount')}>
              <Input
                id="payment-amount"
                inputMode="decimal"
                required
                value={centsToText(draft.amountCents)}
                onChange={(e) => setDraft((d) => ({ ...d, amountCents: textToCents(e.target.value) }))}
              />
            </Field>

            <Field id="payment-date" label={t('operation.creditedDate')}>
              <Input
                id="payment-date"
                type="datetime-local"
                required
                value={draft.creditedAt}
                onChange={(e) => setDraft((d) => ({ ...d, creditedAt: e.target.value }))}
              />
            </Field>
          </div>

          {difference !== 0 && (
            <p className={`text-sm ${difference < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {difference < 0
                ? t('registrations.missingNotice', { amount: formatMoney(-difference, locale) })
                : t('registrations.surplusNotice', { amount: formatMoney(difference, locale) })}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="payment-bank" label={t('operation.bank')}>
              <Input id="payment-bank" value={draft.sourceBank} onChange={(e) => setDraft((d) => ({ ...d, sourceBank: e.target.value }))} />
            </Field>

            <Field id="payment-payer" label={t('operation.payer')} hint={t('registrations.payerHelp')}>
              <Input id="payment-payer" value={draft.payerName} onChange={(e) => setDraft((d) => ({ ...d, payerName: e.target.value }))} />
            </Field>
          </div>

          <Field id="payment-notes" label={t('operation.notes')}>
            <Textarea id="payment-notes" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
          </Field>
        </>
      )}

      {registration.payments.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">{t('operation.registeredPayments')}</h3>

          <div className="space-y-2">
            {registration.payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                editable={!collectable}
                locale={locale}
                expanded={expanded.has(payment.id)}
                editData={editing[payment.id]}
                reason={reasons[payment.id] ?? ''}
                onToggleExpanded={() =>
                  setExpanded((s) => {
                    const next = new Set(s)
                    next.has(payment.id) ? next.delete(payment.id) : next.add(payment.id)
                    return next
                  })
                }
                onReasonChange={(value) => setReasons((r) => ({ ...r, [payment.id]: value }))}
                onRevert={() => revert.mutate(payment.id)}
                onStartEdit={() =>
                  setEditing((e) => ({
                    ...e,
                    [payment.id]: {
                      transactionNumber: payment.transactionNumber,
                      amountCents: payment.amountCents,
                      creditedAt: payment.creditedAt,
                      creditedAtLocal: toDateTimeInput(payment.creditedAt),
                      sourceBank: payment.sourceBank,
                      payerName: payment.payerName,
                      notes: null,
                    },
                  }))
                }
                onEditChange={(patch) =>
                  setEditing((e) => ({ ...e, [payment.id]: { ...e[payment.id], ...patch } }))
                }
                onCancelEdit={() =>
                  setEditing((e) => {
                    const next = { ...e }
                    delete next[payment.id]
                    return next
                  })
                }
                onSaveEdit={() => update.mutate(payment.id)}
              />
            ))}
          </div>
        </div>
      )}
    </FormDialog>
  )
}

interface PaymentRowProps {
  payment: PaymentItem
  editable: boolean
  locale: string
  expanded: boolean
  editData: (RegisterPayment & { creditedAtLocal: string }) | undefined
  reason: string
  onToggleExpanded: () => void
  onReasonChange: (value: string) => void
  onRevert: () => void
  onStartEdit: () => void
  onEditChange: (patch: Partial<RegisterPayment & { creditedAtLocal: string }>) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
}

function PaymentRow({
  payment,
  editable,
  locale,
  expanded,
  editData,
  reason,
  onToggleExpanded,
  onReasonChange,
  onRevert,
  onStartEdit,
  onEditChange,
  onCancelEdit,
  onSaveEdit,
}: PaymentRowProps) {
  const { t } = useTranslation()

  if (editData) {
    return (
      <div className="space-y-3 rounded-md border p-3">
        <Field id={`edit-transaction-${payment.id}`} label={t('operation.transactionNumber')}>
          <Input
            id={`edit-transaction-${payment.id}`}
            value={editData.transactionNumber}
            onChange={(e) => onEditChange({ transactionNumber: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`edit-amount-${payment.id}`} label={t('operation.amount')}>
            <Input
              id={`edit-amount-${payment.id}`}
              inputMode="decimal"
              value={centsToText(editData.amountCents)}
              onChange={(e) => onEditChange({ amountCents: textToCents(e.target.value) })}
            />
          </Field>

          <Field id={`edit-date-${payment.id}`} label={t('operation.creditedDate')}>
            <Input
              id={`edit-date-${payment.id}`}
              type="datetime-local"
              value={editData.creditedAtLocal}
              onChange={(e) => onEditChange({ creditedAtLocal: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
            {t('operation.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={onSaveEdit}>
            {t('operation.save')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{payment.transactionNumber}</span>
            <span className="text-sm font-medium">{formatMoney(payment.amountCents, locale)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{formatDateTime(payment.creditedAt, locale)}</div>
        </div>

        <div className="flex gap-1">
          {editable && (
            <Button type="button" variant="outline" size="sm" onClick={onStartEdit}>
              {t('operation.edit')}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            aria-label={t('operation.revertPayment')}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <InfoNotice>{t('operation.revertWarning')}</InfoNotice>

          <Field id={`revert-reason-${payment.id}`} label={t('operation.revertReason')}>
            <Textarea
              id={`revert-reason-${payment.id}`}
              placeholder={t('operation.revertReasonPlaceholder')}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </Field>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onToggleExpanded}>
              {t('operation.cancel')}
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={!reason.trim()} onClick={onRevert}>
              {t('operation.confirmRevert')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
