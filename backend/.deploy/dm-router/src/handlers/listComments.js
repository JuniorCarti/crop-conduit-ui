const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { ok, badRequest, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
const { decodePageToken, encodePageToken, parseLimit } = require('../lib/pagination');
const { handleError } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }
    await requireAuth(event);
    requireEnv('COMMENTS_TABLE');
    const postId = event?.pathParameters?.postId;
    if (!postId) {
      return badRequest(event, 'postId is required');
    }
    const limit = parseLimit(event?.queryStringParameters?.limit, 20, 50);
    const nextToken = event?.queryStringParameters?.nextToken;
    const exclusiveStartKey = decodePageToken(nextToken);

    const result = await dynamo.send(
      new QueryCommand({
        TableName: process.env.COMMENTS_TABLE,
        KeyConditionExpression: 'postId = :postId',
        ExpressionAttributeValues: {
          ':postId': postId
        },
        ScanIndexForward: true,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey
      })
    );

    return ok(event, {
      items: result.Items || [],
      nextToken: encodePageToken(result.LastEvaluatedKey)
    });
  } catch (error) {
    return handleError(event, error);
  }
};
