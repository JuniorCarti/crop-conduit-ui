const { z } = require('zod');

const postSchema = z.object({
  text: z.string().min(1).max(2000),
  imageKey: z.string().min(1).max(500).optional()
});

const commentSchema = z.object({
  text: z.string().min(1).max(1000)
});

const reactionSchema = z.object({
  reactionType: z.enum(['like']).default('like').optional()
});

const presignSchema = z.object({
  contentType: z.string().min(1),
  fileExt: z.string().min(1).max(10),
  postId: z.string().min(1).max(100).optional()
});

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  const sanitized = typeof body === 'string' ? body.replace(/^\uFEFF/, '') : body;
  try {
    return JSON.parse(sanitized);
  } catch (error) {
    try {
      const decoded = Buffer.from(sanitized, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (innerError) {
      throw new Error('Invalid JSON body');
    }
  }
}

module.exports = {
  postSchema,
  commentSchema,
  reactionSchema,
  presignSchema,
  parseJsonBody
};
