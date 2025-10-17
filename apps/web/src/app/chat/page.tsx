import { ChatInterface } from '@/components/chat/ChatInterface'
import { checkApiHealth } from '@/app/actions'
import { Stack, Title, Text, Group, Badge, Divider, Box } from '@mantine/core'

export default async function ChatPage() {
  // Check API health on page load
  const health = await checkApiHealth()

  return (
    <Stack h="calc(100vh - 100px)" gap={0}>
      <Box p="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} size="h3">AI Assistant</Title>
            <Text size="sm" c="dimmed">
              Powered by LangChain and streaming responses
            </Text>
          </div>
          <Badge
            color={health.healthy ? 'green' : 'red'}
            variant="dot"
            size="lg"
          >
            {health.healthy ? 'Connected' : 'Disconnected'}
          </Badge>
        </Group>
        <Divider my="md" />
      </Box>

      <Box flex={1} p="md" style={{ overflow: 'hidden' }}>
        <ChatInterface />
      </Box>
    </Stack>
  )
}
