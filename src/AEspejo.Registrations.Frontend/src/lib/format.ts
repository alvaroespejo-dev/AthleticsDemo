/**
 * Amounts travel as integers in cents so floating-point errors never creep in. The division by 100
 * happens only here, at display time.
 */
export function formatMoney(cents: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/** Converts what the user types (e.g. "350,50") into integer cents. */
export function textToCents(text: string): number {
  const clean = text.replace(/\s/g, '').replace(',', '.')
  const value = Number.parseFloat(clean)

  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export function centsToText(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** Shows a distance in km from the metres the database stores. */
export function formatDistance(meters: number): string {
  const km = meters / 1000

  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`
}

/**
 * Builds the WhatsApp link for a saved mobile number. Numbers are stored in E.164 with the country
 * prefix (e.g. "+59170959177"), which is exactly what wa.me expects without the "+" or separators.
 */
export function whatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''

  return `https://wa.me/${digits}${text}`
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Converts to Date respecting what the text represents.
 *
 * A `LocalDate` arrives as "2026-11-15" and JavaScript reads it as midnight UTC; displayed in
 * Bolivian time (UTC-4) it slips back to the 14th. An event day or a birth date is a calendar day,
 * not an instant, so it is built from local components and never goes through a timezone conversion.
 */
function toLocalDate(iso: string): Date {
  if (DATE_ONLY.test(iso)) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(iso)
}

export function formatDate(iso: string, locale = 'es-BO'): string {
  return toLocalDate(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string, locale = 'es-BO'): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** ISO date trimmed for an `<input type="date">`. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

/** Value for an `<input type="datetime-local">`, in the browser's local time. */
export function toDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return ''

  const date = new Date(iso)
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)

  return shifted.toISOString().slice(0, 16)
}

/** Takes what was typed in a datetime-local (local time) and returns it as UTC ISO. */
export function fromDateTimeInput(value: string): string {
  return new Date(value).toISOString()
}

/** Whether the event day (YYYY-MM-DD) has arrived, comparing against today's local date. */
export function eventDayHasArrived(eventDate: string): boolean {
  const day = toLocalDate(eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return day <= today
}
