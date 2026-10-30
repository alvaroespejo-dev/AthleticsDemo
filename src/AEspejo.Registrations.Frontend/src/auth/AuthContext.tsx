'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { tokenStore, ApiError } from '@/api/client'
import { auth } from '@/api/endpoints'
import type { UserRole } from '@/api/types'
import i18n from '@/lib/i18n'

interface SignedInUser {
  userId: number
  loginName: string
  name: string
  role: UserRole
  preferredLanguage: string
}

interface AuthContextValue {
  user: SignedInUser | null
  loading: boolean
  signIn: (loginName: string, password: string) => Promise<void>
  signOut: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SignedInUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On reload the token is still in storage but may have expired. It is validated against the API
  // instead of trusting what is saved.
  useEffect(() => {
    const token = tokenStore.read()

    if (!token) {
      setLoading(false)
      return
    }

    auth
      .me()
      .then((current) =>
        setUser({ ...current, preferredLanguage: current.preferredLanguage ?? 'en' }),
      )
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (loginName: string, password: string) => {
    const session = await auth.signIn(loginName, password)

    tokenStore.save(session.token)
    setUser({
      userId: session.userId,
      loginName: session.loginName,
      name: session.name,
      role: session.role,
      preferredLanguage: session.preferredLanguage,
    })
    void i18n.changeLanguage(session.preferredLanguage)
  }, [])

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // A 401 on any query means the token expired while working.
  useEffect(() => {
    function onRejection(event: PromiseRejectionEvent) {
      if (event.reason instanceof ApiError && event.reason.requiresSignIn) {
        signOut()
      }
    }

    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [signOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      hasRole: (...roles) => (user ? roles.includes(user.role) : false),
    }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) throw new Error('useAuth must be used inside AuthProvider.')

  return context
}
