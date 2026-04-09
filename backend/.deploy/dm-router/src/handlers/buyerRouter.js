const admin = require('firebase-admin');
const { authenticateRequest } = require('../lib/authFirebase');
const { isSuperAdmin } = require('../lib/rbac');
const { getFirestore } = require('../lib/firestoreClient');
const { writeAuditLog } = require('../lib/audit');
const {
  isOptionsRequest,
  preflightResponse,
  ok,
  created,
  jsonResponse,
} = require('../lib/response');
const { parseJsonBody } = require('../lib/validators');

const TRIAL_DAYS = 60;
const GOLD_ADDON_MONTHLY_KES = 6000;
const ENTERPRISE_DEFAULT_MONTHLY_KES = 15000;

const APPROVAL_VALUES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO']);
const TIER_VALUES = new Set(['BRONZE', 'SILVER', 'GOLD']);
const PLAN_VALUES = new Set(['NONE', 'GOLD_ADDON', 'ENTERPRISE']);
const PREMIUM_STATUS_VALUES = new Set(['TRIAL', 'ACTIVE', 'EXPIRED', 'PAST_DUE', 'CANCELLED']);
const PAYMENT_STATUS_VALUES = new Set(['ACTIVE', 'PAST_DUE', 'CANCELLED']);

function nowDate() {
  return new Date();
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000).toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function addDays(isoOrDate, days) {
  const date = isoOrDate instanceof Date ? new Date(isoOrDate.getTime()) : new Date(isoOrDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function upper(value, fallback) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized || fallback;
}

function normalizeApproval(value) {
  const normalized = upper(value, 'PENDING');
  return APPROVAL_VALUES.has(normalized) ? normalized : 'PENDING';
}

function normalizeTier(value, metrics) {
  const normalized = upper(value, '');
  if (TIER_VALUES.has(normalized)) return normalized;
  const purchases = Number(metrics?.successfulPurchasesCount || 0);
  const disputes = Number(metrics?.disputesCount || 0);
  if (purchases >= 20 && disputes <= 2) return 'GOLD';
  if (purchases >= 5) return 'SILVER';
  return 'BRONZE';
}

function normalizePlan(value) {
  const normalized = upper(value, 'NONE');
  return PLAN_VALUES.has(normalized) ? normalized : 'NONE';
}

function normalizePremiumStatus(value, trialEndAtIso, plan) {
  const normalized = upper(value, '');
  if (PREMIUM_STATUS_VALUES.has(normalized)) return normalized;

  const now = Date.now();
  const trialEndAtMs = trialEndAtIso ? new Date(trialEndAtIso).getTime() : null;
  if (trialEndAtMs && Number.isFinite(trialEndAtMs) && trialEndAtMs > now) return 'TRIAL';
  if (plan === 'NONE') return 'EXPIRED';
  return 'PAST_DUE';
}

function normalizePaymentStatus(value) {
  const normalized = upper(value, 'ACTIVE');
  return PAYMENT_STATUS_VALUES.has(normalized) ? normalized : 'ACTIVE';
}

function monthlyPriceFromPlan(plan, fallback) {
  if (Number.isFinite(Number(fallback)) && Number(fallback) >= 0) return Number(fallback);
  if (plan === 'GOLD_ADDON') return GOLD_ADDON_MONTHLY_KES;
  if (plan === 'ENTERPRISE') return ENTERPRISE_DEFAULT_MONTHLY_KES;
  return 0;
}

function buildTrialWindow(inputStart, inputEnd, createdAtValue) {
  const createdAtIso = toIso(createdAtValue) || nowDate().toISOString();
  const trialStartAt = toIso(inputStart) || createdAtIso;
  const trialEndAt = toIso(inputEnd) || addDays(trialStartAt, TRIAL_DAYS);
  return { trialStartAt, trialEndAt };
}

function trialRemainingDays(trialEndAtIso) {
  if (!trialEndAtIso) return 0;
  const ms = new Date(trialEndAtIso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function isPlatformAdmin(actor) {
  if (!actor) return false;
  if (isSuperAdmin(actor)) return true;
  return actor.role === 'admin';
}

function getMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || 'GET';
}

function getPath(event) {
  const path = event?.requestContext?.http?.path || event?.path || '';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMetrics(raw) {
  const metrics = raw && typeof raw === 'object' ? raw : {};
  return {
    successfulPurchasesCount: Number(metrics.successfulPurchasesCount || 0),
    totalSpendKes: Number(metrics.totalSpendKes || 0),
    disputesCount: Number(metrics.disputesCount || 0),
    activeOrders: Number(metrics.activeOrders || 0),
    pendingDeliveries: Number(metrics.pendingDeliveries || 0),
    pendingPayments: Number(metrics.pendingPayments || 0),
    activeContracts: Number(metrics.activeContracts || 0),
    openBids: Number(metrics.openBids || 0),
    reliabilityScore: Number(metrics.reliabilityScore || 0),
    onTimePaymentRate: Number(metrics.onTimePaymentRate || 0),
  };
}

function normalizeBuyerView({ uid, user, buyerProfile, profileV1, billingV1 }) {
  const merged = {
    ...buyerProfile,
    ...profileV1,
  };

  const { trialStartAt, trialEndAt } = buildTrialWindow(
    merged.trialStartAt,
    merged.trialEndAt,
    merged.createdAt || user?.createdAt || buyerProfile?.createdAt
  );

  const metrics = normalizeMetrics(merged.metrics);
  const approvalStatus = normalizeApproval(merged.approvalStatus);
  const buyerTier = normalizeTier(merged.buyerTier, metrics);
  const premiumPlan = normalizePlan(merged.premiumPlan);
  const premiumStatus = normalizePremiumStatus(merged.premiumStatus, trialEndAt, premiumPlan);
  const billing = {
    currency: 'KES',
    monthlyPriceKes: monthlyPriceFromPlan(
      premiumPlan,
      billingV1?.monthlyPriceKes ?? merged.billing?.monthlyPriceKes
    ),
    nextBillingDate: toIso(billingV1?.nextBillingDate ?? merged.billing?.nextBillingDate),
    lastPaymentAt: toIso(billingV1?.lastPaymentAt ?? merged.billing?.lastPaymentAt),
    paymentStatus: normalizePaymentStatus(
      billingV1?.paymentStatus ?? merged.billing?.paymentStatus ?? (premiumStatus === 'PAST_DUE' ? 'PAST_DUE' : 'ACTIVE')
    ),
  };

  return {
    uid,
    displayName: user?.displayName || buyerProfile?.fullName || profileV1?.displayName || 'Buyer',
    email: user?.email || null,
    phone: user?.phone || buyerProfile?.phone || null,
    companyName:
      merged.companyName ||
      buyerProfile?.internationalProfile?.companyName ||
      buyerProfile?.buyerTypeDetails?.companyName ||
      user?.displayName ||
      'Buyer',
    buyerType:
      upper(merged.buyerType || merged.buyerRegistrationType || user?.buyerRegistrationType, 'LOCAL') === 'INTERNATIONAL'
        ? 'INTERNATIONAL'
        : 'LOCAL',
    approvalStatus,
    verifiedBuyer: approvalStatus === 'APPROVED' || merged.verifiedBuyer === true,
    buyerTier,
    premiumPlan,
    premiumStatus,
    trialStartAt,
    trialEndAt,
    trialRemainingDays: trialRemainingDays(trialEndAt),
    trialDays: TRIAL_DAYS,
    verification: {
      verifiedAt: toIso(merged.verifiedAt),
      verifiedBy: merged.verifiedBy || null,
      verificationNotes: merged.verificationNotes || null,
    },
    metrics,
    billing,
    preferences: {
      crops: toArray(merged.crops || buyerProfile?.crops),
      preferredMarkets: toArray(merged.markets || user?.preferredMarkets),
      preferredRegions: toArray(merged.internationalLocation?.destinations),
    },
    company: {
      companyName:
        merged.companyName ||
        buyerProfile?.internationalProfile?.companyName ||
        buyerProfile?.buyerTypeDetails?.companyName ||
        user?.displayName ||
        'Buyer',
      country: merged.internationalLocation?.buyerCountry || (user?.buyerRegistrationType === 'INTERNATIONAL' ? null : 'Kenya'),
      cityOrRegion: merged.internationalLocation?.buyerRegion || merged.location || null,
      address: merged.address || null,
      phone: user?.phone || buyerProfile?.phone || null,
      whatsapp: buyerProfile?.internationalProfile?.contacts?.activeWhatsapp || null,
      email: user?.email || null,
      website: buyerProfile?.internationalProfile?.companyWebsite || null,
      destinations: toArray(merged.internationalLocation?.destinations),
    },
    activity: {
      recentOrders: toArray(profileV1?.recentOrders || merged.recentOrders),
      recentBids: toArray(profileV1?.recentBids || merged.recentBids),
      recentMessages: toArray(profileV1?.recentMessages || merged.recentMessages),
      recentContractUpdates: toArray(profileV1?.recentContractUpdates || merged.recentContractUpdates),
    },
    alerts: toArray(profileV1?.alerts || merged.smartAlerts),
    suppliers: toArray(profileV1?.suppliers),
    orders: toArray(profileV1?.orders),
    contracts: toArray(profileV1?.contracts),
    messages: toArray(profileV1?.messages),
    recommendedLots: toArray(profileV1?.recommendedLots),
    invoices: toArray(billingV1?.invoices),
    transactions: toArray(billingV1?.transactions),
    usageFees: toArray(billingV1?.usageFees),
    paymentMethods: toArray(billingV1?.paymentMethods),
    teamBilling: {
      seatCount: Number(billingV1?.teamBilling?.seatCount || 1),
      canManageSeats: Boolean(billingV1?.teamBilling?.canManageSeats),
    },
    premiumEntitlements: {
      canContactReveal: approvalStatus === 'APPROVED' && ['ACTIVE', 'TRIAL'].includes(premiumStatus),
      canUseAdvancedIntelligence: approvalStatus === 'APPROVED' && ['ACTIVE', 'TRIAL'].includes(premiumStatus),
      canUseBulkContracts: approvalStatus === 'APPROVED' && ['ACTIVE', 'TRIAL'].includes(premiumStatus),
      canCommitActions: approvalStatus === 'APPROVED',
    },
  };
}

async function getBuyerDocs(db, uid) {
  const [userSnap, buyerProfileSnap, profileV1Snap, billingV1Snap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('buyerProfiles').doc(uid).get(),
    db.collection('buyers').doc(uid).collection('profile').doc('v1').get(),
    db.collection('buyers').doc(uid).collection('billing').doc('v1').get(),
  ]);

  return {
    user: userSnap.exists ? userSnap.data() || {} : {},
    buyerProfile: buyerProfileSnap.exists ? buyerProfileSnap.data() || {} : {},
    profileV1: profileV1Snap.exists ? profileV1Snap.data() || {} : {},
    billingV1: billingV1Snap.exists ? billingV1Snap.data() || {} : {},
  };
}

async function writeBuyerAudit(db, payload) {
  try {
    await db.collection('auditLogs').add({
      module: 'buyer-accounts',
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.warn('[buyerRouter] audit_write_failed', error?.message || String(error));
  }
}

function normalizeError(error) {
  const statusCode = error?.statusCode || 500;
  return {
    statusCode,
    message: error?.message || 'Internal Server Error',
  };
}

async function createOrUpdateBuyerProfile({ db, uid, actor, body }) {
  const now = nowDate();
  const nowIso = now.toISOString();
  const trialEndAtIso = addDays(now, TRIAL_DAYS);
  const approvalStatus = 'PENDING';
  const premiumPlan = normalizePlan(body?.premiumPlan || 'NONE');

  const metrics = {
    successfulPurchasesCount: Number(body?.metrics?.successfulPurchasesCount || 0),
    totalSpendKes: Number(body?.metrics?.totalSpendKes || 0),
    disputesCount: Number(body?.metrics?.disputesCount || 0),
    activeOrders: Number(body?.metrics?.activeOrders || 0),
    pendingDeliveries: Number(body?.metrics?.pendingDeliveries || 0),
    pendingPayments: Number(body?.metrics?.pendingPayments || 0),
    activeContracts: Number(body?.metrics?.activeContracts || 0),
    openBids: Number(body?.metrics?.openBids || 0),
    reliabilityScore: Number(body?.metrics?.reliabilityScore || 0),
    onTimePaymentRate: Number(body?.metrics?.onTimePaymentRate || 0),
  };

  const profilePayload = {
    approvalStatus,
    verifiedBuyer: false,
    buyerTier: 'BRONZE',
    premiumPlan,
    premiumStatus: 'TRIAL',
    trialStartAt: nowIso,
    trialEndAt: trialEndAtIso,
    buyerType: upper(body?.buyerType || body?.buyerRegistrationType, 'LOCAL'),
    metrics,
    billing: {
      currency: 'KES',
      monthlyPriceKes: monthlyPriceFromPlan(premiumPlan, body?.billing?.monthlyPriceKes),
      nextBillingDate: body?.billing?.nextBillingDate || null,
      lastPaymentAt: body?.billing?.lastPaymentAt || null,
      paymentStatus: normalizePaymentStatus(body?.billing?.paymentStatus || 'ACTIVE'),
    },
    verificationNotes: body?.verificationNotes || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await Promise.all([
    db.collection('users').doc(uid).set(
      {
        approvalStatus,
        verifiedBuyer: false,
        buyerTier: 'BRONZE',
        premiumPlan,
        premiumStatus: 'TRIAL',
        buyerType: profilePayload.buyerType,
        trialStartAt: nowIso,
        trialEndAt: trialEndAtIso,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    db.collection('buyerProfiles').doc(uid).set(
      {
        ...profilePayload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    db.collection('buyers').doc(uid).collection('profile').doc('v1').set(
      {
        ...profilePayload,
        displayName: body?.displayName || null,
        companyName: body?.companyName || body?.internationalProfile?.companyName || null,
      },
      { merge: true }
    ),
    db.collection('buyers').doc(uid).collection('billing').doc('v1').set(
      {
        currency: 'KES',
        monthlyPriceKes: monthlyPriceFromPlan(premiumPlan, body?.billing?.monthlyPriceKes),
        paymentStatus: normalizePaymentStatus(body?.billing?.paymentStatus || 'ACTIVE'),
        nextBillingDate: body?.billing?.nextBillingDate || null,
        lastPaymentAt: body?.billing?.lastPaymentAt || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  await writeBuyerAudit(db, {
    action: 'buyer.create_profile',
    actorUid: actor.uid,
    targetUid: uid,
    approvalStatus,
    premiumPlan,
  });
}

async function listBuyersForAdmin(db, statusFilter) {
  const results = [];
  let queryRef = db.collection('buyerProfiles').limit(200);

  if (statusFilter && APPROVAL_VALUES.has(statusFilter)) {
    queryRef = db.collection('buyerProfiles').where('approvalStatus', '==', statusFilter).limit(200);
  }

  const snap = await queryRef.get();
  snap.forEach((docSnap) => {
    const row = docSnap.data() || {};
    const metrics = normalizeMetrics(row.metrics || {});
    const approvalStatus = normalizeApproval(row.approvalStatus);
    if (statusFilter && approvalStatus !== statusFilter) return;

    results.push({
      uid: docSnap.id,
      displayName: row.fullName || row.displayName || null,
      companyName: row.companyName || row.internationalProfile?.companyName || null,
      approvalStatus,
      verifiedBuyer: approvalStatus === 'APPROVED' || row.verifiedBuyer === true,
      buyerTier: normalizeTier(row.buyerTier, metrics),
      premiumPlan: normalizePlan(row.premiumPlan),
      premiumStatus: normalizePremiumStatus(row.premiumStatus, toIso(row.trialEndAt), normalizePlan(row.premiumPlan)),
      metrics,
      updatedAt: toIso(row.updatedAt),
      createdAt: toIso(row.createdAt),
    });
  });

  return results;
}

async function updateBuyerStatus({ db, targetUid, actor, body, mode }) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (mode === 'approve') {
    const payload = {
      approvalStatus: 'APPROVED',
      verifiedBuyer: true,
      verifiedAt: now,
      verifiedBy: actor.uid,
      verificationNotes: body?.reason || body?.notes || null,
      updatedAt: now,
    };

    await Promise.all([
      db.collection('users').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyerProfiles').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyers').doc(targetUid).collection('profile').doc('v1').set(payload, { merge: true }),
    ]);

    await writeBuyerAudit(db, {
      action: 'admin.buyer.approve',
      actorUid: actor.uid,
      targetUid,
      notes: body?.reason || body?.notes || null,
    });
    return;
  }

  if (mode === 'reject') {
    const payload = {
      approvalStatus: 'REJECTED',
      verifiedBuyer: false,
      verificationNotes: body?.reason || body?.notes || null,
      updatedAt: now,
    };

    await Promise.all([
      db.collection('users').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyerProfiles').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyers').doc(targetUid).collection('profile').doc('v1').set(payload, { merge: true }),
    ]);

    await writeBuyerAudit(db, {
      action: 'admin.buyer.reject',
      actorUid: actor.uid,
      targetUid,
      notes: body?.reason || body?.notes || null,
    });
    return;
  }

  if (mode === 'setTier') {
    const tier = normalizeTier(body?.buyerTier, body?.metrics);
    const payload = { buyerTier: tier, updatedAt: now };

    await Promise.all([
      db.collection('users').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyerProfiles').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyers').doc(targetUid).collection('profile').doc('v1').set(payload, { merge: true }),
    ]);

    await writeBuyerAudit(db, {
      action: 'admin.buyer.set_tier',
      actorUid: actor.uid,
      targetUid,
      buyerTier: tier,
    });
    return;
  }

  if (mode === 'setPremium') {
    const premiumPlan = normalizePlan(body?.premiumPlan);
    const premiumStatus = normalizePremiumStatus(body?.premiumStatus, toIso(body?.trialEndAt), premiumPlan);
    const billing = {
      currency: 'KES',
      monthlyPriceKes: monthlyPriceFromPlan(premiumPlan, body?.monthlyPriceKes),
      nextBillingDate: body?.nextBillingDate || null,
      lastPaymentAt: body?.lastPaymentAt || null,
      paymentStatus: normalizePaymentStatus(body?.paymentStatus || 'ACTIVE'),
    };

    const payload = {
      premiumPlan,
      premiumStatus,
      billing,
      trialStartAt: body?.trialStartAt || null,
      trialEndAt: body?.trialEndAt || null,
      updatedAt: now,
    };

    await Promise.all([
      db.collection('users').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyerProfiles').doc(targetUid).set(payload, { merge: true }),
      db.collection('buyers').doc(targetUid).collection('profile').doc('v1').set(payload, { merge: true }),
      db.collection('buyers').doc(targetUid).collection('billing').doc('v1').set({ ...billing, updatedAt: now }, { merge: true }),
    ]);

    await writeBuyerAudit(db, {
      action: 'admin.buyer.set_premium',
      actorUid: actor.uid,
      targetUid,
      premiumPlan,
      premiumStatus,
    });
  }
}

async function recordPurchaseCompleted({ db, uid, actor, body }) {
  const amountKes = Number(body?.amountKes);
  if (!Number.isFinite(amountKes) || amountKes <= 0) {
    const error = new Error('amountKes must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const disputesIncrement = body?.hasDispute === true ? 1 : 0;

  const profileRef = db.collection('buyers').doc(uid).collection('profile').doc('v1');
  const buyerProfileRef = db.collection('buyerProfiles').doc(uid);
  const userRef = db.collection('users').doc(uid);

  let nextTier = 'BRONZE';
  let nextMetrics = null;

  await db.runTransaction(async (tx) => {
    const [profileSnap, buyerSnap] = await Promise.all([tx.get(profileRef), tx.get(buyerProfileRef)]);
    const profile = profileSnap.exists ? profileSnap.data() || {} : {};
    const buyer = buyerSnap.exists ? buyerSnap.data() || {} : {};

    const currentMetrics = normalizeMetrics(profile.metrics || buyer.metrics || {});
    nextMetrics = {
      ...currentMetrics,
      successfulPurchasesCount: currentMetrics.successfulPurchasesCount + 1,
      totalSpendKes: Number((currentMetrics.totalSpendKes + amountKes).toFixed(2)),
      disputesCount: currentMetrics.disputesCount + disputesIncrement,
    };

    nextTier = normalizeTier(null, nextMetrics);

    const update = {
      metrics: nextMetrics,
      buyerTier: nextTier,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    tx.set(profileRef, update, { merge: true });
    tx.set(buyerProfileRef, update, { merge: true });
    tx.set(userRef, { buyerTier: nextTier, metrics: nextMetrics, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });

  await writeBuyerAudit(db, {
    action: 'buyer.purchase_recorded',
    actorUid: actor.uid,
    targetUid: uid,
    amountKes,
    buyerTier: nextTier,
  });

  return { buyerTier: nextTier, metrics: nextMetrics };
}

exports.handler = async (event) => {
  if (isOptionsRequest(event)) return preflightResponse(event);

  const startedAt = Date.now();
  let actor = null;
  let responseStatusCode = 200;
  const path = getPath(event);
  const method = getMethod(event).toUpperCase();

  try {
    actor = await authenticateRequest(event);
    const db = await getFirestore();

    const adminApproveMatch = path.match(/^\/admin\/buyers\/([^/]+)\/approve$/);
    const adminRejectMatch = path.match(/^\/admin\/buyers\/([^/]+)\/reject$/);
    const adminSetTierMatch = path.match(/^\/admin\/buyers\/([^/]+)\/setTier$/);
    const adminSetPremiumMatch = path.match(/^\/admin\/buyers\/([^/]+)\/setPremium$/);

    if (method === 'POST' && path === '/buyers/createProfile') {
      await createOrUpdateBuyerProfile({ db, uid: actor.uid, actor, body: parseJsonBody(event) });
      const docs = await getBuyerDocs(db, actor.uid);
      responseStatusCode = 201;
      return created(event, { ok: true, buyer: normalizeBuyerView({ uid: actor.uid, ...docs }) });
    }

    if (method === 'GET' && path === '/buyers/me') {
      const docs = await getBuyerDocs(db, actor.uid);
      return ok(event, { ok: true, buyer: normalizeBuyerView({ uid: actor.uid, ...docs }) });
    }

    if (method === 'POST' && path === '/buyers/requestPremiumUpgrade') {
      const body = parseJsonBody(event);
      const desiredPlan = normalizePlan(body?.premiumPlan || 'GOLD_ADDON');
      const requestPayload = {
        premiumUpgradeRequest: {
          requestedPlan: desiredPlan,
          status: 'PENDING',
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedBy: actor.uid,
          notes: body?.notes || null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await Promise.all([
        db.collection('buyerProfiles').doc(actor.uid).set(requestPayload, { merge: true }),
        db.collection('buyers').doc(actor.uid).collection('profile').doc('v1').set(requestPayload, { merge: true }),
      ]);

      await writeBuyerAudit(db, {
        action: 'buyer.request_premium_upgrade',
        actorUid: actor.uid,
        targetUid: actor.uid,
        premiumPlan: desiredPlan,
      });

      return ok(event, { ok: true, requestedPlan: desiredPlan, status: 'PENDING' });
    }

    if (method === 'POST' && path === '/buyers/recordPurchaseCompleted') {
      const result = await recordPurchaseCompleted({
        db,
        uid: actor.uid,
        actor,
        body: parseJsonBody(event),
      });
      return ok(event, { ok: true, ...result });
    }

    if (method === 'GET' && path === '/admin/buyers') {
      if (!isPlatformAdmin(actor)) {
        responseStatusCode = 403;
        return jsonResponse(event, 403, { ok: false, error: 'Admin role required' });
      }

      const statusFilter = upper(event?.queryStringParameters?.status || '', '');
      const items = await listBuyersForAdmin(db, statusFilter || null);
      return ok(event, { ok: true, items, count: items.length });
    }

    if (method === 'POST' && adminApproveMatch) {
      if (!isPlatformAdmin(actor)) {
        responseStatusCode = 403;
        return jsonResponse(event, 403, { ok: false, error: 'Admin role required' });
      }
      const targetUid = decodeURIComponent(adminApproveMatch[1]);
      await updateBuyerStatus({ db, targetUid, actor, body: parseJsonBody(event), mode: 'approve' });
      const docs = await getBuyerDocs(db, targetUid);
      return ok(event, { ok: true, buyer: normalizeBuyerView({ uid: targetUid, ...docs }) });
    }

    if (method === 'POST' && adminRejectMatch) {
      if (!isPlatformAdmin(actor)) {
        responseStatusCode = 403;
        return jsonResponse(event, 403, { ok: false, error: 'Admin role required' });
      }
      const targetUid = decodeURIComponent(adminRejectMatch[1]);
      await updateBuyerStatus({ db, targetUid, actor, body: parseJsonBody(event), mode: 'reject' });
      const docs = await getBuyerDocs(db, targetUid);
      return ok(event, { ok: true, buyer: normalizeBuyerView({ uid: targetUid, ...docs }) });
    }

    if (method === 'POST' && adminSetTierMatch) {
      if (!isPlatformAdmin(actor)) {
        responseStatusCode = 403;
        return jsonResponse(event, 403, { ok: false, error: 'Admin role required' });
      }
      const targetUid = decodeURIComponent(adminSetTierMatch[1]);
      await updateBuyerStatus({ db, targetUid, actor, body: parseJsonBody(event), mode: 'setTier' });
      const docs = await getBuyerDocs(db, targetUid);
      return ok(event, { ok: true, buyer: normalizeBuyerView({ uid: targetUid, ...docs }) });
    }

    if (method === 'POST' && adminSetPremiumMatch) {
      if (!isPlatformAdmin(actor)) {
        return jsonResponse(event, 403, { ok: false, error: 'Admin role required' });
      }
      const targetUid = decodeURIComponent(adminSetPremiumMatch[1]);
      await updateBuyerStatus({ db, targetUid, actor, body: parseJsonBody(event), mode: 'setPremium' });
      const docs = await getBuyerDocs(db, targetUid);
      return ok(event, { ok: true, buyer: normalizeBuyerView({ uid: targetUid, ...docs }) });
    }

    responseStatusCode = 404;
    return jsonResponse(event, 404, { ok: false, error: 'Route not found' });
  } catch (error) {
    const normalized = normalizeError(error);
    responseStatusCode = normalized.statusCode;
    if (normalized.statusCode >= 500) {
      console.error('[buyerRouter] unhandled_error', error);
    }
    return jsonResponse(event, normalized.statusCode, { ok: false, error: normalized.message });
  } finally {
    try {
      await writeAuditLog({
        requestId: event?.requestContext?.requestId,
        user: actor,
        route: `${method} ${path}`,
        statusCode: responseStatusCode,
        latencyMs: Date.now() - startedAt,
      });
    } catch {
      // no-op
    }
  }
};
