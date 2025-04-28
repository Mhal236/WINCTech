#!/bin/bash

echo "Setting up API server for Vite..."

# Install necessary dependencies
echo "Installing required packages..."
npm install --save express next

# Check if vite.config.ts/js exists
VITE_CONFIG=""
if [ -f "vite.config.ts" ]; then
  VITE_CONFIG="vite.config.ts"
elif [ -f "vite.config.js" ]; then
  VITE_CONFIG="vite.config.js"
else
  echo "Error: Could not find vite.config.ts or vite.config.js"
  exit 1
fi

# Backup the original config
cp "$VITE_CONFIG" "${VITE_CONFIG}.backup"
echo "Created backup of $VITE_CONFIG as ${VITE_CONFIG}.backup"

# Check if the config already has a server section with proxy
if grep -q "server.*proxy" "$VITE_CONFIG"; then
  echo "Vite config already has proxy settings. Please manually check $VITE_CONFIG"
  echo "Ensure your config has proxy settings for /api routes pointing to http://localhost:3000"
else
  # Add proxy configuration to vite.config
  if grep -q "export default defineConfig" "$VITE_CONFIG"; then
    # For TypeScript/JavaScript format
    sed -i '' -e 's/export default defineConfig({/export default defineConfig({\n  server: {\n    proxy: {\n      "\/api": {\n        target: "http:\/\/localhost:3000",\n        changeOrigin: true,\n      }\n    }\n  },/' "$VITE_CONFIG"
    echo "Added proxy configuration to $VITE_CONFIG"
  else
    echo "Could not automatically add proxy settings. Please manually update $VITE_CONFIG"
    echo "Add the following to your defineConfig object:"
    echo ""
    echo "server: {"
    echo "  proxy: {"
    echo "    '/api': {"
    echo "      target: 'http://localhost:3000',"
    echo "      changeOrigin: true,"
    echo "    }"
    echo "  }"
    echo "},"
  fi
fi

# Add scripts to package.json if not already present
if ! grep -q '"api":' package.json; then
  sed -i '' -e 's/"scripts": {/"scripts": {\n    "api": "node api-server.js",/' package.json
  echo "Added 'api' script to package.json"
fi

echo ""
echo "Setup complete! To start your development environment:"
echo "1. In one terminal: npm run api"
echo "2. In another terminal: npm run dev"
echo ""
echo "Your API requests to /api/* will be proxied to the API server." 