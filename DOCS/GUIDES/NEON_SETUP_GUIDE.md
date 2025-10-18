# Neon Database Setup Guide

This guide shows you how to set up your Neon PostgreSQL database using the **Environment Variables UI** - no manual `.env` file editing required!

## Overview

Your app uses two connection strings from Neon:
- **DATABASE_URL_POOLED**: For runtime queries (high concurrency, uses connection pooler)
- **DATABASE_URL_DIRECT**: For database migrations (direct connection, supports schema changes)

**New Features:**
- Automatic `.env` file export when you save (no manual export needed!)
- Real-time database connection testing with visual status indicators:
  - 🟢 **Green badge** = Connected successfully
  - 🔴 **Red badge** = Connection failed (hover for details)
  - ⚫ **Gray badge** = No database configured
  - 🔵 **Blue badge** = Testing connection...

## Step 1: Create a Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up or log in
3. Click **"New Project"**
4. Choose:
   - **Project name**: `taylor-yves` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `US East (N. Virginia)`)
   - **PostgreSQL version**: Latest (15+)
5. Click **"Create Project"**

## Step 2: Get Your Connection Strings

1. In your Neon project dashboard, click **"Connection Details"**
2. You'll see a connection string like:
   ```
   postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. **Get both connection strings:**

   **Pooled Connection** (for runtime):
   - Toggle the dropdown to show **"Pooled connection"**
   - The hostname will include `-pooler` (e.g., `ep-cool-name-123456-pooler.us-east-2.aws.neon.tech`)
   - Copy this entire connection string

   **Direct Connection** (for migrations):
   - Toggle to **"Direct connection"**
   - The hostname will NOT have `-pooler` (e.g., `ep-cool-name-123456.us-east-2.aws.neon.tech`)
   - Copy this entire connection string

## Step 3: Add to Environment Variables UI

1. **Start your Next.js development server** (if not already running):
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Navigate to the Environment Settings page**:
   - Open [http://localhost:3000/settings/environment](http://localhost:3000/settings/environment)
   - You should see the "Database" group (🗄️ icon)

3. **Add the Pooled Connection**:
   - Click **"Add Variable"** button
   - Fill in:
     - **Key**: `DATABASE_URL_POOLED`
     - **Value**: Paste your pooled connection string (the one WITH `-pooler`)
     - **Description**: `Neon pooled connection for runtime queries`
     - ✅ Check **"Secret"** checkbox (to hide the value)

4. **Add the Direct Connection**:
   - Click **"Add Variable"** again
   - Fill in:
     - **Key**: `DATABASE_URL_DIRECT`
     - **Value**: Paste your direct connection string (the one WITHOUT `-pooler`)
     - **Description**: `Neon direct connection for migrations`
     - ✅ Check **"Secret"** checkbox

5. **Save Your Changes**:
   - Click **"Save All Changes"** at the bottom
   - The app will automatically:
     - Save your variables to encrypted storage
     - Export them to the `.env` file
     - Test the database connection
   - You should see a **green "Connected" badge** appear if the connection works
   - If the connection fails, you'll see a **red "Disconnected" badge** with error details

## Step 4: Restart Your Go Server

Now restart your Go server to load the new database connection strings:

```bash
# From the project root
cd apps/api
go run main.go
```

You should see output like:
```
2025-10-17 00:00:00 INFO Starting Taylor-Yves API Server
2025-10-17 00:00:00 INFO Database connected successfully
2025-10-17 00:00:00 INFO Running migrations...
2025-10-17 00:00:00 INFO Migrations completed successfully
2025-10-17 00:00:00 INFO HTTP server listening on :8080
2025-10-17 00:00:00 INFO gRPC server listening on :50051
```

## Step 5: Verify Database Setup

You can verify everything is working by:

1. **Check the database tables**:
   ```bash
   psql "YOUR_DIRECT_CONNECTION_STRING" -c "\dt"
   ```

   You should see tables like:
   - `configurable_tables`
   - `configurable_columns`
   - `schema_change_log`
   - `schema_migrations`

2. **Test the Schema Builder**:
   - Navigate to [http://localhost:3000/settings/schema/tables](http://localhost:3000/settings/schema/tables)
   - Try creating a test table through the UI

## Bonus: Sync to Railway (Optional)

If you're deploying to Railway, you can sync these environment variables automatically:

1. In the Environment Settings page, scroll to the **"Railway Integration"** card
2. Get your Railway credentials:
   - Go to [railway.app](https://railway.app)
   - Click your profile → Account Settings → Tokens
   - Create a new token
   - Copy your Project ID from your project settings
3. Enter your Railway API Token and Project ID
4. Click **"Test Connection"** to verify
5. Click **"Sync to Railway"** to upload all variables
6. (Optional) Click **"Sync & Deploy"** to sync and trigger a deployment

## Troubleshooting

### Connection Failed

If the connection test fails:
- ✅ Check that your connection string is complete (includes `?sslmode=require`)
- ✅ Verify you copied the correct string from Neon (pooled vs direct)
- ✅ Make sure your Neon project is active (not suspended)
- ✅ Check that your IP is not blocked (Neon allows all by default)

### Go Server Can't Connect

If your Go server can't connect:
- ✅ Make sure you saved your environment variables (this automatically exports to `.env`)
- ✅ Restart your Go server after saving
- ✅ Check the `.env` file exists at the project root
- ✅ Verify the connection strings in `.env` are correct
- ✅ If needed, click "Export to .env File" manually to force a re-export

### Migrations Fail

If migrations fail:
- ✅ Use the `DATABASE_URL_DIRECT` connection (not pooled)
- ✅ Check that the database exists
- ✅ Verify you have write permissions
- ✅ Look at the migration logs in your Go server output

## Architecture Notes

### Why Two Connection Strings?

1. **Pooled Connection (DATABASE_URL_POOLED)**:
   - Routes through PgBouncer connection pooler
   - Supports up to 10,000 concurrent connections
   - Perfect for serverless/high-concurrency applications
   - Used for all runtime queries (SELECT, INSERT, UPDATE, DELETE)

2. **Direct Connection (DATABASE_URL_DIRECT)**:
   - Direct connection to PostgreSQL
   - Supports session-level features (SET, LISTEN/NOTIFY, etc.)
   - Required for schema migrations (CREATE TABLE, ALTER TABLE, etc.)
   - Used only for migrations and admin tasks

### Security

- All environment variables are encrypted using AES-256-GCM
- The encryption key is stored in `.encryption.key` (gitignored)
- For production, set `ENCRYPTION_KEY` environment variable
- Secrets are marked with the "Secret" checkbox and hidden in the UI

## Next Steps

Now that your database is set up:

1. ✅ Create custom tables using the Schema Builder at `/settings/schema/tables`
2. ✅ Add AI API keys in the "AI Providers" group
3. ✅ Set up Railway deployment and sync variables
4. ✅ Configure any custom NetSuite or other integrations

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Railway Documentation](https://docs.railway.app)
- [Project Documentation](./README.md)
