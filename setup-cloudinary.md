# Setting Up Cloudinary for Video Hosting

## Option 1: Cloudinary (Recommended)
Cloudinary offers a generous free tier perfect for your video hosting needs:
- 25 GB storage
- 25 GB bandwidth/month
- Automatic video optimization
- Direct video URLs for streaming/download

### Setup Steps:

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com/users/register/free
   - Sign up for free account

2. **Get Your Credentials**
   - Cloud Name: (e.g., "your-cloud-name")
   - API Key: (found in dashboard)
   - API Secret: (keep this secure!)

3. **Install Cloudinary CLI** (optional for bulk upload)
   ```bash
   npm install -g cloudinary-cli
   ```

4. **Configure Environment**
   ```bash
   export CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
   ```

## Option 2: YouTube (Private/Unlisted)
- Upload videos as unlisted
- Embed in your app
- Free but less control

## Option 3: Vimeo
- Better privacy controls than YouTube
- 500MB/week free tier
- Would need paid plan for your volume

## Option 4: AWS S3 + CloudFront
- Pay as you go
- More complex setup
- Better for production

## Option 5: Netlify Large Media
- Git LFS based
- 2.5GB bandwidth/month on free tier
- Not suitable for 35GB of videos

## Recommended: Cloudinary
Given your ~35GB of videos, Cloudinary's free tier is the best option. You'd need to:
1. Upload videos in batches to stay under 25GB
2. Or upgrade to a paid plan (~$89/month for 225GB storage)

Would you like me to implement the Cloudinary integration?