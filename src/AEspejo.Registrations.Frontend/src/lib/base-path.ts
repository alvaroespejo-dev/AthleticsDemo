/**
 * Path prefix the panel is served under. Empty on localhost and on its own domain; `/panel` when the
 * panel is published next to the landing page in one Azure Static Web App (see the build script in
 * deploy/static-site). It is set at build time with NEXT_PUBLIC_BASE_PATH, the same value that
 * next.config.ts passes to Next's `basePath`.
 *
 * Next.js already prefixes `<Link>` and `router` navigation with the base path. Plain `href`, `src`
 * and `window.location` strings are not prefixed, so they must go through withBasePath().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Prefixes an absolute in-app path (starting with `/`) with the base path. */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`
}
