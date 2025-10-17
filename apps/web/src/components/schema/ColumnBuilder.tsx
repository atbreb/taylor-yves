'use client'

import { Stack } from '@mantine/core'
import { ColumnDefinitionRow } from './ColumnDefinitionRow'
import type { ColumnDefinition } from '@/app/actions/schema'

interface ColumnBuilderProps {
  columns: ColumnDefinition[]
  onUpdateColumn: (index: number, column: ColumnDefinition) => void
  onRemoveColumn: (index: number) => void
}

export function ColumnBuilder({ columns, onUpdateColumn, onRemoveColumn }: ColumnBuilderProps) {
  return (
    <Stack gap="md">
      {columns.map((column, index) => (
        <ColumnDefinitionRow
          key={index}
          column={column}
          index={index}
          onUpdate={(col) => onUpdateColumn(index, col)}
          onRemove={() => onRemoveColumn(index)}
          canRemove={columns.length > 1}
        />
      ))}
    </Stack>
  )
}
