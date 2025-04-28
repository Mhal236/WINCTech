import { NextApiRequest, NextApiResponse } from 'next';
import https from 'node:https';
import { API_BASE_URL } from '@/utils/glass-api-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Starting glass API debug test");
    
    // Create a very simple SOAP envelope for HelloWorld
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;
    
    // First, try a direct connection to the API
    console.log("Testing direct API connection");
    
    const directResult = await sendSoapRequest(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld',
        'Content-Length': Buffer.byteLength(soapEnvelope).toString()
      },
      body: soapEnvelope
    });
    
    // Then, try a direct POST to just the HelloWorld endpoint
    console.log("Testing simple HelloWorld endpoint");
    
    const simpleResult = await sendSoapRequest(`${API_BASE_URL}/HelloWorld`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: ''
    });
    
    // Format results as HTML for easy viewing
    const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <title>Glass API Debug Tool</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; max-height: 400px; overflow-y: auto; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .debug-section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .xml { color: #2980b9; }
    .instructions { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Glass API Debug Information</h1>
  
  <div class="instructions">
    <p>This page displays detailed debug information about the connectivity to the Master Auto Glass API.</p>
    <p>Use this information to diagnose connection issues.</p>
  </div>
  
  <h2>Direct API Connection Test</h2>
  <div class="debug-section">
    <p><strong>Status:</strong> <span class="${directResult.success ? 'success' : 'error'}">${directResult.success ? 'SUCCESS' : 'FAILED'}</span></p>
    <p><strong>Status Code:</strong> ${directResult.statusCode || 'N/A'}</p>
    
    ${directResult.error ? `<p><strong>Error:</strong> <span class="error">${directResult.error}</span></p>` : ''}
    
    <p><strong>Response:</strong></p>
    <pre class="xml">${directResult.data ? escapeHtml(directResult.data).substring(0, 1000) : 'No data'}</pre>
  </div>
  
  <h2>Simple HelloWorld Endpoint Test</h2>
  <div class="debug-section">
    <p><strong>Status:</strong> <span class="${simpleResult.success ? 'success' : 'error'}">${simpleResult.success ? 'SUCCESS' : 'FAILED'}</span></p>
    <p><strong>Status Code:</strong> ${simpleResult.statusCode || 'N/A'}</p>
    
    ${simpleResult.error ? `<p><strong>Error:</strong> <span class="error">${simpleResult.error}</span></p>` : ''}
    
    <p><strong>Response:</strong></p>
    <pre class="xml">${simpleResult.data ? escapeHtml(simpleResult.data).substring(0, 1000) : 'No data'}</pre>
  </div>
  
  <h2>How to Fix CORS Issues</h2>
  <div class="debug-section">
    <p>Based on these results:</p>
    
    ${directResult.success || simpleResult.success ?
      `<p class="success">Good news! The server can connect to the Master Auto Glass API.</p>
       <p>This means your server-side proxy should work correctly. Make sure that:</p>
       <ul>
         <li>Your client code is using the <code>/api/glass-proxy</code> endpoint</li>
         <li>You're sending the correct SOAPAction header and XML body</li>
         <li>The request body is sent as a plain string, not JSON</li>
       </ul>`
      :
      `<p class="error">Neither test succeeded. There might be a network or firewall issue preventing connection to the API.</p>
       <p>Possible issues:</p>
       <ul>
         <li>Your server cannot reach the Master Auto Glass API</li>
         <li>The API might be temporarily down</li>
         <li>There might be firewall rules blocking outbound connections</li>
       </ul>`
    }
    
    <p>For further testing, you can:</p>
    <ul>
      <li>Try visiting <a href="/api/glass-test" target="_blank">the Glass Test API</a> to run a simpler test</li>
      <li>Check your browser's Network tab to see the exact requests and responses</li>
      <li>Look at your server logs for more detailed error information</li>
    </ul>
  </div>
  
  <p><small>Generated at: ${new Date().toISOString()}</small></p>
</body>
</html>
    `;
    
    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlResponse);
  } catch (error) {
    // In case of error, send a simple error page
    console.error("Error in glass-debug:", error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Glass API Debug Error</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .error { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Error Running Debug Tests</h1>
  <p class="error">${error instanceof Error ? error.message : "Unknown error occurred"}</p>
  <p>Please check the server logs for more information.</p>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}

// Function to escape HTML in the response
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to send SOAP requests
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
      timeout: 15000
    };
    
    console.log(`Debug: Sending request to ${urlObj.hostname}${urlObj.pathname}`);
    
    // Create the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Handle response completion
      res.on('end', () => {
        console.log(`Debug: Received response status: ${res.statusCode}`);
        
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
      console.error(`Debug: Request error:`, error);
      resolve({
        success: false,
        error: `Request error: ${error.message}`
      });
    });
    
    // Handle timeout
    req.on('timeout', () => {
      console.error(`Debug: Request timed out`);
      req.destroy();
      resolve({
        success: false,
        error: 'Request timed out after 15 seconds'
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