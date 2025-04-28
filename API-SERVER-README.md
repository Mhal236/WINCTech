# API Server Setup for Vite Development

This setup allows you to run a dedicated Next.js API server alongside your Vite development server, solving CORS and proxy issues.

## Setup Instructions

1. Make sure both files are in your project root:
   - `api-server.js` - The Next.js API server implementation
   - `setup-api-server.sh` - Setup script to install dependencies

2. Run the setup script:
   ```bash
   chmod +x setup-api-server.sh
   ./setup-api-server.sh
   ```

3. Start both servers:
   - In terminal 1: `npm run api` (Starts the API server on port 3000)
   - In terminal 2: `npm run dev` (Starts the Vite development server)

4. Your Vite app will now proxy API requests to the dedicated Next.js API server.

## How It Works

- The API server runs Next.js in development mode, specifically handling `/api/*` routes
- The Vite server proxies API requests to the Next.js server
- This setup avoids CORS issues and ensures proper handling of API requests

## Troubleshooting

- If you see `ECONNREFUSED` errors, make sure both servers are running
- Check that the ports in `vite.config.ts` match the API server port (default: 3000)
- Ensure your API requests are going to `/api/*` routes

## Additional Configuration

You can modify the API server port by setting the `PORT` environment variable:

```bash
PORT=3001 npm run api
```

Remember to update the proxy target in `vite.config.ts` to match the port. 