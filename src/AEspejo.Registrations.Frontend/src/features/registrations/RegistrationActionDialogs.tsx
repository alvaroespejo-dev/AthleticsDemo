'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { registrations, settings } from '@/api/endpoints'
import type { ParticipationResult } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { ErrorNotice, InfoNotice } from '@/components/ui/states'
import { Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { getCurrencyCode } from '@/lib/format'
import { formatMoney } from '@/lib/format'

/**
 * Every list, detail and event count that a registration change touches. Called from mutation callbacks,
 * so it is a plain function: hooks cannot run there.
 */
function refreshAfterChange(queryClient: QueryClient, registrationId: number) {
  void queryClient.invalidateQueries({ queryKey: ['registrations'] })
  void queryClient.invalidateQueries({ queryKey: ['registration', registrationId] })
  void queryClient.invalidateQueries({ queryKey: ['event'] })
}

// ---- Cancel or reactivate ----

export type StatusAction = 'reactivate' | 'cancel'

interface StatusDialogProps {
  registrationId: number
  action: StatusAction
  athleteName: string
  code: string
  onClose: () => void
  onDone: (message: string) => void
}

/** The two manual lifecycle corrections. No free status picker on purpose: jumping to any status would leave seats and reservations inconsistent. */
export function StatusDialog({ registrationId, action, athleteName, code, onClose, onDone }: StatusDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const isReactivate = action === 'reactivate'

  const apply = useMutation({
    mutationFn: () =>
      isReactivate ? registrations.reactivate(registrationId) : registrations.cancel(registrationId, reason),
    onSuccess: () => {
      refreshAfterChange(queryClient, registrationId)
      onDone(t('registrations.statusChanged'))
      onClose()
    },
  })

  const label = isReactivate ? t('operation.reactivate') : t('operation.cancelRegistration')

  return (
    <FormDialog
      open
      title={label}
      onClose={onClose}
      onSave={() => apply.mutate()}
      saveText={label}
      saving={apply.isPending}
    >
      {apply.isError && <ErrorNotice error={apply.error} />}

      <InfoNotice>
        <div>{athleteName}</div>
        <div className="mt-1 font-mono text-xs">{code}</div>
      </InfoNotice>

      {isReactivate ? (
        <p className="text-sm text-muted-foreground">{t('registrations.reactivateHelp')}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t('registrations.cancelHelp')}</p>

          <Field id="cancel-reason" label={t('operation.reason')} hint={t('registrations.reasonHelp')}>
            <Textarea id="cancel-reason" required autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </>
      )}
    </FormDialog>
  )
}

// ---- Bib ----

interface BibDialogProps {
  registrationId: number
  currentBib: number | null
  bibFrom: number | null
  bibTo: number | null
  athleteName: string
  modality: string
  onClose: () => void
  onDone: (message: string) => void
}

export function BibDialog({
  registrationId,
  currentBib,
  bibFrom,
  bibTo,
  athleteName,
  modality,
  onClose,
  onDone,
}: BibDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [value, setValue] = useState(currentBib === null ? '' : String(currentBib))
  const number = value.trim() === '' ? null : Number(value.trim())
  const hasRange = bibFrom !== null && bibTo !== null
  const outOfRange = number !== null && Number.isFinite(number) && hasRange && (number < bibFrom! || number > bibTo!)

  const assign = useMutation({
    mutationFn: () => registrations.setBib(registrationId, number),
    onSuccess: (response) => {
      // The range only warns: the server accepts the bib and returns the warning, which the operator must see.
      refreshAfterChange(queryClient, registrationId)
      onDone(response.warning ? `${response.message} ${response.warning}` : response.message)
      onClose()
    },
  })

  return (
    <FormDialog
      open
      title={t('operation.editBib')}
      onClose={onClose}
      onSave={() => assign.mutate()}
      saveText={number === null ? t('operation.removeBib') : t('operation.saveBib')}
      saving={assign.isPending}
    >
      {assign.isError && <ErrorNotice error={assign.error} />}

      <InfoNotice>
        <div>{athleteName}</div>
        <div className="mt-1">
          {modality}
          {hasRange && ` · ${t('modalities.bibRange', { from: bibFrom, to: bibTo })}`}
        </div>
      </InfoNotice>

      <Field id="bib-number" label={t('operation.bibNumber')} hint={t('registrations.bibHelp')}>
        <Input
          id="bib-number"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </Field>

      {outOfRange && (
        <p className="text-sm text-amber-600">
          {t('registrations.bibOutOfRange', { bib: number, from: bibFrom, to: bibTo, modality })}
        </p>
      )}
    </FormDialog>
  )
}

// ---- Result ----

interface ResultDialogProps {
  registrationId: number
  athleteName: string
  modality: string
  currentResult: ParticipationResult | null
  onClose: () => void
  onDone: (message: string) => void
}

export function ResultDialog({ registrationId, athleteName, modality, currentResult, onClose, onDone }: ResultDialogProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [result, setResult] = useState<ParticipationResult | null>(currentResult)
  // The Money Sport credit amount comes from the settings, never a fixed value.
  const config = useQuery({ queryKey: ['settings'], queryFn: () => settings.get() })
  const creditText = formatMoney(config.data?.moneySportAmountCents ?? 0, i18n.language)

  const save = useMutation({
    mutationFn: () => registrations.setResult(registrationId, result),
    onSuccess: () => {
      refreshAfterChange(queryClient, registrationId)
      onDone(t('configuration.saved'))
      onClose()
    },
  })

  return (
    <FormDialog open title={t('resultado.title')} onClose={onClose} onSave={() => save.mutate()} saveText={t('resultado.confirm')} saving={save.isPending}>
      {save.isError && <ErrorNotice error={save.error} />}

      <InfoNotice>
        <div>{athleteName}</div>
        <div className="mt-1 text-sm text-muted-foreground">{modality}</div>
        {currentResult && (
          <div className="mt-2 border-t pt-2">
            <div className="text-sm font-medium">{t('resultado.currentResult')}:</div>
            <div className="text-sm">{t(`registrations.result.${currentResult}`)}</div>
          </div>
        )}
      </InfoNotice>

      <Field id="result-select" label={t('resultado.title')}>
        <Select
          id="result-select"
          autoFocus
          value={result ?? ''}
          onChange={(e) => setResult((e.target.value as ParticipationResult) || null)}
        >
          <option value="">{t('resultado.notRegistered')}</option>
          <option value="Finished">{t('registrations.result.Finished')}</option>
          <option value="Dropped">{t('registrations.result.Dropped')}</option>
          <option value="NoShow">{t('registrations.result.NoShow')}</option>
        </Select>
      </Field>

      {result === 'Finished' && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {t('resultado.finishedBonus', { monto: creditText, currency: getCurrencyCode() })}
        </div>
      )}

      {result !== null && result !== 'Finished' && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {t('resultado.revertingBonus')}
        </div>
      )}
    </FormDialog>
  )
}
