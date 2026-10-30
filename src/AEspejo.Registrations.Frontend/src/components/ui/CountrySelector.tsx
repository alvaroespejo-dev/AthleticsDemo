'use client'

import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COUNTRIES, OTHER_NATIONALITY, countryDisplayName } from '@/lib/countries'
import { Select } from './primitives'

/**
 * Nationality combo over the country catalogue, with "Other" at the end for anyone who cannot find
 * theirs. Unlike PhoneField, no valid calling code is needed here, so the catalogue does not have to
 * cover every country in the world.
 */
export function CountrySelector(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { i18n, t } = useTranslation()

  return (
    <Select {...props}>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {countryDisplayName(c.code, i18n.language)}
        </option>
      ))}
      <option value={OTHER_NATIONALITY}>{t('profile.otherCountry')}</option>
    </Select>
  )
}
