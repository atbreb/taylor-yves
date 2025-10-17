import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isServer() {
  return typeof window === 'undefined'
}

export function isClient() {
  return typeof window !== 'undefined'
}