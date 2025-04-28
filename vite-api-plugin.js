import { createApiRouter } from './src/lib/api-routes.js';

/**
 * Vite plugin that integrates the Express API with the Vite dev server
 * @returns {import('vite').Plugin}
 */
export function apiServerPlugin() {
  return {
    name: 'vite-plugin-api-server',
    configureServer(server) {
      // Use middleware before Vite's default middleware
      server.middlewares.use(createApiRouter());
      console.log('API server has been integrated with Vite');
    }
  };
} 