/**
 * Direct Test for Master Auto Glass API
 * 
 * This uses a very direct approach with minimal dependencies.
 */

export async function GET(request: Request) {
  try {
    // Function to format XML for display
    const formatXml = (xml: string) => {
      return xml.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    
    // Create results array to store all test outcomes
    const testResults = [];
    
    // TEST 1: Pure fetch with minimal options
    try {
      console.log("TEST 1: Pure fetch with minimal options");
      const response1 = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      
      const text1 = await response1.text();
      testResults.push({
        name: "Basic fetch",
        status: response1.status,
        success: response1.ok,
        responsePreview: text1.substring(0, 100)
      });
    } catch (error1) {
      testResults.push({
        name: "Basic fetch",
        success: false,
        error: error1 instanceof Error ? error1.message : String(error1)
      });
    }
    
    // TEST 2: Full SOAP envelope
    try {
      console.log("TEST 2: Full SOAP envelope");
      const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;
      
      const response2 = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx", {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld"
        },
        body: envelope
      });
      
      const text2 = await response2.text();
      testResults.push({
        name: "SOAP envelope",
        status: response2.status,
        success: response2.ok,
        responsePreview: text2.substring(0, 100)
      });
    } catch (error2) {
      testResults.push({
        name: "SOAP envelope",
        success: false,
        error: error2 instanceof Error ? error2.message : String(error2)
      });
    }
    
    // TEST 3: GET request (which shouldn't work, but we'll try)
    try {
      console.log("TEST 3: GET request");
      const response3 = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
        method: "GET"
      });
      
      const text3 = await response3.text();
      testResults.push({
        name: "GET request",
        status: response3.status,
        success: response3.ok,
        responsePreview: text3.substring(0, 100)
      });
    } catch (error3) {
      testResults.push({
        name: "GET request",
        success: false,
        error: error3 instanceof Error ? error3.message : String(error3)
      });
    }
    
    // Generate HTML response showing all the test results
    let htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Direct API Tests</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .test-result { 
      margin-bottom: 20px; 
      padding: 15px; 
      border-radius: 5px; 
      border: 1px solid #ddd; 
    }
    .success { border-left: 5px solid green; }
    .error { border-left: 5px solid red; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .success-badge { 
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      color: white;
      background-color: green;
      font-weight: bold;
    }
    .error-badge { 
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      color: white;
      background-color: red;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Master Auto Glass API - Direct Test Results</h1>
  <p>These tests were run directly from the server at ${new Date().toISOString()}</p>
  
  <div class="results">
`;

    // Add each test result to the HTML
    for (const result of testResults) {
      htmlResponse += `
    <div class="test-result ${result.success ? 'success' : 'error'}">
      <h2>
        ${result.name} 
        <span class="${result.success ? 'success-badge' : 'error-badge'}">
          ${result.success ? 'SUCCESS' : 'FAILED'}
        </span>
      </h2>
      
      ${result.status ? `<p><strong>Status Code:</strong> ${result.status}</p>` : ''}
      
      ${result.error ? `
        <p><strong>Error:</strong> ${result.error}</p>
      ` : ''}
      
      ${result.responsePreview ? `
        <p><strong>Response Preview:</strong></p>
        <pre>${formatXml(result.responsePreview)}</pre>
      ` : ''}
    </div>
      `;
    }
    
    // Close HTML
    htmlResponse += `
  </div>
  
  <div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
    <p><strong>Recommendations:</strong></p>
    <ul>
      <li>If all tests failed with network errors, the API server might be down or not accepting requests from your server.</li>
      <li>If you see HTML responses, the API server might be returning error pages instead of SOAP/XML responses.</li>
      <li>If the SOAP envelope test worked but others failed, make sure to use the SOAP format in your application.</li>
    </ul>
  </div>
</body>
</html>
    `;
    
    return new Response(htmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
  } catch (error) {
    // Return a simple error page
    return new Response(`
      <html><body>
        <h1>Test Failed</h1>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body></html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
} 