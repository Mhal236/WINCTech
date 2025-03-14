interface CallResult {
  Status: 'None' | 'NoneStatus' | 'Success' | 'SystemError' | 'ArgicCodesNotFound' | 
          'AuthorisationFailed' | 'NotEnoughStock' | 'InvalidUser' | 'InvalidPassword' | 
          'LoggedOn' | 'sqlFailed';
  ErrorMessage: string;
}

interface CheckAvailabilityResponse {
  checkAvailabilityResult: boolean;
  customerProductID: string;
  callResult: CallResult;
}

export const checkGlassAvailability = async (
  eurocodeId: string,
  quantity: number,
  depot: string = 'DEFAULT_DEPOT',
  credentials: { login: string; password: string; userId: number }
): Promise<{ isAvailable: boolean; error?: string }> => {
  try {
    const response = await fetch('https://www.master-auto-glass.co.uk/pdaservice.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/checkAvailability'
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                      xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <SecureHeader xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
              <Login>${credentials.login}</Login>
              <Password>${credentials.password}</Password>
              <UserID>${credentials.userId}</UserID>
            </SecureHeader>
          </soap:Header>
          <soap:Body>
            <checkAvailability xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
              <argicCode>${eurocodeId}</argicCode>
              <customerProductID>${eurocodeId}</customerProductID>
              <callResult>
                <Status>None</Status>
                <ErrorMessage></ErrorMessage>
              </callResult>
              <qty>${quantity}</qty>
              <depot>${depot}</depot>
              <dateRequired>${new Date().toISOString()}</dateRequired>
            </checkAvailability>
          </soap:Body>
        </soap:Envelope>`
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const availabilityResult = xmlDoc.querySelector('checkAvailabilityResult');
    const status = xmlDoc.querySelector('Status');
    const errorMessage = xmlDoc.querySelector('ErrorMessage');

    if (status?.textContent === 'Success') {
      return {
        isAvailable: availabilityResult?.textContent === 'true'
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
}; 