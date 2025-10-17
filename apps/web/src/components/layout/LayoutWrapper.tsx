'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AppShell, Group, Text, Container, Anchor, Box } from '@mantine/core'
import { DashboardLayout } from './DashboardLayout'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  // Check if we're on a dashboard route
  const isDashboardRoute = pathname?.startsWith('/dashboard') ||
                          pathname?.startsWith('/analytics') ||
                          pathname?.startsWith('/projects') ||
                          pathname?.startsWith('/team') ||
                          pathname?.startsWith('/settings') ||
                          pathname?.startsWith('/chat')

  if (isDashboardRoute) {
    return <DashboardLayout>{children}</DashboardLayout>
  }

  // Default layout for non-dashboard pages
  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Anchor
              component={Link}
              href="/"
              underline="never"
              c="inherit"
            >
              <Text fw={700} size="lg">Agentic Template</Text>
            </Anchor>
            <ThemeToggle />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>

      <Box component="footer" py="xl" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Container size="xl">
          <Group justify="center">
            <Text size="sm" c="dimmed">
              Built with Next.js, TypeScript, Mantine, and gRPC
            </Text>
          </Group>
        </Container>
      </Box>
    </AppShell>
  )
}
