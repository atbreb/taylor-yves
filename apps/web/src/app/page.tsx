import { Metadata } from 'next'
import Link from 'next/link'
import { Container, Title, Text, Button, Group, Stack, Card, ThemeIcon, SimpleGrid } from '@mantine/core'
import { IconBolt, IconCheck, IconApi } from '@tabler/icons-react'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to the Agentic Template',
}

const features = [
  {
    icon: IconBolt,
    title: 'Fast Development',
    description: 'Powered by Next.js 14 with Turbopack for lightning-fast development experience.',
    color: 'blue'
  },
  {
    icon: IconCheck,
    title: 'Type Safe',
    description: 'Full TypeScript support with strict typing for better development experience.',
    color: 'green'
  },
  {
    icon: IconApi,
    title: 'gRPC Ready',
    description: 'Pre-configured gRPC client setup for seamless backend communication.',
    color: 'violet'
  }
]

export default function HomePage() {
  return (
    <Container size="lg" py={60}>
      <Stack align="center" gap="xl" mih={600} justify="center">
        <Stack align="center" gap="lg" maw={800}>
          <Title
            order={1}
            size={56}
            fw={900}
            ta="center"
            style={{
              background: 'linear-gradient(to right, var(--mantine-color-blue-6), var(--mantine-color-violet-6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to Agentic Template
          </Title>

          <Text size="xl" ta="center" c="dimmed" maw={700}>
            A modern full-stack template with Next.js 14, TypeScript, Mantine UI, and gRPC.
            Built for speed with Turbopack and designed for scalable applications.
          </Text>

          <Group justify="center">
            <Button
              component={Link}
              href="/dashboard"
              size="lg"
              variant="filled"
            >
              Get Started
            </Button>
            <Button
              component="a"
              href="https://github.com/yourusername/agentic-template"
              target="_blank"
              size="lg"
              variant="light"
            >
              Learn More
            </Button>
          </Group>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt={40} w="100%">
          {features.map((feature) => (
            <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size={60} radius="md" variant="light" color={feature.color}>
                  <feature.icon size={32} />
                </ThemeIcon>
                <Title order={3} size="h4" ta="center">
                  {feature.title}
                </Title>
                <Text size="sm" ta="center" c="dimmed">
                  {feature.description}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
