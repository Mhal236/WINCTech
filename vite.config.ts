import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Check if this is a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Create a proxy for vehicle data API requests
      '/api/vehicle': {
        target: process.env.VEHICLE_API_URL,
        changeOrigin: true,
        rewrite: (path) => {
          // Extract VRM from the request path
          const vrn = path.split('/').pop();
          // Build the target URL with the environment variables (server-side only)
          return `?v=2&api_nullitems=1&auth_apikey=${process.env.VEHICLE_API_KEY}&key_VRM=${vrn}`;
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
}));
