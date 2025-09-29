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

    // For now, return a basic response since this is mainly used for verification
    // You can enhance this later with actual vehicle data
    res.json({
      success: true,
      vrn: vrn.toUpperCase(),
      data: {
        registration: vrn.toUpperCase(),
        // Add more vehicle data here when available
      }
    });
  } catch (error) {
    console.error('Error in vehicle endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle data'
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
        save_default_payment_method: 'on_subscription'
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
    let creditsToAdd = 100;

    // Map price IDs to roles (you'll need to create these products in Stripe dashboard)
    if (priceId.includes('starter') || priceId.includes('118')) {
      assignedRole = 'pro-1';
      planName = 'Starter';
      creditsToAdd = 100;
    } else if (priceId.includes('professional') || priceId.includes('198')) {
      assignedRole = 'pro-2';
      planName = 'Professional';
      creditsToAdd = 350;
    }

    console.log(`Assigning role ${assignedRole} for plan ${planName}`);

    // Update user role in app_users table
    const { error: roleUpdateError } = await supabase
      .from('app_users')
      .update({ 
        user_role: assignedRole,
        credits: creditsToAdd 
      })
      .eq('id', userId);

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
      let creditsToAdd = 100;

      // Map price IDs to roles
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
      }

      console.log(`Assigning role ${assignedRole} for plan ${planName}`);

      // Update user role and credits
      const { error: roleUpdateError } = await supabase
        .from('app_users')
        .update({ 
          user_role: assignedRole,
          credits: creditsToAdd 
        })
        .eq('id', userId);

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

    // Prevent double assignment
    const { data: existingAssign, error: existingErr } = await supabase
      .from('job_assignments')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (existingErr) return res.status(500).json({ success: false, error: existingErr.message });
    if (existingAssign) return res.status(409).json({ success: false, error: 'Job already assigned' });

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

    // Update MasterCustomer - only update technician info, keep original status
    const { error: updateErr } = await supabase
      .from('MasterCustomer')
      .update({ technician_id: technicianId, technician_name: technicianName })
      .eq('id', jobId);

    if (updateErr) {
      await supabase.from('job_assignments').delete().eq('id', assignment.id);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

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
          year
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