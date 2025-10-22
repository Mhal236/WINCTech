/**
 * Health Check API for Vercel deployment
 * 
 * Simple endpoint to verify the API is running
 * Designed to work as a Vercel serverless function
 */
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running',
    environment: 'vercel'
  });
}

