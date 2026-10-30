'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Pencil, Plus, Route, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { kitItems, kitMedia, kits, modalities, priceTiers } from '@/api/endpoints'
import type {
  EventDetail,
  Kit,
  Modality,
  PriceTier,
  SaveKit,
  SaveModality,
  SavePriceTier,
} from '@/api/types'
import { ActionTable, type ActionRow } from '@/components/ui/ActionTable'
import { FormDialog } from '@/components/ui/dialog'
import { EmptyState, ErrorNotice } from '@/components/ui/states'
import { Badge, Button, Card, Field, Input, Label, Textarea } from '@/components/ui/primitives'
import { centsToText, formatDate, formatDistance, formatMoney, fromDateTimeInput, textToCents, toDateTimeInput } from '@/lib/format'
import { KitImageField } from './KitImageField'
import { PriceMatrix } from './PriceMatrix'

interface Props {
  event: EventDetail
  canManage: boolean
  onChanged: () => void
}

const EMPTY_MODALITY: SaveModality = {
  name: '',
  distanceMeters: 10_000,
  quota: null,
  sortOrder: 0,
  minAge: null,
  active: true,
  bibFrom: null,
  bibTo: null,
}

const EMPTY_KIT: SaveKit = {
  name: '',
  description: '',
  surchargeCents: 0,
  sortOrder: 0,
  active: true,
  itemIds: [],
}

/** Dialog state shared by create and edit: `id` is null while creating. */
interface DialogState<T> {
  open: boolean
  id: number | null
  modalityId: number
  value: T
}

export function ModalitiesSection({ event, canManage, onChanged }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const locale = i18n.language

  // Every item, active or not: a kit already built with an item that was later deactivated must still show it when edited.
  const itemCatalog = useQuery({ queryKey: ['kit-items'], queryFn: () => kitItems.list() })

  const [modalityDialog, setModalityDialog] = useState<DialogState<SaveModality>>({
    open: false,
    id: null,
    modalityId: 0,
    value: EMPTY_MODALITY,
  })
  const [kitDialog, setKitDialog] = useState<DialogState<SaveKit> & { hasImage: boolean; pendingImage: File | null }>({
    open: false,
    id: null,
    modalityId: 0,
    value: EMPTY_KIT,
    hasImage: false,
    pendingImage: null,
  })
  const [priceDialog, setPriceDialog] = useState<DialogState<SavePriceTier>>({
    open: false,
    id: null,
    modalityId: 0,
    value: emptyPrice(event),
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['event', event.id] })
    onChanged()
  }

  const saveModality = useMutation({
    mutationFn: ({ id, value }: { id: number | null; value: SaveModality }) =>
      id === null ? modalities.create(event.id, value) : modalities.update(id, value),
    onSuccess: async (created, variables) => {
      if (variables.id === null) {
        // A new modality gets a GENERAL price tier over the registration window, so it can be published as soon as a price is set.
        await priceTiers.create(created.id, {
          name: t('modalities.generalPrice'),
          priceCents: 0,
          validFrom: event.registrationOpensAt,
          validTo: event.registrationClosesAt,
        })
      }
      refresh()
      setModalityDialog((d) => ({ ...d, open: false }))
    },
  })

  const saveKit = useMutation({
    mutationFn: async ({
      id,
      modalityId,
      value,
      pendingImage,
    }: {
      id: number | null
      modalityId: number
      value: SaveKit
      pendingImage: File | null
    }) => {
      if (id !== null) return kits.update(id, value)

      const kit = await kits.create(modalityId, value)
      if (pendingImage) {
        try {
          await kitMedia.upload(kit.id, pendingImage)
        } catch (error) {
          // The kit is saved already: switch to edit mode so retrying does not create a duplicate.
          setKitDialog((d) => ({ ...d, id: kit.id, pendingImage: null, hasImage: false }))
          refresh()
          throw error
        }
      }
      return kit
    },
    onSuccess: () => {
      refresh()
      setKitDialog((d) => ({ ...d, open: false }))
    },
  })

  const savePrice = useMutation({
    mutationFn: ({ id, modalityId, value }: DialogState<SavePriceTier>) =>
      id === null ? priceTiers.create(modalityId, value) : priceTiers.update(id, value),
    onSuccess: () => {
      refresh()
      setPriceDialog((d) => ({ ...d, open: false }))
    },
  })

  const deleteModality = useMutation({ mutationFn: (id: number) => modalities.delete(id), onSuccess: refresh })
  const deleteKit = useMutation({ mutationFn: (id: number) => kits.delete(id), onSuccess: refresh })
  const deletePrice = useMutation({ mutationFn: (id: number) => priceTiers.delete(id), onSuccess: refresh })

  const newModality = () => {
    saveModality.reset()
    setModalityDialog({
      open: true,
      id: null,
      modalityId: 0,
      value: { ...EMPTY_MODALITY, sortOrder: event.modalities.length },
    })
  }

  const editModality = (modality: Modality) => {
    saveModality.reset()
    setModalityDialog({
      open: true,
      id: modality.id,
      modalityId: modality.id,
      value: {
        name: modality.name,
        distanceMeters: modality.distanceMeters,
        quota: modality.quota,
        sortOrder: modality.sortOrder,
        minAge: modality.minAge,
        active: modality.active,
        bibFrom: modality.bibFrom,
        bibTo: modality.bibTo,
      },
    })
  }

  const newKit = (modality: Modality) => {
    saveKit.reset()
    setKitDialog({
      open: true,
      id: null,
      modalityId: modality.id,
      value: { ...EMPTY_KIT, sortOrder: modality.kits.length },
      hasImage: false,
      pendingImage: null,
    })
  }

  const editKit = (modality: Modality, kit: Kit) => {
    saveKit.reset()
    setKitDialog({
      open: true,
      id: kit.id,
      modalityId: modality.id,
      value: {
        name: kit.name,
        description: kit.description,
        surchargeCents: kit.surchargeCents,
        sortOrder: kit.sortOrder,
        active: kit.active,
        itemIds: kit.items.map((item) => item.id),
      },
      hasImage: kit.hasImage,
      pendingImage: null,
    })
  }

  const newPrice = (modality: Modality) => {
    savePrice.reset()
    setPriceDialog({ open: true, id: null, modalityId: modality.id, value: emptyPrice(event) })
  }

  const editPrice = (modality: Modality, tier: PriceTier) => {
    savePrice.reset()
    setPriceDialog({
      open: true,
      id: tier.id,
      modalityId: modality.id,
      value: {
        name: tier.name,
        priceCents: tier.priceCents,
        validFrom: tier.validFrom,
        validTo: tier.validTo,
      },
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('modalities.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('modalities.help')}</p>
        </div>

        {canManage && (
          <Button variant="outline" onClick={newModality}>
            <Plus size={16} />
            {t('modalities.add')}
          </Button>
        )}
      </div>

      {/* Delete errors are shown here: there is no dialog to show them in, and the API explains why it refused. */}
      {deleteModality.isError && <ErrorNotice error={deleteModality.error} />}
      {deleteKit.isError && <ErrorNotice error={deleteKit.error} />}
      {deletePrice.isError && <ErrorNotice error={deletePrice.error} />}

      {event.modalities.length === 0 ? (
        <EmptyState
          icon={Route}
          title={t('modalities.empty')}
          message={t('modalities.emptyMessage')}
          action={canManage ? { label: t('modalities.add'), onClick: newModality } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {event.modalities.map((modality) => (
            <Card key={modality.id} className="p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{modality.name}</h3>
                    <Badge variant="info">{formatDistance(modality.distanceMeters)}</Badge>
                    {!modality.active && <Badge variant="warning">{t('modalities.inactive')}</Badge>}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {modality.quota
                      ? t('modalities.capacityWithQuota', { occupied: modality.occupiedSeats, quota: modality.quota })
                      : t('modalities.capacityUnlimited', { occupied: modality.occupiedSeats })}
                    {modality.bibFrom &&
                      ` · ${t('modalities.bibRange', { from: modality.bibFrom, to: modality.bibTo })}`}
                  </p>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => editModality(modality)}>
                      <Pencil size={13} />
                      {t('modalities.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteModality.mutate(modality.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>

              <ModalityWarnings modality={modality} />

              <div className="space-y-6">
                <PricesBlock
                  modality={modality}
                  canManage={canManage}
                  onAdd={() => newPrice(modality)}
                  onEdit={(tier) => editPrice(modality, tier)}
                  onDelete={(tier) => deletePrice.mutate(tier.id)}
                  locale={locale}
                />

                <KitsBlock
                  modality={modality}
                  canManage={canManage}
                  onAdd={() => newKit(modality)}
                  onEdit={(kit) => editKit(modality, kit)}
                  onDelete={(kit) => deleteKit.mutate(kit.id)}
                  locale={locale}
                />
              </div>

              <PriceMatrix
                modality={modality}
                eventServiceFeeCents={event.serviceFeeCents}
                canManage={canManage}
                onChanged={refresh}
                locale={locale}
              />
            </Card>
          ))}
        </div>
      )}

      {/* ---- Modality ---- */}
      <FormDialog
        open={modalityDialog.open}
        title={modalityDialog.id === null ? t('modalities.newModality') : t('modalities.editModality')}
        onClose={() => setModalityDialog((d) => ({ ...d, open: false }))}
        onSave={() => saveModality.mutate({ id: modalityDialog.id, value: modalityDialog.value })}
        saving={saveModality.isPending}
      >
        {saveModality.isError && <ErrorNotice error={saveModality.error} />}

        <Field id="modality-name" label={t('operation.name')}>
          <Input
            id="modality-name"
            required
            placeholder={t('modalities.examples.modality')}
            value={modalityDialog.value.name}
            onChange={(e) => setModalityDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
          />
        </Field>

        <Field id="modality-distance" label={t('eventUi.distanceMeters')} hint={t('eventUi.distanceHelp')}>
          <Input
            id="modality-distance"
            type="number"
            min={100}
            max={500_000}
            required
            value={modalityDialog.value.distanceMeters}
            onChange={(e) =>
              setModalityDialog((d) => ({ ...d, value: { ...d.value, distanceMeters: Number(e.target.value) } }))
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="modality-quota" label={t('eventUi.capacity')} hint={t('eventUi.emptyCapacity')}>
            <Input
              id="modality-quota"
              type="number"
              min={1}
              value={modalityDialog.value.quota ?? ''}
              onChange={(e) =>
                setModalityDialog((d) => ({
                  ...d,
                  value: { ...d.value, quota: e.target.value ? Number(e.target.value) : null },
                }))
              }
            />
          </Field>

          <Field id="modality-min-age" label={t('eventUi.minimumAge')}>
            <Input
              id="modality-min-age"
              type="number"
              min={3}
              max={100}
              value={modalityDialog.value.minAge ?? ''}
              onChange={(e) =>
                setModalityDialog((d) => ({
                  ...d,
                  value: { ...d.value, minAge: e.target.value ? Number(e.target.value) : null },
                }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="modality-bib-from" label={t('eventUi.bibFrom')}>
            <Input
              id="modality-bib-from"
              type="number"
              min={1}
              value={modalityDialog.value.bibFrom ?? ''}
              onChange={(e) =>
                setModalityDialog((d) => ({
                  ...d,
                  value: { ...d.value, bibFrom: e.target.value ? Number(e.target.value) : null },
                }))
              }
            />
          </Field>

          <Field id="modality-bib-to" label={t('eventUi.bibTo')}>
            <Input
              id="modality-bib-to"
              type="number"
              min={1}
              value={modalityDialog.value.bibTo ?? ''}
              onChange={(e) =>
                setModalityDialog((d) => ({
                  ...d,
                  value: { ...d.value, bibTo: e.target.value ? Number(e.target.value) : null },
                }))
              }
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={modalityDialog.value.active}
            onChange={(e) => setModalityDialog((d) => ({ ...d, value: { ...d.value, active: e.target.checked } }))}
          />
          {t('modalities.activeCheckbox')}
        </label>
      </FormDialog>

      {/* ---- Kit ---- */}
      <FormDialog
        open={kitDialog.open}
        title={kitDialog.id === null ? t('modalities.newKit') : t('modalities.editKit')}
        onClose={() => setKitDialog((d) => ({ ...d, open: false }))}
        onSave={() =>
          saveKit.mutate({
            id: kitDialog.id,
            modalityId: kitDialog.modalityId,
            value: kitDialog.value,
            pendingImage: kitDialog.pendingImage,
          })
        }
        saving={saveKit.isPending}
      >
        {saveKit.isError && <ErrorNotice error={saveKit.error} />}

        <Field id="kit-name" label={t('operation.name')}>
          <Input
            id="kit-name"
            required
            placeholder={t('modalities.examples.kit')}
            value={kitDialog.value.name}
            onChange={(e) => setKitDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
          />
        </Field>

        <Field id="kit-surcharge" label={t('modalities.surcharge')}>
          <Input
            id="kit-surcharge"
            inputMode="decimal"
            value={centsToText(kitDialog.value.surchargeCents)}
            onChange={(e) =>
              setKitDialog((d) => ({ ...d, value: { ...d.value, surchargeCents: textToCents(e.target.value) } }))
            }
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={kitDialog.value.active}
            onChange={(e) => setKitDialog((d) => ({ ...d, value: { ...d.value, active: e.target.checked } }))}
          />
          {t('modalities.kitActive')}
        </label>

        <div className="space-y-1.5">
          <Label>{t('eventUi.includedItems')}</Label>
          <p className="text-xs text-muted-foreground">{t('modalities.includedItemsHelp')}</p>

          {itemCatalog.isPending ? (
            <p className="text-sm text-muted-foreground">{t('eventUi.loadingItems')}</p>
          ) : itemCatalog.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('modalities.noItemsYet')}</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {itemCatalog.data
                ?.filter((item) => item.active)
                .map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={kitDialog.value.itemIds?.includes(item.id) ?? false}
                      onChange={(e) =>
                        setKitDialog((d) => {
                          const current = d.value.itemIds ?? []
                          return {
                            ...d,
                            value: {
                              ...d.value,
                              itemIds: e.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id),
                            },
                          }
                        })
                      }
                    />
                    {item.name}
                  </label>
                ))}
            </div>
          )}
        </div>

        <Field id="kit-description" label={t('operation.description')}>
          <Textarea
            id="kit-description"
            value={kitDialog.value.description ?? ''}
            onChange={(e) => setKitDialog((d) => ({ ...d, value: { ...d.value, description: e.target.value } }))}
          />
        </Field>

        <div className="space-y-1.5 border-t pt-4">
          <Label>{t('eventUi.kitImage')}</Label>
          <p className="text-xs text-muted-foreground">{t('eventUi.kitImageHelp')}</p>
          <KitImageField
            kitId={kitDialog.id}
            hasImage={kitDialog.hasImage}
            pendingFile={kitDialog.pendingImage}
            onPendingChange={(file) => setKitDialog((d) => ({ ...d, pendingImage: file }))}
            onChanged={refresh}
          />
        </div>
      </FormDialog>

      {/* ---- Price tier ---- */}
      <FormDialog
        open={priceDialog.open}
        title={priceDialog.id === null ? t('modalities.newPrice') : t('modalities.editPrice')}
        onClose={() => setPriceDialog((d) => ({ ...d, open: false }))}
        onSave={() => savePrice.mutate(priceDialog)}
        saving={savePrice.isPending}
      >
        {savePrice.isError && <ErrorNotice error={savePrice.error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="price-name" label={t('operation.name')}>
            <Input
              id="price-name"
              required
              placeholder={t('modalities.examples.price')}
              value={priceDialog.value.name}
              onChange={(e) => setPriceDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
            />
          </Field>

          <Field id="price-amount" label={t('catalog.prices')}>
            <Input
              id="price-amount"
              inputMode="decimal"
              required
              value={centsToText(priceDialog.value.priceCents)}
              onChange={(e) =>
                setPriceDialog((d) => ({ ...d, value: { ...d.value, priceCents: textToCents(e.target.value) } }))
              }
            />
          </Field>
        </div>

        <Field id="price-from" label={t('modalities.validFrom')}>
          <Input
            id="price-from"
            type="datetime-local"
            required
            value={toDateTimeInput(priceDialog.value.validFrom)}
            onChange={(e) =>
              setPriceDialog((d) => ({ ...d, value: { ...d.value, validFrom: fromDateTimeInput(e.target.value) } }))
            }
          />
        </Field>

        <Field id="price-to" label={t('modalities.validTo')} hint={t('modalities.priceOverlapHelp')}>
          <Input
            id="price-to"
            type="datetime-local"
            required
            value={toDateTimeInput(priceDialog.value.validTo)}
            onChange={(e) =>
              setPriceDialog((d) => ({ ...d, value: { ...d.value, validTo: fromDateTimeInput(e.target.value) } }))
            }
          />
        </Field>
      </FormDialog>
    </section>
  )
}

/** Default window of a new price tier: the whole registration window of the event. */
function emptyPrice(event: EventDetail): SavePriceTier {
  return {
    name: '',
    priceCents: 0,
    validFrom: event.registrationOpensAt,
    validTo: event.registrationClosesAt,
  }
}

function ModalityWarnings({ modality }: { modality: Modality }) {
  const { t } = useTranslation()
  const noActiveKit = modality.kits.every((kit) => !kit.active)
  const noPrice = modality.priceTiers.length === 0

  if (!noActiveKit && !noPrice) return null

  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>
        {noActiveKit && t('modalities.warningNoKit')}
        {noPrice && t('modalities.warningNoPrice')}
        {t('modalities.cannotPublish')}
      </span>
    </div>
  )
}

function PricesBlock({
  modality,
  canManage,
  onAdd,
  onEdit,
  onDelete,
  locale,
}: {
  modality: Modality
  canManage: boolean
  onAdd: () => void
  onEdit: (tier: PriceTier) => void
  onDelete: (tier: PriceTier) => void
  locale: string
}) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-muted-foreground">{t('modalities.prices')}</Label>
        {canManage && (
          <Button variant="link" size="sm" onClick={onAdd}>
            {t('catalog.addPrice')}
          </Button>
        )}
      </div>

      {modality.priceTiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('modalities.noPrices')}</p>
      ) : (
        <ActionTable
          columns={[t('modalities.priceName'), t('modalities.priceAmount'), t('modalities.priceFrom'), t('modalities.priceTo')]}
          rightAligned={[1]}
          showActions={canManage}
          rows={modality.priceTiers.map<ActionRow>((tier) => ({
            key: tier.id,
            label: tier.name,
            cells: [
              tier.name,
              formatMoney(tier.priceCents, locale),
              formatDate(tier.validFrom, locale),
              formatDate(tier.validTo, locale),
            ],
            onEdit: () => onEdit(tier),
            onDelete: () => onDelete(tier),
          }))}
        />
      )}
    </div>
  )
}

function KitsBlock({
  modality,
  canManage,
  onAdd,
  onEdit,
  onDelete,
  locale,
}: {
  modality: Modality
  canManage: boolean
  onAdd: () => void
  onEdit: (kit: Kit) => void
  onDelete: (kit: Kit) => void
  locale: string
}) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-muted-foreground">{t('modalities.kits')}</Label>
        {canManage && (
          <Button variant="link" size="sm" onClick={onAdd}>
            {t('catalog.addKit')}
          </Button>
        )}
      </div>

      {modality.kits.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('modalities.noKits')}</p>
      ) : (
        <ActionTable
          columns={[
            t('modalities.kitName'),
            t('modalities.kitItems'),
            t('modalities.kitSize'),
            t('modalities.kitImage'),
            t('modalities.kitSurcharge'),
            t('modalities.kitStatus'),
          ]}
          rightAligned={[4]}
          showActions={canManage}
          rows={modality.kits.map<ActionRow>((kit) => ({
            key: kit.id,
            label: kit.name,
            cells: [
              kit.name,
              kit.items.length > 0 ? kit.items.map((item) => item.name).join(', ') : '—',
              kit.requiredSizeType ? t('modalities.sizeRequired', { type: kit.requiredSizeType }) : t('modalities.sizeNotRequired'),
              kit.hasImage ? <KitThumbnail key={kit.id} kitId={kit.id} name={kit.name} /> : '—',
              formatMoney(kit.surchargeCents, locale),
              kit.active ? t('modalities.kitActive') : t('modalities.kitInactive'),
            ],
            onEdit: () => onEdit(kit),
            onDelete: () => onDelete(kit),
          }))}
        />
      )}
    </div>
  )
}

function KitThumbnail({ kitId, name }: { kitId: number; name: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation
  return <img src={kitMedia.url(kitId)} alt={name} className="h-9 w-9 rounded border object-cover" />
}
