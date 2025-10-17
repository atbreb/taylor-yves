'use client'

import { Card, Grid, Group, Stack, Text, Title, ThemeIcon, Timeline, Button, rem } from '@mantine/core'
import { IconUsers, IconChartBar, IconBriefcase, IconBolt, IconPlus, IconUserPlus, IconFileAnalytics, IconChevronRight } from '@tabler/icons-react'

const statsData = [
  { title: 'Total Users', value: '1,245', icon: IconUsers, color: 'blue' },
  { title: 'Revenue', value: '$84,532', icon: IconChartBar, color: 'green' },
  { title: 'Active Projects', value: '24', icon: IconBriefcase, color: 'yellow' },
  { title: 'Performance', value: '98.5%', icon: IconBolt, color: 'violet' },
]

const quickActions = [
  { label: 'Create New Project', icon: IconPlus, color: 'blue' },
  { label: 'Invite Team Member', icon: IconUserPlus, color: 'green' },
  { label: 'Generate Report', icon: IconFileAnalytics, color: 'violet' },
]

export default function DashboardPage() {
  return (
    <Stack gap="xl">
      {/* Page Header */}
      <div>
        <Title order={1} size="h2" mb="xs">Dashboard</Title>
        <Text size="sm" c="dimmed">
          Welcome to your dashboard. Here you can view an overview of your application.
        </Text>
      </div>

      {/* Stats Cards */}
      <Grid>
        {statsData.map((stat) => (
          <Grid.Col key={stat.title} span={{ base: 12, xs: 6, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon
                  size="xl"
                  radius="md"
                  variant="light"
                  color={stat.color}
                >
                  <stat.icon style={{ width: rem(24), height: rem(24) }} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {stat.title}
                  </Text>
                  <Text size="xl" fw={700}>
                    {stat.value}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Charts and Tables Section */}
      <Grid>
        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Title order={3} size="h4" mb="md">
              Recent Activity
            </Title>
            <Timeline active={3} bulletSize={24} lineWidth={2}>
              <Timeline.Item bullet={<IconUsers size={12} />} title="New user registered" color="green">
                <Text c="dimmed" size="sm">2 minutes ago</Text>
              </Timeline.Item>
              <Timeline.Item bullet={<IconBriefcase size={12} />} title="Project completed" color="blue">
                <Text c="dimmed" size="sm">1 hour ago</Text>
              </Timeline.Item>
              <Timeline.Item bullet={<IconBolt size={12} />} title="Server maintenance scheduled" color="yellow">
                <Text c="dimmed" size="sm">3 hours ago</Text>
              </Timeline.Item>
              <Timeline.Item bullet={<IconChartBar size={12} />} title="Error rate increased" color="red">
                <Text c="dimmed" size="sm">6 hours ago</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Grid.Col>

        {/* Quick Actions */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Title order={3} size="h4" mb="md">
              Quick Actions
            </Title>
            <Stack gap="sm">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="light"
                  color={action.color}
                  fullWidth
                  leftSection={<action.icon size={20} />}
                  rightSection={<IconChevronRight size={16} />}
                  justify="space-between"
                  size="md"
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
