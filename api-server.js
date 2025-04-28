import express from 'express';
import https from 'node:https';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as GlassApiService from './src/lib/glass-api-service.js';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Handle ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_SOAP_ACTION = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld';

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

// SOAP request helper function
const sendSoapRequest = async (url, options) => {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method,
      headers: options.headers,
      timeout: 30000 // 30 seconds timeout
    };
    
    console.log(`Sending SOAP request to ${urlObj.hostname}${urlObj.pathname}`);
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SOAP response status: ${res.statusCode}`);
        
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        if (success) {
          console.log(`SOAP response data (first 200 chars): ${data.substring(0, 200)}`);
        } else {
          console.error(`SOAP error response: ${data.substring(0, 500)}`);
        }
        
        resolve({
          success,
          statusCode: res.statusCode,
          data,
          error: success ? undefined : `HTTP Error: ${res.statusCode}`
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`SOAP request error:`, error);
      resolve({
        success: false,
        error: `Request error: ${error.message}`
      });
    });
    
    req.on('timeout', () => {
      console.error(`SOAP request timed out`);
      req.destroy();
      resolve({
        success: false,
        error: 'Request timed out after 30 seconds'
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

// Example API endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// Test endpoint for the direct-test
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

// Glass API get models endpoint
app.get('/api/glass/models/:make', async (req, res) => {
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
app.get('/api/glass/stock', async (req, res) => {
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

// Glass API check availability endpoint
app.get('/api/glass/availability/:argicCode', async (req, res) => {
  try {
    const { argicCode } = req.params;
    const qty = req.query.qty ? parseInt(req.query.qty) : 1;
    
    if (!argicCode) {
      return res.status(400).json({
        success: false,
        error: "ARGIC code parameter is required"
      });
    }
    
    const result = await GlassApiService.checkAvailability(argicCode, qty);
    res.json(result);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to check availability"
    });
  }
});

// Glass API get depots endpoint
app.get('/api/glass/depots', async (req, res) => {
  try {
    const result = await GlassApiService.getDepots();
    res.json(result);
  } catch (error) {
    console.error('Error getting depots:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to get depots"
    });
  }
});

// Glass API search by ARGIC code endpoint
app.get('/api/glass/search/:argicCode', async (req, res) => {
  try {
    const { argicCode } = req.params;
    const location = req.query.location || "";
    
    if (!argicCode) {
      return res.status(400).json({
        success: false,
        error: "ARGIC code parameter is required"
      });
    }
    
    const result = await GlassApiService.searchStockByArgic(argicCode, location);
    res.json(result);
  } catch (error) {
    console.error('Error searching by ARGIC code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to search by ARGIC code"
    });
  }
});

// Glass API branch availability endpoint
app.get('/api/glass/branch-availability/:argicCode', async (req, res) => {
  try {
    const { argicCode } = req.params;
    
    if (!argicCode) {
      return res.status(400).json({
        success: false,
        error: "ARGIC code parameter is required"
      });
    }
    
    const result = await GlassApiService.getBranchAvailability(argicCode);
    res.json(result);
  } catch (error) {
    console.error('Error checking branch availability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to check branch availability"
    });
  }
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
    console.log("API Response headers:", response.headers);
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
      
      // Try to log specific details about what's missing
      if (!response.data?.Response) {
        console.log("Missing Response property");
      } else if (response.data.Response.StatusCode !== "Success") {
        console.log(`StatusCode not Success: ${response.data.Response.StatusCode}`);
      } else if (!response.data.Response.DataItems) {
        console.log("Missing DataItems property");
      } else if (!response.data.Response.DataItems.VehicleRegistration) {
        console.log("Missing VehicleRegistration property");
        console.log("DataItems contains:", Object.keys(response.data.Response.DataItems));
      }
      
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

// Glass API SOAP proxy endpoint
app.post('/api/glass-proxy', async (req, res) => {
  try {
    console.log('Glass SOAP proxy endpoint called');
    
    // Validate request body
    if (!req.body || !req.body.soapAction || !req.body.soapEnvelope) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: soapAction and soapEnvelope"
      });
    }
    
    const { soapAction, soapEnvelope } = req.body;
    console.log(`Proxying SOAP request for action: ${soapAction}`);
    
    // Configure the request to the SOAP service
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': soapAction
      },
      body: soapEnvelope
    };
    
    // Make the request to the glass API
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    // Return the result directly to the client
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      console.error('Error from SOAP service:', result.error);
      res.status(result.statusCode || 500).send(result.data || result.error);
    }
  } catch (error) {
    console.error('Error in glass-proxy endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to proxy SOAP request"
    });
  }
});

// New endpoint for Stock Query
app.post('/api/glass/stock-query', async (req, res) => {
  try {
    console.log('Stock Query API endpoint called');
    
    // Extract parameters from the request
    const { magCode, argicCode, depot, model, features } = req.body;
    
    console.log(`Stock query parameters:`, {
      magCode: magCode || 'not provided',
      argicCode: argicCode || 'not provided',
      model: model || 'not provided',
      depot: depot || 'not provided',
      features: features || 'not provided'
    });
    
    if (!magCode && !argicCode && !model) {
      return res.status(400).json({
        success: false,
        error: "Either magCode, argicCode or model must be provided"
      });
    }
    
    // Get API credentials
    const apiLogin = process.env.GLASS_API_LOGIN || 'Q-100';
    const apiPassword = process.env.GLASS_API_PASSWORD || 'b048c57a';
    const apiUserId = process.env.GLASS_API_USER_ID || '1';
    
    // Prepare the SOAP envelope for StockQuery
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${apiLogin}</Login>
      <Password>${apiPassword}</Password>
      <UserID>${apiUserId}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <StockQuery xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <stockItm>
        <StockItem>
          <_branch>${depot || ""}</_branch>
          <_catID>0</_catID>
          <_magCode>${magCode || ""}</_magCode>
          <_argicCode>${argicCode || ""}</_argicCode>
          <_model>${model || ""}</_model>
          <_qty>0</_qty>
          <_price>0</_price>
          <_customerProductID></_customerProductID>
        </StockItem>
      </stockItm>
      <location></location>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </StockQuery>
  </soap:Body>
</soap:Envelope>`;

    // Configure the SOAP request
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/StockQuery'
      },
      body: soapEnvelope
    };
    
    console.log('Sending StockQuery SOAP request');
    
    // Make the request to the Glass API
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    if (result.success) {
      // Extract PriceRecord elements
      try {
        // This is a simplified approach - for production you'd want a proper XML parser
        const responseContent = result.data;
        
        // Check if we have a successful response
        if (responseContent.includes('Success')) {
          // Extract product information using string operations
          // In a production environment, use a proper XML parser library
          const priceRecords = [];
          
          // Simple string-based extraction (this is not ideal but works for demonstration)
          const priceRecordMatches = responseContent.match(/<PriceRecord>[\s\S]*?<\/PriceRecord>/g);
          
          if (priceRecordMatches && priceRecordMatches.length > 0) {
            priceRecordMatches.forEach(recordStr => {
              const magCode = recordStr.match(/<MagCode>(.*?)<\/MagCode>/)?.[1] || '';
              const argicCode = recordStr.match(/<ArgicCode>(.*?)<\/ArgicCode>/)?.[1] || '';
              const price = parseFloat(recordStr.match(/<Price>(.*?)<\/Price>/)?.[1] || '0');
              const qty = parseInt(recordStr.match(/<Qty>(.*?)<\/Qty>/)?.[1] || '0');
              const make = recordStr.match(/<Make>(.*?)<\/Make>/)?.[1] || '';
              const description = recordStr.match(/<Description>(.*?)<\/Description>/)?.[1] || '';
              const priceInfo = recordStr.match(/<PriceInfo>(.*?)<\/PriceInfo>/)?.[1] || '';
              
              priceRecords.push({
                MagCode: magCode,
                ArgicCode: argicCode,
                Price: price,
                Qty: qty,
                Make: make,
                Description: description,
                PriceInfo: priceInfo
              });
            });
            
            res.json({
              success: true,
              priceRecords,
              rawResponse: result.data.substring(0, 500) + "..." // Return first part of raw response for debugging
            });
          } else {
            res.json({
              success: true,
              priceRecords: [],
              message: "No price records found in the response",
              rawResponse: result.data.substring(0, 500) + "..."
            });
          }
        } else {
          // Error in the API response
          const errorMessage = responseContent.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)?.[1] || 'Unknown error in API response';
          res.status(400).json({
            success: false,
            error: errorMessage,
            rawResponse: result.data.substring(0, 500) + "..."
          });
        }
      } catch (parseError) {
        console.error('Error parsing SOAP response:', parseError);
        res.status(500).json({
          success: false,
          error: `Error parsing response: ${parseError.message}`,
          rawResponse: result.data.substring(0, 500) + "..."
        });
      }
    } else {
      console.error('Error from SOAP service:', result.error);
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error || 'Unknown SOAP error',
        message: "Failed to get stock information"
      });
    }
  } catch (error) {
    console.error('Error in stock-query endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to perform stock query"
    });
  }
});

// New endpoint for Stock Query debug
app.get('/api/glass/stock-query-debug', async (req, res) => {
  try {
    console.log('Stock Query DEBUG API endpoint called');
    
    // Extract parameters from the request
    const { magCode, argicCode, model } = req.query;
    const location = req.query.location || '';
    
    // Use test values if none provided
    const testMagCode = magCode || '2448ACCGNMV1B';
    const testArgicCode = argicCode || '2448';
    const testModel = model || 'BMW 1SERIES 2011';
    
    console.log(`Debug query with: magCode=${testMagCode}, argicCode=${testArgicCode}, model=${testModel}`);
    
    // Get API credentials
    const apiLogin = process.env.GLASS_API_LOGIN || 'Q-100';
    const apiPassword = process.env.GLASS_API_PASSWORD || 'b048c57a';
    const apiUserId = process.env.GLASS_API_USER_ID || '1';
    
    // Prepare the SOAP envelope for StockQuery
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${apiLogin}</Login>
      <Password>${apiPassword}</Password>
      <UserID>${apiUserId}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <StockQuery xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <stockItm>
        <StockItem>
          <_branch></_branch>
          <_catID>0</_catID>
          <_magCode>${testMagCode}</_magCode>
          <_argicCode>${testArgicCode}</_argicCode>
          <_model>${testModel}</_model>
          <_qty>0</_qty>
          <_price>0</_price>
          <_customerProductID></_customerProductID>
        </StockItem>
      </stockItm>
      <location>${location}</location>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </StockQuery>
  </soap:Body>
</soap:Envelope>`;

    // Configure the SOAP request
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/StockQuery'
      },
      body: soapEnvelope
    };
    
    console.log('Sending DEBUG StockQuery SOAP request');
    
    // Make the request to the Glass API
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    // Return both success and error cases with full debug info
    return res.status(200).json({
      success: result.success,
      statusCode: result.statusCode,
      rawRequest: soapEnvelope,
      rawResponse: result.data,
      error: result.error,
      parsedData: result.success ? parseStockQueryResponse(result.data) : null
    });
    
  } catch (error) {
    console.error('Error in stock-query-debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to perform stock query debug"
    });
  }
});

// Helper function to parse stock query responses
function parseStockQueryResponse(xmlResponse) {
  try {
    // Check if we have a successful response
    const statusMatch = xmlResponse.match(/<Status>(.*?)<\/Status>/);
    const errorMatch = xmlResponse.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
    
    const status = statusMatch ? statusMatch[1] : 'Unknown';
    const errorMessage = errorMatch ? errorMatch[1] : '';
    
    // Extract product information
    const priceRecords = [];
    
    // Simple string-based extraction
    const priceRecordMatches = xmlResponse.match(/<PriceRecord>[\s\S]*?<\/PriceRecord>/g);
    
    if (priceRecordMatches && priceRecordMatches.length > 0) {
      priceRecordMatches.forEach(recordStr => {
        const magCode = recordStr.match(/<MagCode>(.*?)<\/MagCode>/)?.[1] || '';
        const argicCode = recordStr.match(/<ArgicCode>(.*?)<\/ArgicCode>/)?.[1] || '';
        const price = parseFloat(recordStr.match(/<Price>(.*?)<\/Price>/)?.[1] || '0');
        const qty = parseInt(recordStr.match(/<Qty>(.*?)<\/Qty>/)?.[1] || '0');
        const make = recordStr.match(/<Make>(.*?)<\/Make>/)?.[1] || '';
        const description = recordStr.match(/<Description>(.*?)<\/Description>/)?.[1] || '';
        const priceInfo = recordStr.match(/<PriceInfo>(.*?)<\/PriceInfo>/)?.[1] || '';
        
        priceRecords.push({
          MagCode: magCode,
          ArgicCode: argicCode,
          Price: price,
          Qty: qty,
          Make: make,
          Description: description,
          PriceInfo: priceInfo
        });
      });
    }
    
    return {
      status,
      errorMessage,
      priceRecordsCount: priceRecords.length,
      priceRecords
    };
  } catch (error) {
    return {
      parseError: error.message,
      status: 'ParseError'
    };
  }
}

// Enhanced glass-test endpoint
app.get('/api/glass-test', async (req, res) => {
  console.log('Glass test API endpoint called');
  
  try {
    // Run a series of tests and return detailed results
    const testResults = {
      serverStatus: {
        success: true,
        message: "API server is responding",
        timestamp: new Date().toISOString()
      },
      connectionTests: []
    };
    
    // Test 1: Try connecting to Google as a basic connectivity test
    try {
      console.log("Testing basic internet connectivity with Google...");
      const googleResponse = await axios.get('https://www.google.com', { timeout: 5000 });
      testResults.connectionTests.push({
        name: "Basic Internet Connectivity",
        target: "Google",
        success: true,
        statusCode: googleResponse.status,
        message: "Successfully connected to Google"
      });
    } catch (error) {
      console.error("Google connectivity test failed:", error.message);
      testResults.connectionTests.push({
        name: "Basic Internet Connectivity",
        target: "Google",
        success: false,
        error: error.message,
        message: "Failed to connect to Google - check your internet connection"
      });
    }
    
    // Test 2: Try actual HelloWorld SOAP test using the Glass API service
    try {
      console.log("Testing Master Auto Glass HelloWorld SOAP API...");
      
      // Start timing
      const startTime = Date.now();
      
      // Use the Glass API service to call HelloWorld
      const result = await GlassApiService.helloWorld();
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        testResults.connectionTests.push({
          name: "Glass API HelloWorld",
          target: "Master Auto Glass API",
          success: true,
          message: "Successfully connected to Glass API HelloWorld",
          responseTime: `${responseTime}ms`,
          responseMessage: result.message,
          responsePreview: result.rawResponse ? result.rawResponse.substring(0, 100) : undefined
        });
      } else {
        testResults.connectionTests.push({
          name: "Glass API HelloWorld",
          target: "Master Auto Glass API",
          success: false,
          error: result.error,
          message: "Failed to connect to Glass API HelloWorld",
          responseTime: `${responseTime}ms`
        });
      }
    } catch (error) {
      console.error("HelloWorld SOAP API test failed:", error.message);
      testResults.connectionTests.push({
        name: "Glass API HelloWorld",
        target: "Master Auto Glass API",
        success: false,
        error: error.message,
        message: "Failed to connect to Glass API HelloWorld - Error making request"
      });
    }
    
    // Test 3: Simulated Glass API test (as backup)
    try {
      console.log("Adding simulated Glass API test...");
      testResults.connectionTests.push({
        name: "Simulated Glass API",
        target: "Simulated API",
        success: true,
        statusCode: 200,
        message: "Simulated Glass API test succeeded",
        responseTime: "50ms" // Simulated response time
      });
    } catch (error) {
      console.error("Simulated API test failed:", error.message);
      testResults.connectionTests.push({
        name: "Simulated Glass API",
        target: "Simulated API",
        success: false,
        error: error.message,
        message: "Simulated API test failed"
      });
    }
    
    // Determine overall success (at least one test passed)
    const anyRealTestPassed = testResults.connectionTests.slice(0, 2).some(test => test.success);
    testResults.overallSuccess = anyRealTestPassed;
    testResults.message = anyRealTestPassed 
      ? "At least one connection test passed" 
      : "All connection tests failed - check details";
    
    // Return the detailed test results
    res.json(testResults);
    
  } catch (error) {
    console.error('Error in glass-test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to run API connection tests",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Glass API test page
app.get('/api/glass-api-explorer', (req, res) => {
  // Serve an HTML page that allows testing all Glass API endpoints
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Glass API Explorer</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
      .success { border-left: 5px solid green; }
      .failure { border-left: 5px solid red; }
      .test-item { margin-bottom: 10px; padding: 10px; border-radius: 4px; }
      .test-success { background-color: #e6ffe6; }
      .test-failure { background-color: #ffe6e6; }
      button { padding: 10px 15px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
      button:hover { background: #3367d6; }
      select, input { padding: 8px; margin: 5px; min-width: 200px; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; max-height: 400px; }
      .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,.3); border-radius: 50%; border-top-color: #4285f4; animation: spin 1s ease-in-out infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .api-section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
      h2 { color: #4285f4; }
      label { display: block; margin-top: 10px; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Glass API Explorer</h1>
    <p>Use this page to test all available Glass API endpoints</p>
    
    <div class="api-section">
      <h2>HelloWorld Test</h2>
      <button id="test-hello-world">Test HelloWorld</button>
      <div id="hello-world-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Get Vehicle Makes</h2>
      <button id="get-makes">Get All Makes</button>
      <div id="makes-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Get Vehicle Models</h2>
      <label for="make-select">Select Make:</label>
      <select id="make-select">
        <option value="">-- Select a make first --</option>
      </select>
      <button id="get-models">Get Models</button>
      <div id="models-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Get Stock List</h2>
      <label for="stock-make">Make:</label>
      <input type="text" id="stock-make" placeholder="e.g., FORD">
      
      <label for="stock-model">Model:</label>
      <input type="text" id="stock-model" placeholder="e.g., FOCUS">
      
      <label for="stock-year">Year:</label>
      <input type="number" id="stock-year" placeholder="e.g., 2020">
      
      <button id="get-stock">Get Stock List</button>
      <div id="stock-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Check Availability</h2>
      <label for="argic-code">ARGIC Code:</label>
      <input type="text" id="argic-code" placeholder="e.g., 2448AGNMV1B">
      
      <label for="qty">Quantity:</label>
      <input type="number" id="qty" value="1" min="1">
      
      <button id="check-availability">Check Availability</button>
      <div id="availability-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Get Depots</h2>
      <button id="get-depots">Get All Depots</button>
      <div id="depots-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <div class="api-section">
      <h2>Branch Availability</h2>
      <label for="branch-argic">ARGIC Code:</label>
      <input type="text" id="branch-argic" placeholder="e.g., 2448AGNMV1B">
      
      <button id="check-branch-availability">Check Branch Availability</button>
      <div id="branch-availability-result" style="margin-top: 10px;">Results will appear here...</div>
    </div>
    
    <script>
      // Helper function to display results
      function displayResult(elementId, data, isSuccess = true) {
        const resultElement = document.getElementById(elementId);
        resultElement.innerHTML = \`
          <div class="card \${isSuccess ? 'success' : 'failure'}">
            <h3>\${isSuccess ? 'Success' : 'Failed'}</h3>
            <pre>\${JSON.stringify(data, null, 2)}</pre>
          </div>
        \`;
      }
      
      // Helper function to show loading state
      function showLoading(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = '<div class="loading"></div> Loading...';
      }
      
      // HelloWorld test
      document.getElementById('test-hello-world').addEventListener('click', async () => {
        showLoading('hello-world-result');
        try {
          const response = await fetch('/api/glass/hello-world');
          const data = await response.json();
          displayResult('hello-world-result', data, data.success);
        } catch (error) {
          displayResult('hello-world-result', { error: error.message }, false);
        }
      });
      
      // Get Makes
      document.getElementById('get-makes').addEventListener('click', async () => {
        showLoading('makes-result');
        try {
          const response = await fetch('/api/glass/makes');
          const data = await response.json();
          displayResult('makes-result', data, data.success);
          
          if (data.success && data.makes && data.makes.length > 0) {
            // Populate the make select dropdown
            const makeSelect = document.getElementById('make-select');
            makeSelect.innerHTML = '<option value="">-- Select a make --</option>';
            
            data.makes.forEach(make => {
              const option = document.createElement('option');
              option.value = make;
              option.textContent = make;
              makeSelect.appendChild(option);
            });
          }
        } catch (error) {
          displayResult('makes-result', { error: error.message }, false);
        }
      });
      
      // Get Models
      document.getElementById('get-models').addEventListener('click', async () => {
        const makeSelect = document.getElementById('make-select');
        const selectedMake = makeSelect.value;
        
        if (!selectedMake) {
          displayResult('models-result', { error: 'Please select a make first' }, false);
          return;
        }
        
        showLoading('models-result');
        try {
          const response = \`/api/glass/models/\${encodeURIComponent(selectedMake)}\`;
          const data = await fetch(response);
          const jsonData = await data.json();
          displayResult('models-result', jsonData, jsonData.success);
        } catch (error) {
          displayResult('models-result', { error: error.message }, false);
        }
      });
      
      // Get Stock List
      document.getElementById('get-stock').addEventListener('click', async () => {
        const make = document.getElementById('stock-make').value;
        const model = document.getElementById('stock-model').value;
        const year = document.getElementById('stock-year').value;
        
        if (!make || !model || !year) {
          displayResult('stock-result', { error: 'Make, model, and year are all required' }, false);
          return;
        }
        
        showLoading('stock-result');
        try {
          const url = \`/api/glass/stock?make=\${encodeURIComponent(make)}&model=\${encodeURIComponent(model)}&year=\${encodeURIComponent(year)}\`;
          const response = await fetch(url);
          const data = await response.json();
          displayResult('stock-result', data, data.success);
        } catch (error) {
          displayResult('stock-result', { error: error.message }, false);
        }
      });
      
      // Check Availability
      document.getElementById('check-availability').addEventListener('click', async () => {
        const argicCode = document.getElementById('argic-code').value;
        const qty = document.getElementById('qty').value || 1;
        
        if (!argicCode) {
          displayResult('availability-result', { error: 'ARGIC code is required' }, false);
          return;
        }
        
        showLoading('availability-result');
        try {
          const url = \`/api/glass/availability/\${encodeURIComponent(argicCode)}?qty=\${encodeURIComponent(qty)}\`;
          const response = await fetch(url);
          const data = await response.json();
          displayResult('availability-result', data, data.success);
        } catch (error) {
          displayResult('availability-result', { error: error.message }, false);
        }
      });
      
      // Get Depots
      document.getElementById('get-depots').addEventListener('click', async () => {
        showLoading('depots-result');
        try {
          const response = await fetch('/api/glass/depots');
          const data = await response.json();
          displayResult('depots-result', data, data.success);
        } catch (error) {
          displayResult('depots-result', { error: error.message }, false);
        }
      });
      
      // Check Branch Availability
      document.getElementById('check-branch-availability').addEventListener('click', async () => {
        const argicCode = document.getElementById('branch-argic').value;
        
        if (!argicCode) {
          displayResult('branch-availability-result', { error: 'ARGIC code is required' }, false);
          return;
        }
        
        showLoading('branch-availability-result');
        try {
          const url = \`/api/glass/branch-availability/\${encodeURIComponent(argicCode)}\`;
          const response = await fetch(url);
          const data = await response.json();
          displayResult('branch-availability-result', data, data.success);
        } catch (error) {
          displayResult('branch-availability-result', { error: error.message }, false);
        }
      });
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Add a simple HTML page to test the API directly
app.get('/api/glass-test-page', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>API Connection Test</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
      .success { border-left: 5px solid green; }
      .failure { border-left: 5px solid red; }
      .test-item { margin-bottom: 10px; padding: 10px; border-radius: 4px; }
      .test-success { background-color: #e6ffe6; }
      .test-failure { background-color: #ffe6e6; }
      button { padding: 10px 15px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
      button:hover { background: #3367d6; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
    </style>
  </head>
  <body>
    <h1>Direct API Connection Test</h1>
    <p>This page tests API connectivity directly from the server to avoid browser CORS issues.</p>
    
    <div class="card" id="test-container">
      <h2>Test Results</h2>
      <p>Click the button below to run the test:</p>
      <button id="run-test">Run API Test</button>
      <div id="results">Not tested yet</div>
    </div>
    
    <div class="card">
      <h2>Additional Tests</h2>
      <p>Try our other testing endpoints:</p>
      <a href="/api/hello-world-page" target="_blank">
        <button style="background-color: #f57c00;">Test HelloWorld SOAP API</button>
      </a>
      <a href="/api/glass-api-explorer" target="_blank">
        <button style="background-color: #0d904f;">Open Glass API Explorer</button>
      </a>
    </div>
    
    <script>
      document.getElementById('run-test').addEventListener('click', async () => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<p>Running tests...</p>';
        
        try {
          const response = await fetch('/api/glass-test');
          
          if (!response.ok) {
            throw new Error(\`HTTP error! Status: \${response.status}\`);
          }
          
          const data = await response.json();
          console.log('API Test Response:', data);
          
          // Create results HTML
          let resultsHtml = '';
          
          if (data.overallSuccess !== undefined) {
            // New format with detailed test results
            resultsHtml = \`
              <div class="card \${data.overallSuccess ? 'success' : 'failure'}">
                <h3>\${data.overallSuccess ? 'Success!' : 'Some tests failed'}</h3>
                <p>\${data.message || ''}</p>
              </div>
              
              <h3>Individual Test Results:</h3>
            \`;
            
            if (data.connectionTests && data.connectionTests.length > 0) {
              data.connectionTests.forEach(test => {
                resultsHtml += \`
                  <div class="test-item \${test.success ? 'test-success' : 'test-failure'}">
                    <h4>\${test.name || 'Unnamed Test'}</h4>
                    <p><strong>Target:</strong> \${test.target || 'Unknown'}</p>
                    <p><strong>Status:</strong> \${test.success ? 'Success' : 'Failed'}</p>
                    <p><strong>Message:</strong> \${test.message || ''}</p>
                    \${test.error ? \`<p><strong>Error:</strong> \${test.error}</p>\` : ''}
                  </div>
                \`;
              });
            }
          } else {
            // Old format
            resultsHtml = \`
              <div class="card \${data.success ? 'success' : 'failure'}">
                <h3>\${data.success ? 'Success!' : 'Failed'}</h3>
                <p>\${data.message || ''}</p>
                \${data.error ? \`<p><strong>Error:</strong> \${data.error}</p>\` : ''}
              </div>
            \`;
          }
          
          // Show raw response for debugging
          resultsHtml += \`
            <h3>Raw Response:</h3>
            <pre>\${JSON.stringify(data, null, 2)}</pre>
          \`;
          
          resultsDiv.innerHTML = resultsHtml;
        } catch (error) {
          console.error('Error running test:', error);
          resultsDiv.innerHTML = \`
            <div class="card failure">
              <h3>Error Running Test</h3>
              <p>\${error.message}</p>
            </div>
          \`;
        }
      });
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Add direct test endpoint for GetStockList
app.get('/api/glass/test-stock-list', async (req, res) => {
  console.log('Direct GetStockList test endpoint called');
  
  try {
    // Use known values for BMW 1 Series
    const make = req.query.make || 'BMW';
    const model = req.query.model || '1SERIES';
    const year = parseInt(req.query.year || '2011');
    
    console.log(`Testing getStockList for ${make} ${model} ${year}`);
    
    // Get API credentials
    const apiLogin = process.env.GLASS_API_LOGIN || 'Q-100';
    const apiPassword = process.env.GLASS_API_PASSWORD || 'b048c57a';
    const apiUserId = process.env.GLASS_API_USER_ID || '1';
    
    // Prepare the SOAP envelope for getStockList
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${apiLogin}</Login>
      <Password>${apiPassword}</Password>
      <UserID>${apiUserId}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <getStockList xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <make>${make}</make>
      <model>${model}</model>
      <modelType></modelType>
      <year>${year}</year>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getStockList>
  </soap:Body>
</soap:Envelope>`;

    // Configure the SOAP request
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList'
      },
      body: soapEnvelope
    };
    
    console.log('Sending getStockList SOAP request directly');
    
    // Make the request to the Glass API directly
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    if (result.success) {
      try {
        // Check if we have a successful response
        if (result.data.includes('Success')) {
          // Extract status and error message
          const statusMatch = result.data.match(/<Status>(.*?)<\/Status>/);
          const errorMatch = result.data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
          
          const status = statusMatch ? statusMatch[1] : 'Unknown';
          const errorMessage = errorMatch ? errorMatch[1] : '';
          
          // Check for PriceRecord elements
          const priceRecordMatches = result.data.match(/<PriceRecord>[\s\S]*?<\/PriceRecord>/g);
          const priceRecords = [];
          
          if (priceRecordMatches && priceRecordMatches.length > 0) {
            priceRecordMatches.forEach(recordStr => {
              const magCode = recordStr.match(/<MagCode>(.*?)<\/MagCode>/)?.[1] || '';
              const argicCode = recordStr.match(/<ArgicCode>(.*?)<\/ArgicCode>/)?.[1] || '';
              const price = parseFloat(recordStr.match(/<Price>(.*?)<\/Price>/)?.[1] || '0');
              const qty = parseInt(recordStr.match(/<Qty>(.*?)<\/Qty>/)?.[1] || '0');
              const makeName = recordStr.match(/<Make>(.*?)<\/Make>/)?.[1] || '';
              const description = recordStr.match(/<Description>(.*?)<\/Description>/)?.[1] || '';
              const priceInfo = recordStr.match(/<PriceInfo>(.*?)<\/PriceInfo>/)?.[1] || '';
              
              priceRecords.push({
                MagCode: magCode,
                ArgicCode: argicCode,
                Price: price,
                Qty: qty,
                Make: makeName,
                Description: description,
                PriceInfo: priceInfo
              });
            });
          }
          
          res.json({
            success: true,
            status,
            errorMessage,
            vehicle: { make, model, year },
            priceRecords,
            count: priceRecords.length,
            soapResponsePreview: result.data.substring(0, 500) + "..."
          });
        } else {
          // Error in the API response
          const errorMessage = result.data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)?.[1] || 'Unknown error in API response';
          res.status(400).json({
            success: false,
            error: errorMessage,
            rawResponse: result.data.substring(0, 500) + "..."
          });
        }
      } catch (parseError) {
        console.error('Error parsing SOAP response:', parseError);
        res.status(500).json({
          success: false,
          error: `Error parsing response: ${parseError.message}`,
          rawResponse: result.data.substring(0, 500) + "..."
        });
      }
    } else {
      console.error('Error from SOAP service:', result.error);
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error || 'Unknown SOAP error',
        message: "Failed to get stock information"
      });
    }
  } catch (error) {
    console.error('Error in test-stock-list endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to perform stock list test"
    });
  }
});

// Add this after the other glass API endpoints
app.get('/api/glass-availability', async (req, res) => {
  try {
    console.log('Glass Availability API endpoint called');
    
    // Extract parameters from the request
    const { argicCode, quantity, depot } = req.query;
    
    console.log(`Checking availability for argicCode: ${argicCode}, quantity: ${quantity}, depot: ${depot}`);
    
    if (!argicCode) {
      return res.status(400).json({
        success: false,
        error: "ARGIC code parameter is required"
      });
    }
    
    // Get API credentials
    const apiLogin = process.env.GLASS_API_LOGIN || 'Q-100';
    const apiPassword = process.env.GLASS_API_PASSWORD || 'b048c57a';
    const apiUserId = process.env.GLASS_API_USER_ID || '1';
    
    // If a specific depot is provided, check availability there
    if (depot) {
      // Construct SOAP request for checking at specific depot
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${apiLogin}</Login>
      <Password>${apiPassword}</Password>
      <UserID>${apiUserId}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <checkAvailability xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <argicCode>${argicCode}</argicCode>
      <customerProductID></customerProductID>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
      <qty>${quantity || 1}</qty>
      <depot>${depot}</depot>
      <dateRequired>${new Date().toISOString()}</dateRequired>
    </checkAvailability>
  </soap:Body>
</soap:Envelope>`;

      // Configure the SOAP request
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/checkAvailability'
        },
        body: soapEnvelope
      };

      console.log('Sending checkAvailability SOAP request for specific depot');
      
      // Make the request to the Glass API
      const result = await sendSoapRequest(GLASS_API_URL, options);
      
      if (result.success) {
        // Check if the response indicates success
        const responseText = result.data;
        const status = responseText.match(/<Status>(.*?)<\/Status>/)?.[1] || '';
        const isAvailable = responseText.includes('<IsAvailable>true</IsAvailable>');
        const availableQty = parseInt(responseText.match(/<AvailableQty>(.*?)<\/AvailableQty>/)?.[1] || '0');
        
        if (status === 'Success') {
          // Get the depot name from our hardcoded list
          const depotList = [
            { DepotCode: 'BIR', DepotName: 'Birmingham' },
            { DepotCode: 'CMB', DepotName: 'Cambridge' },
            { DepotCode: 'DUR', DepotName: 'Durham' },
            { DepotCode: 'GLA', DepotName: 'Glasgow' },
            { DepotCode: 'MAN', DepotName: 'Manchester' },
            { DepotCode: 'NOT', DepotName: 'Nottingham' },
            { DepotCode: 'PAR', DepotName: 'Park Royal' },
            { DepotCode: 'PLT', DepotName: 'Plate Glass' },
            { DepotCode: 'ROC', DepotName: 'Maidstone' },
            { DepotCode: 'WAL', DepotName: 'Walthamstow' }
          ];
          
          const depotName = depotList.find(d => d.DepotCode === depot)?.DepotName || depot;
          
          res.json({
            success: true,
            isAvailable,
            availableQty,
            totalAvailable: availableQty,
            depots: availableQty > 0 ? [{
              depotCode: depot,
              depotName: depotName,
              Qty: availableQty
            }] : []
          });
        } else {
          const errorMessage = responseText.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)?.[1] || 'Unknown error in API response';
          res.status(400).json({
            success: false,
            error: errorMessage
          });
        }
      } else {
        console.error('Error from SOAP service:', result.error);
        res.status(result.statusCode || 500).json({
          success: false,
          error: result.error || 'Unknown SOAP error',
          message: "Failed to check availability"
        });
      }
    } else {
      // If no specific depot provided, get all depots and check availability
      console.log('No specific depot provided, checking all depots');

      // Get the depots first
      const depotResult = await GlassApiService.getDepots();
      
      if (!depotResult.depots || depotResult.depots.length === 0) {
        return res.status(400).json({
          success: false,
          error: depotResult.error || "Failed to retrieve depots"
        });
      }
      
      console.log(`Checking availability across ${depotResult.depots.length} depots`);
      
      // For each depot, check availability
      const availabilityPromises = depotResult.depots.map(async (depot) => {
        try {
          const result = await GlassApiService.checkAvailability(
            argicCode, 
            parseInt(quantity) || 1,
            depot.DepotCode
          );
          
          if (result.isAvailable) {
            return {
              depotCode: depot.DepotCode,
              depotName: depot.DepotName,
              Qty: result.availableQty || 0
            };
          }
          return null;
        } catch (error) {
          console.error(`Error checking availability at ${depot.DepotCode}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(availabilityPromises);
      const availableDepots = results.filter(Boolean);
      
      // Calculate total availability
      const totalAvailable = availableDepots.reduce((sum, depot) => sum + depot.Qty, 0);
      
      res.json({
        success: true,
        depots: availableDepots,
        totalAvailable
      });
    }
  } catch (error) {
    console.error('Error in glass-availability endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to check availability"
    });
  }
});

// Glass API get ARGIC from VRN endpoint
app.get('/api/glass/vrn-lookup/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: "VRN parameter is required"
      });
    }
    
    console.log(`Processing VRN lookup request for: ${vrn}`);
    const result = await GlassApiService.getArgicFromVRN(vrn);
    
    if (result.success) {
      res.json({
        success: true,
        vrn: vrn,
        argicCode: result.argicCode,
        vehicleDetails: {
          make: result.make,
          model: result.model,
          year: result.year
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || "Failed to find ARGIC code for this VRN",
        vrn: vrn
      });
    }
  } catch (error) {
    console.error('Error in VRN to ARGIC lookup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to process VRN lookup"
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`Glass test available at http://localhost:${PORT}/api/glass-test`);
  console.log(`HelloWorld test available at http://localhost:${PORT}/api/glass/hello-world`);
  console.log(`Glass API Explorer available at http://localhost:${PORT}/api/glass-api-explorer`);
}); 