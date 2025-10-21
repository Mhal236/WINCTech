import express from 'express';
import https from 'node:https';
import axios from 'axios';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env files
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_SOAP_ACTION = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList';
const VEHICLE_API_URL = process.env.VITE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
const VEHICLE_API_KEY = process.env.VEHICLE_API_KEY || '6193cc7a-c1b2-469c-ad41-601c6faa294c';

// Initialize Stripe
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  } else {
    console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// Initialize Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

function getSupabaseAdmin() {
  // Use service role key if available, otherwise fall back to anon key
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !key) {
    return { error: 'Missing SUPABASE_URL or SUPABASE keys in server env' };
  }
  
  console.log(`🔧 Using Supabase key: ${SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);
  const client = createClient(SUPABASE_URL, key, { 
    auth: { persistSession: false }
  });
  return { client };
}

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
      const dataItems = response.data.Response.DataItems;
      const registration = dataItems.VehicleRegistration;
      const technicalDetails = dataItems.TechnicalDetails;
      const smmtDetails = dataItems.SmmtDetails;
      
      // Log all available fields from the API to see what we have
      console.log('🔍 Full Response Data from API:', JSON.stringify({
        registration: registration,
        technicalDetails: technicalDetails?.Dimensions,
        smmtDetails: smmtDetails
      }, null, 2));
      
      // Also fetch vehicle image
      let vehicleImageUrl = null;
      try {
        const imageApiBaseUrl = process.env.VITE_IMAGE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleImageData?v=2&auth_apikey=';
        const imageApiUrl = `${imageApiBaseUrl}${VEHICLE_API_KEY}&key_vrm=${encodeURIComponent(vrn.trim())}`;
        console.log(`📸 Fetching vehicle image for VRN: ${vrn}`);
        console.log(`📸 Image API URL: ${imageApiUrl}`);
        
        const imageResponse = await axios.get(imageApiUrl);
        console.log(`📸 Image API Response Status: ${imageResponse.status}`);
        
        if (imageResponse.status === 200 && imageResponse.data) {
          const imageData = imageResponse.data;
          console.log('📸 Vehicle Image API Full Response:', JSON.stringify(imageData, null, 2));
          
          // Extract image URL from response
          if (imageData?.Response?.DataItems?.VehicleImages?.ImageDetailsList?.length > 0) {
            vehicleImageUrl = imageData.Response.DataItems.VehicleImages.ImageDetailsList[0].ImageUrl;
            console.log(`✅ Found vehicle image: ${vehicleImageUrl}`);
          } else {
            console.log(`⚠️ No vehicle image found in response structure`);
            console.log(`📸 Response structure: Response=${!!imageData?.Response}, DataItems=${!!imageData?.Response?.DataItems}, VehicleImages=${!!imageData?.Response?.DataItems?.VehicleImages}, ImageDetailsList=${!!imageData?.Response?.DataItems?.VehicleImages?.ImageDetailsList}`);
          }
        }
      } catch (imageError) {
        console.error('❌ Error fetching vehicle image:', imageError.message);
        if (imageError.response) {
          console.error('❌ Image API Error Response:', imageError.response.status, imageError.response.data);
        }
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
      
      // Return vehicle details
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
    
    // DEMO MODE: Check for demonstration VRN
    if (vrn.trim().toUpperCase() === 'HN11EYW') {
      console.log('🎯 DEMO MODE: Returning demonstration data for VRN HN11EYW');
      
      const demoVehicleDetails = {
        make: "BMW",
        model: "3 SERIES",
        year: "2011",
        bodyStyle: "SALOON",
        variant: "320D",
        fuel: "Diesel",
        transmission: "Manual",
        doors: "4",
        vin: "DEMO12345678VIN",
        vrn: "HN11EYW",
        argicCode: "2448ACCGNMV1B",
        shortArgicCode: "2448",
        glassOptions: [
          {
            fullCode: "2448ACCGNMV1B",
            shortCode: "2448",
            description: "Windscreen - Rain Sensor - Acoustic Laminated Glass",
            price: 285.50,
            qty: 5,
            hasSensor: true,
            hasCamera: false,
            isAcoustic: true,
            features: {
              sensor: true,
              camera: false,
              acoustic: true
            }
          },
          {
            fullCode: "2448RGDH5RD",
            shortCode: "2448",
            description: "Right Body Glass - Door Glass",
            price: 95.00,
            qty: 3,
            hasSensor: false,
            hasCamera: false,
            features: {
              sensor: false
            }
          },
          {
            fullCode: "2448LGDH5RD",
            shortCode: "2448",
            description: "Left Body Glass - Door Glass",
            price: 95.00,
            qty: 3,
            hasSensor: false,
            hasCamera: false,
            features: {
              sensor: false
            }
          },
          {
            fullCode: "2448BGDHAB1F",
            shortCode: "2448",
            description: "Rear Screen - Backlight",
            price: 165.00,
            qty: 2,
            hasSensor: false,
            hasCamera: false,
            isHeated: false,
            features: {
              sensor: false,
              heated: false
            }
          }
        ],
        vehicle_image_url: ""
      };
      
      console.log('Demo vehicle data:', JSON.stringify(demoVehicleDetails, null, 2));
      
      return res.json({
        success: true,
        data: demoVehicleDetails,
        isDemo: true
      });
    }
    
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

// =============================
// Stripe Payment Endpoints
// =============================

// Create payment intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }

    const { amount, credits, currency = 'gbp', description } = req.body;

    if (!amount || !credits || amount < 100) { // Minimum £1.00
      return res.status(400).json({ error: 'Invalid amount or credits' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in pence
      currency,
      description: description || `Purchase ${credits} credits`,
      payment_method_types: ['card'], // Only allow card payments
      metadata: {
        credits: credits.toString(),
        type: 'credit_purchase'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

// Confirm payment and add credits to user account
app.post('/api/stripe/confirm-payment', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { paymentIntentId, technicianId } = req.body;

    if (!paymentIntentId || !technicianId) {
      return res.status(400).json({ success: false, error: 'Missing paymentIntentId or technicianId' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment not completed successfully' 
      });
    }

    const credits = parseInt(paymentIntent.metadata.credits);
    if (isNaN(credits) || credits <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credits in payment metadata' 
      });
    }

    // Check if this payment has already been processed
    const { data: existingTransaction, error: checkError } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (existingTransaction) {
      return res.status(409).json({ 
        success: false, 
        error: 'Payment already processed' 
      });
    }

    // Get current user credits from both app_users and technicians tables
    // First try app_users table (main user table)
    const { data: appUserData, error: appUserError } = await supabase
      .from('app_users')
      .select('credits')
      .eq('id', technicianId)
      .single();

    // Also try technicians table (linked by user_id)
    const { data: technicianData, error: technicianError } = await supabase
      .from('technicians')
      .select('id, credits')
      .eq('user_id', technicianId)
      .single();

    let currentCredits = 0;
    let updateAppUser = false;
    let updateTechnician = false;
    let technicianRecordId = null;

    if (appUserData && !appUserError) {
      currentCredits = parseFloat(appUserData.credits) || 0;
      updateAppUser = true;
      console.log(`Found app_users credits: ${currentCredits}`);
    }

    if (technicianData && !technicianError) {
      technicianRecordId = technicianData.id;
      updateTechnician = true;
      console.log(`Found technicians record: ${technicianRecordId}`);
    }

    if (!updateAppUser && !updateTechnician) {
      console.error('User not found in app_users or technicians tables');
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const newCredits = currentCredits + credits;
    console.log(`Updating credits: ${currentCredits} + ${credits} = ${newCredits}`);

    // Update app_users table if record exists
    if (updateAppUser) {
      const { error: updateAppUserError } = await supabase
        .from('app_users')
        .update({ credits: newCredits.toFixed(2) })
        .eq('id', technicianId);

      if (updateAppUserError) {
        console.error('Error updating app_users credits:', updateAppUserError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update user credits in app_users' 
        });
      }
      console.log(`✅ Updated app_users credits to ${newCredits}`);
    }

    // Update technicians table if record exists
    if (updateTechnician && technicianRecordId) {
      const { error: updateTechnicianError } = await supabase
        .from('technicians')
        .update({ credits: Math.floor(newCredits) })
        .eq('id', technicianRecordId);

      if (updateTechnicianError) {
        console.error('Error updating technicians credits:', updateTechnicianError);
        // Don't fail the request since app_users was updated
      } else {
        console.log(`✅ Updated technicians credits to ${Math.floor(newCredits)}`);
      }
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        technician_id: technicianId,
        type: 'purchase',
        credits: credits,
        amount: paymentIntent.amount / 100, // Convert pence to pounds
        currency: paymentIntent.currency.toUpperCase(),
        stripe_payment_intent_id: paymentIntentId,
        description: `Purchased ${credits} credits`,
        status: 'completed'
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the request since credits were already added
    }

    res.json({ 
      success: true, 
      credits: newCredits,
      creditsAdded: credits 
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to confirm payment' 
    });
  }
  });

// =============================
// Stripe Webhooks
// =============================

// Stripe webhook handler for automatic subscription processing
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    const admin = getSupabaseAdmin();
    if (admin.error) {
      console.error('Supabase admin error:', admin.error);
      return res.status(500).send('Database connection error');
    }
    const supabase = admin.client;

    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        
        // Only process subscription invoices (not one-time payments)
        if (invoice.subscription) {
          console.log('Processing successful subscription payment for invoice:', invoice.id);
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ['items.data.price.product']
          });

          // Find user by customer ID
          const { data: users, error: userError } = await supabase
            .from('app_users')
            .select('id, email')
            .eq('stripe_customer_id', invoice.customer)
            .limit(1);

          if (userError || !users || users.length === 0) {
            console.error('User not found for customer:', invoice.customer);
            break;
          }

          const user = users[0];
          const priceId = subscription.items.data[0].price.id;
          
          // Determine role and credits based on price ID
          let assignedRole = 'pro-1';
          let planName = 'Starter';
          let creditsToAdd = 100;

          // Check against environment variables for exact price ID matching
          if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE || 
              priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE) {
            assignedRole = 'pro-1';
            planName = 'Starter';
            creditsToAdd = 100;
          } else if (priceId === process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE || 
                     priceId === process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE) {
            assignedRole = 'pro-2';
            planName = 'Professional';
            creditsToAdd = 350;
          } else if (priceId === process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE) {
            assignedRole = 'pro-2';
            planName = 'Enterprise';
            creditsToAdd = 1500;
          } else {
            // Fallback to string matching for development/testing
            if (priceId.includes('starter') || priceId.includes('118')) {
              assignedRole = 'pro-1';
              planName = 'Starter';
              creditsToAdd = 100;
            } else if (priceId.includes('professional') || priceId.includes('198')) {
              assignedRole = 'pro-2';
              planName = 'Professional';
              creditsToAdd = 350;
            } else if (priceId.includes('enterprise') || priceId.includes('150')) {
              assignedRole = 'pro-2';
              planName = 'Enterprise';
              creditsToAdd = 1500;
            }
          }

          console.log(`Webhook: Assigning role ${assignedRole} to user ${user.id} for plan ${planName}`);

          // Update user role and credits
          const { error: roleUpdateError } = await supabase
            .from('app_users')
            .update({ 
              user_role: assignedRole,
              credits: creditsToAdd,
              stripe_customer_id: invoice.customer // Ensure customer ID is stored
            })
            .eq('id', user.id);

          if (roleUpdateError) {
            console.error('Webhook: Error updating user role:', roleUpdateError);
            break;
          }

          // Create or update subscription record
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: invoice.customer,
              price_id: priceId,
              status: subscription.status,
              assigned_role: assignedRole,
              plan_name: planName,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (subscriptionError) {
            console.error('Webhook: Error creating subscription record:', subscriptionError);
          } else {
            console.log(`Webhook: Successfully upgraded user ${user.email} to ${assignedRole} (${planName})`);
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscriptionEvent = event.data.object;
        
        // Find user by customer ID
        const { data: subUsers, error: subUserError } = await supabase
          .from('app_users')
          .select('id, email')
          .eq('stripe_customer_id', subscriptionEvent.customer)
          .limit(1);

        if (subUserError || !subUsers || subUsers.length === 0) {
          console.error('User not found for subscription event, customer:', subscriptionEvent.customer);
          break;
        }

        const subUser = subUsers[0];

        if (event.type === 'customer.subscription.deleted' || 
            subscriptionEvent.status === 'canceled' || 
            subscriptionEvent.status === 'unpaid') {
          
          console.log(`Webhook: Downgrading user ${subUser.email} due to subscription ${event.type}`);
          
          // Downgrade user to basic role
          const { error: downgradeError } = await supabase
            .from('app_users')
            .update({ 
              user_role: 'user', // Basic role
              credits: 0 // Remove credits
            })
            .eq('id', subUser.id);

          if (downgradeError) {
            console.error('Webhook: Error downgrading user:', downgradeError);
          }

          // Update subscription status
          const { error: statusError } = await supabase
            .from('user_subscriptions')
            .update({
              status: subscriptionEvent.status,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', subUser.id);

          if (statusError) {
            console.error('Webhook: Error updating subscription status:', statusError);
          }
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// =============================
// Stripe Subscription Endpoints
// =============================

// Create subscription
app.post('/api/stripe/create-subscription', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }

    const { priceId, userId, email, name } = req.body;

    if (!priceId || !userId || !email) {
      return res.status(400).json({ error: 'Missing required fields: priceId, userId, email' });
    }

    // Resolve price ID from environment variable if it's an env var name
    let actualPriceId = priceId;
    if (priceId.startsWith('STRIPE_')) {
      actualPriceId = process.env[priceId];
      if (!actualPriceId) {
        console.error(`Environment variable ${priceId} not found`);
        return res.status(500).json({ error: `Price configuration missing: ${priceId}` });
      }
      console.log(`Resolved ${priceId} to ${actualPriceId}`);
    }

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Found existing Stripe customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name || email,
        metadata: {
          userId: userId
        }
      });
      console.log('Created new Stripe customer:', customer.id);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: actualPriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'] // Only allow card payments for subscriptions
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        userEmail: email
      }
    });

    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      throw new Error('Failed to create subscription payment intent');
    }

    // Store customer ID in user record for webhook processing
    const admin = getSupabaseAdmin();
    if (admin.client) {
      const { error: customerUpdateError } = await admin.client
        .from('app_users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
      
      if (customerUpdateError) {
        console.error('Error storing customer ID:', customerUpdateError);
        // Don't fail the request, just log the error
      } else {
        console.log(`Stored customer ID ${customer.id} for user ${userId}`);
      }
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

// Get subscription status
app.get('/api/stripe/subscription-status/:userId', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ error: admin.error });
    const supabase = admin.client;

    const { userId } = req.params;

    // Get user's subscription from database
    const { data: subscriptionData, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscriptionData) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Verify with Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);

    res.json({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      role: subscriptionData.assigned_role,
      planName: subscriptionData.plan_name
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: error.message || 'Failed to get subscription status' });
  }
});

// Handle successful subscription payment and assign role
app.post('/api/stripe/confirm-subscription', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { subscriptionId, userId } = req.body;

    if (!subscriptionId || !userId) {
      return res.status(400).json({ success: false, error: 'Missing subscriptionId or userId' });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(400).json({ 
        success: false, 
        error: 'Subscription is not active' 
      });
    }

    // Determine role based on price ID
    const priceId = subscription.items.data[0].price.id;
    let assignedRole = 'pro-1'; // Default
    let planName = 'Starter';
    let creditsToAdd = 250; // Updated to match new plan
    let commissionRate = 20.00; // Default 20%

    // Map price IDs to roles (you'll need to create these products in Stripe dashboard)
    if (priceId.includes('starter') || priceId.includes('118') || priceId.includes('1130')) {
      assignedRole = 'pro-1';
      planName = 'Starter';
      creditsToAdd = 250;
      commissionRate = 20.00;
    } else if (priceId.includes('professional') || priceId.includes('239') || priceId.includes('2290')) {
      assignedRole = 'pro-2';
      planName = 'Professional';
      creditsToAdd = 600;
      commissionRate = 15.00;
    } else if (priceId.includes('enterprise')) {
      assignedRole = 'pro-2';
      planName = 'Enterprise';
      creditsToAdd = 0; // Custom
      commissionRate = 5.00;
    }

    console.log(`Assigning role ${assignedRole}, ${creditsToAdd} credits, ${commissionRate}% commission for plan ${planName}`);

    // Update user in app_users table
    const { error: roleUpdateError } = await supabase
      .from('app_users')
      .update({ 
        user_role: assignedRole,
        credits: creditsToAdd,
        commission_rate: commissionRate
      })
      .eq('id', userId);

    if (roleUpdateError) {
      console.error('Error updating app_users:', roleUpdateError);
    }

    // Also update technicians table if user is a technician
    const { error: techUpdateError } = await supabase
      .from('technicians')
      .update({ 
        credits: creditsToAdd,
        commission_rate: commissionRate
      })
      .eq('id', userId);

    if (techUpdateError) {
      console.log('Note: Could not update technicians table (user may not be in table):', techUpdateError.message);
    }

    if (roleUpdateError) {
      console.error('Error updating user role:', roleUpdateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update user role' 
      });
    }

    // Create or update subscription record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscription.customer,
        price_id: priceId,
        status: subscription.status,
        assigned_role: assignedRole,
        plan_name: planName,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subscriptionError) {
      console.error('Error creating subscription record:', subscriptionError);
      // Don't fail the request since role was already updated
    }

    res.json({ 
      success: true, 
      role: assignedRole,
      planName: planName,
      credits: creditsToAdd
    });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to confirm subscription' 
    });
  }
});

// Cancel subscription
app.post('/api/stripe/cancel-subscription', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    // Get user's subscription
    const { data: subscriptionData, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscriptionData) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update subscription status
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceling',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cancel subscription' 
    });
  }
});

// Find and confirm subscription (helper endpoint)
app.post('/api/stripe/find-and-confirm-subscription', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { userId, paymentIntentId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    console.log(`Finding subscription for user ${userId} with payment intent ${paymentIntentId}`);

    // Get user's email to find Stripe customer
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email: userData.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found in Stripe' });
    }

    const customer = customers.data[0];

    // Get latest subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
      expand: ['data.items.data.price']
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ success: false, error: 'No subscription found' });
    }

    const subscription = subscriptions.data[0];
    console.log(`Found subscription ${subscription.id} with status ${subscription.status}`);

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      // Process the subscription confirmation
      const priceId = subscription.items.data[0].price.id;
      let assignedRole = 'pro-1';
      let planName = 'Starter';
      let creditsToAdd = 250; // Updated to match new plan
      let commissionRate = 20.00; // Default 20%

      // Map price IDs to roles
      if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE || 
          priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE ||
          priceId.includes('starter') || priceId.includes('118') || priceId.includes('1130')) {
        assignedRole = 'pro-1';
        planName = 'Starter';
        creditsToAdd = 250;
        commissionRate = 20.00;
      } else if (priceId === process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE || 
                 priceId === process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE ||
                 priceId.includes('professional') || priceId.includes('239') || priceId.includes('2290')) {
        assignedRole = 'pro-2';
        planName = 'Professional';
        creditsToAdd = 600;
        commissionRate = 15.00;
      }

      console.log(`Assigning role ${assignedRole}, ${creditsToAdd} credits, ${commissionRate}% commission for plan ${planName}`);

      // Update user role, credits, and commission rate in app_users
      const { error: roleUpdateError } = await supabase
        .from('app_users')
        .update({ 
          user_role: assignedRole,
          credits: creditsToAdd,
          commission_rate: commissionRate
        })
        .eq('id', userId);

      if (roleUpdateError) {
        console.error('Error updating app_users:', roleUpdateError);
      }

      // Also update technicians table if user is a technician
      const { error: techUpdateError } = await supabase
        .from('technicians')
        .update({ 
          credits: creditsToAdd,
          commission_rate: commissionRate
        })
        .eq('id', userId);

      if (techUpdateError) {
        console.log('Note: Could not update technicians table (user may not be in table):', techUpdateError.message);
      }

      if (roleUpdateError) {
        console.error('Error updating user role:', roleUpdateError);
        return res.status(500).json({ success: false, error: 'Failed to update user role' });
      }

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id,
          price_id: priceId,
          status: subscription.status,
          assigned_role: assignedRole,
          plan_name: planName,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError);
        return res.status(500).json({ success: false, error: 'Failed to create subscription record' });
      }

      console.log(`✅ Subscription confirmed successfully for user ${userId}`);
      return res.json({ 
        success: true, 
        role: assignedRole,
        planName: planName,
        credits: creditsToAdd
      });
    } else {
      return res.status(400).json({ success: false, error: `Subscription status is ${subscription.status}` });
    }
  } catch (error) {
    console.error('Error finding and confirming subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to find and confirm subscription' 
    });
  }
});

// =============================
// Jobs: Secure endpoints (service role)
// =============================
app.post('/api/jobs/accept', async (req, res) => {
  try {
    console.log('🔵 Job accept request received:', req.body);
    
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;
    
    // Add more detailed logging
    console.log('🔧 Using Supabase key type:', SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');

    const { jobId, technicianId, technicianName } = req.body || {};
    if (!jobId || !technicianId || !technicianName) {
      return res.status(400).json({ success: false, error: 'Missing required fields: jobId, technicianId, technicianName' });
      }

    // Check how many technicians have already purchased this lead
    const { data: existingAssignments, error: existingErr } = await supabase
      .from('job_assignments')
      .select('id, technician_id')
      .eq('job_id', jobId);

    if (existingErr) return res.status(500).json({ success: false, error: existingErr.message });
    
    // Check if this technician has already purchased this lead
    const hasAlreadyPurchased = existingAssignments?.some(a => a.technician_id === technicianId);
    if (hasAlreadyPurchased) {
      return res.status(409).json({ success: false, error: 'You have already purchased this lead' });
    }
    
    // Check if 3 technicians have already purchased this lead
    if (existingAssignments && existingAssignments.length >= 3) {
      return res.status(409).json({ success: false, error: 'This lead is no longer available (maximum 3 purchases reached)' });
    }

    // Insert assignment
    const { data: assignment, error: insertErr } = await supabase
      .from('job_assignments')
      .insert({ job_id: jobId, technician_id: technicianId, status: 'assigned' })
      .select()
      .single();

    if (insertErr || !assignment) {
      return res.status(500).json({ success: false, error: insertErr?.message || 'Failed to create assignment' });
    }

    // Get job details to calculate credit cost (BEFORE updating status)
    const { data: jobData, error: jobFetchErr } = await supabase
      .from('MasterCustomer')
      .select('quote_price, status, selected_windows, window_damage')
      .eq('id', jobId)
      .single();

    if (jobFetchErr || !jobData) {
      await supabase.from('job_assignments').delete().eq('id', assignment.id);
      return res.status(500).json({ success: false, error: 'Failed to fetch job details' });
    }

    // Calculate credit cost for job board leads (quoted status jobs)
    let creditCost = 0;
    let shouldDeductCredits = jobData.status === 'quoted'; // Only charge for job board leads, not exclusive jobs
    
    if (shouldDeductCredits && jobData.quote_price) {
      creditCost = Math.round(jobData.quote_price * 0.1); // 10% of job value
    }

    // Get technician's current credits and deduct if needed
    if (shouldDeductCredits && creditCost > 0) {
      const { data: techData, error: techFetchErr } = await supabase
        .from('technicians')
        .select('credits')
        .eq('id', technicianId)
        .single();

      if (techFetchErr || !techData) {
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: 'Failed to fetch technician credits' });
      }

      const currentCredits = techData.credits || 0;
      if (currentCredits < creditCost) {
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(400).json({ success: false, error: `Insufficient credits. Need ${creditCost} credits, have ${currentCredits}` });
      }

      const newCredits = currentCredits - creditCost;

      // Update technician credits in technicians table
      const { error: creditUpdateErr } = await supabase
        .from('technicians')
        .update({ credits: newCredits })
        .eq('id', technicianId);

      if (creditUpdateErr) {
        console.error('Failed to deduct credits from technicians table:', creditUpdateErr);
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: 'Failed to deduct credits from technicians table' });
      }

      // Also update credits in app_users table to keep them synchronized
      const { data: technicianEmail, error: emailFetchErr } = await supabase
        .from('technicians')
        .select('contact_email')
        .eq('id', technicianId)
        .single();

      if (technicianEmail && !emailFetchErr) {
        const { error: appUserUpdateErr } = await supabase
          .from('app_users')
          .update({ credits: newCredits.toFixed(2) })
          .eq('email', technicianEmail.contact_email);
        
        if (appUserUpdateErr) {
          console.error('Failed to sync credits to app_users table:', appUserUpdateErr);
          // Don't fail the request since technicians table was updated
        } else {
          console.log(`✅ Synchronized ${newCredits} credits to app_users table`);
        }
      }

      // Create credit transaction record
      const { error: transactionErr } = await supabase
        .from('credit_transactions')
        .insert({
          technician_id: technicianId,
          type: 'usage',
          credits: -creditCost, // Negative for deduction
          description: `Job lead purchase: ${jobData.quote_price ? '£' + jobData.quote_price.toFixed(2) : 'N/A'} job`,
          status: 'completed',
          metadata: {
            job_id: jobId,
            assignment_id: assignment.id,
            job_price: jobData.quote_price,
            credit_rate: 0.1
          }
        });

      if (transactionErr) {
        console.error('Failed to create credit transaction:', transactionErr);
        // Don't fail the job assignment since credits were deducted
      }

      console.log(`✅ Deducted ${creditCost} credits from technician ${technicianId}. New balance: ${newCredits}`);
    }

    // DO NOT update MasterCustomer with technician info
    // Leads can be purchased by up to 3 technicians, so we don't assign a specific technician to the MasterCustomer record
    // The assignment is tracked in the job_assignments table instead
    // This allows multiple technicians to purchase the same lead without conflicts

    return res.json({ 
      success: true, 
      assignmentId: assignment.id, 
      creditsDeducted: shouldDeductCredits ? creditCost : 0 
    });
  } catch (error) {
    console.error('Error in /api/jobs/accept:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get technician's accepted jobs (service role)
app.post('/api/technician/jobs', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { technicianId } = req.body || {};
    if (!technicianId) {
      return res.status(400).json({ success: false, error: 'Missing technicianId' });
    }

    const { data, error } = await supabase
      .from('job_assignments')
      .select(`
        *,
        MasterCustomer (
          id,
          quote_id,
          full_name,
          mobile,
          location,
          postcode,
          appointment_date,
          time_slot,
          status,
          quote_price,
          service_type,
          glass_type,
          vehicle_reg,
          brand,
          model,
          year,
          window_damage,
          selected_windows,
          window_spec,
          adas_calibration,
          delivery_type,
          timeline,
          duration,
          job_progress
        )
      `)
      .eq('technician_id', technicianId)
      .order('assigned_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/technician/jobs:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Unassign job (service role) - returns job back to exclusive pool
app.post('/api/jobs/unassign', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { jobId, technicianId } = req.body || {};
    if (!jobId || !technicianId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: jobId, technicianId' });
    }

    console.log(`🔄 Unassigning job ${jobId} from technician ${technicianId}`);

    // Verify the assignment exists and belongs to this technician
    const { data: assignment, error: assignmentError } = await supabase
      .from('job_assignments')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('technician_id', technicianId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found or does not belong to this technician' });
    }

    // Don't allow unassigning completed jobs
    if (assignment.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Cannot unassign completed jobs' });
    }

    // Delete the job assignment
    const { error: deleteError } = await supabase
      .from('job_assignments')
      .delete()
      .eq('id', assignment.id);

    if (deleteError) {
      return res.status(500).json({ success: false, error: deleteError.message });
    }

    // Get the original job to check its payment status
    const { data: jobData, error: jobError } = await supabase
      .from('MasterCustomer')
      .select('status')
      .eq('id', jobId)
      .single();

    // Determine the correct status to restore
    let restoreStatus = 'paid'; // Default
    if (jobData && !jobError) {
      // If it was 'paid - full' originally, restore it to that
      if (jobData.status === 'assigned' || jobData.status === 'in_progress') {
        // We need to check payment history or default to 'paid'
        restoreStatus = 'paid'; // Default for exclusive jobs
      }
    }

    // Update MasterCustomer back to paid status (so it appears in exclusive jobs again)
    const { error: updateError } = await supabase
      .from('MasterCustomer')
      .update({ 
        status: restoreStatus,  // Will be 'paid' to return to exclusive pool
        technician_id: null, 
        technician_name: null 
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update MasterCustomer status after unassignment:', updateError);
      // Don't fail the request since the assignment was already deleted
    } else {
      console.log(`✅ Job ${jobId} returned to exclusive pool with status 'paid'`);
    }

    // Delete any associated calendar events
    const { error: calendarDeleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('job_assignment_id', assignment.id);

    if (calendarDeleteError) {
      console.error('Failed to delete calendar events:', calendarDeleteError);
      // Don't fail the request since the main unassignment was successful
    }

    return res.json({ success: true, message: 'Job unassigned successfully and returned to exclusive pool' });
  } catch (error) {
    console.error('Error in /api/jobs/unassign:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create calendar event for accepted job
app.post('/api/jobs/create-event', async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;

    const { assignmentId, job, technicianId } = req.body || {};
    if (!assignmentId || !job || !technicianId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: assignmentId, job, technicianId' });
    }

    const eventDate = job.appointment_date || new Date().toISOString().split('T')[0];
    const startTime = (job.time_slot?.split('-')[0] || '09:00').trim();

    // Calculate end time
    const getEnd = (start, dur) => {
      try {
        const [h, m] = start.split(':').map(Number);
        let hours = 2;
        if (dur?.includes('hour')) hours = parseInt(dur.match(/\d+/)?.[0] || '2');
        else if (dur?.includes('minute')) hours = (parseInt(dur.match(/\d+/)?.[0] || '120')) / 60;
        const endH = h + Math.floor(hours);
        const endMtotal = m + (hours % 1) * 60;
        const finalM = Math.round(endMtotal % 60);
        const extraH = Math.floor(endMtotal / 60);
        const finalH = endH + extraH;
        return `${finalH.toString().padStart(2,'0')}:${finalM.toString().padStart(2,'0')}`;
      } catch { return '17:00'; }
    };

    const endTime = getEnd(startTime, job.duration || '2 hours');
    const vehicleInfo = [job.year, job.brand, job.model].filter(Boolean).join(' ') || 'Vehicle information not available';
    const location = `${job.location || ''} ${job.postcode || ''}`.trim();

    // Create local calendar event (skip Google Calendar integration for now)
    const { error } = await supabase
      .from('calendar_events')
      .insert({
        job_assignment_id: assignmentId,
        technician_id: technicianId,
        title: `${job.service_type || 'Windscreen Service'} - ${job.full_name}`,
        description: `Vehicle: ${vehicleInfo}\nService: ${job.service_type || 'Windscreen Service'}\nGlass Type: ${job.glass_type || 'Standard'}\nCustomer: ${job.full_name}\nPhone: ${job.mobile || 'N/A'}`,
        start_date: eventDate,
        start_time: startTime,
        end_date: eventDate,
        end_time: endTime,
        location,
        customer_name: job.full_name,
        customer_phone: job.mobile,
        vehicle_info: vehicleInfo,
        status: 'scheduled',
        google_calendar_event_id: null
      });

    if (error) {
      console.error('Error creating calendar event:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ Successfully created calendar event for job assignment:', assignmentId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/jobs/create-event:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create job from Price Estimator
app.post('/api/jobs/create', async (req, res) => {
  try {
    console.log('🔵 Job creation request received:', req.body);
    
    const admin = getSupabaseAdmin();
    if (admin.error) return res.status(500).json({ success: false, error: admin.error });
    const supabase = admin.client;
    
    const {
      userId,
      vrn,
      make,
      model,
      year,
      glassType,
      colorTint,
      hasSensor,
      hasCamera,
      hasADAS,
      customerPostcode,
      technicianPostcode,
      glassCost,
      laborCost,
      travelCost,
      distance,
      totalEstimate,
      glassDescription
    } = req.body || {};

    if (!userId || !customerPostcode || !technicianPostcode) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Map glass type to service type
    const serviceTypeMap = {
      'windscreen': 'Windscreen Replacement',
      'rear': 'Rear Window Replacement',
      'side': 'Side Window Replacement',
      'quarter': 'Quarter Glass Replacement',
      'vent': 'Vent Window Replacement'
    };

    const serviceType = serviceTypeMap[glassType] || 'Glass Replacement';

    // Insert into MasterCustomer table
    const { data: newJob, error: insertError } = await supabase
      .from('MasterCustomer')
      .insert({
        full_name: '[Customer Details Pending]',
        email: null,
        mobile: null,
        location: customerPostcode,
        postcode: customerPostcode,
        vehicle_reg: vrn || null,
        year: year ? parseInt(year) : null,
        brand: make || null,
        model: model || null,
        service_type: serviceType,
        glass_type: colorTint || null,
        quote_price: totalEstimate,
        status: 'paid', // Status for exclusive jobs
        created_at: new Date().toISOString(),
        // Store additional metadata
        notes: JSON.stringify({
          source: 'price_estimator',
          glass_description: glassDescription,
          has_sensor: hasSensor,
          has_camera: hasCamera,
          has_adas: hasADAS,
          technician_postcode: technicianPostcode,
          customer_postcode: customerPostcode,
          breakdown: {
            glass_cost: glassCost,
            labor_cost: laborCost,
            travel_cost: travelCost,
            distance_miles: distance
          }
        })
      })
      .select()
      .single();

    if (insertError || !newJob) {
      console.error('Failed to create job:', insertError);
      return res.status(500).json({ success: false, error: 'Failed to create job' });
    }

    console.log(`✅ Job created successfully with ID: ${newJob.id}`);

    // Create job assignment (auto-assign to the technician who created the estimate)
    const { data: assignment, error: assignmentError } = await supabase
      .from('job_assignments')
      .insert({
        job_id: newJob.id,
        technician_id: userId,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignmentError || !assignment) {
      console.error('Failed to create job assignment:', assignmentError);
      // Job was created but assignment failed - still return success with warning
      return res.json({
        success: true,
        jobId: newJob.id,
        warning: 'Job created but assignment failed. Please assign manually.'
      });
    }

    console.log(`✅ Job assigned to technician ${userId}`);

    return res.json({
      success: true,
      jobId: newJob.id,
      assignmentId: assignment.id
    });

  } catch (error) {
    console.error('Error in /api/jobs/create:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// ==================== STRIPE CONNECT ENDPOINTS ====================

// Create Stripe Connect Account Link (OAuth flow)
app.post('/api/stripe/connect/create-account-link', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const { client } = getSupabaseAdmin();
    
    // Check if user already has a Stripe Connect account
    const { data: existingAccount } = await client
      .from('stripe_connect_accounts')
      .select('*')
      .eq('technician_id', userId)
      .single();

    let accountId;

    if (existingAccount?.stripe_account_id) {
      accountId = existingAccount.stripe_account_id;
      console.log(`♻️ Using existing Stripe account: ${accountId}`);
    } else {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log(`✅ Created new Stripe Connect account: ${accountId}`);

      // Save to database
      await client
        .from('stripe_connect_accounts')
        .insert({
          technician_id: userId,
          stripe_account_id: accountId,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.VITE_APP_URL || 'http://localhost:8080'}/settings?stripe_refresh=true`,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:8080'}/settings?stripe_connected=true`,
      type: 'account_onboarding',
    });

    res.json({ success: true, url: accountLink.url, accountId });
  } catch (error) {
    console.error('Error creating Stripe Connect account link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Stripe Connect Account Status
app.post('/api/stripe/connect/account-status', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    const { client } = getSupabaseAdmin();
    
    const { data: account, error } = await client
      .from('stripe_connect_accounts')
      .select('*')
      .eq('technician_id', userId)
      .single();

    if (error || !account) {
      return res.json({ success: true, connected: false, account: null });
    }

    // Fetch latest account details from Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);

    // Update database with latest info
    await client
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        email: stripeAccount.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    res.json({ 
      success: true, 
      connected: true,
      account: {
        account_id: account.stripe_account_id,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        email: stripeAccount.email,
        connected_at: account.connected_at,
      }
    });
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect Stripe Account
app.post('/api/stripe/connect/disconnect', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    const { client } = getSupabaseAdmin();
    
    // Delete from database
    const { error } = await client
      .from('stripe_connect_accounts')
      .delete()
      .eq('technician_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Stripe account disconnected' });
  } catch (error) {
    console.error('Error disconnecting Stripe account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request Cashout
app.post('/api/cashout/request', async (req, res) => {
  try {
    const { userId, jobIds, amount } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    // Validate minimum amount
    if (amount < 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimum cashout amount is £20.00' 
      });
    }

    const { client } = getSupabaseAdmin();
    
    // Get Stripe Connect account
    const { data: stripeAccount, error: accountError } = await client
      .from('stripe_connect_accounts')
      .select('*')
      .eq('technician_id', userId)
      .single();

    if (accountError || !stripeAccount) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Stripe account connected. Please connect your account first.' 
      });
    }

    if (!stripeAccount.payouts_enabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payouts not enabled. Please complete your Stripe account setup.' 
      });
    }

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      destination: stripeAccount.stripe_account_id,
      description: `Cashout for ${jobIds.length} completed jobs`,
      metadata: {
        technician_id: userId,
        jobs_count: jobIds.length,
        job_ids: jobIds.join(','),
      },
    });

    // Create cashout request record
    const { data: cashoutRequest, error: requestError } = await client
      .from('cashout_requests')
      .insert({
        technician_id: userId,
        stripe_account_id: stripeAccount.id,
        amount: amount,
        jobs_count: jobIds.length,
        job_ids: jobIds,
        status: 'processing',
        stripe_transfer_id: transfer.id,
        metadata: { transfer },
      })
      .select()
      .single();

    if (requestError) throw requestError;

    res.json({ 
      success: true, 
      data: cashoutRequest,
      message: `Payout of £${amount.toFixed(2)} is being processed to your Stripe account` 
    });
  } catch (error) {
    console.error('Error requesting cashout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Cashout History
app.post('/api/cashout/history', async (req, res) => {
  try {
    const { userId } = req.body;

    const { client } = getSupabaseAdmin();
    
    const { data, error } = await client
      .from('cashout_requests')
      .select('*')
      .eq('technician_id', userId)
      .order('requested_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching cashout history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COUPON VALIDATION ====================

// Validate Stripe Coupon/Promotion Code
app.post('/api/stripe/validate-coupon', async (req, res) => {
  try {
    const { couponCode, amount } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    if (!couponCode) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    // First, try to retrieve as a coupon
    let coupon = null;
    try {
      coupon = await stripe.coupons.retrieve(couponCode);
    } catch (error) {
      // If not found as coupon, try as promotion code
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          limit: 1,
        });
        
        if (promotionCodes.data.length > 0) {
          const promoCode = promotionCodes.data[0];
          
          // Check if promotion code is active
          if (!promoCode.active) {
            return res.json({ 
              success: true, 
              valid: false, 
              error: 'This promotion code is no longer active' 
            });
          }
          
          // Get the coupon details
          coupon = promoCode.coupon;
        }
      } catch (promoError) {
        return res.json({ 
          success: true, 
          valid: false, 
          error: 'Invalid coupon code' 
        });
      }
    }

    if (!coupon) {
      return res.json({ 
        success: true, 
        valid: false, 
        error: 'Coupon not found' 
      });
    }

    // Check if coupon is valid (not expired, etc.)
    if (!coupon.valid) {
      return res.json({ 
        success: true, 
        valid: false, 
        error: 'This coupon has expired or is no longer valid' 
      });
    }

    // Return coupon details
    res.json({ 
      success: true, 
      valid: true,
      coupon: {
        id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
        name: coupon.name,
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GLASS PAYMENT INTENT ====================

// Create Payment Intent for Glass Orders
app.post('/api/stripe/create-glass-payment-intent', async (req, res) => {
  try {
    const { amount, userId, items, deliveryOption, deliveryFee, subtotal, vat } = req.body;

    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId || 'guest',
        type: 'glass_order',
        items_count: items?.length || 0,
        delivery_option: deliveryOption || 'delivery',
        delivery_fee: deliveryFee || 0,
        subtotal: subtotal || 0,
        vat: vat || 0,
      },
      description: `Glass Order - ${items?.length || 0} items`,
    });

    res.json({ 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating glass payment intent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 