import { NextApiRequest, NextApiResponse } from 'next';
import https from 'node:https';
import { API_BASE_URL, SOAP_ACTIONS, createSoapEnvelope } from '@/utils/glass-api-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get parameters from the request
    const { argicCode, quantity = 1 } = req.query;
    
    if (!argicCode) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required parameter: argicCode" 
      });
    }
    
    // First, get all depots to have their details
    const allDepots = await getDepots();
    
    if (!allDepots.success) {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch depot information",
        details: allDepots.error
      });
    }
    
    // Create a map of depot codes to their details for easy lookup
    const depotMap = new Map();
    allDepots.depots.forEach((depot: any) => {
      depotMap.set(depot.DepotCode, depot);
    });
    
    // Then check availability at all depots
    const availability = await checkBranchAvailability(argicCode.toString(), parseInt(quantity as string) || 1);
    
    if (!availability.success) {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to check glass availability",
        details: availability.error
      });
    }
    
    // Format the response by combining depot details with availability information
    const availabilityWithDetails = availability.depots.map((depot: any) => {
      const depotDetails = depotMap.get(depot.DepotCode) || {};
      return {
        ...depot,
        // Add additional depot details if available
        depotName: depotDetails.DepotName || 'Unknown',
        address: depotDetails.Address || '',
        town: depotDetails.Town || '',
        county: depotDetails.County || '',
        postcode: depotDetails.PostCode || '',
        telephone: depotDetails.Telephone || '',
        email: depotDetails.Email || '',
        outcode: depotDetails.Outcode || '',
        distance: depotDetails.Distance || null
      };
    });
    
    // Respond with the availability information
    res.status(200).json({
      success: true,
      argicCode,
      quantity,
      totalAvailable: availability.depots.reduce((sum: number, depot: any) => sum + (depot.Qty || 0), 0),
      depots: availabilityWithDetails
    });
  } catch (error) {
    console.error("Error checking glass availability:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
}

// Function to get all depots
async function getDepots(): Promise<{ 
  success: boolean; 
  depots?: any[]; 
  error?: string 
}> {
  try {
    // Create SOAP envelope for GetDepots using our helper
    const soapEnvelope = createSoapEnvelope('GetDepots');

    // Make the SOAP request to get depots
    const result = await sendSoapRequest(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': SOAP_ACTIONS.getDepots,
        'Content-Length': Buffer.byteLength(soapEnvelope).toString()
      },
      body: soapEnvelope
    });

    // Check if the request was successful
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Parse the XML response
    const responseData = result.data || '';
    
    // Basic XML parsing to extract depot information
    // For production, you should use a proper XML parser library
    const depots = [];
    const depotMatches = responseData.match(/<Depot>[\s\S]*?<\/Depot>/g);
    
    if (depotMatches && depotMatches.length > 0) {
      for (const depotXml of depotMatches) {
        const depot: any = {};
        
        // Extract depot code
        const depotCodeMatch = depotXml.match(/<DepotCode>(.*?)<\/DepotCode>/);
        if (depotCodeMatch) depot.DepotCode = depotCodeMatch[1];
        
        // Extract depot name
        const depotNameMatch = depotXml.match(/<DepotName>(.*?)<\/DepotName>/);
        if (depotNameMatch) depot.DepotName = depotNameMatch[1];
        
        // Extract address
        const addressMatch = depotXml.match(/<Address>(.*?)<\/Address>/);
        if (addressMatch) depot.Address = addressMatch[1];
        
        // Extract town
        const townMatch = depotXml.match(/<Town>(.*?)<\/Town>/);
        if (townMatch) depot.Town = townMatch[1];
        
        // Extract county
        const countyMatch = depotXml.match(/<County>(.*?)<\/County>/);
        if (countyMatch) depot.County = countyMatch[1];
        
        // Extract postcode
        const postcodeMatch = depotXml.match(/<PostCode>(.*?)<\/PostCode>/);
        if (postcodeMatch) depot.PostCode = postcodeMatch[1];
        
        // Extract telephone
        const telephoneMatch = depotXml.match(/<Telephone>(.*?)<\/Telephone>/);
        if (telephoneMatch) depot.Telephone = telephoneMatch[1];
        
        // Extract email
        const emailMatch = depotXml.match(/<Email>(.*?)<\/Email>/);
        if (emailMatch) depot.Email = emailMatch[1];
        
        // Extract outcode
        const outcodeMatch = depotXml.match(/<Outcode>(.*?)<\/Outcode>/);
        if (outcodeMatch) depot.Outcode = outcodeMatch[1];
        
        depots.push(depot);
      }
    }

    return { success: true, depots };
  } catch (error) {
    console.error("Error fetching depots:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error fetching depots" 
    };
  }
}

// Function to check availability at different branches
async function checkBranchAvailability(argicCode: string, quantity: number): Promise<{ 
  success: boolean; 
  depots?: any[]; 
  error?: string 
}> {
  try {
    // Create SOAP envelope for getBranchAvailability using our helper
    const soapEnvelope = createSoapEnvelope('getBranchAvailability', {
      argicCode,
      qty: quantity
    });

    // Make the SOAP request to check branch availability
    const result = await sendSoapRequest(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': SOAP_ACTIONS.getBranchAvailability,
        'Content-Length': Buffer.byteLength(soapEnvelope).toString()
      },
      body: soapEnvelope
    });

    // Check if the request was successful
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Parse the XML response
    const responseData = result.data || '';
    
    // Basic XML parsing to extract availability information
    // For production, you should use a proper XML parser library
    const depots = [];
    const depotMatches = responseData.match(/<Depot>[\s\S]*?<\/Depot>/g);
    
    if (depotMatches && depotMatches.length > 0) {
      for (const depotXml of depotMatches) {
        const depot: any = {};
        
        // Extract depot code
        const depotCodeMatch = depotXml.match(/<DepotCode>(.*?)<\/DepotCode>/);
        if (depotCodeMatch) depot.DepotCode = depotCodeMatch[1];
        
        // Extract quantity
        const qtyMatch = depotXml.match(/<Qty>(.*?)<\/Qty>/);
        if (qtyMatch) depot.Qty = parseInt(qtyMatch[1], 10);
        
        depots.push(depot);
      }
    }

    return { success: true, depots };
  } catch (error) {
    console.error("Error checking branch availability:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error checking branch availability" 
    };
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