'use client'

import { Suspense } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  )
}