/**
 * Simple Master Auto Glass API Test - GetMakes operation
 */

const axios = require('axios');

// Credentials
const credentials = {
  login: 'Q-100',
  password: 'b048c57a',
  userId: 1
};

// SOAP request body for GetMakes
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
    <GetMakes xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx">
      <callResult>
        <Status>None</Status>
        <ErrorMessage></ErrorMessage>
      </callResult>
    </GetMakes>
  </soap:Body>
</soap:Envelope>
`;

// Make the API request
async function testAPI() {
  try {
    console.log('Testing Master Auto Glass API - GetMakes');
    
    const response = await axios({
      method: 'post',
      url: 'https://www.master-auto-glass.co.uk/pdaservice.asmx',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://www.master-auto-glass.co.uk/pdaservice.asmx/GetMakes'
      },
      data: soapEnvelope
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error making request:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Run the test
console.log('Starting test...');
testAPI().then(() => {
  console.log('Test completed');
}); 