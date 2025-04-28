const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import API routes from api-server.js
// Since your api-server.js is using ES modules, we need to run this in a different way
// We'll re-implement the critical endpoints here

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'dist' directory (built frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
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
      console.log('Available environment variables:', Object.keys(process.env).filter(key => 
        key.includes('VEHICLE') || key.includes('API')).join(', '));
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
    console.error('Error fetching vehicle data:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      message: "Failed to fetch vehicle data"
    });
  }
});

// Add more API endpoints as needed (you can add crucial ones from api-server.js)

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