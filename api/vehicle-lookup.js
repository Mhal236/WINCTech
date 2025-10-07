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
      const dataItems = data.Response.DataItems;
      const registration = dataItems.VehicleRegistration;
      const technicalDetails = dataItems.TechnicalDetails;
      const smmtDetails = dataItems.SmmtDetails;
      
      // Log all available fields from the API to see what we have
      console.log('🔍 Full Response Data from API:', JSON.stringify({
        registration: registration,
        technicalDetails: technicalDetails?.Dimensions,
        smmtDetails: smmtDetails
      }, null, 2));
      
      // Also fetch vehicle image in parallel
      let vehicleImageUrl = null;
      try {
        const imageApiBaseUrl = process.env.VITE_IMAGE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleImageData?v=2&auth_apikey=';
        const imageApiUrl = `${imageApiBaseUrl}${apiKey}&key_vrm=${encodeURIComponent(vrn.trim())}`;
        console.log(`📸 Fetching vehicle image for VRN: ${vrn}`);
        console.log(`📸 Image API URL: ${imageApiUrl}`);
        
        const imageResponse = await fetch(imageApiUrl);
        console.log(`📸 Image API Response Status: ${imageResponse.status}`);
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          console.log('📸 Vehicle Image API Full Response:', JSON.stringify(imageData, null, 2));
          
          // Extract image URL from response
          if (imageData?.Response?.DataItems?.VehicleImages?.ImageDetailsList?.length > 0) {
            vehicleImageUrl = imageData.Response.DataItems.VehicleImages.ImageDetailsList[0].ImageUrl;
            console.log(`✅ Found vehicle image: ${vehicleImageUrl}`);
          } else {
            console.log(`⚠️ No vehicle image found in response structure`);
            console.log(`📸 Response structure: Response=${!!imageData?.Response}, DataItems=${!!imageData?.Response?.DataItems}, VehicleImages=${!!imageData?.Response?.DataItems?.VehicleImages}, ImageDetailsList=${!!imageData?.Response?.DataItems?.VehicleImages?.ImageDetailsList}`);
          }
        } else {
          const errorText = await imageResponse.text();
          console.warn(`❌ Failed to fetch vehicle image: ${imageResponse.status}`);
          console.warn(`❌ Error response: ${errorText}`);
        }
      } catch (imageError) {
        console.error('❌ Error fetching vehicle image:', imageError);
        // Continue without image if fetch fails
      }
      
      // Extract data from nested objects
      const dimensions = technicalDetails?.Dimensions || {};
      
      // Helper function to categorize wheelbase
      const getWheelbaseType = (wheelbase) => {
        if (!wheelbase) return "";
        const wb = parseFloat(wheelbase);
        if (wb < 2700) return "Short Wheelbase";
        if (wb >= 2700 && wb < 3000) return "Standard Wheelbase";
        if (wb >= 3000) return "Long Wheelbase";
        return "";
      };
      
      // Return vehicle details in the expected format
      const vehicleDetails = {
        registration: vrn.toUpperCase(),
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        bodyStyle: smmtDetails?.BodyStyle || "",
        bodyShape: dimensions.BodyShape || "",
        colour: registration.Colour || "",
        transmission: registration.Transmission || smmtDetails?.Transmission || "",
        doors: dimensions.NumberOfDoors || registration.SeatingCapacity || "",
        seats: dimensions.NumberOfSeats || registration.SeatingCapacity || "",
        wheelbaseType: getWheelbaseType(dimensions.WheelBase),
        fuelTankCapacity: dimensions.FuelTankCapacity || "",
        numberOfAxles: dimensions.NumberOfAxles || "",
        payloadVolume: dimensions.PayloadVolume || "",
        cabType: smmtDetails?.CabType || "",
        platformName: "",
        platformIsShared: null,
        vin: registration.Vin || registration.VIN || "",
        vehicle_image_url: vehicleImageUrl
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
