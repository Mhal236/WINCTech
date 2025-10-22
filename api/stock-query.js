/**
 * Stock Query API for Vercel deployment
 * 
 * Queries Master Auto Glass API for stock information
 * Designed to work as a Vercel serverless function
 */
import axios from 'axios';

// API constants
const GLASS_API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const GLASS_API_NAMESPACE = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { argicCode, model, depot, features, vrn } = req.body;

    console.log(`Stock query request:`, { argicCode, model, depot, vrn });

    // Get MAG API credentials from environment
    const MAG_LOGIN = process.env.MAG_LOGIN || process.env.GLASS_API_LOGIN || 'Q-100';
    const MAG_PASSWORD = process.env.MAG_PASSWORD || process.env.GLASS_API_PASSWORD || 'b048c57a';
    const MAG_USER_ID = process.env.MAG_USER_ID || process.env.GLASS_API_USER_ID || '1';

    // If we have an ARGIC code, search by ARGIC
    if (argicCode) {
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
    <StockSearch xmlns="${GLASS_API_NAMESPACE}">
      <argic>${argicCode}</argic>
      <location>${depot || ''}</location>
      <callResult />
    </StockSearch>
  </soap:Body>
</soap:Envelope>`;

      console.log('Sending SOAP request to StockSearch...');
      
      const response = await axios.post(GLASS_API_URL, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `${GLASS_API_NAMESPACE}/StockSearch`
        },
        timeout: 30000
      });

      console.log('StockSearch response received');

      // Parse XML response
      const priceRecords = parseStockListResponse(response.data);

      return res.status(200).json({
        success: true,
        priceRecords,
        count: priceRecords.length
      });
    } 
    // Otherwise, if we have model info, use getStockList
    else if (model) {
      // Extract vehicle details from the request
      // We'd need make, model, year for this call
      return res.status(400).json({
        success: false,
        error: 'Model-based search not yet implemented in this endpoint'
      });
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Either argicCode or model is required'
      });
    }

  } catch (error) {
    console.error('Error in stock query:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to query stock'
    });
  }
}

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
    
    console.log(`Found PriceRecord: ${priceRecord.MagCode} - ${priceRecord.ArgicCode}`);
    priceRecords.push(priceRecord);
  }
  
  return priceRecords;
}

