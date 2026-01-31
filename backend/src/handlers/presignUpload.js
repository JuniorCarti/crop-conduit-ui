const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { created, badRequest, isOptionsRequest, preflightResponse, requireEnv, getRegion } = require('../lib/response');
const { parseJsonBody, presignSchema } = require('../lib/validation');
const { requireAuth } = require('../middleware/auth');
const { handleError } = require('../lib/errors');

const s3 = new S3Client({});

function sanitizeExtension(ext) {
  if (!ext) return 'bin';
  const cleaned = ext.replace('.', '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleaned || 'bin';
}

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    const user = await requireAuth(event);
    const bucket = requireEnv('MEDIA_BUCKET');
    const rawBody =
      event?.isBase64Encoded && event?.body
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event?.body;
    let body;
    try {
      body = parseJsonBody(rawBody);
    } catch (error) {
      console.error('Presign invalid JSON', {
        isBase64Encoded: event?.isBase64Encoded,
        bodySnippet: typeof rawBody === 'string' ? rawBody.slice(0, 200) : null
      });
      throw error;
    }
    if (!body?.contentType || !body?.filename) {
      return badRequest(event, 'filename and contentType are required');
    }
    const data = presignSchema.parse({
      contentType: body.contentType,
      fileExt: body.filename?.split('.').pop(),
      postId: body.postId
    });

    const ext = sanitizeExtension(data.fileExt);
    const objectId = uuidv4();
    const prefix = data.postId ? `community/${data.postId}` : `community/${user.uid}`;
    const key = `${prefix}/${objectId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: data.contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    const region = getRegion();
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return created(event, {
      uploadUrl,
      key,
      fileUrl
    });
  } catch (error) {
    return handleError(event, error);
  }
};
