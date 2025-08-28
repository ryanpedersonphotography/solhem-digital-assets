import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'https://real-estate-dam-1752199834.netlify.app';

async function testUpload() {
  console.log('Testing video upload to production...\n');
  
  // Create a tiny test file
  const testContent = Buffer.from('This is a test video file');
  const testFile = '/tmp/test-video.mp4';
  fs.writeFileSync(testFile, testContent);
  
  try {
    const formData = new FormData();
    formData.append('video', fs.createReadStream(testFile), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    });
    formData.append('propertyId', 'test-property');
    formData.append('videoType', 'test');
    formData.append('filename', 'test-video.mp4');
    
    console.log('Sending request to:', `${API_URL}/api/video-handler/upload`);
    console.log('Form data fields:', {
      propertyId: 'test-property',
      videoType: 'test',
      filename: 'test-video.mp4'
    });
    
    const response = await fetch(`${API_URL}/api/video-handler/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ Test upload successful!');
    } else {
      console.log('\n❌ Test upload failed');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    fs.unlinkSync(testFile);
  }
}

testUpload();