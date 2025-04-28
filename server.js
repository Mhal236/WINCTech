import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import https from 'https';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Dynamically import glass-api-service functions to prevent import errors
let getArgicFromVRN;
try {
  const glassApiService = await import('./src/lib/glass-api-service.js');
  getArgicFromVRN = glassApiService.getArgicFromVRN;
  console.log('Successfully imported glass-api-service');
} catch (err) {
  console.error('Error importing glass-api-service:', err);
  getArgicFromVRN = async (vrn) => ({
    success: false,
    error: 'Glass API service unavailable',
    message: 'Could not import glass-api-service module'
  });
}

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running',
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Vehicle data API endpoint
app.get('/api/vehicle/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: "VRN parameter is required"
      });
    }
    
    // Get API credentials from environment
    const apiUrl = process.env.VITE_VEHICLE_API_URL;
    const apiKey = process.env.VITE_VEHICLE_API_KEY;
    
    if (!apiKey || !apiUrl) {
      console.error('Missing API key or URL in environment variables');
      console.log('Available environment variables:', Object.keys(process.env)
        .filter(key => key.includes('VEHICLE') || key.includes('API') || key.includes('VITE'))
        .join(', '));
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
    
    // Create a custom agent with longer timeout
    const httpsAgent = new https.Agent({
      timeout: 30000, // 30 seconds
      keepAlive: true
    });
    
    const response = await axios.get(url, { 
      httpsAgent,
      timeout: 30000 // 30 seconds
    });
    
    // Add detailed logging about the response
    console.log("API Response status:", response.status);
    console.log("API Response structure:", Object.keys(response.data));
    
    // Check if response contains valid data
    if (
      response.data?.Response &&
      response.data.Response.StatusCode === "Success" &&
      response.data.Response.DataItems &&
      response.data.Response.DataItems.VehicleRegistration
    ) {
      const registration = response.data.Response.DataItems.VehicleRegistration;
      res.json({
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        color: registration.Colour || "",
        fuelType: registration.FuelType || "",
        engineCapacity: registration.EngineCapacity || "",
        transmission: registration.Transmission || ""
      });
    } else {
      console.log("API response did not contain expected vehicle data");
      console.log("Raw response data (partial):", JSON.stringify(response.data).substring(0, 500));
      
      res.status(404).json({
        success: false,
        error: "Vehicle data not found in API response"
      });
    }
  } catch (error) {
    console.error('Error fetching vehicle data:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      message: "Failed to fetch vehicle data"
    });
  }
});

// Glass API endpoint for VRN lookup
app.get('/api/glass/vrn-lookup/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: "VRN parameter is required"
      });
    }
    
    console.log(`Processing glass VRN lookup for: ${vrn}`);
    
    // Check if getArgicFromVRN is available
    if (!getArgicFromVRN) {
      console.error('getArgicFromVRN function not available');
      return res.status(500).json({
        success: false,
        error: "Glass API service unavailable"
      });
    }
    
    // Call the glass API service function
    const result = await getArgicFromVRN(vrn.trim());
    
    if (result.success && result.argicCode) {
      console.log(`Successfully retrieved ARGIC code for ${vrn}: ${result.argicCode}`);
      return res.json(result);
    } else {
      console.log(`No ARGIC code found for ${vrn}:`, result.error || 'Unknown error');
      return res.status(404).json({
        success: false,
        error: result.error || "ARGIC code not found"
      });
    }
  } catch (error) {
    console.error('Error in glass VRN lookup:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred"
    });
  }
});

// For local development, add static file serving and catch-all route
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  
  // Serve static files from the 'dist' directory (built frontend)
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // For any other route, serve the frontend (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend static files served from: ${path.join(__dirname, 'dist')}`);
    console.log(`Environment variables loaded: VITE_VEHICLE_API_URL=${process.env.VITE_VEHICLE_API_URL ? 'defined' : 'undefined'}`);
    console.log(`Environment variables loaded: VITE_VEHICLE_API_KEY=${process.env.VITE_VEHICLE_API_KEY ? 'defined' : 'undefined'}`);
  });
}

// Export for Vercel
export default app; 