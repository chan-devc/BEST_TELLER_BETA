import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BCEL Admin — Best Teller Award 2026',
  description: 'BCEL Best Teller Award 2026 Administration Dashboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
