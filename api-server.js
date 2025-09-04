import express from 'express';
import https from 'node:https';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_SOAP_ACTION = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList';
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

// Main endpoint to get vehicle glass data using VRN
app.get('/api/vehicle/glass/:vrn', async (req, res) => {
  try {
    const { vrn } = req.params;
    
    if (!vrn) {
      return res.status(400).json({
        success: false,
        error: "VRN parameter is required"
      });
    }
    
    console.log(`\n-----------------------------------------------------`);
    console.log(`PROCESSING VEHICLE GLASS DATA REQUEST FOR VRN: ${vrn}`);
    console.log(`-----------------------------------------------------\n`);
    
    // STEP 1: Fetch vehicle data from vehicle API
    console.log(`STEP 1: FETCHING VEHICLE DATA FROM UK API FOR VRN: ${vrn}`);
    
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
    
    let vehicleDetails;
    
    const response = await axios.get(url);
      
    // Check if response contains valid data
    if (
      response.data?.Response &&
      response.data.Response.StatusCode === "Success" &&
      response.data.Response.DataItems &&
      response.data.Response.DataItems.VehicleRegistration
    ) {
      const registration = response.data.Response.DataItems.VehicleRegistration;
      
      // Get the vehicle details from the response
      vehicleDetails = {
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        bodyStyle: registration.BodyStyle || "",
        vrn: vrn.trim()
      };
      
      console.log(`STEP 1 COMPLETE: Vehicle data retrieved`);
      console.log(JSON.stringify(vehicleDetails, null, 2));
    } else {
      console.log("UK Vehicle API response did not contain expected vehicle data");
      
      return res.status(404).json({
        success: false,
        error: "Vehicle data not found in API response",
        vrn: vrn
      });
    }
    
    // STEP 2: Get glass data from MAG API using vehicle details
    console.log(`\nSTEP 2: FETCHING GLASS DATA FROM MAG API USING VEHICLE DETAILS`);
    
    if (vehicleDetails.make && vehicleDetails.model && vehicleDetails.year) {
      // Normalize model using a generic function that works for multiple manufacturers
      let normalizedModel = normalizeModelForMagApi(vehicleDetails.make, vehicleDetails.model);
      console.log(`Using model: "${normalizedModel}" for MAG API lookup`);
      
      // Get glass data using getStockList SOAP API
      const glassData = await getGlassData(
        vehicleDetails.make,
        normalizedModel,
        parseInt(vehicleDetails.year),
        vehicleDetails.bodyStyle
      );
      
      if (glassData.success) {
        // Add glass data to vehicle details
        vehicleDetails.argicCode = glassData.argicCode;
        vehicleDetails.shortArgicCode = glassData.shortArgicCode;
        vehicleDetails.glassOptions = glassData.glassOptions;
        
        console.log(`STEP 2 COMPLETE: Glass data retrieved`);
        console.log(`Primary ARGIC code: ${glassData.argicCode}`);
        console.log(`Short ARGIC code (first 4 digits): ${glassData.shortArgicCode}`);
      } else {
        console.log(`No glass data found in MAG API: ${glassData.error}`);
        vehicleDetails.glassError = glassData.error;
      }
    }
    
    // Return the complete vehicle details including glass data
    res.json({
      success: true,
      data: vehicleDetails
    });
    
  } catch (error) {
    console.error('Error in vehicle glass data flow:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      message: "Failed to process vehicle glass data request"
    });
  }
});

// Function to get glass data from MAG API using getStockList
async function getGlassData(make, model, year, modelType = '') {
  try {
    console.log(`\n-----------------------------------------------------`);
    console.log(`MAG API: SEARCHING FOR GLASS DATA`);
    console.log(`-----------------------------------------------------`);
    console.log(`PARAMETERS:
    - Make: ${make}
    - Model: ${model}
    - Year: ${year}
    - ModelType: ${modelType}`);
    
    // Get API credentials from environment variables
    const apiLogin = process.env.GLASS_API_LOGIN || 'Q-100';
    const apiPassword = process.env.GLASS_API_PASSWORD || 'b048c57a';
    const apiUserId = process.env.GLASS_API_USER_ID || '1';
    
    console.log(`Using MAG API credentials: Login=${apiLogin}, UserID=${apiUserId}`);
    
    // Normalize input parameters
    const normalizedMake = make.trim().toUpperCase();
    const normalizedModel = model.trim().toUpperCase();
    
    // Normalize model type
    let pdaModelType = modelType || '';
    if (pdaModelType.includes('SALOON')) pdaModelType = 'SALOON';
    if (pdaModelType.includes('HATCHBACK')) pdaModelType = 'HATCHBACK';
    if (pdaModelType.includes('ESTATE')) pdaModelType = 'ESTATE';
    if (pdaModelType.includes('SUV')) pdaModelType = 'SUV';
    if (pdaModelType.includes('COUPE')) pdaModelType = 'COUPE';
    if (pdaModelType.includes('CONVERTIBLE')) pdaModelType = 'CONVERTIBLE';
    
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
      <make>${normalizedMake}</make>
      <model>${normalizedModel}</model>
      <modelType>${pdaModelType}</modelType>
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
    
    // Make the request to the Glass API
    console.log('Sending SOAP request to MAG API...');
    
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    if (result.success) {
      // Process the XML response
      const responseXml = result.data;
      
      // Check if the response indicates success
      if (responseXml.includes('<Status>Success</Status>')) {
        console.log("MAG API returned Success status");
        
        // Extract all ARGIC codes
        const glassOptions = [];
        const argicCodeMatches = responseXml.matchAll(/<ArgicCode>(.*?)<\/ArgicCode>/g);
        
        for (const match of argicCodeMatches) {
          if (match && match[1]) {
            const fullCode = match[1];
            // Get the first 4 characters as the short code
            const shortCode = fullCode.substring(0, 4);
            
            // Extract other useful glass information
            let description = '';
            let price = 0;
            let qty = 0;
            
            // Try to find the corresponding description
            const descMatch = new RegExp(`<ArgicCode>${fullCode}</ArgicCode>[\\s\\S]*?<Description>(.*?)</Description>`, 'i').exec(responseXml);
            if (descMatch && descMatch[1]) {
              description = descMatch[1];
            }
            
            // Try to find the corresponding price
            const priceMatch = new RegExp(`<ArgicCode>${fullCode}</ArgicCode>[\\s\\S]*?<Price>(.*?)</Price>`, 'i').exec(responseXml);
            if (priceMatch && priceMatch[1]) {
              price = parseFloat(priceMatch[1]);
            }
            
            // Try to find the corresponding quantity
            const qtyMatch = new RegExp(`<ArgicCode>${fullCode}</ArgicCode>[\\s\\S]*?<Qty>(.*?)</Qty>`, 'i').exec(responseXml);
            if (qtyMatch && qtyMatch[1]) {
              qty = parseInt(qtyMatch[1]);
            }
            
            // Add to the glass options if not a duplicate
            if (!glassOptions.some(opt => opt.fullCode === fullCode)) {
              glassOptions.push({
                fullCode,
                shortCode,
                description,
                price,
                qty
              });
              console.log(`Found glass option: ${fullCode} (Short: ${shortCode})`);
            }
          }
        }
        
        if (glassOptions.length > 0) {
          console.log(`MAG API SUCCESS: Found ${glassOptions.length} glass options`);
          return {
            success: true,
            argicCode: glassOptions[0].fullCode,
            shortArgicCode: glassOptions[0].shortCode,
            glassOptions: glassOptions
          };
        } else {
          console.log("MAG API returned Success but no glass options found in the response");
          return {
            success: false,
            error: "No glass options found in the response"
          };
        }
      } else {
        // Extract error message
        const errorMatch = responseXml.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown error";
        
        console.error(`Error in SOAP response: ${errorMessage}`);
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } else {
      console.error("SOAP request failed:", result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error("Error getting glass data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to normalize vehicle model names for MAG API compatibility
function normalizeModelForMagApi(make, model) {
  // Convert to uppercase for consistency
  const upperMake = make.trim().toUpperCase();
  const upperModel = model.trim().toUpperCase();
  
  console.log(`Original model: "${upperModel}"`);
  
  // BMW specific normalization
  if (upperMake === 'BMW') {
    if (/^1\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "1 SERIES"`);
      return "1 SERIES";
    } else if (/^2\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "2 SERIES"`);
      return "2 SERIES";
    } else if (/^3\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "3 SERIES"`);
      return "3 SERIES";
    } else if (/^4\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "4 SERIES"`);
      return "4 SERIES";
    } else if (/^5\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "5 SERIES"`);
      return "5 SERIES";
    } else if (/^6\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "6 SERIES"`);
      return "6 SERIES";
    } else if (/^7\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "7 SERIES"`);
      return "7 SERIES";
    } else if (/^8\d{2}/.test(upperModel)) {
      console.log(`Normalized BMW model from "${upperModel}" to "8 SERIES"`);
      return "8 SERIES";
    }
  }
  
  // For all other manufacturers, just use the first word of the model
  // This handles cases like "207 ENVY HDI" -> "207" or "BERLINGO 625 EN-PRISE HDI" -> "BERLINGO"
  const firstWord = upperModel.split(' ')[0];
  if (firstWord && firstWord !== upperModel) {
    console.log(`Simplified model from "${upperModel}" to "${firstWord}"`);
    return firstWord;
  }
  
  // If no specific rule applies or it's already a single word, return the original model
  return upperModel;
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 