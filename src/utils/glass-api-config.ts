/**
 * Master Auto Glass API Configuration
 * 
 * This file contains configuration settings for connecting to the 
 * Master Auto Glass SOAP API.
 */

// API base URL
export const API_BASE_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';

// API credentials
// IMPORTANT: In a production environment, these should be stored in environment variables
// and not committed to source control
export const API_CREDENTIALS = {
  login: process.env.GLASS_API_LOGIN || 'YOUR_LOGIN',
  userId: process.env.GLASS_API_USER_ID || 'YOUR_USER_ID',
  password: process.env.GLASS_API_PASSWORD || 'YOUR_PASSWORD'
};

// SOAP action URLs
export const SOAP_ACTIONS = {
  helloWorld: `${API_BASE_URL}/HelloWorld`,
  getDepots: `${API_BASE_URL}/GetDepots`,
  getLocations: `${API_BASE_URL}/GetLocations`,
  getMakes: `${API_BASE_URL}/GetMakes`,
  getModels: `${API_BASE_URL}/GetModels`,
  stockOrder: `${API_BASE_URL}/StockOrder`,
  stockQuery: `${API_BASE_URL}/StockQuery`,
  stockSearch: `${API_BASE_URL}/StockSearch`,
  checkAvailability: `${API_BASE_URL}/checkAvailability`,
  getBranchAvailability: `${API_BASE_URL}/getBranchAvailability`,
  getDeliveryCodes: `${API_BASE_URL}/getDeliveryCodes`,
  getStockList: `${API_BASE_URL}/getStockList`,
  placeOrder: `${API_BASE_URL}/placeOrder`,
  checkOtherDepots: `${API_BASE_URL}/CheckkOtherDepots`
};

// Helper to create a SOAP envelope with proper credentials
export function createSoapEnvelope(method: string, params: Record<string, any> = {}): string {
  // Start the SOAP envelope
  let envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="${API_BASE_URL}">
      <login>${API_CREDENTIALS.login}</login>
      <userId>${API_CREDENTIALS.userId}</userId>
      <password>${API_CREDENTIALS.password}</password>`;

  // Add each parameter to the envelope
  for (const [key, value] of Object.entries(params)) {
    // Skip credentials which we already added
    if (key === 'login' || key === 'userId' || key === 'password') continue;
    
    // Add the parameter
    envelope += `
      <${key}>${value}</${key}>`;
  }

  // Close the SOAP envelope
  envelope += `
    </${method}>
  </soap:Body>
</soap:Envelope>`;

  return envelope;
} 