'use client'

import { useState, useEffect } from 'react'
import {
  saveEnvironmentGroups,
  getEnvironmentGroups,
  testConnection,
  deleteGroup,
  exportGroups,
  importGroups
} from './actions'
import {
  Stack,
  Title,
  Text,
  Alert,
  Grid,
  Card,
  TextInput,
  Button,
  Group,
  ActionIcon,
  Checkbox,
  Loader,
  Center,
  Box,
  NavLink,
  Select,
  FileButton,
  Badge,
  Divider,
  PasswordInput,
  Textarea,
  Modal
} from '@mantine/core'
import {
  IconEye,
  IconEyeOff,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconUpload,
  IconPlus,
  IconTrash,
  IconDatabase,
  IconSearch
} from '@tabler/icons-react'

interface EnvironmentVariable {
  id: string
  key: string
  value: string
  description?: string
  isSecret: boolean
}

interface EnvironmentGroup {
  id: string
  name: string
  description?: string
  icon?: string
  variables: EnvironmentVariable[]
  createdAt: string
  updatedAt: string
}

const DEFAULT_GROUPS = [
  { id: 'database', name: 'Database', icon: '🗄️', description: 'Database connection settings' },
  { id: 'ai-providers', name: 'AI Providers', icon: '🤖', description: 'AI service API keys' },
  { id: 'netsuite', name: 'NetSuite', icon: '📊', description: 'NetSuite integration credentials' },
]

export default function EnvironmentPage() {
  const [groups, setGroups] = useState<EnvironmentGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const loadedGroups = await getEnvironmentGroups()
      // Server action already handles fallback to defaults
      setGroups(loadedGroups)
      setSelectedGroup(loadedGroups[0]?.id || null)
    } catch (error) {
      console.error('Error loading environment groups:', error)
      setMessage({ type: 'error', text: 'Failed to load environment groups. Using defaults.' })
      // Fallback to defaults in case of catastrophic failure
      const initialGroups = DEFAULT_GROUPS.map(g => ({
        ...g,
        variables: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      setGroups(initialGroups)
      setSelectedGroup(initialGroups[0]?.id || null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveEnvironmentGroups(groups)
      setMessage({ type: 'success', text: 'Environment variables saved successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save environment variables' })
    } finally {
      setSaving(false)
    }
  }

  const addGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: EnvironmentGroup = {
      id: newGroupName.toLowerCase().replace(/\s+/g, '-'),
      name: newGroupName,
      icon: '📁',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setGroups([...groups, newGroup])
    setSelectedGroup(newGroup.id)
    setNewGroupName('')
    setAddGroupModalOpen(false)
  }

  const removeGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this group and all its variables?')) {
      try {
        await deleteGroup(groupId)
        setGroups(groups.filter(g => g.id !== groupId))
        if (selectedGroup === groupId) {
          setSelectedGroup(groups[0]?.id || null)
        }
        setMessage({ type: 'success', text: 'Group deleted successfully' })
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete group' })
      }
    }
  }

  const addVariable = (groupId: string) => {
    const newVar: EnvironmentVariable = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      isSecret: false,
    }

    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, variables: [...g.variables, newVar], updatedAt: new Date().toISOString() }
        : g
    ))
  }

  const updateVariable = (groupId: string, varId: string, field: keyof EnvironmentVariable, value: any) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            variables: g.variables.map(v =>
              v.id === varId ? { ...v, [field]: value } : v
            ),
            updatedAt: new Date().toISOString()
          }
        : g
    ))
  }

  const removeVariable = (groupId: string, varId: string) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            variables: g.variables.filter(v => v.id !== varId),
            updatedAt: new Date().toISOString()
          }
        : g
    ))
  }

  const toggleShowValue = (varId: string) => {
    setShowValues(prev => ({ ...prev, [varId]: !prev[varId] }))
  }

  const testDatabaseConnection = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const pooledUrl = group.variables.find(v => v.key === 'DATABASE_URL_POOLED')?.value
    const directUrl = group.variables.find(v => v.key === 'DATABASE_URL_DIRECT')?.value

    if (!pooledUrl && !directUrl) {
      setMessage({ type: 'error', text: 'No database URL found in this group' })
      return
    }

    try {
      const result = await testConnection(pooledUrl || directUrl || '')
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection' })
    }
  }

  const handleExport = async () => {
    try {
      const exported = await exportGroups(groups)
      const blob = new Blob([exported], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `environment-variables-${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Environment variables exported' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export environment variables' })
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) return

    try {
      const content = await file.text()
      const imported = await importGroups(content)
      setGroups(imported)
      setMessage({ type: 'success', text: 'Environment variables imported successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import environment variables' })
    }
  }

  const currentGroup = groups.find(g => g.id === selectedGroup)
  const filteredVariables = currentGroup?.variables.filter(v =>
    v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading environment variables...</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="xl" maw={1400}>
      <div>
        <Title order={1} size="h2" mb="xs">Environment Variables</Title>
        <Text size="sm" c="dimmed">
          Manage your application environment variables and credentials. Values are encrypted and stored securely.
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

      {/* Mobile Group Selector */}
      <Box hiddenFrom="lg">
        <Select
          label="Select Group"
          placeholder="Choose a group"
          data={groups.map(g => ({
            value: g.id,
            label: `${g.icon} ${g.name} (${g.variables.length})`
          }))}
          value={selectedGroup}
          onChange={(value) => setSelectedGroup(value)}
        />
      </Box>

      <Grid>
        {/* Groups Sidebar - Hidden on mobile */}
        <Grid.Col span={{ base: 12, lg: 3 }} visibleFrom="lg">
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Groups</Text>
                <Group gap="xs">
                  <ActionIcon variant="subtle" color="gray" onClick={handleExport} title="Export">
                    <IconDownload size={16} />
                  </ActionIcon>
                  <FileButton onChange={handleImport} accept="application/json">
                    {(props) => (
                      <ActionIcon {...props} variant="subtle" color="gray" title="Import">
                        <IconUpload size={16} />
                      </ActionIcon>
                    )}
                  </FileButton>
                </Group>
              </Group>

              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddGroupModalOpen(true)}
                fullWidth
              >
                Add Group
              </Button>

              <Divider />

              <Stack gap="xs">
                {groups.map((group) => (
                  <NavLink
                    key={group.id}
                    label={
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs">
                          <Text span>{group.icon}</Text>
                          <div>
                            <Text size="sm" fw={500}>{group.name}</Text>
                            <Text size="xs" c="dimmed">{group.variables.length} variables</Text>
                          </div>
                        </Group>
                        {!['database', 'ai-providers'].includes(group.id) && (
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeGroup(group.id)
                            }}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    }
                    active={selectedGroup === group.id}
                    onClick={() => setSelectedGroup(group.id)}
                  />
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Variables Panel */}
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            {currentGroup ? (
              <Stack gap="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="md">
                    <Text size="xl">{currentGroup.icon}</Text>
                    <div>
                      <Title order={3} size="h4">{currentGroup.name}</Title>
                      {currentGroup.description && (
                        <Text size="sm" c="dimmed">{currentGroup.description}</Text>
                      )}
                    </div>
                  </Group>
                  {currentGroup.id === 'database' && (
                    <Button
                      variant="light"
                      leftSection={<IconDatabase size={16} />}
                      onClick={() => testDatabaseConnection(currentGroup.id)}
                    >
                      Test Connection
                    </Button>
                  )}
                </Group>

                <Group>
                  <TextInput
                    flex={1}
                    placeholder="Search variables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftSection={<IconSearch size={16} />}
                  />
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => addVariable(currentGroup.id)}
                  >
                    Add Variable
                  </Button>
                </Group>

                <Divider />

                <Box mah={600} style={{ overflowY: 'auto' }}>
                  <Stack gap="md">
                    {filteredVariables?.length === 0 ? (
                      <Center py={60}>
                        <Text c="dimmed">
                          {searchTerm ? 'No variables found matching your search' : 'No variables in this group yet'}
                        </Text>
                      </Center>
                    ) : (
                      filteredVariables?.map((variable) => (
                        <Card key={variable.id} padding="md" withBorder>
                          <Grid gutter="md">
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                              <TextInput
                                label="Key"
                                placeholder="VARIABLE_NAME"
                                value={variable.key}
                                onChange={(e) => updateVariable(currentGroup.id, variable.id, 'key', e.target.value)}
                                styles={{ input: { fontFamily: 'monospace' } }}
                              />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, sm: 5 }}>
                              {variable.isSecret ? (
                                <PasswordInput
                                  label="Value"
                                  placeholder="Value"
                                  value={variable.value}
                                  onChange={(e) => updateVariable(currentGroup.id, variable.id, 'value', e.target.value)}
                                  visible={showValues[variable.id]}
                                  onVisibilityChange={() => toggleShowValue(variable.id)}
                                />
                              ) : (
                                <TextInput
                                  label="Value"
                                  placeholder="Value"
                                  value={variable.value}
                                  onChange={(e) => updateVariable(currentGroup.id, variable.id, 'value', e.target.value)}
                                />
                              )}
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, sm: 3 }}>
                              <Stack gap="xs" justify="flex-end" h="100%">
                                <Checkbox
                                  label="Secret"
                                  checked={variable.isSecret}
                                  onChange={(e) => updateVariable(currentGroup.id, variable.id, 'isSecret', e.currentTarget.checked)}
                                />
                                <Button
                                  color="red"
                                  variant="light"
                                  leftSection={<IconTrash size={16} />}
                                  onClick={() => removeVariable(currentGroup.id, variable.id)}
                                  fullWidth
                                >
                                  Remove
                                </Button>
                              </Stack>
                            </Grid.Col>

                            <Grid.Col span={12}>
                              <TextInput
                                placeholder="Description (optional)"
                                value={variable.description || ''}
                                onChange={(e) => updateVariable(currentGroup.id, variable.id, 'description', e.target.value)}
                              />
                            </Grid.Col>
                          </Grid>
                        </Card>
                      ))
                    )}
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Center h={400}>
                <Text c="dimmed">Select a group to manage its variables</Text>
              </Center>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end">
        <Button variant="default" onClick={loadGroups}>
          Reset
        </Button>
        <Button onClick={handleSave} loading={saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </Group>

      {/* Add Group Modal */}
      <Modal
        opened={addGroupModalOpen}
        onClose={() => {
          setAddGroupModalOpen(false)
          setNewGroupName('')
        }}
        title="Add New Group"
      >
        <Stack>
          <TextInput
            label="Group Name"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGroup()}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => {
              setAddGroupModalOpen(false)
              setNewGroupName('')
            }}>
              Cancel
            </Button>
            <Button onClick={addGroup} disabled={!newGroupName.trim()}>
              Add Group
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
