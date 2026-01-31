const { isOptionsRequest, preflightResponse, ok, created, badRequest, unauthorized } = require('../lib/response');
const { handleError } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { parseJsonBody } = require('../lib/validation');
const {
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
} = require('../lib/dm');

function parseBody(event) {
  if (!event?.body) return {};
  const raw = event?.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  return parseJsonBody(raw);
}

function ensureParticipant(conversation, userId) {
  if (!conversation || !conversation.userIds || !conversation.userIds.includes(userId)) {
    const error = new Error('Forbidden');
    error.statusCode = 401;
    throw error;
  }
}

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    const user = await requireAuth(event);
    const method = event?.requestContext?.http?.method || event?.httpMethod;
    const path = event?.requestContext?.http?.path || event?.path || '';

    if (method === 'POST' && path === '/dm/conversations') {
      const body = parseBody(event);
      if (!body?.otherUid) return badRequest(event, 'otherUid is required');
      if (body.otherUid === user.uid) return badRequest(event, 'Cannot create conversation with yourself');
      if (await isBlocked(user.uid, body.otherUid)) return unauthorized(event, 'User blocked');
      const convo = await ensureConversation(user.uid, body.otherUid);
      return created(event, { conversation: convo });
    }

    if (method === 'GET' && path === '/dm/conversations') {
      const result = await listConversationsForUser(user.uid, 20);
      return ok(event, { items: result.Items || [], nextToken: result.LastEvaluatedKey || null });
    }

    if (path.startsWith('/dm/conversations/') && path.endsWith('/messages')) {
      const parts = path.split('/');
      const conversationId = parts[3];
      if (!conversationId) return badRequest(event, 'conversationId is required');

      if (method === 'GET') {
        const result = await listMessages(conversationId, 50);
        return ok(event, { items: result.Items || [], nextToken: result.LastEvaluatedKey || null });
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body?.text) return badRequest(event, 'text is required');

        const convo = await ensureConversation(user.uid, body.otherUid || user.uid);
        ensureParticipant(convo, user.uid);

        if (await isBlocked(user.uid, convo.userIds.find((id) => id !== user.uid))) {
          return unauthorized(event, 'User blocked');
        }

        const status = await getContactStatus(convo.userIds[0], convo.userIds[1]);
        if (status.status !== 'accepted') {
          return unauthorized(event, 'Contact request not accepted');
        }

        const message = await sendMessage(conversationId, user.uid, body.text);
        await updateConversationLastMessage(conversationId, body.text);
        return created(event, { message });
      }
    }

    if (method === 'POST' && path === '/dm/contact-requests') {
      const body = parseBody(event);
      if (!body?.toUid) return badRequest(event, 'toUid is required');
      if (await isBlocked(user.uid, body.toUid)) return unauthorized(event, 'User blocked');
      const request = await createContactRequest(user.uid, body.toUid);
      return created(event, { request });
    }

    if (method === 'PUT' && path === '/dm/contact-requests/accept') {
      const body = parseBody(event);
      if (!body?.otherUid || !body?.requestId) {
        return badRequest(event, 'otherUid and requestId are required');
      }
      const pairKey = buildPairKey(user.uid, body.otherUid);
      const updated = await updateContactRequest(pairKey, body.requestId, 'accepted');
      return ok(event, { request: updated, canCall: true });
    }

    if (method === 'PUT' && path === '/dm/contact-requests/reject') {
      const body = parseBody(event);
      if (!body?.otherUid || !body?.requestId) {
        return badRequest(event, 'otherUid and requestId are required');
      }
      const pairKey = buildPairKey(user.uid, body.otherUid);
      const updated = await updateContactRequest(pairKey, body.requestId, 'rejected');
      return ok(event, { request: updated, canCall: false });
    }

    if (method === 'GET' && path.startsWith('/dm/contact-status/')) {
      const otherUid = path.split('/')[3];
      if (!otherUid) return badRequest(event, 'otherUid is required');
      const status = await getContactStatus(user.uid, otherUid);
      return ok(event, { status: status.status, canCall: status.status === 'accepted' });
    }

    if (method === 'POST' && path === '/dm/blocks') {
      const body = parseBody(event);
      if (!body?.blockedUid) return badRequest(event, 'blockedUid is required');
      const item = await blockUser(user.uid, body.blockedUid);
      return created(event, { block: item });
    }

    if (method === 'DELETE' && path.startsWith('/dm/blocks/')) {
      const blockedUid = path.split('/')[3];
      if (!blockedUid) return badRequest(event, 'blockedUid is required');
      await unblockUser(user.uid, blockedUid);
      return ok(event, { removed: true });
    }

    return badRequest(event, 'Route not found');
  } catch (error) {
    return handleError(event, error);
  }
};
