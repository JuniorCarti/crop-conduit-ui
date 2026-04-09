const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { requireEnv, getRegion } = require('./response');

const s3 = new S3Client({ region: getRegion() });

async function getSignedImageUrl(key) {
  if (!key) return null;
  const bucket = requireEnv('MEDIA_BUCKET');
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

module.exports = { getSignedImageUrl };
