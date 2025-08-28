import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_SOURCE_DIR = '/Users/ryanpederson/Dev/Video Files';
const DATA_FILE = path.join(__dirname, 'public', 'property-data.json');
const API_BASE_URL = process.env.UPLOAD_URL || 'https://real-estate-dam-1752199834.netlify.app'; // Production URL

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

console.log('🎥 Uploading videos to Netlify Blobs...\n');
console.log('⚠️  Note: This will upload videos one at a time to avoid memory issues.');
console.log('⚠️  Due to the 5GB file limit, some videos may need to be skipped.\n');

async function uploadVideo(filePath, propertyId, videoType, filename) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    
    // Skip files over 5GB
    if (stats.size > 5 * 1024 * 1024 * 1024) {
      console.log(`  ⚠️  Skipping ${filename} (${fileSizeGB}GB - exceeds 5GB limit)`);
      return null;
    }

    console.log(`  📤 Uploading ${filename} (${fileSizeGB}GB)...`);
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(filePath));
    formData.append('propertyId', propertyId);
    formData.append('videoType', videoType);
    formData.append('filename', filename);

    const response = await fetch(`${API_BASE_URL}/api/video-handler/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`  ✅ Uploaded successfully!`);
    return result.key;
  } catch (error) {
    console.error(`  ❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function processProperty(folderName, propertyId) {
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

  console.log(`\n📁 Processing ${property.address}...`);

  // Update video structure to include blob keys
  if (!property.assets.videos) {
    property.assets.videos = { drone: [], property: [] };
  }

  // Process Drone videos
  const droneDir = path.join(videoSourcePath, 'Drone');
  if (fs.existsSync(droneDir)) {
    const droneVideos = fs.readdirSync(droneDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
    
    for (const video of droneVideos) {
      const filePath = path.join(droneDir, video);
      const blobKey = await uploadVideo(filePath, propertyId, 'drone', video);
      
      if (blobKey) {
        // Update or add video entry
        const existingIndex = property.assets.videos.drone.findIndex(v => v.filename === video);
        const videoEntry = {
          filename: video,
          path: path.join(videoSourcePath, 'Drone', video),
          type: 'drone',
          blobKey: blobKey
        };
        
        if (existingIndex >= 0) {
          property.assets.videos.drone[existingIndex] = videoEntry;
        } else {
          property.assets.videos.drone.push(videoEntry);
        }
      }
    }
  }

  // Process Property videos
  const propertyDir = path.join(videoSourcePath, 'Property');
  if (fs.existsSync(propertyDir)) {
    const propertyVideos = fs.readdirSync(propertyDir)
      .filter(file => /\.(mp4|mov|avi|wmv)$/i.test(file));
    
    for (const video of propertyVideos) {
      const filePath = path.join(propertyDir, video);
      const blobKey = await uploadVideo(filePath, propertyId, 'property', video);
      
      if (blobKey) {
        const existingIndex = property.assets.videos.property.findIndex(v => v.filename === video);
        const videoEntry = {
          filename: video,
          path: path.join(videoSourcePath, 'Property', video),
          type: 'property',
          blobKey: blobKey
        };
        
        if (existingIndex >= 0) {
          property.assets.videos.property[existingIndex] = videoEntry;
        } else {
          property.assets.videos.property.push(videoEntry);
        }
      }
    }
  }

  // Save updated property data after each property
  fs.writeFileSync(DATA_FILE, JSON.stringify(propertyData, null, 2));
}

// Process properties one at a time
async function uploadAllVideos() {
  console.log('Starting video upload process...');
  console.log('Make sure Netlify Dev is running: netlify dev\n');
  
  for (const [folderName, propertyId] of Object.entries(folderToPropertyMap)) {
    await processProperty(folderName, propertyId);
  }
  
  console.log('\n✅ Video upload process complete!');
  console.log('📝 Updated property-data.json with blob keys.');
}

// Add command line option to upload specific property
const args = process.argv.slice(2);
if (args[0] === '--property' && args[1]) {
  const propertyId = args[1];
  const folderName = Object.keys(folderToPropertyMap).find(
    key => folderToPropertyMap[key] === propertyId
  );
  
  if (folderName) {
    processProperty(folderName, propertyId).then(() => {
      console.log('\n✅ Upload complete!');
    });
  } else {
    console.log(`Property ID ${propertyId} not found`);
  }
} else {
  // Upload all videos
  uploadAllVideos();
}