import axios from 'axios';
import { Parser } from 'xml2js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const config = {
  baseURL: 'https://www.master-auto-glass.co.uk/pdaservice.asmx',
  auth: {
    login: process.env.GLASS_API_LOGIN || 'test_user', // Use env variable or fallback
    password: process.env.GLASS_API_PASSWORD || 'test_password', // Use env variable or fallback
    userId: 1 // Replace with actual user ID
  },
  searchParams: {
    make: 'TOYOTA',
    model: 'COROLLA',
    modelType: 'HATCHBACK',
    year: 2021
  }
};

// Log authentication info (remove in production)
console.log('Using credentials:');
console.log('Login:', config.auth.login ? '✓ Found' : '✗ Missing');
console.log('Password:', config.auth.password ? '✓ Found' : '✗ Missing');
console.log('Using search parameters:', JSON.stringify(config.searchParams));

// Function to build SOAP request for getStockList
function buildStockListRequest(params, auth) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${auth.login}</Login>
      <Password>${auth.password}</Password>
      <UserID>${auth.userId}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <getStockList xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <make>${params.make}</make>
      <model>${params.model}</model>
      <modelType>${params.modelType}</modelType>
      <year>${params.year}</year>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getStockList>
  </soap:Body>
</soap:Envelope>`;
}

// Function to parse SOAP response
async function parseSOAPResponse(xmlResponse) {
  return new Promise((resolve, reject) => {
    const parser = new Parser({ explicitArray: false });
    parser.parseString(xmlResponse, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

// Function to filter and categorize results to make output more manageable
function filterAndCategorizeResults(priceRecords) {
  // Count the total number of items
  const totalItems = priceRecords.length;
  
  // Group by first letters of MagCode (potential glass type indicators)
  const groupedByType = {};
  
  priceRecords.forEach(record => {
    // Extract the prefix (first few chars) from MagCode for grouping
    const prefix = record.MagCode.substring(0, 4);
    
    if (!groupedByType[prefix]) {
      groupedByType[prefix] = [];
    }
    
    groupedByType[prefix].push(record);
  });
  
  // Count items in each group
  const summary = {
    totalItems,
    categories: Object.keys(groupedByType).map(key => ({
      prefix: key,
      count: groupedByType[key].length,
      samples: groupedByType[key].slice(0, 2) // Show just 2 examples from each group
    }))
  };
  
  return summary;
}

// Function to search stock ARGIC codes
async function getStockList() {
  try {
    const soapRequest = buildStockListRequest(config.searchParams, config.auth);
    
    const response = await axios({
      method: 'post',
      url: config.baseURL,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/getStockList'
      },
      data: soapRequest
    });

    const parsedResponse = await parseSOAPResponse(response.data);
    
    // Extract relevant information from the SOAP response
    const soapBody = parsedResponse['soap:Envelope']['soap:Body'];
    const stockListResponse = soapBody.getStockListResponse;
    
    if (stockListResponse) {
      const result = stockListResponse.getStockListResult;
      const status = stockListResponse.callResult.Status;
      
      console.log('API Response Status:', status);
      
      if (status === 'Success') {
        // Handle successful response
        const priceRecords = Array.isArray(result.PriceRecord) 
          ? result.PriceRecord 
          : [result.PriceRecord];
        
        console.log(`Found ${priceRecords.length} stock items`);
        
        // Apply filtering and categorization for more manageable output
        const summarizedResults = filterAndCategorizeResults(priceRecords);
        console.log('Summary:');
        console.log(JSON.stringify(summarizedResults, null, 2));
        
        return priceRecords;
      } else {
        // Handle error
        console.error('Error:', stockListResponse.callResult.ErrorMessage);
        return null;
      }
    }
  } catch (error) {
    console.error('API Request Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    return null;
  }
}

// Execute the test
getStockList()
  .then(result => {
    if (result) {
      console.log('Test completed successfully');
    } else {
      console.log('Test failed');
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
  });

// Example response structure for reference:
const exampleResponse = {
  PriceRecord: [
    {
      MagCode: "MAG12345",
      ArgicCode: "ARG-F-FOC-18-001",
      Price: 249.99,
      Qty: 5,
      Make: "FORD",
      Description: "Windscreen, heated, rain sensor",
      PriceInfo: "Includes fitting"
    }
  ]
}; 