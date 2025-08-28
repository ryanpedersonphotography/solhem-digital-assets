import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'public', 'property-data.json');

// Read current property data
const propertyData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

console.log('🔑 Updating video blob keys...\n');

let totalUpdated = 0;

// Update each property
propertyData.properties.forEach(property => {
  if (!property.assets.videos) return;
  
  let propertyUpdated = 0;
  
  // Update drone videos
  if (property.assets.videos.drone) {
    property.assets.videos.drone.forEach(video => {
      if (!video.blobKey && video.filename) {
        video.blobKey = `${property.id}/drone/${video.filename}`;
        propertyUpdated++;
        totalUpdated++;
      }
    });
  }
  
  // Update property videos
  if (property.assets.videos.property) {
    property.assets.videos.property.forEach(video => {
      if (!video.blobKey && video.filename) {
        video.blobKey = `${property.id}/property/${video.filename}`;
        propertyUpdated++;
        totalUpdated++;
      }
    });
  }
  
  if (propertyUpdated > 0) {
    console.log(`✅ ${property.name}: Updated ${propertyUpdated} video keys`);
  }
});

// Save updated data
fs.writeFileSync(DATA_FILE, JSON.stringify(propertyData, null, 2));

console.log(`\n🎉 Total videos updated: ${totalUpdated}`);
console.log('📝 Property data saved successfully!');