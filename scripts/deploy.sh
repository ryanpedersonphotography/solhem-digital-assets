#!/bin/bash

# Digital Asset Manager - Automated Deployment Script
# This script handles building, testing, and deploying the DAM application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_TYPE=${1:-"production"}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}

echo -e "${BLUE}🚀 Digital Asset Manager Deployment Script${NC}"
echo -e "${BLUE}==========================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists netlify; then
    echo -e "${RED}❌ Netlify CLI is not installed${NC}"
    echo -e "${YELLOW}Install with: npm install -g netlify-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "$FORCE_INSTALL" = "true" ]; then
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run tests unless skipped
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "\n${YELLOW}🧪 Running tests...${NC}"
    if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
        npm test -- --passWithNoTests || {
            echo -e "${RED}❌ Tests failed. Fix errors before deploying.${NC}"
            exit 1
        }
    else
        echo -e "${YELLOW}⚠️  No test script found, skipping tests${NC}"
    fi
fi

# Build the application unless skipped
if [ "$SKIP_BUILD" != "true" ]; then
    echo -e "\n${YELLOW}🏗️  Building application...${NC}"
    npm run build || {
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping build (SKIP_BUILD=true)${NC}"
fi

# Deploy based on type
echo -e "\n${YELLOW}🚀 Deploying to ${DEPLOY_TYPE}...${NC}"

case $DEPLOY_TYPE in
    "production" | "prod")
        echo -e "${BLUE}Deploying to production...${NC}"
        netlify deploy --prod --dir=dist || {
            echo -e "${RED}❌ Production deployment failed${NC}"
            exit 1
        }
        ;;
    "preview" | "staging")
        echo -e "${BLUE}Creating preview deployment...${NC}"
        netlify deploy --dir=dist || {
            echo -e "${RED}❌ Preview deployment failed${NC}"
            exit 1
        }
        ;;
    "draft")
        echo -e "${BLUE}Creating draft deployment (no live URL)...${NC}"
        netlify deploy --dir=dist --alias=draft || {
            echo -e "${RED}❌ Draft deployment failed${NC}"
            exit 1
        }
        ;;
    *)
        echo -e "${RED}❌ Unknown deployment type: $DEPLOY_TYPE${NC}"
        echo -e "Usage: $0 [production|preview|draft]"
        exit 1
        ;;
esac

# Get deployment info
echo -e "\n${YELLOW}📊 Getting deployment info...${NC}"
SITE_INFO=$(netlify sites:list --json | jq -r '.[] | select(.name == "real-estate-dam-1752199834") | {url: .url, ssl_url: .ssl_url, admin_url: .admin_url}')

if [ -n "$SITE_INFO" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "\n${BLUE}Site URLs:${NC}"
    echo "$SITE_INFO" | jq -r 'to_entries[] | "  \(.key): \(.value)"'
else
    echo -e "${GREEN}✅ Deployment completed${NC}"
fi

# Optional: Upload videos reminder
if [ "$DEPLOY_TYPE" = "production" ]; then
    echo -e "\n${YELLOW}💡 Remember to upload videos:${NC}"
    echo -e "  Run: ${BLUE}node upload-videos-to-blobs.js${NC}"
    echo -e "  Or use the manual uploader on each property page"
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"