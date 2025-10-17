'use client'

import { Suspense } from 'react'
import { MantineProvider } from '@mantine/core'
import { LayoutWrapper } from '@/components/layout/LayoutWrapper'
import { theme } from '@/theme/theme'

// Import Mantine styles
import '@mantine/core/styles.css'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MantineProvider theme={theme}>
      <Suspense fallback={null}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </Suspense>
    </MantineProvider>
  )
}