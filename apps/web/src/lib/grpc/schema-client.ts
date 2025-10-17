/**
 * gRPC Schema Service Client
 *
 * This module provides a typed interface to the SchemaService gRPC API
 * using dynamic proto loading with @grpc/proto-loader.
 *
 * This approach is simpler than static code generation and works well
 * with Next.js Server Actions.
 */

import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import * as path from 'path'
import { GRPC_SERVER_URL, createChannelCredentials } from './client'

// Type definitions matching our protobuf schema
export interface ColumnDefinitionProto {
  name: string
  data_type: string
  is_nullable?: boolean
  is_unique?: boolean
  default_value?: string
  foreign_key_to_table_id?: number
}

export interface CreateTableRequestProto {
  name: string
  description?: string
  columns: ColumnDefinitionProto[]
}

export interface ColumnDetailProto {
  id: number
  name: string
  column_name: string
  data_type: string
  postgres_type: string
  is_nullable: boolean
  is_unique: boolean
  default_value?: string
  foreign_key_to_table_id?: number
  foreign_key_to_table_name?: string
  display_order: number
}

export interface TableDefinitionProto {
  id: number
  name: string
  table_name: string
  description?: string
  columns: ColumnDetailProto[]
  created_at: string
  updated_at: string
}

export interface CreateTableResponseProto {
  success: boolean
  message?: string
  table?: TableDefinitionProto
}

export interface ListTablesResponseProto {
  success: boolean
  message?: string
  tables: TableDefinitionProto[]
}

export interface GetTableResponseProto {
  success: boolean
  message?: string
  table?: TableDefinitionProto
}

export interface DataTypeInfoProto {
  type: string
  display_name: string
  description: string
  postgres_type: string
}

export interface GetDataTypesResponseProto {
  success: boolean
  data_types: DataTypeInfoProto[]
}

export interface DeleteTableResponseProto {
  success: boolean
  message?: string
}

// gRPC Service Client Type
interface SchemaServiceClient {
  CreateTable(
    request: CreateTableRequestProto,
    callback: (error: grpc.ServiceError | null, response: CreateTableResponseProto) => void
  ): void

  GetTable(
    request: { table_id: number },
    callback: (error: grpc.ServiceError | null, response: GetTableResponseProto) => void
  ): void

  ListTables(
    request: Record<string, never>,
    callback: (error: grpc.ServiceError | null, response: ListTablesResponseProto) => void
  ): void

  GetDataTypes(
    request: Record<string, never>,
    callback: (error: grpc.ServiceError | null, response: GetDataTypesResponseProto) => void
  ): void

  DeleteTable(
    request: { table_id: number },
    callback: (error: grpc.ServiceError | null, response: DeleteTableResponseProto) => void
  ): void
}

// Singleton client instance
let schemaClient: SchemaServiceClient | null = null

/**
 * Get or create the Schema Service gRPC client
 */
function getSchemaClient(): SchemaServiceClient {
  if (schemaClient) {
    return schemaClient
  }

  // Locate the proto file
  const PROTO_PATH = path.join(process.cwd(), '..', '..', 'packages', 'proto', 'service.proto')

  // Load the proto file
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })

  // Load the gRPC package
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
  const proto = protoDescriptor.proto

  // Create the client
  schemaClient = new proto.SchemaService(
    GRPC_SERVER_URL,
    createChannelCredentials()
  ) as SchemaServiceClient

  return schemaClient
}

/**
 * Promisify gRPC calls
 */
function promisify<TRequest, TResponse>(
  fn: (request: TRequest, callback: (error: grpc.ServiceError | null, response: TResponse) => void) => void
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      fn.call(getSchemaClient(), request, (error, response) => {
        if (error) {
          reject(error)
        } else {
          resolve(response)
        }
      })
    })
  }
}

/**
 * Schema Service API - Promisified Methods
 */
export const schemaService = {
  /**
   * Create a new user-defined table
   */
  createTable: promisify<CreateTableRequestProto, CreateTableResponseProto>(
    getSchemaClient().CreateTable
  ),

  /**
   * Get a specific table by ID
   */
  getTable: promisify<{ table_id: number }, GetTableResponseProto>(
    getSchemaClient().GetTable
  ),

  /**
   * List all user-defined tables
   */
  listTables: promisify<Record<string, never>, ListTablesResponseProto>(
    getSchemaClient().ListTables
  ),

  /**
   * Get available data types
   */
  getDataTypes: promisify<Record<string, never>, GetDataTypesResponseProto>(
    getSchemaClient().GetDataTypes
  ),

  /**
   * Delete a table by ID
   */
  deleteTable: promisify<{ table_id: number }, DeleteTableResponseProto>(
    getSchemaClient().DeleteTable
  )
}

/**
 * Helper to check if gRPC is available
 */
export async function isGrpcAvailable(): Promise<boolean> {
  try {
    // Try to call GetDataTypes as a health check
    await schemaService.getDataTypes({})
    return true
  } catch (error) {
    console.error('gRPC health check failed:', error)
    return false
  }
}
