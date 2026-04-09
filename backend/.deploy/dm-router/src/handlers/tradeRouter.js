const admin = require('firebase-admin');
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { authenticateRequest } = require('../lib/authFirebase');
const { getFirestore } = require('../lib/firestoreClient');
const { isOrgActor, isSuperAdmin } = require('../lib/rbac');
const {
  isOptionsRequest,
  preflightResponse,
  ok,
  created,
  badRequest,
  forbidden,
  notFound,
  tooManyRequests
} = require('../lib/response');
const { parseJsonBody } = require('../lib/validators');
const { writeTradeAudit } = require('../lib/tradeAudit');
const { v4: uuidv4 } = require('uuid');

const COMMODITIES = new Set(['kales', 'cabbage', 'tomatoes']);
const CURRENCY = 'KES';
const OFFER_RATE_LIMIT_PER_MIN = 4;
const inMemoryOfferRateLimit = new Map();

function getMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || 'GET';
}

function getPath(event) {
  return event?.requestContext?.http?.path || event?.path || '';
}

function nowIso() {
  return new Date().toISOString();
}

function parseIso(value, field) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    const error = new Error(`${field} must be a valid ISO date`);
    error.statusCode = 400;
    throw error;
  }
  return date.toISOString();
}

function asPositiveNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error(`${field} must be > 0`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function normalizeCommodity(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!COMMODITIES.has(normalized)) {
    const error = new Error(`commodity must be one of: ${Array.from(COMMODITIES).join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function getTradeTableNames() {
  const bidsTable = process.env.TRADE_BIDS_TABLE;
  const offersTable = process.env.TRADE_OFFERS_TABLE;
  if (!bidsTable || !offersTable) {
    const error = new Error('TRADE_BIDS_TABLE and TRADE_OFFERS_TABLE must be configured');
    error.statusCode = 500;
    throw error;
  }
  return { bidsTable, offersTable };
}

function bidPk(orgId) {
  return `ORG#${orgId}`;
}
function bidSk(bidId) {
  return `BID#${bidId}`;
}
function bidLookupPk(bidId) {
  return `BID#${bidId}`;
}
function offerPk(bidId) {
  return `BID#${bidId}`;
}
function offerSk(offerId) {
  return `OFFER#${offerId}`;
}

function assertOrgAccess(user, orgId) {
  if (isSuperAdmin(user)) return;
  if (!isOrgActor(user)) {
    const error = new Error('Only cooperative staff/admin can perform this action');
    error.statusCode = 403;
    throw error;
  }
  if (!user?.orgId || user.orgId !== orgId) {
    const error = new Error('You can only manage bids for your own cooperative');
    error.statusCode = 403;
    throw error;
  }
}

function assertBuyerAccess(user) {
  if (isSuperAdmin(user)) return;
  if (user?.role !== 'buyer') {
    const error = new Error('Buyer role required');
    error.statusCode = 403;
    throw error;
  }
}

async function assertBuyerCommitApproved(user) {
  if (isSuperAdmin(user) || user?.role === 'admin') return;
  const db = await getFirestore();
  const [profileSnap, buyerProfileSnap, userSnap] = await Promise.all([
    db.collection('buyers').doc(user.uid).collection('profile').doc('v1').get(),
    db.collection('buyerProfiles').doc(user.uid).get(),
    db.collection('users').doc(user.uid).get(),
  ]);

  const profile = profileSnap.exists ? profileSnap.data() || {} : {};
  const buyerProfile = buyerProfileSnap.exists ? buyerProfileSnap.data() || {} : {};
  const userDoc = userSnap.exists ? userSnap.data() || {} : {};

  const approvalStatus = String(
    profile.approvalStatus || buyerProfile.approvalStatus || userDoc.approvalStatus || ''
  ).toUpperCase();
  const verifiedBuyer =
    profile.verifiedBuyer === true ||
    buyerProfile.verifiedBuyer === true ||
    userDoc.verifiedBuyer === true;

  if (approvalStatus === 'APPROVED' || verifiedBuyer) return;

  const error = new Error('Buyer approval pending. Ask AgriSmart compliance to verify your account first.');
  error.statusCode = 403;
  throw error;
}

function assertFarmerAccess(user) {
  if (isSuperAdmin(user) || user?.role === 'admin') return;
  if (user?.role !== 'farmer') {
    const error = new Error('Farmer role required');
    error.statusCode = 403;
    throw error;
  }
}

function getIp(event) {
  return (
    event?.requestContext?.http?.sourceIp ||
    event?.headers?.['x-forwarded-for'] ||
    null
  );
}

async function getBidByOrgAndId(bidsTable, orgId, bidId) {
  const res = await dynamo.send(
    new GetCommand({
      TableName: bidsTable,
      Key: { pk: bidPk(orgId), sk: bidSk(bidId) }
    })
  );
  return res.Item || null;
}

async function getBidById(bidsTable, bidId) {
  const res = await dynamo.send(
    new QueryCommand({
      TableName: bidsTable,
      IndexName: 'GSI2-BidLookup',
      KeyConditionExpression: 'gsi2pk = :pk',
      ExpressionAttributeValues: {
        ':pk': bidLookupPk(bidId)
      },
      Limit: 1
    })
  );
  return res.Items?.[0] || null;
}

async function listOffersForBid(offersTable, bidId) {
  const res = await dynamo.send(
    new QueryCommand({
      TableName: offersTable,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': offerPk(bidId),
        ':skPrefix': 'OFFER#'
      }
    })
  );
  return res.Items || [];
}

function maskBuyerLabel(uid, index) {
  if (!uid) return `Buyer ${String.fromCharCode(65 + index)}`;
  return `Buyer ${uid.slice(0, 1).toUpperCase()}`;
}

function summarizeOffers(offers) {
  const active = offers
    .filter((offer) => offer.status === 'active' || offer.status === 'winning')
    .sort((a, b) => Number(b.pricePerKg || 0) - Number(a.pricePerKg || 0));
  const topPrices = active.slice(0, 3).map((row) => Number(row.pricePerKg || 0));
  return {
    bidderCountSnapshot: active.length,
    topPriceSnapshot: topPrices[0] || null,
    topPriceListSnapshot: topPrices
  };
}

async function refreshBidSnapshots(bidsTable, offersTable, bid) {
  const offers = await listOffersForBid(offersTable, bid.bidId);
  const summary = summarizeOffers(offers);
  await dynamo.send(
    new UpdateCommand({
      TableName: bidsTable,
      Key: { pk: bid.pk, sk: bid.sk },
      UpdateExpression:
        'SET bidderCountSnapshot = :bidderCountSnapshot, topPriceSnapshot = :topPriceSnapshot, topPriceListSnapshot = :topPriceListSnapshot, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':bidderCountSnapshot': summary.bidderCountSnapshot,
        ':topPriceSnapshot': summary.topPriceSnapshot,
        ':topPriceListSnapshot': summary.topPriceListSnapshot,
        ':updatedAt': nowIso()
      }
    })
  );
  return summary;
}

function enforceOfferRateLimit(user, bidId) {
  const key = `${user.uid}:${bidId}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const bucket = inMemoryOfferRateLimit.get(key) || [];
  const recent = bucket.filter((stamp) => now - stamp < windowMs);
  if (recent.length >= OFFER_RATE_LIMIT_PER_MIN) {
    const error = new Error('Offer rate limit exceeded. Please wait a minute.');
    error.statusCode = 429;
    throw error;
  }
  recent.push(now);
  inMemoryOfferRateLimit.set(key, recent);
}

async function notifyUsers(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  try {
    const db = await getFirestore();
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean))).slice(0, 500);
    await Promise.all(
      uniqueUserIds.map((uid) =>
        db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc()
          .set({
            ...payload,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
      )
    );
  } catch (error) {
    console.warn('[trade] notifications_failed', error?.message || String(error));
  }
}

async function getOrgMemberUids(orgId, roles = []) {
  try {
    const db = await getFirestore();
    const snap = await db.collection('orgs').doc(orgId).collection('members').get();
    return snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((row) => (roles.length ? roles.includes(row.role) : true))
      .filter((row) => (row.status || row.verificationStatus || 'active') === 'active')
      .map((row) => row.linkedUserUid || row.userUid || row.uid || row.id)
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveFarmerMembershipOrgIds(uid) {
  const db = await getFirestore();
  const orgIds = new Set();

  try {
    const mirrorSnap = await db.collection('users').doc(uid).collection('memberships').get();
    mirrorSnap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if ((data.status || 'active') === 'active') orgIds.add(docSnap.id);
    });
  } catch {
    // ignore
  }

  try {
    const cgSnap = await db
      .collectionGroup('members')
      .where(admin.firestore.FieldPath.documentId(), '==', uid)
      .get();
    cgSnap.forEach((docSnap) => {
      const segments = docSnap.ref.path.split('/');
      const orgIndex = segments.findIndex((part) => part === 'orgs');
      if (orgIndex >= 0 && segments[orgIndex + 1]) orgIds.add(segments[orgIndex + 1]);
    });
  } catch {
    // ignore
  }

  return Array.from(orgIds);
}

async function resolveFarmerCommodityEligibility(uid, orgId) {
  const db = await getFirestore();
  const commodities = new Set();

  try {
    const contributions = await db
      .collection('orgs')
      .doc(orgId)
      .collection('contributions')
      .where('uid', '==', uid)
      .get();
    contributions.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if (data.commodity) commodities.add(String(data.commodity).toLowerCase());
    });
  } catch {
    // ignore
  }

  try {
    const collectionsSnap = await db.collection('orgs').doc(orgId).collection('collections').limit(50).get();
    for (const row of collectionsSnap.docs) {
      const items = await row.ref.collection('items').where('uid', '==', uid).limit(10).get();
      if (!items.empty) {
        const commodity = row.data()?.commodity;
        if (commodity) commodities.add(String(commodity).toLowerCase());
      }
    }
  } catch {
    // ignore
  }

  return commodities;
}

async function pickWinnerAndClose({ bidsTable, offersTable, bid, winnerOfferId = null }) {
  const offers = await listOffersForBid(offersTable, bid.bidId);
  const activeOffers = offers
    .filter((offer) => offer.status === 'active' || offer.status === 'winning')
    .sort((a, b) => Number(b.pricePerKg || 0) - Number(a.pricePerKg || 0));

  let winner = null;
  if (winnerOfferId) {
    winner = activeOffers.find((offer) => offer.offerId === winnerOfferId) || null;
  } else if (activeOffers.length) {
    winner = activeOffers[0];
  }

  const closedAt = nowIso();
  await dynamo.send(
    new UpdateCommand({
      TableName: bidsTable,
      Key: { pk: bid.pk, sk: bid.sk },
      UpdateExpression:
        'SET #status = :status, closedAt = :closedAt, winningOfferId = :winningOfferId, winningBuyerId = :winningBuyerId, winningBuyerLabel = :winningBuyerLabel, winningPrice = :winningPrice, updatedAt = :updatedAt REMOVE gsi1pk, gsi1sk',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'closed',
        ':closedAt': closedAt,
        ':winningOfferId': winner?.offerId || null,
        ':winningBuyerId': winner?.buyerUid || null,
        ':winningBuyerLabel': winner ? maskBuyerLabel(winner.buyerUid, 0) : null,
        ':winningPrice': winner ? Number(winner.pricePerKg || 0) : null,
        ':updatedAt': closedAt
      }
    })
  );

  await Promise.all(
    activeOffers.map((offer) =>
      dynamo.send(
        new UpdateCommand({
          TableName: offersTable,
          Key: { pk: offer.pk, sk: offer.sk },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': winner && offer.offerId === winner.offerId ? 'winning' : 'lost',
            ':updatedAt': closedAt
          }
        })
      )
    )
  );

  return {
    closedAt,
    winner
  };
}

function safeBidViewForBuyerOrFarmer(bid) {
  return {
    bidId: bid.bidId,
    orgId: bid.orgId,
    commodity: bid.commodity,
    requestedQty: bid.requestedQty,
    unit: bid.unit,
    status: bid.status,
    opensAt: bid.opensAt,
    closesAt: bid.closesAt,
    visibilityMode: bid.visibilityMode,
    transparencyMode: bid.transparencyMode,
    topPrice: bid.topPriceSnapshot || null,
    bidderCount: Number(bid.bidderCountSnapshot || 0),
    winningPrice: bid.status === 'closed' ? bid.winningPrice || null : null,
    winnerLabel: bid.status === 'closed' ? bid.winningBuyerLabel || null : null,
    currency: CURRENCY
  };
}

exports.handler = async (event) => {
  let actor = null;
  let action = 'trade.unknown';
  let statusCode = 200;
  let bidIdForAudit = null;
  let offerIdForAudit = null;
  let orgIdForAudit = null;

  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    const { bidsTable, offersTable } = getTradeTableNames();
    const method = getMethod(event).toUpperCase();
    const path = getPath(event);
    actor = await authenticateRequest(event);

    const orgBidListMatch = path.match(/^\/trade\/orgs\/([^/]+)\/bids$/);
    const orgBidMatch = path.match(/^\/trade\/orgs\/([^/]+)\/bids\/([^/]+)$/);
    const orgBidOffersMatch = path.match(/^\/trade\/orgs\/([^/]+)\/bids\/([^/]+)\/offers$/);
    const orgBidCloseMatch = path.match(/^\/trade\/orgs\/([^/]+)\/bids\/([^/]+)\/close$/);
    const orgBidWinnerMatch = path.match(/^\/trade\/orgs\/([^/]+)\/bids\/([^/]+)\/winner$/);
    const buyerOfferMatch = path.match(/^\/trade\/bids\/([^/]+)\/offers$/);
    const buyerWithdrawMatch = path.match(/^\/trade\/bids\/([^/]+)\/offers\/([^/]+)\/withdraw$/);
    const bidResultMatch = path.match(/^\/trade\/bids\/([^/]+)\/result$/);

    if (method === 'POST' && orgBidListMatch) {
      const orgId = decodeURIComponent(orgBidListMatch[1]);
      orgIdForAudit = orgId;
      action = 'trade.bid.create';
      assertOrgAccess(actor, orgId);

      const body = parseJsonBody(event);
      const commodity = normalizeCommodity(body.commodity);
      const requestedQty = asPositiveNumber(body.requestedQty, 'requestedQty');
      const unit = String(body.unit || 'kg').toLowerCase();
      if (unit !== 'kg') return badRequest(event, 'unit must be kg');
      const opensAt = parseIso(body.opensAt || nowIso(), 'opensAt');
      const closesAt = parseIso(body.closesAt, 'closesAt');
      if (new Date(closesAt).getTime() <= new Date(opensAt).getTime()) {
        return badRequest(event, 'closesAt must be after opensAt');
      }

      const bidId = body.bidId || uuidv4();
      bidIdForAudit = bidId;
      const createdAt = nowIso();
      const item = {
        pk: bidPk(orgId),
        sk: bidSk(bidId),
        bidId,
        orgId,
        commodity,
        requestedQty,
        unit: 'kg',
        status: 'open',
        opensAt,
        closesAt,
        createdByUid: actor.uid,
        visibilityMode: body.visibilityMode === 'all_members' ? 'all_members' : 'eligible_only',
        transparencyMode: body.transparencyMode === 'full_list' ? 'full_list' : 'top_only',
        winningOfferId: null,
        winningBuyerId: null,
        winningBuyerLabel: null,
        winningPrice: null,
        bidderCountSnapshot: 0,
        topPriceSnapshot: null,
        topPriceListSnapshot: [],
        createdAt,
        updatedAt: createdAt,
        currency: CURRENCY,
        gsi1pk: `OPEN#${commodity}`,
        gsi1sk: `${closesAt}#${orgId}#${bidId}`,
        gsi2pk: bidLookupPk(bidId),
        gsi2sk: `ORG#${orgId}`
      };

      await dynamo.send(
        new PutCommand({
          TableName: bidsTable,
          Item: item
        })
      );

      const farmerUids = await getOrgMemberUids(orgId, ['member', 'farmer']);
      await notifyUsers(farmerUids, {
        type: 'BID_OPEN',
        title: `New ${commodity} bid opened`,
        message: `A cooperative bid is open and closes at ${new Date(closesAt).toLocaleString()}.`,
        orgId,
        bidId,
        commodity
      });

      statusCode = 201;
      return created(event, { ok: true, bid: item });
    }

    if (method === 'GET' && orgBidListMatch) {
      const orgId = decodeURIComponent(orgBidListMatch[1]);
      orgIdForAudit = orgId;
      action = 'trade.bid.list.org';
      assertOrgAccess(actor, orgId);

      const status = event?.queryStringParameters?.status;
      const commodity = event?.queryStringParameters?.commodity;

      const res = await dynamo.send(
        new QueryCommand({
          TableName: bidsTable,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': bidPk(orgId),
            ':skPrefix': 'BID#'
          }
        })
      );

      let items = res.Items || [];
      if (status) items = items.filter((row) => row.status === status);
      if (commodity) items = items.filter((row) => row.commodity === String(commodity).toLowerCase());
      items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return ok(event, { ok: true, items });
    }

    if (method === 'GET' && orgBidMatch) {
      const orgId = decodeURIComponent(orgBidMatch[1]);
      const bidId = decodeURIComponent(orgBidMatch[2]);
      orgIdForAudit = orgId;
      bidIdForAudit = bidId;
      action = 'trade.bid.get.org';
      assertOrgAccess(actor, orgId);

      const bid = await getBidByOrgAndId(bidsTable, orgId, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      return ok(event, { ok: true, bid });
    }

    if (method === 'GET' && orgBidOffersMatch) {
      const orgId = decodeURIComponent(orgBidOffersMatch[1]);
      const bidId = decodeURIComponent(orgBidOffersMatch[2]);
      orgIdForAudit = orgId;
      bidIdForAudit = bidId;
      action = 'trade.offer.list.org';
      assertOrgAccess(actor, orgId);

      const bid = await getBidByOrgAndId(bidsTable, orgId, bidId);
      if (!bid) return notFound(event, 'Bid not found');

      const offers = await listOffersForBid(offersTable, bidId);
      return ok(event, { ok: true, bidId, offers });
    }

    if (method === 'POST' && orgBidCloseMatch) {
      const orgId = decodeURIComponent(orgBidCloseMatch[1]);
      const bidId = decodeURIComponent(orgBidCloseMatch[2]);
      orgIdForAudit = orgId;
      bidIdForAudit = bidId;
      action = 'trade.bid.close';
      assertOrgAccess(actor, orgId);

      const bid = await getBidByOrgAndId(bidsTable, orgId, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      if (bid.status !== 'open') return badRequest(event, 'Bid is not open');

      const body = parseJsonBody(event);
      const result = await pickWinnerAndClose({
        bidsTable,
        offersTable,
        bid,
        winnerOfferId: body?.winnerOfferId || null
      });

      const offers = await listOffersForBid(offersTable, bid.bidId);
      const buyerUids = offers.map((row) => row.buyerUid).filter(Boolean);
      const farmerUids = await getOrgMemberUids(orgId, ['member', 'farmer']);
      await notifyUsers([...buyerUids, ...farmerUids], {
        type: 'BID_CLOSED',
        title: `${bid.commodity} bid closed`,
        message: result.winner
          ? `Winning price is KES ${Number(result.winner.pricePerKg).toLocaleString()}/kg.`
          : 'Bid closed without a winning offer.',
        orgId,
        bidId,
        commodity: bid.commodity
      });

      return ok(event, {
        ok: true,
        bidId,
        status: 'closed',
        winningOfferId: result.winner?.offerId || null,
        winningPrice: result.winner ? Number(result.winner.pricePerKg) : null
      });
    }

    if (method === 'POST' && orgBidWinnerMatch) {
      const orgId = decodeURIComponent(orgBidWinnerMatch[1]);
      const bidId = decodeURIComponent(orgBidWinnerMatch[2]);
      orgIdForAudit = orgId;
      bidIdForAudit = bidId;
      action = 'trade.bid.winner.select';
      assertOrgAccess(actor, orgId);

      const body = parseJsonBody(event);
      const bid = await getBidByOrgAndId(bidsTable, orgId, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      if (bid.status === 'cancelled') return badRequest(event, 'Cannot pick winner for cancelled bid');

      if (bid.status === 'open') {
        await pickWinnerAndClose({
          bidsTable,
          offersTable,
          bid,
          winnerOfferId: body?.winnerOfferId || null
        });
      } else {
        const offers = await listOffersForBid(offersTable, bidId);
        const winner = body?.winnerOfferId
          ? offers.find((item) => item.offerId === body.winnerOfferId)
          : offers.sort((a, b) => Number(b.pricePerKg || 0) - Number(a.pricePerKg || 0))[0];
        if (!winner) return badRequest(event, 'No eligible offer found');
        await dynamo.send(
          new UpdateCommand({
            TableName: bidsTable,
            Key: { pk: bid.pk, sk: bid.sk },
            UpdateExpression:
              'SET winningOfferId = :winningOfferId, winningBuyerId = :winningBuyerId, winningBuyerLabel = :winningBuyerLabel, winningPrice = :winningPrice, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':winningOfferId': winner.offerId,
              ':winningBuyerId': winner.buyerUid,
              ':winningBuyerLabel': maskBuyerLabel(winner.buyerUid, 0),
              ':winningPrice': Number(winner.pricePerKg || 0),
              ':updatedAt': nowIso()
            }
          })
        );
      }

      return ok(event, { ok: true, bidId, message: 'Winner set successfully' });
    }

    if (method === 'GET' && path === '/trade/bids/open') {
      action = 'trade.bid.list.open';
      const commodityFilter = event?.queryStringParameters?.commodity;
      const commodities = commodityFilter ? [normalizeCommodity(commodityFilter)] : Array.from(COMMODITIES);
      const all = [];

      for (const commodity of commodities) {
        const response = await dynamo.send(
          new QueryCommand({
            TableName: bidsTable,
            IndexName: 'GSI1-OpenByCommodity',
            KeyConditionExpression: 'gsi1pk = :pk',
            ExpressionAttributeValues: {
              ':pk': `OPEN#${commodity}`
            },
            Limit: 100
          })
        );
        all.push(...(response.Items || []));
      }

      const now = Date.now();
      const items = all
        .filter((row) => row.status === 'open' && new Date(row.closesAt).getTime() > now)
        .sort((a, b) => String(a.closesAt).localeCompare(String(b.closesAt)))
        .map(safeBidViewForBuyerOrFarmer);

      return ok(event, { ok: true, currency: CURRENCY, items });
    }

    if (method === 'POST' && buyerOfferMatch) {
      const bidId = decodeURIComponent(buyerOfferMatch[1]);
      bidIdForAudit = bidId;
      action = 'trade.offer.create';
      assertBuyerAccess(actor);
      await assertBuyerCommitApproved(actor);
      enforceOfferRateLimit(actor, bidId);

      const bid = await getBidById(bidsTable, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      orgIdForAudit = bid.orgId;
      if (bid.status !== 'open') return badRequest(event, 'Bid is not open');
      if (new Date(bid.closesAt).getTime() <= Date.now()) return badRequest(event, 'Bid already closed');

      const body = parseJsonBody(event);
      const pricePerKg = asPositiveNumber(body.pricePerKg, 'pricePerKg');
      const qty = asPositiveNumber(body.qty, 'qty');

      const offers = await listOffersForBid(offersTable, bidId);
      const duplicateActive = offers.find((row) => row.buyerUid === actor.uid && row.status === 'active');
      if (duplicateActive) return badRequest(event, 'You already have an active offer on this bid');

      const offerId = uuidv4();
      offerIdForAudit = offerId;
      const createdAt = nowIso();
      const item = {
        pk: offerPk(bidId),
        sk: offerSk(offerId),
        offerId,
        bidId,
        buyerUid: actor.uid,
        buyerOrgId: actor.orgId || null,
        pricePerKg,
        qty,
        currency: CURRENCY,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
        gsi1pk: `BUYER#${actor.uid}`,
        gsi1sk: `${createdAt}#${bidId}`
      };

      await dynamo.send(
        new PutCommand({
          TableName: offersTable,
          Item: item
        })
      );

      await refreshBidSnapshots(bidsTable, offersTable, bid);

      const coopUids = await getOrgMemberUids(bid.orgId, ['org_admin', 'org_staff']);
      await notifyUsers(coopUids, {
        type: 'BID_OFFER',
        title: `New offer on ${bid.commodity} bid`,
        message: `A buyer placed an offer at KES ${pricePerKg.toLocaleString()}/kg.`,
        orgId: bid.orgId,
        bidId: bid.bidId,
        commodity: bid.commodity
      });

      statusCode = 201;
      return created(event, { ok: true, offer: item });
    }

    if (method === 'POST' && buyerWithdrawMatch) {
      const bidId = decodeURIComponent(buyerWithdrawMatch[1]);
      const offerId = decodeURIComponent(buyerWithdrawMatch[2]);
      bidIdForAudit = bidId;
      offerIdForAudit = offerId;
      action = 'trade.offer.withdraw';
      assertBuyerAccess(actor);

      const bid = await getBidById(bidsTable, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      orgIdForAudit = bid.orgId;

      const offerRes = await dynamo.send(
        new GetCommand({
          TableName: offersTable,
          Key: { pk: offerPk(bidId), sk: offerSk(offerId) }
        })
      );
      const offer = offerRes.Item;
      if (!offer) return notFound(event, 'Offer not found');
      if (!isSuperAdmin(actor) && offer.buyerUid !== actor.uid) {
        return forbidden(event, 'You can only withdraw your own offer');
      }
      if (offer.status !== 'active') return badRequest(event, 'Only active offers can be withdrawn');

      await dynamo.send(
        new UpdateCommand({
          TableName: offersTable,
          Key: { pk: offerPk(bidId), sk: offerSk(offerId) },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'withdrawn',
            ':updatedAt': nowIso()
          }
        })
      );

      await refreshBidSnapshots(bidsTable, offersTable, bid);
      return ok(event, { ok: true, offerId, status: 'withdrawn' });
    }

    if (method === 'GET' && bidResultMatch) {
      const bidId = decodeURIComponent(bidResultMatch[1]);
      bidIdForAudit = bidId;
      action = 'trade.bid.result';
      const bid = await getBidById(bidsTable, bidId);
      if (!bid) return notFound(event, 'Bid not found');
      orgIdForAudit = bid.orgId;

      return ok(event, {
        ok: true,
        result: safeBidViewForBuyerOrFarmer(bid)
      });
    }

    if (method === 'GET' && path === '/trade/farmer/bids') {
      action = 'trade.farmer.bids';
      assertFarmerAccess(actor);
      const orgIds = await resolveFarmerMembershipOrgIds(actor.uid);
      if (!orgIds.length) return ok(event, { ok: true, items: [] });

      const items = [];
      for (const orgId of orgIds) {
        const eligibleCommodities = await resolveFarmerCommodityEligibility(actor.uid, orgId);
        const bidRes = await dynamo.send(
          new QueryCommand({
            TableName: bidsTable,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
            ExpressionAttributeValues: {
              ':pk': bidPk(orgId),
              ':skPrefix': 'BID#'
            }
          })
        );
        for (const bid of bidRes.Items || []) {
          const isAllMembers = bid.visibilityMode === 'all_members';
          const isEligibleCommodity = eligibleCommodities.has(String(bid.commodity || '').toLowerCase());
          if (isAllMembers || isEligibleCommodity) {
            items.push(safeBidViewForBuyerOrFarmer(bid));
          }
        }
      }

      items.sort((a, b) => String(a.closesAt || '').localeCompare(String(b.closesAt || '')));
      return ok(event, { ok: true, items });
    }

    statusCode = 404;
    return notFound(event, 'Route not found');
  } catch (error) {
    statusCode = error?.statusCode || (error?.message?.includes('rate limit') ? 429 : 500);
    if (statusCode === 403) return forbidden(event, error.message || 'Forbidden');
    if (statusCode === 429) return tooManyRequests(event, error.message || 'Too Many Requests');
    if (statusCode === 404) return notFound(event, error.message || 'Not found');
    if (statusCode === 400) return badRequest(event, error.message || 'Bad request');
    if (statusCode === 401) return forbidden(event, error.message || 'Unauthorized');
    console.error('[tradeRouter] unhandled_error', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  } finally {
    await writeTradeAudit({
      requestId: event?.requestContext?.requestId,
      actorUid: actor?.uid,
      actorRole: actor?.role,
      action,
      orgId: orgIdForAudit,
      bidId: bidIdForAudit,
      offerId: offerIdForAudit,
      statusCode,
      ip: getIp(event)
    });
  }
};
