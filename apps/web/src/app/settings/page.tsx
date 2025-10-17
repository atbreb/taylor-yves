'use client'

import Link from 'next/link'
import { Card, Grid, Title, Text, Stack, ThemeIcon, Group } from '@mantine/core'
import { IconAdjustments, IconKey } from '@tabler/icons-react'

const settingsCategories = [
  {
    title: 'Environment Variables',
    description: 'Manage all your application environment variables and credentials in organized groups',
    href: '/settings/environment',
    icon: IconAdjustments,
    color: 'blue'
  },
  {
    title: 'API Keys',
    description: 'Quick setup for AI provider API keys with validation',
    href: '/settings/api-keys',
    icon: IconKey,
    color: 'violet'
  }
]

export default function SettingsPage() {
  return (
    <Stack maw={1200}>
      <div>
        <Title order={1} size="h2" mb="xs">Settings</Title>
        <Text size="sm" c="dimmed">
          Configure your application settings, credentials, and integrations
        </Text>
      </div>

      <Grid>
        {settingsCategories.map((category) => (
          <Grid.Col key={category.title} span={{ base: 12, md: 6 }}>
            <Card
              component={Link}
              href={category.href}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer', height: '100%' }}
              className="transition-all hover:shadow-md"
            >
              <Group align="flex-start" gap="md">
                <ThemeIcon size={60} radius="md" variant="light" color={category.color}>
                  <category.icon size={32} />
                </ThemeIcon>
                <Stack gap="xs" flex={1}>
                  <Text fw={600} size="lg">
                    {category.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {category.description}
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  )
}
