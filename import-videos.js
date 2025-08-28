import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const VIDEO_SOURCE_DIR = '/Users/ryanpederson/Dev/Video Files';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const DATA_FILE = path.join(__dirname, 'public', 'property-data.json');

// Read current property data
const propertyData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Mapping of video folder names to property IDs
const folderToPropertyMap = {
  '10740 Lyndale Bloomington': '10740-lyndale-ave-s-bloomington',
  '10800 Lyndale Bloomington': '10800-lyndale-ave-s-bloomington',
  '250 St John Street Loretto': '250-st-john-street-loretto',
  '3558 2nd St N Minneapolis': '3558-2nd-st-n-minneapolis',
  '5624 Lincoln Drive Edina': '5624-lincoln-drive-edina',
  '6043 6053 6063 Hudson Rd Woodbury': '6043-hudson-rd-woodbury',
  '7825 Washington Ave': '7825-washington-ave-bloomington',
  '8409-8421 Center Drive Spring Lake Park': '8409-8421-center-drive-spring-lake-park',
  '9220 Bass Lake Rd New Hope': '9220-bass-lake-rd-new-hope',
  '9220 James Ave S Bloomington': '9220-james-ave-s-bloomington'
};

console.log('🎥 Importing videos into asset manager...\n');

// Process each property
Object.entries(folderToPropertyMap).forEach(([folderName, propertyId]) => {
  const property = propertyData.properties.find(p => p.id === propertyId);
  if (!property) {
    console.log(`⚠️  Property not found for ${folderName}`);
    return;
  }

  const videoSourcePath = path.join(VIDEO_SOURCE_DIR, folderName);
  if (!fs.existsSync(videoSourcePath)) {
    console.log(`⚠️  Video folder not found: ${videoSourcePath}`);
    return;
  }

  console.log(`📁 Processing ${property.address}...`);

  // Initialize video assets if not exists
  if (!property.assets.videos) {
    property.assets.videos = {
      drone: [],
      property: []
    };
  }

  // Create destination directory
  const destDir = path.join(ASSETS_DIR, property.folderName);
  
  // Process Drone videos
  const droneDir = path.join(videoSourcePath, 'Drone');
  if (fs.existsSync(droneDir)) {
    const droneVideos = fs.readdirSync(droneDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
    
    if (droneVideos.length > 0) {
      const destDroneDir = path.join(destDir, 'Drone_Videos');
      if (!fs.existsSync(destDroneDir)) {
        fs.mkdirSync(destDroneDir, { recursive: true });
      }

      droneVideos.forEach(video => {
        const sourcePath = path.join(droneDir, video);
        const destPath = path.join(destDroneDir, video.toLowerCase());
        
        // Copy file if it doesn't exist
        if (!fs.existsSync(destPath)) {
          console.log(`  📹 Copying drone video: ${video}`);
          fs.copyFileSync(sourcePath, destPath);
        }
        
        // Add to property data
        const assetPath = `Drone_Videos/${video.toLowerCase()}`;
        if (!property.assets.videos.drone.includes(assetPath)) {
          property.assets.videos.drone.push(assetPath);
        }
      });
    }
  }

  // Process Property videos
  const propertyDir = path.join(videoSourcePath, 'Property');
  if (fs.existsSync(propertyDir)) {
    const propertyVideos = fs.readdirSync(propertyDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
    
    if (propertyVideos.length > 0) {
      const destPropertyDir = path.join(destDir, 'Property_Videos');
      if (!fs.existsSync(destPropertyDir)) {
        fs.mkdirSync(destPropertyDir, { recursive: true });
      }

      propertyVideos.forEach(video => {
        const sourcePath = path.join(propertyDir, video);
        const destPath = path.join(destPropertyDir, video.toLowerCase());
        
        // Copy file if it doesn't exist
        if (!fs.existsSync(destPath)) {
          console.log(`  🎬 Copying property video: ${video}`);
          fs.copyFileSync(sourcePath, destPath);
        }
        
        // Add to property data
        const assetPath = `Property_Videos/${video.toLowerCase()}`;
        if (!property.assets.videos.property.includes(assetPath)) {
          property.assets.videos.property.push(assetPath);
        }
      });
    }
  }

  // Handle root-level videos (like 8409-8421 Center Drive)
  const rootVideos = fs.readdirSync(videoSourcePath)
    .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
  
  if (rootVideos.length > 0) {
    const destDroneDir = path.join(destDir, 'Drone_Videos');
    if (!fs.existsSync(destDroneDir)) {
      fs.mkdirSync(destDroneDir, { recursive: true });
    }

    rootVideos.forEach(video => {
      const sourcePath = path.join(videoSourcePath, video);
      const destPath = path.join(destDroneDir, video.toLowerCase());
      
      if (!fs.existsSync(destPath)) {
        console.log(`  📹 Copying video: ${video}`);
        fs.copyFileSync(sourcePath, destPath);
      }
      
      const assetPath = `Drone_Videos/${video.toLowerCase()}`;
      if (!property.assets.videos.drone.includes(assetPath)) {
        property.assets.videos.drone.push(assetPath);
      }
    });
  }

  console.log(`  ✅ Added ${property.assets.videos.drone.length} drone videos, ${property.assets.videos.property.length} property videos\n`);
});

// Save updated property data
fs.writeFileSync(DATA_FILE, JSON.stringify(propertyData, null, 2));
console.log('✅ Video import complete! Updated property-data.json');
console.log('\n⚠️  Note: Video files are large. Consider using a CDN or blob storage for production.');