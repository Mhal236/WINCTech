/**
 * Simple HelloWorld Test for SOAP API
 * 
 * This endpoint tests the connection to the Master Auto Glass API
 * using multiple approaches to find one that works.
 */

export async function GET(request: Request) {
  try {
    console.log("Testing HelloWorld with multiple approaches");
    
    // Store results of multiple approaches
    const testResults = [];
    
    // APPROACH 1: Simple direct call with minimal parameters
    try {
      console.log("Approach 1: Simple direct call");
      const response1 = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "" // Empty body is fine for HelloWorld
      });
      
      const text1 = await response1.text();
      testResults.push({
        approach: "Direct simple call",
        status: response1.status,
        success: response1.ok,
        response: text1.substring(0, 150),
        isXml: text1.includes('<?xml') || text1.includes('<string>'),
        isHtml: text1.includes('<!DOCTYPE') || text1.includes('<html')
      });
    } catch (error1) {
      testResults.push({
        approach: "Direct simple call",
        success: false,
        error: error1 instanceof Error ? error1.message : String(error1)
      });
    }
    
    // APPROACH 2: Standard SOAP envelope
    try {
      console.log("Approach 2: Standard SOAP envelope");
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
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
        body: soapEnvelope
      });
      
      const text2 = await response2.text();
      testResults.push({
        approach: "SOAP envelope",
        status: response2.status,
        success: response2.ok,
        response: text2.substring(0, 150),
        isXml: text2.includes('<?xml') || text2.includes('<soap:'),
        isHtml: text2.includes('<!DOCTYPE') || text2.includes('<html')
      });
    } catch (error2) {
      testResults.push({
        approach: "SOAP envelope",
        success: false,
        error: error2 instanceof Error ? error2.message : String(error2)
      });
    }

    // APPROACH 3: Minimal JSON request to test API health
    try {
      console.log("Approach 3: JSON request");
      const response3 = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      
      const text3 = await response3.text();
      testResults.push({
        approach: "JSON request",
        status: response3.status,
        success: response3.ok,
        response: text3.substring(0, 150),
        isXml: text3.includes('<?xml') || text3.includes('<string>'),
        isHtml: text3.includes('<!DOCTYPE') || text3.includes('<html')
      });
    } catch (error3) {
      testResults.push({
        approach: "JSON request",
        success: false,
        error: error3 instanceof Error ? error3.message : String(error3)
      });
    }
    
    // Determine if any approach was successful
    const anySuccess = testResults.some(result => result.success);
    
    // Log complete results for debugging
    console.log("All test results:", JSON.stringify(testResults, null, 2));
    
    // Return all results to the client with proper JSON formatting
    return new Response(
      JSON.stringify({
        success: anySuccess,
        message: anySuccess 
          ? "Successfully connected to API with at least one method" 
          : "All connection methods failed",
        testResults,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error("Server-side test completely failed:", error);
    
    // Return detailed error information in a properly formatted JSON response
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 