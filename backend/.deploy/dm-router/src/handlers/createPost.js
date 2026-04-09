const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { dynamo } = require('../lib/dynamo');
const { created, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
const { parseJsonBody, postSchema } = require('../lib/validation');
const { requireAuth } = require('../middleware/auth');
const { handleError } = require('../lib/errors');

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    const user = await requireAuth(event);
    requireEnv('POSTS_TABLE');
    const body = parseJsonBody(event.body);
    const data = postSchema.parse(body);

    const postId = uuidv4();
    const now = new Date().toISOString();

    const item = {
      postId,
      authorId: user.uid,
      authorEmail: user.email,
      authorName: user.name,
      text: data.text,
      createdAt: now,
      updatedAt: now,
      commentCount: 0,
      reactionCount: 0,
      gsi1pk: 'FEED',
      gsi1sk: `${now}#${postId}`,
      gsi2pk: `USER#${user.uid}`,
      gsi2sk: `${now}#${postId}`
    };

    if (data.imageKey) {
      item.imageKey = data.imageKey;
    }

    await dynamo.send(
      new PutCommand({
        TableName: process.env.POSTS_TABLE,
        Item: item
      })
    );

    return created(event, { post: item });
  } catch (error) {
    return handleError(event, error);
  }
};
