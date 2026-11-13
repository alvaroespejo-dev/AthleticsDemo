'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, MapPin, Pencil, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { events } from '@/api/endpoints'
import type { SaveEvent } from '@/api/types'
import { ErrorNotice, Loading, SuccessNotice } from '@/components/ui/states'
import { FormDialog } from '@/components/ui/dialog'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { Metric } from '@/components/ui/Metric'
import { formatDate, formatDateTime } from '@/lib/format'
import { useAuth } from '@/auth/AuthContext'
import { EventForm, eventToForm } from './EventForm'
import { ModalitiesSection } from './modalities/ModalitiesSection'
import { AgeCategoriesSection } from './AgeCategoriesSection'
import { EventImageSection, RunnerManualSection } from './EventMediaSections'
import { statusVariant } from './EventsPage'

export function EventDetailPage() {
  const { t, i18n } = useTranslation()
  // Static export pre-renders a placeholder id (`/events/_`); the real id is read from the browser URL.
  const eventId = Number(usePathname().split('/').filter(Boolean)[1])
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<SaveEvent | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => events.get(eventId),
    enabled: Number.isFinite(eventId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    void queryClient.invalidateQueries({ queryKey: ['events'] })
  }

  const update = useMutation({
    mutationFn: (body: SaveEvent) => events.update(eventId, body),
    onSuccess: () => {
      invalidate()
      setEditing(false)
    },
  })

  const publish = useMutation({
    mutationFn: () => events.publish(eventId),
    onSuccess: () => {
      invalidate()
      setMessage(t('eventForm.published'))
    },
  })

  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorNotice error={query.error} />

  const event = query.data
  const canManage = hasRole('Admin')

  return (
    <div className="space-y-6">
      <Link href="/events/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        {t('nav.events')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{event.name}</h1>
            <Badge variant={statusVariant(event.status)}>{t(`eventForm.status.${event.status}`)}</Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {formatDate(event.eventDate, i18n.language)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {event.location}
              </span>
            )}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/{event.slug}</code>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraft(eventToForm(event))
                update.reset()
                setEditing(true)
              }}
            >
              <Pencil size={14} />
              {t('eventUi.editEvent')}
            </Button>

            {event.status === 'Draft' && (
              <Button onClick={() => publish.mutate()} isLoading={publish.isPending}>
                <Send size={14} />
                {t('events.publish')}
              </Button>
            )}
          </div>
        )}
      </div>

      {message && <SuccessNotice>{message}</SuccessNotice>}
      {publish.isError && <ErrorNotice error={publish.error} />}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('catalog.eventWindow')}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={<span className="text-sm">{formatDateTime(event.registrationOpensAt, i18n.language)}</span>}
            label={t('operation.registrationOpening')}
          />
          <Metric
            value={<span className="text-sm">{formatDateTime(event.registrationClosesAt, i18n.language)}</span>}
            label={t('operation.registrationClosing')}
          />
          <Metric
            value={<span className="text-sm">{event.reservationHours} h</span>}
            label={t('operation.reservationHours')}
          />
          <Metric
            value={
              <span className="text-sm">
                {event.sizeChangeClosesAt ? formatDate(event.sizeChangeClosesAt, i18n.language) : '—'}
              </span>
            }
            label={t('operation.sizeChangeClosing')}
          />
        </div>
      </Card>

      <EventImageSection event={event} canManage={canManage} onChanged={invalidate} />

      <RunnerManualSection event={event} canManage={canManage} onChanged={invalidate} />

      <ModalitiesSection event={event} canManage={canManage} onChanged={invalidate} />

      <AgeCategoriesSection event={event} canManage={canManage} onChanged={invalidate} />

      <FormDialog
        open={editing}
        title={t('events.edit')}
        onClose={() => setEditing(false)}
        onSave={() => draft && update.mutate(draft)}
        saving={update.isPending}
      >
        {update.isError && <ErrorNotice error={update.error} />}
        {draft && <EventForm value={draft} onChange={setDraft} />}
      </FormDialog>
    </div>
  )
}
