'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { kitMedia } from '@/api/endpoints'
import { ErrorNotice } from '@/components/ui/states'
import { Button } from '@/components/ui/primitives'

interface Props {
  /** Id of the saved kit, or null while the kit is still being created. */
  kitId: number | null
  hasImage: boolean
  /** Photo chosen before the kit exists; it is uploaded right after the kit is created. */
  pendingFile: File | null
  onPendingChange: (file: File | null) => void
  onChanged: () => void
}

const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp'

/**
 * Kit photo. It is not part of the kit's JSON: it is a file, uploaded against the saved kit, as the event cover is.
 * A new kit keeps the chosen file until it is saved.
 */
export function KitImageField({ kitId, hasImage, pendingFile, onPendingChange, onChanged }: Props) {
  if (kitId === null) {
    return <PendingImage file={pendingFile} onChange={onPendingChange} />
  }
  return <SavedImage key={kitId} kitId={kitId} initialHasImage={hasImage} onChanged={onChanged} />
}

function PendingImage({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(event) => {
          const chosen = event.target.files?.[0]
          if (chosen) onChange(chosen)
          event.target.value = ''
        }}
      />

      <div className="flex items-start gap-3">
        <div className="grid aspect-square w-32 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of a file, not a static asset
            <img src={preview} alt={t('eventUi.kitImage')} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={28} className="text-muted-foreground opacity-40" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <Upload size={14} />
            {file ? t('eventUi.replace') : t('eventUi.uploadImage')}
          </Button>
          {file && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(null)}>
              <Trash2 size={14} />
              {t('eventUi.deleteImage')}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t('eventUi.imageHelp')}</p>
    </div>
  )
}

function SavedImage({
  kitId,
  initialHasImage,
  onChanged,
}: {
  kitId: number
  initialHasImage: boolean
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  // The dialog does not reload when the photo changes, so it keeps its own record of whether there is one.
  const [hasImage, setHasImage] = useState(initialHasImage)
  // Bumped after each upload so the browser asks for the new image: the address never changes and would be served from cache.
  const [version, setVersion] = useState(0)

  const upload = useMutation({
    mutationFn: (file: File) => kitMedia.upload(kitId, file),
    onSuccess: () => {
      setHasImage(true)
      setVersion((v) => v + 1)
      onChanged()
    },
  })

  const remove = useMutation({
    mutationFn: () => kitMedia.delete(kitId),
    onSuccess: () => {
      setHasImage(false)
      onChanged()
    },
  })

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) upload.mutate(file)
          // Cleared so choosing the same file again still fires the change event.
          event.target.value = ''
        }}
      />

      {upload.isError && <ErrorNotice error={upload.error} />}
      {remove.isError && <ErrorNotice error={remove.error} />}

      {hasImage ? (
        <div className="flex items-start gap-3">
          <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation */}
            <img src={`${kitMedia.url(kitId)}?v=${version}`} alt={t('eventUi.kitImage')} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} isLoading={upload.isPending}>
              <Upload size={14} />
              {t('eventUi.replace')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove.mutate()}
              isLoading={remove.isPending}
            >
              <Trash2 size={14} />
              {t('eventUi.deleteImage')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="grid aspect-square w-32 shrink-0 place-items-center rounded-md border border-dashed">
            <ImageIcon size={28} className="text-muted-foreground opacity-40" />
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} isLoading={upload.isPending}>
            <Upload size={14} />
            {t('eventUi.uploadImage')}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('eventUi.imageHelp')}</p>
    </div>
  )
}
