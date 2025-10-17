import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ColorSchemeScript } from '@mantine/core'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Agentic Template',
    template: '%s | Agentic Template',
  },
  description: 'A modern agentic template with Next.js, TypeScript, and gRPC',
  keywords: ['Next.js', 'TypeScript', 'gRPC', 'Tailwind CSS', 'Agentic'],
  authors: [
    {
      name: 'Agentic Template Team',
    },
  ],
  creator: 'Agentic Template',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    title: 'Agentic Template',
    description: 'A modern agentic template with Next.js, TypeScript, and gRPC',
    siteName: 'Agentic Template',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Template',
    description: 'A modern agentic template with Next.js, TypeScript, and gRPC',
    creator: '@agentic_template',
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