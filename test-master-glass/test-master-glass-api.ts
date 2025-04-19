/**
 * Master Auto Glass API Test Script with XML2JS Parser
 * 
 * This script tests the checkAvailability SOAP API endpoint from Master Auto Glass
 * with proper XML parsing using xml2js
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Define types for our credential and parameter objects
interface Credentials {
  login: string;
  password: string;
  userId: number;
}

interface TestParameters {
  argicCode: string;
  customerProductID: string;
  qty: number;
  depot: string;
  dateRequired: string;
}

// API Status enum based on possible values from the documentation
enum ApiStatus {
  None = 'None',
  NoneStatus = 'NoneStatus',
  Success = 'Success',
  SystemError = 'SystemError',
  ArgicCodesNotFound = 'ArgicCodesNotFound',
  AuthorisationFailed = 'AuthorisationFailed',
  NotEnoughStock = 'NotEnoughStock',
  InvalidUser = 'InvalidUser',
  InvalidPassword = 'InvalidPassword',
  LoggedOn = 'LoggedOn',
  SqlFailed = 'sqlFailed'
}

// Replace these with your actual credentials
const credentials: Credentials = {
  login: 'Q-100',
  password: 'b048c57a',
  userId: 1 // Replace with your actual user ID
};

// Test parameters
const testParams: TestParameters = {
  argicCode: 'TEST_CODE', // Replace with an actual argic code to test
  customerProductID: 'CUSTOMER_PRODUCT_ID', // Optional, replace if needed
  qty: 1, // Quantity to check
  depot: 'DEPOT_CODE', // Replace with actual depot code if required
  dateRequired: new Date().toISOString() // Current date in ISO format
};

// Construct the SOAP request body
const soapEnvelope = `
<?xml version="1.0" encoding="utf-8"?>
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
      <argicCode>${testParams.argicCode}</argicCode>
      <customerProductID>${testParams.customerProductID}</customerProductID>
      <callResult>
        <Status>${ApiStatus.None}</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
      <qty>${testParams.qty}</qty>
      <depot>${testParams.depot}</depot>
      <dateRequired>${testParams.dateRequired}</dateRequired>
    </checkAvailability>
  </soap:Body>
</soap:Envelope>
`;

// Make the SOAP request
async function testMasterGlassAPI(): Promise<void> {
  try {
    console.log("Sending SOAP request to Master Auto Glass API...");
    console.log("URL: https://www.master-auto-glass.co.uk/pdaservice.asmx");
    console.log("SOAPAction: https://www.master-auto-glass.co.uk/pdaservice.asmx/checkAvailability");
    
    const response = await axios({
      method: 'post',
      url: 'https://www.master-auto-glass.co.uk/pdaservice.asmx',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/checkAvailability'
      },
      data: soapEnvelope
    });

    console.log('Response status:', response.status);
    
    // Parse the XML response
    try {
      const result = await parseStringPromise(response.data, {
        explicitArray: false,
        normalizeTags: true
      });
      
      console.log('Parsed XML result:');
      console.log(JSON.stringify(result, null, 2));
      
      // Navigate through the SOAP response structure to get the checkAvailabilityResult
      // The exact path will depend on how xml2js parses the response
      // This is an example navigation, you might need to adjust based on actual response
      const soapBody = result['soap:envelope']['soap:body'];
      const checkAvailabilityResponse = soapBody.checkavailabilityresponse;
      
      if (checkAvailabilityResponse) {
        const availability = checkAvailabilityResponse.checkavailabilityresult;
        console.log('Availability check result:', availability === 'true' ? 'AVAILABLE' : 'NOT AVAILABLE');
        
        // Get customer product ID if present
        if (checkAvailabilityResponse.customerproductid) {
          console.log('Customer Product ID:', checkAvailabilityResponse.customerproductid);
        }
        
        // Get call result details
        if (checkAvailabilityResponse.callresult) {
          const callResult = checkAvailabilityResponse.callresult;
          console.log('Status:', callResult.status);
          
          if (callResult.errormessage && callResult.errormessage.trim() !== '') {
            console.log('Error message:', callResult.errormessage);
          }
        }
      } else {
        console.log('Could not find checkAvailabilityResponse in the parsed XML');
      }
      
    } catch (parseError) {
      console.error('Error parsing XML response:', parseError);
      console.log('Raw XML response:');
      console.log(response.data);
    }
    
  } catch (error) {
    console.error('Error making SOAP request:');
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Run the test
console.log("Starting Master Auto Glass API Test...");
testMasterGlassAPI().then(() => {
  console.log("Test completed");
}).catch(error => {
  console.error("Test failed with error:", error);
});
