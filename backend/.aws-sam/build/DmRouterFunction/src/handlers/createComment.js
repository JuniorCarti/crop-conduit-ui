const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { dynamo } = require('../lib/dynamo');
const { created, notFound, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
const { parseJsonBody, commentSchema } = require('../lib/validation');
const { requireAuth } = require('../middleware/auth');
const { handleError } = require('../lib/errors');

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    requireEnv('COMMENTS_TABLE');
    requireEnv('POSTS_TABLE');
    const postId = event?.pathParameters?.postId;
    if (!postId) {
      return notFound(event, 'Post not found');
    }

    const user = await requireAuth(event);
    const body = parseJsonBody(event.body);
    const data = commentSchema.parse(body);

    const commentId = uuidv4();
    const now = new Date().toISOString();
    const commentKey = `${now}#${commentId}`;

    const commentItem = {
      postId,
      commentKey,
      commentId,
      authorId: user.uid,
      authorEmail: user.email,
      authorName: user.name,
      text: data.text,
      createdAt: now,
      gsi1pk: `USER#${user.uid}`,
      gsi1sk: `${now}#${commentId}`
    };

    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.COMMENTS_TABLE,
              Item: commentItem
            }
          },
          {
            Update: {
              TableName: process.env.POSTS_TABLE,
              Key: { postId },
              UpdateExpression:
                'SET commentCount = if_not_exists(commentCount, :zero) + :inc, updatedAt = :now',
              ExpressionAttributeValues: {
                ':zero': 0,
                ':inc': 1,
                ':now': now
              },
              ConditionExpression: 'attribute_exists(postId)'
            }
          }
        ]
      })
    );

    return created(event, { comment: commentItem });
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return notFound(event, 'Post not found');
    }
    return handleError(event, error);
  }
};
