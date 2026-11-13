'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** The root has no screen of its own: it goes to the events list (the guard then asks for sign-in if needed). */
export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/events/')
  }, [router])

  return null
}
