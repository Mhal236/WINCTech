# API Testing Setup and Usage Guide

This project includes a comprehensive API testing solution to troubleshoot connection issues with external APIs, especially the Glass API.

## Quick Setup

1. Install dependencies:
   ```bash
   ./install-dependencies.sh
   ```

2. Start both servers (in separate terminals):
   ```bash
   # Terminal 1: Start the API server
   npm run api
   
   # Terminal 2: Start the development server
   npm run dev
   ```

3. Open the application in your browser:
   ```
   http://localhost:8080
   ```

## Available Testing Methods

### 1. Direct API Test Button

In the Glass Order Quote page, use the "Test Server API Connection" button to run a quick connectivity test. This will:
- Test basic internet connectivity
- Run a simulated Glass API test
- Display results via toast notifications

### 2. Interactive API Test Page

Click the "Interactive API Test" button to open a detailed test page that provides:
- Visual breakdown of each test
- Error details if tests fail
- Raw JSON response data for debugging

### 3. HelloWorld SOAP API Test (New)

Click the "Test HelloWorld SOAP" button to open a dedicated test page for the Master Auto Glass HelloWorld SOAP API:
- Tests direct connectivity to the SOAP API
- Displays the full XML response
- Shows detailed request/response information
- Helps diagnose SOAP-specific issues

### 4. API Endpoint Testing

You can directly access the test endpoints:

- **API Health Check**: `http://localhost:3000/api/health`
- **Glass API Test**: `http://localhost:3000/api/glass-test`
- **Interactive Test Page**: `http://localhost:3000/api/glass-test-page`
- **HelloWorld SOAP Test**: `http://localhost:3000/api/hello-world-test`
- **HelloWorld SOAP Test Page**: `http://localhost:3000/api/hello-world-page`

## Troubleshooting

If you encounter issues:

1. Make sure both servers are running
2. Check the browser console for error messages
3. Look at the server console output for detailed logs

### Common Issues

- **Missing JSON response**: The API server might not be running
- **CORS errors**: The Vite proxy should handle this, but check if requests are being properly proxied
- **Connection refused**: Verify the ports in `vite.config.ts` match the API server port (default: 3000)
- **SOAP errors**: Check the SOAPAction header and request format in the server logs

## Technical Details

- The API server is an Express.js application that runs on port 3000
- The Vite development server runs on port 8080 and proxies API requests to port 3000
- The `/api/glass-test` endpoint runs multiple connectivity tests and returns detailed results
- The `/api/hello-world-test` endpoint makes a direct SOAP request to the Master Auto Glass API
- The API server logs extensive information during the tests to help diagnose issues 