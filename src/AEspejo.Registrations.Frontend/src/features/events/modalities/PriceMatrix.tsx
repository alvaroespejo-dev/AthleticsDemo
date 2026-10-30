'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, QrCode, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { priceTierQr } from '@/api/endpoints'
import type { Modality } from '@/api/types'
import { Badge, Button, Label } from '@/components/ui/primitives'
import { formatDate, formatMoney } from '@/lib/format'

interface Props {
  modality: Modality
  /** Service fee stored on the event, never the live global value: changing the global setting must not reprice an existing event. */
  eventServiceFeeCents: number
  canManage: boolean
  onChanged: () => void
  locale: string
}

/**
 * What each person actually pays, per price tier and kit: the tier price plus the kit surcharge plus the event service fee.
 * Each cell is also where that combination's payment QR is managed: the bank QR carries the amount, so there is no single QR for every price.
 */
export function PriceMatrix({ modality, eventServiceFeeCents, canManage, onChanged, locale }: Props) {
  const { t } = useTranslation()

  const activeKits = modality.kits.filter((kit) => kit.active)
  if (modality.priceTiers.length === 0 || activeKits.length === 0) return null

  const tiers = [...modality.priceTiers].sort(
    (a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime(),
  )
  const now = Date.now()
  const hasQr = (tierId: number, kitId: number) =>
    modality.paymentQrCodes.some((qr) => qr.priceTierId === tierId && qr.kitId === kitId)

  return (
    <div className="mt-6 border-t pt-4">
      <Label className="text-muted-foreground">{t('catalog.athleteFinalPrice')}</Label>
      {canManage && <p className="mt-1 text-xs text-muted-foreground">{t('eventUi.qrPerCellHelp')}</p>}

      <div className="mt-2 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('modalities.priceName')}
              </th>
              {activeKits.map((kit) => (
                <th
                  key={kit.id}
                  className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {kit.name}
                  {kit.surchargeCents > 0 && (
                    <span className="block font-normal normal-case tracking-normal">
                      {t('modalities.baseSurcharge', { amount: formatMoney(kit.surchargeCents, locale) })}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => {
              const from = new Date(tier.validFrom).getTime()
              const to = new Date(tier.validTo).getTime()
              const current = from <= now && to > now

              return (
                <tr key={tier.id} className={`border-t ${current ? 'bg-primary/5' : ''}`}>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={current ? 'font-semibold' : ''}>{tier.name}</span>
                    {current ? (
                      <Badge variant="success" className="ml-2">
                        {t('modalities.currentToday')}
                      </Badge>
                    ) : (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {to <= now ? t('modalities.expired') : t('modalities.since', { date: formatDate(tier.validFrom, locale) })}
                      </span>
                    )}
                  </td>

                  {activeKits.map((kit) => {
                    const finalCents = tier.priceCents + kit.surchargeCents + eventServiceFeeCents
                    const finalText = formatMoney(finalCents, locale)

                    return (
                      <td key={kit.id} className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`tabular-nums ${current ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {finalText}
                          </span>

                          {canManage ? (
                            <QrCell
                              tierId={tier.id}
                              kitId={kit.id}
                              hasQr={hasQr(tier.id, kit.id)}
                              amountText={finalText}
                              onChanged={onChanged}
                            />
                          ) : (
                            hasQr(tier.id, kit.id) && (
                              <QrPreview
                                href={priceTierQr.url(tier.id, kit.id)}
                                label={t('eventUi.viewQr')}
                                title={t('eventUi.qrAmountTooltip', { monto: finalText })}
                                amountText={finalText}
                              />
                            )
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * QR icon with a hover preview. The preview uses `position: fixed` measured by hand, not `absolute`:
 * the table sits in an `overflow-x-auto` container, which clips anything positioned against its ancestors.
 * Clicking still opens the full image in a new tab.
 */
function QrPreview({
  href,
  label,
  title,
  amountText,
}: {
  href: string
  label: string
  title: string
  amountText: string
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={title}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ top: rect.bottom + 6, left: rect.right - 144 })
        }}
        onMouseLeave={() => setPosition(null)}
      >
        <QrCode size={14} className="text-primary" />
      </a>

      {position && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-white p-2 shadow-lg"
          style={{ top: position.top, left: Math.max(8, position.left) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation */}
          <img src={href} alt={title} className="h-36 w-36 object-contain" />
          <p className="mt-1 text-center text-xs font-semibold text-foreground">{amountText}</p>
        </div>
      )}
    </>
  )
}

/** QR control of one cell: upload, preview or remove the QR of that tier and kit combination. */
function QrCell({
  tierId,
  kitId,
  hasQr,
  amountText,
  onChanged,
}: {
  tierId: number
  kitId: number
  hasQr: boolean
  amountText: string
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const title = t('eventUi.qrAmountTooltip', { monto: amountText })
  // Bumped after each upload so the browser asks for the new QR: the address never changes and would be served from cache.
  const [version, setVersion] = useState(0)

  const upload = useMutation({
    mutationFn: (file: File) => priceTierQr.upload(tierId, kitId, file),
    onSuccess: () => {
      setVersion((v) => v + 1)
      onChanged()
    },
  })

  const remove = useMutation({
    mutationFn: () => priceTierQr.delete(tierId, kitId),
    onSuccess: onChanged,
  })

  const failed = upload.isError || remove.isError

  return (
    <div className="flex items-center gap-1">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) upload.mutate(file)
          // Cleared so choosing the same file again still fires the change event.
          event.target.value = ''
        }}
      />

      {failed && (
        <span title={String(upload.error ?? remove.error)}>
          <AlertTriangle size={13} className="text-destructive" />
        </span>
      )}

      {hasQr ? (
        <>
          <QrPreview
            href={`${priceTierQr.url(tierId, kitId)}?v=${version}`}
            label={t('eventUi.viewQr')}
            title={title}
            amountText={amountText}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => remove.mutate()}
            isLoading={remove.isPending}
            aria-label={t('eventUi.deleteQr')}
          >
            <Trash2 size={12} />
          </Button>
        </>
      ) : (
        // A text button, not an icon: the bank QR carries the amount, so whoever uploads it must see that amount on the button itself.
        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={() => input.current?.click()}
          isLoading={upload.isPending}
          title={title}
        >
          <Upload size={11} />
          {t('eventUi.uploadQr')} · {amountText}
        </Button>
      )}
    </div>
  )
}
