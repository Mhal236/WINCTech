/**
 * Glass API Service
 * This module handles SOAP API communication with the Master Auto Glass service.
 */

// Secure header credentials from environment variables
interface SecureHeader {
  Login: string;
  Password: string;
  UserID: number;
}

// Login details as shown in the documentation
interface LoginDetails {
  accountCode: string;
  Password: string;
  accountID: number;
}

// Common types from the WSDL
interface CallResult {
  Status: 'None' | 'NoneStatus' | 'Success' | 'SystemError' | 'ArgicCodesNotFound' | 'AuthorisationFailed' | 'NotEnoughStock' | 'InvalidUser' | 'InvalidPassword' | 'LoggedOn' | 'sqlFailed';
  ErrorMessage: string;
}

interface StockItem {
  _branch?: string;
  _catID: number;
  _magCode?: string;
  _argicCode?: string;
  _model?: string;
  _qty: number;
  _price: number;
  _customerProductID?: string;
}

interface PriceRecord {
  MagCode: string;
  ArgicCode: string;
  Price: number;
  Qty: number;
  Make: string;
  Description: string;
  PriceInfo: string;
}

interface Depot {
  DepotCode: string;
  DepotName: string;
}

interface DeliveryCode {
  DeliveryID: number;
  DeliveryName: string;
  Address: string;
}

/**
 * Helper function to create a SOAP envelope with the secure header
 */
const createSoapEnvelope = (actionName: string, bodyContent: string, credentials: SecureHeader): string => {
  // Using the exact namespace structure from the provided documentation
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
    ${bodyContent}
  </soap:Body>
</soap:Envelope>`;
};

/**
 * Makes a SOAP request to the Master Auto Glass API
 */
async function makeGlassSoapRequest(
  action: string,
  bodyContent: string,
  credentials: SecureHeader
): Promise<Document> {
  try {
    console.log(`Making SOAP request for action: ${action}`);
    const soapEnvelope = createSoapEnvelope(action, bodyContent, credentials);
    
    // Log the full SOAP envelope for debugging (with credentials removed for security)
    const logEnvelope = soapEnvelope.replace(/<Password>.*?<\/Password>/, '<Password>REDACTED</Password>');
    console.log("SOAP Request Envelope:", logEnvelope);
    
    // Always use the server-side proxy to avoid CORS issues
    const apiUrl = "/api/glass-proxy";
    console.log("Using server proxy endpoint for API call");
    
    // Make the request through our proxy
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": `https://www.master-auto-glass.co.uk/pdaservice.asmx/${action}`,
        "Accept": "text/xml"
      },
      // Send the envelope as a raw string
      body: soapEnvelope
    });

    // Log response status and headers for debugging
    console.log(`SOAP Response Status: ${response.status}`);
    console.log("SOAP Response Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SOAP Error Response Body:", errorText);
      throw new Error(`SOAP request failed: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log("SOAP Response Text (first 500 chars):", responseText.substring(0, 500));
    
    // Parse XML response - handle errors gracefully
    let xmlDoc;
    try {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(responseText, "text/xml");
      
      // Check for parser errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error("XML Parser Error:", parserError.textContent);
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }
    } catch (parseError) {
      console.error("Error parsing XML response:", parseError);
      throw new Error(`Failed to parse XML response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    // Check for SOAP Fault
    const faultElement = xmlDoc.getElementsByTagName("Fault")[0];
    if (faultElement) {
      const faultString = faultElement.getElementsByTagName("faultstring")[0]?.textContent || "Unknown SOAP fault";
      throw new Error(`SOAP Fault: ${faultString}`);
    }
    
    return xmlDoc;
  } catch (error) {
    console.error("Error making SOAP request:", error);
    throw error;
  }
}

/**
 * Get credentials from environment variables or MAG authenticated user
 */
export const getGlassApiCredentials = (magCredentials?: { email: string; password: string }): SecureHeader => {
  // If MAG credentials are provided and user is authenticated with MAG, use those
  // TODO: Map MAG credentials to actual Glass API credentials when API is implemented
  if (magCredentials && magCredentials.email === 'admin@windscreencompare.com') {
    console.log("Using MAG authenticated credentials for Glass API");
    // For now, return the same default credentials
    // In the future, this would map the MAG user to their specific Glass API credentials
  }
  
  const credentials = {
    Login: import.meta.env.VITE_GLASS_API_LOGIN || "Q-100",
    Password: import.meta.env.VITE_GLASS_API_PASSWORD || "b048c57a",
    UserID: Number(import.meta.env.VITE_GLASS_API_USER_ID) || 1
  };
  
  console.log("Using API credentials:", {
    login: credentials.Login,
    passwordLength: credentials.Password?.length || 0,
    userID: credentials.UserID,
    authenticatedWithMAG: !!magCredentials
  });
  
  return credentials;
};

/**
 * Check if a specific glass part (by ARGIC code) is available
 */
export const checkAvailability = async (
  argicCode: string,
  quantity: number = 1,
  depot: string = "",
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ isAvailable: boolean; error?: string }> => {
  try {
    const dateRequired = new Date().toISOString();
    const bodyContent = `<tns:checkAvailability>
      <tns:argicCode>${argicCode}</tns:argicCode>
      <tns:customerProductID></tns:customerProductID>
      <tns:callResult>
        <tns:Status>None</tns:Status>
        <tns:ErrorMessage></tns:ErrorMessage>
      </tns:callResult>
      <tns:qty>${quantity}</tns:qty>
      <tns:depot>${depot}</tns:depot>
      <tns:dateRequired>${dateRequired}</tns:dateRequired>
    </tns:checkAvailability>`;

    const xmlDoc = await makeGlassSoapRequest('checkAvailability', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    const result = xmlDoc.querySelector('checkAvailabilityResult')?.textContent === 'true';
    
    if (status === 'Success') {
      return { isAvailable: result };
    } else {
      return { isAvailable: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return { isAvailable: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Get a list of all available depots (updated to match documentation)
 */
export const getDepots = async (
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ depots: Depot[]; error?: string }> => {
  try {
    console.log("Calling GetDepots API");
    
    // Create login details that match the documentation
    const loginDetails: LoginDetails = {
      accountCode: credentials.Login,
      Password: credentials.Password,
      accountID: credentials.UserID
    };
    
    // Format body according to the documentation
    const bodyContent = `<GetDepots xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <loginDetails>
        <accountCode>${loginDetails.accountCode}</accountCode>
        <Password>${loginDetails.Password}</Password>
        <accountID>${loginDetails.accountID}</accountID>
      </loginDetails>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetDepots>`;

    const xmlDoc = await makeGlassSoapRequest('GetDepots', bodyContent, credentials);
    
    // Parse the response using the documented structure
    const depotsResult = xmlDoc.querySelector('GetDepotsResult');
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    console.log("GetDepots response:", { status, errorMessage });
    
    if (status === 'Success') {
      const depotElements = depotsResult?.querySelectorAll('Depot') || [];
      const depots: Depot[] = Array.from(depotElements).map((depotElement) => {
        return {
          DepotCode: depotElement.querySelector('DepotCode')?.textContent || '',
          DepotName: depotElement.querySelector('DepotName')?.textContent || ''
        };
      });
      
      console.log(`Successfully retrieved ${depots.length} depots`);
      return { depots };
    } else {
      console.error("GetDepots API error:", errorMessage);
      return { depots: [], error: errorMessage || "Failed to retrieve depots" };
    }
  } catch (error) {
    console.error('Error getting depots:', error);
    return { depots: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Get a list of delivery codes
 */
export const getDeliveryCodes = async (
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ deliveryCodes: DeliveryCode[]; error?: string }> => {
  try {
    const bodyContent = `<tns:getDeliveryCodes>
      <tns:callResult>
        <tns:Status>None</tns:Status>
        <tns:ErrorMessage></tns:ErrorMessage>
      </tns:callResult>
    </tns:getDeliveryCodes>`;

    const xmlDoc = await makeGlassSoapRequest('getDeliveryCodes', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    if (status === 'Success') {
      const codeElements = xmlDoc.querySelectorAll('Deliverycode');
      const deliveryCodes: DeliveryCode[] = Array.from(codeElements).map((codeElement) => {
        return {
          DeliveryID: parseInt(codeElement.querySelector('DeliveryID')?.textContent || '0'),
          DeliveryName: codeElement.querySelector('DeliveryName')?.textContent || '',
          Address: codeElement.querySelector('Address')?.textContent || ''
        };
      });
      
      return { deliveryCodes };
    } else {
      return { deliveryCodes: [], error: errorMessage };
    }
  } catch (error) {
    console.error('Error getting delivery codes:', error);
    return { deliveryCodes: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Get all available makes
 */
export const getMakes = async (
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ makes: string[]; error?: string }> => {
  try {
    console.log("Calling GetMakes API");
    
    // Format body following the same structure as GetDepots
    const bodyContent = `<GetMakes xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetMakes>`;

    const xmlDoc = await makeGlassSoapRequest('GetMakes', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    console.log("GetMakes response:", { status, errorMessage });
    
    if (status === 'Success') {
      const makesResult = xmlDoc.querySelector('GetMakesResult');
      const stringElements = makesResult?.querySelectorAll('string') || [];
      const makes: string[] = Array.from(stringElements).map(element => element.textContent || '');
      
      console.log(`Successfully retrieved ${makes.length} makes`);
      return { makes };
    } else {
      console.error("GetMakes API error:", errorMessage);
      return { makes: [], error: errorMessage || "Failed to retrieve makes" };
    }
  } catch (error) {
    console.error('Error getting makes:', error);
    return { makes: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Get models for a specific make
 */
export const getModels = async (
  make: string,
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ models: string[]; error?: string }> => {
  try {
    console.log(`Calling GetModels API for make: ${make}`);
    
    // Format body following the same structure as documented
    const bodyContent = `<GetModels xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <make>${make}</make>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetModels>`;

    const xmlDoc = await makeGlassSoapRequest('GetModels', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    console.log("GetModels response:", { status, errorMessage });
    
    if (status === 'Success') {
      const modelsResult = xmlDoc.querySelector('GetModelsResult');
      const stringElements = modelsResult?.querySelectorAll('string') || [];
      const models: string[] = Array.from(stringElements).map(element => element.textContent || '');
      
      console.log(`Successfully retrieved ${models.length} models for ${make}`);
      return { models };
    } else {
      console.error("GetModels API error:", errorMessage);
      return { models: [], error: errorMessage || `Failed to retrieve models for ${make}` };
    }
  } catch (error) {
    console.error('Error getting models:', error);
    return { models: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Get stock list based on vehicle details
 */
export const getStockList = async (
  make: string,
  model: string,
  modelType: string,
  year: number,
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ priceRecords: PriceRecord[]; error?: string }> => {
  try {
    const bodyContent = `<tns:getStockList>
      <tns:make>${make}</tns:make>
      <tns:model>${model}</tns:model>
      <tns:modelType>${modelType}</tns:modelType>
      <tns:year>${year}</tns:year>
      <tns:callResult>
        <tns:Status>None</tns:Status>
        <tns:ErrorMessage></tns:ErrorMessage>
      </tns:callResult>
    </tns:getStockList>`;

    const xmlDoc = await makeGlassSoapRequest('getStockList', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    if (status === 'Success') {
      const priceRecordElements = xmlDoc.querySelectorAll('PriceRecord');
      const priceRecords: PriceRecord[] = Array.from(priceRecordElements).map((recordElement) => {
        return {
          MagCode: recordElement.querySelector('MagCode')?.textContent || '',
          ArgicCode: recordElement.querySelector('ArgicCode')?.textContent || '',
          Price: parseFloat(recordElement.querySelector('Price')?.textContent || '0'),
          Qty: parseInt(recordElement.querySelector('Qty')?.textContent || '0'),
          Make: recordElement.querySelector('Make')?.textContent || '',
          Description: recordElement.querySelector('Description')?.textContent || '',
          PriceInfo: recordElement.querySelector('PriceInfo')?.textContent || ''
        };
      });
      
      return { priceRecords };
    } else {
      return { priceRecords: [], error: errorMessage };
    }
  } catch (error) {
    console.error('Error getting stock list:', error);
    return { priceRecords: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Search for stock by ARGIC code (directly)
 */
export const searchStockByArgic = async (
  argicCode: string,
  location: string = '',
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ priceRecords: PriceRecord[]; error?: string }> => {
  try {
    const bodyContent = `<tns:StockSearch>
      <tns:argic>${argicCode}</tns:argic>
      <tns:location>${location}</tns:location>
      <tns:callResult>
        <tns:Status>None</tns:Status>
        <tns:ErrorMessage></tns:ErrorMessage>
      </tns:callResult>
    </tns:StockSearch>`;

    const xmlDoc = await makeGlassSoapRequest('StockSearch', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    if (status === 'Success') {
      const priceRecordElements = xmlDoc.querySelectorAll('PriceRecord');
      const priceRecords: PriceRecord[] = Array.from(priceRecordElements).map((recordElement) => {
        return {
          MagCode: recordElement.querySelector('MagCode')?.textContent || '',
          ArgicCode: recordElement.querySelector('ArgicCode')?.textContent || '',
          Price: parseFloat(recordElement.querySelector('Price')?.textContent || '0'),
          Qty: parseInt(recordElement.querySelector('Qty')?.textContent || '0'),
          Make: recordElement.querySelector('Make')?.textContent || '',
          Description: recordElement.querySelector('Description')?.textContent || '',
          PriceInfo: recordElement.querySelector('PriceInfo')?.textContent || ''
        };
      });
      
      return { priceRecords };
    } else {
      return { priceRecords: [], error: errorMessage };
    }
  } catch (error) {
    console.error('Error searching stock by ARGIC code:', error);
    return { priceRecords: [], error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Place an order for stock items
 */
export const placeOrder = async (
  stockItems: StockItem[],
  purchaseOrderNo: string,
  depot: string = '',
  deliveryID: number,
  comment: string = '',
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ orderId: number; error?: string }> => {
  try {
    // Create stock items XML
    const stockItemsXml = stockItems.map(item => 
      `<tns:StockItem>
        ${item._branch ? `<tns:_branch>${item._branch}</tns:_branch>` : ''}
        <tns:_catID>${item._catID}</tns:_catID>
        ${item._magCode ? `<tns:_magCode>${item._magCode}</tns:_magCode>` : ''}
        ${item._argicCode ? `<tns:_argicCode>${item._argicCode}</tns:_argicCode>` : ''}
        ${item._model ? `<tns:_model>${item._model}</tns:_model>` : ''}
        <tns:_qty>${item._qty}</tns:_qty>
        <tns:_price>${item._price}</tns:_price>
        ${item._customerProductID ? `<tns:_customerProductID>${item._customerProductID}</tns:_customerProductID>` : ''}
      </tns:StockItem>`
    ).join('');

    const bodyContent = `<tns:StockOrder>
      <tns:stockCriteria>
        ${stockItemsXml}
      </tns:stockCriteria>
      <tns:purchaseOrderNo>${purchaseOrderNo}</tns:purchaseOrderNo>
      <tns:location>${depot}</tns:location>
      <tns:deliveryID>${deliveryID}</tns:deliveryID>
      <tns:comment>${comment}</tns:comment>
      <tns:callResult>
        <tns:Status>None</tns:Status>
        <tns:ErrorMessage></tns:ErrorMessage>
      </tns:callResult>
    </tns:StockOrder>`;

    const xmlDoc = await makeGlassSoapRequest('StockOrder', bodyContent, credentials);
    
    const status = xmlDoc.querySelector('Status')?.textContent;
    const errorMessage = xmlDoc.querySelector('ErrorMessage')?.textContent || '';
    
    if (status === 'Success') {
      const orderIdElement = xmlDoc.querySelector('StockOrderResult');
      const orderId = parseInt(orderIdElement?.textContent || '0');
      return { orderId };
    } else {
      return { orderId: 0, error: errorMessage };
    }
  } catch (error) {
    console.error('Error placing order:', error);
    return { orderId: 0, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Test the API connection with a simple call
 * This is useful for diagnosing connection issues
 */
export const testApiConnection = async (
  credentials: SecureHeader = getGlassApiCredentials()
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Testing API connection with HelloWorld");
    
    // First attempt: Try using direct API call
    try {
      console.log("Attempting direct API call...");
      
      // Using simpler fetch with minimal headers to diagnose issues
      const response = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // Empty body is fine for HelloWorld
        body: "",
        // Set mode to no-cors to see if this bypasses CORS issues
        mode: "no-cors"
      });
      
      console.log("Direct call response type:", response.type);
      
      // If we get this far with no-cors, we can at least reach the server
      // But we can't read the body with no-cors, so return a partial success
      return { 
        success: true, 
        message: "Server is reachable, but CORS is blocking direct browser access. Try using the proxy in production."
      };
    } catch (directError) {
      console.error("Direct API call failed:", directError);
      
      // If direct call fails, try through our proxy if in production
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        console.log("Attempting through proxy...");
        
        try {
          const proxyResponse = await fetch("/api/glass-proxy", {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              "SOAPAction": "https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld"
            },
            body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`
          });
          
          if (proxyResponse.ok) {
            return { 
              success: true, 
              message: "Connected via proxy endpoint."
            };
          } else {
            return {
              success: false,
              message: `Proxy connection failed with status: ${proxyResponse.status}`
            };
          }
        } catch (proxyError) {
          console.error("Proxy API call failed:", proxyError);
        }
      }
      
      // As a last resort, let's suggest a server-side implementation
      return { 
        success: false, 
        message: "Failed to connect to the API. CORS policy might be blocking browser requests. Try implementing a server proxy instead."
      };
    }
  } catch (error) {
    console.error("API test connection error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? 
        `Connection error: ${error.message}` : 
        'Unknown connection error - check your network connection and firewall settings'
    };
  }
};

// Export types for use in other modules
export type { 
  SecureHeader, 
  CallResult, 
  StockItem, 
  PriceRecord, 
  Depot, 
  DeliveryCode,
  LoginDetails
}; 