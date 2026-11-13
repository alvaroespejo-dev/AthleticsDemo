'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Field, Select } from './primitives'

/**
 * Earliest birth year offered. Any earlier year is a typo (0001…1940): nobody competing could have been
 * born then. 1940 also leaves out the "default" dates that forms autofill with year 1.
 */
const MINIMUM_YEAR = 1940

/** Locale used for the month names, following the site language. */
const LOCALE_BY_LANGUAGE = { es: 'es-BO', en: 'en-US', pt: 'pt-BR' } as const

interface Parts {
  day: string
  month: string
  year: string
}

const EMPTY_PARTS: Parts = { day: '', month: '', year: '' }

function todayIso(): string {
  const today = new Date()

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

/** Days in a month (1–12). Without a year, February allows 29 so a valid 29 February is not cut off. */
function daysInMonth(month: number, year?: number): number {
  return new Date(year ?? 2000, month, 0).getDate()
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
}

function partsFromIso(iso: string): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return EMPTY_PARTS

  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) }
}

/** The ISO date when day/month/year form a real date, or `null` when it does not exist (e.g. 31/02). */
function isoFromParts({ day, month, year }: Parts): string | null {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null

  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface Props {
  id: string
  /** Birth date as ISO ("yyyy-mm-dd"), or empty. */
  value: string
  onChange: (iso: string) => void
  required?: boolean
  disabled?: boolean
}

/**
 * Birth date with three native selectors (day, month, year). They are easier to use than an
 * `<input type="date">`: on a phone they open the system wheel or list, and they do not depend on the
 * browser's date format (dd/mm vs mm/dd).
 *
 * The year goes from today back to 1940, newest first. An ISO date is only emitted when all three parts
 * are chosen and form a real date that is not in the future; otherwise "" is emitted.
 */
export function BirthDateField({ id, value, onChange, required, disabled }: Props) {
  const { i18n, t } = useTranslation()
  const language = (i18n.language in LOCALE_BY_LANGUAGE ? i18n.language : 'en') as keyof typeof LOCALE_BY_LANGUAGE
  const locale = LOCALE_BY_LANGUAGE[language]
  const max = todayIso()
  const currentYear = Number(max.slice(0, 4))
  const firstSelectRef = useRef<HTMLSelectElement>(null)

  const [parts, setParts] = useState<Parts>(() => partsFromIso(value))
  const [lastEmitted, setLastEmitted] = useState(value)

  // If the value changes from outside (for example autofilling an existing athlete), its parts are
  // reflected. If the change came from this control, they are already reflected in `parts`.
  useEffect(() => {
    if (value === lastEmitted) return
    setParts(partsFromIso(value))
    setLastEmitted(value)
  }, [value, lastEmitted])

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear; y >= MINIMUM_YEAR; y--) list.push(y)

    return list
  }, [currentYear])

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        name: capitalize(new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1))),
      })),
    [locale],
  )

  // With all three parts chosen the date may not exist (31/02) or be in the future. With incomplete parts
  // no message is shown: the `required` attribute already covers it on submit.
  // The day selector only offers the days the chosen month allows (31 until a month is chosen).
  const availableDays = parts.month !== '' ? daysInMonth(Number(parts.month), parts.year !== '' ? Number(parts.year) : undefined) : 31

  const complete = parts.day !== '' && parts.month !== '' && parts.year !== ''
  const iso = complete ? isoFromParts(parts) : null
  const message = !complete
    ? null
    : iso === null
      ? t('forms.invalidDate')
      : iso > max
        ? t('forms.futureDate')
        : null

  // A selector cannot flag a range error by itself: setCustomValidity blocks the submit.
  useEffect(() => {
    firstSelectRef.current?.setCustomValidity(message ?? '')
  }, [message])

  const change = (field: keyof Parts, nextValue: string) => {
    const next = { ...parts, [field]: nextValue }
    // If the chosen day does not exist in the new month/year (e.g. 31 and then February), it is set to the last valid day.
    if (field !== 'day' && next.day !== '' && next.month !== '') {
      const maximum = daysInMonth(Number(next.month), next.year !== '' ? Number(next.year) : undefined)
      if (Number(next.day) > maximum) next.day = String(maximum)
    }
    const nextComplete = next.day !== '' && next.month !== '' && next.year !== ''
    const nextIso = nextComplete ? isoFromParts(next) : null
    const emit = nextIso !== null && nextIso <= max ? nextIso : ''

    setParts(next)
    setLastEmitted(emit)
    onChange(emit)
  }

  const dayLabel = t('forms.day')
  const monthLabel = t('forms.month')
  const yearLabel = t('forms.year')

  return (
    <Field id={id} label={t('operation.birthDate')}>
      <div className="grid grid-cols-[1fr_2fr_1.3fr] gap-2" role="group" aria-invalid={Boolean(message)}>
        <Select
          ref={firstSelectRef}
          id={id}
          aria-label={dayLabel}
          required={required}
          disabled={disabled}
          value={parts.day}
          aria-invalid={Boolean(message)}
          onChange={(e) => change('day', e.target.value)}
        >
          <option value="" disabled>{dayLabel}</option>
          {Array.from({ length: availableDays }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
        </Select>
        <Select
          aria-label={monthLabel}
          required={required}
          disabled={disabled}
          value={parts.month}
          aria-invalid={Boolean(message)}
          onChange={(e) => change('month', e.target.value)}
        >
          <option value="" disabled>{monthLabel}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </Select>
        <Select
          aria-label={yearLabel}
          required={required}
          disabled={disabled}
          value={parts.year}
          aria-invalid={Boolean(message)}
          onChange={(e) => change('year', e.target.value)}
        >
          <option value="" disabled>{yearLabel}</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </Select>
      </div>
      {message && <p className="text-xs text-destructive">{message}</p>}
    </Field>
  )
}
