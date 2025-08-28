import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source path
const VIDEO_SOURCE_DIR = '/Users/ryanpederson/Dev/Video Files';
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

console.log('🎥 Updating video references in property data...\n');

let totalVideos = 0;

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

  let droneCount = 0;
  let propertyCount = 0;

  // Process Drone videos
  const droneDir = path.join(videoSourcePath, 'Drone');
  if (fs.existsSync(droneDir)) {
    const droneVideos = fs.readdirSync(droneDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file))
      .sort();
    
    property.assets.videos.drone = droneVideos.map(video => ({
      filename: video,
      path: path.join(videoSourcePath, 'Drone', video),
      type: 'drone'
    }));
    
    droneCount = droneVideos.length;
  }

  // Process Property videos
  const propertyDir = path.join(videoSourcePath, 'Property');
  if (fs.existsSync(propertyDir)) {
    const propertyVideos = fs.readdirSync(propertyDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file))
      .sort();
    
    property.assets.videos.property = propertyVideos.map(video => ({
      filename: video,
      path: path.join(videoSourcePath, 'Property', video),
      type: 'property'
    }));
    
    propertyCount = propertyVideos.length;
  }

  // Handle root-level videos (like 8409-8421 Center Drive)
  const rootVideos = fs.readdirSync(videoSourcePath)
    .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
  
  if (rootVideos.length > 0 && droneCount === 0) {
    property.assets.videos.drone = rootVideos.map(video => ({
      filename: video,
      path: path.join(videoSourcePath, video),
      type: 'drone'
    }));
    droneCount = rootVideos.length;
  }

  console.log(`  ✅ Added ${droneCount} drone videos, ${propertyCount} property videos`);
  totalVideos += droneCount + propertyCount;
});

// Save updated property data
fs.writeFileSync(DATA_FILE, JSON.stringify(propertyData, null, 2));
console.log(`\n✅ Video references updated! Total videos: ${totalVideos}`);
console.log('📝 Videos will be loaded on-demand using blob URLs.');