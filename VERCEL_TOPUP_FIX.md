# Vercel Top-Up Feature Fix

## Issues Identified

1. **API Routes Returning 404**: The Vercel serverless functions were not properly configured, causing:
   - `/api/stripe/create-payment-intent` returning 404
   - `/api/stripe/subscription-status/{userId}` returning 404

2. **Multiple Supabase Client Instances**: Two separate Supabase client instances were being created:
   - One in `src/lib/supabase-client.ts` using `window.__supabaseInstance`
   - Another in `src/contexts/AuthContext.tsx` using `window.__authSupabaseInstance`
   - This caused the warning: "Multiple GoTrueClient instances detected in the same browser context"

## Fixes Applied

### 1. Updated Vercel Configuration (`vercel.json`)

Added proper serverless function configuration and API routing:

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

**What this does:**
- Configures the `api/` directory as serverless functions with 1GB memory and 10-second timeout
- Routes all `/api/*` requests to the serverless functions
- Routes all other requests to the React SPA
- Adds proper CORS headers for API endpoints

### 2. Consolidated Supabase Client Instance (`src/contexts/AuthContext.tsx`)

Changed the AuthContext to use the same global singleton instance:

```typescript
// BEFORE: Created a separate instance
declare global {
  interface Window {
    __authSupabaseInstance?: any;
  }
}

// AFTER: Uses the SAME instance as supabase-client.ts
declare global {
  interface Window {
    __supabaseInstance?: any;
    __loggedKeys?: Set<string>;
  }
}
```

**What this does:**
- Both `AuthContext.tsx` and `supabase-client.ts` now use the same `window.__supabaseInstance`
- Eliminates the multiple instances warning
- Ensures consistent authentication state across the app

## Deployment Steps

### 1. Push Changes to Git

```bash
git add vercel.json src/contexts/AuthContext.tsx
git commit -m "Fix Vercel API routes and consolidate Supabase instances"
git push origin main
```

### 2. Verify Environment Variables in Vercel

Make sure these environment variables are set in your Vercel project settings:

**Required for Stripe:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (for frontend)

**Required for Supabase:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for backend)

### 3. Redeploy to Vercel

Vercel should automatically deploy when you push to the main branch. If not:

```bash
vercel --prod
```

Or use the Vercel dashboard to trigger a new deployment.

## Testing the Fix

### 1. Test API Endpoints

After deployment, verify the API endpoints are accessible:

```bash
# Test create-payment-intent (should return "Method not allowed" for GET)
curl https://portal.windscreencompare.com/api/stripe/create-payment-intent

# Test subscription-status (should return user data or error)
curl https://portal.windscreencompare.com/api/stripe/subscription-status/YOUR_USER_ID
```

### 2. Test Top-Up Feature

1. Log in to your Vercel deployment: `https://portal.windscreencompare.com`
2. Navigate to the Top-Up page
3. Click on a credit package (e.g., £10, £20, £50)
4. Verify that:
   - No 404 errors appear in the console
   - The Stripe payment form loads correctly
   - The "Multiple GoTrueClient instances" warning does not appear
   - You can proceed with a test payment

### 3. Check Console Logs

After logging in, check the browser console (F12). You should see:
- ✅ Only ONE log about creating/using Supabase instance
- ✅ API calls to `/api/stripe/*` return successful responses (200)
- ✅ No "Multiple GoTrueClient instances" warning

Expected logs:
```
🔵 AuthContext: Creating new Supabase singleton instance (only once)
🔵 Stripe key check: { hasKey: true }
✅ Payment intent created successfully
```

## Troubleshooting

### Issue: Still getting 404 on API routes

**Solution:**
1. Check that the `api/` folder is at the root of your project (not inside `src/`)
2. Verify that Vercel is detecting your API routes (check deployment logs)
3. Make sure the API files have the `.js` extension and export a default handler function

### Issue: Still seeing "Multiple GoTrueClient instances" warning

**Solution:**
1. Clear your browser cache and local storage
2. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if any other file is creating a Supabase client instance
4. Verify the changes to `AuthContext.tsx` were deployed

### Issue: Environment variables not found

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required environment variables
3. Make sure to add them for the "Production" environment
4. Redeploy after adding variables

## API Endpoint Details

### `/api/stripe/create-payment-intent`

**Method:** POST

**Request Body:**
```json
{
  "amount": 1000,
  "credits": 10,
  "currency": "gbp",
  "description": "Purchase 10 credits"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### `/api/stripe/subscription-status/[userId]`

**Method:** GET

**URL Parameter:**
- `userId`: The user's ID from the database

**Response:**
```json
{
  "success": true,
  "status": "active",
  "tier": "free",
  "data": {
    "stripe_customer_id": "cus_xxx",
    "stripe_subscription_id": "sub_xxx",
    ...
  }
}
```

## Additional Notes

- The API routes are serverless functions that will automatically scale
- Each function has a 10-second timeout - if operations take longer, increase `maxDuration`
- The functions are allocated 1GB of memory - adjust if needed for larger operations
- CORS is configured to allow all origins (`*`) - restrict this in production if needed

## Summary

✅ **Fixed:** API routes now properly deployed as Vercel serverless functions  
✅ **Fixed:** Supabase client instances consolidated to prevent multiple instances warning  
✅ **Fixed:** Top-up feature should now work correctly on Vercel deployment  
✅ **Added:** Proper CORS headers for API endpoints  
✅ **Added:** Serverless function configuration with appropriate memory and timeout  

The top-up feature should now work correctly on your Vercel deployment at `https://portal.windscreencompare.com`.

