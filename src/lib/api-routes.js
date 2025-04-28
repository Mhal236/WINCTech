import express from 'express';
import * as GlassApiService from './glass-api-service.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

/**
 * Create and configure the API router
 * @returns {express.Router} Configured Express router with all API endpoints
 */
export function createApiRouter() {
  const router = express.Router();
  
  // Configure middleware
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));
  
  // Enable CORS
  router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Example API endpoint
  router.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API server is running'
    });
  });

  // Test endpoint for the direct-test
  router.get('/api/direct-test', (req, res) => {
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
  router.get('/api/vehicle/:vrn', async (req, res) => {
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
      const apiKey = process.env.VITE_VEHICLE_API_KEY;
      // Use the VITE prefixed environment variable
      const apiUrl = process.env.VITE_VEHICLE_API_URL;
      
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
      
      // Construct the full URL with query parameters - use lowercase key_vrm
      const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn}`;
      
      console.log(`Making vehicle API request to: ${apiUrl}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Vehicle API error:', data);
        const statusCode = response.status || 500;
        return res.status(statusCode).json({
          success: false,
          error: data.Message || 'Error retrieving vehicle data'
        });
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
        return res.status(404).json({
          success: false,
          error: 'Vehicle data not found',
          rawResponse: data
        });
      }
    } catch (error) {
      console.error('Error in vehicle data endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to retrieve vehicle data"
      });
    }
  });

  // Glass API HelloWorld test endpoint
  router.get('/api/glass/hello-world', async (req, res) => {
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
  router.get('/api/glass/makes', async (req, res) => {
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

  // Glass API get models endpoint
  router.get('/api/glass/models/:make', async (req, res) => {
    try {
      const { make } = req.params;
      if (!make) {
        return res.status(400).json({
          success: false,
          error: "Make parameter is required"
        });
      }
      
      const result = await GlassApiService.getModels(make);
      res.json(result);
    } catch (error) {
      console.error('Error getting models:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get vehicle models"
      });
    }
  });

  // Glass API get stock list endpoint
  router.get('/api/glass/stock', async (req, res) => {
    try {
      const { make, model, year, modelType } = req.query;
      
      if (!make || !model || !year) {
        return res.status(400).json({
          success: false,
          error: "Make, model, and year parameters are required"
        });
      }
      
      const result = await GlassApiService.getStockList(
        make, 
        model, 
        modelType || "", 
        parseInt(year)
      );
      res.json(result);
    } catch (error) {
      console.error('Error getting stock list:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get stock list"
      });
    }
  });

  // Add more API routes from your api-server.js file here

  return router;
} 