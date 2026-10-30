'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin, Plus, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { brands, events, media } from '@/api/endpoints'
import type { EventStatus, SaveEvent } from '@/api/types'
import { EmptyState, ErrorNotice, Loading } from '@/components/ui/states'
import { FormDialog } from '@/components/ui/dialog'
import { Badge, Button, Card, Select } from '@/components/ui/primitives'
import { Metric } from '@/components/ui/Metric'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/auth/AuthContext'
import { EMPTY_EVENT, EventForm } from './EventForm'

/** Badge colour for each event status. */
export function statusVariant(status: EventStatus) {
  switch (status) {
    case 'Published':
      return 'success' as const
    case 'Draft':
      return 'warning' as const
    case 'Cancelled':
      return 'destructive' as const
    default:
      return 'default' as const
  }
}

export function EventsPage() {
  const { t, i18n } = useTranslation()
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()

  const [includeFinished, setIncludeFinished] = useState(false)
  const [brandFilter, setBrandFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<SaveEvent>(EMPTY_EVENT)

  const query = useQuery({
    queryKey: ['events', includeFinished, brandFilter],
    queryFn: () => events.list(includeFinished, brandFilter || undefined),
  })

  const brandList = useQuery({
    queryKey: ['brands'],
    queryFn: brands.list,
    staleTime: Infinity,
  })

  const create = useMutation({
    mutationFn: (body: SaveEvent) => events.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      setDialogOpen(false)
      setDraft(EMPTY_EVENT)
    },
  })

  const canManage = hasRole('Admin')

  const openDialog = () => {
    create.reset()
    setDraft(EMPTY_EVENT)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('nav.events')}</h1>
          <p className="text-sm text-muted-foreground">{t('events.description')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            aria-label={t('operation.brand')}
            className="w-auto"
            value={brandFilter}
            onChange={(event) => setBrandFilter(event.target.value)}
          >
            <option value="">{t('operation.brandAll')}</option>
            {brandList.data?.map((brand) => (
              <option key={brand.id} value={brand.code}>
                {brand.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={includeFinished}
              onChange={(event) => setIncludeFinished(event.target.checked)}
            />
            {t('events.includeFinished')}
          </label>

          {canManage && (
            <Button onClick={openDialog}>
              <Plus size={16} />
              {t('events.new')}
            </Button>
          )}
        </div>
      </div>

      {query.isPending && <Loading />}
      {query.isError && <ErrorNotice error={query.error} />}

      {query.data?.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={t('events.empty')}
          message={t('events.emptyMessage')}
          action={canManage ? { label: t('events.new'), onClick: openDialog } : undefined}
        />
      )}

      {query.data && query.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((event) => (
            <Link key={event.id} href={`/events/${event.id}/`} className="group">
              <Card className="h-full overflow-hidden p-0 transition-shadow group-hover:shadow-md">
                {event.imagePath && (
                  <div className="aspect-square w-full max-w-[500px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation */}
                    <img src={media.eventImageUrl(event.slug)} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold group-hover:text-primary">{event.name}</h2>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {event.brandName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {formatDate(event.eventDate, i18n.language)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant={statusVariant(event.status)}>{t(`eventForm.status.${event.status}`)}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t pt-3">
                    <Metric value={event.paidRegistrations} label={t('eventUi.paid')} />
                    <Metric value={event.pendingRegistrations} label={t('eventUi.pending')} />
                    <Metric value={event.modalityCount} label={t('eventUi.modalities')} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <FormDialog
        open={dialogOpen}
        title={t('events.new')}
        onClose={() => setDialogOpen(false)}
        onSave={() => create.mutate(draft)}
        saving={create.isPending}
        saveText={t('eventUi.create')}
      >
        {create.isError && <ErrorNotice error={create.error} />}
        <EventForm value={draft} onChange={setDraft} />
      </FormDialog>
    </div>
  )
}
