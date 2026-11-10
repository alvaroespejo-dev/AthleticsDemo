'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { ErrorNotice, Loading } from '@/components/ui/states'
import { Button, Card, Field, Input } from '@/components/ui/primitives'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { currentBrand } from '@/lib/brand'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Demo mode is on by default. The form starts with the demo account from the build environment, so the
  // person opening the demo does not have to type it. Set NEXT_PUBLIC_DEMO_MODE=false at build time for a
  // production build: the values are then dropped, and they never reach the bundle. These variables are
  // inlined into the client bundle at build time, so the demo account must have limited permissions.
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'
  const demo = demoMode
    ? { loginName: process.env.NEXT_PUBLIC_DEMO_LOGIN_NAME ?? '', password: process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? '' }
    : { loginName: '', password: '' }

  const [loginName, setLoginName] = useState(demo.loginName)
  const [password, setPassword] = useState(demo.password)
  const [error, setError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  // No event here to take the brand from: use the one the landing page sent, or the one for the domain.
  const brand = currentBrand()

  // Redirect after the render, not during it: calling router.replace while rendering breaks the redirect.
  useEffect(() => {
    if (user) router.replace(searchParams.get('from') ?? '/events/')
  }, [user, router, searchParams])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading text={t('auth.checkingSession')} />
      </div>
    )
  }

  if (user) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn(loginName, password)
      router.replace('/events/')
    } catch (caught) {
      setError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation */}
          <img src={brand.loginLogo} alt={brand.name} className="h-20 w-20 object-contain" />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">{brand.adminTitle}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.adminPanel')}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field id="loginName" label={t('auth.user')}>
            <Input
              id="loginName"
              autoComplete="username"
              autoFocus
              required
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
            />
          </Field>

          <Field id="password" label={t('auth.password')}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error != null && <ErrorNotice error={error} />}

          <Button type="submit" className="w-full" isLoading={submitting}>
            {submitting ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
