'use server'

/**
 * Server Actions for Dynamic Schema Management
 *
 * These actions wrap gRPC calls to the SchemaService, providing a clean
 * interface for the Next.js frontend to interact with the schema management system.
 */

import { schemaService } from '@/lib/grpc/schema-client'
import type {
  CreateTableRequestProto,
  ColumnDefinitionProto
} from '@/lib/grpc/schema-client'

// Type definitions matching the backend schema
export type DataType =
  | 'text'
  | 'text_long'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'json'
  | 'relation'

export interface ColumnDefinition {
  name: string
  data_type: DataType
  is_nullable?: boolean
  is_unique?: boolean
  default_value?: string
  foreign_key_to_table_id?: number
}

export interface CreateTableRequest {
  name: string
  description?: string
  columns: ColumnDefinition[]
}

export interface ColumnDetail {
  id: number
  name: string
  column_name: string
  data_type: DataType
  postgres_type: string
  is_nullable: boolean
  is_unique: boolean
  default_value?: string
  foreign_key_to_table_id?: number
  foreign_key_to_table_name?: string
  display_order: number
}

export interface TableDefinition {
  id: number
  name: string
  table_name: string
  description?: string
  columns: ColumnDetail[]
  created_at: string
  updated_at: string
}

export interface DataTypeInfo {
  type: DataType
  display_name: string
  description: string
  postgres_type: string
}

// API Response types
interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

/**
 * Get all available data types with descriptions
 */
export async function getDataTypes(): Promise<ApiResponse<DataTypeInfo[]>> {
  try {
    const response = await schemaService.getDataTypes({})

    if (!response.success) {
      return {
        success: false,
        error: 'Failed to retrieve data types'
      }
    }

    // Map protobuf response to our type
    const dataTypes: DataTypeInfo[] = response.data_types.map((dt) => ({
      type: dt.type as DataType,
      display_name: dt.display_name,
      description: dt.description,
      postgres_type: dt.postgres_type
    }))

    return {
      success: true,
      data: dataTypes
    }
  } catch (error) {
    console.error('Failed to get data types:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend service'
    }
  }
}

/**
 * Create a new user-defined table
 */
export async function createTable(
  request: CreateTableRequest
): Promise<ApiResponse<TableDefinition>> {
  try {
    // Validate request
    if (!request.name || request.name.trim() === '') {
      return {
        success: false,
        error: 'Table name is required'
      }
    }

    if (!request.columns || request.columns.length === 0) {
      return {
        success: false,
        error: 'At least one column is required'
      }
    }

    // Validate column names
    const columnNames = new Set<string>()
    for (const column of request.columns) {
      if (!column.name || column.name.trim() === '') {
        return {
          success: false,
          error: 'All columns must have a name'
        }
      }

      const normalizedName = column.name.toLowerCase().trim()
      if (columnNames.has(normalizedName)) {
        return {
          success: false,
          error: `Duplicate column name: ${column.name}`
        }
      }
      columnNames.add(normalizedName)

      // Validate relation columns
      if (column.data_type === 'relation' && !column.foreign_key_to_table_id) {
        return {
          success: false,
          error: `Column "${column.name}" is a relationship but no target table is specified`
        }
      }
    }

    // Convert to protobuf format
    const protoRequest: CreateTableRequestProto = {
      name: request.name,
      description: request.description,
      columns: request.columns.map((col): ColumnDefinitionProto => ({
        name: col.name,
        data_type: col.data_type,
        is_nullable: col.is_nullable ?? true,
        is_unique: col.is_unique ?? false,
        default_value: col.default_value,
        foreign_key_to_table_id: col.foreign_key_to_table_id
      }))
    }

    // Call gRPC service
    const response = await schemaService.createTable(protoRequest)

    if (!response.success) {
      return {
        success: false,
        error: response.message || 'Failed to create table'
      }
    }

    if (!response.table) {
      return {
        success: false,
        error: 'No table returned from server'
      }
    }

    // Map protobuf response to our type
    const table: TableDefinition = {
      id: response.table.id,
      name: response.table.name,
      table_name: response.table.table_name,
      description: response.table.description,
      columns: response.table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        column_name: col.column_name,
        data_type: col.data_type as DataType,
        postgres_type: col.postgres_type,
        is_nullable: col.is_nullable,
        is_unique: col.is_unique,
        default_value: col.default_value,
        foreign_key_to_table_id: col.foreign_key_to_table_id,
        foreign_key_to_table_name: col.foreign_key_to_table_name,
        display_order: col.display_order
      })),
      created_at: response.table.created_at,
      updated_at: response.table.updated_at
    }

    return {
      success: true,
      message: response.message || `Table "${request.name}" created successfully`,
      data: table
    }
  } catch (error) {
    console.error('Failed to create table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend service'
    }
  }
}

/**
 * Get a specific table by ID
 */
export async function getTable(tableId: number): Promise<ApiResponse<TableDefinition>> {
  try {
    if (!tableId || tableId <= 0) {
      return {
        success: false,
        error: 'Invalid table ID'
      }
    }

    const response = await schemaService.getTable({ table_id: tableId })

    if (!response.success) {
      return {
        success: false,
        error: response.message || 'Failed to get table'
      }
    }

    if (!response.table) {
      return {
        success: false,
        error: 'Table not found'
      }
    }

    // Map protobuf response to our type
    const table: TableDefinition = {
      id: response.table.id,
      name: response.table.name,
      table_name: response.table.table_name,
      description: response.table.description,
      columns: response.table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        column_name: col.column_name,
        data_type: col.data_type as DataType,
        postgres_type: col.postgres_type,
        is_nullable: col.is_nullable,
        is_unique: col.is_unique,
        default_value: col.default_value,
        foreign_key_to_table_id: col.foreign_key_to_table_id,
        foreign_key_to_table_name: col.foreign_key_to_table_name,
        display_order: col.display_order
      })),
      created_at: response.table.created_at,
      updated_at: response.table.updated_at
    }

    return {
      success: true,
      data: table
    }
  } catch (error) {
    console.error('Failed to get table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend service'
    }
  }
}

/**
 * List all user-defined tables
 */
export async function listTables(): Promise<ApiResponse<TableDefinition[]>> {
  try {
    const response = await schemaService.listTables({})

    if (!response.success) {
      return {
        success: false,
        error: response.message || 'Failed to list tables'
      }
    }

    // Map protobuf response to our type
    const tables: TableDefinition[] = response.tables.map((table) => ({
      id: table.id,
      name: table.name,
      table_name: table.table_name,
      description: table.description,
      columns: table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        column_name: col.column_name,
        data_type: col.data_type as DataType,
        postgres_type: col.postgres_type,
        is_nullable: col.is_nullable,
        is_unique: col.is_unique,
        default_value: col.default_value,
        foreign_key_to_table_id: col.foreign_key_to_table_id,
        foreign_key_to_table_name: col.foreign_key_to_table_name,
        display_order: col.display_order
      })),
      created_at: table.created_at,
      updated_at: table.updated_at
    }))

    return {
      success: true,
      data: tables,
      message: response.message
    }
  } catch (error) {
    console.error('Failed to list tables:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend service'
    }
  }
}

/**
 * Delete a table by ID
 */
export async function deleteTable(tableId: number): Promise<ApiResponse<void>> {
  try {
    if (!tableId || tableId <= 0) {
      return {
        success: false,
        error: 'Invalid table ID'
      }
    }

    const response = await schemaService.deleteTable({ table_id: tableId })

    return {
      success: response.success,
      message: response.message,
      error: response.success ? undefined : response.message
    }
  } catch (error) {
    console.error('Failed to delete table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend service'
    }
  }
}
