#!/bin/bash

# Script to switch frontend configuration between local and Tailscale

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [local|tailscale]"
    echo ""
    echo "Options:"
    echo "  local     - Configure for localhost development"
    echo "  tailscale - Configure for Tailscale network access"
    echo ""
    echo "Examples:"
    echo "  $0 local     # Switch to localhost configuration"
    echo "  $0 tailscale # Switch to Tailscale configuration"
}

if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

CONFIG_TYPE="$1"

case $CONFIG_TYPE in
    "local")
        echo -e "${YELLOW}Switching to LOCAL configuration...${NC}"
        
        # Create local configuration
        cat > "$FRONTEND_DIR/.env" << EOF
# Frontend Environment Configuration - Development
VITE_BACKEND_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=Pharmacy Scheduling System
VITE_APP_VERSION=2.0.0
EOF
        
        echo -e "${GREEN}✅ Switched to LOCAL configuration${NC}"
        echo "   Backend URL: http://localhost:3001"
        echo "   Socket URL:  http://localhost:3001"
        ;;
        
    "tailscale")
        echo -e "${YELLOW}Switching to TAILSCALE configuration...${NC}"
        
        # Create Tailscale configuration
        cat > "$FRONTEND_DIR/.env" << EOF
# Frontend Environment Configuration - Tailscale Deployment
VITE_BACKEND_URL=http://100.120.219.68:3001
VITE_SOCKET_URL=http://100.120.219.68:3001
VITE_APP_NAME=Pharmacy Scheduling System
VITE_APP_VERSION=2.0.0
EOF
        
        echo -e "${GREEN}✅ Switched to TAILSCALE configuration${NC}"
        echo "   Backend URL: http://100.120.219.68:3001"
        echo "   Socket URL:  http://100.120.219.68:3001"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid configuration type: $CONFIG_TYPE${NC}"
        print_usage
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart the frontend service: docker compose restart frontend"
echo "2. Wait for the build to complete (~30 seconds)"
echo "3. Access the application at the appropriate URL"

if [ "$CONFIG_TYPE" = "tailscale" ]; then
    echo ""
    echo -e "${YELLOW}Tailscale Access URLs:${NC}"
    echo "   Frontend: http://100.120.219.68:3000"
    echo "   Backend:  http://100.120.219.68:3001"
fi