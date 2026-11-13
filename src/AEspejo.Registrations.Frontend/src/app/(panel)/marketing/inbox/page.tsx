import { Suspense } from 'react'
import { InboxPage } from '@/features/inbox/InboxPage'

export default function Page() {
  // useSearchParams needs a Suspense boundary under static export.
  return (
    <Suspense>
      <InboxPage />
    </Suspense>
  )
}
