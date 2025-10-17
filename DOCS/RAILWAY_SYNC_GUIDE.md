# Railway Environment Variable Sync Guide

## Overview

Your Taylor-Yves app includes a powerful feature that allows you to **automatically sync environment variables from your UI directly to Railway**! This means you can manage all your configuration in one place and push it to your Railway deployment with a single click.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                 Your Application UI                         │
│     (/settings/environment → Railway Sync Card)             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ 1. Click "Sync to Railway"
                   ↓
┌──────────────────────────────────────────────────────────────┐
│          Railway GraphQL API                                 │
│  (variableUpsert mutation for each variable)                │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ 2. Variables updated
                   ↓
┌──────────────────────────────────────────────────────────────┐
│        Railway Project Environment Variables                 │
│     (DATABASE_URL_POOLED, API_KEYS, etc.)                   │
└──────────────────────────────────────────────────────────────┘
```

## Setup (One-Time)

### Step 1: Get Railway API Token

1. Go to [railway.app](https://railway.app)
2. Click your profile (bottom left) → **Account Settings**
3. Go to **Tokens** tab
4. Click **Create New Token**
5. Name it: `taylor-yves-sync` (or whatever you prefer)
6. Copy the token (starts with `railway_`)
7. **Save it securely** - you'll need it in the UI

### Step 2: Get Railway Project ID

1. Go to your Railway project dashboard
2. Click **Settings** (in the left sidebar)
3. Scroll to **Project ID**
4. Copy the ID (looks like: `abc123-def456-ghi789`)

### Step 3: (Optional) Get Environment ID

If you want to sync to a specific environment (not production):

1. In your Railway project, go to the environment you want
2. Click **Settings** → **Environment ID**
3. Copy the ID

---

## Using Railway Sync

### Step 1: Open Environment Settings

Navigate to: `https://your-app.railway.app/settings/environment`

Scroll down to the **"Railway Integration"** card.

### Step 2: Enter Railway Credentials

1. **Railway API Token**: Paste your token from setup
2. **Railway Project ID**: Paste your project ID
3. **Railway Environment ID**: (Optional) Leave empty for production

### Step 3: Test Connection

Click **"Test Connection"** to verify your credentials work.

You should see: ✅ "Successfully connected to Railway. Found X variables."

### Step 4: Compare Variables (Optional)

Click **"Compare Variables"** to see what will change:

- **Green (Matching)**: Variables that are the same in both places
- **Blue (Local Only)**: New variables that will be added to Railway
- **Orange (Different Values)**: Variables that will be updated on Railway
- **Gray (Railway Only)**: Variables only on Railway (won't be touched)

### Step 5: Sync!

Choose one of two options:

**Option A: Sync Only**
- Click **"Sync to Railway"**
- Variables are updated on Railway
- Services will use new values on next request (no restart needed with hot-reload!)

**Option B: Sync & Deploy**
- Click **"Sync & Deploy"**
- Variables are updated AND Railway triggers a redeploy
- Use this if you want to ensure all services restart with new config

---

## Use Cases

### 1. Initial Setup

**Scenario**: You just deployed to Railway and need to add all your environment variables.

**Steps**:
1. Add all your variables in the UI (`/settings/environment`)
2. Go to Railway Sync card
3. Enter credentials
4. Click **"Sync to Railway"**
5. Done! All variables are now in Railway

### 2. Update Database Credentials

**Scenario**: You rotated your Neon database password and need to update Railway.

**Steps**:
1. Update `DATABASE_URL_POOLED` in UI
2. Click **"Save All Changes"** (triggers local hot-reload)
3. Click **"Sync to Railway"**
4. Railway services now use new credentials (hot-reload!)

### 3. Add New API Key

**Scenario**: You signed up for OpenAI and want to add the API key.

**Steps**:
1. Go to `/settings/environment` → **AI Providers** group
2. Add `OPENAI_API_KEY` with your key
3. Click **"Save All Changes"**
4. Scroll to Railway Sync card
5. Click **"Sync to Railway"**
6. Your Railway deployment can now use OpenAI!

### 4. Sync All Settings to New Environment

**Scenario**: You want to create a staging environment with the same config.

**Steps**:
1. Create new environment in Railway dashboard (e.g., "staging")
2. Copy the Environment ID
3. Go to `/settings/environment` → Railway Sync
4. Enter API Token, Project ID, and **Environment ID** (staging)
5. Click **"Sync to Railway"**
6. All variables are now in your staging environment!

---

## Advanced Features

### Selective Sync

You can sync only specific variables by using the `syncSpecificToRailway` action in code (not exposed in UI yet).

Example use case: Only sync database credentials, not API keys.

### Compare Before Sync

Always use **"Compare Variables"** before syncing to see exactly what will change:

```
Local Only (2): DATABASE_URL_DIRECT, NEW_FEATURE_FLAG
Different Values (1): OPENAI_API_KEY
Matching (5): HTTP_PORT, GRPC_PORT, ...
Railway Only (3): LEGACY_VAR, OLD_CONFIG, ...
```

This helps you:
- Avoid accidentally overwriting important Railway-specific variables
- Know exactly what will change before you sync
- Identify variables that exist only on Railway (maybe old/unused?)

### Sync Workflow Best Practices

**For Development:**
1. Update variables in UI
2. Test locally with hot-reload
3. When ready, sync to Railway
4. No deployment needed (hot-reload works on Railway too!)

**For Production:**
1. Update variables in UI
2. Compare with Railway
3. Review changes carefully
4. Use "Sync & Deploy" to trigger clean restart
5. Monitor logs in Railway dashboard

---

## Troubleshooting

### Error: "Invalid Railway configuration"

**Problem**: API token or Project ID is incorrect.

**Solution**:
- Verify token starts with `railway_`
- Verify Project ID from Railway dashboard → Settings
- Try creating a new API token if old one is invalid

### Error: "Failed to connect to Railway"

**Problem**: Network error or Railway API is down.

**Solution**:
- Check your internet connection
- Visit [status.railway.app](https://status.railway.app)
- Try again in a few minutes

### Error: "Failed to retrieve environment variables"

**Problem**: Local encrypted storage can't be read.

**Solution**:
- Check that environment variables are saved locally
- Try refreshing the page
- Check browser console for errors

### Sync Succeeds but Railway Still Shows Old Values

**Problem**: Railway dashboard might be cached.

**Solution**:
- Hard refresh Railway dashboard (Cmd/Ctrl + Shift + R)
- Check your service's environment variables directly:
  ```bash
  railway variables
  ```
- Wait a few seconds for Railway to propagate changes

### Variables Synced but Service Not Using Them

**Problem**: Service needs restart to pick up new values.

**Solution**:
- Use **"Sync & Deploy"** instead of "Sync to Railway"
- Or manually restart service in Railway dashboard
- If using hot-reload feature, make sure DATABASE_URL_POOLED is synced

---

## Security Best Practices

### 1. Protect Your Railway API Token

- ⚠️ **Never commit your Railway API token to Git**
- Store it securely (password manager)
- Rotate it regularly (Railway → Account Settings → Tokens)
- If compromised, revoke immediately and create new one

### 2. Use Environment-Specific Credentials

For different environments, use different:
- Database credentials
- API keys (e.g., test vs production Stripe keys)
- Feature flags

Sync to each environment separately using Environment ID.

### 3. Review Before Syncing

Always **"Compare Variables"** before syncing to production.

Accidental syncs can:
- Overwrite production database URLs with dev URLs ❌
- Expose development API keys in production ❌
- Break feature flags ❌

### 4. Audit Trail

Railway keeps logs of all variable changes:
- Go to Project → Activity
- See who changed what and when
- Use this for security audits

---

## API Reference

The sync functionality uses Railway's GraphQL API v2:

### Endpoint
```
https://backboard.railway.app/graphql/v2
```

### Authentication
```
Authorization: Bearer railway_YOUR_TOKEN_HERE
```

### Mutations Used

**1. Upsert Variable** (create or update):
```graphql
mutation {
  variableUpsert(input: {
    projectId: "your-project-id"
    environmentId: "optional-env-id"
    name: "VARIABLE_NAME"
    value: "variable_value"
  }) {
    id
  }
}
```

**2. Get Variables**:
```graphql
query {
  variables(projectId: "your-project-id") {
    edges {
      node {
        id
        name
        value
      }
    }
  }
}
```

**3. Trigger Deployment**:
```graphql
mutation {
  deploymentTrigger(input: {
    projectId: "your-project-id"
    environmentId: "optional-env-id"
  }) {
    id
  }
}
```

---

## Comparison with Manual Methods

### Before (Manual Method):
1. Copy variable from app UI
2. Open Railway dashboard
3. Find correct service and environment
4. Click Variables → Add Variable
5. Paste name and value
6. Repeat for each variable (10+ times!)
7. Manually trigger redeploy if needed

**Time**: ~5-10 minutes for 10 variables

### After (Railway Sync):
1. Update variables in app UI
2. Click "Sync to Railway"
3. Done!

**Time**: ~30 seconds for ANY number of variables ⚡

---

## Related Features

### Hot-Reload Database Connection

When you sync `DATABASE_URL_POOLED` to Railway:
1. Railway updates the environment variable
2. Your app's hot-reload feature picks it up automatically
3. No restart needed!

See: [HOT_RELOAD_DATABASE.md](./HOT_RELOAD_DATABASE.md)

### Environment Variable Management

The Railway sync is built on top of the encrypted environment variable system.

See: [NEON_SETUP_GUIDE.md](../NEON_SETUP_GUIDE.md)

---

## FAQ

**Q: Will syncing overwrite all variables on Railway?**

A: No! It only **upserts** (updates or inserts). Variables that exist only on Railway won't be touched.

**Q: Can I sync to multiple environments at once?**

A: Not currently in the UI. You'd need to sync to each environment separately by changing the Environment ID.

**Q: What if I accidentally sync wrong values?**

A: You can:
1. Update the values in your UI
2. Sync again to fix them
3. Or update directly in Railway dashboard

**Q: Does this cost extra?**

A: No! Railway's API is included in all plans. No additional cost for syncing.

**Q: Can team members use this?**

A: Yes! Each team member can use their own Railway API token. Railway will track who made changes.

**Q: Is this secure?**

A: Yes! Your API token is never stored - you enter it each time. Communication happens over HTTPS directly to Railway's API.

---

## Support

Having issues with Railway sync?

1. **Check Railway Status**: [status.railway.app](https://status.railway.app)
2. **Check Logs**: Railway Dashboard → Your Service → Deployments → Logs
3. **Test Credentials**: Use "Test Connection" button in UI
4. **Railway Docs**: [docs.railway.app/reference/public-api](https://docs.railway.app/reference/public-api)

---

## Summary

✅ **What You Can Do:**
- Sync all environment variables from UI to Railway
- Compare local vs Railway variables before syncing
- Sync to specific environments (dev, staging, prod)
- Trigger deployments after syncing

✅ **Benefits:**
- Save time (30 seconds vs 10 minutes)
- Reduce errors (no manual copy-paste)
- Maintain single source of truth (your app's UI)
- Audit trail (Railway tracks all changes)
- Works with hot-reload (no restart needed!)

🚀 **Get Started**: Visit `/settings/environment` → Scroll to "Railway Integration"
