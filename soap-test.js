/**
 * Master Auto Glass API Test
 */

const axios = require('axios');

// Credentials
const credentials = {
  login: 'Q-100',
  password: 'b048c57a',
  userId: 1
};

// Test parameters 
const testParams = {
  argicCode: 'AGC43AGY', // Example part number
  customerProductID: '',
  qty: 1,
  depot: '',
  dateRequired: new Date().toISOString()
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
        <Status>None</Status>
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
async function testAPI() {
  try {
    console.log('Testing Master Auto Glass API with:');
    console.log(`- Product code: ${testParams.argicCode}`);
    
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
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error making SOAP request:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
console.log('Starting API Test...');
testAPI().then(() => {
  console.log('Test completed');
}).catch(err => {
  console.error('Test failed with error:', err);
}); 