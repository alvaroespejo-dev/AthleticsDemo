import { Suspense } from 'react'
import { RegistrationsPage } from '@/features/registrations/RegistrationsPage'

export default function Page() {
  // useSearchParams needs a Suspense boundary under static export.
  return (
    <Suspense>
      <RegistrationsPage />
    </Suspense>
  )
}
