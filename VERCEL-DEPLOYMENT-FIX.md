# Vercel Deployment Fix

## Problem
The glass ordering feature was failing on Vercel deployment with this error:
```
localhost:3000/api/health:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This happened because the app was trying to call `http://localhost:3000` endpoints in production, which don't exist on Vercel.

## Solution

### 1. Created Vercel Serverless Functions

I've created the following API endpoints in the `/api` folder that work with Vercel:

- **`/api/health.js`** - Health check endpoint
- **`/api/vehicle/glass/[vrn].js`** - Vehicle glass data by VRN
- **`/api/stock-query.js`** - Stock query for glass products
- **`/api/glass-availability.js`** - Check glass availability across depots

### 2. Required Actions on Vercel

**Go to your Vercel project dashboard → Settings → Environment Variables**

Add or update these environment variables:

#### Required Environment Variables:

```bash
# API Routing
VITE_USE_LOCAL_SERVER=false

# MAG API Credentials
MAG_LOGIN=Q-100
MAG_PASSWORD=b048c57a
MAG_USER_ID=1

# Vehicle API Credentials
VEHICLE_API_KEY=6193cc7a-c1b2-469c-ad41-601c6faa294c
VITE_VEHICLE_API_URL=https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData

# Supabase (should already be set)
VITE_SUPABASE_URL=https://julpwjxzrlkbxdbphrdy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Stripe (should already be set)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

#### Important Notes:

1. **`VITE_USE_LOCAL_SERVER=false`** - This is the most critical one! It tells the app to use Vercel's serverless functions instead of localhost.

2. **MAG API Credentials** - Replace with your actual Master Auto Glass credentials if different.

3. **Make sure all `VITE_` prefixed variables** are set, as these are accessible in the frontend.

### 3. Deploy

After setting the environment variables:

1. Go to your Vercel dashboard
2. Click **"Redeploy"** on your latest deployment
3. Make sure to check **"Use existing Build Cache"** is unchecked to force a fresh build

## Testing

After deployment, test the glass ordering feature by:

1. Going to the Price Lookup page
2. Entering a VRN (try `HN11EYW` for demo mode)
3. Clicking "Search"
4. The search should now work without the `ERR_CONNECTION_REFUSED` error

## How It Works Now

- **Local Development**: Uses `api-server.js` on `http://localhost:3000`
- **Vercel Production**: Uses serverless functions in `/api` folder
- The switch is controlled by `VITE_USE_LOCAL_SERVER` environment variable

## Troubleshooting

If you still have issues:

1. **Check Vercel Function Logs**: Go to your deployment → Functions tab to see any errors
2. **Verify Environment Variables**: Make sure all variables are set for "Production" environment
3. **Check Browser Console**: Look for any other API errors
4. **Test Individual Endpoints**: You can test endpoints directly:
   - `https://your-app.vercel.app/api/health`
   - `https://your-app.vercel.app/api/vehicle/glass/HN11EYW`

## Files Changed

- Created: `/api/health.js`
- Created: `/api/vehicle/glass/[vrn].js`
- Created: `/api/stock-query.js`
- Created: `/api/glass-availability.js`

All existing local development files remain unchanged.

