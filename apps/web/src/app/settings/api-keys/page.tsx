'use client'

import { useState, useEffect } from 'react'
import { saveApiKeys, getApiKeys, testApiKey } from './actions'
import {
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Button,
  Group,
  Badge,
  Alert,
  ActionIcon,
  Loader,
  Code
} from '@mantine/core'
import { IconEye, IconEyeOff, IconCheck, IconX, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'

interface ApiKeyConfig {
  provider: string
  key: string
  isValid?: boolean
  lastTested?: string
}

const API_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', envVar: 'OPENAI_API_KEY', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', envVar: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' },
  { id: 'google', name: 'Google AI', envVar: 'GOOGLE_API_KEY', placeholder: 'AIza...' },
  { id: 'meta', name: 'Meta (Llama)', envVar: 'META_API_KEY', placeholder: 'meta-...' },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const keys = await getApiKeys()
      setApiKeys(keys)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load API keys' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveApiKeys(apiKeys)
      setMessage({ type: 'success', text: 'API keys saved successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API keys' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (providerId: string) => {
    if (!apiKeys[providerId]?.key) {
      setMessage({ type: 'error', text: 'Please enter an API key first' })
      return
    }

    setTesting(providerId)
    setMessage(null)
    try {
      const result = await testApiKey(providerId, apiKeys[providerId].key)
      setApiKeys(prev => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          isValid: result.valid,
          lastTested: new Date().toISOString()
        }
      }))
      setMessage({
        type: result.valid ? 'success' : 'error',
        text: result.message
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test API key' })
    } finally {
      setTesting(null)
    }
  }

  const toggleShowKey = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const updateApiKey = (providerId: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: {
        provider: providerId,
        key: value,
        isValid: undefined,
        lastTested: undefined
      }
    }))
  }

  if (loading) {
    return (
      <Group justify="center" h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading API keys...</Text>
        </Stack>
      </Group>
    )
  }

  return (
    <Stack gap="xl" maw={900}>
      <div>
        <Title order={1} size="h2" mb="xs">API Keys Configuration</Title>
        <Text size="sm" c="dimmed">
          Configure your API keys for various AI providers. Keys are encrypted and stored securely.
        </Text>
      </div>

      {message && (
        <Alert
          icon={message.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          title={message.type === 'success' ? 'Success' : 'Error'}
          color={message.type === 'success' ? 'green' : 'red'}
          withCloseButton
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Stack gap="md">
        {API_PROVIDERS.map((provider) => {
          const config = apiKeys[provider.id] || { provider: provider.id, key: '' }
          const isShown = showKeys[provider.id]

          return (
            <Card key={provider.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Text fw={600} size="lg">{provider.name}</Text>
                    {config.isValid !== undefined && (
                      <Badge
                        color={config.isValid ? 'green' : 'red'}
                        variant="light"
                        leftSection={config.isValid ? <IconCheck size={12} /> : <IconX size={12} />}
                      >
                        {config.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    )}
                  </Group>
                  <Code>{provider.envVar}</Code>
                </Group>

                <Group align="flex-start" gap="sm">
                  <TextInput
                    flex={1}
                    type={isShown ? 'text' : 'password'}
                    value={config.key}
                    onChange={(e) => updateApiKey(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                    rightSection={
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => toggleShowKey(provider.id)}
                      >
                        {isShown ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </ActionIcon>
                    }
                  />
                  <Button
                    onClick={() => handleTest(provider.id)}
                    disabled={testing === provider.id || !config.key}
                    loading={testing === provider.id}
                    variant="light"
                  >
                    Test
                  </Button>
                </Group>

                {config.lastTested && (
                  <Text size="xs" c="dimmed">
                    Last tested: {new Date(config.lastTested).toLocaleString()}
                  </Text>
                )}
              </Stack>
            </Card>
          )
        })}
      </Stack>

      <Group justify="flex-end" gap="md">
        <Button
          variant="default"
          onClick={loadApiKeys}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
        >
          Save All Keys
        </Button>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} title="Security Note" color="blue" variant="light">
        Your API keys are stored securely and encrypted. They are never exposed in client-side code.
      </Alert>
    </Stack>
  )
}
