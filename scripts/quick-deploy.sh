#!/bin/bash

# Quick deployment script - deploys with single command

set -e

# Quick check for Netlify CLI
if ! command -v netlify >/dev/null 2>&1; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build
echo "Building application..."
npm run build

# Deploy to production
echo "Deploying to production..."
netlify deploy --prod --dir=dist

echo "✅ Deployment complete!"
echo "Site: https://real-estate-dam-1752199834.netlify.app"