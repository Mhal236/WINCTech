import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Vehicle API constants
const VEHICLE_API_URL = process.env.VITE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
const VEHICLE_API_KEY = process.env.VEHICLE_API_KEY || '6193cc7a-c1b2-469c-ad41-601c6faa294c';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Vehicle data API endpoint (used by verification form)
app.get('/api/vehicle/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: 'VRN is required'
      });
    }

    console.log(`Fetching vehicle data for VRN: ${vrn}`);
    
    // Use the external vehicle API to get actual vehicle data
    if (!VEHICLE_API_KEY || !VEHICLE_API_URL) {
      console.error('Missing API key or URL in environment variables');
      return res.status(500).json({
        success: false,
        error: "Missing API configuration. Check server environment."
      });
    }

    // Build URL with API parameters
    const url = `${VEHICLE_API_URL}?v=2&api_nullitems=1&auth_apikey=${VEHICLE_API_KEY}&key_vrm=${vrn.trim()}`;
    
    console.log(`Calling external vehicle API at: ${VEHICLE_API_URL}`);
    
    const response = await axios.get(url);
      
    // Check if response contains valid data
    if (
      response.data?.Response &&
      response.data.Response.StatusCode === "Success" &&
      response.data.Response.DataItems &&
      response.data.Response.DataItems.VehicleRegistration
    ) {
      const registration = response.data.Response.DataItems.VehicleRegistration;
      
      // Fetch vehicle image in parallel
      let vehicleImageUrl = null;
      try {
        const imageApiBaseUrl = process.env.VITE_IMAGE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleImageData?v=2&auth_apikey=';
        const imageApiUrl = `${imageApiBaseUrl}${VEHICLE_API_KEY}&key_vrm=${encodeURIComponent(vrn.trim())}`;
        console.log(`📸 Fetching vehicle image for VRN: ${vrn}`);
        
        const imageResponse = await axios.get(imageApiUrl);
        
        if (imageResponse.data?.Response?.DataItems?.VehicleImages?.ImageDetailsList?.length > 0) {
          vehicleImageUrl = imageResponse.data.Response.DataItems.VehicleImages.ImageDetailsList[0].ImageUrl;
          console.log(`✅ Found vehicle image: ${vehicleImageUrl}`);
        }
      } catch (imageError) {
        console.error('❌ Error fetching vehicle image:', imageError);
        // Continue without image if fetch fails
      }
      
      // Extract all available vehicle details
      const vehicleDetails = {
        registration: vrn.toUpperCase(),
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        variant: registration.ModelVariant || "",
        fuelType: registration.FuelType || "",
        engineCapacity: registration.EngineCapacity || null,
        co2Emissions: registration.Co2Emissions || null,
        euroStatus: registration.EuroStatus || "",
        bodyType: registration.BodyStyle?.Description || registration.BodyStyle || "",
        bodyShape: registration.BodyStyle?.Code || "",
        bodyStyle: registration.BodyStyle || "",
        colour: registration.Colour || "",
        transmission: registration.Transmission || "",
        doors: registration.NumberOfDoors || null,
        seats: registration.SeatingCapacity || null,
        wheelbaseType: registration.Wheelbase || "",
        fuelTankCapacity: registration.FuelTankCapacity || null,
        numberOfAxles: registration.NumberOfAxles || null,
        payloadVolume: registration.PayloadVolume || null,
        cabType: registration.CabType || "",
        platformName: registration.PlatformName || "",
        platformIsShared: registration.PlatformShared || null,
        taxStatus: registration.TaxStatus || "",
        motStatus: registration.MotStatus || "",
        motdDate: registration.MotExpiryDate || "",
        taxDueDate: registration.TaxDueDate || "",
        VIN: registration.Vin || "",
        mvrisCode: registration.MvrisCode || "",
        vehicle_image_url: vehicleImageUrl
      };
      
      console.log(`Vehicle data retrieved:`, vehicleDetails);
      
      res.json({
        success: true,
        vrn: vrn.toUpperCase(),
        data: vehicleDetails
      });
    } else {
      console.log("UK Vehicle API response did not contain expected vehicle data");
      
      return res.status(404).json({
        success: false,
        error: "Vehicle data not found in API response",
        vrn: vrn.toUpperCase()
      });
    }
  } catch (error) {
    console.error('Error in vehicle endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch vehicle data'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// Vehicle data API endpoint - this is the main endpoint needed for PriceLookup.tsx
app.get('/api/vehicle/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: "VRN parameter is required"
      });
    }
    
    // Get API credentials - hardcoded for simplicity in this example
    // In production, use environment variables
    const apiUrl = process.env.VITE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
    const apiKey = process.env.VEHICLE_API_KEY || '6193cc7a-c1b2-469c-ad41-601c6faa294c';
    
    if (!apiKey || !apiUrl) {
      console.error('Missing API key or URL in environment variables');
      return res.status(500).json({
        success: false,
        error: "Missing API configuration. Check server environment."
      });
    }
    
    // Log partial API key for debugging
    const keyLength = apiKey.length;
    const maskedKey = keyLength > 8 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength-4)}`
      : '****';
    console.log(`Using API key: ${maskedKey}`);
    
    console.log(`Processing vehicle data request for VRN: ${vrn}`);
    
    // Build URL with API parameters - use lowercase key_vrm
    const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn.trim()}`;
    
    console.log(`Calling external vehicle API at: ${apiUrl} (not showing full URL with key)`);
    
    const response = await axios.get(url);
    
    // Add detailed logging about the response
    console.log("API Response status:", response.status);
    
    // Check if response contains valid data
    if (
      response.data?.Response &&
      response.data.Response.StatusCode === "Success" &&
      response.data.Response.DataItems &&
      response.data.Response.DataItems.VehicleRegistration
    ) {
      const registration = response.data.Response.DataItems.VehicleRegistration;
      
      // Extract all available vehicle details
      const vehicleDetails = {
        registration: vrn.toUpperCase(),
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        variant: registration.ModelVariant || "",
        fuelType: registration.FuelType || "",
        engineCapacity: registration.EngineCapacity || null,
        co2Emissions: registration.Co2Emissions || null,
        euroStatus: registration.EuroStatus || "",
        bodyType: registration.BodyStyle?.Description || registration.BodyStyle || "",
        bodyShape: registration.BodyStyle?.Code || "",
        bodyStyle: registration.BodyStyle || "",
        colour: registration.Colour || "",
        transmission: registration.Transmission || "",
        doors: registration.NumberOfDoors || null,
        seats: registration.SeatingCapacity || null,
        wheelbaseType: "",
        fuelTankCapacity: null,
        numberOfAxles: null,
        payloadVolume: null,
        cabType: "",
        platformName: "",
        platformIsShared: null,
        taxStatus: registration.TaxStatus || "",
        motStatus: registration.MotStatus || "",
        motdDate: registration.MotExpiryDate || "",
        taxDueDate: registration.TaxDueDate || "",
        vin: registration.Vin || "",
        mvrisCode: registration.MvrisCode || ""
      };
      
      res.json(vehicleDetails);
    } else {
      console.log("API response did not contain expected vehicle data");
      console.log("Raw response data (partial):", JSON.stringify(response.data).substring(0, 500));
      
      res.status(404).json({
        success: false,
        error: "Vehicle data not found in API response"
      });
    }
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      message: "Failed to fetch vehicle data"
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 