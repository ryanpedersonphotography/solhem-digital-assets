import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const VIDEO_BASE_PATH = '/Users/ryanpederson/Dev/Video Files';

// Enable CORS for your Netlify app
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://real-estate-dam-1752199834.netlify.app'
  ]
}));

// Serve video files
app.get('/api/video', (req, res) => {
  const videoPath = req.query.path;
  
  if (!videoPath || !videoPath.startsWith(VIDEO_BASE_PATH)) {
    return res.status(400).json({ error: 'Invalid video path' });
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Support for video seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Download endpoint
app.get('/api/video/download', (req, res) => {
  const videoPath = req.query.path;
  
  if (!videoPath || !videoPath.startsWith(VIDEO_BASE_PATH)) {
    return res.status(400).json({ error: 'Invalid video path' });
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const filename = path.basename(videoPath);
  res.download(videoPath, filename);
});

// List videos for a property
app.get('/api/videos/:propertyId', (req, res) => {
  // This would need to be implemented based on your property mapping
  res.json({ message: 'Video list endpoint' });
});

app.listen(PORT, () => {
  console.log(`🎬 Video server running at http://localhost:${PORT}`);
  console.log(`📁 Serving videos from: ${VIDEO_BASE_PATH}`);
  console.log('\nTo use with your app:');
  console.log('1. Keep this server running');
  console.log('2. Videos will stream to your Netlify app');
  console.log('3. Download buttons will work');
});