import { Suspense } from 'react'
import { LoginPage } from '@/features/login/LoginPage'

export default function Page() {
  // useSearchParams needs a Suspense boundary under static export.
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
