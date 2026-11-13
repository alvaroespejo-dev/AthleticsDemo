import type { ReactNode } from 'react'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppLayout } from '@/layout/AppLayout'

/** Every panel screen requires a signed-in user and gets the shared shell (sidebar + header). */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}
