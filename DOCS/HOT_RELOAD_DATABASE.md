# Hot-Reload Database Connection Feature

## Overview

This feature allows you to update database credentials through the UI and have the Go backend automatically reload the connection **without restarting the server**. This is particularly useful for Railway deployments where you don't want to trigger a full container restart.

## How It Works

### 1. **Save Credentials in UI**
When you save database environment variables in the UI (`/settings/environment`):

```typescript
// apps/web/src/app/settings/environment/page.tsx
const handleSave = async () => {
  // 1. Save to encrypted storage
  await saveEnvironmentGroups(groups)

  // 2. Auto-export to .env file
  // (happens automatically in saveEnvironmentGroups)

  // 3. Test connection from frontend
  await testDatabaseConnection(pooledUrl)

  // 4. Hot-reload Go server connection
  await reloadDatabaseConnection() // ✨ NEW!
}
```

### 2. **Backend Reloads Connection**
The Go server receives a gRPC call and reloads the database connection:

```go
// apps/api/db/manager.go
func (m *Manager) Reload() error {
  // 1. Reload .env file
  godotenv.Load()

  // 2. Get new DATABASE_URL_POOLED
  pooledURL := os.Getenv("DATABASE_URL_POOLED")

  // 3. Close old connection
  m.database.Close()

  // 4. Create new connection
  db, err := NewConnection(pooledURL)
  m.database = db

  return nil
}
```

### 3. **Schema Service Uses Latest Connection**
All gRPC endpoints use the current database connection:

```go
// apps/api/grpc_server/schema_service.go
func (s *SchemaServiceServer) getSchemaManager() *schema_manager.SchemaManager {
  return schema_manager.NewSchemaManager(s.dbManager.GetPool())
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. User saves DATABASE_URL_POOLED in UI          │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │ 2. Auto-export to .env file                      │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │ 3. Call reloadDatabaseConnection() Server Action │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────┼────────────────────────────────────┘
                     │ gRPC: ReloadDatabase()
┌────────────────────▼────────────────────────────────────┐
│                  Backend (Go + gRPC)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 4. Manager.Reload() reads .env file              │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │ 5. Close old connection, create new connection   │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │ 6. All future requests use new connection        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key Files

### Frontend
- **[reload-actions.ts](../apps/web/src/app/settings/environment/reload-actions.ts)**: Server Action that calls gRPC ReloadDatabase endpoint
- **[page.tsx](../apps/web/src/app/settings/environment/page.tsx#L161)**: Automatically triggers reload after saving credentials

### Backend
- **[db/manager.go](../apps/api/db/manager.go)**: Database connection manager with hot-reload capability
- **[schema_service.go](../apps/api/grpc_server/schema_service.go#L152-L185)**: ReloadDatabase gRPC handler
- **[service.proto](../packages/proto/service.proto#L75)**: Protobuf definition for ReloadDatabase RPC

## Railway Deployment

### How It Works on Railway

✅ **The hot-reload feature works perfectly on Railway!**

1. **Environment Variables**: Railway provides environment variables that persist across container lifetime
2. **`.env` File**: When you save credentials in the UI, they're written to `.env` file (which persists in the container filesystem)
3. **Hot-Reload**: The `ReloadDatabase` endpoint reloads from the `.env` file without needing to restart the Railway service

### Railway Setup

#### Option 1: Use Railway Environment Variables (Recommended)
1. Set `DATABASE_URL_POOLED` and `DATABASE_URL_DIRECT` in Railway dashboard
2. These are available to the app at runtime
3. No need to use the UI for initial setup

#### Option 2: Use UI Only
1. Deploy without database environment variables
2. Visit `/settings/environment` on your deployed app
3. Add database credentials through the UI
4. Credentials are saved to `.env` file in the container
5. Hot-reload happens automatically

#### Option 3: Hybrid (Best for Production)
1. **Initial Deploy**: Use Railway environment variables for bootstrap
2. **Runtime Updates**: Use UI to change credentials without redeploying
3. **Persistence**: Railway's filesystem persists for the container lifetime

### Important Railway Notes

⚠️ **Container Restarts**: If Railway restarts your container (deploy, scaling, crash), the `.env` file is recreated from the build. Make sure to either:
- Keep important credentials in Railway's environment variables
- Or re-add them through the UI after a restart

💡 **Best Practice**: Use Railway environment variables as the source of truth, and use the UI hot-reload for temporary testing or quick credential rotation.

## Testing the Feature

### Local Testing

1. **Start servers**:
```bash
# Terminal 1: Go server
cd apps/api && go run main.go

# Terminal 2: Next.js
cd apps/web && pnpm dev
```

2. **Add database credentials**:
   - Visit `http://localhost:3000/settings/environment`
   - Navigate to "Database" group
   - Add `DATABASE_URL_POOLED` and `DATABASE_URL_DIRECT`
   - Click "Save All Changes"

3. **Verify hot-reload**:
   - Check console logs for "✅ Go server database reloaded"
   - Visit `/settings/schema/tables` - should now connect to your database
   - No server restart needed!

### Railway Testing

1. **Deploy to Railway**
2. **Visit your app URL** → `/settings/environment`
3. **Add credentials** and save
4. **Check logs**: Should see "Database connection reloaded successfully"
5. **Test Schema page**: Visit `/settings/schema/tables`

## Troubleshooting

### "Failed to reload database" Error

**Cause**: The `DATABASE_URL_POOLED` environment variable is missing or invalid.

**Solution**:
1. Check that you saved valid Neon connection strings
2. Verify the `.env` file was created: Check server logs for export confirmation
3. Try clicking "Export to .env File" manually if automatic export failed

### Go Server Not Picking Up New Credentials

**Cause**: The reload might have failed silently.

**Solution**:
1. Check Go server logs for errors
2. Manually restart the Go server as a fallback
3. Check that `.env` file exists and has correct format

### Railway Container Restart Loses Credentials

**Cause**: `.env` file is not persisted across deployments.

**Solution**:
- **Best**: Set `DATABASE_URL_POOLED` and `DATABASE_URL_DIRECT` in Railway dashboard environment variables
- **Alternative**: Use Railway's persistent volumes (advanced)

## Security Considerations

1. **Encryption**: Credentials are stored encrypted in `.env.local.encrypted`
2. **`.env` File**: Plain-text, added to `.gitignore`
3. **Railway**: Use Railway's environment variables for production secrets
4. **Rotation**: Use hot-reload to rotate credentials without downtime

## Future Enhancements

- [ ] Add authentication before allowing database reload
- [ ] Support multiple database connections (read replicas)
- [ ] Add connection pool health monitoring UI
- [ ] Persist `.env` changes to Railway environment variables automatically
- [ ] Add rollback capability if new connection fails

## Related Documentation

- [Neon Setup Guide](../NEON_SETUP_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
