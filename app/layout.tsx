import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jonathan AI',
  description: 'A spiritual advisor grounded in the recorded teachings of Jonathan (adampants).',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
