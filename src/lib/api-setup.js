import express from 'express';
import * as GlassApiService from './glass-api-service.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

/**
 * Create and setup the API middleware for Vite
 * @param {import('vite').ViteDevServer} server - The Vite server instance
 */
export function setupApiMiddleware(server) {
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Enable CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Example API endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API server is running'
    });
  });

  // Test endpoint
  app.get('/api/direct-test', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Direct test endpoint reached successfully',
      headers: req.headers,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  });

  // Vehicle data API endpoint
  app.get('/api/vehicle/:vrn', async (req, res) => {
    try {
      const vrn = req.params.vrn;
      if (!vrn) {
        return res.status(400).json({
          success: false,
          error: "Vehicle registration number (VRN) is required"
        });
      }

      console.log(`Handling vehicle data request for VRN: ${vrn}`);
      
      // Get API key from environment with multiple fallbacks
      const apiKey = process.env.VEHICLE_API_KEY || process.env.VITE_VEHICLE_API_KEY;
      // Use the new legacy API URL
      const apiUrl = process.env.VEHICLE_API_URL || process.env.VITE_VEHICLE_API_URL;
      
      if (!apiKey || !apiUrl) {
        console.error('Missing API key or URL in environment variables');
        console.log('Available environment variables:', Object.keys(process.env).filter(key => 
          key.includes('VEHICLE') || key.includes('API')).join(', '));
        return res.status(500).json({
          success: false,
          error: "Missing API configuration. Check server environment."
        });
      }
      
      // Log partial API key for debugging (only first 4 and last 4 characters)
      const keyLength = apiKey.length;
      const maskedKey = keyLength > 8 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength-4)}`
        : '****';
      console.log(`Using API key: ${maskedKey}`);
      
      // Construct the full URL with query parameters
      const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn}`;
      
      console.log(`Making vehicle API request to: ${apiUrl}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Vehicle API error:', response.status, response.statusText);
        return res.status(500).json({
          success: false,
          error: `Error retrieving vehicle data: ${response.status} ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      // Debug log the response structure
      console.log('API Response structure:', Object.keys(data));
      if (data.Response) {
        console.log('Response contains:', Object.keys(data.Response));
        if (data.Response.DataItems) {
          console.log('DataItems contains:', Object.keys(data.Response.DataItems));
        }
      }
      
      // Extract the relevant vehicle data
      if (data?.Response?.DataItems?.VehicleRegistration) {
        const vehicleReg = data.Response.DataItems.VehicleRegistration;
        
        const vehicleData = {
          make: vehicleReg.Make || '',
          model: vehicleReg.Model || '',
          year: vehicleReg.YearOfManufacture || '',
          color: vehicleReg.Colour || '',
          fuelType: vehicleReg.FuelType || '',
          transmission: vehicleReg.Transmission || '',
          engineCapacity: vehicleReg.EngineCapacity || '',
          // Include the full response data for debugging
          fullData: data
        };
        
        return res.json(vehicleData);
      } else {
        console.error('Could not find vehicle registration data in the response');
        console.log('Raw response data (partial):', JSON.stringify(data).substring(0, 500));
        return res.status(404).json({
          success: false,
          error: 'Vehicle data not found',
          rawResponse: data
        });
      }
    } catch (error) {
      console.error('Error in vehicle data endpoint:', error);
      return res.status(500).json({
        success: false,
        error: error.message || String(error),
        message: "Failed to retrieve vehicle data"
      });
    }
  });

  // Glass API HelloWorld test endpoint
  app.get('/api/glass/hello-world', async (req, res) => {
    try {
      const result = await GlassApiService.helloWorld();
      res.json(result);
    } catch (error) {
      console.error('Error in hello-world endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to perform HelloWorld test"
      });
    }
  });

  // Glass API get makes endpoint
  app.get('/api/glass/makes', async (req, res) => {
    try {
      const result = await GlassApiService.getMakes();
      res.json(result);
    } catch (error) {
      console.error('Error getting makes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get vehicle makes"
      });
    }
  });

  // Apply the Express app as middleware to Vite's server
  server.middlewares.use(app);
  
  console.log('API middleware has been set up successfully');
} 