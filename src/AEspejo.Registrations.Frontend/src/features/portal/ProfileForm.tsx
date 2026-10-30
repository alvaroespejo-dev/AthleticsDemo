'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { LogOut, Save, Search, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { athletePortal, publicSite } from '@/api/endpoints'
import type { AthleteAccount, DocumentType, FoundAthlete, SaveAthleteProfile, Sex } from '@/api/types'
import { CountrySelector } from '@/components/ui/CountrySelector'
import { Dialog } from '@/components/ui/dialog'
import { PhoneField } from '@/components/ui/PhoneField'
import { Button, Card, Field, Input, Select, Step, Textarea } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice } from '@/components/ui/states'
import { currentBrand } from '@/lib/brand'
import { countryDisplayName, DEFAULT_CALLING_CODE, DEFAULT_COUNTRY, OTHER_NATIONALITY } from '@/lib/countries'
import { DOCUMENT_TYPES } from '@/lib/documents'
import { withNullsForEmpty } from '@/lib/forms'

type Mode = 'create' | 'claim'

/** Starting values of a new sign-up. The sex is pre-selected, as the previous portal did. */
function emptyProfile(account: AthleteAccount): SaveAthleteProfile {
  return {
    documentType: 'Ci',
    documentNumber: '',
    nationality: DEFAULT_COUNTRY,
    firstNames: account.suggestedFirstNames ?? '',
    lastNames: account.suggestedLastNames ?? '',
    sex: 'Female',
    birthDate: '',
    phoneCountryCode: DEFAULT_CALLING_CODE,
    phoneNumber: '',
    city: '',
    club: '',
    emergencyContactName: '',
    emergencyContactPhoneCountryCode: DEFAULT_CALLING_CODE,
    emergencyContactPhoneNumber: '',
    bloodType: '',
    allergies: '',
    acceptsMarketing: true,
  }
}

/**
 * Sign-up form, shown right after login when Auth0 returns an identity with no athlete attached. Same
 * fields, order and components as the public registration's steps (Your details / Emergency contact /
 * Clinical data): it is the same information and it does not need to be asked two ways.
 *
 * "Did you register before?" is answered with the same document search the public registration uses,
 * not with a previous screen: picking a result pre-fills the form and the final button then links the
 * account to that athlete instead of creating a new one. Document, type, nationality and phone are read-only
 * because they prove it is the same person; the rest stays editable so the athlete can complete or correct
 * it, and those changes are saved right after the link is confirmed.
 *
 * The e-mail is not asked for: Auth0 provides it and it is not editable here.
 */
export function ProfileForm({ account, onSignOut }: { account: AthleteAccount; onSignOut: () => void }) {
  const { t, i18n } = useTranslation()
  const brand = currentBrand()
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()
  const email = account.email ?? ''

  // Starts from what Auth0 sent. As initial state and not as an effect: these values can be corrected by the
  // athlete, so once the form is mounted it sends what they typed.
  const [form, setForm] = useState<SaveAthleteProfile>(() => emptyProfile(account))
  const [mode, setMode] = useState<Mode>('create')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<FoundAthlete[] | null>(null)
  // Only these four identify the athlete found: they are read-only in "claim" mode because they are what
  // the link verifies. The rest stays editable so missing data can be completed.
  const identityLocked = mode === 'claim'

  const set = <K extends keyof SaveAthleteProfile>(key: K, value: SaveAthleteProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const search = useMutation({
    mutationFn: () => publicSite.findAthletes(form.documentNumber),
    onSuccess: (results) => {
      setSearchResults(results)
      setSearchOpen(true)
    },
  })

  const useFound = (athlete: FoundAthlete) => {
    setForm((f) => ({
      ...f,
      documentType: athlete.documentType,
      documentNumber: athlete.documentNumber,
      nationality: athlete.nationality ?? DEFAULT_COUNTRY,
      firstNames: athlete.firstNames,
      lastNames: athlete.lastNames,
      sex: athlete.sex,
      birthDate: athlete.birthDate,
      phoneCountryCode: athlete.phoneCountryCode,
      phoneNumber: athlete.phoneNumber,
      city: athlete.city ?? '',
      club: athlete.club ?? '',
      emergencyContactName: athlete.emergencyContactName ?? '',
      emergencyContactPhoneCountryCode: athlete.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE,
      emergencyContactPhoneNumber: athlete.emergencyContactPhoneNumber ?? '',
      bloodType: athlete.bloodType ?? '',
      allergies: athlete.allergies ?? '',
    }))
    setMode('claim')
    setSearchOpen(false)
  }

  // The typed document may belong to someone else: it goes back to a blank form, not just unlocking the
  // fields, so the other person's data is not left mixed in.
  const useOtherDocument = () => {
    setMode('create')
    setForm(emptyProfile(account))
  }

  const create = useMutation({
    mutationFn: async () => athletePortal.createProfile(withNullsForEmpty(form), await getAccessTokenSilently()),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-account'] }),
  })

  // Links by document + phone and, as soon as the account is linked, saves the rest of the fields the athlete
  // completed or corrected in the same form.
  const claim = useMutation({
    mutationFn: async () => {
      const token = await getAccessTokenSilently()
      await athletePortal.claim(
        {
          documentType: form.documentType,
          documentNumber: form.documentNumber,
          nationality: form.nationality,
          phoneCountryCode: form.phoneCountryCode,
          phoneNumber: form.phoneNumber,
        },
        token,
      )
      return athletePortal.updateProfile(withNullsForEmpty(form), token)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-account'] }),
  })

  const submit = mode === 'claim' ? claim : create

  return (
    <div className="min-h-screen bg-muted/40 py-6">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <Card className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <img src={brand.logo} alt={brand.name} className="h-14 w-14 shrink-0 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold">{t('forms.completeProfile')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('forms.firstLogin')}
                {email && ` ${email}`}. {t('forms.linkHint')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut size={15} />
            {t('portal.signOut')}
          </Button>
        </Card>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate()
          }}
        >
          <Card className="p-5">
            <Step number={1} title={t('portal.personalData')} />

            {mode === 'claim' && (
              <div className="mb-4">
                <InfoNotice>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{t('forms.foundRecord')}</span>
                    <Button type="button" variant="outline" size="sm" onClick={useOtherDocument}>
                      {t('forms.otherDocument')}
                    </Button>
                  </div>
                </InfoNotice>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="document" label={t('forms.identity')} hint={t('forms.searchHelp')}>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="document"
                      required
                      disabled={identityLocked}
                      className="min-w-32 flex-1"
                      value={form.documentNumber}
                      onChange={(e) => set('documentNumber', e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      title={t('forms.searchRegistered')}
                      disabled={!form.documentNumber.trim()}
                      isLoading={search.isPending}
                      onClick={() => search.mutate()}
                    >
                      <Search size={14} />
                    </Button>

                    <Select
                      aria-label={t('operation.documentType')}
                      className="w-40 shrink-0"
                      disabled={identityLocked}
                      value={form.documentType}
                      onChange={(e) => set('documentType', e.target.value as DocumentType)}
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`publicPage.documentTypes.${type}`)}
                        </option>
                      ))}
                    </Select>

                    <CountrySelector
                      aria-label={t('operation.nationality')}
                      required
                      disabled={identityLocked}
                      className="w-40 shrink-0"
                      value={form.nationality ?? DEFAULT_COUNTRY}
                      onChange={(e) => set('nationality', e.target.value)}
                    />
                  </div>
                </Field>
              </div>

              <PhoneField
                id="phone"
                label={t('operation.phone')}
                callingCode={form.phoneCountryCode}
                number={form.phoneNumber}
                disabled={identityLocked}
                onChange={(callingCode, number) => setForm((f) => ({ ...f, phoneCountryCode: callingCode, phoneNumber: number }))}
                required
              />

              <Field id="first-names" label={t('operation.firstNames')}>
                <Input id="first-names" required value={form.firstNames} onChange={(e) => set('firstNames', e.target.value)} />
              </Field>

              <Field id="last-names" label={t('operation.lastNames')}>
                <Input id="last-names" required value={form.lastNames} onChange={(e) => set('lastNames', e.target.value)} />
              </Field>

              <Field id="sex" label={t('operation.gender')}>
                <Select id="sex" value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
                  <option value="Female">{t('profile.genderFemale')}</option>
                  <option value="Male">{t('profile.genderMale')}</option>
                </Select>
              </Field>

              <Field id="birth-date" label={t('operation.birthDate')} hint={t('profile.birthDateHelp')}>
                <Input
                  id="birth-date"
                  type="date"
                  lang="en-US"
                  required
                  value={form.birthDate}
                  onChange={(e) => set('birthDate', e.target.value)}
                />
              </Field>

              <Field id="email" label={t('operation.email')} hint={t('profile.emailHelp')}>
                <Input id="email" type="email" value={email} readOnly disabled className="disabled:cursor-not-allowed" />
              </Field>

              <Field id="city" label={t('profile.cityOptional')}>
                <Input id="city" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
              </Field>

              <Field id="club" label={t('profile.clubOptional')}>
                <Input id="club" value={form.club ?? ''} onChange={(e) => set('club', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <Step number={2} title={t('portal.emergency')} subtitle={t('forms.emergencyHelp')} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="emergency-name" label={t('profile.emergencyNameOptional')}>
                <Input
                  id="emergency-name"
                  value={form.emergencyContactName ?? ''}
                  onChange={(e) => set('emergencyContactName', e.target.value)}
                />
              </Field>

              <PhoneField
                id="emergency-phone"
                label={t('profile.emergencyPhoneOptional')}
                callingCode={form.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE}
                number={form.emergencyContactPhoneNumber ?? ''}
                onChange={(callingCode, number) =>
                  setForm((f) => ({ ...f, emergencyContactPhoneCountryCode: callingCode, emergencyContactPhoneNumber: number }))
                }
              />
            </div>
          </Card>

          <Card className="p-5">
            <Step number={3} title={t('portal.clinical')} subtitle={t('forms.medicalHelp')} />

            <div className="max-w-xs">
              <Field id="blood-type" label={t('profile.bloodTypeOptional')}>
                <Input id="blood-type" placeholder="O+" value={form.bloodType ?? ''} onChange={(e) => set('bloodType', e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field id="allergies" label={t('profile.medicalOptional')}>
                <Textarea id="allergies" value={form.allergies ?? ''} onChange={(e) => set('allergies', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input"
                checked={form.acceptsMarketing}
                onChange={(e) => set('acceptsMarketing', e.target.checked)}
              />
              <span>
                {t('forms.marketing')}
                <span className="block text-xs text-muted-foreground">{t('forms.marketingOptional')}</span>
              </span>
            </label>
          </Card>

          {submit.isError && <ErrorNotice error={submit.error} />}

          <div className="flex justify-end">
            <Button type="submit" isLoading={submit.isPending}>
              {mode === 'claim' ? <UserCheck size={15} /> : <Save size={15} />}
              {mode === 'claim' ? t('forms.linkAccount') : t('forms.createProfile')}
            </Button>
          </div>
        </form>

        <Dialog open={searchOpen} title={t('athletePortal.found')} onClose={() => setSearchOpen(false)}>
          {!searchResults || searchResults.length === 0 ? (
            <InfoNotice>{t('forms.notFound')}</InfoNotice>
          ) : (
            <div className="space-y-3">
              {searchResults.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">
                      {athlete.firstNames} {athlete.lastNames}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(`publicPage.documentTypes.${athlete.documentType}`)} {athlete.documentNumber} ·{' '}
                      {athlete.nationality
                        ? athlete.nationality === OTHER_NATIONALITY
                          ? t('profile.otherCountry')
                          : countryDisplayName(athlete.nationality, i18n.language)
                        : t('forms.noNationality')}{' '}
                      · +{athlete.phoneCountryCode} {athlete.phoneNumber}
                    </div>
                  </div>
                  <Button type="button" size="sm" onClick={() => useFound(athlete)}>
                    {t('forms.useData')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      </div>
    </div>
  )
}
