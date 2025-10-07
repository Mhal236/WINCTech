# Vehicle Data Enhancement Feature Setup

## Overview
This feature enhances the VRN search functionality by adding:
- **Vehicle Images** - Display photos of vehicles
- **VIN (Vehicle Identification Number)** - 17-character unique identifier
- **MVRIS Code** - Motor Vehicle Registration Information System code

## Database Changes

### Fields Added to `vehicle_data` Table:
1. **`vehicle_image_url`** (TEXT) - URL to the vehicle image from VehicleImageData API
2. **`vin`** (TEXT) - Vehicle Identification Number 
3. **`mvris_code`** (TEXT) - MVRIS Code (defaults to 'M0EZU')

All migrations have been applied via MCP.

## Environment Variables

The API key is now handled **server-side** for security. Add this to your `.env` file:

```env
# Vehicle API Key (used server-side, no VITE_ prefix needed)
VEHICLE_API_KEY=your_api_key_here
```

**Security Note:** The API key is kept secure on the server and never exposed to the browser. Both vehicle data AND vehicle images are fetched through the same server-side endpoint.

## API Details

### Vehicle Image API Endpoint
- **URL**: `https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleImageData`
- **Parameters**:
  - `v=2` - API version
  - `auth_apikey` - Your API key
  - `key_VRM` - The vehicle registration number

### Example Request
```
https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleImageData?v=2&auth_apikey=YOUR_KEY&key_VRM=AB12CDE
```

## How It Works

1. **VRN Search Flow**:
   - User enters a VRN and searches
   - System checks `vehicle_data` table first (cache)
   - If not cached:
     - Fetches vehicle data from UK Vehicle Data API
     - Fetches vehicle image from Vehicle Image API
     - Saves both to `vehicle_data` table
   - Displays vehicle data and image to user

2. **Cached Data**:
   - If VRN exists in cache, image is loaded from database
   - No API calls needed
   - No credits deducted

3. **Image Display**:
   - Image is displayed at the top of the vehicle information card
   - Gracefully handles missing or failed image loads
   - Responsive design with shadow and rounded corners

## Benefits

- **Cost Savings**: Images are cached, reducing API calls
- **Better UX**: Visual confirmation of the correct vehicle
- **Data Enrichment**: Complete vehicle profile with photo
- **Performance**: Cached images load instantly

## Testing

1. Search for a VRN that you know has an image
2. Verify the image displays correctly
3. Search the same VRN again - should load from cache
4. Check the database to confirm `vehicle_image_url` is stored

## Troubleshooting

### No Image Displays
- Check if `VITE_VEHICLE_IMAGE_API_KEY` is set in `.env`
- Verify the API key is valid
- Check browser console for errors
- Some vehicles may not have images available

### API Errors
- Check your API credit balance
- Verify the API endpoint is accessible
- Review console logs for detailed error messages

## Code Files Modified

1. `src/services/vehicleService.ts` - Added image fetching logic
2. `src/pages/VrnSearch.tsx` - Added image display component
3. `add-vehicle-image-field.sql` - Database migration
4. Database: `vehicle_data` table - Added `vehicle_image_url` column

