#!/bin/bash

# Define terminal colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting development environment...${NC}"

# Check if necessary files exist
if [ ! -f "src/lib/api-routes.js" ]; then
  echo -e "${BLUE}Error: src/lib/api-routes.js not found. Please make sure it exists.${NC}"
  exit 1
fi

echo -e "${GREEN}Starting integrated server (API + frontend)...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Run the integrated server
npm run dev 