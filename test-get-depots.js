import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// API configuration
const API_URL = 'https://www.master-auto-glass.co.uk/pdaservice.asmx';
const API_ACTION = 'https://www.master-auto-glass.co.uk/pdaservice.asmx/GetDepots';

// Credentials found in the codebase
const credentials = {
  Login: "Q-100",
  Password: "b048c57a",
  UserID: 1
};

// Create SOAP envelope for GetDepots
const createSoapEnvelope = () => {
  const loginDetails = {
    accountCode: credentials.Login,
    Password: credentials.Password,
    accountID: credentials.UserID
  };

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <Login>${credentials.Login}</Login>
      <Password>${credentials.Password}</Password>
      <UserID>${credentials.UserID}</UserID>
    </SecureHeader>
  </soap:Header>
  <soap:Body>
    <GetDepots xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <loginDetails>
        <accountCode>${loginDetails.accountCode}</accountCode>
        <Password>${loginDetails.Password}</Password>
        <accountID>${loginDetails.accountID}</accountID>
      </loginDetails>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetDepots>
  </soap:Body>
</soap:Envelope>`;
};

// Parse XML response
const parseDepotResponse = (xmlString) => {
  const dom = new JSDOM(xmlString, { contentType: "text/xml" });
  const doc = dom.window.document;
  
  // Check for SOAP fault
  const faultElement = doc.querySelector("Fault");
  if (faultElement) {
    const faultString = faultElement.querySelector("faultstring")?.textContent || "Unknown SOAP fault";
    throw new Error(`SOAP Fault: ${faultString}`);
  }
  
  // Get the status and error message
  const status = doc.querySelector("Status")?.textContent;
  const errorMessage = doc.querySelector("ErrorMessage")?.textContent || '';
  
  console.log("Response status:", status);
  if (errorMessage) console.log("Error message:", errorMessage);
  
  if (status === 'Success') {
    const depotsResult = doc.querySelector('GetDepotsResult');
    const depotElements = depotsResult?.querySelectorAll('Depot') || [];
    
    const depots = Array.from(depotElements).map((depotElement) => {
      return {
        DepotCode: depotElement.querySelector('DepotCode')?.textContent || '',
        DepotName: depotElement.querySelector('DepotName')?.textContent || ''
      };
    });
    
    return depots;
  } else {
    throw new Error(`API returned non-success status: ${status} - ${errorMessage}`);
  }
};

// Make the API call
async function testGetDepots() {
  console.log("Testing GetDepots API call...");
  
  const soapEnvelope = createSoapEnvelope();
  console.log("SOAP Envelope:", soapEnvelope);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': API_ACTION
      },
      body: soapEnvelope
    });
    
    console.log("Response status:", response.status);
    
    const responseText = await response.text();
    console.log("Raw response (first 500 chars):", responseText.substring(0, 500));
    
    if (!response.ok) {
      console.error("Error response from API:", responseText);
      throw new Error(`API returned status ${response.status}`);
    }
    
    const depots = parseDepotResponse(responseText);
    console.log(`Successfully retrieved ${depots.length} depots:`);
    console.log(depots);
    
  } catch (error) {
    console.error("Error testing GetDepots API:", error);
  }
}

// Run the test
testGetDepots(); 