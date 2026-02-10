const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { isOptionsRequest, preflightResponse, ok, badRequest, unauthorized, forbidden, serverError } = require('../lib/response');
const { authenticateRequest } = require('../lib/authFirebase');
const { validatePeriodId } = require('../lib/validators');
const { isGovActor, isSuperAdmin, assertRole } = require('../lib/rbac');
const { dynamo, getInsightsTableNames } = require('../lib/dynamo');
const { getOrgProfile } = require('../lib/firestoreClient');
const { writeAuditLog } = require('../lib/audit');

const NUMERIC_FIELDS = [
  'activeMembers',
  'pendingMembers',
  'sponsoredMembers',
  'paidMembers',
  'groupSalesVolumeKg',
  'groupSalesValueKES',
  'avgFarmGatePrice',
  'trainingsHeld',
  'attendanceCount'
];

function addTotals(target, row) {
  for (const field of NUMERIC_FIELDS) {
    target[field] = Number(target[field] || 0) + Number(row[field] || 0);
  }
}

async function querySnapshotsByPeriod(coopSnapshotsTable, periodId) {
  let nextToken;
  const rows = [];
  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: coopSnapshotsTable,
        IndexName: 'PeriodIndex',
        KeyConditionExpression: 'periodId = :periodId',
        ExpressionAttributeValues: { ':periodId': periodId },
        ExclusiveStartKey: nextToken
      })
    );
    rows.push(...(result.Items || []));
    nextToken = result.LastEvaluatedKey;
  } while (nextToken);
  return rows;
}

exports.handler = async (event) => {
  const startedAt = Date.now();
  const requestId = event?.requestContext?.requestId || `req-${startedAt}`;
  let actor = null;
  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    actor = await authenticateRequest(event);
    assertRole(
      isSuperAdmin(actor) || actor.role === 'gov_admin',
      'Only superadmin or gov_admin can compute aggregates'
    );

    const periodId = event?.queryStringParameters?.periodId;
    if (!periodId) return badRequest(event, 'periodId query parameter is required');
    validatePeriodId(periodId);

    const { coopSnapshotsTable, govAggregatesTable } = getInsightsTableNames();
    const snapshots = await querySnapshotsByPeriod(coopSnapshotsTable, periodId);
    const nationalTotals = {};
    const countyTotals = new Map();
    const orgSales = new Map();
    const orgIds = new Set();

    for (const row of snapshots) {
      const orgId = row.orgId;
      if (!orgId) continue;
      orgIds.add(orgId);
      addTotals(nationalTotals, row);
      const county = (row.county || 'Unknown').trim();
      if (!countyTotals.has(county)) countyTotals.set(county, {});
      addTotals(countyTotals.get(county), row);
      orgSales.set(orgId, Number(orgSales.get(orgId) || 0) + Number(row.groupSalesValueKES || 0));
    }

    const sortedBySales = [...orgSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCoopsBySales = [];
    for (const [orgId, valueKES] of sortedBySales) {
      const profile = await getOrgProfile(orgId).catch(() => null);
      topCoopsBySales.push({
        orgId,
        orgName: profile?.orgName || orgId,
        valueKES
      });
    }

    const nowIso = new Date().toISOString();
    const computedFrom = [...orgIds];
    await dynamo.send(
      new PutCommand({
        TableName: govAggregatesTable,
        Item: {
          scope: 'NATIONAL',
          periodId,
          totals: nationalTotals,
          topCoopsBySales,
          createdAt: nowIso,
          computedFrom,
          version: 1
        }
      })
    );

    for (const [countyName, totals] of countyTotals.entries()) {
      await dynamo.send(
        new PutCommand({
          TableName: govAggregatesTable,
          Item: {
            scope: `COUNTY#${countyName}`,
            periodId,
            totals,
            topCoopsBySales: [],
            createdAt: nowIso,
            computedFrom,
            version: 1
          }
        })
      );
    }

    await writeAuditLog({
      requestId,
      user: actor,
      route: 'POST /gov/compute',
      statusCode: 200,
      latencyMs: Date.now() - startedAt
    });

    return ok(event, {
      message: 'Aggregates computed',
      periodId,
      snapshotsProcessed: snapshots.length,
      countiesComputed: countyTotals.size
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    await writeAuditLog({
      requestId,
      user: actor,
      route: 'POST /gov/compute',
      statusCode,
      latencyMs: Date.now() - startedAt
    });
    if (statusCode === 400) return badRequest(event, error.message);
    if (statusCode === 401) return unauthorized(event, error.message);
    if (statusCode === 403) return forbidden(event, error.message);
    return serverError(event, 'Failed to compute aggregates');
  }
};
