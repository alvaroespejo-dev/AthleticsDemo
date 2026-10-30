import { PublicRegistrationPage } from '@/features/public/PublicRegistrationPage'

/**
 * Static export needs at least one value for a dynamic segment. The placeholder is never served as a real
 * event: the hosting rewrites `/register/*` to this page, and the page reads the real slug from the URL.
 */
export function generateStaticParams() {
  return [{ slug: '_' }]
}

export default function Page() {
  return <PublicRegistrationPage />
}
