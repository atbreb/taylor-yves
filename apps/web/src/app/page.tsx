'use client'

import { Stack, Center, Box } from '@mantine/core'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function SplashPage() {
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
          {/* Logo */}
          <Box
            style={{
              width: 200,
              height: 200,
              position: 'relative',
            }}
          >
            <Image
              src="/Y.png"
              alt="Taylor-Yves Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>

          {/* Tagline */}
          <Box
            component="h1"
            style={{
              fontSize: '1.5rem',
              fontWeight: 400,
              textAlign: 'center',
              margin: 0,
              color: 'var(--mantine-color-text)',
            }}
          >
            A smoother way to work is on its way.
          </Box>
        </Stack>
      </Center>
    </Box>
  )
}
