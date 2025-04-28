import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create an HTML response to display the results in the browser
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Glass Order Hub - Direct API Tests</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #135084; }
        h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .pending { color: orange; font-weight: bold; }
        .test-container { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .test-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        button { padding: 8px 15px; background: #135084; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0e3b61; }
      </style>
    </head>
    <body>
      <h1>Direct API Tests</h1>
      <p>This page runs direct tests against the API endpoints without any intermediary handlers.</p>
  `;

  try {
    // Test 1: Basic fetch to the API endpoint without SOAP
    html += `<h2>Test 1: Basic Direct Access to API Endpoint</h2>`;
    
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false // WARNING: This disables SSL verification
      });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      html += `<p>Attempting to access: ${apiUrl || 'API URL not defined in environment variables'}</p>`;
      
      if (!apiUrl) {
        throw new Error('API_URL environment variable is not defined');
      }
      
      const response = await axios.get(apiUrl, { 
        httpsAgent: agent,
        timeout: 10000, // 10 second timeout
        headers: { 
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': 'GlassOrderHub-DirectTest/1.0' 
        }
      });
      
      html += `<div class="test-container">
        <div class="test-header">
          <span class="success">✓ Successfully connected</span>
          <span>Status: ${response.status} ${response.statusText}</span>
        </div>
        <p>Response type: ${response.headers['content-type'] || 'unknown'}</p>
        <p>Response size: ${response.data?.length || 0} characters</p>
        <h3>First 1000 characters of response:</h3>
        <pre>${escapeHtml(response.data?.toString().substring(0, 1000) || '')}</pre>
      </div>`;
    } catch (error: any) {
      html += `<div class="test-container">
        <div class="test-header">
          <span class="error">✗ Connection failed</span>
        </div>
        <p>Error: ${error.message}</p>
        ${error.response ? `<p>Status: ${error.response.status} ${error.response.statusText}</p>` : ''}
        ${error.response?.data ? `<h3>Response data:</h3><pre>${escapeHtml(typeof error.response.data === 'string' ? error.response.data.substring(0, 1000) : JSON.stringify(error.response.data, null, 2).substring(0, 1000))}</pre>` : ''}
      </div>`;
    }
    
    // Test 2: SOAP Request with minimal XML
    html += `<h2>Test 2: Direct SOAP Request with Minimal Envelope</h2>`;
    
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API_URL environment variable is not defined');
      }
      
      // Simple SOAP envelope with HelloWorld method
      const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
          <soapenv:Header/>
          <soapenv:Body>
            <tem:HelloWorld/>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
      
      const response = await axios.post(apiUrl, soapEnvelope, {
        httpsAgent: agent,
        timeout: 10000,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/HelloWorld',
          'User-Agent': 'GlassOrderHub-DirectTest/1.0'
        }
      });
      
      html += `<div class="test-container">
        <div class="test-header">
          <span class="success">✓ SOAP request succeeded</span>
          <span>Status: ${response.status} ${response.statusText}</span>
        </div>
        <p>Response type: ${response.headers['content-type'] || 'unknown'}</p>
        <h3>Request:</h3>
        <pre>${escapeHtml(soapEnvelope)}</pre>
        <h3>Response:</h3>
        <pre>${escapeHtml(response.data?.toString() || '')}</pre>
      </div>`;
    } catch (error: any) {
      html += `<div class="test-container">
        <div class="test-header">
          <span class="error">✗ SOAP request failed</span>
        </div>
        <p>Error: ${error.message}</p>
        ${error.response ? `<p>Status: ${error.response.status} ${error.response.statusText}</p>` : ''}
        ${error.response?.data ? `<h3>Response data:</h3><pre>${escapeHtml(typeof error.response.data === 'string' ? error.response.data.substring(0, 1000) : JSON.stringify(error.response.data, null, 2).substring(0, 1000))}</pre>` : ''}
      </div>`;
    }
    
    // Test 3: Attempt to parse response as XML
    html += `<h2>Test 3: Headers and HTTP Details Test</h2>`;
    
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API_URL environment variable is not defined');
      }
      
      // Empty request - just checking what headers come back
      const response = await axios.get(apiUrl, {
        httpsAgent: agent,
        timeout: 10000,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'GlassOrderHub-DirectTest/1.0'
        }
      });
      
      html += `<div class="test-container">
        <div class="test-header">
          <span class="success">✓ HTTP details request succeeded</span>
          <span>Status: ${response.status} ${response.statusText}</span>
        </div>
        <h3>Response Headers:</h3>
        <pre>${escapeHtml(JSON.stringify(response.headers, null, 2))}</pre>
        <h3>First 500 characters of response:</h3>
        <pre>${escapeHtml(response.data?.toString().substring(0, 500) || '')}</pre>
      </div>`;
    } catch (error: any) {
      html += `<div class="test-container">
        <div class="test-header">
          <span class="error">✗ HTTP details request failed</span>
        </div>
        <p>Error: ${error.message}</p>
        ${error.response ? `<p>Status: ${error.response.status} ${error.response.statusText}</p>` : ''}
        ${error.response?.headers ? `<h3>Response Headers:</h3><pre>${escapeHtml(JSON.stringify(error.response.headers, null, 2))}</pre>` : ''}
      </div>`;
    }

    // Complete the HTML
    html += `
      <h2>Summary</h2>
      <p>These tests can help identify where the connection issue might be occurring.</p>
      <p>API URL: ${process.env.NEXT_PUBLIC_API_URL || 'Not defined'}</p>
      <p>Environment: ${process.env.NODE_ENV || 'unknown'}</p>
      <p>Test completed at: ${new Date().toISOString()}</p>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error: any) {
    const errorHtml = `
      <h2 class="error">Unexpected Error</h2>
      <p>${error.message}</p>
      </body></html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(html + errorHtml);
  }
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
} 