import { NextApiRequest, NextApiResponse } from 'next';
import https from 'node:https';
import { API_BASE_URL } from '@/utils/glass-api-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Only POST requests are supported.' });
  }

  try {
    // Get SOAP action from headers
    const soapAction = req.headers['soapaction'] as string;
    
    if (!soapAction) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing SOAPAction header" 
      });
    }
    
    // Log debugging information
    console.log(`SOAP Proxy received request with action: ${soapAction}`);
    console.log('Request headers:', req.headers);
    
    // Get request body (SOAP envelope)
    const soapEnvelope = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    if (!soapEnvelope || soapEnvelope === '{}') {
      console.error("Missing or empty SOAP envelope body");
      return res.status(400).json({ 
        success: false, 
        error: "Missing or empty request body (SOAP envelope)" 
      });
    }
    
    console.log(`Proxying SOAP request to ${API_BASE_URL}`);
    console.log(`SOAP Envelope (first 200 chars): ${soapEnvelope.substring(0, 200)}`);
    
    // Forward the request to the Master Auto Glass API
    const result = await sendSoapRequest(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction,
        'Content-Length': Buffer.byteLength(soapEnvelope).toString()
      },
      body: soapEnvelope
    });

    // Return the response with appropriate headers
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    
    if (result.success) {
      console.log(`SOAP Proxy: Successful response (${result.statusCode})`);
      res.status(200).send(result.data);
    } else {
      console.error(`SOAP Proxy: Error response (${result.statusCode}):`, result.error);
      console.error(`Response data: ${result.data?.substring(0, 200) || 'No data'}`);
      
      // Still return the error response as XML
      res.status(200).send(result.data || `<error>${result.error}</error>`);
    }
  } catch (error) {
    console.error("Error in glass-proxy:", error);
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
      timeout: 30000 // Increased timeout to 30 seconds
    };
    
    console.log(`Sending request to ${urlObj.hostname}${urlObj.pathname}`);
    
    // Create the request
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Handle response completion
      res.on('end', () => {
        console.log(`SOAP Proxy received response status: ${res.statusCode}`);
        console.log(`SOAP Proxy response headers:`, res.headers);
        
        const success = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300;
        
        if (success) {
          console.log(`SOAP Proxy response data (first 200 chars): ${data.substring(0, 200)}`);
        } else {
          console.error(`SOAP Proxy error response data: ${data.substring(0, 500)}`);
        }
        
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
      console.error(`SOAP Proxy request error:`, error);
      resolve({
        success: false,
        error: `Request error: ${error.message}`
      });
    });
    
    // Handle timeout
    req.on('timeout', () => {
      console.error(`SOAP Proxy request timed out`);
      req.destroy();
      resolve({
        success: false,
        error: 'Request timed out after 30 seconds'
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