'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { eventMedia, media } from '@/api/endpoints'
import type { EventDetail } from '@/api/types'
import { ErrorNotice } from '@/components/ui/states'
import { Button, Card } from '@/components/ui/primitives'
import { InfoNotice } from '@/components/ui/states'

interface Props {
  event: EventDetail
  canManage: boolean
  onChanged: () => void
}

const ACCEPTED_DOCUMENTS =
  '.pdf,.doc,.docx,application/pdf,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Event cover image: shown in the events list and in the header of the public registration form. */
export function EventImageSection({ event, canManage, onChanged }: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  // Bumped after each upload so the browser asks for the new image: the address never changes and would be served from cache.
  const [version, setVersion] = useState(0)

  const upload = useMutation({
    mutationFn: (file: File) => eventMedia.uploadImage(event.id, file),
    onSuccess: () => {
      setVersion((v) => v + 1)
      onChanged()
    },
  })

  const remove = useMutation({
    mutationFn: () => eventMedia.deleteImage(event.id),
    onSuccess: onChanged,
  })

  const hasImage = !!event.imagePath

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('catalog.eventImage')}</h2>
          <p className="text-sm text-muted-foreground">{t('catalog.eventImageHelp')}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
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

            <Button variant="outline" onClick={() => input.current?.click()} isLoading={upload.isPending}>
              <Upload size={16} />
              {hasImage ? t('eventUi.replace') : t('eventUi.uploadImage')}
            </Button>

            {hasImage && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => remove.mutate()}
                aria-label={t('eventSections.image.delete')}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )}
      </div>

      {upload.isError && <ErrorNotice error={upload.error} />}
      {remove.isError && <ErrorNotice error={remove.error} />}

      <Card className="p-5">
        {hasImage ? (
          <div className="aspect-square w-full max-w-[500px] overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation */}
            <img
              src={`${media.eventImageUrl(event.slug)}?v=${version}`}
              alt={t('eventSections.image.alt', { name: event.name })}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon size={48} className="mb-3 text-muted-foreground opacity-40" />
            <p className="font-medium">{t('catalog.noImage')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('eventUi.noImageHelp')}</p>
          </div>
        )}
      </Card>

      <InfoNotice>{t('eventUi.imageHelp')}</InfoNotice>
    </section>
  )
}

/** Runner guide: a PDF or Word file with the race instructions, offered for download on the public form. */
export function RunnerManualSection({ event, canManage, onChanged }: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)

  const upload = useMutation({
    mutationFn: (file: File) => eventMedia.uploadRunnerManual(event.id, file),
    onSuccess: onChanged,
  })

  const remove = useMutation({
    mutationFn: () => eventMedia.deleteRunnerManual(event.id),
    onSuccess: onChanged,
  })

  const hasManual = !!event.runnerManualPath

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('catalog.runnerGuide')}</h2>
          <p className="text-sm text-muted-foreground">{t('catalog.runnerGuideHelp')}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <input
              ref={input}
              type="file"
              accept={ACCEPTED_DOCUMENTS}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) upload.mutate(file)
                event.target.value = ''
              }}
            />

            <Button variant="outline" onClick={() => input.current?.click()} isLoading={upload.isPending}>
              <Upload size={16} />
              {hasManual ? t('eventUi.replace') : t('eventUi.uploadManual')}
            </Button>

            {hasManual && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => remove.mutate()}
                aria-label={t('eventSections.manual.delete')}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )}
      </div>

      {upload.isError && <ErrorNotice error={upload.error} />}
      {remove.isError && <ErrorNotice error={remove.error} />}

      <Card className="p-5">
        {hasManual ? (
          <a href={eventMedia.runnerManualUrl(event.slug)} className="flex items-center gap-3 text-sm hover:underline">
            <FileText size={24} className="shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{event.runnerManualName}</span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText size={48} className="mb-3 text-muted-foreground opacity-40" />
            <p className="font-medium">{t('catalog.noGuide')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('eventUi.guideHelp')}</p>
          </div>
        )}
      </Card>

      <InfoNotice>{t('catalog.documentHelp')}</InfoNotice>
    </section>
  )
}
