# Vehicle Image Debugging Guide

## Issue: Vehicle images not displaying

### Step 1: Check API Key Configuration

1. **Verify the environment variable is set:**
   - Open your `.env` file
   - Look for: `VEHICLE_API_KEY=your_api_key_here`
   - Make sure it's set with a valid API key
   - **Note:** NO `VITE_` prefix needed - this is server-side only for security

2. **Restart your API server** after adding/changing the API key:
   ```bash
   # If running api-server.js separately:
   node api-server.js
   
   # Or restart your full dev environment
   npm run dev
   ```

### Step 2: Check Browser Console

When you search for a VRN, open the browser console (F12) and look for:

**When VRN is searched:**
```
🔍 Checking cache for VRN: AB12CDE
```

**If found in cache:**
```
✅ Found cached data for VRN: AB12CDE
✅ Vehicle data loaded from cache - no credits deducted
```

**If NOT in cache:**
```
🌐 Fetching from external API for VRN: AB12CDE
Vehicle API Response: {...}
```
➡️ The server endpoint fetches both vehicle data AND image

**If image loads successfully:**
```
✅ Vehicle image loaded successfully
```

**Server-side logs** (in your API server console, not browser):
```
Fetching vehicle image for VRN: AB12CDE
✅ Found vehicle image: https://...
```

### Step 3: Test with a Known VRN

Try searching for a common vehicle VRN that you know exists (e.g., a popular car model).

### Step 4: Check API Response Structure

The code now handles multiple response structures:
1. `Response.DataItems.VehicleImages.ImageDetailsList[0].ImageUrl`
2. `Response.DataItems.VehicleImages.ImageUrl`
3. `DataItems.VehicleImages.ImageUrl`
4. `VehicleImages[0].ImageUrl`
5. `imageUrl` or `ImageUrl` (direct)

If the API returns a different structure, check the console log for "Available response keys" and we can add support for that structure.

### Step 5: Verify API Credits

Check if your Vehicle Image API account has credits available:
- Log into your VehicleDataGlobal account
- Check your credit balance
- Verify the API endpoint is active

### Step 6: Check Database

After a successful search, verify the image URL is being saved:

```sql
SELECT vrn, vehicle_image_url, make, model 
FROM vehicle_data 
WHERE vrn = 'YOUR_VRN_HERE';
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API key not configured | Add `VEHICLE_API_KEY` to `.env` file and restart API server |
| 401/403 API error | Check API key is valid and has credits (check API server logs) |
| 404 API error | VRN might not exist or no image available |
| Image loads but doesn't display | Check browser console for image load errors |
| Image URL saved but not shown | Clear browser cache and retry |
| Old cached data without image | Delete the VRN from database and search again |

### Placeholder Image

If no image is available, you'll see a placeholder with:
- Car icon
- "No vehicle image available" message

This is normal for vehicles that don't have images in the VehicleDataGlobal database.

### Need Help?

1. Check browser console logs (F12)
2. Share the console output from a VRN search
3. Verify your API key is valid
4. Check the response structure in the console

