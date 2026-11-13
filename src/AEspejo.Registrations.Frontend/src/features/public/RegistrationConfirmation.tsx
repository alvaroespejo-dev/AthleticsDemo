'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Clock, Download, FileText, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { publicQr, publicReceipt } from '@/api/endpoints'
import type { RegistrationCreated } from '@/api/types'
import { Button, buttonVariants, Card } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice } from '@/components/ui/states'
import type { Brand } from '@/lib/brand'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  result: RegistrationCreated
  reservationHours: number
  brand: Brand
}

/** What the athlete sees after signing up: the code, what to pay, and where to upload the receipt. */
export function RegistrationConfirmation({ result, reservationHours, brand }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg p-6">
        <img src={brand.registrationLogo} alt={brand.name} className="mx-auto mb-4 h-24 w-24 object-contain" />

        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 size={28} className="text-green-600" />
          <div>
            <h1 className="text-lg font-semibold">{t('forms.registered')}</h1>
            <p className="text-sm text-muted-foreground">{result.eventName}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t('forms.yourCode')}</div>
          <div className="font-mono text-2xl font-semibold tracking-widest">{result.code}</div>
          <p className="mt-1 text-xs text-muted-foreground">{t('forms.codeHelp')}</p>
        </div>

        <dl className="mt-4 space-y-1 text-sm">
          <Detail term={t('forms.registrantName')} value={result.athleteName} />
          <Detail term={t('operation.eventDay')} value={result.modalityName} />
          <Detail term={t('publicPage.kit')} value={result.kitName} />
          {result.sizeLabel && <Detail term={t('publicPage.size')} value={result.sizeLabel} />}
        </dl>

        <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="text-sm text-muted-foreground">{t('forms.transfer')}</div>
          <div className="text-3xl font-semibold tabular-nums">{formatMoney(result.amountCents, i18n.language)}</div>

          {result.hasQr && (
            <div className="mt-4 flex flex-col items-center">
              {/* Large on purpose: a small QR on a phone screen is exactly what stops another device from
                  reading it when it is scanned from there.

                  It is looked up by this registration's code and not by the event: the QR depends on the
                  price tier and the kit that were actually chosen, which were stored on the registration
                  when it was created. */}
              <img
                src={publicQr.url(result.code)}
                alt={t('publicPage.qrAlt')}
                className="h-80 w-80 max-w-full rounded-md border bg-white object-contain p-3"
              />
              <p className="mt-2 text-center text-sm text-muted-foreground">{t('publicPage.scanQr')}</p>

              <a
                href={publicQr.downloadUrl(result.code)}
                download
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
              >
                <Download size={14} />
                {t('publicPage.downloadQr')}
              </a>
            </div>
          )}

          <ReceiptUpload code={result.code} />
        </div>

        {result.reservationExpiresAt && (
          <div className="mt-4">
            <InfoNotice>
              <span className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 shrink-0" />
                {t('publicPage.reservedNotice', { hours: reservationHours })}
              </span>
            </InfoNotice>
          </div>
        )}
      </Card>
    </div>
  )
}

/**
 * Upload of the payment receipt (screenshot or PDF) from the confirmation screen. It is what replaces the
 * "keep the transaction number" notice: the cashier reviews this file from "Record payment" instead of
 * depending only on the athlete reporting the number on their own.
 */
function ReceiptUpload({ code }: { code: string }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ url: string; isImage: boolean; name: string } | null>(null)

  const upload = useMutation({
    mutationFn: (file: File) => publicReceipt.upload(code, file),
  })

  // Releases the previous URL every time the file is replaced and on unmount: these are browser memory
  // URLs, not server addresses, and they are not cleaned up on their own.
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview.url)
  }, [preview])

  const chooseFile = (file: File) => {
    setPreview({ url: URL.createObjectURL(file), isImage: file.type.startsWith('image/'), name: file.name })
    upload.mutate(file)
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-medium">{t('forms.receiptTitle')}</div>

      <Card className="mt-2 p-4">
        {preview ? (
          <div className="flex flex-col items-center text-center">
            {preview.isImage ? (
              <div className="mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-md border">
                <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <>
                <FileText size={40} className="mb-2 text-muted-foreground" />
                <p className="break-all text-sm font-medium">{preview.name}</p>
              </>
            )}

            {upload.isSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle2 size={16} />
                {t('forms.receiptUploaded')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <FileText size={32} className="mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">{t('forms.noReceiptYet')}</p>
          </div>
        )}
      </Card>

      <div className="mt-3 flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{t('forms.uploadReceipt')}</p>

        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) chooseFile(file)
            // Cleared so that choosing the same file again fires the change event.
            e.target.value = ''
          }}
        />

        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => input.current?.click()} isLoading={upload.isPending}>
          <Upload size={14} />
          {preview ? t('forms.replaceReceipt') : t('forms.uploadReceiptAction')}
        </Button>
      </div>

      {upload.isError && (
        <div className="mt-2">
          <ErrorNotice error={upload.error} />
        </div>
      )}
    </div>
  )
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
