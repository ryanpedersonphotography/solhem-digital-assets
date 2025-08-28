# Digital Asset Manager

A comprehensive web application for managing real estate property assets including photos, videos, floor plans, and documents.

🔗 **Live Site**: https://real-estate-dam-1752199834.netlify.app

## Features

- 📸 **Photo Management**: Browse and download property photos
- 🎥 **Video Streaming**: Stream drone and property videos via Netlify Blobs
- 📐 **Floor Plans**: View and download floor plans
- 📄 **Documents**: Access property brochures and documents
- 🏢 **Property Filtering**: Filter by status, price, size, and features
- 📦 **Bulk Downloads**: Download all assets for a property in one click
- 📤 **Video Upload**: Upload videos directly to cloud storage

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Deploy to production
./scripts/quick-deploy.sh
```

## Deployment

### Automated Deployment

```bash
# First time setup
./scripts/setup-env.sh

# Deploy to production
./scripts/deploy.sh production

# Deploy preview
./scripts/deploy.sh preview
```

### Manual Deployment

```bash
npm run build
netlify deploy --prod
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Video Management

### Upload Videos

```bash
# Upload all videos (from /Users/ryanpederson/Dev/Video Files)
node upload-videos-to-blobs.js

# Upload specific property
node upload-videos-to-blobs.js --property 5624-lincoln-drive-edina
```

### Manual Upload

Each property page has a video uploader for adding new videos.

## Project Structure

```
dam-app/
├── src/
│   ├── components/       # React components
│   ├── styles/          # CSS files
│   └── utils/           # Utility functions
├── public/
│   ├── assets/          # Property assets
│   └── property-data.json # Property database
├── netlify/
│   └── functions/       # Serverless functions
├── scripts/             # Deployment & utility scripts
└── docs/               # Documentation
```

## Technology Stack

- **Frontend**: React + Vite
- **Styling**: CSS Modules
- **Hosting**: Netlify
- **Video Storage**: Netlify Blobs
- **CI/CD**: GitHub Actions

## Environment Variables

See `.env.example` for required environment variables:
- `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
- `NETLIFY_SITE_ID`: Your Netlify site ID

## Development

```bash
# Run local development with Netlify functions
netlify dev

# Run tests
npm test

# Build for production
npm run build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. GitHub Actions will create a preview deployment

## License

Private project - All rights reserved