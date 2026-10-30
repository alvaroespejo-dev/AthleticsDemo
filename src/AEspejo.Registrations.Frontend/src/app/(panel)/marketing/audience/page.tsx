import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AudiencePage } from '@/features/marketing/audience/AudiencePage'

/** The audience builder is administrator-only, as in the previous panel. */
export default function Page() {
  return (
    <ProtectedRoute roles={['Admin']}>
      <AudiencePage />
    </ProtectedRoute>
  )
}
