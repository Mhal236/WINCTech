# Vercel Deployment Fix

## Issues Fixed

### 1. **Missing Stripe API Routes** ✅
Created Vercel serverless functions for Stripe operations:
- `/api/stripe/create-payment-intent.js` - Creates payment intents for credit purchases
- `/api/stripe/subscription-status/[userId].js` - Fetches user subscription status

### 2. **Content Security Policy (CSP) for ElevenLabs** ✅
Updated `index.html` to allow AudioWorklet modules:
- Added `blob:` to `script-src`
- Added `script-src-elem` directive
- Added `child-src` directive
- Added ElevenLabs domains to `worker-src`

## Required Environment Variables on Vercel

Make sure these are set in your Vercel project settings:

### Required:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_live_...)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VEHICLE_API_KEY` - Your vehicle data API key

### Optional (recommended):
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

## Deployment Steps

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Add Vercel serverless functions for Stripe API routes"
   git push origin main
   ```

2. **Verify environment variables in Vercel:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Ensure all required variables are set
   - Redeploy if you add any new variables

3. **Test the deployment:**
   - Visit your deployed site
   - Try the top-up functionality
   - Check browser console for any remaining errors

## Multiple GoTrueClient Warning

The warning about "Multiple GoTrueClient instances" is usually harmless and happens during development with hot module reloading. In production builds, this should not occur or cause issues.

If it persists in production:
- This warning doesn't break functionality
- It's a notice from Supabase's auth library
- Can be safely ignored as long as auth works correctly

## File Structure

```
/api/
  ├── vehicle-lookup.js (existing)
  └── stripe/
      ├── create-payment-intent.js (new)
      └── subscription-status/
          └── [userId].js (new)
```

Vercel automatically detects files in the `/api/` directory and creates serverless functions for them.

## Testing Locally

To test the serverless functions locally:
```bash
npm run dev
```

The API routes will be available at:
- `http://localhost:8080/api/stripe/create-payment-intent`
- `http://localhost:8080/api/stripe/subscription-status/[userId]`
- `http://localhost:8080/api/vehicle-lookup`

## Troubleshooting

### If top-up still doesn't work:
1. Check Vercel deployment logs for errors
2. Verify all environment variables are set correctly
3. Check browser console for specific error messages
4. Ensure Stripe is in live mode and keys are correct

### If ElevenLabs widget still has errors:
1. Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+F5)
2. Clear browser cache
3. Check that CSP headers are loading correctly
4. Verify you're on a secure context (HTTPS or localhost)

