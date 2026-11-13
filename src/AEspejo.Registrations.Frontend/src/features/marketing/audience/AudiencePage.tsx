'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, MessageCircle, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { audience, events } from '@/api/endpoints'
import type { AudienceFilter } from '@/api/types'
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives'
import { FormDialog } from '@/components/ui/dialog'
import { EmptyState, ErrorNotice, InfoNotice, Loading, SuccessNotice } from '@/components/ui/states'
import { formatDate } from '@/lib/format'
import { SendCampaignDialog } from '@/features/marketing/campaigns/SendCampaignDialog'
import { AudienceBuilder, EstimateCard } from './AudienceBuilder'

type HeaderState = 'all' | 'none' | 'partial'

const EMPTY_FILTER: AudienceFilter = {
  scope: 'All',
  eventId: null,
  segmentId: null,
  conditions: [],
  excludedAthleteIds: [],
}

/**
 * Contact finder for promotions: builds the audience, shows how many people it reaches and who they
 * are, and from here it is saved as a segment or turned into a WhatsApp campaign.
 */
export function AudiencePage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<AudienceFilter>(EMPTY_FILTER)
  const [page, setPage] = useState(1)
  // IDs that match the criterion but the operator removed with the checkbox on their row. They are
  // not part of `filter`: that is what gets saved as a segment ("the criterion, not the list of
  // people"), so the exclusion is only merged in when the estimate or the send is requested.
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [savingSegment, setSavingSegment] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // The filter is applied late: without this, every keystroke in a condition value would fire an
  // estimate and a preview against the whole base.
  const deferredFilter = useDeferred(filter, 400)

  // A new criterion brings different candidates: the IDs excluded from the previous audience mean
  // nothing here.
  useEffect(() => {
    setPage(1)
    setExcluded(new Set())
  }, [deferredFilter])

  const eventList = useQuery({ queryKey: ['events', true], queryFn: () => events.list(true) })
  const segments = useQuery({ queryKey: ['segments'], queryFn: () => audience.segments() })

  // The preview lists everyone who matches, excluded or not: that is where the checkboxes come from.
  // The estimate (and the send) subtract the exclusions, because that is the real number of messages.
  const filterWithExclusions: AudienceFilter = { ...deferredFilter, excludedAthleteIds: [...excluded] }

  const estimate = useQuery({
    queryKey: ['audience-estimate', filterWithExclusions],
    queryFn: () => audience.estimate(filterWithExclusions),
    placeholderData: keepPreviousData,
  })

  const preview = useQuery({
    queryKey: ['audience-preview', deferredFilter, page],
    queryFn: () => audience.preview(deferredFilter, page),
    placeholderData: keepPreviousData,
  })

  const pageIds = preview.data?.items.map((athlete) => athlete.id) ?? []
  const includedOnPage = pageIds.filter((id) => !excluded.has(id))
  const headerState: HeaderState =
    pageIds.length === 0 || includedOnPage.length === 0
      ? 'none'
      : includedOnPage.length === pageIds.length
        ? 'all'
        : 'partial'

  const toggleExcluded = (id: number) =>
    setExcluded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Touching the header only affects the rows of this page: rows on other pages keep their state, so
  // going back and forth does not lose what was already unticked there.
  const togglePage = () =>
    setExcluded((previous) => {
      const next = new Set(previous)
      const excludeAll = headerState === 'all'
      for (const id of pageIds) {
        if (excludeAll) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const hasAudience = (estimate.data?.withWhatsApp ?? 0) > 0

  if (eventList.isError) return <ErrorNotice error={eventList.error} />
  if (segments.isError) return <ErrorNotice error={segments.error} />
  if (eventList.isPending || segments.isPending) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('marketing.findParticipants')}</h1>
        <p className="text-sm text-muted-foreground">{t('marketing.description')}</p>
      </div>

      {notice && <SuccessNotice>{notice}</SuccessNotice>}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <AudienceBuilder filter={filter} onChange={setFilter} events={eventList.data} segments={segments.data} />

        <div className="space-y-3">
          {estimate.isError ? (
            <ErrorNotice error={estimate.error} />
          ) : (
            <EstimateCard
              total={estimate.data?.total ?? 0}
              withWhatsApp={estimate.data?.withWhatsApp ?? 0}
              withEmail={estimate.data?.withEmail ?? 0}
              loading={estimate.isFetching}
            />
          )}

          <Button
            className="w-full"
            disabled={!hasAudience}
            title={hasAudience ? undefined : t('marketing.noRecipients')}
            onClick={() => setSending(true)}
          >
            <MessageCircle size={16} />
            {t('marketing.sendWhatsApp')}
          </Button>

          <Button variant="outline" className="w-full" onClick={() => setSavingSegment(true)}>
            <Bookmark size={16} />
            {t('marketing.saveSegment')}
          </Button>

          <InfoNotice>{t('audience.consentNote')}</InfoNotice>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">{t('marketing.recipients')}</h2>

        {preview.isError && <ErrorNotice error={preview.error} />}
        {preview.isPending && <Loading />}

        {preview.data && preview.data.total === 0 && (
          <EmptyState icon={Users} title={t('audiencePage.emptyTitle')} message={t('audiencePage.emptyMessage')} />
        )}

        {preview.data && preview.data.total > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <TriStateCheckbox state={headerState} onChange={togglePage} label={t('audience.selectPage')} />
                    </th>
                    {[
                      t('audience.athlete'),
                      t('audience.age'),
                      t('audience.phone'),
                      t('audience.city'),
                      t('audience.events'),
                      t('audience.lastRace'),
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.items.map((athlete) => (
                    <tr key={athlete.id} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input"
                          checked={!excluded.has(athlete.id)}
                          onChange={() => toggleExcluded(athlete.id)}
                          aria-label={t('audiencePage.sendTo', { name: `${athlete.firstNames} ${athlete.lastNames}` })}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {athlete.lastNames}, {athlete.firstNames}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{athlete.age}</td>
                      <td className="whitespace-nowrap px-3 py-2">{athlete.phone}</td>
                      <td className="whitespace-nowrap px-3 py-2">{athlete.city ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{athlete.eventsPaid}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {athlete.lastEventDate ? formatDate(athlete.lastEventDate, i18n.language) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {preview.data.total} {t('audience.recipientsCount')} · {t('pagination.page')} {preview.data.page}{' '}
                {t('registrations.pageOf')} {preview.data.totalPages}
                {excluded.size > 0 && ` · ${excluded.size} ${t('audience.unmarked')}`}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!preview.data.hasPrevious} onClick={() => setPage((p) => p - 1)}>
                  {t('pagination.previous')}
                </Button>
                <Button variant="outline" size="sm" disabled={!preview.data.hasNext} onClick={() => setPage((p) => p + 1)}>
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {savingSegment && (
        <SaveSegmentDialog
          filter={filter}
          onClose={() => setSavingSegment(false)}
          onSaved={(message) => {
            void queryClient.invalidateQueries({ queryKey: ['segments'] })
            setNotice(message)
            setSavingSegment(false)
          }}
        />
      )}

      {sending && (
        <SendCampaignDialog
          filter={{ ...filter, excludedAthleteIds: [...excluded] }}
          events={eventList.data}
          estimate={estimate.data}
          onClose={() => setSending(false)}
          onCreated={(id) => router.push(`/marketing/campaigns?campaign=${id}`)}
        />
      )}
    </div>
  )
}

function SaveSegmentDialog({
  filter,
  onClose,
  onSaved,
}: {
  filter: AudienceFilter
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // The criterion is saved, not the list of people: the next use reaches whoever matches then.
  const save = useMutation({
    mutationFn: () =>
      audience.saveSegment({ name: name.trim(), description: description.trim() || null, filter }),
    onSuccess: (segment) => onSaved(t('audience.segmentSaved', { name: segment.name })),
  })

  return (
    <FormDialog
      open
      title={t('marketing.saveSegment')}
      onClose={onClose}
      onSave={() => save.mutate()}
      saving={save.isPending}
      disabled={name.trim().length < 2}
    >
      {save.isError && <ErrorNotice error={save.error} />}

      <InfoNotice>{t('audiencePage.segmentCriteriaNote')}</InfoNotice>

      <Field id="segment-name" label={t('audiencePage.nameLabel')}>
        <Input
          id="segment-name"
          required
          autoFocus
          minLength={2}
          maxLength={200}
          placeholder={t('audiencePage.segmentNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field id="segment-description" label={t('audiencePage.descriptionOptional')}>
        <Textarea
          id="segment-description"
          rows={2}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
    </FormDialog>
  )
}

/**
 * Column-header checkbox with a third visual state ("partial", the dash) for when some rows of the
 * page are ticked and others are not. That state is not a React prop: it is a DOM property
 * (`indeterminate`), so it has to be pushed by hand through a ref.
 */
function TriStateCheckbox({ state, onChange, label }: { state: HeaderState; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'partial'
  }, [state])

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-input"
      checked={state === 'all'}
      onChange={onChange}
      aria-label={label}
    />
  )
}

/** Returns the value only after it has stayed unchanged for a while. */
function useDeferred<T>(value: T, milliseconds: number): T {
  const [deferred, setDeferred] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDeferred(value), milliseconds)

    return () => clearTimeout(timer)
  }, [value, milliseconds])

  return deferred
}
