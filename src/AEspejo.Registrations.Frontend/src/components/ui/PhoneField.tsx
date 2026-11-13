'use client'

import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js'
import { useTranslation } from 'react-i18next'
import { COUNTRIES, DEFAULT_COUNTRY, countryDisplayName } from '@/lib/countries'
import { Field, Input, Select } from './primitives'

interface Props {
  id: string
  label: string
  hint?: string
  /** Calling code without the "+" (e.g. "591"), or empty. */
  callingCode: string
  /** National number, without the country prefix. */
  number: string
  onChange: (callingCode: string, number: string) => void
  required?: boolean
  autoFocus?: boolean
  disabled?: boolean
}

/**
 * Country selector (with its calling code) plus the national number. Fully controlled: it neither
 * derives nor keeps state from the calling code and number it receives, so nothing can drift out of
 * sync when the form updates them from outside (for example when an athlete found by document is
 * pre-filled). Bolivia is selected by default because it is the most frequent case.
 */
export function PhoneField({ id, label, hint, callingCode, number, onChange, required, autoFocus, disabled }: Props) {
  const { i18n, t } = useTranslation()
  // The select lists countries by ISO code, but what is stored and travels is the numeric calling
  // code: find the catalogue country that has that code to know which one to mark.
  const country = (COUNTRIES.find((c) => c.callingCode === callingCode)?.code ?? DEFAULT_COUNTRY) as CountryCode

  const valid = !number || isValidPhoneNumber(number, country)

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="flex gap-2">
        <Select
          aria-label={t('profile.country')}
          className="w-40 shrink-0"
          value={country}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value as CountryCode
            onChange(COUNTRIES.find((c) => c.code === next)?.callingCode ?? '', number)
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {countryDisplayName(c.code, i18n.language)} +{c.callingCode}
            </option>
          ))}
        </Select>

        <Input
          id={id}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode="tel"
          placeholder={`${t('forms.placeholderExample')} 70012345`}
          value={number}
          onChange={(e) => onChange(callingCode, e.target.value.replace(/\D/g, ''))}
          aria-invalid={!valid}
        />
      </div>

      {!valid && (
        <p className="text-xs text-destructive">
          {t('profile.invalidPhone')} {countryDisplayName(country, i18n.language)}.
        </p>
      )}
    </Field>
  )
}
