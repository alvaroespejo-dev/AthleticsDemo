import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { SettingsPage } from '@/features/settings/SettingsPage'

/** Settings are administrator-only: the API enforces it too, this only avoids showing a screen that would answer 403. */
export default function Page() {
  return (
    <ProtectedRoute roles={['Admin']}>
      <SettingsPage />
    </ProtectedRoute>
  )
}
