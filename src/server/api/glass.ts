// This file should be on the server side, not accessible to the client
// It could be implemented in a Next.js API route, Express server, 
// or any other server-side technology your project uses

// Define interfaces for API responses
interface CallResult {
  Status: 'None' | 'NoneStatus' | 'Success' | 'SystemError' | 'ArgicCodesNotFound' | 
          'AuthorisationFailed' | 'NotEnoughStock' | 'InvalidUser' | 'InvalidPassword' | 
          'LoggedOn' | 'sqlFailed';
  ErrorMessage: string;
}

interface StockItem {
  _branch: string;
  _catID: number;
  _magCode: string;
  _argicCode: string;
  _model: string;
  _qty: number;
  _price: number;
  _customerProductID: string;
}

interface Depot {
  DepotCode: string;
  DepotName: string;
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

interface DeliveryCode {
  DeliveryID: number;
  DeliveryName: string;
  Address: string;
}

interface SecureHeader {
  Login: string;
  Password: string;
  UserID: number;
}

// Access environment variables without the VITE_ prefix
const glassApiLogin = process.env.GLASS_API_LOGIN || "Q-100";  // Default to provided credentials
const glassApiPassword = process.env.GLASS_API_PASSWORD || "b048c57a";
const glassApiUserId = process.env.GLASS_API_USER_ID ? parseInt(process.env.GLASS_API_USER_ID) : 1;

const credentials: SecureHeader = {
  Login: glassApiLogin,
  Password: glassApiPassword,
  UserID: glassApiUserId
};

// Base function for making SOAP requests
async function makeGlassSoapRequest(
  action: string,
  bodyContent: string
): Promise<Document> {
  try {
    const response = await fetch('https://www.master-auto-glass.co.uk/pdaservice.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `https://www.master-auto-glass.co.uk/pdaservice.asmx/${action}`
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
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
        </soap:Envelope>`
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    return xmlDoc;
  } catch (error) {
    console.error(`Error making SOAP request for ${action}:`, error);
    throw error;
  }
}

/**
 * Get all available depots
 */
export async function getGlassDepots() {
  try {
    const bodyContent = `<GetLocations xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetLocations>`;

    const xmlDoc = await makeGlassSoapRequest('GetLocations', bodyContent);
    
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');
    
    if (status?.textContent === 'Success') {
      const depotsElements = xmlDoc.querySelectorAll('Depot');
      const depots: Depot[] = Array.from(depotsElements).map((depotElement) => {
        return {
          DepotCode: depotElement.querySelector('DepotCode')?.textContent || '',
          DepotName: depotElement.querySelector('DepotName')?.textContent || ''
        };
      });
      
      return { depots };
    }
    
    return {
      depots: [],
      error: errorMessage?.textContent || 'Unknown error occurred'
    };
  } catch (error) {
    console.error('Error fetching depots:', error);
    return {
      depots: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check glass availability at a depot
 */
export async function checkGlassAvailability(eurocodeId: string, quantity: number, depot: string = 'DEFAULT_DEPOT') {
  try {
    const bodyContent = `<checkAvailability xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <argicCode>${eurocodeId}</argicCode>
      <customerProductID>${eurocodeId}</customerProductID>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
      <qty>${quantity}</qty>
      <depot>${depot}</depot>
      <dateRequired>${new Date().toISOString()}</dateRequired>
    </checkAvailability>`;

    const xmlDoc = await makeGlassSoapRequest('checkAvailability', bodyContent);
    
    const availabilityResult = xmlDoc.querySelector('checkAvailabilityResult');
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');

    if (status?.textContent === 'Success') {
      return {
        isAvailable: availabilityResult?.textContent === 'true',
        depot: depot
      };
    }

    return {
      isAvailable: false,
      error: errorMessage?.textContent || 'Unknown error occurred'
    };
  } catch (error) {
    console.error('Error checking glass availability:', error);
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get availability across all branches for a specific argic code
 */
export async function getBranchAvailability(eurocodeId: string) {
  try {
    const bodyContent = `<getBranchAvailability xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <argicCode>${eurocodeId}</argicCode>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getBranchAvailability>`;

    const xmlDoc = await makeGlassSoapRequest('getBranchAvailability', bodyContent);
    
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');
    
    if (status?.textContent === 'Success') {
      const stockItemElements = xmlDoc.querySelectorAll('StockItem');
      const stockItems: StockItem[] = Array.from(stockItemElements).map((itemElement) => {
        return {
          _branch: itemElement.querySelector('_branch')?.textContent || '',
          _catID: parseInt(itemElement.querySelector('_catID')?.textContent || '0'),
          _magCode: itemElement.querySelector('_magCode')?.textContent || '',
          _argicCode: itemElement.querySelector('_argicCode')?.textContent || '',
          _model: itemElement.querySelector('_model')?.textContent || '',
          _qty: parseInt(itemElement.querySelector('_qty')?.textContent || '0'),
          _price: parseFloat(itemElement.querySelector('_price')?.textContent || '0'),
          _customerProductID: itemElement.querySelector('_customerProductID')?.textContent || ''
        };
      });
      
      return { stockItems };
    }
    
    return {
      stockItems: [],
      error: errorMessage?.textContent || 'Unknown error occurred'
    };
  } catch (error) {
    console.error('Error fetching branch availability:', error);
    return {
      stockItems: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get stock list based on vehicle details
 */
export async function getVehicleStockList(make: string, model: string, modelType: string, year: number) {
  try {
    const bodyContent = `<getStockList xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <make>${make}</make>
      <model>${model}</model>
      <modelType>${modelType}</modelType>
      <year>${year}</year>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </getStockList>`;

    const xmlDoc = await makeGlassSoapRequest('getStockList', bodyContent);
    
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');
    
    if (status?.textContent === 'Success') {
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
    }
    
    return {
      priceRecords: [],
      error: errorMessage?.textContent || 'Unknown error occurred'
    };
  } catch (error) {
    console.error('Error getting stock list:', error);
    return {
      priceRecords: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Place an order for glass
 */
export async function placeGlassOrder(
  stockItems: StockItem[],
  purchaseOrderNo: string,
  depot: string,
  deliveryID: number,
  comment: string
) {
  try {
    const stockItemsXml = stockItems.map(item => `
      <StockItem>
        <_branch>${item._branch}</_branch>
        <_catID>${item._catID}</_catID>
        <_magCode>${item._magCode}</_magCode>
        <_argicCode>${item._argicCode}</_argicCode>
        <_model>${item._model}</_model>
        <_qty>${item._qty}</_qty>
        <_price>${item._price}</_price>
        <_customerProductID>${item._customerProductID}</_customerProductID>
      </StockItem>
    `).join('');

    const bodyContent = `<StockOrder xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <stockCriteria>
        ${stockItemsXml}
      </stockCriteria>
      <purchaseOrderNo>${purchaseOrderNo}</purchaseOrderNo>
      <location>${depot}</location>
      <deliveryID>${deliveryID}</deliveryID>
      <comment>${comment}</comment>
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </StockOrder>`;

    const xmlDoc = await makeGlassSoapRequest('StockOrder', bodyContent);
    
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');
    const orderResult = xmlDoc.querySelector('StockOrderResult');
    
    if (status?.textContent === 'Success' && orderResult) {
      return {
        orderId: parseInt(orderResult.textContent || '0')
      };
    }
    
    return {
      orderId: 0,
      error: errorMessage?.textContent || 'Unknown error occurred'
    };
  } catch (error) {
    console.error('Error placing order:', error);
    return {
      orderId: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 