#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getPhotoMetadata(filepath) {
  try {
    const { stdout } = await execPromise(`exiftool -DateTimeOriginal -j "${filepath}"`);
    const data = JSON.parse(stdout);
    return data[0]?.DateTimeOriginal || null;
  } catch (error) {
    console.error(`Error reading EXIF for ${filepath}:`, error.message);
    return null;
  }
}

async function processEventPhotos(eventPath) {
  const topDir = path.join(eventPath, 'top');
  const allDir = path.join(eventPath, 'all');
  
  const result = {
    top: [],
    all: []
  };
  
  // Process top photos
  if (fs.existsSync(topDir)) {
    const topFiles = fs.readdirSync(topDir)
      .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
      .sort();
    
    for (const file of topFiles) {
      const filepath = path.join(topDir, file);
      const datetime = await getPhotoMetadata(filepath);
      result.top.push({
        filename: file,
        datetime: datetime,
        timestamp: datetime ? new Date(datetime.replace(/:/g, '-').replace(' ', 'T')).getTime() : 0
      });
    }
    
    // Sort by timestamp
    result.top.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // Process all photos
  if (fs.existsSync(allDir)) {
    const allFiles = fs.readdirSync(allDir)
      .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
      .sort();
    
    console.log(`Processing ${allFiles.length} photos...`);
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      if (i % 50 === 0) {
        console.log(`  Processing photo ${i + 1}/${allFiles.length}...`);
      }
      
      const filepath = path.join(allDir, file);
      const datetime = await getPhotoMetadata(filepath);
      result.all.push({
        filename: file,
        datetime: datetime,
        timestamp: datetime ? new Date(datetime.replace(/:/g, '-').replace(' ', 'T')).getTime() : 0
      });
    }
    
    // Sort by timestamp
    result.all.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  return result;
}

async function main() {
  const assetsDir = path.join(__dirname, '..', 'public', 'assets', 'parties', '2025', 'the-fred');
  
  console.log('Extracting photo metadata and sorting by capture time...');
  const metadata = await processEventPhotos(assetsDir);
  
  // Save metadata
  const outputPath = path.join(__dirname, '..', 'public', 'photo-metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  
  console.log(`\nMetadata extracted and saved to ${outputPath}`);
  console.log(`Top photos: ${metadata.top.length} (sorted by time)`);
  console.log(`All photos: ${metadata.all.length} (sorted by time)`);
  
  // Show time range
  if (metadata.all.length > 0) {
    const firstPhoto = metadata.all[0];
    const lastPhoto = metadata.all[metadata.all.length - 1];
    console.log(`\nTime range: ${firstPhoto.datetime} to ${lastPhoto.datetime}`);
  }
}

main().catch(console.error);