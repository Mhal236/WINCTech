// Glass API Service - Implements Master Auto Glass SOAP API methods
import https from 'node:https';

// API constants
const API_BASE_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const API_NAMESPACE = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

// API credentials from environment variables or use defaults
const API_CREDENTIALS = {
  Login: process.env.GLASS_API_LOGIN || 'Q-100',
  Password: process.env.GLASS_API_PASSWORD || 'b048c57a',
  UserID: process.env.GLASS_API_USER_ID ? parseInt(process.env.GLASS_API_USER_ID) : 1
};

console.log('Glass API Service initialized with credentials for:', API_CREDENTIALS.Login);

/**
 * Helper function to send SOAP requests to the Glass API
 */
export async function sendSoapRequest(methodName, bodyContent, includeSecureHeader = true) {
  return new Promise((resolve) => {
    // Construct the SOAP envelope with the method's body content
    let soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  ${includeSecureHeader ? `<soap:Header>
    <SecureHeader xmlns="${API_NAMESPACE}">
      <Login>${API_CREDENTIALS.Login}</Login>
      <Password>${API_CREDENTIALS.Password}</Password>
      <UserID>${API_CREDENTIALS.UserID}</UserID>
    </SecureHeader>
  </soap:Header>` : ''}
  <soap:Body>
    ${bodyContent}
  </soap:Body>
</soap:Envelope>`;

    // Configure the HTTP request
    const urlObj = new URL(API_BASE_URL);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${API_NAMESPACE}/${methodName}`,
        'Content-Length': Buffer.byteLength(soapEnvelope)
      },
      timeout: 30000 // 30 seconds timeout
    };
    
    console.log(`Sending SOAP request to ${methodName}`);
    
    // Create and send the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SOAP response status for ${methodName}: ${res.statusCode}`);
        
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        if (success) {
          console.log(`SOAP response data (first 200 chars): ${data.substring(0, 200)}`);
          // Check for error status in the SOAP response
          const statusMatch = data.match(/<Status>(.*?)<\/Status>/);
          const errorMatch = data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
          
          if (statusMatch && statusMatch[1] !== 'Success') {
            console.error(`SOAP service error: ${statusMatch[1]}, message: ${errorMatch ? errorMatch[1] : 'None'}`);
          }
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
    
    req.write(soapEnvelope);
    req.end();
  });
}

/**
 * Test connection with a simple HelloWorld request
 */
export async function helloWorld() {
  const bodyContent = `<HelloWorld xmlns="${API_NAMESPACE}" />`;
  const result = await sendSoapRequest('HelloWorld', bodyContent, false);
  
  if (result.success) {
    // Parse XML response to extract HelloWorldResult
    try {
      const match = result.data.match(/<HelloWorldResult>(.*?)<\/HelloWorldResult>/);
      const helloWorldResult = match ? match[1] : 'No result found';
      
      return {
        success: true,
        message: helloWorldResult,
        rawResponse: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse HelloWorld response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Get a list of all available makes
 */
export async function getMakes() {
  const bodyContent = `<GetMakes xmlns="${API_NAMESPACE}">
    <callResult />
  </GetMakes>`;
  
  const result = await sendSoapRequest('GetMakes', bodyContent);
  
  if (result.success) {
    try {
      // Extract makes from XML response
      const response = result.data;
      const makesRegex = /<string>(.*?)<\/string>/g;
      let matches;
      const makes = [];
      
      while ((matches = makesRegex.exec(response)) !== null) {
        makes.push(matches[1]);
      }
      
      return {
        success: true,
        makes: makes,
        count: makes.length
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse GetMakes response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Get models for a specific make
 */
export async function getModels(make) {
  const bodyContent = `<GetModels xmlns="${API_NAMESPACE}">
    <make>${make}</make>
    <callResult />
  </GetModels>`;
  
  const result = await sendSoapRequest('GetModels', bodyContent);
  
  if (result.success) {
    try {
      // Extract models from XML response
      const response = result.data;
      const modelsRegex = /<string>(.*?)<\/string>/g;
      let matches;
      const models = [];
      
      while ((matches = modelsRegex.exec(response)) !== null) {
        models.push(matches[1]);
      }
      
      return {
        success: true,
        models: models,
        count: models.length,
        make: make
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse GetModels response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Get stock list for a specific vehicle
 */
export async function getStockList(make, model, modelType = "", year) {
  console.log(`Requesting stock list for ${make} ${model} ${modelType || ''} ${year}`);
  
  const bodyContent = `<getStockList xmlns="${API_NAMESPACE}">
    <make>${make}</make>
    <model>${model}</model>
    <modelType>${modelType}</modelType>
    <year>${year}</year>
    <callResult>
      <Status>None</Status>
      <ErrorMessage></ErrorMessage>
    </callResult>
  </getStockList>`;
  
  const result = await sendSoapRequest('getStockList', bodyContent);
  
  if (result.success) {
    try {
      // First check the status inside the response
      const statusMatch = result.data.match(/<Status>(.*?)<\/Status>/);
      const errorMatch = result.data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
      
      const status = statusMatch ? statusMatch[1] : null;
      const errorMessage = errorMatch ? errorMatch[1] : '';
      
      if (status !== 'Success') {
        console.error(`getStockList error: ${status}, message: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage || `API returned status: ${status}`,
          rawResponse: result.data.substring(0, 500) + '...'
        };
      }
      
      // Parse the XML to extract price records
      console.log('Parsing getStockList response for price records');
      const priceRecords = parseStockListResponse(result.data);
      console.log(`Found ${priceRecords.length} price records`);
      
      return {
        success: true,
        priceRecords: priceRecords,
        count: priceRecords.length,
        vehicle: {
          make,
          model,
          modelType,
          year
        }
      };
    } catch (error) {
      console.error('Failed to parse getStockList response:', error);
      return {
        success: false,
        error: 'Failed to parse getStockList response: ' + error.message,
        rawResponse: result.data.substring(0, 500) + '...'
      };
    }
  } else {
    console.error('getStockList request failed:', result.error);
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Check availability of a specific product
 */
export async function checkAvailability(argicCode, qty = 1, depot = '') {
  const bodyContent = `<checkAvailability xmlns="${API_NAMESPACE}">
    <argicCode>${argicCode}</argicCode>
    <customerProductID></customerProductID>
    <callResult>
      <Status>None</Status>
      <ErrorMessage></ErrorMessage>
    </callResult>
    <qty>${qty}</qty>
    <depot>${depot}</depot>
    <dateRequired>${new Date().toISOString()}</dateRequired>
  </checkAvailability>`;
  
  const result = await sendSoapRequest('checkAvailability', bodyContent);
  
  if (result.success) {
    try {
      // Extract availability result from XML response
      const match = result.data.match(/<checkAvailabilityResult>(.*?)<\/checkAvailabilityResult>/);
      const isAvailable = match && match[1].toLowerCase() === 'true';
      
      // Check for error message
      const errorMatch = result.data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
      const errorMessage = errorMatch ? errorMatch[1] : null;
      
      return {
        success: true,
        isAvailable: isAvailable,
        argicCode: argicCode,
        qty: qty,
        error: errorMessage
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse checkAvailability response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Get a list of all depots
 */
export async function getDepots() {
  const bodyContent = `<GetDepots xmlns="${API_NAMESPACE}">
    <loginDetails />
    <callResult />
  </GetDepots>`;
  
  const result = await sendSoapRequest('GetDepots', bodyContent);
  
  if (result.success) {
    try {
      // Extract depots from XML response
      const depots = parseDepotResponse(result.data);
      
      return {
        success: true,
        depots: depots,
        count: depots.length
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse GetDepots response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Search for stock by ARGIC code
 */
export async function searchStockByArgic(argicCode, location = "") {
  const bodyContent = `<StockSearch xmlns="${API_NAMESPACE}">
    <argic>${argicCode}</argic>
    <location>${location}</location>
    <callResult />
  </StockSearch>`;
  
  const result = await sendSoapRequest('StockSearch', bodyContent);
  
  if (result.success) {
    try {
      // Parse the XML to extract price records
      const priceRecords = parseStockListResponse(result.data);
      
      return {
        success: true,
        priceRecords: priceRecords,
        count: priceRecords.length,
        argicCode: argicCode
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse StockSearch response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

/**
 * Check availability at all branches
 */
export async function getBranchAvailability(argicCode) {
  const bodyContent = `<getBranchAvailability xmlns="${API_NAMESPACE}">
    <argicCode>${argicCode}</argicCode>
    <callResult />
  </getBranchAvailability>`;
  
  const result = await sendSoapRequest('getBranchAvailability', bodyContent);
  
  if (result.success) {
    try {
      // Parse the XML to extract stock items
      const stockItems = parseStockItemsResponse(result.data);
      
      return {
        success: true,
        stockItems: stockItems,
        count: stockItems.length,
        argicCode: argicCode
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse getBranchAvailability response',
        rawResponse: result.data
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
}

// Helper functions to parse XML responses

/**
 * Parse stock list response to extract price records
 */
function parseStockListResponse(xmlResponse) {
  console.log('Parsing PriceRecord elements from XML response');
  const priceRecords = [];
  
  // Extract PriceRecord elements
  const priceRecordRegex = /<PriceRecord>([\s\S]*?)<\/PriceRecord>/g;
  let prMatch;
  
  while ((prMatch = priceRecordRegex.exec(xmlResponse)) !== null) {
    const priceRecordXml = prMatch[1];
    
    // Extract individual fields
    const magCodeMatch = priceRecordXml.match(/<MagCode>(.*?)<\/MagCode>/);
    const argicCodeMatch = priceRecordXml.match(/<ArgicCode>(.*?)<\/ArgicCode>/);
    const priceMatch = priceRecordXml.match(/<Price>(.*?)<\/Price>/);
    const qtyMatch = priceRecordXml.match(/<Qty>(.*?)<\/Qty>/);
    const makeMatch = priceRecordXml.match(/<Make>(.*?)<\/Make>/);
    const descriptionMatch = priceRecordXml.match(/<Description>(.*?)<\/Description>/);
    const priceInfoMatch = priceRecordXml.match(/<PriceInfo>(.*?)<\/PriceInfo>/);
    
    const priceRecord = {
      MagCode: magCodeMatch ? magCodeMatch[1] : '',
      ArgicCode: argicCodeMatch ? argicCodeMatch[1] : '',
      Price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      Qty: qtyMatch ? parseInt(qtyMatch[1]) : 0,
      Make: makeMatch ? makeMatch[1] : '',
      Description: descriptionMatch ? descriptionMatch[1] : '',
      PriceInfo: priceInfoMatch ? priceInfoMatch[1] : ''
    };
    
    console.log(`Found PriceRecord: ${priceRecord.MagCode} - ${priceRecord.ArgicCode} - ${priceRecord.Description}`);
    priceRecords.push(priceRecord);
  }
  
  return priceRecords;
}

/**
 * Parse depot response to extract depot information
 */
function parseDepotResponse(xmlResponse) {
  const depots = [];
  
  // Extract Depot elements
  const depotRegex = /<Depot>([\s\S]*?)<\/Depot>/g;
  let depotMatch;
  
  while ((depotMatch = depotRegex.exec(xmlResponse)) !== null) {
    const depotXml = depotMatch[1];
    
    // Extract individual fields
    const codeMatch = depotXml.match(/<DepotCode>(.*?)<\/DepotCode>/);
    const nameMatch = depotXml.match(/<DepotName>(.*?)<\/DepotName>/);
    
    depots.push({
      depotCode: codeMatch ? codeMatch[1] : '',
      depotName: nameMatch ? nameMatch[1] : ''
    });
  }
  
  return depots;
}

/**
 * Parse stock items response
 */
function parseStockItemsResponse(xmlResponse) {
  const stockItems = [];
  
  // Extract StockItem elements
  const stockItemRegex = /<StockItem>([\s\S]*?)<\/StockItem>/g;
  let siMatch;
  
  while ((siMatch = stockItemRegex.exec(xmlResponse)) !== null) {
    const stockItemXml = siMatch[1];
    
    // Extract individual fields
    const branchMatch = stockItemXml.match(/<_branch>(.*?)<\/_branch>/);
    const magCodeMatch = stockItemXml.match(/<_magCode>(.*?)<\/_magCode>/);
    const argicCodeMatch = stockItemXml.match(/<_argicCode>(.*?)<\/_argicCode>/);
    const qtyMatch = stockItemXml.match(/<_qty>(.*?)<\/_qty>/);
    const priceMatch = stockItemXml.match(/<_price>(.*?)<\/_price>/);
    
    stockItems.push({
      branch: branchMatch ? branchMatch[1] : '',
      magCode: magCodeMatch ? magCodeMatch[1] : '',
      argicCode: argicCodeMatch ? argicCodeMatch[1] : '',
      qty: qtyMatch ? parseInt(qtyMatch[1]) : 0,
      price: priceMatch ? parseFloat(priceMatch[1]) : 0
    });
  }
  
  return stockItems;
}

// Export constants for use in other modules
export const API_CONSTANTS = {
  BASE_URL: API_BASE_URL,
  NAMESPACE: API_NAMESPACE
};

/**
 * Search for stock information using provided parameters
 * @param {Object} params - Search parameters
 * @param {string} [params.magCode] - MAG code to search
 * @param {string} [params.argicCode] - ARGIC code to search
 * @param {string} [params.model] - Vehicle model
 * @param {string} [params.location] - Stock location
 * @returns {Promise<Object>} Response from the API
 */
export async function stockQuery(params = {}) {
  // Ensure at least one search parameter is provided
  const { magCode, argicCode, model, location } = params;
  if (!magCode && !argicCode && !model && !location) {
    return { success: false, error: 'At least one search parameter is required' };
  }

  try {
    const response = await fetch('/api/glass/stock-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('StockQuery API error:', error);
    return { success: false, error: error.message || 'Failed to query stock information' };
  }
}

/**
 * Get available products for a vehicle
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @param {number} year - Vehicle year
 * @returns {Promise<Object>} Response with available products
 */
export async function getAvailableProducts(make, model, year) {
  console.log(`Getting available products for ${make} ${model} ${year}`);
  
  if (!make || !model || !year) {
    return { success: false, error: 'Make, model, and year are required' };
  }

  try {
    // First, get the stock list for the vehicle make, model, and year
    const stockListResult = await getStockList(make, model, "", parseInt(year));
    
    if (!stockListResult.success) {
      console.error('Failed to get stock list:', stockListResult.error);
      return { 
        success: false, 
        error: stockListResult.error || 'Failed to retrieve stock list',
        rawError: stockListResult.rawResponse
      };
    }

    // If stockList is empty, return empty products array
    if (!stockListResult.priceRecords || stockListResult.priceRecords.length === 0) {
      console.log('No products found for the selected vehicle');
      return { success: true, products: [] };
    }

    console.log(`Found ${stockListResult.priceRecords.length} products`);
    
    // Process and return the products
    const products = stockListResult.priceRecords.map(item => ({
      MagCode: item.MagCode || '',
      ArgicCode: item.ArgicCode || '',
      Description: item.Description || '',
      Price: typeof item.Price === 'number' ? item.Price.toFixed(2) : '0.00',
      Qty: typeof item.Qty === 'number' ? item.Qty.toString() : '0',
      Make: item.Make || '',
      PriceInfo: item.PriceInfo || ''
    }));

    return { 
      success: true, 
      products,
      vehicle: stockListResult.vehicle
    };
  } catch (error) {
    console.error('Get available products error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to retrieve available products' 
    };
  }
}

/**
 * Get ARGIC code and vehicle details from a VRN (Vehicle Registration Number)
 */
export async function getArgicFromVRN(vrn) {
  // Remove any spaces from the VRN
  const cleanVRN = vrn.replace(/\s+/g, '');
  
  const bodyContent = `<getStockList xmlns="${API_NAMESPACE}">
    <vrn>${cleanVRN}</vrn>
  </getStockList>`;
  
  console.log(`Sending SOAP request to get ARGIC for VRN: ${cleanVRN}`);
  const result = await sendSoapRequest('getStockList', bodyContent);
  
  if (result.success) {
    try {
      // Extract ARGIC code and vehicle details from XML response
      const response = result.data;
      
      // Look for ARGIC code in the response
      const argicMatch = response.match(/<ArgicCode>(.*?)<\/ArgicCode>/);
      const makeMatch = response.match(/<Make>(.*?)<\/Make>/);
      const modelMatch = response.match(/<Model>(.*?)<\/Model>/);
      const yearMatch = response.match(/<Year>(.*?)<\/Year>/);
      
      // If no ARGIC code found, return an error
      if (!argicMatch) {
        return {
          success: false,
          error: 'No ARGIC code found for this VRN',
          rawResponse: response.substring(0, 500)
        };
      }
      
      return {
        success: true,
        argicCode: argicMatch ? argicMatch[1] : null,
        make: makeMatch ? makeMatch[1] : null,
        model: modelMatch ? modelMatch[1] : null,
        year: yearMatch ? yearMatch[1] : null,
        rawResponse: response.substring(0, 500)
      };
    } catch (error) {
      console.error('Failed to parse getArgicFromVRN response:', error);
      return {
        success: false,
        error: 'Failed to parse vehicle information response',
        rawResponse: result.data.substring(0, 500)
      };
    }
  } else {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode
    };
  }
} 