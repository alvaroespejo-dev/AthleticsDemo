'use client'

import { useTranslation } from 'react-i18next'
import { Select } from './primitives'

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  return (
    <label className="flex items-center gap-2 text-sm" title={t('language')}>
      <span className="sr-only">{t('language')}</span>
      <Select value={i18n.language} onChange={(event) => i18n.changeLanguage(event.target.value)} className="w-32">
        <option value="es">{t('spanish')}</option>
        <option value="en">{t('english')}</option>
        <option value="pt">{t('portuguese')}</option>
      </Select>
    </label>
  )
}
