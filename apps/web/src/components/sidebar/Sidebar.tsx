'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NavLink, Avatar, Group, Text, Stack, ActionIcon, Drawer, UnstyledButton, AppShell } from '@mantine/core'
import { IconHome, IconSettings, IconX, IconUser } from '@tabler/icons-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: IconHome
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: IconSettings
  }
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <Stack h="100%" gap={0}>
      {/* Sidebar Header */}
      <Group h={64} px="md" justify="space-between">
        <Group gap="sm">
          <Avatar color="indigo" radius="sm" size="md">AT</Avatar>
          <Text size="sm" fw={600}>Agentic Template</Text>
        </Group>

        {/* Close button for mobile */}
        <ActionIcon
          className="lg:hidden"
          variant="subtle"
          color="gray"
          onClick={onClose}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      {/* Navigation */}
      <Stack flex={1} p="md" gap="xs" style={{ overflowY: 'auto' }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <NavLink
              key={item.name}
              component={Link}
              href={item.href}
              label={item.name}
              leftSection={<item.icon size={20} stroke={1.5} />}
              active={isActive}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
            />
          )
        })}
      </Stack>

      {/* User Profile Section */}
      <UnstyledButton p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Group>
          <Avatar color="gray" radius="xl">
            <IconUser size={18} />
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>John Doe</Text>
            <Text size="xs" c="dimmed" truncate>john.doe@example.com</Text>
          </div>
        </Group>
      </UnstyledButton>
    </Stack>
  )

  return (
    <>
      {/* Desktop Sidebar - AppShell Navbar */}
      <AppShell.Navbar>
        {sidebarContent}
      </AppShell.Navbar>

      {/* Mobile Drawer */}
      <Drawer
        opened={isOpen}
        onClose={onClose}
        size={256}
        padding={0}
        hiddenFrom="lg"
        styles={{
          content: { height: '100vh' },
          header: { display: 'none' }
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}
