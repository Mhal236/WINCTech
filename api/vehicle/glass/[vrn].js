/**
 * Vehicle Glass Data API for Vercel deployment
 * 
 * This API fetches vehicle data and glass options by VRN
 * Designed to work as a Vercel serverless function
 */
import axios from 'axios';
import xml2js from 'xml2js';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
            description: "Windscreen - Acoustic, Rain Sensor, Camera",
            features: "Acoustic Glass, Rain Sensor, Camera, Green Tinted"
          },
          {
            fullCode: "2448ACCGNMV1A",
            shortCode: "2448",
            description: "Windscreen - Acoustic, Camera",
            features: "Acoustic Glass, Camera, Green Tinted"
          },
          {
            fullCode: "2448ACCGNM",
            shortCode: "2448",
            description: "Windscreen - Standard",
            features: "Green Tinted"
          },
          {
            fullCode: "2448ACCGNMV1C",
            shortCode: "2448",
            description: "Windscreen - Heated, Acoustic, Camera",
            features: "Heated, Acoustic Glass, Camera, Green Tinted"
          }
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: demoVehicleDetails,
        demo: true
      });
    }
    
    // STEP 1: FETCH VEHICLE DATA FROM UK API
    console.log(`STEP 1: FETCHING VEHICLE DATA FROM UK API FOR VRN: ${vrn}`);
    
    const VEHICLE_API_URL = process.env.VITE_VEHICLE_API_URL || 'https://legacy.api.vehicledataglobal.com/api/datapackage/VehicleData';
    const VEHICLE_API_KEY = process.env.VEHICLE_API_KEY;
    
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
      try {
        const glassApiUrl = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
        const soapAction = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList';
        
        // Build SOAP envelope for getStockList
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${process.env.MAG_LOGIN || ''}</Login>
      <Password>${process.env.MAG_PASSWORD || ''}</Password>
      <UserID>${process.env.MAG_USER_ID || 0}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <getStockList xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <make>${vehicleDetails.make}</make>
      <model>${vehicleDetails.model}</model>
      <modelType></modelType>
      <year>${vehicleDetails.year}</year>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getStockList>
  </soap:Body>
</soap:Envelope>`;

        console.log('Sending SOAP request to MAG API...');
        
        const glassResponse = await axios.post(glassApiUrl, soapEnvelope, {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': soapAction
          },
          timeout: 30000
        });
        
        console.log('MAG API response received, parsing XML...');
        
        // Parse XML response
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(glassResponse.data);
        
        // Extract stock list from SOAP response
        const soapBody = result['soap:Envelope']['soap:Body'];
        const stockListResponse = soapBody.getStockListResponse;
        
        if (stockListResponse && stockListResponse.getStockListResult && stockListResponse.getStockListResult.PriceRecord) {
          let priceRecords = stockListResponse.getStockListResult.PriceRecord;
          
          // Ensure priceRecords is an array
          if (!Array.isArray(priceRecords)) {
            priceRecords = [priceRecords];
          }
          
          // Convert to glass options format
          const glassOptions = priceRecords.map(record => ({
            fullCode: record.ArgicCode || '',
            shortCode: record.MagCode || '',
            description: record.Description || '',
            make: record.Make || '',
            price: parseFloat(record.Price) || 0,
            quantity: parseInt(record.Qty) || 0,
            priceInfo: record.PriceInfo || ''
          }));
          
          // Get first ARGIC code if available
          if (glassOptions.length > 0) {
            vehicleDetails.argicCode = glassOptions[0].fullCode;
            vehicleDetails.shortArgicCode = glassOptions[0].shortCode;
          }
          
          vehicleDetails.glassOptions = glassOptions;
          
          console.log(`STEP 2 COMPLETE: Found ${glassOptions.length} glass options`);
        } else {
          console.log('No glass options found in MAG API response');
          vehicleDetails.glassOptions = [];
        }
        
      } catch (glassApiError) {
        console.error('Error fetching glass data from MAG API:', glassApiError.message);
        vehicleDetails.glassOptions = [];
        vehicleDetails.glassApiError = glassApiError.message;
      }
    }
    
    // Return vehicle details with glass options
    return res.status(200).json({
      success: true,
      data: vehicleDetails
    });

  } catch (error) {
    console.error('Error processing vehicle glass data:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch vehicle glass data'
    });
  }
}

