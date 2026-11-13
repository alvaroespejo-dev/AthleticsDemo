'use client'

import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, HeartPulse, MessageCircle, Receipt, ShieldCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { registrations } from '@/api/endpoints'
import type { RegistrationDetail, RegistrationStatus } from '@/api/types'
import { Dialog } from '@/components/ui/dialog'
import { Badge, Button } from '@/components/ui/primitives'
import { ErrorNotice, Loading } from '@/components/ui/states'
import { useAuth } from '@/auth/AuthContext'
import { eventDayHasArrived, formatDate, formatDateTime, formatMoney, whatsAppLink } from '@/lib/format'
import { ReceiptPreview } from './RecordPaymentDialog'
import { ResultDialog } from './RegistrationActionDialogs'

interface Props {
  registrationId: number
  onClose: () => void
  onDone: (message: string) => void
}

export function RegistrationDetailDialog({ registrationId, onClose, onDone }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { hasRole } = useAuth()
  const [resultOpen, setResultOpen] = useState(false)

  const query = useQuery({
    queryKey: ['registration', registrationId],
    queryFn: () => registrations.get(registrationId),
  })

  const canRecordResult = hasRole('Admin', 'Cashier', 'KitStaff')
  const data = query.data
  const dayArrived = data ? eventDayHasArrived(data.eventDate) : false
  const isPaid = data?.status === 'Paid'
  const resultEnabled = canRecordResult && dayArrived && isPaid

  return (
    <Dialog open title={t('detail.title')} onClose={onClose} className="max-w-2xl">
      {query.isPending && <Loading />}
      {query.isError && <ErrorNotice error={query.error} />}

      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <div>
              <div className="font-mono text-lg font-semibold tracking-wider">{data.code}</div>
              <div className="text-sm text-muted-foreground">
                {data.eventName} · {formatDate(data.eventDate, locale)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {data.bibNumber !== null && <Badge variant="info">{t('detail.dorsal')} {data.bibNumber}</Badge>}
              {data.result && <Badge variant={resultVariant(data.result)}>{t(`registrations.result.${data.result}`)}</Badge>}
              <Badge variant={statusVariant(data.status)}>{t(`registrations.statusLabel.${data.status}`)}</Badge>
              <span
                title={
                  !canRecordResult
                    ? t('result.roleNotAllowed')
                    : !isPaid
                      ? t('result.onlyPaidInscriptions')
                      : !dayArrived
                        ? t('result.buttonTooltip', { fecha: formatDate(data.eventDate, locale) })
                        : undefined
                }
              >
                <Button size="sm" variant="outline" disabled={!resultEnabled} onClick={() => setResultOpen(true)}>
                  <Zap size={13} />
                  {t('resultado.title')}
                </Button>
              </span>
            </div>
          </div>

          <Section title={t('detail.athlete')}>
            <Row label={t('detail.name')} value={`${data.athlete.firstNames} ${data.athlete.lastNames}`} />
            <Row
              label={t(`registrations.documentType.${data.athlete.documentType}`)}
              value={
                data.athlete.documentNumberOriginal && data.athlete.documentNumberOriginal !== data.athlete.documentNumber
                  ? t('registrations.originalDocument', {
                      number: data.athlete.documentNumber,
                      original: data.athlete.documentNumberOriginal,
                    })
                  : data.athlete.documentNumber
              }
            />
            {data.athlete.nationality && <Row label={t('detail.nationality')} value={data.athlete.nationality} />}
            <Row
              label={t('detail.genderAge')}
              value={`${t(data.athlete.sex === 'Female' ? 'profile.genderFemale' : 'profile.genderMale')} · ${data.athlete.age}`}
            />
            <Row label={t('detail.birthDate')} value={formatDate(data.athlete.birthDate, locale)} />
            <Row
              label={t('detail.phone')}
              value={
                <a
                  href={whatsAppLink(data.athlete.phone, whatsAppMessage(data, locale, t))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MessageCircle size={13} />
                  {data.athlete.phone}
                </a>
              }
            />
            {data.athlete.email && <Row label={t('detail.email')} value={data.athlete.email} />}
            {data.athlete.city && <Row label={t('detail.city')} value={data.athlete.city} />}
            <Row label={t('detail.racedEvents')} value={String(data.athlete.eventsParticipated)} />
          </Section>

          <Section title={t('detail.registration')}>
            <Row label={t('detail.modality')} value={data.modality} />
            <Row label={t('detail.kit')} value={data.kit} />
            <Row label={t('detail.size')} value={data.size ?? t('detail.noSize')} />
            <Row label={t('detail.category')} value={data.ageCategory ?? t('detail.noCategory')} />
            <Row label={t('detail.registeredOn')} value={formatDateTime(data.createdAt, locale)} />
            {data.reservationExpiresAt && data.status === 'Pending' && (
              <Row label={t('detail.reservationExpires')} value={formatDateTime(data.reservationExpiresAt, locale)} />
            )}
            {data.acquisitionChannel && <Row label={t('detail.source')} value={data.acquisitionChannel} />}
          </Section>

          <Section title={t('detail.payment')} icon={Receipt}>
            {data.hasReceipt && <ReceiptPreview registrationId={data.id} />}
            <Row label={t('detail.amount')} value={<span className="tabular-nums">{formatMoney(data.amountCents + data.moneySportDiscountCents, locale)}</span>} />
            {data.moneySportDiscountCents > 0 && (
              <Row
                label={t('moneySport.balance')}
                value={<span className="tabular-nums text-green-600">-{formatMoney(data.moneySportDiscountCents, locale)}</span>}
              />
            )}
            <Row label={t('detail.amountDue')} value={<span className="font-semibold tabular-nums">{formatMoney(data.amountCents, locale)}</span>} />
            <Row label={t('detail.credited')} value={<span className="tabular-nums">{formatMoney(data.totalPaidCents, locale)}</span>} />

            {data.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('detail.noPayments')}</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-1.5 text-left">{t('detail.transaction')}</th>
                      <th className="px-2 py-1.5 text-right">{t('detail.amount')}</th>
                      <th className="px-2 py-1.5 text-left">{t('detail.date')}</th>
                      <th className="px-2 py-1.5 text-left">{t('detail.rule')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-2 py-1.5 font-mono">{payment.transactionNumber}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatMoney(payment.amountCents, locale)}</td>
                        <td className="px-2 py-1.5">{formatDate(payment.creditedAt, locale)}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{t(`registrations.rule.${payment.rule}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={t('detail.emergency')} icon={HeartPulse}>
            {data.athlete.emergencyContactName ? (
              <>
                <Row label={t('detail.name')} value={data.athlete.emergencyContactName} />
                <Row label={t('detail.phone')} value={data.athlete.emergencyContactPhone ?? '—'} />
                {data.athlete.bloodType && <Row label={t('detail.bloodType')} value={data.athlete.bloodType} />}
                {data.athlete.allergies && <Row label={t('detail.allergies')} value={data.athlete.allergies} />}
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle size={14} />
                {t('detail.noEmergency')}
              </p>
            )}
          </Section>

          <Section title={t('detail.consents')} icon={ShieldCheck}>
            <Row
              label={t('detail.waiver')}
              value={
                data.waiverAccepted && data.waiverAcceptedAt
                  ? t('registrations.waiverAccepted', { date: formatDateTime(data.waiverAcceptedAt, locale) }) +
                    (data.waiverIp ? t('registrations.waiverIp', { ip: data.waiverIp }) : '')
                  : t('detail.notAccepted')
              }
            />
            <Row
              label={t('detail.whatsapp')}
              value={
                data.athlete.unsubscribedAt
                  ? t('registrations.unsubscribed', { date: formatDate(data.athlete.unsubscribedAt, locale) })
                  : data.athlete.marketingOptIn
                    ? t('registrations.optIn') +
                      (data.athlete.marketingOptInAt
                        ? t('registrations.optInDate', { date: formatDate(data.athlete.marketingOptInAt, locale) })
                        : '')
                    : t('registrations.noOptIn')
              }
            />
          </Section>

          {data.kitDelivery && (
            <Section title={t('detail.kitDelivery')} icon={MessageCircle}>
              <Row label={t('detail.delivered')} value={formatDateTime(data.kitDelivery.deliveredAt, locale)} />
              <Row label={t('detail.handledBy')} value={data.kitDelivery.user} />
              {data.kitDelivery.pickedUpBy && <Row label={t('detail.pickedUpBy')} value={data.kitDelivery.pickedUpBy} />}
            </Section>
          )}

          {data.notes && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{data.notes}</div>
          )}
        </div>
      )}

      {resultOpen && data && (
        <ResultDialog
          registrationId={data.id}
          athleteName={`${data.athlete.firstNames} ${data.athlete.lastNames}`}
          modality={data.modality}
          currentResult={data.result}
          onClose={() => setResultOpen(false)}
          onDone={onDone}
        />
      )}
    </Dialog>
  )
}

function resultVariant(result: 'Finished' | 'Dropped' | 'NoShow'): 'success' | 'destructive' | 'warning' {
  switch (result) {
    case 'Dropped':
      return 'destructive'
    case 'NoShow':
      return 'warning'
    default:
      return 'success'
  }
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

/** Message prefilled in the WhatsApp link: what the athlete needs to pay or to check their status. */
function whatsAppMessage(data: RegistrationDetail, locale: string, t: TFunction): string {
  const greeting = t('registrations.greeting', { name: data.athlete.firstNames })
  const reference = t('registrations.reference', { event: data.eventName, modality: data.modality, code: data.code })

  if (data.status === 'Paid') return t('registrations.confirmedMessage', { greeting, reference })

  const balance = data.amountCents - data.totalPaidCents
  return t('registrations.pendingMessage', {
    greeting,
    reference,
    status: t(`registrations.statusLabel.${data.status}`).toLowerCase(),
    balance: formatMoney(balance, locale),
  })
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ size?: number; className?: string }>; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon size={13} />}
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
