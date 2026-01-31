const { GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { ok, notFound, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
const { decodePageToken, encodePageToken, parseLimit } = require('../lib/pagination');
const { handleError } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { getSignedImageUrl } = require('../lib/s3');

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    await requireAuth(event);
    requireEnv('POSTS_TABLE');
    requireEnv('COMMENTS_TABLE');
    const postId = event?.pathParameters?.postId;
    if (!postId) {
      return notFound(event, 'Post not found');
    }

    const postResult = await dynamo.send(
      new GetCommand({
        TableName: process.env.POSTS_TABLE,
        Key: { postId }
      })
    );

    if (!postResult.Item) {
      return notFound(event, 'Post not found');
    }

    let postItem = postResult.Item;
    if (postItem?.imageKey) {
      try {
        const signedImageUrl = await getSignedImageUrl(postItem.imageKey);
        postItem = { ...postItem, signedImageUrl };
      } catch (error) {
        console.error('Failed to sign image', error);
      }
    }

    const commentsLimit = parseLimit(
      event?.queryStringParameters?.commentsLimit,
      20,
      50
    );
    const commentsToken = event?.queryStringParameters?.commentsNextToken;
    const commentsStartKey = decodePageToken(commentsToken);

    const commentsResult = await dynamo.send(
      new QueryCommand({
        TableName: process.env.COMMENTS_TABLE,
        KeyConditionExpression: 'postId = :postId',
        ExpressionAttributeValues: {
          ':postId': postId
        },
        ScanIndexForward: true,
        Limit: commentsLimit,
        ExclusiveStartKey: commentsStartKey
      })
    );

    return ok(event, {
      post: postItem,
      comments: commentsResult.Items || [],
      commentsNextToken: encodePageToken(commentsResult.LastEvaluatedKey)
    });
  } catch (error) {
    return handleError(event, error);
  }
};
