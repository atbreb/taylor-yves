import { cn, formatError, sleep, isServer, isClient } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should resolve Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold')
    })

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null)).toBe('base')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error')
      expect(formatError(error)).toBe('Test error')
    })

    it('should format string errors', () => {
      expect(formatError('String error')).toBe('String error')
    })

    it('should format number errors', () => {
      expect(formatError(404)).toBe('404')
    })

    it('should format null', () => {
      expect(formatError(null)).toBe('null')
    })

    it('should format undefined', () => {
      expect(formatError(undefined)).toBe('undefined')
    })

    it('should format object errors', () => {
      const error = { message: 'object error', code: 500 }
      expect(formatError(error)).toContain('object')
    })

    it('should handle TypeError', () => {
      const error = new TypeError('Type mismatch')
      expect(formatError(error)).toBe('Type mismatch')
    })

    it('should handle custom Error with stack', () => {
      const error = new Error('Custom error with stack')
      expect(formatError(error)).toBe('Custom error with stack')
    })
  })

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay execution', async () => {
      const promise = sleep(1000)

      jest.advanceTimersByTime(999)
      expect(promise).toBeInstanceOf(Promise)

      jest.advanceTimersByTime(1)
      await promise

      // If we get here, the promise resolved
      expect(true).toBe(true)
    })

    it('should resolve after specified milliseconds', async () => {
      const callback = jest.fn()

      sleep(500).then(callback)

      expect(callback).not.toHaveBeenCalled()

      jest.advanceTimersByTime(500)
      await Promise.resolve() // Allow promises to resolve

      expect(callback).toHaveBeenCalled()
    })

    it('should handle zero milliseconds', async () => {
      const callback = jest.fn()

      sleep(0).then(callback)

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('isServer / isClient', () => {
    it('should detect client environment in jsdom test environment', () => {
      // jsdom provides a window object, so we're in "client" mode
      expect(isClient()).toBe(true)
      expect(isServer()).toBe(false)
    })

    it('should detect server environment when window is deleted', () => {
      const originalWindow = global.window

      // Remove window to simulate server
      delete (global as any).window

      expect(isServer()).toBe(true)
      expect(isClient()).toBe(false)

      // Restore
      global.window = originalWindow
    })

    it('should be consistent', () => {
      const serverResult = isServer()
      const clientResult = isClient()

      // They should be opposites
      expect(serverResult).toBe(!clientResult)
    })

    it('should handle window object presence correctly', () => {
      // When window exists (current state in jsdom)
      const hasWindow = typeof window !== 'undefined'
      expect(isClient()).toBe(hasWindow)
      expect(isServer()).toBe(!hasWindow)
    })
  })
})
