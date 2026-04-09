const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { ok, isOptionsRequest, preflightResponse, requireEnv } = require('../lib/response');
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
    const tableName = requireEnv('POSTS_TABLE');
    const limit = parseLimit(event?.queryStringParameters?.limit, 12, 50);
    const nextToken = event?.queryStringParameters?.nextToken;
    const exclusiveStartKey = decodePageToken(nextToken);

    let result;
    try {
      result = await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: 'GSI1-Feed',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': 'FEED'
          },
          ScanIndexForward: false,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey
        })
      );
    } catch (error) {
      console.error('Query failed, falling back to Scan', error);
      result = await dynamo.send(
        new ScanCommand({
          TableName: tableName,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey
        })
      );
    }

    const items = result?.Items || [];
    const withSigned = await Promise.all(
      items.map(async (item) => {
        if (!item?.imageKey) return item;
        try {
          const signedImageUrl = await getSignedImageUrl(item.imageKey);
          return { ...item, signedImageUrl };
        } catch (error) {
          console.error('Failed to sign image', error);
          return item;
        }
      })
    );

    return ok(event, {
      items: withSigned,
      nextToken: encodePageToken(result?.LastEvaluatedKey)
    });
  } catch (error) {
    return handleError(event, error);
  }
};
