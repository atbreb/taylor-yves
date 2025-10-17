'use server'

import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

// Load the protobuf definition
const PROTO_PATH = path.join(process.cwd(), '../../packages/proto/service.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const SchemaService = protoDescriptor.proto.SchemaService

// gRPC server address
const GRPC_SERVER_ADDRESS = process.env.GRPC_SERVER_ADDRESS || 'localhost:50051'

/**
 * Reloads the database connection on the Go server
 * Call this after updating DATABASE_URL_POOLED in environment variables
 */
export async function reloadDatabaseConnection(): Promise<{
  success: boolean
  message: string
  databaseInfo?: string
}> {
  return new Promise((resolve) => {
    const client = new SchemaService(
      GRPC_SERVER_ADDRESS,
      grpc.credentials.createInsecure()
    )

    // Call the ReloadDatabase RPC
    client.ReloadDatabase({}, (error: any, response: any) => {
      client.close()

      if (error) {
        console.error('Failed to reload database connection:', error)
        resolve({
          success: false,
          message: `Failed to reload: ${error.message}`
        })
        return
      }

      resolve({
        success: response.success,
        message: response.message,
        databaseInfo: response.database_info
      })
    })
  })
}
