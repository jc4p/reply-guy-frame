import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

async function uploadToR2(imageBuffer, filename) {
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: 'dev-bucket',
        Key: `reply-guy/${filename}`,
        Body: imageBuffer,
        ContentType: 'image/png',
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
      })
    );

    return `https://images.kasra.codes/reply-guy/${filename}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

export default uploadToR2; 