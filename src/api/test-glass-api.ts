/**
 * Test Glass API Connection Endpoint
 * 
 * This is a server-side endpoint that tests the connection to the Master Auto Glass API
 * without being affected by CORS issues in the browser.
 */

export async function GET(request: Request) {
  try {
    console.log("Server-side API connection test starting");
    
    // Test with a simple HelloWorld API call
    const response = await fetch("https://www.master-auto-glass.co.uk/pdaservice.asmx/HelloWorld", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // Empty body is fine for HelloWorld
      body: ""
    });
    
    console.log(`HelloWorld response status: ${response.status}`);
    
    // Get the response text regardless of status code
    const responseText = await response.text();
    
    // Check if the response is HTML (common error response)
    const isHtml = responseText.trim().startsWith('<!DOCTYPE') || 
                  responseText.trim().startsWith('<html') ||
                  responseText.includes('<body');
    
    // If we received HTML, it's likely an error page
    if (isHtml) {
      // Extract useful information from the HTML if possible
      let errorInfo = "Received HTML error page instead of API response";
      
      // Try to extract title or error message from HTML
      const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        errorInfo = `Error page title: ${titleMatch[1]}`;
      }
      
      console.log("API returned HTML error page:", errorInfo);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "API returned an HTML error page instead of XML/SOAP response",
          details: errorInfo,
          statusCode: response.status
        }),
        {
          status: 200, // Return 200 to client even though the API call failed
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // If the response is not ok but not HTML (could be XML error)
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `API returned error status: ${response.status}`,
          details: responseText.substring(0, 200) // First 200 chars is enough for debugging
        }),
        {
          status: 200, // Return 200 to client even though the API call failed
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if response is valid XML
    const isXml = responseText.trim().startsWith('<?xml') || 
                 responseText.includes('<soap:Envelope') ||
                 responseText.includes('<string');
    
    // Return success message with response details
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to Master Auto Glass API (${isXml ? 'XML response' : 'text response'})`,
        responsePreview: responseText.substring(0, 200),
        responseFormat: isXml ? 'xml' : 'text'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Server-side test failed:", error);
    
    // Return detailed error information
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to connect to Master Auto Glass API",
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 200, // Return 200 even on error to avoid client-side fetch errors
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 