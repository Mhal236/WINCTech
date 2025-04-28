/**
 * Glass API Proxy
 * 
 * This proxy handles SOAP requests to the Master Auto Glass API to avoid CORS issues in production.
 * It passes the requests through to the external API and returns the responses.
 */

export async function POST(request: Request) {
  try {
    // Get the request body (SOAP XML)
    const body = await request.text();
    
    // Extract SOAPAction from headers
    const soapAction = request.headers.get('SOAPAction');
    if (!soapAction) {
      return new Response(JSON.stringify({ error: 'Missing SOAPAction header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Glass API proxy handling request for: ${soapAction}`);
    
    // Forward the request to the Master Auto Glass API
    const response = await fetch('https://www.master-auto-glass.co.uk/pdaservice.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction,
      },
      body: body,
    });
    
    // Get the response text
    const responseText = await response.text();
    
    // Return the response with appropriate headers
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });
    
  } catch (error) {
    console.error('Glass API proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy request to Master Auto Glass API',
        details: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 