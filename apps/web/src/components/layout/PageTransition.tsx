'use client'

import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  // Simple fade-in animation on mount
  // The key is to let CSS handle the animation without JavaScript manipulation
  return (
    <div className="animate-pageLoad">
      {children}
    </div>
  )
}