# Digital Asset Manager - Deployment Instructions

## Project Overview
This is a React-based digital asset manager for real estate properties. The application displays:
- A map-based property listing
- Individual property pages with suite information
- Suite detail pages with downloadable assets
- High-quality property images (drone, public, and suite-specific)

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

## Manual Deployment to Netlify

### Option 1: Drag & Drop
1. Build the project: `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder to the browser window
4. Your site will be deployed instantly

### Option 2: Using Netlify CLI (Recommended)
1. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod --dir=dist
   ```

### Option 3: GitHub Integration
1. Push this code to a GitHub repository
2. Connect the repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy automatically on every push

## Important Notes
- The `_redirects` file in the public folder ensures client-side routing works properly
- All property assets are in the `public/assets` folder
- Property data is loaded from `property-data.json`
- Images have been renamed with descriptive filenames for better organization

## Features
- Interactive map showing all properties
- Property detail pages with suite listings
- Suite pages with downloadable asset bundles
- Responsive design for mobile and desktop
- Client-side routing with React Router