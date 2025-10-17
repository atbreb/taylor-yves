import { credentials, ChannelCredentials } from '@grpc/grpc-js'

// gRPC client configuration
export const GRPC_SERVER_URL = process.env.GRPC_SERVER_URL || 'localhost:50051'

// Create channel credentials
export const createChannelCredentials = (): ChannelCredentials => {
  if (process.env.NODE_ENV === 'production') {
    // Use SSL credentials in production
    return credentials.createSsl()
  } else {
    // Use insecure credentials in development
    return credentials.createInsecure()
  }
}

// gRPC client options
export const grpcClientOptions = {
  'grpc.keepalive_time_ms': 30000,
  'grpc.keepalive_timeout_ms': 5000,
  'grpc.keepalive_permit_without_calls': true,
  'grpc.http2.max_pings_without_data': 0,
  'grpc.http2.min_time_between_pings_ms': 10000,
  'grpc.http2.min_ping_interval_without_data_ms': 300000,
}