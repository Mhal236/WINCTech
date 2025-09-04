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
        // Note: We've removed all specific API proxies as they're now handled by our middleware
      },
    },
    plugins: [
      react(),
      {
        name: 'vite-plugin-api-server',
        configureServer(server: ViteDevServer) {
          // Simple direct import that's guaranteed to work
          import('./src/lib/api-setup.js')
            .then((module: { setupApiMiddleware: (server: ViteDevServer) => void }) => {
              // Call the setup function with the server instance
              module.setupApiMiddleware(server);
            })
            .catch(error => {
              console.error('Failed to set up API middleware:', error);
            });
        }
      } as Plugin,
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
