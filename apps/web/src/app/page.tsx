'use client'

import { Stack, Center, Box } from '@mantine/core'
import Image from 'next/image'
import { useComputedColorScheme } from '@mantine/core'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function SplashPage() {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = computedColorScheme === 'dark'

  return (
    <Box
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Theme Toggle in top-right corner */}
      <Box
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
        }}
      >
        <ThemeToggle />
      </Box>

      {/* Centered Content */}
      <Center style={{ width: '100%', height: '100vh' }}>
        <Stack align="center" gap="xl">
          {/* Logo - changes based on theme */}
          <Box
            style={{
              width: 349,
              height: 333,
              position: 'relative',
            }}
          >
            <Image
              src={isDark ? '/ty-white.png' : '/ty-black.png'}
              alt="Taylor-Yves Logo"
              width={349}
              height={333}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>

          {/* Tagline */}
          <Box
            component="h1"
            style={{
              fontSize: '0.875rem',
              fontWeight: 300,
              fontStyle: 'italic',
              textAlign: 'center',
              margin: 0,
              marginTop: '-1rem',
              color: 'var(--mantine-color-text)',
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
              letterSpacing: '0.05em',
            }}
          >
            A smoother way to work is on its way.
          </Box>
        </Stack>
      </Center>
    </Box>
  )
}
