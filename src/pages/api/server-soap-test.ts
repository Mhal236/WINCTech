import { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Starting server-side SOAP API test");
    
    // Store results for display
    const testResults: any[] = [];
    let finalHtml = '';
    
    // TEST 1: Simple HelloWorld with minimal envelope
    try {
      console.log("Running Test 1: Simple HelloWorld call");
      
      // Create a minimal SOAP envelope
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;
      
      // Send the request using Node.js https module for maximum control
      const result = await sendSoapRequest('https://www.master-auto-glass.co.uk/pdaservice.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld',
          'Content-Length': Buffer.byteLength(soapEnvelope).toString()
        },
        body: soapEnvelope
      });
      
      testResults.push({
        name: "Standard SOAP HelloWorld",
        success: result.success,
        statusCode: result.statusCode,
        responseData: result.data,
        error: result.error
      });
    } catch (error) {
      console.error("Error in Test 1:", error);
      testResults.push({
        name: "Standard SOAP HelloWorld",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // TEST 2: Alternative HelloWorld endpoint
    try {
      console.log("Running Test 2: Alternative HelloWorld endpoint");
      
      // Some SOAP services might accept a simpler POST request to a specific endpoint
      const result = await sendSoapRequest('https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: ''
      });
      
      testResults.push({
        name: "Simple HelloWorld endpoint",
        success: result.success,
        statusCode: result.statusCode,
        responseData: result.data,
        error: result.error
      });
    } catch (error) {
      console.error("Error in Test 2:", error);
      testResults.push({
        name: "Simple HelloWorld endpoint",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // TEST 3: SOAP 1.2 Style
    try {
      console.log("Running Test 3: SOAP 1.2 Style");
      
      // Create a SOAP 1.2 envelope
      const soap12Envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap12:Body>
</soap12:Envelope>`;
      
      const result = await sendSoapRequest('https://www.master-auto-glass.co.uk/pdaservice.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(soap12Envelope).toString()
        },
        body: soap12Envelope
      });
      
      testResults.push({
        name: "SOAP 1.2 Request",
        success: result.success,
        statusCode: result.statusCode,
        responseData: result.data,
        error: result.error
      });
    } catch (error) {
      console.error("Error in Test 3:", error);
      testResults.push({
        name: "SOAP 1.2 Request",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Create HTML for display
    finalHtml = createHtmlResponse(testResults);
    
    // Send response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(finalHtml);
  } catch (error) {
    console.error("Overall test error:", error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server SOAP Test Error</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .error { color: red; background-color: #ffeeee; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Server Test Failed</h1>
        <div class="error">
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <p>${error instanceof Error && error.stack ? error.stack.replace(/\n/g, '<br>') : ''}</p>
        </div>
        <p>Test executed at: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}

// Helper function to send SOAP requests with proper error handling
async function sendSoapRequest(url: string, options: {
  method: string;
  headers: Record<string, string>;
  body?: string;
}): Promise<{
  success: boolean;
  statusCode?: number;
  data?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method,
      headers: options.headers,
      timeout: 10000
    };
    
    // Create the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Handle response completion
      res.on('end', () => {
        const success = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300;
        
        resolve({
          success,
          statusCode: res.statusCode,
          data,
          error: success ? undefined : `HTTP Error: ${res.statusCode} ${res.statusMessage}`
        });
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      resolve({
        success: false,
        error: `Request error: ${error.message}`
      });
    });
    
    // Handle timeout
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timed out after 10 seconds'
      });
    });
    
    // Send the body if provided
    if (options.body) {
      req.write(options.body);
    }
    
    // End the request
    req.end();
  });
}

// Helper function to create HTML response
function createHtmlResponse(testResults: any[]): string {
  // Format XML for display
  const formatXml = (xml: string) => {
    return xml.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  
  // Determine if any test was successful
  const anySuccess = testResults.some(result => result.success);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server-Side SOAP API Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #135084; }
        h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test-container { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .success-container { border-left: 5px solid green; }
        .error-container { border-left: 5px solid red; }
        .test-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Server-Side SOAP API Test Results</h1>
      <p>Tests were run from the server (bypassing browser CORS restrictions)</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p class="${anySuccess ? 'success' : 'error'}">
          ${anySuccess ? '✓ At least one test succeeded!' : '✗ All tests failed!'}
        </p>
        <p>Server time: ${new Date().toISOString()}</p>
      </div>
  `;
  
  // Add each test result
  testResults.forEach(result => {
    const isSuccess = result.success;
    
    html += `
      <div class="test-container ${isSuccess ? 'success-container' : 'error-container'}">
        <div class="test-header">
          <h3>${result.name}</h3>
          <span class="${isSuccess ? 'success' : 'error'}">
            ${isSuccess ? '✓ SUCCESS' : '✗ FAILED'}
          </span>
        </div>
        
        ${result.statusCode ? `<p><strong>Status Code:</strong> ${result.statusCode}</p>` : ''}
        
        ${result.error ? `
          <div class="error">
            <p><strong>Error:</strong> ${result.error}</p>
          </div>
        ` : ''}
        
        ${result.responseData ? `
          <p><strong>Response Data:</strong></p>
          <pre>${formatXml(result.responseData)}</pre>
        ` : ''}
      </div>
    `;
  });
  
  // Add instructions based on results
  html += `
      <div class="summary">
        <h2>What This Means</h2>
        ${anySuccess ? `
          <p class="success">Good news! The server is able to connect to the Master Auto Glass API.</p>
          <p>Since at least one test was successful, this confirms your server can make SOAP requests to the API.</p>
          <p>This means:</p>
          <ul>
            <li>You should make all API calls from the server-side, not directly from the browser</li>
            <li>The CORS errors in the browser test are expected and normal</li>
            <li>Your application should be configured to proxy API requests through server endpoints</li>
          </ul>
        ` : `
          <p class="error">The server was unable to connect to the Master Auto Glass API.</p>
          <p>Common issues that might be causing this:</p>
          <ul>
            <li>The API server might be down or unreachable</li>
            <li>There might be network restrictions preventing connection</li>
            <li>The API endpoint might have changed</li>
            <li>The API might require authentication or specific headers</li>
          </ul>
          <p>Check your network configuration and try again later.</p>
        `}
      </div>
    </body>
    </html>
  `;
  
  return html;
} 