const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { isOptionsRequest, preflightResponse, created, badRequest, unauthorized, forbidden, tooManyRequests, serverError } = require('../lib/response');
const { authenticateRequest } = require('../lib/authFirebase');
const { parseJsonBody, validateCoopSnapshotInput } = require('../lib/validators');
const { isOrgActor, isSuperAdmin, assertRole } = require('../lib/rbac');
const { dynamo, getInsightsTableNames } = require('../lib/dynamo');
const { writeAuditLog } = require('../lib/audit');

const requestWindowByOrg = new Map();

function checkRateLimit(orgId) {
  const maxPerMinute = Number(process.env.COOP_SNAPSHOT_RATE_LIMIT_PER_MINUTE || 30);
  const now = Date.now();
  const entry = requestWindowByOrg.get(orgId);
  if (!entry || now - entry.windowStartMs >= 60_000) {
    requestWindowByOrg.set(orgId, { count: 1, windowStartMs: now });
    return false;
  }

  if (entry.count >= maxPerMinute) return true;
  entry.count += 1;
  requestWindowByOrg.set(orgId, entry);
  return false;
}

exports.handler = async (event) => {
  const startedAt = Date.now();
  const requestId = event?.requestContext?.requestId || `req-${startedAt}`;
  let actor = null;
  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    actor = await authenticateRequest(event);
    const orgActor = isOrgActor(actor);
    const superAdmin = isSuperAdmin(actor);
    assertRole(orgActor || superAdmin, 'Only cooperative actors or superadmin can submit snapshots');

    const body = parseJsonBody(event);
    const payload = validateCoopSnapshotInput(body);
    const orgId = superAdmin && payload.orgId ? payload.orgId : actor.orgId;
    if (!orgId) {
      return badRequest(event, 'orgId is required for snapshot submission');
    }
    if (orgActor && payload.orgId && payload.orgId !== actor.orgId) {
      return badRequest(event, 'org_staff/org_admin cannot submit for another organization');
    }
    if (checkRateLimit(orgId)) {
      await writeAuditLog({
        requestId,
        user: actor,
        route: 'POST /coop/snapshots',
        statusCode: 429,
        latencyMs: Date.now() - startedAt
      });
      return tooManyRequests(event, 'Rate limit exceeded for this organization');
    }

    const { coopSnapshotsTable } = getInsightsTableNames();
    const nowIso = new Date().toISOString();
    await dynamo.send(
      new PutCommand({
        TableName: coopSnapshotsTable,
        Item: {
          orgId,
          periodId: payload.periodId,
          county: payload.county,
          subCounty: payload.subCounty,
          ward: payload.ward,
          activeMembers: payload.activeMembers,
          pendingMembers: payload.pendingMembers,
          sponsoredMembers: payload.sponsoredMembers,
          paidMembers: payload.paidMembers,
          groupSalesVolumeKg: payload.groupSalesVolumeKg,
          groupSalesValueKES: payload.groupSalesValueKES,
          avgFarmGatePrice: payload.avgFarmGatePrice,
          trainingsHeld: payload.trainingsHeld,
          attendanceCount: payload.attendanceCount,
          createdAt: nowIso,
          createdByUid: actor.uid,
          source: 'coop_submission',
          version: 1
        }
      })
    );

    await writeAuditLog({
      requestId,
      user: actor,
      route: 'POST /coop/snapshots',
      statusCode: 201,
      latencyMs: Date.now() - startedAt
    });

    return created(event, {
      message: 'Snapshot submitted',
      orgId,
      periodId: payload.periodId
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    await writeAuditLog({
      requestId,
      user: actor,
      route: 'POST /coop/snapshots',
      statusCode,
      latencyMs: Date.now() - startedAt
    });
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'post_coop_snapshot_failed',
        requestId,
        uid: actor?.uid || null,
        statusCode,
        errorMessage: error?.message || 'unknown'
      })
    );

    if (statusCode === 400) return badRequest(event, error.message);
    if (statusCode === 401) return unauthorized(event, error.message);
    if (statusCode === 403) return forbidden(event, error.message);
    return serverError(event, 'Failed to submit snapshot');
  }
};
