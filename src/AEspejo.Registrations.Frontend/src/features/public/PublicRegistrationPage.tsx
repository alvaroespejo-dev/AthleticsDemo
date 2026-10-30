'use client'

import { useEffect, useMemo, useRef, useState, type InvalidEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarDays, Download, FileText, Loader2, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { eventMedia, kitMedia, media, publicSite } from '@/api/endpoints'
import type { CreateRegistration, FoundAthlete, PublicKit, PublicModality, Sex, DocumentType } from '@/api/types'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { CountrySelector } from '@/components/ui/CountrySelector'
import { BirthDateField } from '@/components/ui/BirthDateField'
import { PhoneField } from '@/components/ui/PhoneField'
import { Dialog } from '@/components/ui/dialog'
import { Badge, Button, buttonVariants, Card, Field, Input, Select, Step, Textarea } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'
import { applyBrandColor, brandByCode } from '@/lib/brand'
import { DEFAULT_CALLING_CODE, DEFAULT_COUNTRY, countryDisplayName, OTHER_NATIONALITY } from '@/lib/countries'
import { DOCUMENT_TYPES } from '@/lib/documents'
import { withNullsForEmpty } from '@/lib/forms'
import { formatDate, formatDistance, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RegistrationConfirmation } from './RegistrationConfirmation'

/**
 * Form data as it is edited on screen: the same as `CreateRegistration`, except for the sex, which can
 * stay unchosen (`''`) because it has no reasonable default. Unlike the other fields, forcing a choice
 * between the two keeps a value nobody confirmed from being left in place.
 */
type FormState = Omit<CreateRegistration, 'sex'> & { sex: Sex | '' }

const EMPTY_FORM: FormState = {
  modalityId: 0,
  kitId: 0,
  sizeId: null,
  documentType: 'Ci',
  documentNumber: '',
  nationality: DEFAULT_COUNTRY,
  firstNames: '',
  lastNames: '',
  sex: '',
  birthDate: '',
  phoneCountryCode: DEFAULT_CALLING_CODE,
  phoneNumber: '',
  email: '',
  city: '',
  club: '',
  emergencyContactName: '',
  emergencyContactPhoneCountryCode: DEFAULT_CALLING_CODE,
  emergencyContactPhoneNumber: '',
  bloodType: '',
  allergies: '',
  waiverAccepted: false,
  marketingOptIn: true,
  acquisitionChannel: '',
  referralCode: null,
  athleteId: null,
  useMoneySportBalanceCents: 0,
}

/** Same normalisation as the backend: "4.749.937" and "4749937" are the same document. */
function normalizeDocument(number: string): string {
  return number.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

/** Readable label of a field: the associated `<label>` text, or else its aria-label, name or id. */
function labelOf(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  return field.labels?.[0]?.textContent?.trim() || field.getAttribute('aria-label') || field.name || field.id
}

/**
 * Walks the required fields of the form and collects the labels of the missing ones, so they are all
 * shown at once instead of the browser's native validation pointing them out one by one on each submit.
 */
function missingRequiredFields(form: HTMLFormElement): string[] {
  const seen = new Set<string>()
  const missing: string[] = []

  for (const field of form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]')) {
    if (field.checkValidity()) continue

    // Radios of the same group (the kit) share a `name`: if the whole group is unchosen, each radio would
    // list the kit again.
    const key = field.name || field.id
    if (seen.has(key)) continue

    seen.add(key)
    missing.push(labelOf(field))
  }

  return missing
}

/** Slug of the event, read from the URL. The static build has a single placeholder page, and the hosting rewrites every `/register/*` to it. */
function useSlugFromPath(): string {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return segments[1] ?? ''
}

/** Public sign-up form of an event. No login: the athlete registers from the event's page or a shared link. */
export function PublicRegistrationPage() {
  const { t, i18n } = useTranslation()
  const slug = useSlugFromPath()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<FoundAthlete[] | null>(null)
  const [selectedAthlete, setSelectedAthlete] = useState<FoundAthlete | null>(null)
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [lastSearchedNumber, setLastSearchedNumber] = useState('')
  const [confirmedAthleteId, setConfirmedAthleteId] = useState<number | null>(null)
  const [moneySportMessage, setMoneySportMessage] = useState<string | null>(null)
  const [moneySportText, setMoneySportText] = useState('')
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const documentNoticeRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const event = useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => publicSite.event(slug),
    enabled: !!slug,
  })

  // The brand comes from the event and not from the domain: this link can arrive by WhatsApp or e-mail,
  // from anywhere, and the form has to look the same every time.
  const brand = brandByCode(event.data?.brandCode)

  useEffect(() => applyBrandColor(brand), [brand])

  const sizes = useQuery({ queryKey: ['public-sizes'], queryFn: () => publicSite.sizes() })

  const signUp = useMutation({
    mutationFn: (body: CreateRegistration) => publicSite.signUp(slug, withNullsForEmpty(body)),
  })

  const findAthletes = useMutation({
    mutationFn: (number: string) => publicSite.findAthletes(number, slug),
    onSuccess: (results) => {
      setSearchResults(results)
      setSelectedAthlete(null)
      setAlreadyRegisteredNotice(null)
      if (results.length > 0) setSearchOpen(true)
    },
  })

  /** The record with exactly this type and number: it is the unique key of an athlete, so if it exists it has to be picked from the list instead of creating another. Derived on every render so the notice follows any change of type or number at once. */
  const matchFor = (type: DocumentType, number: string) => {
    const normalized = normalizeDocument(number)
    return searchResults?.find((a) => a.documentType === type && a.documentNumber === normalized) ?? null
  }

  const match = matchFor(form.documentType, form.documentNumber)
  const documentNotSelected = match !== null && match.id !== confirmedAthleteId

  const searchIfNumberChanged = () => {
    const normalized = normalizeDocument(form.documentNumber)
    if (!normalized || normalized === lastSearchedNumber) return

    setLastSearchedNumber(normalized)
    findAthletes.mutate(form.documentNumber)
  }

  const changeDocumentType = (type: DocumentType) => {
    set('documentType', type)

    // The search is by number and already brought every type: no need to go back to the server.
    const next = matchFor(type, form.documentNumber)
    if (next && next.id !== confirmedAthleteId) setSearchOpen(true)
  }

  /** Closes the dialog without touching the typed document (X or "I am another person"). If that type + number exists, the notice stays visible until one is picked or the document changes. */
  const closeSearch = () => {
    setSearchOpen(false)
    setAlreadyRegisteredNotice(null)
    setSelectedAthlete(null)
  }

  /** Loads the chosen record's data, unless it already has a valid registration for this event: there is nothing to load then, so the notice is shown inside the dialog itself (it does not close) and the person can try another record in the list. */
  const confirmSelection = () => {
    if (!selectedAthlete) return

    if (selectedAthlete.alreadyRegisteredInEvent) {
      setAlreadyRegisteredNotice(t('publicPage.alreadyRegistered', { name: `${selectedAthlete.firstNames} ${selectedAthlete.lastNames}` }))
      return
    }

    const athlete = selectedAthlete
    setForm((f) => ({
      ...f,
      documentType: athlete.documentType,
      documentNumber: athlete.documentNumber,
      nationality: athlete.nationality ?? DEFAULT_COUNTRY,
      firstNames: athlete.firstNames,
      lastNames: athlete.lastNames,
      sex: athlete.sex,
      birthDate: athlete.birthDate,
      phoneCountryCode: athlete.phoneCountryCode,
      phoneNumber: athlete.phoneNumber,
      email: athlete.email ?? '',
      city: athlete.city ?? '',
      club: athlete.club ?? '',
      emergencyContactName: athlete.emergencyContactName ?? '',
      emergencyContactPhoneCountryCode: athlete.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE,
      emergencyContactPhoneNumber: athlete.emergencyContactPhoneNumber ?? '',
      bloodType: athlete.bloodType ?? '',
      allergies: athlete.allergies ?? '',
      // A discount typed for a previous athlete must not carry over to this one.
      useMoneySportBalanceCents: 0,
    }))
    setMoneySportText('')
    setConfirmedAthleteId(athlete.id)
    setLastSearchedNumber(athlete.documentNumber)
    setSearchOpen(false)
    setAlreadyRegisteredNotice(null)
  }

  const modality = useMemo(() => event.data?.modalities.find((m) => m.id === form.modalityId), [event.data, form.modalityId])

  const kit = useMemo(() => modality?.kits.find((k) => k.id === form.kitId), [modality, form.kitId])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const validateField = (e: InvalidEvent<HTMLFormElement>) => {
    const field = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

    if (field.validity.valueMissing) {
      field.setCustomValidity(t('forms.requiredField'))
    } else if (field.validity.typeMismatch) {
      field.setCustomValidity(t('forms.invalidEmail'))
    } else {
      field.setCustomValidity('')
    }
  }

  // Changing the distance invalidates the kit and the size chosen: they belong to the previous one.
  const chooseModality = (next: PublicModality) => setForm((f) => ({ ...f, modalityId: next.id, kitId: 0, sizeId: null }))

  const chooseKit = (next: PublicKit) =>
    setForm((f) => ({ ...f, kitId: next.id, sizeId: next.requiredSizeType ? f.sizeId : null }))

  // With a single distance or kit there is nothing to choose: it is taken directly, so the athlete does
  // not lose time on a step with no real decision.
  useEffect(() => {
    if (!event.data || form.modalityId !== 0) return

    if (event.data.modalities.length === 1) chooseModality(event.data.modalities[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.data, form.modalityId])

  useEffect(() => {
    if (!modality || form.kitId !== 0) return

    if (modality.kits.length === 1) chooseKit(modality.kits[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality, form.kitId])

  if (!slug || event.isPending) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading />
      </div>
    )
  }

  if (event.isError) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <Card className="max-w-md p-6">
          <ErrorNotice error={event.error} />
        </Card>
      </div>
    )
  }

  const data = event.data

  if (signUp.isSuccess) {
    return <RegistrationConfirmation result={signUp.data} reservationHours={data.reservationHours} brand={brand} />
  }

  // The step only shows when there is a real decision to make. With a single distance, or a single kit
  // without a size, chooseModality/chooseKit already made it for the athlete.
  const showModalityStep = data.modalities.length > 1
  const showKitStep = !!modality && (modality.kits.length > 1 || !!kit?.requiredSizeType)

  let stepCounter = 0
  const modalityStep = ++stepCounter
  const kitStep = ++stepCounter
  const priceStep = kit ? ++stepCounter : 0
  const dataStep = kit ? ++stepCounter : 0
  const emergencyStep = kit ? ++stepCounter : 0
  const clinicalStep = kit ? ++stepCounter : 0
  const confirmationStep = kit ? ++stepCounter : 0

  const discountCents = form.useMoneySportBalanceCents ?? 0
  const totalCents = kit ? Math.max(0, (kit.totalPriceCents ?? 0) - discountCents) : 0
  const locale = i18n.language

  const sizesOfKit = kit?.requiredSizeType ? (sizes.data ?? []).filter((s) => s.type === kit.requiredSizeType) : []

  const balanceCap = (balance: number) => Math.min(balance, kit?.totalPriceCents ?? 0)

  /** Applies the typed Money Sport amount, capped at the balance and at the price. It is always called with an active kit. */
  const applyMoneySportText = (text: string, balance: number) => {
    if (text === '' || text === '-') {
      set('useMoneySportBalanceCents', 0)
      return
    }

    const parsed = parseFloat(text)
    if (!isNaN(parsed) && parsed >= 0) {
      set('useMoneySportBalanceCents', Math.min(Math.round(parsed * 100), balanceCap(balance)))
    }
  }

  const blurMoneySport = (text: string, balance: number) => {
    if (text === '') {
      setMoneySportText('')
      return
    }

    const parsed = parseFloat(text)
    if (isNaN(parsed) || parsed < 0) return

    const typed = Math.round(parsed * 100)
    const validated = Math.min(typed, balanceCap(balance))

    // When the value was reduced, say so: the athlete should know why the amount is not the one typed.
    if (typed > validated) {
      setMoneySportMessage(t('validation.moneySportReduced', { from: (typed / 100).toFixed(2), to: (validated / 100).toFixed(2) }))
      if (messageTimer.current) clearTimeout(messageTimer.current)
      messageTimer.current = setTimeout(() => setMoneySportMessage(null), 5000)
    }

    setMoneySportText((validated / 100).toFixed(2))
    set('useMoneySportBalanceCents', validated)
  }

  return (
    <div className="min-h-screen bg-muted/40 py-6">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>

        {data.hasImage && (
          <div className="mx-auto aspect-square w-full max-w-[500px] overflow-hidden rounded-lg border">
            <img src={media.eventImageUrl(slug)} alt={data.name} className="h-full w-full object-cover" />
          </div>
        )}

        <header className="text-center">
          <a href={brand.landingUrl}>
            <img src={brand.registrationLogo} alt={brand.name} className="mx-auto mb-3 h-28 w-28 object-contain" />
          </a>
          <h1 className="text-2xl font-semibold">{data.name}</h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              {formatDate(data.eventDate, locale)}
            </span>
            {data.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {data.location}
              </span>
            )}
          </div>

          {data.description && <p className="mt-3 text-sm text-muted-foreground">{data.description}</p>}
        </header>

        {!data.registrationOpen ? (
          <Card className="p-6 text-center">
            <p className="font-medium">{data.closedReason}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('publicPage.openedBetween', {
                from: formatDate(data.registrationOpensAt, locale),
                to: formatDate(data.registrationClosesAt, locale),
              })}
            </p>
          </Card>
        ) : (
          <form
            className="space-y-6"
            noValidate
            onInvalid={validateField}
            onChange={(e) => {
              const field = e.target as unknown as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              field.setCustomValidity('')
            }}
            onSubmit={(e) => {
              e.preventDefault()

              // That type + number already belongs to an athlete: signing up without picking it would create a
              // duplicate or overwrite another person's data (the backend rejects it too).
              if (documentNotSelected) {
                documentNoticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setSearchOpen(true)
                return
              }

              const missing = missingRequiredFields(e.currentTarget)
              if (missing.length > 0) {
                setMissingFields(missing)
                e.currentTarget.querySelector<HTMLElement>('[required]:invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                return
              }

              setMissingFields([])
              // The sex is validated as not empty by the check above: the cast only closes the type difference
              // between the form state (which allows "unchosen") and what the API expects.
              signUp.mutate({ ...form, sex: form.sex as Sex, athleteId: match?.id ?? null })
            }}
          >
            {/* ---- Distance ---- */}
            {data.modalities.length > 0 && (
              <Card className="p-5">
                <Step number={modalityStep} title={t('forms.chooseDistance')} />

                {showModalityStep ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.modalities.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={!m.available}
                        onClick={() => chooseModality(m)}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-colors',
                          m.id === form.modalityId ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
                          !m.available && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <ModalitySummary modality={m} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-primary bg-primary/5 p-3">
                    <ModalitySummary modality={data.modalities[0]} />
                  </div>
                )}
              </Card>
            )}

            {/* ---- Kit ---- */}
            {modality && modality.kits.length > 0 && (
              <Card className="p-5">
                <Step number={kitStep} title={t('forms.chooseKit')} />

                {/* Radios rather than large cards: the list only names the kits, without price, so as not to ask
                    for two decisions at once. What each one includes is seen in its photo, not in a text list. */}
                {modality.kits.length > 1 && (
                  <div role="radiogroup" aria-label={t('forms.chooseKit')} className="grid grid-cols-2 gap-2">
                    {modality.kits.map((k) => (
                      <label key={k.id} className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="radio"
                          name="kit"
                          required
                          className="h-4 w-4 shrink-0 border-input invalid:border-destructive"
                          checked={k.id === form.kitId}
                          onChange={() => chooseKit(k)}
                        />
                        {k.name}
                      </label>
                    ))}
                  </div>
                )}

                {/* The photo only appears once a kit is chosen: it replaces the description and the item list as
                    the way to see what it includes. With a single kit there are no radios, and this is all that shows. */}
                {kit && <KitDetail kit={kit} />}

                {kit?.requiredSizeType && (
                  <div className="mt-4 max-w-xs">
                    <Field id="size" label={`${t('forms.sizeOf')} ${t(`publicPage.garmentTypes.${kit.requiredSizeType}`).toLowerCase()}`} hint={t('forms.sizeRequired')}>
                      <Select id="size" required value={form.sizeId ?? ''} onChange={(e) => set('sizeId', e.target.value ? Number(e.target.value) : null)}>
                        <option value="">{t('forms.selectSize')}</option>
                        {sizesOfKit.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.measure}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                )}
              </Card>
            )}

            {/* ---- Price breakdown ---- */}
            {kit && modality && (
              <Card className="p-5">
                <Step number={priceStep} title={t('forms.priceBreakdown')} />
                <dl className="divide-y rounded-md border text-sm">
                  {/* Each row is an addend: a zero one adds nothing to the total and only lengthens the breakdown, so
                      it is left out. The total is always shown, whatever the sum. */}
                  {(modality.priceCents ?? 0) > 0 && <PriceRow label={modality.name} cents={modality.priceCents ?? 0} locale={locale} />}
                  {kit.surchargeCents > 0 && <PriceRow label={kit.name} cents={kit.surchargeCents} locale={locale} />}
                  {modality.serviceFeeCents > 0 && <PriceRow label={t('forms.serviceFee')} cents={modality.serviceFeeCents} locale={locale} />}
                  {discountCents > 0 && (
                    <div className="flex items-center justify-between gap-4 px-3 py-2">
                      <dt>{t('registration.moneySport.discount')}</dt>
                      <dd className="tabular-nums text-green-600">−{formatMoney(discountCents, locale)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 px-3 py-2 font-semibold">
                    <dt>{t('forms.total')}</dt>
                    <dd className="tabular-nums">{formatMoney(totalCents, locale)}</dd>
                  </div>
                </dl>
              </Card>
            )}

            {/* ---- Money Sport balance ---- */}
            {selectedAthlete && selectedAthlete.moneySportBalanceCents > 0 && kit && (
              <Card className="border-green-200 bg-green-50 p-5">
                <h3 className="mb-4 font-semibold text-green-900">{t('moneySport.balance')}</h3>
                <div className="mb-4 text-3xl font-bold text-green-600">{formatMoney(selectedAthlete.moneySportBalanceCents, locale)}</div>
                <div className="space-y-2">
                  <label htmlFor="discount" className="block text-xs font-medium">
                    {t('registration.moneySport.amount')}
                  </label>
                  <Input
                    id="discount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={moneySportText}
                    onChange={(e) => {
                      setMoneySportText(e.target.value)
                      applyMoneySportText(e.target.value, selectedAthlete.moneySportBalanceCents)
                    }}
                    onBlur={() => blurMoneySport(moneySportText, selectedAthlete.moneySportBalanceCents)}
                    className="w-full"
                  />
                  {moneySportMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      <div>{moneySportMessage}</div>
                    </div>
                  )}
                  <div className="text-xs text-green-700">
                    {t('publicPage.available', { amount: formatMoney(balanceCap(selectedAthlete.moneySportBalanceCents), locale) })}
                  </div>
                </div>
              </Card>
            )}

            {/* ---- Personal data, emergency contact, clinical data and confirmation ---- */}
            {kit && (
              <>
                {(!showModalityStep || !showKitStep) && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {t('forms.enrollment')} <strong>{modality?.name}</strong>, kit <strong>{kit.name}</strong> (
                    {formatMoney(kit.totalPriceCents ?? 0, locale)}).
                  </div>
                )}

                <Card className="p-5">
                  <Step number={dataStep} title={t('portal.personalData')} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field id="document" label={t('forms.identity')}>
                        <div className="flex flex-wrap gap-2">
                          <Select
                            aria-label={t('operation.documentType')}
                            className="w-40 shrink-0"
                            value={form.documentType}
                            onChange={(e) => changeDocumentType(e.target.value as DocumentType)}
                          >
                            {DOCUMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {t(`publicPage.documentTypes.${type}`)}
                              </option>
                            ))}
                          </Select>
                          <div className="relative min-w-32 flex-1">
                            <Input
                              id="document"
                              required
                              aria-invalid={documentNotSelected}
                              aria-describedby={documentNotSelected ? 'existing-document-notice' : undefined}
                              className={cn(documentNotSelected && 'border-red-500 focus-visible:ring-red-500')}
                              value={form.documentNumber}
                              onChange={(e) => set('documentNumber', e.target.value)}
                              onBlur={searchIfNumberChanged}
                            />
                            {findAthletes.isPending && (
                              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </Field>

                      {documentNotSelected && (
                        <div
                          ref={documentNoticeRef}
                          id="existing-document-notice"
                          role="alert"
                          className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          <AlertCircle size={16} className="shrink-0" />
                          <span className="min-w-0 flex-1">{t('forms.documentExistsError')}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-300 bg-white text-red-700 hover:bg-red-100"
                            onClick={() => setSearchOpen(true)}
                          >
                            {t('forms.showFoundRecords')}
                          </Button>
                        </div>
                      )}
                    </div>

                    <PhoneField
                      id="phone"
                      label={t('operation.phone')}
                      callingCode={form.phoneCountryCode}
                      number={form.phoneNumber}
                      onChange={(callingCode, number) =>
                        setForm((f) => ({ ...f, phoneCountryCode: callingCode, phoneNumber: number }))
                      }
                      required
                    />

                    <Field id="first-names" label={t('operation.firstNames')}>
                      <Input id="first-names" required value={form.firstNames} onChange={(e) => set('firstNames', e.target.value)} />
                    </Field>

                    <Field id="last-names" label={t('operation.lastNames')}>
                      <Input id="last-names" required value={form.lastNames} onChange={(e) => set('lastNames', e.target.value)} />
                    </Field>

                    <Field id="nationality" label={t('operation.nationality')}>
                      <CountrySelector
                        id="nationality"
                        name="nationality"
                        value={form.nationality ?? DEFAULT_COUNTRY}
                        onChange={(e) => set('nationality', e.target.value)}
                      />
                    </Field>

                    <Field id="sex" label={t('operation.gender')}>
                      <Select id="sex" required value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
                        <option value="" disabled>
                          {t('forms.selectGender')}
                        </option>
                        <option value="Female">{t('profile.genderFemale')}</option>
                        <option value="Male">{t('profile.genderMale')}</option>
                      </Select>
                    </Field>

                    <BirthDateField id="birth-date" value={form.birthDate} onChange={(v) => set('birthDate', v)} required />

                    <Field id="email" label={t('profile.emailOptional')}>
                      <Input id="email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
                    </Field>

                    <Field id="city" label={t('profile.cityOptional')}>
                      <Input id="city" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
                    </Field>

                    <Field id="club" label={t('profile.clubOptional')}>
                      <Input id="club" value={form.club ?? ''} onChange={(e) => set('club', e.target.value)} />
                    </Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <Step number={emergencyStep} title={t('portal.emergency')} subtitle={t('forms.emergencyHelp')} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="emergency-name" label={t('profile.emergencyNameOptional')}>
                      <Input
                        id="emergency-name"
                        value={form.emergencyContactName ?? ''}
                        onChange={(e) => set('emergencyContactName', e.target.value)}
                      />
                    </Field>

                    <PhoneField
                      id="emergency-phone"
                      label={t('profile.emergencyPhoneOptional')}
                      callingCode={form.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE}
                      number={form.emergencyContactPhoneNumber ?? ''}
                      onChange={(callingCode, number) =>
                        setForm((f) => ({
                          ...f,
                          emergencyContactPhoneCountryCode: callingCode,
                          emergencyContactPhoneNumber: number,
                        }))
                      }
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <Step number={clinicalStep} title={t('portal.clinical')} subtitle={t('forms.medicalHelp')} />
                  <div className="max-w-xs">
                    <Field id="blood-type" label={t('profile.bloodTypeOptional')}>
                      <Input
                        id="blood-type"
                        placeholder={`${t('forms.placeholderExample')} O+`}
                        value={form.bloodType ?? ''}
                        onChange={(e) => set('bloodType', e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field id="allergies" label={t('profile.medicalOptional')}>
                      <Textarea id="allergies" value={form.allergies ?? ''} onChange={(e) => set('allergies', e.target.value)} />
                    </Field>
                  </div>
                </Card>

                {data.hasRunnerManual && (
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="shrink-0 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{t('forms.manual')}</div>
                          {data.runnerManualName && <div className="text-sm text-muted-foreground">{data.runnerManualName}</div>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={eventMedia.runnerManualUrl(slug)}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        >
                          {t('forms.view')}
                        </a>
                        <a
                          href={eventMedia.runnerManualDownloadUrl(slug)}
                          download
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        >
                          <Download size={14} />
                          {t('forms.download')}
                        </a>
                      </div>
                    </div>
                  </Card>
                )}

                {/* ---- Consents ---- */}
                <Card className="p-5">
                  <Step number={confirmationStep} title={t('forms.confirmation')} />

                  {data.waiverText && (
                    <div className="mb-4 max-h-40 overflow-y-auto rounded-md border bg-muted/50 p-3 text-sm">{data.waiverText}</div>
                  )}

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="waiverAccepted"
                      required
                      className="mt-0.5 h-4 w-4 rounded border-input invalid:border-destructive"
                      checked={form.waiverAccepted}
                      onChange={(e) => set('waiverAccepted', e.target.checked)}
                    />
                    <span>{t('forms.acceptWaiver')}</span>
                  </label>

                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.marketingOptIn}
                      className="mt-0.5 h-4 w-4 rounded border-input"
                      onChange={(e) => set('marketingOptIn', e.target.checked)}
                    />
                    <span>
                      {t('forms.marketing')}
                      <span className="block text-xs text-muted-foreground">{t('forms.marketingOptional')}</span>
                    </span>
                  </label>

                  {missingFields.length > 0 && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p>{t('forms.missingFields')}</p>
                        <ul className="mt-1 list-inside list-disc">
                          {missingFields.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('forms.total')}</div>
                      <div className="text-xl font-semibold tabular-nums">{formatMoney(totalCents, locale)}</div>
                    </div>

                    <Button type="submit" isLoading={signUp.isPending}>
                      {t('forms.confirm')}
                    </Button>
                  </div>

                  {signUp.isError && (
                    <div className="mt-4">
                      <ErrorNotice error={signUp.error} />
                    </div>
                  )}
                </Card>
              </>
            )}
          </form>
        )}

        <Dialog open={searchOpen} title={t('forms.documentFound')} onClose={closeSearch}>
          <p className="mb-3 text-sm text-muted-foreground">{t('forms.documentFoundHelp')}</p>

          <div className="space-y-3">
            {searchResults?.map((athlete) => (
              <button
                key={athlete.id}
                type="button"
                className={cn(
                  'w-full rounded-md border p-3 text-left transition-colors',
                  selectedAthlete?.id === athlete.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
                )}
                onClick={() => {
                  setSelectedAthlete(athlete)
                  setAlreadyRegisteredNotice(null)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <strong className="block">
                      {athlete.firstNames} {athlete.lastNames}
                    </strong>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t('publicPage.documentLine', {
                        document: athlete.documentNumber,
                        type: t(`publicPage.documentTypes.${athlete.documentType}`),
                        nationality: athlete.nationality
                          ? athlete.nationality === OTHER_NATIONALITY
                            ? t('profile.otherCountry')
                            : countryDisplayName(athlete.nationality, locale)
                          : t('forms.noNationality'),
                        code: athlete.phoneCountryCode,
                        phone: athlete.phoneNumber,
                      })}
                    </span>
                  </div>
                  {athlete.moneySportBalanceCents > 0 && (
                    <div className="ml-2 rounded-md bg-green-50 px-2 py-1 text-right">
                      <div className="text-xs font-semibold text-green-600">{t('publicPage.balance')}</div>
                      <div className="text-sm font-bold text-green-700">{formatMoney(athlete.moneySportBalanceCents, locale)}</div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {alreadyRegisteredNotice && (
            <div className="mt-3">
              <InfoNotice>{alreadyRegisteredNotice}</InfoNotice>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeSearch}>
              {t('forms.imAnotherPerson')}
            </Button>
            <Button type="button" disabled={!selectedAthlete} onClick={confirmSelection}>
              {t('forms.confirmSelection')}
            </Button>
          </div>
        </Dialog>
      </div>
    </div>
  )
}

function ModalitySummary({ modality }: { modality: PublicModality }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{modality.name}</span>
        <Badge variant="info">{formatDistance(modality.distanceMeters)}</Badge>
      </div>

      <div className="mt-1 text-sm text-muted-foreground">
        {modality.available
          ? modality.seatsLeft !== null && `${modality.seatsLeft} ${t('forms.spots')}`
          : t('forms.unavailable')}
      </div>

      {modality.minAge && (
        <div className="mt-1 text-xs text-muted-foreground">
          {t('forms.minimumAge')}: {modality.minAge}
        </div>
      )}
    </>
  )
}

function PriceRow({ label, cents, locale }: { label: string; cents: number; locale: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(cents, locale)}</dd>
    </div>
  )
}

/** What the chosen kit includes: its photo, not the description or a list of items in text. No price: the breakdown is a separate step, and repeating it here made the choice read like a list of rates. */
function KitDetail({ kit }: { kit: PublicKit }) {
  return (
    <div className="mt-4 space-y-2">
      {kit.hasImage ? (
        <div className="aspect-square w-full overflow-hidden rounded-lg border">
          <img src={kitMedia.url(kit.id)} alt={kit.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="font-semibold">{kit.name}</div>
      )}

      {kit.description && <p className="text-sm text-muted-foreground">{kit.description}</p>}
    </div>
  )
}
