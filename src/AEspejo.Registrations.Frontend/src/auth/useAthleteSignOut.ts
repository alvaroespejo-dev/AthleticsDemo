'use client'

import { useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Signs the athlete out of the portal and of the Auth0 tenant, not only of the SPA cache: if only the
 * local state were cleared, the next "Sign in" would get back in without asking for credentials.
 */
export function useAthleteSignOut() {
  const { logout } = useAuth0()

  return useCallback(() => logout({ logoutParams: { returnTo: window.location.origin } }), [logout])
}
