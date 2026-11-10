'use client'

import { House, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Button, Card } from '@/components/ui/primitives'
import { ErrorNotice } from '@/components/ui/states'
import { type Brand, returnUrl } from '@/lib/brand'
import { withBasePath } from '@/lib/base-path'

interface Props {
  brand: Brand
  onLogin: () => void
  error?: string
}

/** Athlete login screen. "Back" goes to the brand's landing, which is the only page this domain does not serve. */
export function AthleteLogin({ brand, onLogin, error }: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center justify-between">
          <a href={returnUrl(brand)}>
            <Button variant="outline" size="sm">
              <House size={16} />
              {t('portal.back', { brand: brand.shortName })}
            </Button>
          </a>
          <LanguageSelector />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <img src={brand.loginLogo} alt={brand.name} className="h-20 w-20 object-contain" />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">{brand.portalTitle}</h1>
            <p className="text-sm text-muted-foreground">{t('forms.portal')}</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{t('forms.loginHelp')}</p>

        {error && <ErrorNotice error={new Error(error)} />}

        <Button className="w-full" onClick={onLogin}>
          <LogIn size={16} />
          {t('auth.login')}
        </Button>

        <a
          className="mt-4 block text-center text-sm text-muted-foreground underline"
          href={withBasePath(`/login?marca=${brand.code}`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('forms.admin')}
        </a>
      </Card>
    </div>
  )
}
