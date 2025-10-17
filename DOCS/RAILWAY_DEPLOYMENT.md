# Railway Deployment Guide for Taylor-Yves

This guide will walk you through deploying your Taylor-Yves full-stack application to Railway, including setting up the Neon PostgreSQL database.

## Prerequisites

- [ ] GitHub account with your code pushed (✅ Already done!)
- [ ] Railway account (free tier works great)
- [ ] Neon account for PostgreSQL database (free tier available)

---

## Part 1: Set Up Neon Database (5 minutes)

### Step 1: Create Neon Account

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub (recommended) or email
3. Click **"Create a project"**

### Step 2: Create Database

1. **Project name**: `taylor-yves` (or your preferred name)
2. **Region**: Choose closest to your users (e.g., `US East (Ohio)`)
3. **PostgreSQL version**: 16 or 17 (latest)
4. Click **"Create Project"**

### Step 3: Get Connection Strings

After project creation, you'll see the **Connection Details** panel:

1. **Find the connection string selector** - it shows "Pooled connection" by default
2. Copy **BOTH** connection strings:

   **A. Pooled Connection** (for runtime queries):
   ```
   Click: "Pooled connection"
   Copy: postgresql://user:password@host-pooler.region.neon.tech/taylor_yves?sslmode=require
   ```

   **B. Direct Connection** (for migrations):
   ```
   Click: "Direct connection"
   Copy: postgresql://user:password@host.region.neon.tech/taylor_yves?sslmode=require
   ```

3. **Save these somewhere safe** - you'll need them for Railway environment variables

### Step 4: Test Connection (Optional)

```bash
# Test pooled connection
psql "YOUR_POOLED_CONNECTION_STRING" -c "SELECT version();"
```

✅ **Neon database is ready!**

---

## Part 2: Deploy to Railway (10 minutes)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub account

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select **`atbreb/taylor-yves`** repository
4. Railway will automatically detect your monorepo structure

### Step 3: Configure Services

Railway should detect your project automatically. You'll need to set up **two services**:

#### Service 1: API (Go Backend)

1. Railway will create a service automatically
2. **Name it**: `taylor-yves-api`
3. **Settings** → **General**:
   - Root Directory: `apps/api`
   - Build Command: (leave empty, Nixpacks handles it)
   - Start Command: `./main` (Railway will build the Go binary)

#### Service 2: Web (Next.js Frontend)

1. Click **"+ New"** → **"GitHub Repo"** → Select same repo
2. **Name it**: `taylor-yves-web`
3. **Settings** → **General**:
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && cd apps/web && pnpm build`
   - Start Command: `pnpm start`

### Step 4: Configure Environment Variables

#### For API Service (`taylor-yves-api`):

1. Go to **API service** → **Variables** tab
2. Click **"+ New Variable"** and add:

```bash
# Required - Database
DATABASE_URL_POOLED=postgresql://user:password@host-pooler.region.neon.tech/taylor_yves?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:password@host.region.neon.tech/taylor_yves?sslmode=require

# Required - Server Ports
HTTP_PORT=:8080
GRPC_PORT=:50051

# Optional - Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Optional - AI API Keys (if using AI features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
META_API_KEY=...
```

3. Click **"Add"** for each variable

#### For Web Service (`taylor-yves-web`):

1. Go to **Web service** → **Variables** tab
2. Add these variables:

```bash
# Required - Connect to API service
# Replace with your actual API service URL from Railway
GRPC_SERVER_ADDRESS=taylor-yves-api.railway.internal:50051

# Optional - If you want to manage env vars through UI
ENCRYPTION_KEY=same-key-as-api-service
```

**Important**: The `GRPC_SERVER_ADDRESS` should use Railway's internal networking:
- Format: `<api-service-name>.railway.internal:50051`
- This allows the Next.js server to call the Go gRPC server internally

### Step 5: Deploy!

1. Both services should deploy automatically after adding environment variables
2. Watch the **Deploy Logs** for each service
3. Wait for both to show **"Success"** (this takes 2-5 minutes)

### Step 6: Get Your URLs

1. **API Service**:
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - You'll get: `taylor-yves-api.up.railway.app`

2. **Web Service**:
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - You'll get: `taylor-yves-web.up.railway.app`

✅ **Your app is now deployed!**

---

## Part 3: Test Your Deployment (5 minutes)

### Step 1: Visit Your App

Open your web URL: `https://taylor-yves-web.up.railway.app`

You should see your Taylor-Yves homepage!

### Step 2: Test Database Connection

1. Navigate to: `/settings/environment`
2. You should see the **Database** group
3. Check for the **green "Connected" badge** next to "Database"
   - ✅ Green = Database connected successfully
   - 🔴 Red = Check your environment variables

### Step 3: Test Schema Management

1. Navigate to: `/settings/schema/tables`
2. You should see "No tables found" (this is correct for a fresh database)
3. Try creating a test table:
   - Click **"Create New Table"**
   - Name: `test_table`
   - Add a column: `name` (type: text)
   - Click **"Create Table"**
4. Verify the table appears in the list

### Step 4: Check Logs (if issues)

**API Service Logs**:
```
Railway Dashboard → API Service → Deployments → View Logs
```

Look for:
- ✅ `gRPC server starting on port :50051`
- ✅ `HTTP server starting on port :8080`
- ✅ Database connection successful

**Web Service Logs**:
```
Railway Dashboard → Web Service → Deployments → View Logs
```

Look for:
- ✅ `ready started server on 0.0.0.0:3000`
- ✅ No connection errors

---

## Part 4: Update Database Credentials (Using Hot-Reload!)

One of the cool features we built: you can update database credentials **without redeploying**!

### Option 1: Through Railway Dashboard (Traditional)

1. Go to **API Service** → **Variables**
2. Update `DATABASE_URL_POOLED` or `DATABASE_URL_DIRECT`
3. Railway will automatically restart the service

### Option 2: Through Your App UI (Hot-Reload!) 🔥

1. Visit: `https://taylor-yves-web.up.railway.app/settings/environment`
2. Navigate to **Database** group
3. Update `DATABASE_URL_POOLED` or `DATABASE_URL_DIRECT`
4. Click **"Save All Changes"**
5. The Go server will **reload the connection without restarting!** ✨

The second option is faster and doesn't trigger a full deployment!

---

## Troubleshooting

### Issue: Web service can't connect to API service

**Error**: `ECONNREFUSED 127.0.0.1:50051`

**Solution**:
1. Make sure `GRPC_SERVER_ADDRESS` in web service uses Railway internal networking:
   ```
   GRPC_SERVER_ADDRESS=taylor-yves-api.railway.internal:50051
   ```
2. Verify both services are in the same Railway project
3. Redeploy the web service after changing the variable

### Issue: Database connection failed

**Error**: Red "Disconnected" badge or "database not configured"

**Solution**:
1. Verify `DATABASE_URL_POOLED` in API service environment variables
2. Check that the Neon database is active (not suspended)
3. Test the connection string locally:
   ```bash
   psql "YOUR_CONNECTION_STRING" -c "SELECT 1;"
   ```
4. Make sure the connection string ends with `?sslmode=require`

### Issue: Build fails with "pnpm not found"

**Solution**:
Add to your service's environment variables:
```
NIXPACKS_INSTALL_PNPM=1
```

### Issue: Go service fails to start

**Check logs for**:
- Missing environment variables (DATABASE_URL_POOLED, etc.)
- Port conflicts (should use :8080 and :50051)
- Database connection errors

**Solution**:
1. Verify all required environment variables are set
2. Check API service logs for specific error messages
3. Ensure Neon database is accessible from Railway's region

### Issue: "Module not found" errors

**Solution**:
1. Make sure `pnpm install` runs from the monorepo root:
   ```
   Build Command: cd ../.. && pnpm install && cd apps/web && pnpm build
   ```
2. Check that `turbo` and workspace dependencies are installed

---

## Cost Estimate

### Free Tier (Both Railway & Neon)

**Railway**:
- ✅ $5/month free credit
- ✅ 500 hours execution time (plenty for 2 services)
- ✅ Suitable for development/testing

**Neon**:
- ✅ Free tier: 512 MB storage
- ✅ 1 project with unlimited databases
- ✅ Perfect for getting started

**Total**: $0/month for development! 🎉

### Paid Tier (Production)

**Railway** (~$20-30/month):
- 2 services running 24/7
- Automatic scaling
- Custom domains

**Neon** (~$19/month):
- Pro plan with more storage
- Higher compute limits
- Better performance

**Total**: ~$40-50/month for production

---

## Advanced: Custom Domain

### Step 1: Add Custom Domain to Web Service

1. Go to **Web Service** → **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Enter your domain: `app.yourdomain.com`
4. Railway will provide CNAME record

### Step 2: Update DNS

Add to your DNS provider:
```
Type: CNAME
Name: app
Value: taylor-yves-web.up.railway.app
```

### Step 3: Wait for SSL

Railway automatically provisions SSL certificates (takes 5-10 minutes)

---

## Next Steps

Once deployed:

1. ✅ Visit `/settings/environment` to manage environment variables
2. ✅ Visit `/settings/schema/tables` to create your first table
3. ✅ Visit `/settings/api-keys` to add AI API keys
4. ✅ Test the hot-reload feature by updating database credentials

## Monitoring

### Railway Dashboard

- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments

### Neon Console

- **Connection pooler**: Monitor active connections
- **Queries**: See database query performance
- **Storage**: Track database size

---

## Useful Commands

```bash
# View Railway logs locally (if you install Railway CLI)
railway logs

# Connect to your Neon database
psql "YOUR_POOLED_CONNECTION_STRING"

# Check if services are running
curl https://taylor-yves-api.up.railway.app/health
curl https://taylor-yves-web.up.railway.app

# Test gRPC connection (requires grpcurl)
grpcurl -plaintext taylor-yves-api.up.railway.app:50051 list
```

---

## Summary

You now have:
- ✅ Taylor-Yves deployed on Railway
- ✅ Neon PostgreSQL database connected
- ✅ Hot-reload database credentials
- ✅ Visual status indicators
- ✅ Environment variable management UI
- ✅ Schema management system

**Your deployment URL**: `https://taylor-yves-web.up.railway.app`

Need help? Check the [Hot-Reload Documentation](./HOT_RELOAD_DATABASE.md) or [Neon Setup Guide](../NEON_SETUP_GUIDE.md)!
