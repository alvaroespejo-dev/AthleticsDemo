import { Suspense } from 'react'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { CampaignsPage } from '@/features/marketing/campaigns/CampaignsPage'

/** Campaigns are administrator-only, as in the previous panel. */
export default function Page() {
  return (
    <ProtectedRoute roles={['Admin']}>
      {/* useSearchParams needs a Suspense boundary under static export. */}
      <Suspense>
        <CampaignsPage />
      </Suspense>
    </ProtectedRoute>
  )
}
