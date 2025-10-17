import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ColorSchemeScript } from '@mantine/core'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Taylor Yves | Frictionless Consulting',
    template: '%s | Taylor Yves',
  },
  description: 'A smoother way to work is on its way.',
  keywords: ['Taylor-Yves', 'productivity', 'workflow', 'consulting', 'frictionless'],
  authors: [
    {
      name: 'Taylor-Yves Team',
    },
  ],
  creator: 'Taylor-Yves',
  metadataBase: new URL('http://localhost:3000'),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    title: 'Taylor Yves | Frictionless Consulting',
    description: 'A smoother way to work is on its way.',
    siteName: 'Taylor Yves',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taylor Yves | Frictionless Consulting',
    description: 'A smoother way to work is on its way.',
    creator: '@taylor_yves',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
    yandex: '',
  },
}

import ClientLayout from './client-layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}