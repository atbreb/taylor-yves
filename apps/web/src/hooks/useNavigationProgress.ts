'use client'

import { useEffect, useState, useRef, startTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Only show progress bar if navigation takes longer than this threshold
const SHOW_DELAY_MS = 150

export function useNavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [shouldShowProgress, setShouldShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  
  const showTimerRef = useRef<NodeJS.Timeout>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const completeTimerRef = useRef<NodeJS.Timeout>()
  const lastPathRef = useRef(pathname)

  useEffect(() => {
    // Check if path actually changed
    if (pathname === lastPathRef.current) {
      return
    }
    
    lastPathRef.current = pathname
    
    // Navigation started
    setIsNavigating(true)
    
    // Clear any existing timers
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)

    // Start a timer to show progress bar after delay
    // This prevents the progress bar from showing on instant navigations
    showTimerRef.current = setTimeout(() => {
      setShouldShowProgress(true)
      setProgress(20)

      // Start incrementing progress slowly
      let currentProgress = 20
      progressIntervalRef.current = setInterval(() => {
        // Slower, more realistic progress
        currentProgress = Math.min(currentProgress + Math.random() * 10, 85)
        setProgress(Math.round(currentProgress))
      }, 300)
    }, SHOW_DELAY_MS)

    // Use startTransition to mark when navigation is actually complete
    startTransition(() => {
      // Navigation is complete
      setIsNavigating(false)
      
      // Clear the show timer if navigation completed quickly
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
      }
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      
      // If we were showing progress, complete it
      if (shouldShowProgress || progress > 0) {
        setProgress(100)
        
        // Hide after completion animation
        completeTimerRef.current = setTimeout(() => {
          setShouldShowProgress(false)
          setProgress(0)
        }, 250)
      } else {
        // Navigation was fast enough, never show the bar
        setShouldShowProgress(false)
        setProgress(0)
      }
    })

    // Cleanup
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    }
  }, [pathname, searchParams])

  return {
    isLoading: shouldShowProgress || progress > 0,
    progress
  }
}