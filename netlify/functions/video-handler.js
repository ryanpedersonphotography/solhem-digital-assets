import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const { url, method } = req;
  const urlParams = new URL(url);
  const pathname = urlParams.pathname;

  // Initialize the video store
  const videoStore = getStore('property-videos');

  // Handle different routes
  if (pathname.endsWith('/video-handler/upload') && method === 'POST') {
    // Upload video
    try {
      const formData = await req.formData();
      const file = formData.get('video');
      const propertyId = formData.get('propertyId');
      const videoType = formData.get('videoType');
      const filename = formData.get('filename');
      
      if (!file || !propertyId || !videoType || !filename) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create a unique key for the video
      const key = `${propertyId}/${videoType}/${filename}`;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Store in Netlify Blobs
      await videoStore.set(key, arrayBuffer, {
        metadata: {
          propertyId,
          videoType,
          filename,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        key,
        message: 'Video uploaded successfully' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (pathname.endsWith('/video-handler/stream') && method === 'GET') {
    // Stream video
    try {
      const key = urlParams.searchParams.get('key');
      
      if (!key) {
        return new Response('Missing video key', { status: 400 });
      }

      // Get video from blob store
      const { data, metadata } = await videoStore.getWithMetadata(key);
      
      if (!data) {
        return new Response('Video not found', { status: 404 });
      }

      // Support range requests for video seeking
      const range = req.headers.get('range');
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : data.byteLength - 1;
        const chunksize = (end - start) + 1;
        
        const slice = data.slice(start, end + 1);
        
        return new Response(slice, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${data.byteLength}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
      
      // Return full video
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': data.byteLength,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (error) {
      console.error('Stream error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (pathname.endsWith('/video-handler/download') && method === 'GET') {
    // Download video
    try {
      const key = urlParams.searchParams.get('key');
      
      if (!key) {
        return new Response('Missing video key', { status: 400 });
      }

      const { data, metadata } = await videoStore.getWithMetadata(key);
      
      if (!data) {
        return new Response('Video not found', { status: 404 });
      }

      const filename = metadata?.filename || 'video.mp4';
      
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': data.byteLength
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (pathname.endsWith('/video-handler/list') && method === 'GET') {
    // List videos for a property
    try {
      const propertyId = urlParams.searchParams.get('propertyId');
      
      if (!propertyId) {
        return new Response('Missing propertyId', { status: 400 });
      }

      // List all blobs with prefix
      const { blobs } = await videoStore.list({ prefix: `${propertyId}/` });
      
      const videos = [];
      for (const blob of blobs) {
        const metadata = await videoStore.getMetadata(blob.key);
        videos.push({
          key: blob.key,
          ...metadata
        });
      }

      return new Response(JSON.stringify({ videos }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('List error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Default response
  return new Response('Not found', { status: 404 });
};

export const config = {
  path: '/api/video-handler/*'
};