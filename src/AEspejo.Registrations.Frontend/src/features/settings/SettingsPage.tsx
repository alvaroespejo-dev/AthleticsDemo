'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Plus, Ruler, RotateCcw, Save, Tags, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ageCategoryTemplates, genericQr, kitItems, settings, sizes } from '@/api/endpoints'
import type { GarmentType, KitItem, SaveKitItem, SaveSettings, SaveSize, SaveAgeCategoryTemplate, Size, AgeCategoryTemplate } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { EmptyState, ErrorNotice, Loading, InfoNotice, SuccessNotice } from '@/components/ui/states'
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { centsToText, textToCents } from '@/lib/format'

const MAX_AGE = 120

export function SettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<SaveSettings | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['settings'], queryFn: () => settings.get() })

  // The draft is built once, when the data arrives: mirroring it on every render would overwrite what the user is typing.
  useEffect(() => {
    if (!query.data || draft) return
    setOrganizationName(query.data.organizationName ?? '')
    setDraft({
      organizationName: query.data.organizationName,
      defaultWaiverText: query.data.defaultWaiverText,
      defaultReservationHours: query.data.defaultReservationHours,
      defaultPaymentToleranceCents: query.data.defaultPaymentToleranceCents,
      serviceFeeCents: query.data.serviceFeeCents,
      moneySportAmountCents: query.data.moneySportAmountCents,
    })
  }, [query.data, draft])

  const save = useMutation({
    mutationFn: (body: SaveSettings) => settings.save({ ...body, organizationName }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      setMessage(t('configuration.saved'))
    },
  })

  const suggestedWaiver = useMutation({
    mutationFn: () => settings.suggestedWaiver(),
    onSuccess: ({ text }) => {
      setDraft((d) => (d ? { ...d, defaultWaiverText: text } : d))
      setMessage(t('configuration.suggestedLoaded'))
    },
  })

  if (query.isPending || !draft) return <Loading />
  if (query.isError) return <ErrorNotice error={query.error} />

  const set = <K extends keyof SaveSettings>(field: K, value: SaveSettings[K]) => {
    setMessage(null)
    setDraft((d) => (d ? { ...d, [field]: value } : d))
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('nav.settings')}</h1>
        <p className="text-sm text-muted-foreground">{t('configuration.description')}</p>
      </div>

      {message && <SuccessNotice>{message}</SuccessNotice>}
      {save.isError && <ErrorNotice error={save.error} />}
      {suggestedWaiver.isError && <ErrorNotice error={suggestedWaiver.error} />}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate(draft)
        }}
      >
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">{t('configuration.organization')}</h2>

          <Field id="organization" label={t('configuration.organizationName')}>
            <Input
              id="organization"
              value={organizationName}
              onChange={(event) => {
                setMessage(null)
                setOrganizationName(event.target.value)
              }}
            />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">{t('configuration.registrationBilling')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="reservation" label={t('configuration.reservationHours')} hint={t('configuration.reservationHelp')}>
              <Input
                id="reservation"
                type="number"
                min={1}
                max={720}
                required
                value={draft.defaultReservationHours}
                onChange={(event) => set('defaultReservationHours', Number(event.target.value))}
              />
            </Field>

            <Field id="tolerance" label={t('configuration.paymentTolerance')} hint={t('configuration.paymentToleranceHelp')}>
              <Input
                id="tolerance"
                inputMode="decimal"
                value={centsToText(draft.defaultPaymentToleranceCents)}
                onChange={(event) => set('defaultPaymentToleranceCents', textToCents(event.target.value))}
              />
            </Field>

            <Field id="service-fee" label={t('configuration.serviceFee')} hint={t('configuration.serviceFeeHelp')}>
              <Input
                id="service-fee"
                inputMode="decimal"
                required
                value={centsToText(draft.serviceFeeCents)}
                onChange={(event) => set('serviceFeeCents', textToCents(event.target.value))}
              />
            </Field>

            <Field id="money-sport" label={t('settingsPage.moneySportAmount')} hint={t('settingsPage.moneySportAmountHelp')}>
              <Input
                id="money-sport"
                inputMode="decimal"
                value={centsToText(draft.moneySportAmountCents || 0)}
                onChange={(event) => set('moneySportAmountCents', textToCents(event.target.value))}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t('configuration.liability')}</h2>
              <p className="text-sm text-muted-foreground">{t('configuration.liabilityDescription')}</p>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => suggestedWaiver.mutate()} isLoading={suggestedWaiver.isPending}>
              <RotateCcw size={14} />
              {t('configuration.loadSuggested')}
            </Button>
          </div>

          <Textarea
            aria-label={t('configuration.liabilityLabel')}
            className="min-h-[16rem] font-mono text-xs"
            value={draft.defaultWaiverText ?? ''}
            onChange={(event) => set('defaultWaiverText', event.target.value)}
          />

          <p className="text-xs text-muted-foreground">{t('configuration.liabilityLegal')}</p>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={save.isPending}>
            <Save size={16} />
            {t('configuration.save')}
          </Button>
        </div>
      </form>

      {/* Outside the form above: the dialogs carry their own <form>, and a form cannot be nested inside another. */}
      <AgeCategoryTemplatesSection />
      <SizesSection />
      <KitItemsSection />
      <GenericQrSection />
    </div>
  )
}

// ---- Sizes ----

const EMPTY_SIZE: SaveSize = { measure: '', type: 'TShirt', sortOrder: 0, active: true }

function SizesSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['sizes'], queryFn: () => sizes.list() })

  const [dialog, setDialog] = useState<{ open: boolean; id: number | null; value: SaveSize }>({
    open: false,
    id: null,
    value: EMPTY_SIZE,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sizes'] })

  const save = useMutation({
    mutationFn: ({ id, value }: { id: number | null; value: SaveSize }) =>
      id === null ? sizes.create(value) : sizes.update(id, value),
    onSuccess: () => {
      void invalidate()
      setDialog((d) => ({ ...d, open: false }))
    },
  })

  const remove = useMutation({ mutationFn: (id: number) => sizes.delete(id), onSuccess: invalidate })

  const openNew = () => {
    save.reset()
    setDialog({ open: true, id: null, value: { ...EMPTY_SIZE, sortOrder: query.data?.length ?? 0 } })
  }

  const openEdit = (size: Size) => {
    save.reset()
    setDialog({
      open: true,
      id: size.id,
      value: { measure: size.measure, type: size.type, sortOrder: size.sortOrder, active: size.active },
    })
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('configuration.sizes')}</h2>
          <p className="text-sm text-muted-foreground">{t('configuration.sizesDescription')}</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={openNew}>
          <Plus size={14} />
          {t('configuration.addSize')}
        </Button>
      </div>

      {remove.isError && <ErrorNotice error={remove.error} />}

      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title={t('configuration.noSizes')}
          message={t('configuration.noSizesMessage')}
          action={{ label: t('configuration.addSize'), onClick: openNew }}
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {query.data.map((size) => (
            <li key={size.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{size.measure}</span>
                <Badge variant="info">{garmentLabel(size.type, t)}</Badge>
                {!size.active && <Badge variant="warning">{t('configuration.inactive')}</Badge>}
              </div>

              <RowActions
                name={`${size.measure} ${garmentLabel(size.type, t)}`}
                onEdit={() => openEdit(size)}
                onDelete={() => remove.mutate(size.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={dialog.open}
        title={dialog.id === null ? t('configuration.newSize') : t('configuration.editSize')}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={() => save.mutate({ id: dialog.id, value: dialog.value })}
        saving={save.isPending}
      >
        {save.isError && <ErrorNotice error={save.error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="size-measure" label={t('configuration.measure')}>
            <Input
              id="size-measure"
              required
              placeholder={t('settingsPage.examples.size')}
              value={dialog.value.measure}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, measure: e.target.value } }))}
            />
          </Field>

          <Field id="size-type" label={t('configuration.garmentType')}>
            <Select
              id="size-type"
              value={dialog.value.type}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, type: e.target.value as GarmentType } }))}
            >
              <option value="TShirt">{t('settingsPage.garment.TShirt')}</option>
              <option value="Singlet">{t('settingsPage.garment.Singlet')}</option>
            </Select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={dialog.value.active}
            onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, active: e.target.checked } }))}
          />
          {t('configuration.active')}
        </label>
      </FormDialog>
    </Card>
  )
}

// ---- Kit items ----

const EMPTY_ITEM: SaveKitItem = { name: '', sortOrder: 0, active: true, requiredSizeType: null }

function KitItemsSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['kit-items'], queryFn: () => kitItems.list() })

  const [dialog, setDialog] = useState<{ open: boolean; id: number | null; value: SaveKitItem }>({
    open: false,
    id: null,
    value: EMPTY_ITEM,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['kit-items'] })

  const save = useMutation({
    mutationFn: ({ id, value }: { id: number | null; value: SaveKitItem }) =>
      id === null ? kitItems.create(value) : kitItems.update(id, value),
    onSuccess: () => {
      void invalidate()
      setDialog((d) => ({ ...d, open: false }))
    },
  })

  const remove = useMutation({ mutationFn: (id: number) => kitItems.delete(id), onSuccess: invalidate })

  const openNew = () => {
    save.reset()
    setDialog({ open: true, id: null, value: { ...EMPTY_ITEM, sortOrder: query.data?.length ?? 0 } })
  }

  const openEdit = (item: KitItem) => {
    save.reset()
    setDialog({
      open: true,
      id: item.id,
      value: { name: item.name, sortOrder: item.sortOrder, active: item.active, requiredSizeType: item.requiredSizeType },
    })
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('catalog.items')}</h2>
          <p className="text-sm text-muted-foreground">{t('configuration.kitsDescription')}</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={openNew}>
          <Plus size={14} />
          {t('catalog.addItem')}
        </Button>
      </div>

      {remove.isError && <ErrorNotice error={remove.error} />}

      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('catalog.noItems')}
          message={t('configuration.noKitItemsMessage')}
          action={{ label: t('catalog.addItem'), onClick: openNew }}
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {query.data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.name}</span>
                {item.requiredSizeType && (
                  <Badge variant="info">
                    {t('catalog.requiresSize')} {garmentLabel(item.requiredSizeType, t).toLowerCase()}
                  </Badge>
                )}
                {!item.active && <Badge variant="warning">{t('catalog.inactive')}</Badge>}
              </div>

              <RowActions name={item.name} onEdit={() => openEdit(item)} onDelete={() => remove.mutate(item.id)} />
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={dialog.open}
        title={dialog.id === null ? t('configuration.newKitItem') : t('configuration.editKitItem')}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={() => save.mutate({ id: dialog.id, value: dialog.value })}
        saving={save.isPending}
      >
        {save.isError && <ErrorNotice error={save.error} />}

        <Field id="item-name" label={t('operation.name')}>
          <Input
            id="item-name"
            required
            placeholder={t('settingsPage.examples.item')}
            value={dialog.value.name}
            onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
          />
        </Field>

        <Field id="item-size" label={t('configuration.requiresSizeQuestion')} hint={t('configuration.itemSizeHelp')}>
          <Select
            id="item-size"
            value={dialog.value.requiredSizeType ?? ''}
            onChange={(e) =>
              setDialog((d) => ({
                ...d,
                value: { ...d.value, requiredSizeType: e.target.value ? (e.target.value as GarmentType) : null },
              }))
            }
          >
            <option value="">{t('configuration.noSizeRequired')}</option>
            <option value="TShirt">{t('settingsPage.garment.TShirt')}</option>
            <option value="Singlet">{t('settingsPage.garment.Singlet')}</option>
          </Select>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={dialog.value.active}
            onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, active: e.target.checked } }))}
          />
          {t('configuration.active')}
        </label>
      </FormDialog>
    </Card>
  )
}

// ---- Age category templates ----

const EMPTY_TEMPLATE: SaveAgeCategoryTemplate = { name: '', minAge: 18, maxAge: 30, sortOrder: 0 }

/** "51 a +" reads better than "51–120" for the open-ended range. */
function ageRange(template: AgeCategoryTemplate) {
  return template.maxAge >= MAX_AGE
    ? `${template.minAge} +`
    : `${template.minAge} – ${template.maxAge}`
}

function AgeCategoryTemplatesSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['age-category-templates'], queryFn: () => ageCategoryTemplates.list() })

  const [dialog, setDialog] = useState<{ open: boolean; id: number | null; value: SaveAgeCategoryTemplate }>({
    open: false,
    id: null,
    value: EMPTY_TEMPLATE,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['age-category-templates'] })

  const save = useMutation({
    mutationFn: ({ id, value }: { id: number | null; value: SaveAgeCategoryTemplate }) =>
      id === null ? ageCategoryTemplates.create(value) : ageCategoryTemplates.update(id, value),
    onSuccess: () => {
      void invalidate()
      setDialog((d) => ({ ...d, open: false }))
    },
  })

  const remove = useMutation({ mutationFn: (id: number) => ageCategoryTemplates.delete(id), onSuccess: invalidate })

  const openNew = () => {
    save.reset()
    setDialog({ open: true, id: null, value: { ...EMPTY_TEMPLATE, sortOrder: query.data?.length ?? 0 } })
  }

  const openEdit = (template: AgeCategoryTemplate) => {
    save.reset()
    setDialog({
      open: true,
      id: template.id,
      value: { name: template.name, minAge: template.minAge, maxAge: template.maxAge, sortOrder: template.sortOrder },
    })
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('configuration.categories')}</h2>
          <p className="text-sm text-muted-foreground">{t('configuration.categoriesDescription')}</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={openNew}>
          <Plus size={14} />
          {t('configuration.addCategory')}
        </Button>
      </div>

      {remove.isError && <ErrorNotice error={remove.error} />}

      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={t('configuration.noCategories')}
          message={t('configuration.noCategoriesMessage')}
          action={{ label: t('configuration.addCategory'), onClick: openNew }}
        />
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {query.data.map((template) => (
              <li key={template.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ageRange(template)} {t('configuration.categoryAge')}
                  </span>
                </div>

                <RowActions name={template.name} onEdit={() => openEdit(template)} onDelete={() => remove.mutate(template.id)} />
              </li>
            ))}
          </ul>

          <InfoNotice>{t('configuration.categoryChangeWarning')}</InfoNotice>
        </>
      )}

      <FormDialog
        open={dialog.open}
        title={dialog.id === null ? t('configuration.newCategory') : t('configuration.editCategory')}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={() => save.mutate({ id: dialog.id, value: dialog.value })}
        saving={save.isPending}
      >
        {save.isError && <ErrorNotice error={save.error} />}

        <Field id="template-name" label={t('operation.name')}>
          <Input
            id="template-name"
            required
            autoFocus
            placeholder={t('settingsPage.examples.category')}
            value={dialog.value.name}
            onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="template-min" label={t('configuration.minAge')}>
            <Input
              id="template-min"
              type="number"
              min={0}
              max={MAX_AGE}
              required
              value={dialog.value.minAge}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, minAge: Number(e.target.value) } }))}
            />
          </Field>

          <Field id="template-max" label={t('configuration.maxAge')} hint={t('configuration.openRange', { age: MAX_AGE })}>
            <Input
              id="template-max"
              type="number"
              min={0}
              max={MAX_AGE}
              required
              value={dialog.value.maxAge}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, maxAge: Number(e.target.value) } }))}
            />
          </Field>
        </div>

        <p className="text-sm text-muted-foreground">{t('settingsPage.categoryHelp')}</p>
      </FormDialog>
    </Card>
  )
}

// ---- Generic payment QR ----

function GenericQrSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  // The address never changes, so the browser must be told to fetch it again after each upload.
  const [version, setVersion] = useState(0)

  const exists = useQuery({ queryKey: ['generic-qr'], queryFn: () => genericQr.exists() })

  const upload = useMutation({
    mutationFn: (file: File) => genericQr.upload(file),
    onSuccess: () => {
      setVersion((v) => v + 1)
      void queryClient.invalidateQueries({ queryKey: ['generic-qr'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => genericQr.delete(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generic-qr'] }),
  })

  const hasQr = exists.data === true

  return (
    <Card className="space-y-4 p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">{t('configuration.genericQr')}</h2>
        <p className="text-sm text-muted-foreground">{t('configuration.genericQrHelp')}</p>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload.mutate(file)
          e.target.value = ''
        }}
      />

      {upload.isError && <ErrorNotice error={upload.error} />}
      {remove.isError && <ErrorNotice error={remove.error} />}

      {exists.isPending ? (
        <Loading />
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {hasQr ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation
            <img
              src={`${genericQr.url()}?v=${version}`}
              alt={t('configuration.genericQr')}
              className="h-40 w-40 rounded-md border bg-white object-contain p-2"
            />
          ) : (
            <p className="max-w-sm text-sm text-muted-foreground">{t('configuration.genericQrEmpty')}</p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={() => input.current?.click()} isLoading={upload.isPending}>
              <Upload size={14} />
              {hasQr ? t('configuration.replaceQr') : t('configuration.uploadQr')}
            </Button>

            {hasQr && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => remove.mutate()}
                isLoading={remove.isPending}
              >
                <Trash2 size={14} />
                {t('configuration.deleteQr')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ---- Shared helpers ----

function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label={t('settingsPage.rowEdit', { name })}>
        <Pencil size={13} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={onDelete}
        aria-label={t('settingsPage.rowDelete', { name })}
      >
        <Trash2 size={13} />
      </Button>
    </div>
  )
}

function garmentLabel(type: GarmentType, t: (key: string) => string) {
  return t(`settingsPage.garment.${type}`)
}
