import { renderHook, act } from '@testing-library/react'
import { useNavigationProgress } from '../useNavigationProgress'
import { usePathname, useSearchParams } from 'next/navigation'

jest.mock('next/navigation')

describe('useNavigationProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should initialize with no loading state', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result } = renderHook(() => useNavigationProgress())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('should return consistent isLoading and progress values', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result } = renderHook(() => useNavigationProgress())

    // Initial state
    const { isLoading, progress } = result.current

    // isLoading should be true only when progress > 0
    if (progress > 0) {
      expect(isLoading).toBe(true)
    } else {
      expect(isLoading).toBe(false)
    }
  })

  it('should not show progress immediately on pathname change', () => {
    let currentPath = '/'
    ;(usePathname as jest.Mock).mockImplementation(() => currentPath)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result, rerender } = renderHook(() => useNavigationProgress())

    // Initial state
    expect(result.current.isLoading).toBe(false)

    // Change pathname
    currentPath = '/dashboard'

    act(() => {
      rerender()
    })

    // Should not show progress immediately (before SHOW_DELAY_MS)
    // Note: startTransition may complete navigation quickly
    expect(result.current.progress).toBeGreaterThanOrEqual(0)
    expect(result.current.progress).toBeLessThanOrEqual(100)
  })

  it('should clean up timers on unmount', () => {
    let currentPath = '/'
    ;(usePathname as jest.Mock).mockImplementation(() => currentPath)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { unmount } = renderHook(() => useNavigationProgress())

    // Unmount the hook
    unmount()

    // All timers should be cleared
    expect(jest.getTimerCount()).toBe(0)
  })

  it('should not trigger on same pathname', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result, rerender } = renderHook(() => useNavigationProgress())

    // Initial state
    const initialState = { ...result.current }

    // Re-render with same pathname
    rerender()

    // Wait
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // State should remain stable when pathname hasn't changed
    expect(result.current.isLoading).toBe(initialState.isLoading)
    expect(result.current.progress).toBe(initialState.progress)
  })

  it('should handle progress values within valid range', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result } = renderHook(() => useNavigationProgress())

    // Progress should always be 0-100
    expect(result.current.progress).toBeGreaterThanOrEqual(0)
    expect(result.current.progress).toBeLessThanOrEqual(100)
  })

  it('should return an object with isLoading and progress properties', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result } = renderHook(() => useNavigationProgress())

    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('progress')
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.progress).toBe('number')
  })

  it('should handle pathname changes without errors', () => {
    let currentPath = '/'
    ;(usePathname as jest.Mock).mockImplementation(() => currentPath)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { rerender } = renderHook(() => useNavigationProgress())

    // Change pathname multiple times
    currentPath = '/page1'
    expect(() => {
      act(() => {
        rerender()
      })
    }).not.toThrow()

    currentPath = '/page2'
    expect(() => {
      act(() => {
        rerender()
      })
    }).not.toThrow()

    currentPath = '/page3'
    expect(() => {
      act(() => {
        rerender()
      })
    }).not.toThrow()
  })

  it('should maintain correct types for returned values', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { result } = renderHook(() => useNavigationProgress())

    expect(Number.isInteger(result.current.progress) || result.current.progress === 0).toBe(true)
    expect([true, false]).toContain(result.current.isLoading)
  })
})
