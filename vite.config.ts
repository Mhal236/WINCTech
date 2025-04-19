import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Check if this is a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Debug environment variables
  console.log('Environment variables loaded in Vite config:');
  console.log('VITE_VEHICLE_API_URL:', env.VITE_VEHICLE_API_URL);
  console.log('VITE_VEHICLE_API_KEY:', env.VITE_VEHICLE_API_KEY ? 'Exists (not showing for security)' : 'Missing');

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Create a proxy for vehicle data API requests
        '/api/vehicle': {
          target: env.VITE_VEHICLE_API_URL || 'https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData',
          changeOrigin: true,
          rewrite: (path) => {
            // Extract VRM from the request path
            const vrn = path.split('/').pop();
            // Build the target URL with the environment variables
            const apiKey = env.VITE_VEHICLE_API_KEY || '89feec4c-7f22-43b1-b77a-980aea4ff74e';
            console.log(`Proxying vehicle data request for VRN: ${vrn}`);
            console.log(`Target API URL: ${env.VITE_VEHICLE_API_URL || 'https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData'}`);
            return `?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_VRM=${vrn}`;
          },
          configure: (proxy, options) => {
            // Add debug logging for proxy events
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`Making proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`Received proxy response for ${req.url}: ${proxyRes.statusCode}`);
            });
          }
        },
        
        // Add Glass API proxy endpoints
        '/api/glass': {
          target: 'http://localhost:3000', // This should point to your actual backend server in production
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // In a real implementation, these would call your server-side glass API functions
              console.log(`Proxying glass API request: ${req.method} ${req.url}`);
            });
          },
        },
        
        // Add Supabase API proxy endpoints
        '/api/supabase/auth': {
          target: 'http://localhost:3000', // This should point to your actual backend server in production
          changeOrigin: true,
          configure: (proxy, options) => {
            // Custom proxy handler for auth endpoints
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // In a real implementation, these would call your server-side functions
              if (req.method === 'POST' && req.url?.includes('/login')) {
                // Handle login requests
                console.log('Proxying auth login request to server');
              }
            });
          },
        },
        
        '/api/supabase/data': {
          target: 'http://localhost:3000', // This should point to your actual backend server in production
          changeOrigin: true,
          configure: (proxy, options) => {
            // Custom proxy handler for data endpoints
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // In a real implementation, these would call your server-side functions
              if (req.url?.includes('/tables')) {
                // Handle table data requests
                console.log('Proxying data request to server');
              }
            });
          },
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
