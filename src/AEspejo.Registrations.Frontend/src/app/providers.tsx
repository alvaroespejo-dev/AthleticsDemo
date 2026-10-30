'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthContext'
import { Auth0ProviderWithNavigation } from '@/auth/Auth0ProviderWithNavigation'
import { ApiError } from '@/api/client'
import {
  applyBrandColor,
  applyBrandFavicon,
  currentBrand,
  recordBrandContext,
  tabTitle,
} from '@/lib/brand'
import { applySavedLanguage } from '@/lib/i18n'

/**
 * Client-side providers for the whole app. Everything that needs `window`, `localStorage` or
 * `sessionStorage` is started from the effect below, never during render, so the static export
 * can pre-render the shell without touching browser APIs.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A 401 or a 404 does not improve by retrying; it only delays the message to the user.
            retry: (attempts, error) =>
              error instanceof ApiError && error.status < 500 ? false : attempts < 2,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  useEffect(() => {
    // Saves the brand and the origin the landing page sent (if any) and strips those parameters
    // from the URL. The favicon and colour are fixed per brand, so they are applied once here.
    recordBrandContext()
    const brand = currentBrand()
    applyBrandFavicon(brand)
    applyBrandColor(brand)
    applySavedLanguage()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0ProviderWithNavigation>
        <AuthProvider>
          <TabTitle />
          {children}
        </AuthProvider>
      </Auth0ProviderWithNavigation>
    </QueryClientProvider>
  )
}

/** The <title> depends on the route (portal and panel show different names), so it is set on each navigation. */
function TabTitle() {
  const pathname = usePathname()

  useEffect(() => {
    document.title = tabTitle(currentBrand(), pathname)
  }, [pathname])

  return null
}
