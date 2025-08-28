# Video Upload Guide for Digital Asset Manager

## Overview

Due to Netlify Functions' 6MB request size limit, large video files cannot be uploaded directly through the API. Instead, we recommend the following approaches:

## Option 1: Manual Upload via Browser (Recommended for Small Videos)

For videos under 100MB, use the built-in uploader on each property page:

1. Navigate to the property page
2. Scroll to the Videos section
3. Click "Upload Video" button
4. Select video type (Drone or Property)
5. Choose your video file
6. Click Upload

**Note**: Browser uploads may timeout for very large files.

## Option 2: Direct Netlify Blobs Upload (For Large Videos)

For videos larger than 100MB, use the Netlify CLI directly:

### Setup

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
cd /path/to/dam-app
netlify link
```

### Upload Videos

```bash
# Use the Netlify Blobs CLI to upload videos directly
netlify blobs:set property-videos "propertyId/drone/video.mp4" /path/to/video.mp4
```

Example for 5624 Lincoln Drive:
```bash
netlify blobs:set property-videos "5624-lincoln-drive-edina/drone/DJI_0533.MP4" "/Users/ryanpederson/Dev/Video Files/5624 Lincoln Drive Edina/Drone/DJI_0533.MP4"
```

## Option 3: Split Large Videos

For videos over 5GB (Netlify Blobs limit), you'll need to:

1. Split the video into smaller parts
2. Upload each part
3. Update the application to handle multi-part videos

### Split Video Using FFmpeg

```bash
# Split video into 4GB chunks
ffmpeg -i input.mp4 -c copy -map 0 -segment_time 3600 -f segment -reset_timestamps 1 output%03d.mp4
```

## Current Video Storage Status

| Property | Drone Videos | Property Videos | Total Size |
|----------|--------------|-----------------|------------|
| 5624 Lincoln Drive | 2 videos | - | 0.65 GB |
| 7825 Washington Ave | 6 videos | 31 videos | 8.4 GB |
| 10740 Lyndale | 7 videos | 20 videos | 6.5 GB |
| 10800 Lyndale | 4 videos | 15 videos | 3.3 GB |
| 3558 2nd St N | 3 videos | 13 videos | 3.9 GB |
| 6043 Hudson Rd | 3 videos | 15 videos | 4.1 GB |
| 9220 Bass Lake | 9 videos | 21 videos | 6.2 GB |
| 9220 James Ave | 3 videos | 10 videos | 2.0 GB |
| 8409-8421 Center | 3 videos | 8 videos | 3.2 GB |

**Total**: 206 videos, ~35 GB

## Batch Upload Script

For properties with many small videos, create a batch upload script:

```bash
#!/bin/bash
# batch-upload.sh

PROPERTY_ID="5624-lincoln-drive-edina"
VIDEO_DIR="/Users/ryanpederson/Dev/Video Files/5624 Lincoln Drive Edina"

# Upload Drone videos
for video in "$VIDEO_DIR/Drone"/*.MP4; do
  if [ -f "$video" ]; then
    filename=$(basename "$video")
    echo "Uploading $filename..."
    netlify blobs:set property-videos "$PROPERTY_ID/drone/$filename" "$video"
  fi
done

# Upload Property videos
for video in "$VIDEO_DIR/Property"/*.MP4; do
  if [ -f "$video" ]; then
    filename=$(basename "$video")
    echo "Uploading $filename..."
    netlify blobs:set property-videos "$PROPERTY_ID/property/$filename" "$video"
  fi
done
```

## Updating Property Data

After uploading videos via CLI, you need to update the property data JSON with the blob keys:

1. Edit `public/property-data.json`
2. Add the `blobKey` to each video entry:

```json
{
  "filename": "DJI_0533.MP4",
  "path": "public/assets/5624-lincoln-drive-edina/Drone_Videos/DJI_0533.MP4",
  "blobKey": "5624-lincoln-drive-edina/drone/DJI_0533.MP4"
}
```

3. Deploy the updated data: `./scripts/quick-deploy.sh`

## Troubleshooting

### "Request Entity Too Large" Error
- Video exceeds 6MB limit
- Use Netlify CLI direct upload instead

### Upload Timeouts
- Browser uploads may timeout for large files
- Use Netlify CLI for files over 100MB

### "Blob Not Found" Error
- Check that the blob key matches exactly
- Verify upload completed successfully
- Check Netlify Blobs dashboard

## Alternative Solutions

If Netlify Blobs doesn't meet your needs:

1. **Cloudinary**: Free tier includes 25GB storage
2. **Backblaze B2**: Very affordable object storage
3. **AWS S3**: Industry standard, pay-as-you-go
4. **Bunny CDN Storage**: Fast global CDN with storage

Each would require updating the video player component to stream from the external service.