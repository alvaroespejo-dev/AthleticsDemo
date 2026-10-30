'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Hash, MessageCircle, Receipt, RotateCcw, Search, Shirt, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { events, registrations } from '@/api/endpoints'
import type {
  EventSummary,
  ParticipationResult,
  RegistrationFilter,
  RegistrationOrder,
  RegistrationRow,
  RegistrationStatus,
  RegistrationSummary,
  Sex,
} from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives'
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '@/components/ui/states'
import { useAuth } from '@/auth/AuthContext'
import { formatDateTime, formatMoney, whatsAppLink } from '@/lib/format'
import { RegistrationDetailDialog } from './RegistrationDetailDialog'
import { BibDialog, StatusDialog, type StatusAction } from './RegistrationActionDialogs'
import { RecordPaymentDialog } from './RecordPaymentDialog'

const STATUSES: RegistrationStatus[] = ['Pending', 'Paid', 'UnderReview', 'Expired', 'Cancelled', 'Refunded']
const ORDERS: RegistrationOrder[] = ['DateDesc', 'DateAsc', 'LastName', 'Bib', 'Modality']

const EMPTY_FILTER: RegistrationFilter = { page: 1, size: 25, order: 'DateDesc' }

/** Route: the list of one event's registrations, filtered, paged, with the actions of each row. */
export function RegistrationsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()

  const canCollect = hasRole('Admin', 'Cashier')
  const canAssignBib = hasRole('Admin', 'Cashier', 'KitStaff')
  const isAdmin = hasRole('Admin')
  const canRecordResult = hasRole('Admin', 'Cashier', 'KitStaff')
  const hasActions = canCollect || canAssignBib || isAdmin || canRecordResult

  const eventIdFromUrl = Number(searchParams.get('event')) || 0
  const [eventId, setEventId] = useState(eventIdFromUrl)
  const [filter, setFilter] = useState<RegistrationFilter>(EMPTY_FILTER)
  const [text, setText] = useState('')
  const [appliedText, setAppliedText] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)

  const eventList = useQuery({ queryKey: ['events', true], queryFn: () => events.list(true) })

  // Without an event in the address the nearest one is picked, the one being worked on in practice.
  useEffect(() => {
    if (eventId || !eventList.data?.length) return
    const chosen = eventList.data[0].id
    setEventId(chosen)
    router.replace(`/registrations/?event=${chosen}`)
  }, [eventId, eventList.data, router])

  const listing = useQuery({
    queryKey: ['registrations', eventId, { ...filter, text: appliedText }],
    queryFn: () => registrations.list(eventId, { ...filter, text: appliedText }),
    enabled: eventId > 0,
    placeholderData: keepPreviousData,
  })

  // The modality filter needs the event's modalities, which the list does not carry: the detail is loaded for it.
  const eventDetail = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => events.get(eventId),
    enabled: eventId > 0,
  })

  /** Any filter change goes back to the first page: staying on page 7 of a result that now has 2 would show an empty table. */
  const setFilterField = <K extends keyof RegistrationFilter>(field: K, value: RegistrationFilter[K]) =>
    setFilter((f) => ({ ...f, [field]: value, page: 1 }))

  const changeEvent = (next: number) => {
    setEventId(next)
    router.replace(`/registrations/?event=${next}`)
    setFilter((f) => ({ ...f, page: 1 }))
    setSelected(new Set())
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setAppliedText(text)
    setFilter((f) => ({ ...f, page: 1 }))
  }

  if (eventList.isPending) return <Loading />
  if (eventList.isError) return <ErrorNotice error={eventList.error} />

  if (eventList.data.length === 0) {
    return <EmptyState icon={Users} title={t('registrants.empty')} message={t('registrants.emptyMessage')} />
  }

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['registrations'] })
    void queryClient.invalidateQueries({ queryKey: ['registration'] })
    void queryClient.invalidateQueries({ queryKey: ['event'] })
  }

  const page = listing.data?.page

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('nav.registrants')}</h1>
          <p className="text-sm text-muted-foreground">{t('registrants.description')}</p>
        </div>

        <div className="w-full sm:w-72">
          <Field id="event" label={t('registrants.event')}>
            <Select id="event" value={eventId} onChange={(e) => changeEvent(Number(e.target.value))}>
              {eventList.data.map((e: EventSummary) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {notice && <SuccessNotice>{notice}</SuccessNotice>}

      {listing.data && <SummaryCards summary={listing.data.summary} locale={locale} onFilter={setFilterField} />}

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitSearch}>
          <div className="lg:col-span-2">
            <Field id="search" label={t('registrants.search')}>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder={t('registrants.searchPlaceholder')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" variant="outline">
                  <Search size={16} />
                </Button>
              </div>
            </Field>
          </div>

          <Field id="status" label={t('registrants.status')}>
            <Select id="status" value={filter.status ?? ''} onChange={(e) => setFilterField('status', e.target.value as RegistrationStatus | '')}>
              <option value="">{t('registrants.all')}</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`registrations.statusLabel.${status}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="modality" label={t('registrants.modality')}>
            <Select id="modality" value={filter.modalityId ?? ''} onChange={(e) => setFilterField('modalityId', e.target.value ? Number(e.target.value) : '')}>
              <option value="">{t('registrants.allModalities')}</option>
              {eventDetail.data?.modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="sex" label={t('registrants.gender')}>
            <Select id="sex" value={filter.sex ?? ''} onChange={(e) => setFilterField('sex', e.target.value as Sex | '')}>
              <option value="">{t('registrants.all')}</option>
              <option value="Female">{t('profile.genderFemale')}</option>
              <option value="Male">{t('profile.genderMale')}</option>
            </Select>
          </Field>

          <Field id="order" label={t('registrants.orderBy')}>
            <Select id="order" value={filter.order ?? 'DateDesc'} onChange={(e) => setFilterField('order', e.target.value as RegistrationOrder)}>
              {ORDERS.map((order) => (
                <option key={order} value={order}>
                  {t(`registrations.order.${order}`)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap items-end gap-4 lg:col-span-2">
            <CheckFilter label={t('registrants.noSize')} checked={!!filter.withoutSize} onChange={(v) => setFilterField('withoutSize', v || undefined)} />
            <CheckFilter label={t('registrants.noBib')} checked={!!filter.withoutBib} onChange={(v) => setFilterField('withoutBib', v || undefined)} />
            <CheckFilter label={t('registrants.noEmergency')} checked={!!filter.withoutEmergencyContact} onChange={(v) => setFilterField('withoutEmergencyContact', v || undefined)} />
            <CheckFilter label={t('registrations.withoutResult')} checked={!!filter.withoutResult} onChange={(v) => setFilterField('withoutResult', v || undefined)} />
          </div>
        </form>
      </Card>

      {listing.isError && <ErrorNotice error={listing.error} />}
      {listing.isPending && <Loading />}

      {page && page.total === 0 && (
        <EmptyState icon={Users} title={t('registrants.noMatch')} message={t('registrants.noMatchHelp')} />
      )}

      {page && page.total > 0 && (
        <>
          {canRecordResult && selected.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-4">
              <span className="text-sm">
                {selected.size} {t('registrations.selected')}
              </span>
              <Button variant="outline" onClick={() => setBatchOpen(true)}>
                {t('resultado.title')}
              </Button>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {canRecordResult && <th className="w-10 px-3 py-2" />}
                    {[
                      t('registrants.code'),
                      t('registrants.status'),
                      t('registrants.bib'),
                      t('registrants.document'),
                      t('registrants.athlete'),
                      t('registrants.gender'),
                      t('registrants.age'),
                      t('registrants.phone'),
                      t('registrants.modality'),
                      t('registrants.category'),
                      t('registrants.kit'),
                      t('registrants.size'),
                      t('registrants.amount'),
                      t('registrants.paid'),
                      t('registrants.registered'),
                    ].map((column) => (
                      <th key={column} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {column}
                      </th>
                    ))}
                    {hasActions && <th className="w-56" />}
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((row) => (
                    <RegistrationRowView
                      key={row.id}
                      row={row}
                      locale={locale}
                      canRecordResult={canRecordResult}
                      hasActions={hasActions}
                      canCollect={canCollect}
                      canAssignBib={canAssignBib}
                      isAdmin={isAdmin}
                      selected={selected.has(row.id)}
                      onSelect={(checked) => {
                        const next = new Set(selected)
                        if (checked) next.add(row.id)
                        else next.delete(row.id)
                        setSelected(next)
                      }}
                      onOpen={() => setDialog({ kind: 'detail', id: row.id })}
                      onCollect={() => setDialog({ kind: 'payment', id: row.id })}
                      onBib={() => setDialog({ kind: 'bib', row })}
                      onStatus={(action) => setDialog({ kind: 'status', row, action })}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {page.total} {page.total === 1 ? t('registrants.registrant') : t('registrants.registrantsCount')} · {t('pagination.page')}{' '}
                {page.page} {t('registrations.pageOf')} {page.totalPages}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!page.hasPrevious} onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                  {t('pagination.previous')}
                </Button>
                <Button variant="outline" size="sm" disabled={!page.hasNext} onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {batchOpen && (
        <BatchResultDialog
          eventId={eventId}
          registrationIds={[...selected]}
          onClose={() => setBatchOpen(false)}
          onDone={(message) => {
            setNotice(message)
            setSelected(new Set())
            refresh()
          }}
        />
      )}

      {dialog?.kind === 'detail' && (
        <RegistrationDetailDialog registrationId={dialog.id} onClose={() => setDialog(null)} onDone={setNotice} />
      )}

      {dialog?.kind === 'payment' && (
        <PaymentFromRegistration registrationId={dialog.id} onClose={() => setDialog(null)} onDone={setNotice} />
      )}

      {dialog?.kind === 'bib' && (
        <BibDialog
          registrationId={dialog.row.id}
          currentBib={dialog.row.bibNumber}
          bibFrom={dialog.row.bibFrom}
          bibTo={dialog.row.bibTo}
          athleteName={`${dialog.row.firstNames} ${dialog.row.lastNames}`}
          modality={dialog.row.modality}
          onClose={() => setDialog(null)}
          onDone={setNotice}
        />
      )}

      {dialog?.kind === 'status' && (
        <StatusDialog
          registrationId={dialog.row.id}
          action={dialog.action}
          athleteName={`${dialog.row.firstNames} ${dialog.row.lastNames}`}
          code={dialog.row.code}
          onClose={() => setDialog(null)}
          onDone={setNotice}
        />
      )}
    </div>
  )
}

// ---- Dialog state ----

type DialogState =
  | { kind: 'detail'; id: number }
  | { kind: 'payment'; id: number }
  | { kind: 'bib'; row: RegistrationRow }
  | { kind: 'status'; row: RegistrationRow; action: StatusAction }

// ---- Pieces ----

/** Loads the registration, then opens the payment dialog for it. */
function PaymentFromRegistration({ registrationId, onClose, onDone }: { registrationId: number; onClose: () => void; onDone: (message: string) => void }) {
  const query = useQuery({ queryKey: ['registration', registrationId], queryFn: () => registrations.get(registrationId) })
  if (query.isPending) return null
  if (query.isError) return <ErrorNotice error={query.error} />
  return <RecordPaymentDialog registration={query.data} onClose={onClose} onDone={onDone} />
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function SummaryCards({
  summary,
  locale,
  onFilter,
}: {
  summary: RegistrationSummary
  locale: string
  onFilter: <K extends keyof RegistrationFilter>(field: K, value: RegistrationFilter[K]) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      <Metric label={t('registrants.total')} value={summary.total} onClick={() => onFilter('status', '')} />
      <Metric label={t('registrants.paid')} value={summary.paid} tone="text-green-600" onClick={() => onFilter('status', 'Paid')} />
      <Metric label={t('registrations.pendingCount')} value={summary.pending} tone="text-yellow-600" onClick={() => onFilter('status', 'Pending')} />
      <Metric
        label={t('registrants.noSize')}
        value={summary.withoutSize}
        tone={summary.withoutSize > 0 ? 'text-destructive' : undefined}
        onClick={() => onFilter('withoutSize', true)}
      />
      <Metric label={t('registrants.noBib')} value={summary.withoutBib} onClick={() => onFilter('withoutBib', true)} />
      <Metric label={t('registrants.noEmergency')} value={summary.withoutEmergencyContact} onClick={() => onFilter('withoutEmergencyContact', true)} />
      <Metric label={t('registrants.collected')} value={formatMoney(summary.collectedCents, locale)} />
    </div>
  )
}

function Metric({ label, value, tone, onClick }: { label: string; value: ReactNode; tone?: string; onClick?: () => void }) {
  const content = (
    <>
      <div className={`text-xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </>
  )
  if (!onClick) return <Card className="p-3">{content}</Card>
  return (
    <button type="button" onClick={onClick} className="rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-md">
      {content}
    </button>
  )
}

function statusVariant(status: RegistrationStatus): 'success' | 'warning' | 'info' | 'destructive' | 'default' {
  switch (status) {
    case 'Paid':
      return 'success'
    case 'Pending':
      return 'warning'
    case 'UnderReview':
      return 'info'
    case 'Cancelled':
    case 'Expired':
      return 'destructive'
    default:
      return 'default'
  }
}

function resultVariant(result: ParticipationResult): 'success' | 'destructive' | 'warning' {
  switch (result) {
    case 'Dropped':
      return 'destructive'
    case 'NoShow':
      return 'warning'
    default:
      return 'success'
  }
}

function RegistrationRowView({
  row,
  locale,
  canRecordResult,
  hasActions,
  canCollect,
  canAssignBib,
  isAdmin,
  selected,
  onSelect,
  onOpen,
  onCollect,
  onBib,
  onStatus,
}: {
  row: RegistrationRow
  locale: string
  canRecordResult: boolean
  hasActions: boolean
  canCollect: boolean
  canAssignBib: boolean
  isAdmin: boolean
  selected: boolean
  onSelect: (checked: boolean) => void
  onOpen: () => void
  onCollect: () => void
  onBib: () => void
  onStatus: (action: StatusAction) => void
}) {
  const { t } = useTranslation()
  const missingSize = row.requiresSize && !row.size
  const collectable = row.status === 'Pending' || row.status === 'UnderReview'
  const hasBib = row.status !== 'Cancelled' && row.status !== 'Refunded' && row.status !== 'Expired'
  const reactivatable = row.status === 'Expired' || row.status === 'Cancelled'
  const cancellable = (row.status === 'Pending' || row.status === 'UnderReview' || row.status === 'Expired') && row.totalPaidCents === 0

  const stop = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  return (
    <tr className="cursor-pointer border-t hover:bg-accent/50" onClick={onOpen}>
      {canRecordResult && (
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-input" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        </td>
      )}
      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{row.code}</td>
      <td className="min-w-[160px] px-3 py-2">
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(row.status)}>{t(`registrations.statusLabel.${row.status}`)}</Badge>
          {row.result && <Badge variant={resultVariant(row.result)}>{t(`registrations.result.${row.result}`)}</Badge>}
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{row.bibNumber ?? '—'}</td>
      <td className="whitespace-nowrap px-3 py-2">
        <span className="text-xs text-muted-foreground">{t(`registrations.documentType.${row.documentType}`)}</span> {row.documentNumber}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-medium">
        {row.lastNames}, {row.firstNames}
      </td>
      <td className="px-3 py-2">{t(row.sex === 'Female' ? 'profile.genderFemale' : 'profile.genderMale')[0]}</td>
      <td className="px-3 py-2 text-right tabular-nums">{row.age}</td>
      <td className="whitespace-nowrap px-3 py-2">
        <a
          href={whatsAppLink(row.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-primary hover:underline"
          title={t('registrations.writeTo', { name: row.firstNames })}
        >
          <MessageCircle size={13} />
          {row.phone}
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-2">{row.modality}</td>
      <td className="whitespace-nowrap px-3 py-2">
        {row.ageCategory ?? <span className="text-destructive">{t('registrants.missingCategory')}</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-2">{row.kit}</td>
      <td className="whitespace-nowrap px-3 py-2">
        {missingSize ? (
          <span className="flex items-center gap-1 text-destructive">
            <Shirt size={13} />
            {t('registrants.missingSize')}
          </span>
        ) : (
          row.size ?? '—'
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(row.amountCents, locale)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{row.totalPaidCents > 0 ? formatMoney(row.totalPaidCents, locale) : '—'}</td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDateTime(row.createdAt, locale)}</td>

      {hasActions && (
        <td className="px-2 py-1">
          <div className="flex justify-end gap-1">
            <RowAction
              enabled={canCollect && (collectable || row.totalPaidCents > 0)}
              reason={!canCollect ? t('registrants.roleCollect') : !collectable && row.totalPaidCents === 0 ? t('registrants.notCollectable', { estado: row.status }) : undefined}
              onClick={stop(onCollect)}
              icon={<Receipt size={13} />}
              label={t('registrants.collect')}
            />
            <RowAction
              enabled={canAssignBib && hasBib}
              reason={!canAssignBib ? t('registrants.roleBib') : !hasBib ? t('registrants.noBib', { estado: row.status }) : undefined}
              onClick={stop(onBib)}
              icon={<Hash size={13} />}
              label={t('registrants.bib')}
            />
            <RowAction
              enabled={isAdmin && reactivatable}
              reason={!isAdmin ? t('registrants.roleReactivate') : !reactivatable ? t('registrants.onlyExpiredOrCanceled') : undefined}
              onClick={stop(() => onStatus('reactivate'))}
              icon={<RotateCcw size={13} />}
              label={t('registrants.reactivate')}
            />
            <RowAction
              enabled={isAdmin && cancellable}
              reason={!isAdmin ? t('registrants.roleCancel') : !cancellable ? (row.totalPaidCents > 0 ? t('registrants.revertPaymentFirst') : t('registrants.cantCancel', { estado: row.status })) : undefined}
              onClick={stop(() => onStatus('cancel'))}
              icon={<Ban size={13} />}
              label={t('registrants.cancel')}
              danger
            />
          </div>
        </td>
      )}
    </tr>
  )
}

function RowAction({
  enabled,
  reason,
  onClick,
  icon,
  label,
  danger,
}: {
  enabled: boolean
  reason?: string
  onClick: (event: React.MouseEvent) => void
  icon: ReactNode
  label: string
  danger?: boolean
}) {
  return (
    <span title={enabled ? undefined : reason}>
      <Button
        variant={danger ? 'ghost' : 'outline'}
        size="sm"
        disabled={!enabled}
        onClick={onClick}
        className={danger ? 'text-destructive hover:text-destructive' : undefined}
      >
        {icon}
        {label}
      </Button>
    </span>
  )
}

/** Result for several selected registrations at once, through the batch endpoint (same rules as the single result). */
function BatchResultDialog({
  eventId,
  registrationIds,
  onClose,
  onDone,
}: {
  eventId: number
  registrationIds: number[]
  onClose: () => void
  onDone: (message: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [result, setResult] = useState<ParticipationResult | null>(null)

  const save = useMutation({
    mutationFn: () => registrations.setResults(eventId, { registrationIds, result }),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['registrations'] })
      onDone(response.message)
      onClose()
    },
  })

  return (
    <FormDialog open title={t('resultado.title')} onClose={onClose} onSave={() => save.mutate()} saveText={t('resultado.confirm')} saving={save.isPending}>
      {save.isError && <ErrorNotice error={save.error} />}

      <p className="text-sm text-muted-foreground">{t('registrants.batchHelp', { count: registrationIds.length })}</p>

      <Field id="batch-result" label={t('resultado.title')}>
        <Select id="batch-result" autoFocus value={result ?? ''} onChange={(e) => setResult((e.target.value as ParticipationResult) || null)}>
          <option value="">{t('resultado.notRegistered')}</option>
          <option value="Finished">{t('registrations.result.Finished')}</option>
          <option value="Dropped">{t('registrations.result.Dropped')}</option>
          <option value="NoShow">{t('registrations.result.NoShow')}</option>
        </Select>
      </Field>
    </FormDialog>
  )
}
