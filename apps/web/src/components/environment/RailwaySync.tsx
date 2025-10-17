'use client'

import { useState } from 'react'
import {
  Card,
  Stack,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Alert,
  Badge,
  Divider,
  ActionIcon,
  Tooltip,
  List,
  Collapse,
  Box
} from '@mantine/core'
import {
  IconCloudUpload,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconRocket,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle
} from '@tabler/icons-react'
import {
  syncAllToRailway,
  compareWithRailway,
  syncAndDeploy,
  testRailwayConnection
} from '@/app/settings/environment/railway-actions'

export function RailwaySync() {
  const [railwayApiToken, setRailwayApiToken] = useState('')
  const [railwayProjectId, setRailwayProjectId] = useState('')
  const [railwayEnvironmentId, setRailwayEnvironmentId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [comparison, setComparison] = useState<{
    local_only?: string[]
    railway_only?: string[]
    different_values?: string[]
    matching?: string[]
  } | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleTestConnection = async () => {
    if (!railwayApiToken || !railwayProjectId) {
      setMessage({ type: 'error', text: 'Please provide API Token and Project ID' })
      return
    }

    setTesting(true)
    setMessage(null)

    try {
      const result = await testRailwayConnection(railwayApiToken, railwayProjectId)
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection' })
    } finally {
      setTesting(false)
    }
  }

  const handleCompare = async () => {
    if (!railwayApiToken || !railwayProjectId) {
      setMessage({ type: 'error', text: 'Please provide API Token and Project ID' })
      return
    }

    setComparing(true)
    setMessage(null)
    setComparison(null)

    try {
      const result = await compareWithRailway(
        railwayApiToken,
        railwayProjectId,
        railwayEnvironmentId || undefined
      )

      if (result.success) {
        setComparison({
          local_only: result.local_only,
          railway_only: result.railway_only,
          different_values: result.different_values,
          matching: result.matching
        })
        setShowComparison(true)
        setMessage({
          type: 'info',
          text: 'Comparison complete. See results below.'
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to compare' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to compare variables' })
    } finally {
      setComparing(false)
    }
  }

  const handleSync = async () => {
    if (!railwayApiToken || !railwayProjectId) {
      setMessage({ type: 'error', text: 'Please provide API Token and Project ID' })
      return
    }

    setSyncing(true)
    setMessage(null)

    try {
      const result = await syncAllToRailway(
        railwayApiToken,
        railwayProjectId,
        railwayEnvironmentId || undefined
      )

      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      })

      if (result.success) {
        // Refresh comparison after sync
        setComparison(null)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync variables' })
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncAndDeploy = async () => {
    if (!railwayApiToken || !railwayProjectId) {
      setMessage({ type: 'error', text: 'Please provide API Token and Project ID' })
      return
    }

    setDeploying(true)
    setMessage(null)

    try {
      const result = await syncAndDeploy(
        railwayApiToken,
        railwayProjectId,
        railwayEnvironmentId || undefined
      )

      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      })

      if (result.success) {
        setComparison(null)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync and deploy' })
    } finally {
      setDeploying(false)
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3} size="h4">Railway Integration</Title>
            <Text size="sm" c="dimmed">
              Sync environment variables to your Railway deployment
            </Text>
          </div>
          <Tooltip label={showInstructions ? 'Hide instructions' : 'Show instructions'}>
            <ActionIcon
              variant="subtle"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? <IconChevronUp size={16} /> : <IconInfoCircle size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>

        <Collapse in={showInstructions}>
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={600}>How to get Railway credentials:</Text>
              <List size="sm" spacing="xs">
                <List.Item>
                  Go to{' '}
                  <Text component="a" href="https://railway.app" target="_blank" c="blue" td="underline">
                    railway.app
                  </Text>
                </List.Item>
                <List.Item>
                  Click on your profile → Account Settings → Tokens
                </List.Item>
                <List.Item>Create a new token (starts with "railway_")</List.Item>
                <List.Item>
                  Go to your project → Settings → copy the Project ID
                </List.Item>
                <List.Item>
                  (Optional) Copy Environment ID for specific environment
                </List.Item>
              </List>
            </Stack>
          </Alert>
        </Collapse>

        {message && (
          <Alert
            icon={
              message.type === 'success' ? (
                <IconCheck size={16} />
              ) : message.type === 'error' ? (
                <IconAlertCircle size={16} />
              ) : (
                <IconInfoCircle size={16} />
              )
            }
            title={message.type === 'success' ? 'Success' : message.type === 'error' ? 'Error' : 'Info'}
            color={message.type === 'success' ? 'green' : message.type === 'error' ? 'red' : 'blue'}
            withCloseButton
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Divider />

        <Stack gap="sm">
          <div style={{ position: 'relative' }}>
            <TextInput
              label="Railway API Token"
              placeholder="railway_..."
              description="Your Railway API token (starts with 'railway_')"
              value={railwayApiToken}
              onChange={(e) => setRailwayApiToken(e.target.value)}
              type={showToken ? 'text' : 'password'}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </ActionIcon>
              }
              styles={{ input: { fontFamily: 'monospace' } }}
            />
          </div>

          <TextInput
            label="Railway Project ID"
            placeholder="abc123..."
            description="Your Railway project ID"
            value={railwayProjectId}
            onChange={(e) => setRailwayProjectId(e.target.value)}
            styles={{ input: { fontFamily: 'monospace' } }}
          />

          <TextInput
            label="Railway Environment ID (Optional)"
            placeholder="prod-abc123..."
            description="Leave empty for production environment"
            value={railwayEnvironmentId}
            onChange={(e) => setRailwayEnvironmentId(e.target.value)}
            styles={{ input: { fontFamily: 'monospace' } }}
          />
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleTestConnection}
            loading={testing}
          >
            Test Connection
          </Button>

          <Button
            variant="light"
            color="blue"
            leftSection={<IconEye size={16} />}
            onClick={handleCompare}
            loading={comparing}
            disabled={!railwayApiToken || !railwayProjectId}
          >
            Compare Variables
          </Button>
        </Group>

        <Group>
          <Button
            flex={1}
            variant="filled"
            color="blue"
            leftSection={<IconCloudUpload size={16} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!railwayApiToken || !railwayProjectId}
          >
            Sync to Railway
          </Button>

          <Button
            flex={1}
            variant="filled"
            color="green"
            leftSection={<IconRocket size={16} />}
            onClick={handleSyncAndDeploy}
            loading={deploying}
            disabled={!railwayApiToken || !railwayProjectId}
          >
            Sync & Deploy
          </Button>
        </Group>

        {comparison && (
          <Collapse in={showComparison}>
            <Card withBorder padding="md" bg="gray.0">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Comparison Results</Text>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => setShowComparison(false)}
                  >
                    <IconChevronUp size={14} />
                  </ActionIcon>
                </Group>

                {comparison.matching && comparison.matching.length > 0 && (
                  <div>
                    <Badge color="green" variant="light" mb="xs">
                      {comparison.matching.length} Matching
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {comparison.matching.join(', ')}
                    </Text>
                  </div>
                )}

                {comparison.local_only && comparison.local_only.length > 0 && (
                  <div>
                    <Badge color="blue" variant="light" mb="xs">
                      {comparison.local_only.length} Local Only (will be synced)
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {comparison.local_only.join(', ')}
                    </Text>
                  </div>
                )}

                {comparison.different_values && comparison.different_values.length > 0 && (
                  <div>
                    <Badge color="orange" variant="light" mb="xs">
                      {comparison.different_values.length} Different Values (will be updated)
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {comparison.different_values.join(', ')}
                    </Text>
                  </div>
                )}

                {comparison.railway_only && comparison.railway_only.length > 0 && (
                  <div>
                    <Badge color="gray" variant="light" mb="xs">
                      {comparison.railway_only.length} Railway Only (will remain)
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {comparison.railway_only.join(', ')}
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>
          </Collapse>
        )}
      </Stack>
    </Card>
  )
}
