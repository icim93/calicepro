// app/layout.tsx
import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CalicePro — AIS Gestione Corsi',
  description: 'Piattaforma ufficiale per la gestione dei corsi sommelier AIS.',
  manifest: '/manifest.json',
  themeColor: '#09040A',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-dark text-cream font-sans antialiased min-h-screen">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#160C10',
              border: '1px solid rgba(201,162,74,0.14)',
              color: '#C8BEB0',
              borderRadius: '100px',
              fontSize: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
