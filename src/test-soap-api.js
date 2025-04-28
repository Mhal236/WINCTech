// Test script to directly call the Master Auto Glass SOAP API
import https from 'node:https';

// API constants
const API_BASE_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const API_NAMESPACE = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

// API credentials - using the same values from glass-api-service.js
const API_CREDENTIALS = {
  Login: process.env.GLASS_API_LOGIN || 'Q-100',
  Password: process.env.GLASS_API_PASSWORD || 'b048c57a',
  UserID: process.env.GLASS_API_USER_ID ? parseInt(process.env.GLASS_API_USER_ID) : 1
};

/**
 * Test function to call getStockList directly
 */
async function testGetStockList() {
  console.log('Testing direct connection to Master Auto Glass SOAP API...');
  console.log(`Using credentials: Login=${API_CREDENTIALS.Login}, UserID=${API_CREDENTIALS.UserID}`);
  
  // Sample vehicle data - can be adjusted as needed
  const make = 'BMW';
  const model = '3 Series';
  const modelType = '';
  const year = 2018;
  
  // Construct the SOAP envelope
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="${API_NAMESPACE}">
      <Login>${API_CREDENTIALS.Login}</Login>
      <Password>${API_CREDENTIALS.Password}</Password>
      <UserID>${API_CREDENTIALS.UserID}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <getStockList xmlns="${API_NAMESPACE}">
      <make>${make}</make>
      <model>${model}</model>
      <modelType>${modelType}</modelType>
      <year>${year}</year>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getStockList>
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
      'SOAPAction': `${API_NAMESPACE}/getStockList`,
      'Content-Length': Buffer.byteLength(soapEnvelope)
    },
    timeout: 30000 // 30 seconds timeout
  };
  
  return new Promise((resolve) => {
    // Create and send the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SOAP response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Response data (first 500 chars): ${data.substring(0, 500)}...`);
          
          // Check for success in the SOAP response
          const statusMatch = data.match(/<Status>(.*?)<\/Status>/);
          const errorMatch = data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
          
          if (statusMatch) {
            console.log(`SOAP response status: ${statusMatch[1]}`);
          }
          
          if (errorMatch && errorMatch[1]) {
            console.error(`SOAP error message: ${errorMatch[1]}`);
          }
          
          // Look for price records
          const priceRecordRegex = /<PriceRecord>([\s\S]*?)<\/PriceRecord>/g;
          let prMatch;
          const priceRecords = [];
          
          while ((prMatch = priceRecordRegex.exec(data)) !== null) {
            const priceRecordXml = prMatch[1];
            
            // Extract individual fields
            const magCodeMatch = priceRecordXml.match(/<MagCode>(.*?)<\/MagCode>/);
            const argicCodeMatch = priceRecordXml.match(/<ArgicCode>(.*?)<\/ArgicCode>/);
            const priceMatch = priceRecordXml.match(/<Price>(.*?)<\/Price>/);
            const qtyMatch = priceRecordXml.match(/<Qty>(.*?)<\/Qty>/);
            const makeMatch = priceRecordXml.match(/<Make>(.*?)<\/Make>/);
            const descriptionMatch = priceRecordXml.match(/<Description>(.*?)<\/Description>/);
            
            const priceRecord = {
              MagCode: magCodeMatch ? magCodeMatch[1] : '',
              ArgicCode: argicCodeMatch ? argicCodeMatch[1] : '',
              Price: priceMatch ? parseFloat(priceMatch[1]) : 0,
              Qty: qtyMatch ? parseInt(qtyMatch[1]) : 0,
              Make: makeMatch ? makeMatch[1] : '',
              Description: descriptionMatch ? descriptionMatch[1] : ''
            };
            
            priceRecords.push(priceRecord);
          }
          
          console.log(`Found ${priceRecords.length} price records`);
          priceRecords.forEach((record, index) => {
            console.log(`Record ${index + 1}: ${record.MagCode} - ${record.Description} - £${record.Price} - Qty: ${record.Qty}`);
          });
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            priceRecords: priceRecords,
            rawData: data
          });
        } else {
          console.error(`SOAP error response: ${data}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP Error: ${res.statusCode}`,
            rawData: data
          });
        }
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
    
    console.log('SOAP request sent, waiting for response...');
  });
}

// Run the test
testGetStockList()
  .then(result => {
    console.log('Test completed with result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.error('Error:', result.error);
    }
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
  });

/**
 * Test function to search by ARGIC code directly
 */
async function testSearchByArgic(argicCode = '2448') {
  console.log(`Testing direct search by ARGIC code: ${argicCode}`);
  console.log(`Using credentials: Login=${API_CREDENTIALS.Login}, UserID=${API_CREDENTIALS.UserID}`);
  
  // Construct the SOAP envelope for StockSearch
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="${API_NAMESPACE}">
      <Login>${API_CREDENTIALS.Login}</Login>
      <Password>${API_CREDENTIALS.Password}</Password>
      <UserID>${API_CREDENTIALS.UserID}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <StockSearch xmlns="${API_NAMESPACE}">
      <argic>${argicCode}</argic>
      <location></location>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </StockSearch>
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
      'SOAPAction': `${API_NAMESPACE}/StockSearch`,
      'Content-Length': Buffer.byteLength(soapEnvelope)
    },
    timeout: 30000 // 30 seconds timeout
  };
  
  return new Promise((resolve) => {
    // Create and send the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SOAP response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Response data (first 500 chars): ${data.substring(0, 500)}...`);
          
          // Check for success in the SOAP response
          const statusMatch = data.match(/<Status>(.*?)<\/Status>/);
          const errorMatch = data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
          
          if (statusMatch) {
            console.log(`SOAP response status: ${statusMatch[1]}`);
          }
          
          if (errorMatch && errorMatch[1]) {
            console.error(`SOAP error message: ${errorMatch[1]}`);
          }
          
          // Look for price records
          const priceRecordRegex = /<PriceRecord>([\s\S]*?)<\/PriceRecord>/g;
          let prMatch;
          const priceRecords = [];
          
          while ((prMatch = priceRecordRegex.exec(data)) !== null) {
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
            
            priceRecords.push(priceRecord);
          }
          
          console.log(`Found ${priceRecords.length} price records for ARGIC code ${argicCode}`);
          priceRecords.forEach((record, index) => {
            console.log(`Record ${index + 1}: ${record.MagCode} - ${record.Description} - £${record.Price} - Qty: ${record.Qty}`);
            if (record.PriceInfo) {
              console.log(`  Info: ${record.PriceInfo}`);
            }
          });
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            priceRecords: priceRecords,
            rawData: data
          });
        } else {
          console.error(`SOAP error response: ${data}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP Error: ${res.statusCode}`,
            rawData: data
          });
        }
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
    
    console.log('SOAP request sent, waiting for response...');
  });
}

// Run the ARGIC code search test
testSearchByArgic()
  .then(result => {
    console.log('ARGIC search test completed with result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.error('Error:', result.error);
    }
  })
  .catch(err => {
    console.error('Unexpected error during ARGIC search test:', err);
  }); 