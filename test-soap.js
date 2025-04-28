import https from 'node:https';

console.log('Testing SOAP API connection from Node.js...');

// Create a SOAP envelope
const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;

const options = {
  hostname: 'www.master-auto-glass.co.uk',
  path: '/pdaservice.asmx',
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld',
    'Content-Length': Buffer.byteLength(soapEnvelope)
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body (first 300 chars):');
    console.log(responseData.substring(0, 300));
    
    // Check if it's a successful response
    if (responseData.includes('HelloWorldResult')) {
      console.log('\n✅ CONNECTION SUCCESSFUL: The API is working correctly!');
    } else {
      console.log('\n❌ CONNECTION ISSUE: Did not receive expected HelloWorldResult');
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  console.log('\n❌ CONNECTION FAILED: Could not connect to the API');
});

// Try a simple endpoint test as well
console.log('\nAlso testing simple endpoint approach...');
const simpleReq = https.request({
  hostname: 'www.master-auto-glass.co.uk',
  path: '/pdaservice.asmx/HelloWorld',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  timeout: 10000
}, (res) => {
  console.log(`Simple endpoint status: ${res.statusCode} ${res.statusMessage}`);
  let simpleData = '';
  
  res.on('data', chunk => { simpleData += chunk; });
  
  res.on('end', () => {
    console.log('Simple endpoint response (first 100 chars):');
    console.log(simpleData.substring(0, 100));
    
    if (simpleData.includes('string') || simpleData.includes('Hello')) {
      console.log('\n✅ SIMPLE ENDPOINT SUCCESSFUL!');
    } else {
      console.log('\n❌ SIMPLE ENDPOINT FAILED');
    }
  });
});

simpleReq.on('error', (error) => {
  console.error(`Simple endpoint error: ${error.message}`);
});

req.write(soapEnvelope);
req.end();

simpleReq.end();

console.log('Test requests sent, waiting for responses...'); 