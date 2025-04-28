/**
 * Simple Test for Master Auto Glass API
 * 
 * This uses exactly the format specified in the API documentation
 * for the HelloWorld SOAP 1.1 method.
 */

export async function GET(request: Request) {
  try {
    console.log("Running simple HelloWorld test with exact format from docs");
    
    // Create the SOAP envelope using the exact format from the documentation
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="https://www.master-auto-glass.co.uk/pdaservice.asmx" />
  </soap:Body>
</soap:Envelope>`;
    
    console.log("SOAP request prepared, sending to API...");
    
    // Make the request with exact headers as specified
    const response = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld"
      },
      body: soapEnvelope
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get response as text
    const responseText = await response.text();
    console.log(`Response text (first 200 chars): ${responseText.substring(0, 200)}`);
    
    // Create a human-readable HTML response showing all details
    const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>API Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Master Auto Glass API Test Results</h1>
  
  <h2>Request</h2>
  <p><strong>URL:</strong> https://www.master-auto-glass.co.uk/pdaservice.asmx</p>
  <p><strong>Method:</strong> POST</p>
  <p><strong>Headers:</strong></p>
  <pre>Content-Type: text/xml; charset=utf-8
SOAPAction: "https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld"</pre>
  
  <p><strong>Request Body:</strong></p>
  <pre>${soapEnvelope.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  
  <h2>Response</h2>
  <p><strong>Status:</strong> <span class="${response.ok ? 'success' : 'error'}">${response.status} ${response.statusText}</span></p>
  <p><strong>Response Headers:</strong></p>
  <pre>${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}</pre>
  
  <p><strong>Response Body:</strong></p>
  <pre>${responseText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  
  <div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
    <p>This test was run at: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `;
    
    // Return HTML response for easy debugging
    return new Response(htmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
  } catch (error) {
    // Return error as HTML
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>API Test Error</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .error { color: red; background-color: #fff0f0; padding: 10px; border-radius: 5px; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Test Failed</h1>
  <div class="error">
    <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
    ${error instanceof Error && error.stack ? `<pre>${error.stack}</pre>` : ''}
  </div>
  <p>This test was run at: ${new Date().toISOString()}</p>
</body>
</html>
    `;
    
    return new Response(errorHtml, {
      status: 200, // Return 200 even for errors
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
} 