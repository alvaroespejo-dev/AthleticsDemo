'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { athletes } from '@/api/endpoints'
import type { AthleteDetail, DocumentType, SaveAthlete, Sex } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { BirthDateField } from '@/components/ui/BirthDateField'
import { CountrySelector } from '@/components/ui/CountrySelector'
import { PhoneField } from '@/components/ui/PhoneField'
import { Button, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'
import { DEFAULT_CALLING_CODE, DEFAULT_COUNTRY } from '@/lib/countries'
import { DOCUMENT_TYPES } from '@/lib/documents'

interface Props {
  athleteId: number
  canUnlink: boolean
  onClose: () => void
  onDone: (message: string) => void
}

export function AthleteEditDialog({ athleteId, canUnlink, onClose, onDone }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const detail = useQuery({ queryKey: ['athlete', athleteId], queryFn: () => athletes.get(athleteId) })

  if (detail.isPending) return <Loading />
  if (detail.isError) return <ErrorNotice error={detail.error} />

  return (
    <EditForm
      key={detail.data.id}
      athlete={detail.data}
      canUnlink={canUnlink}
      onClose={onClose}
      onSaved={() => {
        void queryClient.invalidateQueries({ queryKey: ['athletes'] })
        void queryClient.invalidateQueries({ queryKey: ['athlete', athleteId] })
        onDone(t('athletesPage.saved'))
        onClose()
      }}
    />
  )
}

function EditForm({ athlete, canUnlink, onClose, onSaved }: { athlete: AthleteDetail; canUnlink: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [draft, setDraft] = useState<SaveAthlete>({
    documentType: athlete.documentType,
    documentNumber: athlete.documentNumber,
    nationality: athlete.nationality,
    firstNames: athlete.firstNames,
    lastNames: athlete.lastNames,
    sex: athlete.sex,
    birthDate: athlete.birthDate,
    phoneCountryCode: athlete.phoneCountryCode,
    phoneNumber: athlete.phoneNumber,
    email: athlete.email,
    city: athlete.city,
    club: athlete.club,
    emergencyContactName: athlete.emergencyContactName,
    emergencyContactPhoneCountryCode: athlete.emergencyContactPhoneCountryCode,
    emergencyContactPhoneNumber: athlete.emergencyContactPhoneNumber,
    bloodType: athlete.bloodType,
    allergies: athlete.allergies,
  })

  const save = useMutation({
    mutationFn: () => athletes.update(athlete.id, draft),
    onSuccess: onSaved,
  })

  const accounts = useQuery({ queryKey: ['athlete-accounts', athlete.id], queryFn: () => athletes.accounts(athlete.id) })

  const unlink = useMutation({
    mutationFn: (accountId: number) => athletes.unlinkAccount(accountId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['athlete-accounts', athlete.id] }),
  })

  const set = <K extends keyof SaveAthlete>(field: K, value: SaveAthlete[K]) => setDraft((d) => ({ ...d, [field]: value }))

  return (
    <FormDialog open title={t('athletes.edit')} onClose={onClose} onSave={() => save.mutate()} saving={save.isPending} className="max-w-2xl">
      {save.isError && <ErrorNotice error={save.error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="athlete-doc-type" label={t('athletesPage.documentType')}>
          <Select id="athlete-doc-type" value={draft.documentType} onChange={(e) => set('documentType', e.target.value as DocumentType)}>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`registrations.documentType.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="athlete-doc-number" label={t('athletesPage.documentNumber')}>
          <Input id="athlete-doc-number" required value={draft.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="athlete-first" label={t('athletesPage.firstNames')}>
          <Input id="athlete-first" required value={draft.firstNames} onChange={(e) => set('firstNames', e.target.value)} />
        </Field>
        <Field id="athlete-last" label={t('athletesPage.lastNames')}>
          <Input id="athlete-last" required value={draft.lastNames} onChange={(e) => set('lastNames', e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="athlete-sex" label={t('athletes.gender')}>
          <Select id="athlete-sex-edit" value={draft.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
            <option value="Female">{t('profile.genderFemale')}</option>
            <option value="Male">{t('profile.genderMale')}</option>
          </Select>
        </Field>
        <BirthDateField id="athlete-birth" value={draft.birthDate} onChange={(v) => set('birthDate', v)} required />
        <Field id="athlete-nationality" label={t('athletesPage.nationality')}>
          <CountrySelector
            id="athlete-nationality"
            value={draft.nationality ?? DEFAULT_COUNTRY}
            onChange={(e) => set('nationality', e.target.value)}
          />
        </Field>
      </div>

      <PhoneField
        id="athlete-phone"
        label={t('athletes.phone')}
        callingCode={draft.phoneCountryCode}
        number={draft.phoneNumber}
        onChange={(callingCode, number) => setDraft((d) => ({ ...d, phoneCountryCode: callingCode, phoneNumber: number }))}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="athlete-email" label={t('athletes.email')}>
          <Input id="athlete-email" type="email" value={draft.email ?? ''} onChange={(e) => set('email', e.target.value || null)} />
        </Field>
        <Field id="athlete-city" label={t('athletes.city')}>
          <Input id="athlete-city" value={draft.city ?? ''} onChange={(e) => set('city', e.target.value || null)} />
        </Field>
      </div>

      <Field id="athlete-club" label={t('athletes.club')}>
        <Input id="athlete-club" value={draft.club ?? ''} onChange={(e) => set('club', e.target.value || null)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="athlete-emergency-name" label={t('athletesPage.emergencyName')}>
          <Input id="athlete-emergency-name" value={draft.emergencyContactName ?? ''} onChange={(e) => set('emergencyContactName', e.target.value || null)} />
        </Field>
        <PhoneField
          id="athlete-emergency-phone"
          label={t('athletesPage.emergencyPhone')}
          callingCode={draft.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE}
          number={draft.emergencyContactPhoneNumber ?? ''}
          onChange={(callingCode, number) =>
            setDraft((d) => ({
              ...d,
              emergencyContactPhoneCountryCode: callingCode || null,
              emergencyContactPhoneNumber: number || null,
            }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="athlete-blood" label={t('athletesPage.bloodType')}>
          <Input id="athlete-blood" value={draft.bloodType ?? ''} onChange={(e) => set('bloodType', e.target.value || null)} />
        </Field>
        <Field id="athlete-allergies" label={t('athletesPage.allergies')}>
          <Textarea id="athlete-allergies" value={draft.allergies ?? ''} onChange={(e) => set('allergies', e.target.value || null)} />
        </Field>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-sm font-medium">{t('athletesPage.linkedAccounts')}</h3>

        {accounts.isPending && <Loading />}
        {accounts.isError && <ErrorNotice error={accounts.error} />}
        {accounts.data && accounts.data.length === 0 && <InfoNotice>{t('athletesPage.noLinkedAccounts')}</InfoNotice>}

        {accounts.data?.map((account) => (
          <div key={account.accountId} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
            <span>
              {account.provider} · {account.email ?? '—'}
            </span>
            {canUnlink && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => unlink.mutate(account.accountId)} isLoading={unlink.isPending}>
                {t('athletesPage.unlink')}
              </Button>
            )}
          </div>
        ))}
        {unlink.isError && <ErrorNotice error={unlink.error} />}
      </div>
    </FormDialog>
  )
}
