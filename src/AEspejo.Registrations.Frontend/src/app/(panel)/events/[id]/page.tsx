import { EventDetailPage } from '@/features/events/EventDetailPage'

/**
 * Static export needs at least one concrete value for a dynamic segment. The placeholder is never
 * a real event: the Static Web App rewrites /events/{id} to this page, and the client reads the real
 * id from the URL.
 */
export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function Page() {
  return <EventDetailPage />
}
