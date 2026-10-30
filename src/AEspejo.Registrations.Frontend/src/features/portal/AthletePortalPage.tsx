'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { athletePortal } from '@/api/endpoints'
import { useAthleteSignOut } from '@/auth/useAthleteSignOut'
import { ErrorNotice, Loading } from '@/components/ui/states'
import { currentBrand } from '@/lib/brand'
import { AthleteLogin } from './AthleteLogin'
import { MyAccount } from './MyAccount'
import { ProfileForm } from './ProfileForm'

interface Props {
  /** The `/portal/login` address: the login screen only, and it leaves once there is a session. */
  loginOnly?: boolean
}

/**
 * Entry of the athlete portal: the login when there is no session, the sign-up or claim form when the
 * identity has no athlete attached yet, and the account otherwise. Auth0 always returns to `/portal`,
 * the only callback registered.
 */
export function AthletePortalPage({ loginOnly = false }: Props) {
  const router = useRouter()
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0()
  const signOut = useAthleteSignOut()

  const account = useQuery({
    queryKey: ['my-account'],
    queryFn: async () => athletePortal.myAccount(await getAccessTokenSilently()),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (loginOnly && isAuthenticated) router.replace('/portal')
  }, [loginOnly, isAuthenticated, router])

  if (isLoading || (loginOnly && isAuthenticated)) return <Loading />

  if (!isAuthenticated) {
    return (
      <AthleteLogin
        brand={currentBrand()}
        onLogin={() => loginWithRedirect({ appState: { returnTo: '/portal' } })}
      />
    )
  }

  if (account.isPending) return <Loading />
  if (account.isError) return <ErrorNotice error={account.error} />

  if (!account.data.profile) return <ProfileForm account={account.data} onSignOut={signOut} />

  return <MyAccount profile={account.data.profile} />
}
