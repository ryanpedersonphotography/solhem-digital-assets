import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const { url, method } = req;
  const urlParams = new URL(url);
  const pathname = urlParams.pathname;

  // Only handle POST requests
  if (!pathname.endsWith('/video-upload-chunk') || method !== 'POST') {
    return new Response('Not found', { status: 404 });
  }

  try {
    const formData = await req.formData();
    const chunk = formData.get('chunk');
    const chunkIndex = formData.get('chunkIndex');
    const totalChunks = formData.get('totalChunks');
    const uploadId = formData.get('uploadId');
    const propertyId = formData.get('propertyId');
    const videoType = formData.get('videoType');
    const filename = formData.get('filename');

    if (!chunk || chunkIndex === null || !totalChunks || !uploadId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize the chunk store
    const chunkStore = getStore('video-chunks');
    
    // Store the chunk
    const chunkKey = `${uploadId}/chunk-${chunkIndex}`;
    const arrayBuffer = await chunk.arrayBuffer();
    
    await chunkStore.set(chunkKey, arrayBuffer, {
      metadata: {
        uploadId,
        chunkIndex: parseInt(chunkIndex),
        totalChunks: parseInt(totalChunks),
        propertyId,
        videoType,
        filename
      }
    });

    // Check if all chunks have been uploaded
    const currentChunkIndex = parseInt(chunkIndex);
    const expectedTotalChunks = parseInt(totalChunks);
    
    if (currentChunkIndex === expectedTotalChunks - 1) {
      // This is the last chunk, combine all chunks
      const videoStore = getStore('property-videos');
      const chunks = [];
      
      // Retrieve all chunks
      for (let i = 0; i < expectedTotalChunks; i++) {
        const chunkData = await chunkStore.get(`${uploadId}/chunk-${i}`);
        if (!chunkData) {
          throw new Error(`Missing chunk ${i}`);
        }
        chunks.push(chunkData);
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combinedBuffer.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      
      // Store the complete video
      const videoKey = `${propertyId}/${videoType}/${filename}`;
      await videoStore.set(videoKey, combinedBuffer.buffer, {
        metadata: {
          propertyId,
          videoType,
          filename,
          size: totalLength,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Clean up chunks
      for (let i = 0; i < expectedTotalChunks; i++) {
        await chunkStore.delete(`${uploadId}/chunk-${i}`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        complete: true,
        key: videoKey,
        message: 'Video upload complete'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // More chunks to come
      return new Response(JSON.stringify({
        success: true,
        complete: false,
        message: `Chunk ${currentChunkIndex + 1}/${expectedTotalChunks} uploaded`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Chunk upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};