import { Suspense } from 'react'
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Badge,
  Table,
  ActionIcon,
  Skeleton
} from '@mantine/core'
import { IconPlus, IconTable, IconEdit, IconTrash, IconEye } from '@tabler/icons-react'
import Link from 'next/link'
import { listTables } from '@/app/actions/schema'

async function TablesList() {
  const response = await listTables()

  if (!response.success) {
    return (
      <Paper p="xl" withBorder>
        <Text c="red">Error loading tables: {response.error}</Text>
      </Paper>
    )
  }

  const tables = response.data || []

  if (tables.length === 0) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Stack align="center" gap="md">
          <IconTable size={64} stroke={1.5} style={{ opacity: 0.3 }} />
          <div>
            <Title order={3}>No tables yet</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Get started by creating your first custom table
            </Text>
          </div>
          <Button
            component={Link}
            href="/settings/schema/tables/new"
            leftSection={<IconPlus size={16} />}
            size="md"
          >
            Create Your First Table
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Columns</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tables.map((table) => (
            <Table.Tr key={table.id}>
              <Table.Td>
                <Group gap="xs">
                  <IconTable size={16} />
                  <Text fw={500}>{table.name}</Text>
                  <Badge size="xs" variant="light">
                    {table.table_name}
                  </Badge>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {table.description || '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="light">{table.columns.length} columns</Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {new Date(table.created_at).toLocaleDateString()}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    component={Link}
                    href={`/settings/schema/tables/${table.id}`}
                    variant="subtle"
                    color="blue"
                    title="View details"
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon
                    component={Link}
                    href={`/settings/schema/tables/${table.id}/edit`}
                    variant="subtle"
                    color="gray"
                    title="Edit table"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    title="Delete table"
                    onClick={() => {
                      // TODO: Implement delete confirmation
                      alert('Delete functionality coming soon!')
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

function TablesListSkeleton() {
  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        {[...Array(3)].map((_, i) => (
          <Group key={i} justify="space-between">
            <Skeleton height={24} width="30%" />
            <Skeleton height={24} width="40%" />
            <Skeleton height={24} width="15%" />
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}

export default function SchemaTablesPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Database Tables</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Create and manage custom tables for your application. Define your own data
              structures with flexible column types and relationships.
            </Text>
          </div>
          <Button
            component={Link}
            href="/settings/schema/tables/new"
            leftSection={<IconPlus size={16} />}
          >
            Create Table
          </Button>
        </Group>

        {/* Info Banner */}
        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Group gap="md">
            <IconTable size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <div style={{ flex: 1 }}>
              <Text fw={500} size="sm">
                What are custom tables?
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Custom tables allow you to define your own data structures. Each table can
                have multiple columns with different data types (text, numbers, dates, etc.)
                and can be linked to other tables through relationships.
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Tables List */}
        <Suspense fallback={<TablesListSkeleton />}>
          <TablesList />
        </Suspense>
      </Stack>
    </Container>
  )
}

export const metadata = {
  title: 'Database Tables | Schema Management',
  description: 'Manage custom database tables and schemas'
}
