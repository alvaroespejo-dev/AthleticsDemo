'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarDays, Footprints, Search, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { moneySport } from '@/api/endpoints'
import type { AthleteParticipation, MoneySportCandidate, MoneySportDetail } from '@/api/types'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Badge, Button, Card, Field, Input } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'
import { withBasePath } from '@/lib/base-path'
import { countryDisplayName, OTHER_NATIONALITY } from '@/lib/countries'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type ParticipationStatus = 'finished' | 'dropped' | 'noShow' | 'next' | 'pending'

/**
 * Public Money Sport lookup by document number. There is no login: the document number can be guessed, so
 * the screen is read-only and shows no contact or medical data, and the endpoint is behind the rate limiter.
 *
 * Two steps: the search lists who has that number (it can repeat across document types or nationalities),
 * and the balance is only requested for the athlete chosen.
 */
export function MoneySportPage() {
  const { t, i18n } = useTranslation()
  const [documentNumber, setDocumentNumber] = useState('')
  // The number the search was made with, not the one in the input: if the person edits it after searching,
  // the detail still has to be requested with the one that matches the candidates on screen.
  const [searchedNumber, setSearchedNumber] = useState('')
  const [athleteId, setAthleteId] = useState<number | null>(null)

  const search = useMutation({
    mutationFn: (number: string) => moneySport.search(number),
    onMutate: (number) => {
      setSearchedNumber(number)
      setAthleteId(null)
    },
    onSuccess: (candidates) => {
      if (candidates.length === 1) setAthleteId(candidates[0].id)
    },
  })

  const detail = useQuery({
    queryKey: ['money-sport', athleteId, searchedNumber],
    queryFn: () => moneySport.detail(athleteId!, searchedNumber),
    enabled: athleteId !== null,
  })

  const candidates = search.data ?? []
  const locale = i18n.language

  return (
    <div className="min-h-screen bg-muted/40 py-6">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <img src={withBasePath('/athleticsdemo-logo.jpg')} alt={t('moneySport.title')} className="h-20 object-contain" />
          <LanguageSelector />
        </Card>

        <Card className="p-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const number = documentNumber.trim()
              if (number) search.mutate(number)
            }}
          >
            <Field id="moneysport-document" label={t('moneySport.ciLabel')} hint={t('moneySport.ciHelp')}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="moneysport-document"
                  required
                  autoFocus
                  inputMode="text"
                  className="flex-1"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
                <Button type="submit" isLoading={search.isPending} disabled={!documentNumber.trim()}>
                  <Search size={15} />
                  {t('moneySport.search')}
                </Button>
              </div>
            </Field>
          </form>
        </Card>

        {search.isPending && <Loading />}
        {search.isError && <ErrorNotice error={search.error} />}

        {search.isSuccess && candidates.length === 0 && <InfoNotice>{t('moneySport.notFound')}</InfoNotice>}

        {candidates.length > 1 && (
          <CandidateChooser candidates={candidates} selected={athleteId} onChoose={setAthleteId} />
        )}

        {detail.isFetching && <Loading />}
        {detail.isError && <ErrorNotice error={detail.error} />}
        {detail.data && !detail.isFetching && <AthleteBalance athlete={detail.data} locale={locale} />}
      </div>
    </div>
  )
}

function CandidateChooser({
  candidates,
  selected,
  onChoose,
}: {
  candidates: MoneySportCandidate[]
  selected: number | null
  onChoose: (id: number) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{t('moneySport.chooseAthlete', { count: candidates.length })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('moneySport.chooseAthleteHelp')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left">{t('moneySport.name')}</th>
              <th scope="col" className="px-5 py-3 text-left">{t('moneySport.documentType')}</th>
              <th scope="col" className="px-5 py-3 text-left">{t('moneySport.nationality')}</th>
              <th scope="col" className="px-5 py-3">
                <span className="sr-only">{t('moneySport.select')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {candidates.map((c) => {
              const chosen = c.id === selected
              return (
                <tr
                  key={c.id}
                  aria-selected={chosen}
                  onClick={() => onChoose(c.id)}
                  className={cn('cursor-pointer', chosen ? 'bg-primary/5' : 'hover:bg-muted/30')}
                >
                  <td className="px-5 py-3 font-medium">
                    {c.firstNames} {c.lastNames}
                  </td>
                  <td className="px-5 py-3">
                    {t(`publicPage.documentTypes.${c.documentType}`)} {c.documentNumber}
                  </td>
                  <td className="px-5 py-3">
                    {c.nationality
                      ? c.nationality === OTHER_NATIONALITY
                        ? t('profile.otherCountry')
                        : countryDisplayName(c.nationality, i18n.language)
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={chosen ? 'default' : 'outline'}
                      aria-pressed={chosen}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChoose(c.id)
                      }}
                    >
                      {chosen ? t('moneySport.selected') : t('moneySport.select')}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function participationStatus(p: AthleteParticipation): ParticipationStatus {
  if (p.result === 'Finished') return 'finished'
  if (p.result === 'Dropped') return 'dropped'
  if (p.result === 'NoShow') return 'noShow'
  if (new Date(p.eventDate) > new Date()) return 'next'
  return 'pending'
}

function statusVariant(status: ParticipationStatus): 'success' | 'destructive' | 'warning' | 'default' {
  switch (status) {
    case 'finished':
      return 'success'
    case 'dropped':
      return 'destructive'
    case 'noShow':
      return 'warning'
    default:
      return 'default'
  }
}

function AthleteBalance({ athlete, locale }: { athlete: MoneySportDetail; locale: string }) {
  const { t } = useTranslation()
  const finished = athlete.participations.filter((p) => p.result === 'Finished')
  const kilometers = finished.reduce((sum, p) => sum + p.distanceMeters / 1000, 0)

  const statusLabel: Record<ParticipationStatus, string> = {
    finished: `✓ ${t('moneySport.finished')}`,
    dropped: `⊘ ${t('moneySport.abandoned')}`,
    noShow: `✗ ${t('moneySport.noShow')}`,
    next: `📅 ${t('moneySport.next')}`,
    pending: `⏳ ${t('moneySport.pending')}`,
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">{t('moneySport.yourBalance')}</p>
          <div className="mt-1 text-4xl font-bold text-green-600">{formatMoney(athlete.balanceCents, locale)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('moneySport.credited')}</p>
            <p className="font-semibold text-green-600">{formatMoney(athlete.creditedCents, locale)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('moneySport.used')}</p>
            <p className="font-semibold text-orange-600">{formatMoney(Math.abs(athlete.usedCents), locale)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={UserRound}
          value={`${athlete.firstNames} ${athlete.lastNames}`}
          label={t('moneySport.document', {
            tipo: t(`publicPage.documentTypes.${athlete.documentType}`),
            numero: athlete.documentNumber,
          })}
        />
        <Metric icon={CalendarDays} value={String(finished.length)} label={t('moneySport.events')} />
        <Metric icon={Footprints} value={`${kilometers.toFixed(1)} km`} label={t('moneySport.kilometers')} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">{t('moneySport.history')}</h2>
        </div>
        {athlete.movements.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">{t('moneySport.noTransactions')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-5 py-3 text-left">{t('moneySport.date')}</th>
                  <th className="px-5 py-3 text-left">{t('moneySport.event')}</th>
                  <th className="px-5 py-3 text-left">{t('moneySport.movement')}</th>
                  <th className="px-5 py-3 text-right">{t('moneySport.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {athlete.movements.map((m, i) => {
                  const credit = m.type === 'Credit'

                  return (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-5 py-3">{formatDate(m.date, locale)}</td>
                      <td className="px-5 py-3">{m.eventName}</td>
                      <td className="px-5 py-3">
                        <span className={credit ? 'font-medium text-green-600' : 'font-medium text-orange-600'}>
                          {credit ? `✓ ${t('moneySport.credited')}` : `✗ ${t('moneySport.used')}`}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className={credit ? 'text-green-600' : 'text-orange-600'}>
                          {credit ? '+' : '−'} {formatMoney(Math.abs(m.amountCents), locale)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">{t('moneySport.myRaces')}</h2>
        </div>
        {athlete.participations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">{t('moneySport.noRaces')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-5 py-3 text-left">{t('moneySport.event')}</th>
                  <th className="px-5 py-3 text-left">{t('moneySport.date')}</th>
                  <th className="px-5 py-3 text-left">{t('moneySport.modality')}</th>
                  <th className="px-5 py-3 text-right">{t('moneySport.distance')}</th>
                  <th className="px-5 py-3 text-left">{t('registrants.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {athlete.participations.map((p) => {
                  const status = participationStatus(p)

                  return (
                    <tr key={p.registrationId} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">{p.eventName}</td>
                      <td className="px-5 py-3">{formatDate(p.eventDate, locale)}</td>
                      <td className="px-5 py-3">{p.modality}</td>
                      <td className="px-5 py-3 text-right">{(p.distanceMeters / 1000).toFixed(1)} km</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant(status)}>{statusLabel[status]}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}
