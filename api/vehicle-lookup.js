/**
 * Vehicle Lookup API for Vercel deployment
 * 
 * This API calls the UK Vehicle Data API to get vehicle details by VRN
 * Designed to work as a Vercel serverless function
 */
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { vrn } = req.query;

  if (!vrn || typeof vrn !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'VRN is required'
    });
  }

  try {
    console.log(`Fetching vehicle data for VRN: ${vrn}`);
    
    // Get API credentials from environment
    const apiKey = process.env.VEHICLE_API_KEY;
    const apiUrl = process.env.VITE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
    
    if (!apiKey) {
      console.error('VEHICLE_API_KEY environment variable not set');
      return res.status(500).json({
        success: false,
        error: "Vehicle API key not configured"
      });
    }

    // Build URL with API parameters
    const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn.trim()}`;
    
    console.log(`Calling external vehicle API...`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Vehicle API Response:', data);
    
    // Check if response contains valid data
    if (
      data?.Response &&
      data.Response.StatusCode === "Success" &&
      data.Response.DataItems &&
      data.Response.DataItems.VehicleRegistration
    ) {
      const registration = data.Response.DataItems.VehicleRegistration;
      
      // Return vehicle details in the expected format
      const vehicleDetails = {
        registration: vrn.toUpperCase(),
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        bodyStyle: registration.BodyStyle || ""
      };
      
      console.log(`Vehicle data retrieved:`, vehicleDetails);
      
      return res.status(200).json({
        success: true,
        vrn: vrn.toUpperCase(),
        data: vehicleDetails
      });
    } else {
      console.log("Vehicle API response did not contain expected vehicle data");
      
      return res.status(404).json({
        success: false,
        error: "Vehicle data not found in API response",
        vrn: vrn.toUpperCase()
      });
    }
  } catch (error) {
    console.error('Error in vehicle lookup:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch vehicle data',
      vrn: vrn.toUpperCase()
    });
  }
}
