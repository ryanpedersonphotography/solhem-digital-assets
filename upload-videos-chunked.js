import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_SOURCE_DIR = '/Users/ryanpederson/Dev/Video Files';
const DATA_FILE = path.join(__dirname, 'public', 'property-data.json');
const API_BASE_URL = process.env.UPLOAD_URL || 'https://real-estate-dam-1752199834.netlify.app';
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks (under 6MB limit with overhead)

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

console.log('🎥 Uploading videos to Netlify Blobs (Chunked)...\n');
console.log(`📦 Using chunk size: ${(CHUNK_SIZE / 1024 / 1024).toFixed(1)}MB\n`);

async function uploadVideoChunked(filePath, propertyId, videoType, filename) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    
    // Skip files over 5GB
    if (stats.size > 5 * 1024 * 1024 * 1024) {
      console.log(`  ⚠️  Skipping ${filename} (${fileSizeGB}GB - exceeds 5GB limit)`);
      return null;
    }

    console.log(`  📤 Uploading ${filename} (${fileSizeGB}GB)...`);
    
    const fileBuffer = fs.readFileSync(filePath);
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
    const uploadId = crypto.randomBytes(16).toString('hex');
    
    console.log(`     Splitting into ${totalChunks} chunks...`);
    
    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk, {
        filename: `chunk-${i}`,
        contentType: 'application/octet-stream'
      });
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('uploadId', uploadId);
      formData.append('propertyId', propertyId);
      formData.append('videoType', videoType);
      formData.append('filename', filename);
      
      const response = await fetch(`${API_BASE_URL}/api/video-upload-chunk`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chunk ${i + 1}/${totalChunks} failed: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      process.stdout.write(`\r     Uploaded chunk ${i + 1}/${totalChunks} (${Math.round((i + 1) / totalChunks * 100)}%)`);
      
      if (result.complete) {
        console.log(`\n  ✅ Upload complete! Key: ${result.key}`);
        return result.key;
      }
    }
    
    console.log('');
  } catch (error) {
    console.error(`\n  ❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function processProperty(folderName, propertyId) {
  const property = propertyData.properties.find(p => p.id === propertyId);
  if (!property) {
    console.log(`❌ Property ${propertyId} not found in data`);
    return;
  }

  console.log(`\n📁 Processing ${folderName}...`);
  
  const propertyPath = path.join(VIDEO_SOURCE_DIR, folderName);
  if (!fs.existsSync(propertyPath)) {
    console.log(`  ❌ Folder not found: ${propertyPath}`);
    return;
  }

  const updatedVideos = {
    drone: [...(property.assets.videos?.drone || [])],
    property: [...(property.assets.videos?.property || [])]
  };

  // Process Drone Videos (check both folder names)
  let dronePath = path.join(propertyPath, 'Drone_Videos');
  if (!fs.existsSync(dronePath)) {
    dronePath = path.join(propertyPath, 'Drone');
  }
  if (fs.existsSync(dronePath)) {
    const droneFiles = fs.readdirSync(dronePath)
      .filter(f => /\.(mp4|mov|avi)$/i.test(f));
    
    for (const file of droneFiles) {
      const filePath = path.join(dronePath, file);
      const existingVideo = updatedVideos.drone.find(v => v.filename === file);
      
      if (existingVideo && existingVideo.blobKey) {
        console.log(`  ⏭️  Skipping ${file} (already uploaded)`);
        continue;
      }
      
      const blobKey = await uploadVideoChunked(filePath, propertyId, 'drone', file);
      if (blobKey) {
        if (existingVideo) {
          existingVideo.blobKey = blobKey;
        } else {
          updatedVideos.drone.push({
            filename: file,
            path: `public/assets/${propertyId}/Drone_Videos/${file}`,
            blobKey: blobKey
          });
        }
      }
    }
  }

  // Process Property Videos (check multiple folder names)
  let propertyVideoPath = path.join(propertyPath, 'Property_Videos');
  if (!fs.existsSync(propertyVideoPath)) {
    propertyVideoPath = path.join(propertyPath, 'Property Videos');
  }
  if (!fs.existsSync(propertyVideoPath)) {
    propertyVideoPath = path.join(propertyPath, 'Property');
  }
  if (fs.existsSync(propertyVideoPath)) {
    const propertyFiles = fs.readdirSync(propertyVideoPath)
      .filter(f => /\.(mp4|mov|avi)$/i.test(f));
    
    for (const file of propertyFiles) {
      const filePath = path.join(propertyVideoPath, file);
      const existingVideo = updatedVideos.property.find(v => v.filename === file);
      
      if (existingVideo && existingVideo.blobKey) {
        console.log(`  ⏭️  Skipping ${file} (already uploaded)`);
        continue;
      }
      
      const blobKey = await uploadVideoChunked(filePath, propertyId, 'property', file);
      if (blobKey) {
        if (existingVideo) {
          existingVideo.blobKey = blobKey;
        } else {
          updatedVideos.property.push({
            filename: file,
            path: `public/assets/${propertyId}/Property_Videos/${file}`,
            blobKey: blobKey
          });
        }
      }
    }
  }

  // Update property data
  property.assets.videos = updatedVideos;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const propertyFlag = args.indexOf('--property');
  
  if (propertyFlag !== -1 && args[propertyFlag + 1]) {
    // Upload specific property
    const propertyId = args[propertyFlag + 1];
    const folderName = Object.keys(folderToPropertyMap)
      .find(key => folderToPropertyMap[key] === propertyId);
    
    if (folderName) {
      await processProperty(folderName, propertyId);
    } else {
      console.log(`❌ Property ID ${propertyId} not found in mapping`);
    }
  } else {
    // Upload all properties
    for (const [folderName, propertyId] of Object.entries(folderToPropertyMap)) {
      await processProperty(folderName, propertyId);
    }
  }

  // Save updated property data
  fs.writeFileSync(DATA_FILE, JSON.stringify(propertyData, null, 2));
  console.log('\n✅ Upload complete!');
  console.log('📝 Property data updated with blob keys');
}

main().catch(console.error);