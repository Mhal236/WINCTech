import { NextApiRequest, NextApiResponse } from 'next';
import https from 'node:https';
import { API_BASE_URL, API_CREDENTIALS } from '@/utils/glass-api-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Testing proxy-based API connection to Master Auto Glass");
    
    // Create a simple HelloWorld SOAP envelope
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;
    
    console.log("Making API request via proxy");
    
    try {
      // Send the request to the Master Auto Glass API
      const result = await sendSoapRequest(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld',
          'Content-Length': Buffer.byteLength(soapEnvelope).toString()
        },
        body: soapEnvelope
      });
      
      if (result.success) {
        console.log("API test successful");
        res.status(200).json({
          success: true,
          message: "Connection to Master Auto Glass API successful",
          response: result.data
        });
      } else {
        console.log("API test failed with error:", result.error);
        res.status(200).json({
          success: false,
          message: "Failed to connect to Master Auto Glass API",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error testing API:", error);
      res.status(500).json({
        success: false,
        message: "Error occurred during API test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error("Overall server error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
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