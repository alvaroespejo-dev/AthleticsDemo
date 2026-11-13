'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { CalendarDays, Footprints, House, Save, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { athletePortal } from '@/api/endpoints'
import type { AthleteDetail, SaveAthleteProfile } from '@/api/types'
import { PhoneField } from '@/components/ui/PhoneField'
import { AccordionItem } from '@/components/ui/AccordionItem'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui/primitives'
import { ErrorNotice } from '@/components/ui/states'
import { currentBrand, returnUrl } from '@/lib/brand'
import { countryDisplayName, DEFAULT_CALLING_CODE, OTHER_NATIONALITY } from '@/lib/countries'
import { withNullsForEmpty } from '@/lib/forms'
import { formatDate } from '@/lib/format'

type Panel = 'personal' | 'emergency' | 'clinical' | 'communications'

/** The body the PUT expects is the same as the sign-up, not the read model. */
function toSaveBody(athlete: AthleteDetail): SaveAthleteProfile {
  return {
    documentType: athlete.documentType,
    documentNumber: athlete.documentNumber,
    nationality: athlete.nationality,
    firstNames: athlete.firstNames,
    lastNames: athlete.lastNames,
    sex: athlete.sex,
    birthDate: athlete.birthDate,
    phoneCountryCode: athlete.phoneCountryCode,
    phoneNumber: athlete.phoneNumber,
    city: athlete.city,
    club: athlete.club,
    emergencyContactName: athlete.emergencyContactName,
    emergencyContactPhoneCountryCode: athlete.emergencyContactPhoneCountryCode,
    emergencyContactPhoneNumber: athlete.emergencyContactPhoneNumber,
    bloodType: athlete.bloodType,
    allergies: athlete.allergies,
    acceptsMarketing: athlete.marketingOptIn,
  }
}

/**
 * The signed-in athlete's own account. Personal, emergency, clinical and communication data open in
 * panels, one at a time, and are edited in place. Document, document type, nationality and phone identify
 * the athlete and were verified when the account was linked, so they are read-only here: fixing them is a
 * case for the organizer.
 */
export function MyAccount({ profile }: { profile: AthleteDetail }) {
  const { t, i18n } = useTranslation()
  const brand = currentBrand()
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AthleteDetail | null>(null)
  // One panel open at a time, like an accordion without multi. The field values live in `draft`, not here,
  // so closing a panel while editing does not lose what was changed in another.
  const [openPanel, setOpenPanel] = useState<Panel | null>(null)

  const toggle = (panel: Panel) => setOpenPanel((current) => (current === panel ? null : panel))
  const athlete = draft ?? profile
  const kilometers = athlete.participations.reduce((total, p) => total + p.distanceMeters, 0) / 1000
  const change = <K extends keyof AthleteDetail>(key: K, value: AthleteDetail[K]) => setDraft({ ...athlete, [key]: value })

  const save = useMutation({
    mutationFn: async () => athletePortal.updateProfile(withNullsForEmpty(toSaveBody(athlete)), await getAccessTokenSilently()),
    onSuccess: () => {
      setEditing(false)
      setDraft(null)
      void queryClient.invalidateQueries({ queryKey: ['my-account'] })
    },
  })

  const locale = i18n.language

  return (
    <div className="min-h-screen bg-muted/40 py-6">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <img src={brand.logo} alt={brand.name} className="h-14 w-14 shrink-0 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold">{t('portal.profile')}</h1>
              <p className="text-sm text-muted-foreground">{t('portal.profileDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <a href={returnUrl(brand)}>
              <Button variant="outline" size="sm">
                <House size={15} />
                {t('portal.back', { brand: brand.shortName })}
              </Button>
            </a>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric icon={UserRound} value={`${athlete.firstNames} ${athlete.lastNames}`} label={t('portal.athlete')} />
          <Metric icon={CalendarDays} value={String(athlete.participations.length)} label={t('portal.participatedEvents')} />
          <Metric icon={Footprints} value={`${kilometers.toFixed(1)} km`} label={t('portal.totalKilometers')} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{t('portal.myData')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('portal.personalData')}, {t('portal.emergency').toLowerCase()} {t('athletePortal.and')}{' '}
              {t('portal.clinical').toLowerCase()}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing && (
              <Button disabled={save.isPending} onClick={() => save.mutate()}>
                <Save size={15} />
                {save.isPending ? t('common.saving') : t('athletePortal.saveChanges')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(!editing)
                setDraft(null)
              }}
            >
              {editing ? t('common.cancel') : t('athletePortal.edit')}
            </Button>
          </div>
        </div>
        {save.isError && <ErrorNotice error={save.error} />}

        <div className="space-y-3">
          <AccordionItem title={t('portal.personalData')} open={openPanel === 'personal'} onToggle={() => toggle('personal')}>
            {/* Same fields and order as "Your details" in the registration form. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldView label={t('profile.document')} value={athlete.documentNumber} />
              <FieldView label={t('operation.documentType')} value={t(`publicPage.documentTypes.${athlete.documentType}`)} />
              <FieldView
                label={t('operation.nationality')}
                value={
                  athlete.nationality
                    ? athlete.nationality === OTHER_NATIONALITY
                      ? t('profile.otherCountry')
                      : countryDisplayName(athlete.nationality, locale)
                    : ''
                }
              />
              <FieldView label={t('profile.phone')} value={`+${athlete.phoneCountryCode} ${athlete.phoneNumber}`} />
              <FieldView
                label={t('operation.firstNames')}
                value={athlete.firstNames}
                active={editing}
                onChange={(v) => change('firstNames', v)}
              />
              <FieldView
                label={t('operation.lastNames')}
                value={athlete.lastNames}
                active={editing}
                onChange={(v) => change('lastNames', v)}
              />
              <SexView value={athlete.sex} active={editing} onChange={(v) => change('sex', v)} />
              <FieldView
                label={t('profile.birthDate')}
                type="date"
                value={athlete.birthDate}
                active={editing}
                help={t('profile.birthDateHelp')}
                onChange={(v) => change('birthDate', v)}
              />
              <FieldView label={t('operation.email')} value={athlete.email ?? ''} help={t('profile.emailHelp')} />
              <FieldView label={t('profile.cityOptional')} value={athlete.city ?? ''} active={editing} onChange={(v) => change('city', v)} />
              <FieldView label={t('profile.clubOptional')} value={athlete.club ?? ''} active={editing} onChange={(v) => change('club', v)} />
            </div>
          </AccordionItem>

          <AccordionItem title={t('portal.emergency')} open={openPanel === 'emergency'} onToggle={() => toggle('emergency')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldView
                label={t('profile.emergencyNameOptional')}
                value={athlete.emergencyContactName ?? ''}
                active={editing}
                onChange={(v) => change('emergencyContactName', v)}
              />
              {editing ? (
                <PhoneField
                  id="my-account-emergency-phone"
                  label={t('profile.emergencyPhoneOptional')}
                  callingCode={athlete.emergencyContactPhoneCountryCode ?? DEFAULT_CALLING_CODE}
                  number={athlete.emergencyContactPhoneNumber ?? ''}
                  onChange={(callingCode, number) =>
                    setDraft({
                      ...athlete,
                      emergencyContactPhoneCountryCode: callingCode,
                      emergencyContactPhoneNumber: number,
                    })
                  }
                />
              ) : (
                <FieldView
                  label={t('profile.emergencyPhoneOptional')}
                  value={
                    athlete.emergencyContactPhoneNumber
                      ? `+${athlete.emergencyContactPhoneCountryCode} ${athlete.emergencyContactPhoneNumber}`
                      : ''
                  }
                />
              )}
            </div>
          </AccordionItem>

          <AccordionItem title={t('portal.clinical')} open={openPanel === 'clinical'} onToggle={() => toggle('clinical')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldView
                label={t('profile.bloodTypeOptional')}
                value={athlete.bloodType ?? ''}
                active={editing}
                onChange={(v) => change('bloodType', v)}
              />
              <FieldView
                label={t('profile.medicalOptional')}
                value={athlete.allergies ?? ''}
                active={editing}
                multiline
                className="sm:col-span-2"
                onChange={(v) => change('allergies', v)}
              />
            </div>
          </AccordionItem>

          <AccordionItem
            title={t('portal.communications')}
            open={openPanel === 'communications'}
            onToggle={() => toggle('communications')}
          >
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input"
                checked={athlete.marketingOptIn}
                disabled={!editing}
                onChange={(e) => change('marketingOptIn', e.target.checked)}
              />
              <span>
                {t('athletePortal.marketingLabel')}
                <span className="block text-xs text-muted-foreground">{t('athletePortal.marketingHelp')}</span>
              </span>
            </label>
          </AccordionItem>
        </div>

        {/* Outside the accordion: unlike personal data, the event history is not edited, so there is no reason
            to hide it from the athlete behind a click. */}
        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">{t('portal.myEvents')}</h2>
          </div>
          {athlete.participations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">{t('athletePortal.noEvents')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-5 py-3 text-left">{t('moneySport.event')}</th>
                    <th className="px-5 py-3 text-left">{t('moneySport.date')}</th>
                    <th className="px-5 py-3 text-left">{t('moneySport.modality')}</th>
                    <th className="px-5 py-3 text-right">{t('moneySport.distance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {athlete.participations.map((p) => (
                    <tr key={p.registrationId} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">{p.eventName}</td>
                      <td className="px-5 py-3">{formatDate(p.eventDate, locale)}</td>
                      <td className="px-5 py-3">{p.modality}</td>
                      <td className="px-5 py-3 text-right">{(p.distanceMeters / 1000).toFixed(1)} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, value, label }: { icon: typeof UserRound; value: string; label: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

/** One field of the account: a text when read-only, a control when the account is being edited. */
function FieldView({
  label,
  value,
  active = false,
  type = 'text',
  multiline = false,
  help,
  className,
  onChange,
}: {
  label: string
  value: string
  active?: boolean
  type?: 'text' | 'date'
  multiline?: boolean
  help?: string
  className?: string
  onChange?: (value: string) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <div className={className}>
      <Label>{label}</Label>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
      {active ? (
        multiline ? (
          <Textarea className="mt-1.5" value={value} onChange={(e) => onChange?.(e.target.value)} />
        ) : (
          <Input
            className="mt-1.5"
            type={type}
            lang={type === 'date' ? 'en-US' : undefined}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )
      ) : (
        <p className="mt-1.5 text-sm">
          {type === 'date' && value
            ? formatDate(value, i18n.language)
            : value || t('athletePortal.notRegistered')}
        </p>
      )}
    </div>
  )
}

function SexView({ value, active, onChange }: { value: AthleteDetail['sex']; active: boolean; onChange: (value: AthleteDetail['sex']) => void }) {
  const { t } = useTranslation()

  return (
    <div>
      <Label>{t('operation.gender')}</Label>
      {active ? (
        <Select className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value as AthleteDetail['sex'])}>
          <option value="Female">{t('profile.genderFemale')}</option>
          <option value="Male">{t('profile.genderMale')}</option>
        </Select>
      ) : (
        <p className="mt-1.5 text-sm">{value === 'Female' ? t('profile.genderFemale') : t('profile.genderMale')}</p>
      )}
    </div>
  )
}
