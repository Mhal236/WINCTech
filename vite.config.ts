import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Import type for the Vite server
import type { ViteDevServer } from 'vite';

// Check if this is a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Debug environment variables
  console.log('Environment variables loaded by Vite:');
  console.log('VITE_VEHICLE_API_URL:', env.VITE_VEHICLE_API_URL || 'not defined');
  console.log('VEHICLE_API_KEY:', env.VEHICLE_API_KEY ? '[hidden for security]' : 'not defined');

  return {
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    },
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API calls to the API server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      },
    },
    plugins: [
      react(),
      // Removed Vite API plugin since we're using standalone API server with proxy
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
