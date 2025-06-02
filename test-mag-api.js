import https from 'node:https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_SOAP_ACTION = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList';

// Get API credentials from environment variables or use defaults
const API_LOGIN = process.env.GLASS_API_LOGIN || 'Q-100';
const API_PASSWORD = process.env.GLASS_API_PASSWORD || 'b048c57a';
const API_USER_ID = process.env.GLASS_API_USER_ID || '1';

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
          console.log(`SOAP response received - length: ${data.length} characters`);
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

// Function to search glass data
async function searchMagGlass(make, model, year, modelType = '') {
  try {
    console.log(`\n-----------------------------------------------------`);
    console.log(`MAG API TEST: SEARCHING FOR GLASS DATA`);
    console.log(`-----------------------------------------------------`);
    console.log(`PARAMETERS:
    - Make: ${make}
    - Model: ${model}
    - Year: ${year}
    - ModelType: ${modelType}`);
    
    console.log(`Using MAG API credentials: Login=${API_LOGIN}, UserID=${API_USER_ID}`);
    
    // Normalize input parameters
    const normalizedMake = make.trim().toUpperCase();
    const normalizedModel = model.trim().toUpperCase();
    
    // Normalize model type if provided
    let pdaModelType = modelType || '';
    if (pdaModelType) {
      pdaModelType = pdaModelType.trim().toUpperCase();
    }
    
    // Prepare the SOAP envelope for getStockList
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${API_LOGIN}</Login>
      <Password>${API_PASSWORD}</Password>
      <UserID>${API_USER_ID}</UserID>
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
        'SOAPAction': GLASS_API_SOAP_ACTION
      },
      body: soapEnvelope
    };
    
    // Make the request to the Glass API
    console.log('Sending SOAP request to MAG API...');
    console.log('Request Body:');
    console.log(soapEnvelope);
    
    const result = await sendSoapRequest(GLASS_API_URL, options);
    
    if (result.success) {
      // Process the XML response
      const responseXml = result.data;
      
      // Log the full response for debugging
      console.log('\nFull API Response:');
      console.log(responseXml);
      
      // Check if the response indicates success
      if (responseXml.includes('<Status>Success</Status>')) {
        console.log("\nMAG API returned Success status");
        
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
              console.log(`Found glass option: ${fullCode} (Short: ${shortCode}), Description: ${description}`);
            }
          }
        }
        
        if (glassOptions.length > 0) {
          console.log(`\nMAG API SUCCESS: Found ${glassOptions.length} glass options`);
          console.log('\nSummary of Glass Options:');
          console.table(glassOptions);
          return {
            success: true,
            glassOptions: glassOptions
          };
        } else {
          console.log("\nMAG API returned Success but no glass options found in the response");
          return {
            success: false,
            error: "No glass options found in the response"
          };
        }
      } else {
        // Extract error message
        const errorMatch = responseXml.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown error";
        
        console.error(`\nError in SOAP response: ${errorMessage}`);
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } else {
      console.error("\nSOAP request failed:", result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error("\nError during API call:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testCases = [];

// Check if specific tests were provided via command line
if (args.length >= 3) {
  // Format: make model year [modelType]
  testCases.push({
    make: args[0],
    model: args[1],
    year: args[2],
    modelType: args[3] || ''
  });
} else {
  // Default test cases
  testCases.push(
    // Test case for BMW that works
    {
      make: 'BMW',
      model: '1 SERIES',
      year: '2011',
      modelType: ''
    },
    // Test case for Peugeot that isn't working
    {
      make: 'PEUGEOT',
      model: '207 ENVY HDI',
      year: '2011',
      modelType: ''
    },
    // Try different variants for Peugeot
    {
      make: 'PEUGEOT',
      model: '207',
      year: '2011',
      modelType: ''
    }
  );
}

// Run all test cases
(async () => {
  console.log(`Starting MAG API tests with ${testCases.length} test cases`);
  
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n===== RUNNING TEST CASE ${i+1}/${testCases.length} =====`);
    
    try {
      await searchMagGlass(test.make, test.model, test.year, test.modelType);
    } catch (error) {
      console.error(`Test case ${i+1} failed with error:`, error);
    }
  }
  
  console.log('\nAll tests completed');
})(); 