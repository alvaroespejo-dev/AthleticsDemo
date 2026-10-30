import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'AEspejo Admin',
  description: 'Event registration administration panel.',
  icons: { icon: '/ae-favicon.svg' },
}

// The layout is server-rendered as static HTML. The language is set on the client by the i18n
// module, so the server output is always Spanish, the fallback language.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
