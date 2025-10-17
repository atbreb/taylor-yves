'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  TextInput,
  Textarea,
  Group,
  Divider,
  Alert
} from '@mantine/core'
import { IconArrowLeft, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import Link from 'next/link'
import { createTable, type ColumnDefinition, type DataType } from '@/app/actions/schema'
import { ColumnBuilder } from '@/components/schema/ColumnBuilder'

export default function NewTablePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [tableName, setTableName] = useState('')
  const [description, setDescription] = useState('')
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    {
      name: '',
      data_type: 'text',
      is_nullable: true,
      is_unique: false
    }
  ])

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: '',
        data_type: 'text',
        is_nullable: true,
        is_unique: false
      }
    ])
  }

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleUpdateColumn = (index: number, column: ColumnDefinition) => {
    const newColumns = [...columns]
    newColumns[index] = column
    setColumns(newColumns)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate
      if (!tableName.trim()) {
        throw new Error('Table name is required')
      }

      if (columns.length === 0) {
        throw new Error('At least one column is required')
      }

      if (columns.some((col) => !col.name.trim())) {
        throw new Error('All columns must have a name')
      }

      // Create table
      const response = await createTable({
        name: tableName,
        description: description || undefined,
        columns
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to create table')
      }

      // Success! Redirect to tables list
      router.push('/settings/schema/tables')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Header */}
          <Group>
            <Button
              component={Link}
              href="/settings/schema/tables"
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Tables
            </Button>
          </Group>

          <div>
            <Title order={1}>Create New Table</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Define a new custom table with columns and data types. The table will be
              created in the database and immediately available for use.
            </Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Table Details */}
          <Paper p="lg" withBorder>
            <Stack gap="md">
              <Title order={3}>Table Details</Title>

              <TextInput
                label="Table Name"
                placeholder="e.g., Products, Customers, Orders"
                description="A descriptive name for your table"
                required
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />

              <Textarea
                label="Description"
                placeholder="What is this table used for?"
                description="Optional description to help others understand the purpose of this table"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Stack>
          </Paper>

          {/* Column Builder */}
          <Paper p="lg" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={3}>Columns</Title>
                  <Text size="sm" c="dimmed">
                    Define the columns for your table. Each column has a name, data type, and
                    optional constraints.
                  </Text>
                </div>
                <Button size="sm" variant="light" onClick={handleAddColumn}>
                  Add Column
                </Button>
              </Group>

              <Divider />

              <ColumnBuilder
                columns={columns}
                onUpdateColumn={handleUpdateColumn}
                onRemoveColumn={handleRemoveColumn}
              />

              {columns.length === 0 && (
                <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                  Please add at least one column to your table
                </Alert>
              )}
            </Stack>
          </Paper>

          {/* Actions */}
          <Group justify="flex-end">
            <Button component={Link} href="/settings/schema/tables" variant="default">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconCheck size={16} />}
              disabled={!tableName.trim() || columns.length === 0}
            >
              Create Table
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}
