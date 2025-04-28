#!/bin/bash

echo "Installing required dependencies for API server..."

# Install axios if not already installed
if ! grep -q '"axios":' package.json; then
  echo "Installing axios package..."
  npm install --save axios
else
  echo "axios already installed."
fi

# Verify express is installed
if ! grep -q '"express":' package.json; then
  echo "Installing express package..."
  npm install --save express
else
  echo "express already installed."
fi

echo "Dependencies installation complete."
echo ""
echo "To start the API server, run: npm run api"
echo "To start the development server, run: npm run dev"
echo "Both servers need to be running for the API tests to work." 