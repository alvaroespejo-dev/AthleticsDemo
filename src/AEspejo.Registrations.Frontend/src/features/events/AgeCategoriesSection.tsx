'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Plus, RefreshCw, Tags, Trash2, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ageCategories, registrations } from '@/api/endpoints'
import type { EventDetail, SaveAgeCategory, Sex } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { EmptyState, ErrorNotice, SuccessNotice } from '@/components/ui/states'
import { Button, Card, Field, Input, Select } from '@/components/ui/primitives'

interface Props {
  event: EventDetail
  canManage: boolean
  onChanged: () => void
}

const EMPTY_CATEGORY: SaveAgeCategory = {
  name: '',
  sex: 'Female',
  minAge: 18,
  maxAge: 29,
  modalityId: null,
  sortOrder: 0,
}

const SEXES: Sex[] = ['Female', 'Male']

export function AgeCategoriesSection({ event, canManage, onChanged }: Props) {
  const { t } = useTranslation()
  const [dialog, setDialog] = useState({ open: false, value: EMPTY_CATEGORY })
  const [notice, setNotice] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: (value: SaveAgeCategory) => ageCategories.create(event.id, value),
    onSuccess: () => {
      onChanged()
      setDialog((d) => ({ ...d, open: false }))
    },
  })

  const generateStandard = useMutation({
    mutationFn: () => ageCategories.generateStandard(event.id),
    onSuccess: onChanged,
  })

  const recalculate = useMutation({
    mutationFn: () => registrations.recalculateAgeCategories(event.id),
    onSuccess: (result) => {
      setNotice(t('eventSections.ageCategories.recalculated', { count: result.registrationsUpdated }))
      onChanged()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => ageCategories.delete(id),
    onSuccess: onChanged,
  })

  const categoriesOf = (sex: Sex) =>
    event.ageCategories.filter((category) => category.sex === sex).sort((a, b) => a.sortOrder - b.sortOrder)

  const openDialog = () => {
    create.reset()
    setDialog({ open: true, value: { ...EMPTY_CATEGORY, sortOrder: event.ageCategories.length } })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('catalog.ageCategories')}</h2>
          <p className="text-sm text-muted-foreground">{t('catalog.ageCategoriesHelp')}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {event.ageCategories.length > 0 && (
              <Button variant="outline" onClick={() => recalculate.mutate()} isLoading={recalculate.isPending}>
                <RefreshCw size={14} />
                {t('catalog.recalculate')}
              </Button>
            )}

            <Button variant="outline" onClick={openDialog}>
              <Plus size={16} />
              {t('catalog.add')}
            </Button>
          </div>
        )}
      </div>

      {notice && <SuccessNotice>{notice}</SuccessNotice>}
      {generateStandard.isError && <ErrorNotice error={generateStandard.error} />}
      {recalculate.isError && <ErrorNotice error={recalculate.error} />}
      {remove.isError && <ErrorNotice error={remove.error} />}

      {event.ageCategories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={t('catalog.noCategories')}
          message={t('eventSections.ageCategories.emptyMessage')}
          action={canManage ? { label: t('catalog.generateStandard'), onClick: () => generateStandard.mutate() } : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {SEXES.map((sex) => (
            <Card key={sex} className="p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {sex === 'Female' ? t('profile.genderFemale') : t('profile.genderMale')}
              </h3>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('catalog.ageCategories')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('catalog.age')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('eventSections.ageCategories.scope')}
                      </th>
                      {canManage && <th className="w-10" />}
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesOf(sex).map((category) => (
                      <tr key={category.id} className="border-t">
                        <td className="px-3 py-2">{category.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {category.minAge}–{category.maxAge}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {category.modalityId
                            ? t('eventSections.ageCategories.onlyModality', {
                                name: event.modalities.find((m) => m.id === category.modalityId)?.name ?? '—',
                              })
                            : t('eventSections.ageCategories.allModalities')}
                        </td>
                        {canManage && (
                          <td className="px-2 py-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => remove.mutate(category.id)}
                              aria-label={t('eventSections.ageCategories.deleteRow', { name: category.name })}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {event.ageCategories.length === 0 && canManage && (
        <Button variant="secondary" onClick={() => generateStandard.mutate()} isLoading={generateStandard.isPending}>
          <Wand2 size={16} />
          {t('catalog.generateStandard')}
        </Button>
      )}

      <FormDialog
        open={dialog.open}
        title={t('eventSections.ageCategories.newCategory')}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={() => create.mutate(dialog.value)}
        saving={create.isPending}
      >
        {create.isError && <ErrorNotice error={create.error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="category-name" label={t('operation.name')}>
            <Input
              id="category-name"
              required
              placeholder={t('eventSections.ageCategories.namePlaceholder')}
              value={dialog.value.name}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, name: e.target.value } }))}
            />
          </Field>

          <Field id="category-sex" label={t('eventSections.ageCategories.sex')}>
            <Select
              id="category-sex"
              value={dialog.value.sex}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, sex: e.target.value as Sex } }))}
            >
              <option value="Female">{t('profile.genderFemale')}</option>
              <option value="Male">{t('profile.genderMale')}</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="category-min" label={t('eventUi.minimumAge')}>
            <Input
              id="category-min"
              type="number"
              min={0}
              max={120}
              value={dialog.value.minAge}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, minAge: Number(e.target.value) } }))}
            />
          </Field>

          <Field id="category-max" label={t('eventSections.ageCategories.maxAge')}>
            <Input
              id="category-max"
              type="number"
              min={0}
              max={120}
              value={dialog.value.maxAge}
              onChange={(e) => setDialog((d) => ({ ...d, value: { ...d.value, maxAge: Number(e.target.value) } }))}
            />
          </Field>
        </div>

        <Field
          id="category-modality"
          label={t('eventSections.ageCategories.scope')}
          hint={t('eventSections.ageCategories.scopeHelp')}
        >
          <Select
            id="category-modality"
            value={dialog.value.modalityId ?? ''}
            onChange={(e) =>
              setDialog((d) => ({
                ...d,
                value: { ...d.value, modalityId: e.target.value ? Number(e.target.value) : null },
              }))
            }
          >
            <option value="">{t('eventSections.ageCategories.allModalities')}</option>
            {event.modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {t('eventSections.ageCategories.onlyModality', { name: modality.name })}
              </option>
            ))}
          </Select>
        </Field>
      </FormDialog>
    </section>
  )
}
