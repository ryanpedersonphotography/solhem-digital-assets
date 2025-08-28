#!/bin/bash

# Environment Setup Script for Digital Asset Manager

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Digital Asset Manager - Environment Setup${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    # Copy from example
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
fi

# Get Netlify site info
echo -e "\n${YELLOW}📋 Getting Netlify site information...${NC}"

if command -v netlify >/dev/null 2>&1; then
    # Try to get site ID from Netlify CLI
    SITE_ID=$(netlify api listSites --json 2>/dev/null | jq -r '.[] | select(.name == "real-estate-dam-1752199834") | .id' || echo "")
    
    if [ -n "$SITE_ID" ]; then
        echo -e "${GREEN}✓ Found Netlify site ID: $SITE_ID${NC}"
        sed -i.bak "s/NETLIFY_SITE_ID=.*/NETLIFY_SITE_ID=$SITE_ID/" .env
    else
        echo -e "${YELLOW}Could not auto-detect Netlify site ID${NC}"
    fi
fi

# Interactive setup
echo -e "\n${YELLOW}Please provide the following information:${NC}"

# Netlify Auth Token
if grep -q "NETLIFY_AUTH_TOKEN=your_netlify_auth_token_here" .env; then
    echo -e "\n${BLUE}Netlify Personal Access Token${NC}"
    echo "Get it from: https://app.netlify.com/user/applications#personal-access-tokens"
    read -p "Enter token (or press Enter to skip): " NETLIFY_TOKEN
    if [ -n "$NETLIFY_TOKEN" ]; then
        sed -i.bak "s/NETLIFY_AUTH_TOKEN=.*/NETLIFY_AUTH_TOKEN=$NETLIFY_TOKEN/" .env
        echo -e "${GREEN}✓ Updated Netlify auth token${NC}"
    fi
fi

# Site ID if not found
if grep -q "NETLIFY_SITE_ID=your_netlify_site_id_here" .env; then
    echo -e "\n${BLUE}Netlify Site ID${NC}"
    echo "Find it in Netlify dashboard > Site settings > General > Site details"
    read -p "Enter Site ID (or press Enter to skip): " SITE_ID_INPUT
    if [ -n "$SITE_ID_INPUT" ]; then
        sed -i.bak "s/NETLIFY_SITE_ID=.*/NETLIFY_SITE_ID=$SITE_ID_INPUT/" .env
        echo -e "${GREEN}✓ Updated Netlify site ID${NC}"
    fi
fi

# Remove backup files
rm -f .env.bak

# Create secrets file for GitHub Actions
echo -e "\n${YELLOW}📝 Creating GitHub Actions secrets template...${NC}"

cat > github-secrets.txt << 'EOF'
# GitHub Actions Secrets Configuration
# Add these secrets to your repository:
# Settings > Secrets and variables > Actions > New repository secret

NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=

# To add via GitHub CLI:
# gh secret set NETLIFY_AUTH_TOKEN --body "your_token_here"
# gh secret set NETLIFY_SITE_ID --body "your_site_id_here"
EOF

# Check current .env values
AUTH_TOKEN=$(grep "NETLIFY_AUTH_TOKEN=" .env | cut -d'=' -f2)
SITE_ID=$(grep "NETLIFY_SITE_ID=" .env | cut -d'=' -f2)

if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "your_netlify_auth_token_here" ]; then
    echo "NETLIFY_AUTH_TOKEN=$AUTH_TOKEN" >> github-secrets.txt
fi

if [ -n "$SITE_ID" ] && [ "$SITE_ID" != "your_netlify_site_id_here" ]; then
    echo "NETLIFY_SITE_ID=$SITE_ID" >> github-secrets.txt
fi

echo -e "${GREEN}✓ Created github-secrets.txt${NC}"

# Summary
echo -e "\n${GREEN}✅ Environment setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Review and update ${YELLOW}.env${NC} with any missing values"
echo -e "2. Add secrets from ${YELLOW}github-secrets.txt${NC} to GitHub"
echo -e "3. Run ${YELLOW}./scripts/deploy.sh${NC} to deploy"

# Cleanup
echo -e "\n${YELLOW}Don't forget to:${NC}"
echo -e "- Add ${RED}.env${NC} to .gitignore (already done)"
echo -e "- Delete ${RED}github-secrets.txt${NC} after adding to GitHub"