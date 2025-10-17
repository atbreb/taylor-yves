'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell, Burger, Group, ActionIcon, Avatar, Menu, Text } from '@mantine/core'
import { IconBell, IconSearch, IconChevronDown, IconLogout, IconSettings as IconSettingsMenu } from '@tabler/icons-react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { PageTransition } from '@/components/layout/PageTransition'
import { ProgressBar } from '@/components/layout/ProgressBar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 256, breakpoint: 'lg', collapsed: { mobile: true } }}
      padding="md"
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Mobile burger menu */}
            <Burger
              opened={sidebarOpen}
              onClick={toggleSidebar}
              hiddenFrom="lg"
              size="sm"
            />
          </Group>

          {/* Right side of header */}
          <Group gap="xs">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <ActionIcon variant="subtle" color="gray" size="lg">
              <IconBell size={20} />
            </ActionIcon>

            {/* Search */}
            <ActionIcon variant="subtle" color="gray" size="lg">
              <IconSearch size={20} />
            </ActionIcon>

            {/* User menu */}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar color="gray" radius="xl" size="sm">
                    JD
                  </Avatar>
                  <Text size="sm" visibleFrom="sm">John Doe</Text>
                  <IconChevronDown size={16} />
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconSettingsMenu size={14} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
        <ProgressBar />
      </AppShell.Header>

      {/* Main content */}
      <AppShell.Main>
        <PageTransition key={pathname}>
          {children}
        </PageTransition>
      </AppShell.Main>
    </AppShell>
  )
}
