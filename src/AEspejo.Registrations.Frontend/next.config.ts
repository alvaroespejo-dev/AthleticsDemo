import type { NextConfig } from 'next'

/**
 * The production build is a static export (`out/`), served by the Azure Static Web App next to the
 * brand landing page. Static export ignores `rewrites`, so the API proxy below only applies to
 * `next dev`; in production the frontend calls the API through `NEXT_PUBLIC_API_URL`.
 */
// Empty by default. The combined Static Web App publishes the panel under /panel with NEXT_PUBLIC_BASE_PATH=/panel.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  // `next dev` renders dynamic routes on demand, so /register/{slug} and /events/{id} work there without the
  // placeholder rewrite the static export needs.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  reactStrictMode: true,
  async rewrites() {
    // Static export ignores rewrites, so the proxy is only useful under `next dev`.
    if (process.env.NODE_ENV === 'production') return []

    return [
      {
        source: '/api/:path*',
        destination: `${process.env.DEV_API_ORIGIN ?? 'http://localhost:8080'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

