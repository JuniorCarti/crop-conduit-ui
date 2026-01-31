const { GetCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { ok, notFound, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
const { parseJsonBody, reactionSchema } = require('../lib/validation');
const { requireAuth } = require('../middleware/auth');
const { handleError } = require('../lib/errors');

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    requireEnv('REACTIONS_TABLE');
    requireEnv('POSTS_TABLE');
    const postId = event?.pathParameters?.postId;
    if (!postId) {
      return notFound(event, 'Post not found');
    }

    const user = await requireAuth(event);
    const body = parseJsonBody(event.body);
    reactionSchema.parse(body);

    const existing = await dynamo.send(
      new GetCommand({
        TableName: process.env.REACTIONS_TABLE,
        Key: {
          postId,
          userId: user.uid
        }
      })
    );

    const now = new Date().toISOString();

    if (existing.Item) {
      await dynamo.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Delete: {
                TableName: process.env.REACTIONS_TABLE,
                Key: {
                  postId,
                  userId: user.uid
                }
              }
            },
            {
              Update: {
                TableName: process.env.POSTS_TABLE,
                Key: { postId },
                UpdateExpression:
                  'SET reactionCount = if_not_exists(reactionCount, :zero) + :dec, updatedAt = :now',
                ExpressionAttributeValues: {
                  ':zero': 0,
                  ':dec': -1,
                  ':now': now
                },
                ConditionExpression: 'attribute_exists(postId)'
              }
            }
          ]
        })
      );

      return ok(event, { liked: false });
    }

    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.REACTIONS_TABLE,
              Item: {
                postId,
                userId: user.uid,
                reactionType: 'like',
                createdAt: now
              }
            }
          },
          {
            Update: {
              TableName: process.env.POSTS_TABLE,
              Key: { postId },
              UpdateExpression:
                'SET reactionCount = if_not_exists(reactionCount, :zero) + :inc, updatedAt = :now',
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

    return ok(event, { liked: true });
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return notFound(event, 'Post not found');
    }
    return handleError(event, error);
  }
};
