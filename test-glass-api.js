// Direct PdaService API Test Script
import https from 'node:https';

// API constants
const API_BASE_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const API_NAMESPACE = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

// API credentials
const API_CREDENTIALS = {
  Login: 'Q-100',
  Password: 'b048c57a',
  UserID: 1
};

console.log('Starting direct Glass API test...');

// Helper function for SOAP requests
async function sendSoapRequest(methodName, bodyContent) {
  return new Promise((resolve) => {
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
    console.log(`Request envelope:\n${soapEnvelope}`);
    
    // Create and send the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SOAP response status: ${res.statusCode}`);
        
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        if (success) {
          console.log(`SOAP response (first 300 chars):\n${data.substring(0, 300)}...`);
          
          // Check for status in the response
          const statusMatch = data.match(/<Status>(.*?)<\/Status>/);
          if (statusMatch) {
            console.log(`Response status: ${statusMatch[1]}`);
          }
          
          // Print error message if any
          const errorMatch = data.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
          if (errorMatch && errorMatch[1]) {
            console.log(`Error message: ${errorMatch[1]}`);
          }
        } else {
          console.error(`SOAP error response:\n${data}`);
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

// Extract PriceRecord fields from a response
function extractPriceRecords(xmlResponse) {
  const priceRecords = [];
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
    
    priceRecords.push({
      MagCode: magCodeMatch ? magCodeMatch[1] : '',
      ArgicCode: argicCodeMatch ? argicCodeMatch[1] : '',
      Price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      Qty: qtyMatch ? parseInt(qtyMatch[1]) : 0,
      Make: makeMatch ? makeMatch[1] : '',
      Description: descriptionMatch ? descriptionMatch[1] : '',
      PriceInfo: priceInfoMatch ? priceInfoMatch[1] : ''
    });
  }
  
  return priceRecords;
}

// Test 1: HelloWorld operation - simplest test
async function testHelloWorld() {
  console.log("\n=== Test 1: HelloWorld ===");
  
  const bodyContent = `<HelloWorld xmlns="${API_NAMESPACE}" />`;
  const result = await sendSoapRequest('HelloWorld', bodyContent);
  
  if (result.success) {
    const match = result.data.match(/<HelloWorldResult>(.*?)<\/HelloWorldResult>/);
    const helloWorldResult = match ? match[1] : 'No result found';
    console.log(`HelloWorld result: ${helloWorldResult}`);
  }
  
  return result.success;
}

// Test 2: Get available makes
async function testGetMakes() {
  console.log("\n=== Test 2: GetMakes ===");
  
  const bodyContent = `<GetMakes xmlns="${API_NAMESPACE}">
    <callResult />
  </GetMakes>`;
  
  const result = await sendSoapRequest('GetMakes', bodyContent);
  
  if (result.success) {
    const makesRegex = /<string>(.*?)<\/string>/g;
    let matches;
    const makes = [];
    
    while ((matches = makesRegex.exec(result.data)) !== null) {
      makes.push(matches[1]);
    }
    
    console.log(`Found ${makes.length} makes`);
    console.log(`First 5 makes: ${makes.slice(0, 5).join(', ')}`);
  }
  
  return result.success;
}

// Test 3: getStockList for BMW 1 Series
async function testGetStockList() {
  console.log("\n=== Test 3: getStockList for BMW 1 Series ===");
  
  const make = 'BMW';
  const model = '1SERIES';
  const year = 2011;
  
  const bodyContent = `<getStockList xmlns="${API_NAMESPACE}">
    <make>${make}</make>
    <model>${model}</model>
    <modelType></modelType>
    <year>${year}</year>
    <callResult>
      <Status>None</Status>
      <ErrorMessage></ErrorMessage>
    </callResult>
  </getStockList>`;
  
  const result = await sendSoapRequest('getStockList', bodyContent);
  
  if (result.success) {
    const priceRecords = extractPriceRecords(result.data);
    console.log(`Found ${priceRecords.length} price records for ${make} ${model} ${year}`);
    
    if (priceRecords.length > 0) {
      console.log('\nSample records:');
      priceRecords.slice(0, 3).forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`MagCode: ${record.MagCode}`);
        console.log(`ArgicCode: ${record.ArgicCode}`);
        console.log(`Description: ${record.Description}`);
        console.log(`Price: £${record.Price}`);
        console.log(`Qty: ${record.Qty}`);
      });
    }
  }
  
  return result.success;
}

// Test 4: StockQuery with ARGIC code 2448
async function testStockQuery() {
  console.log("\n=== Test 4: StockQuery with ARGIC code 2448 ===");
  
  const argicCode = '2448';
  
  const bodyContent = `<StockQuery xmlns="${API_NAMESPACE}">
    <stockItm>
      <StockItem>
        <_branch></_branch>
        <_catID>0</_catID>
        <_magCode></_magCode>
        <_argicCode>${argicCode}</_argicCode>
        <_model></_model>
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
  </StockQuery>`;
  
  const result = await sendSoapRequest('StockQuery', bodyContent);
  
  if (result.success) {
    const priceRecords = extractPriceRecords(result.data);
    console.log(`Found ${priceRecords.length} price records for ARGIC code ${argicCode}`);
    
    if (priceRecords.length > 0) {
      console.log('\nSample records:');
      priceRecords.slice(0, 3).forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`MagCode: ${record.MagCode}`);
        console.log(`ArgicCode: ${record.ArgicCode}`);
        console.log(`Description: ${record.Description}`);
        console.log(`Price: £${record.Price}`);
        console.log(`Qty: ${record.Qty}`);
      });
    }
  }
  
  return result.success;
}

// Run all tests
async function runTests() {
  let success = await testHelloWorld();
  if (!success) {
    console.error("HelloWorld test failed, API connection issue detected. Stopping tests.");
    return;
  }
  
  success = await testGetMakes();
  if (!success) {
    console.error("GetMakes test failed. Continuing with remaining tests.");
  }
  
  success = await testGetStockList();
  if (!success) {
    console.error("getStockList test failed. Continuing with remaining tests.");
  }
  
  success = await testStockQuery();
  if (!success) {
    console.error("StockQuery test failed.");
  }
  
  console.log("\n=== Test Summary ===");
  console.log("All tests completed. Check logs above for results.");
}

// Start the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
}); 