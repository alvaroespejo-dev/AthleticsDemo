'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Auth0Provider, type AppState } from '@auth0/auth0-react'

/**
 * The only Allowed Callback URL registered in Auth0 is `/portal`, so any login (whether it comes from
 * "My account" or from a registration) always lands there first. When the login started on another
 * screen (`loginWithRedirect({ appState: { returnTo } })`), this completes the trip to the real
 * destination. It needs to sit inside the Next.js router so it can navigate.
 */
export function Auth0ProviderWithNavigation({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? ''}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? ''}
      // The token is kept in localStorage rather than memory: with Auth0's domain as a third party,
      // browsers that block cross-site cookies break the silent-authentication iframe, so reloading
      // /portal would lose the session.
      cacheLocation="localstorage"
      authorizationParams={{
        // Static export pre-renders this on the server, where there is no window yet.
        redirect_uri: typeof window === 'undefined' ? undefined : `${window.location.origin}/portal`,
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        // "openid" enables /userinfo, which the API uses to read the athlete's e-mail: the access token
        // of a custom audience does not include it (see CorreoAuth0 in the API).
        scope: 'openid profile email',
      }}
      onRedirectCallback={(appState?: AppState) => router.replace(appState?.returnTo ?? '/portal')}
    >
      {children}
    </Auth0Provider>
  )
}
