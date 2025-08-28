# Digital Asset Manager - Deployment Guide

## Quick Deploy

```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy preview
./scripts/deploy.sh preview
```

## First Time Setup

### 1. Configure Environment

```bash
# Set up environment variables
./scripts/setup-env.sh

# This will create .env from .env.example and guide you through configuration
```

### 2. Get Netlify Credentials

1. **Netlify Auth Token**:
   - Go to https://app.netlify.com/user/applications#personal-access-tokens
   - Click "New access token"
   - Give it a name like "DAM Deployment"
   - Copy the token to your .env file

2. **Netlify Site ID**:
   - Go to your site in Netlify dashboard
   - Settings > General > Site details
   - Copy the Site ID
   - Or run: `netlify sites:list` to find it

### 3. Set Up GitHub Actions (Optional)

```bash
# Add secrets to GitHub
gh secret set NETLIFY_AUTH_TOKEN --body "your_token_here"
gh secret set NETLIFY_SITE_ID --body "your_site_id_here"
```

## Deployment Options

### Manual Deployment

```bash
# Full deployment with tests
./scripts/deploy.sh production

# Skip tests for faster deployment
SKIP_TESTS=true ./scripts/deploy.sh production

# Preview deployment
./scripts/deploy.sh preview

# Draft deployment (no public URL)
./scripts/deploy.sh draft
```

### Automated Deployment

Push to main branch triggers automatic production deployment via GitHub Actions.

Pull requests create preview deployments automatically.

### Direct Netlify CLI

```bash
# Build and deploy production
npm run build && netlify deploy --prod

# Deploy without building
netlify deploy --prod --dir=dist

# Create preview
netlify deploy --dir=dist
```

## Video Management

### Upload Videos After Deployment

```bash
# Upload all videos
node upload-videos-to-blobs.js

# Upload specific property videos
node upload-videos-to-blobs.js --property 5624-lincoln-drive-edina

# Check what needs uploading
node audit-assets.js
```

### Video Storage Notes

- Videos are stored in Netlify Blobs (5GB file limit)
- Pricing is currently in beta (free)
- Videos stream directly from Netlify CDN
- Manual upload available on each property page

## Troubleshooting

### Build Failures

```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

### Netlify CLI Issues

```bash
# Reinstall Netlify CLI
npm uninstall -g netlify-cli
npm install -g netlify-cli

# Re-authenticate
netlify login

# Link to site
netlify link
```

### Environment Variables

```bash
# Verify .env file
cat .env | grep NETLIFY

# Test locally with Netlify dev
netlify dev
```

## Production Checklist

- [ ] All tests passing
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] GitHub secrets added (for CI/CD)
- [ ] Videos uploaded to Netlify Blobs
- [ ] Domain configured in Netlify

## Monitoring

### Check Deployment Status

```bash
# View recent deploys
netlify deploys:list

# Check site status
netlify status
```

### View Logs

```bash
# Function logs
netlify functions:log video-handler

# Build logs
netlify build
```

## Rollback

```bash
# List deployments
netlify deploys:list

# Rollback to specific deploy
netlify rollback [deploy-id]
```