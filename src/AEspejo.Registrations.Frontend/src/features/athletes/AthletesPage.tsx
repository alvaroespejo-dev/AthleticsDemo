'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Contact, MessageCircle, Pencil, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { athletes, events } from '@/api/endpoints'
import type { AthleteFilter, AthleteOrder, AthleteRow, AthleteSummary, Sex } from '@/api/types'
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives'
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '@/components/ui/states'
import { useAuth } from '@/auth/AuthContext'
import { formatDate, whatsAppLink } from '@/lib/format'
import { AthleteEditDialog } from './AthleteEditDialog'

const EMPTY_FILTER: AthleteFilter = { page: 1, size: 25, order: 'LastNameAsc' }

/** The athlete register: one row per person across all events. Complements the registrants screen, which works inside one event. */
export function AthletesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { hasRole } = useAuth()
  // Correcting contact data is an operational task, not only for administrators.
  const canEdit = hasRole('Admin', 'Cashier', 'KitStaff')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [appliedText, setAppliedText] = useState('')
  const [filter, setFilter] = useState<AthleteFilter>(EMPTY_FILTER)

  const eventList = useQuery({ queryKey: ['events', true], queryFn: () => events.list(true) })

  const listing = useQuery({
    queryKey: ['athletes', { ...filter, text: appliedText }],
    queryFn: () => athletes.list({ ...filter, text: appliedText }),
    placeholderData: keepPreviousData,
  })

  /** Any filter change goes back to the first page: staying on page 7 of a result that now has 2 would show an empty table. */
  const setField = <K extends keyof AthleteFilter>(field: K, value: AthleteFilter[K]) =>
    setFilter((f) => ({ ...f, [field]: value, page: 1 }))

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setAppliedText(text)
    setFilter((f) => ({ ...f, page: 1 }))
  }

  const page = listing.data?.page

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('nav.athletes')}</h1>
        <p className="text-sm text-muted-foreground">{t('athletes.description')}</p>
      </div>

      {notice && <SuccessNotice>{notice}</SuccessNotice>}

      {listing.data && <SummaryCards summary={listing.data.summary} onFilter={setField} />}

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitSearch}>
          <div className="lg:col-span-2">
            <Field id="search" label={t('athletes.search')}>
              <div className="flex gap-2">
                <Input id="search" placeholder={t('athletes.searchPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} />
                <Button type="submit" variant="outline">
                  <Search size={16} />
                </Button>
              </div>
            </Field>
          </div>

          <Field id="city" label={t('athletes.city')}>
            <Input id="city" placeholder={t('athletes.allCities')} value={filter.city ?? ''} onChange={(e) => setField('city', e.target.value)} />
          </Field>

          <Field id="club" label={t('athletes.club')}>
            <Input id="club" placeholder={t('athletes.allClubs')} value={filter.club ?? ''} onChange={(e) => setField('club', e.target.value)} />
          </Field>

          <Field id="athlete-event" label={t('athletes.participatedIn')}>
            <Select id="athlete-event" value={filter.eventId ?? ''} onChange={(e) => setField('eventId', e.target.value ? Number(e.target.value) : '')}>
              <option value="">{t('athletes.anyEvent')}</option>
              {eventList.data?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="athlete-sex" label={t('athletes.gender')}>
            <Select id="athlete-sex" value={filter.sex ?? ''} onChange={(e) => setField('sex', e.target.value as Sex | '')}>
              <option value="">{t('athletes.all')}</option>
              <option value="Female">{t('profile.genderFemale')}</option>
              <option value="Male">{t('profile.genderMale')}</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field id="min-age" label={t('athletes.fromAge')}>
              <Input id="min-age" type="number" min={0} max={120} value={filter.minAge ?? ''} onChange={(e) => setField('minAge', e.target.value ? Number(e.target.value) : '')} />
            </Field>
            <Field id="max-age" label={t('athletes.toAge')}>
              <Input id="max-age" type="number" min={0} max={120} value={filter.maxAge ?? ''} onChange={(e) => setField('maxAge', e.target.value ? Number(e.target.value) : '')} />
            </Field>
          </div>

          <Field id="athlete-order" label={t('athletes.sortBy')}>
            <Select id="athlete-order" value={filter.order ?? 'LastNameAsc'} onChange={(e) => setField('order', e.target.value as AthleteOrder)}>
              <option value="LastNameAsc">{t('athletes.lastName')}</option>
              <option value="RecentDesc">{t('athletes.recent')}</option>
              <option value="MostEvents">{t('athletes.moreEvents')}</option>
              <option value="LastRaceDesc">{t('athletes.lastRace')}</option>
            </Select>
          </Field>

          <div className="flex items-end gap-4 lg:col-span-2">
            <CheckFilter label={t('athletes.acceptsMarketing')} checked={!!filter.marketingOptIn} onChange={(v) => setField('marketingOptIn', v || undefined)} />
            <CheckFilter label={t('athletes.withEmail')} checked={!!filter.withEmail} onChange={(v) => setField('withEmail', v || undefined)} />
          </div>
        </form>
      </Card>

      {listing.isError && <ErrorNotice error={listing.error} />}
      {listing.isPending && <Loading />}

      {page && page.total === 0 && <EmptyState icon={Contact} title={t('athletes.noMatch')} message={t('athletes.noMatchHelp')} />}

      {page && page.total > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {[
                    t('athletes.document'),
                    t('athletes.athlete'),
                    t('athletes.gender'),
                    t('athletes.age'),
                    t('athletes.phone'),
                    t('athletes.email'),
                    t('athletes.city'),
                    t('athletes.club'),
                    t('athletes.events'),
                    t('athletes.lastRace'),
                    t('athletes.marketing'),
                  ].map((column) => (
                    <th key={column} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column}
                    </th>
                  ))}
                  {canEdit && <th className="w-28" />}
                </tr>
              </thead>
              <tbody>
                {page.items.map((athlete) => (
                  <AthleteRowView key={athlete.id} athlete={athlete} locale={locale} canEdit={canEdit} onEdit={() => setEditingId(athlete.id)} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {page.total} {page.total === 1 ? t('athletes.athleteOne') : t('athletes.athleteMany')} · {t('pagination.page')} {page.page} {t('registrations.pageOf')} {page.totalPages}
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
      )}

      {editingId !== null && (
        <AthleteEditDialog athleteId={editingId} canUnlink={hasRole('Admin')} onClose={() => setEditingId(null)} onDone={setNotice} />
      )}
    </div>
  )
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function AthleteRowView({ athlete, locale, canEdit, onEdit }: { athlete: AthleteRow; locale: string; canEdit: boolean; onEdit: () => void }) {
  const { t } = useTranslation()
  const contactable = athlete.marketingOptIn && !athlete.unsubscribedAt

  return (
    <tr className={canEdit ? 'cursor-pointer border-t hover:bg-accent/50' : 'border-t'} onClick={canEdit ? onEdit : undefined}>
      <td className="whitespace-nowrap px-3 py-2">
        <span className="text-xs text-muted-foreground">{t(`registrations.documentType.${athlete.documentType}`)}</span> {athlete.documentNumber}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-medium">
        {athlete.lastNames}, {athlete.firstNames}
      </td>
      <td className="px-3 py-2">{t(athlete.sex === 'Female' ? 'profile.genderFemale' : 'profile.genderMale')[0]}</td>
      <td className="px-3 py-2 text-right tabular-nums">{athlete.age}</td>
      <td className="whitespace-nowrap px-3 py-2">
        <a
          href={whatsAppLink(athlete.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-primary hover:underline"
          title={t('athletes.whatsappTitle', { name: athlete.firstNames })}
        >
          <MessageCircle size={13} />
          {athlete.phone}
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{athlete.email ?? '—'}</td>
      <td className="whitespace-nowrap px-3 py-2">{athlete.city ?? '—'}</td>
      <td className="whitespace-nowrap px-3 py-2">{athlete.club ?? '—'}</td>
      <td className="px-3 py-2 text-right tabular-nums" title={t('athletes.paidTitle', { count: athlete.eventsPaid })}>
        {athlete.eventsRegistered}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {athlete.lastEventDate ? (
          <span title={athlete.lastEventName ?? undefined}>{formatDate(athlete.lastEventDate, locale)}</span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2">
        {athlete.unsubscribedAt ? (
          <Badge variant="destructive">{t('athletes.unsubscribed')}</Badge>
        ) : contactable ? (
          <Badge variant="success">{t('athletes.yes')}</Badge>
        ) : (
          <span className="text-muted-foreground">{t('athletes.no')}</span>
        )}
      </td>

      {canEdit && (
        <td className="px-2 py-1">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil size={13} />
              {t('athletes.edit')}
            </Button>
          </div>
        </td>
      )}
    </tr>
  )
}

function SummaryCards({ summary, onFilter }: { summary: AthleteSummary; onFilter: <K extends keyof AthleteFilter>(field: K, value: AthleteFilter[K]) => void }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metric label={t('athletes.total')} value={summary.total} />
      <Metric label={t('athletes.uniquePhones')} value={summary.withWhatsApp} help={t('athletes.uniquePhonesHelp')} />
      <Metric label={t('athletes.withEmail')} value={summary.withEmail} onClick={() => onFilter('withEmail', true)} />
      <Metric label={t('athletes.contactable')} value={summary.withMarketingOptIn} tone="text-green-600" help={t('athletes.contactableHelp')} onClick={() => onFilter('marketingOptIn', true)} />
      <Metric label={t('athletes.unsubscribedTotal')} value={summary.unsubscribed} tone={summary.unsubscribed > 0 ? 'text-destructive' : undefined} />
    </div>
  )
}

function Metric({ label, value, tone, help, onClick }: { label: string; value: ReactNode; tone?: string; help?: string; onClick?: () => void }) {
  const content = (
    <>
      <div className={`text-xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </>
  )
  if (!onClick) return <Card className="p-3" title={help}>{content}</Card>
  return (
    <button type="button" onClick={onClick} title={help} className="rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-md">
      {content}
    </button>
  )
}
