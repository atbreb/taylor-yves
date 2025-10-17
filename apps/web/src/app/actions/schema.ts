'use server'

/**
 * Server Actions for Dynamic Schema Management
 *
 * These actions wrap gRPC calls to the SchemaService, providing a clean
 * interface for the Next.js frontend to interact with the schema management system.
 *
 * Note: For now, we're using a simplified approach with fetch to the Go HTTP API.
 * In the future, this can be enhanced to use the gRPC client directly.
 */

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

// For now, we'll create a mock implementation that simulates the API
// Once the Go HTTP endpoints are added, we can replace these with actual fetch calls

const MOCK_DATA_TYPES: DataTypeInfo[] = [
  {
    type: 'text',
    display_name: 'Text (Short)',
    description: 'Short text up to 255 characters (names, codes, descriptions)',
    postgres_type: 'VARCHAR(255)'
  },
  {
    type: 'text_long',
    display_name: 'Text (Long)',
    description: 'Long text with no length limit (notes, detailed descriptions)',
    postgres_type: 'TEXT'
  },
  {
    type: 'number',
    display_name: 'Number (Integer)',
    description: 'Whole numbers without decimals (quantities, IDs, counts)',
    postgres_type: 'INTEGER'
  },
  {
    type: 'decimal',
    display_name: 'Number (Decimal)',
    description: 'Numbers with up to 8 decimal places (prices, percentages, measurements)',
    postgres_type: 'DECIMAL(18,8)'
  },
  {
    type: 'boolean',
    display_name: 'True/False',
    description: 'Yes/No, True/False, On/Off values',
    postgres_type: 'BOOLEAN'
  },
  {
    type: 'date',
    display_name: 'Date & Time',
    description: 'Dates and times with timezone support',
    postgres_type: 'TIMESTAMPTZ'
  },
  {
    type: 'json',
    display_name: 'JSON Data',
    description: 'Flexible structured data in JSON format',
    postgres_type: 'JSONB'
  },
  {
    type: 'relation',
    display_name: 'Relationship',
    description: 'Link to another table (foreign key relationship)',
    postgres_type: 'INTEGER'
  }
]

/**
 * Get all available data types with descriptions
 */
export async function getDataTypes(): Promise<ApiResponse<DataTypeInfo[]>> {
  try {
    // TODO: Replace with actual gRPC/HTTP call
    // For now, return mock data
    return {
      success: true,
      data: MOCK_DATA_TYPES
    }
  } catch (error) {
    console.error('Failed to get data types:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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

    // TODO: Replace with actual gRPC call
    // const response = await grpcClient.createTable(request)

    // For now, simulate a successful response
    const mockResponse: TableDefinition = {
      id: Math.floor(Math.random() * 1000),
      name: request.name,
      table_name: `user_table_${request.name.toLowerCase().replace(/\s+/g, '_')}`,
      description: request.description,
      columns: request.columns.map((col, index) => ({
        id: index + 1,
        name: col.name,
        column_name: col.name.toLowerCase().replace(/\s+/g, '_'),
        data_type: col.data_type,
        postgres_type: getPostgresType(col.data_type),
        is_nullable: col.is_nullable ?? true,
        is_unique: col.is_unique ?? false,
        default_value: col.default_value,
        foreign_key_to_table_id: col.foreign_key_to_table_id,
        display_order: index
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      success: true,
      message: `Table "${request.name}" created successfully`,
      data: mockResponse
    }
  } catch (error) {
    console.error('Failed to create table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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

    // TODO: Replace with actual gRPC call
    // const response = await grpcClient.getTable({ table_id: tableId })

    return {
      success: false,
      error: 'Table not found (mock implementation)'
    }
  } catch (error) {
    console.error('Failed to get table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * List all user-defined tables
 */
export async function listTables(): Promise<ApiResponse<TableDefinition[]>> {
  try {
    // TODO: Replace with actual gRPC call
    // const response = await grpcClient.listTables({})

    // For now, return empty array
    return {
      success: true,
      data: [],
      message: 'No tables found (mock implementation)'
    }
  } catch (error) {
    console.error('Failed to list tables:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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

    // TODO: Replace with actual gRPC call
    // const response = await grpcClient.deleteTable({ table_id: tableId })

    return {
      success: false,
      error: 'Table deletion not yet implemented'
    }
  } catch (error) {
    console.error('Failed to delete table:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper function to map data types to PostgreSQL types
function getPostgresType(dataType: DataType): string {
  const mapping: Record<DataType, string> = {
    text: 'VARCHAR(255)',
    text_long: 'TEXT',
    number: 'INTEGER',
    decimal: 'DECIMAL(18,8)',
    boolean: 'BOOLEAN',
    date: 'TIMESTAMPTZ',
    json: 'JSONB',
    relation: 'INTEGER'
  }
  return mapping[dataType] || 'TEXT'
}
