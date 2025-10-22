/**
 * Glass Availability API for Vercel deployment
 * 
 * Checks availability of glass products across depots
 * Designed to work as a Vercel serverless function
 */
import axios from 'axios';

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_NAMESPACE = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { argicCode, quantity = '1', depot = '' } = req.query;

    if (!argicCode) {
      return res.status(400).json({
        success: false,
        error: 'argicCode is required'
      });
    }

    console.log(`Checking availability for ARGIC: ${argicCode}, Depot: ${depot || 'all'}`);

    // Get MAG API credentials from environment
    const MAG_LOGIN = process.env.MAG_LOGIN || process.env.GLASS_API_LOGIN || 'Q-100';
    const MAG_PASSWORD = process.env.MAG_PASSWORD || process.env.GLASS_API_PASSWORD || 'b048c57a';
    const MAG_USER_ID = process.env.MAG_USER_ID || process.env.GLASS_API_USER_ID || '1';

    // Use getBranchAvailability to get availability across all depots
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="${GLASS_API_NAMESPACE}">
      <Login>${MAG_LOGIN}</Login>
      <Password>${MAG_PASSWORD}</Password>
      <UserID>${MAG_USER_ID}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <getBranchAvailability xmlns="${GLASS_API_NAMESPACE}">
      <argicCode>${argicCode}</argicCode>
      <callResult />
    </getBranchAvailability>
  </soap:Body>
</soap:Envelope>`;

    console.log('Sending SOAP request to getBranchAvailability...');
    
    const response = await axios.post(GLASS_API_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${GLASS_API_NAMESPACE}/getBranchAvailability`
      },
      timeout: 30000
    });

    console.log('getBranchAvailability response received');

    // Parse XML response
    const stockItems = parseStockItemsResponse(response.data);

    // Calculate total availability
    const totalAvailable = stockItems.reduce((sum, item) => sum + item.qty, 0);

    // Format depots data
    const depots = stockItems
      .filter(item => item.qty > 0) // Only include depots with stock
      .map(item => ({
        branch: item.branch,
        quantity: item.qty,
        price: item.price
      }));

    return res.status(200).json({
      success: true,
      argicCode,
      depots,
      totalAvailable,
      count: depots.length
    });

  } catch (error) {
    console.error('Error checking glass availability:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check availability'
    });
  }
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

