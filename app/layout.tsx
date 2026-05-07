import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jonathan AI',
  description: 'A spiritual advisor grounded in the recorded teachings of Jonathan (adampants).',
  themeColor: '#0a0a0a',
  openGraph: {
    title: 'Jonathan AI',
    description: 'A spiritual advisor grounded in the recorded teachings of Jonathan (adampants).',
    type: 'website',
    siteName: 'Jonathan AI',
  },
  twitter: {
    card: 'summary',
    title: 'Jonathan AI',
    description: 'A spiritual advisor grounded in the recorded teachings of Jonathan (adampants).',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
