# 🚂 Railway Deployment - Quick Start Checklist

Follow this checklist to deploy Taylor-Yves to Railway in ~15 minutes!

## ☑️ Pre-Deployment Checklist

- [x] Code pushed to GitHub (`atbreb/taylor-yves`) ✅
- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] Neon account created ([console.neon.tech](https://console.neon.tech))

---

## 📋 Step-by-Step Deployment

### 1️⃣ Set Up Neon Database (5 min)

- [ ] Go to [console.neon.tech](https://console.neon.tech)
- [ ] Click "Create a project"
- [ ] Name: `taylor-yves`
- [ ] Region: Choose closest to you
- [ ] Copy **Pooled Connection String**: `postgresql://...pooler...`
- [ ] Copy **Direct Connection String**: `postgresql://...` (without pooler)
- [ ] ✅ Save both connection strings

### 2️⃣ Deploy to Railway (10 min)

#### Create Project
- [ ] Go to [railway.app](https://railway.app)
- [ ] Login with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `atbreb/taylor-yves`

#### Configure API Service
- [ ] Railway creates first service automatically
- [ ] Rename to: `taylor-yves-api`
- [ ] **Settings** → **General**:
  - [ ] Root Directory: `apps/api`
- [ ] **Variables** tab → Add:
  ```
  DATABASE_URL_POOLED=<your-pooled-connection-string>
  DATABASE_URL_DIRECT=<your-direct-connection-string>
  HTTP_PORT=:8080
  GRPC_PORT=:50051
  ```
- [ ] Click "Deploy" (wait ~2 minutes)
- [ ] **Settings** → **Networking** → "Generate Domain"
- [ ] ✅ Save API URL: `______.up.railway.app`

#### Configure Web Service
- [ ] Click "+ New" → "GitHub Repo" → Same repo
- [ ] Rename to: `taylor-yves-web`
- [ ] **Settings** → **General**:
  - [ ] Root Directory: `apps/web`
- [ ] **Variables** tab → Add:
  ```
  GRPC_SERVER_ADDRESS=taylor-yves-api.railway.internal:50051
  ```
- [ ] Click "Deploy" (wait ~3 minutes)
- [ ] **Settings** → **Networking** → "Generate Domain"
- [ ] ✅ Your app URL: `______.up.railway.app`

### 3️⃣ Test Deployment (2 min)

- [ ] Visit your web URL: `https://______.up.railway.app`
- [ ] Navigate to `/settings/environment`
- [ ] Check for **green "Connected" badge** (database working!)
- [ ] Navigate to `/settings/schema/tables`
- [ ] Try creating a test table
- [ ] ✅ Everything works!

---

## 🎉 You're Done!

Your Taylor-Yves app is now live on Railway!

### What You Have:
✅ Full-stack app deployed
✅ PostgreSQL database connected
✅ Hot-reload database credentials
✅ Visual status indicators
✅ Environment variable management

### Next Steps:
- [ ] Add AI API keys at `/settings/api-keys`
- [ ] Set up custom domain (optional)
- [ ] Monitor usage in Railway dashboard

---

## 🆘 Troubleshooting

### Red "Disconnected" Badge?
1. Check `DATABASE_URL_POOLED` in API service variables
2. Verify Neon database is active
3. Test connection string: `psql "YOUR_CONNECTION_STRING" -c "SELECT 1;"`

### Can't Connect to API Service?
1. Make sure web service has: `GRPC_SERVER_ADDRESS=taylor-yves-api.railway.internal:50051`
2. Verify both services are in same Railway project
3. Check API service logs for errors

### Build Failed?
1. Check deploy logs in Railway dashboard
2. Verify nixpacks.toml files are committed
3. Try redeploying from Railway dashboard

---

## 📚 Full Documentation

For detailed instructions, see:
- [Complete Railway Deployment Guide](./DOCS/RAILWAY_DEPLOYMENT.md)
- [Hot-Reload Database Documentation](./DOCS/HOT_RELOAD_DATABASE.md)
- [Neon Setup Guide](./NEON_SETUP_GUIDE.md)

---

## 💰 Cost

**Free Tier** (both Railway & Neon):
- $5/month Railway credit (enough for 2 services)
- Neon free tier: 512 MB storage
- **Total: $0/month for development!** 🎉

**Paid Tier** (production):
- Railway: ~$20-30/month
- Neon Pro: ~$19/month
- **Total: ~$40-50/month**
