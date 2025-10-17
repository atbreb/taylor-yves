'use client'

import { useEffect, useState } from 'react'
import {
  Paper,
  Grid,
  TextInput,
  Select,
  Checkbox,
  Group,
  ActionIcon,
  Text,
  Tooltip,
  Stack,
  NumberInput
} from '@mantine/core'
import {
  IconTrash,
  IconGripVertical,
  IconInfoCircle
} from '@tabler/icons-react'
import type { ColumnDefinition, DataType } from '@/app/actions/schema'

interface ColumnDefinitionRowProps {
  column: ColumnDefinition
  index: number
  onUpdate: (column: ColumnDefinition) => void
  onRemove: () => void
  canRemove: boolean
}

// Data type options with descriptions
const DATA_TYPE_OPTIONS = [
  {
    value: 'text',
    label: 'Text (Short)',
    description: 'Up to 255 characters - names, codes, short descriptions'
  },
  {
    value: 'text_long',
    label: 'Text (Long)',
    description: 'Unlimited length - notes, detailed descriptions'
  },
  {
    value: 'number',
    label: 'Number (Integer)',
    description: 'Whole numbers - quantities, counts'
  },
  {
    value: 'decimal',
    label: 'Number (Decimal)',
    description: 'Up to 8 decimal places - prices, measurements'
  },
  {
    value: 'boolean',
    label: 'True/False',
    description: 'Yes/No, On/Off values'
  },
  {
    value: 'date',
    label: 'Date & Time',
    description: 'Dates and times with timezone'
  },
  {
    value: 'json',
    label: 'JSON Data',
    description: 'Flexible structured data'
  },
  {
    value: 'relation',
    label: 'Relationship',
    description: 'Link to another table'
  }
]

export function ColumnDefinitionRow({
  column,
  index,
  onUpdate,
  onRemove,
  canRemove
}: ColumnDefinitionRowProps) {
  const [showDefaultValue, setShowDefaultValue] = useState(!!column.default_value)

  const selectedDataType = DATA_TYPE_OPTIONS.find((opt) => opt.value === column.data_type)

  const handleFieldChange = (field: keyof ColumnDefinition, value: any) => {
    onUpdate({
      ...column,
      [field]: value
    })
  }

  // Show/hide default value input based on data type
  useEffect(() => {
    // Relations can't have default values
    if (column.data_type === 'relation') {
      setShowDefaultValue(false)
      if (column.default_value) {
        handleFieldChange('default_value', undefined)
      }
    }
  }, [column.data_type])

  return (
    <Paper p="md" withBorder style={{ position: 'relative' }}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        {/* Drag Handle */}
        <ActionIcon variant="subtle" color="gray" style={{ cursor: 'grab', marginTop: 4 }}>
          <IconGripVertical size={16} />
        </ActionIcon>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <Stack gap="md">
            <Grid gutter="md">
              {/* Column Name */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <TextInput
                  label="Column Name"
                  placeholder="e.g., Product Name"
                  required
                  value={column.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </Grid.Col>

              {/* Data Type */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label={
                    <Group gap={4}>
                      <Text size="sm" fw={500}>
                        Data Type
                      </Text>
                      {selectedDataType && (
                        <Tooltip label={selectedDataType.description} multiline w={220}>
                          <IconInfoCircle size={14} style={{ opacity: 0.5 }} />
                        </Tooltip>
                      )}
                    </Group>
                  }
                  placeholder="Select type"
                  required
                  data={DATA_TYPE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                  value={column.data_type}
                  onChange={(value) => handleFieldChange('data_type', value as DataType)}
                  searchable
                />
              </Grid.Col>

              {/* Constraints */}
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Stack gap="xs" style={{ marginTop: 24 }}>
                  <Checkbox
                    label="Required"
                    description="Cannot be empty"
                    checked={!column.is_nullable}
                    onChange={(e) => handleFieldChange('is_nullable', !e.target.checked)}
                  />
                  <Checkbox
                    label="Unique"
                    description="Must be different for each row"
                    checked={column.is_unique}
                    onChange={(e) => handleFieldChange('is_unique', e.target.checked)}
                  />
                </Stack>
              </Grid.Col>
            </Grid>

            {/* Additional Options */}
            {column.data_type !== 'relation' && (
              <div>
                {!showDefaultValue ? (
                  <Text
                    size="sm"
                    c="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowDefaultValue(true)}
                  >
                    + Add default value
                  </Text>
                ) : (
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      {column.data_type === 'boolean' ? (
                        <Select
                          label="Default Value"
                          data={[
                            { value: 'true', label: 'True' },
                            { value: 'false', label: 'False' }
                          ]}
                          value={column.default_value}
                          onChange={(value) => handleFieldChange('default_value', value || undefined)}
                          clearable
                          onClear={() => setShowDefaultValue(false)}
                        />
                      ) : column.data_type === 'number' || column.data_type === 'decimal' ? (
                        <NumberInput
                          label="Default Value"
                          placeholder="0"
                          decimalScale={column.data_type === 'decimal' ? 8 : 0}
                          value={column.default_value ? Number(column.default_value) : undefined}
                          onChange={(value) =>
                            handleFieldChange('default_value', value?.toString())
                          }
                        />
                      ) : (
                        <TextInput
                          label="Default Value"
                          placeholder={
                            column.data_type === 'date'
                              ? 'e.g., 2024-01-01'
                              : 'Enter default value'
                          }
                          value={column.default_value || ''}
                          onChange={(e) =>
                            handleFieldChange(
                              'default_value',
                              e.target.value || undefined
                            )
                          }
                        />
                      )}
                    </Grid.Col>
                  </Grid>
                )}
              </div>
            )}

            {/* Relationship Options */}
            {column.data_type === 'relation' && (
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Link to Table"
                    placeholder="Select a table..."
                    description="Which table should this column link to?"
                    required
                    data={[
                      // TODO: Load actual tables from API
                      { value: '1', label: 'Example Table 1' },
                      { value: '2', label: 'Example Table 2' }
                    ]}
                    value={column.foreign_key_to_table_id?.toString()}
                    onChange={(value) =>
                      handleFieldChange(
                        'foreign_key_to_table_id',
                        value ? parseInt(value) : undefined
                      )
                    }
                    searchable
                  />
                </Grid.Col>
              </Grid>
            )}
          </Stack>
        </div>

        {/* Remove Button */}
        <Tooltip label={canRemove ? 'Remove column' : 'At least one column is required'}>
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={onRemove}
            disabled={!canRemove}
            style={{ marginTop: 4 }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  )
}
