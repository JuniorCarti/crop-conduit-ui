const { dynamo } = require('./dynamo');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

function buildPairKey(uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `${a}#${b}`;
}

async function isBlocked(uidA, uidB) {
  const table = process.env.DM_BLOCKS_TABLE;
  const [forward, reverse] = await Promise.all([
    dynamo.send(
      new GetCommand({
        TableName: table,
        Key: { blockerUid: uidA, blockedUid: uidB },
      })
    ),
    dynamo.send(
      new GetCommand({
        TableName: table,
        Key: { blockerUid: uidB, blockedUid: uidA },
      })
    ),
  ]);
  return Boolean(forward.Item || reverse.Item);
}

async function getContactStatus(uidA, uidB) {
  const pairKey = buildPairKey(uidA, uidB);
  const table = process.env.DM_CONTACT_REQUESTS_TABLE;
  const result = await dynamo.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: 'pairKey = :pk',
      ExpressionAttributeValues: { ':pk': pairKey },
    })
  );
  const items = result.Items || [];
  if (!items.length) return { status: 'none' };
  const latest = items.reduce((acc, item) => {
    if (!acc) return item;
    return acc.updatedAt > item.updatedAt ? acc : item;
  }, null);
  return { status: latest?.status || 'none', latest };
}

async function ensureConversation(uidA, uidB) {
  const table = process.env.DM_CONVERSATIONS_TABLE;
  const conversationId = buildPairKey(uidA, uidB);
  const now = new Date().toISOString();
  const item = {
    conversationId,
    userIds: [uidA, uidB],
    lastMessage: '',
    updatedAt: now,
    gsi1pk: uidA,
    gsi1sk: `${now}#${conversationId}`,
    gsi2pk: uidB,
    gsi2sk: `${now}#${conversationId}`,
  };
  try {
    await dynamo.send(
      new PutCommand({
        TableName: table,
        Item: item,
        ConditionExpression: 'attribute_not_exists(conversationId)',
      })
    );
    return item;
  } catch (error) {
    const existing = await dynamo.send(
      new GetCommand({
        TableName: table,
        Key: { conversationId },
      })
    );
    return existing.Item;
  }
}

async function listConversationsForUser(userId, limit = 20, nextToken) {
  const table = process.env.DM_CONVERSATIONS_TABLE;
  const result = await dynamo.send(
    new QueryCommand({
      TableName: table,
      IndexName: 'GSI1-UserUpdated',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': userId },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: nextToken,
    })
  );
  return result;
}

async function listMessages(conversationId, limit = 50, nextToken) {
  const table = process.env.DM_MESSAGES_TABLE;
  const result = await dynamo.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: 'conversationId = :cid',
      ExpressionAttributeValues: { ':cid': conversationId },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: nextToken,
    })
  );
  return result;
}

async function sendMessage(conversationId, senderId, text) {
  const table = process.env.DM_MESSAGES_TABLE;
  const now = new Date().toISOString();
  const messageId = uuidv4();
  const item = {
    conversationId,
    messageKey: `${now}#${messageId}`,
    senderId,
    text,
    createdAt: now,
  };
  await dynamo.send(
    new PutCommand({
      TableName: table,
      Item: item,
    })
  );
  return item;
}

async function updateConversationLastMessage(conversationId, text) {
  const table = process.env.DM_CONVERSATIONS_TABLE;
  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: table,
      Key: { conversationId },
      UpdateExpression: 'SET lastMessage = :msg, updatedAt = :now, gsi1sk = :g1, gsi2sk = :g2',
      ExpressionAttributeValues: {
        ':msg': text,
        ':now': now,
        ':g1': `${now}#${conversationId}`,
        ':g2': `${now}#${conversationId}`,
      },
    })
  );
}

async function createContactRequest(fromUid, toUid) {
  const table = process.env.DM_CONTACT_REQUESTS_TABLE;
  const pairKey = buildPairKey(fromUid, toUid);
  const now = new Date().toISOString();
  const requestId = uuidv4();
  const item = {
    pairKey,
    requestId,
    fromUid,
    toUid,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await dynamo.send(
    new PutCommand({
      TableName: table,
      Item: item,
    })
  );
  return item;
}

async function updateContactRequest(pairKey, requestId, status) {
  const table = process.env.DM_CONTACT_REQUESTS_TABLE;
  const now = new Date().toISOString();
  const result = await dynamo.send(
    new UpdateCommand({
      TableName: table,
      Key: { pairKey, requestId },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status, ':now': now },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

async function blockUser(blockerUid, blockedUid) {
  const table = process.env.DM_BLOCKS_TABLE;
  const now = new Date().toISOString();
  const item = { blockerUid, blockedUid, createdAt: now };
  await dynamo.send(new PutCommand({ TableName: table, Item: item }));
  return item;
}

async function unblockUser(blockerUid, blockedUid) {
  const table = process.env.DM_BLOCKS_TABLE;
  await dynamo.send(new DeleteCommand({ TableName: table, Key: { blockerUid, blockedUid } }));
}

module.exports = {
  buildPairKey,
  isBlocked,
  getContactStatus,
  ensureConversation,
  listConversationsForUser,
  listMessages,
  sendMessage,
  updateConversationLastMessage,
  createContactRequest,
  updateContactRequest,
  blockUser,
  unblockUser,
};
