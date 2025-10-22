# Quick Commit and Deploy Guide

## What Was Fixed

The glass ordering feature was failing on Vercel because:
1. It was trying to use Railway API URL which violated Content Security Policy
2. The environment variable wasn't set to use Vercel serverless functions

## Changes Made

### 1. Created Vercel Serverless Functions
- `/api/health.js` - Health check
- `/api/vehicle/glass/[vrn].js` - Vehicle data lookup
- `/api/stock-query.js` - Glass stock queries
- `/api/glass-availability.js` - Availability checks

### 2. Updated API Routing
- Modified `/src/pages/PriceLookup.tsx` to support 3 API modes:
  - `local` - localhost:3000 (for development)
  - `vercel` - Vercel serverless functions (for Vercel deployment)
  - `railway` - Railway API (if needed)

### 3. Updated Security Policy
- Modified `/index.html` to allow Railway and external API URLs in CSP

## Next Steps

### Step 1: Commit Changes

```bash
git add .
git commit -m "Fix glass ordering on Vercel - Add serverless functions and API mode support"
git push
```

### Step 2: Set Environment Variable on Vercel

1. Go to https://vercel.com → Your Project → Settings → Environment Variables
2. Add this variable:
   ```
   VITE_API_MODE=vercel
   ```
3. Make sure these are also set:
   ```
   MAG_LOGIN=Q-100
   MAG_PASSWORD=b048c57a
   MAG_USER_ID=1
   VEHICLE_API_KEY=6193cc7a-c1b2-469c-ad41-601c6faa294c
   VITE_VEHICLE_API_URL=https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData
   ```

### Step 3: Redeploy on Vercel

Either:
- Wait for auto-deploy from Git push, OR
- Go to Vercel dashboard → Deployments → Click "Redeploy" on latest deployment

### Step 4: Test

1. Open your Vercel app
2. Go to Glass Ordering / Price Lookup
3. Enter VRN: `HN11EYW`
4. Click Search
5. Should work without CSP errors!

## Troubleshooting

If it still doesn't work:

1. **Check Vercel Logs**: Go to deployment → Functions → View logs
2. **Check Browser Console**: Look for any API errors
3. **Verify Environment**: Make sure `VITE_API_MODE=vercel` is set in Vercel
4. **Test API directly**: Visit `https://your-app.vercel.app/api/health` in browser

## Local Development Still Works

For local development, either:
- Don't set `VITE_API_MODE` (defaults to `local`), OR
- Set `VITE_API_MODE=local` in your `.env` file

Then run:
```bash
npm run dev
```

This will use `localhost:3000` as before.

