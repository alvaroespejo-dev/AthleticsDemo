'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { brands } from '@/api/endpoints'
import type { EventDetail, SaveEvent } from '@/api/types'
import { Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { centsToText, textToCents, toDateTimeInput, fromDateTimeInput } from '@/lib/format'

interface Props {
  value: SaveEvent
  onChange: (value: SaveEvent) => void
}

/** Empty draft for a new event. The brand is left unset on purpose: it decides which landing shows the event. */
export const EMPTY_EVENT: SaveEvent = {
  name: '',
  brandId: 0,
  description: '',
  location: '',
  eventDate: '',
  registrationOpensAt: '',
  registrationClosesAt: '',
  sizeChangeClosesAt: null,
  reservationHours: 48,
  paymentToleranceCents: 0,
  waiverText: '',
}

export function eventToForm(event: EventDetail): SaveEvent {
  return {
    name: event.name,
    brandId: event.brandId,
    slug: event.slug,
    description: event.description,
    location: event.location,
    eventDate: event.eventDate,
    registrationOpensAt: event.registrationOpensAt,
    registrationClosesAt: event.registrationClosesAt,
    sizeChangeClosesAt: event.sizeChangeClosesAt,
    reservationHours: event.reservationHours,
    paymentToleranceCents: event.paymentToleranceCents,
    serviceFeeCents: event.serviceFeeCents,
    waiverText: event.waiverText,
    imagePath: event.imagePath,
    runnerManualPath: event.runnerManualPath,
    runnerManualName: event.runnerManualName,
  }
}

export function EventForm({ value, onChange }: Props) {
  const { t } = useTranslation()
  const set = <K extends keyof SaveEvent>(field: K, next: SaveEvent[K]) => onChange({ ...value, [field]: next })

  // The brand catalogue changes with a deployment, not on the fly.
  const brandList = useQuery({
    queryKey: ['brands'],
    queryFn: brands.list,
    staleTime: Infinity,
  })

  return (
    <>
      <Field id="brand" label={t('operation.brand')} hint={t('eventForm.brandHelp')}>
        <Select
          id="brand"
          required
          // Empty string and not 0: this is what makes the browser block submission until a brand is chosen.
          value={value.brandId || ''}
          onChange={(event) => set('brandId', Number(event.target.value))}
        >
          <option value="">{t('operation.brandChoose')}</option>
          {brandList.data?.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="name" label={t('operation.name')} hint={t('eventForm.nameHelp')}>
        <Input id="name" required value={value.name} onChange={(event) => set('name', event.target.value)} />
      </Field>

      <Field id="location" label={t('operation.place')}>
        <Input id="location" value={value.location ?? ''} onChange={(event) => set('location', event.target.value)} />
      </Field>

      <Field id="eventDate" label={t('operation.eventDay')} hint={t('operation.eventDayHelp')}>
        <Input
          id="eventDate"
          type="date"
          required
          value={value.eventDate}
          onChange={(event) => set('eventDate', event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="opensAt" label={t('operation.registrationOpening')}>
          <Input
            id="opensAt"
            type="datetime-local"
            required
            value={toDateTimeInput(value.registrationOpensAt)}
            onChange={(event) => set('registrationOpensAt', fromDateTimeInput(event.target.value))}
          />
        </Field>

        <Field id="closesAt" label={t('operation.registrationClosing')}>
          <Input
            id="closesAt"
            type="datetime-local"
            required
            value={toDateTimeInput(value.registrationClosesAt)}
            onChange={(event) => set('registrationClosesAt', fromDateTimeInput(event.target.value))}
          />
        </Field>
      </div>

      <Field id="sizeChangeClosesAt" label={t('operation.sizeChangeClosing')} hint={t('eventForm.sizeChangeHelp')}>
        <Input
          id="sizeChangeClosesAt"
          type="datetime-local"
          value={toDateTimeInput(value.sizeChangeClosesAt)}
          onChange={(event) =>
            set('sizeChangeClosesAt', event.target.value ? fromDateTimeInput(event.target.value) : null)
          }
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reservationHours" label={t('operation.reservationHours')} hint={t('eventForm.reservationHelp')}>
          <Input
            id="reservationHours"
            type="number"
            min={1}
            max={720}
            value={value.reservationHours}
            onChange={(event) => set('reservationHours', Number(event.target.value))}
          />
        </Field>

        <Field id="paymentTolerance" label={t('operation.paymentTolerance')} hint={t('eventForm.toleranceHelp')}>
          <Input
            id="paymentTolerance"
            inputMode="decimal"
            value={centsToText(value.paymentToleranceCents)}
            onChange={(event) => set('paymentToleranceCents', textToCents(event.target.value))}
          />
        </Field>
      </div>

      <Field id="waiver" label={t('operation.liability')} hint={t('eventForm.liabilityHelp')}>
        <Textarea id="waiver" value={value.waiverText ?? ''} onChange={(event) => set('waiverText', event.target.value)} />
      </Field>

      <Field id="description" label={t('operation.description')}>
        <Textarea
          id="description"
          value={value.description ?? ''}
          onChange={(event) => set('description', event.target.value)}
        />
      </Field>
    </>
  )
}
