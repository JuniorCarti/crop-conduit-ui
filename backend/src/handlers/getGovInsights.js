const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { isOptionsRequest, preflightResponse, ok, badRequest, notFound, unauthorized, forbidden, serverError } = require('../lib/response');
const { authenticateRequest } = require('../lib/authFirebase');
const { normalizeScope, validatePeriodId, previousPeriodId } = require('../lib/validators');
const { isGovActor, isSuperAdmin, assertRole } = require('../lib/rbac');
const { dynamo, getInsightsTableNames } = require('../lib/dynamo');
const { writeAuditLog } = require('../lib/audit');

function computeTrend(currentTotals = {}, previousTotals = {}) {
  const fields = ['activeMembers', 'sponsoredMembers', 'paidMembers', 'groupSalesValueKES'];
  const trend = {};
  for (const field of fields) {
    const current = Number(currentTotals[field] || 0);
    const previous = Number(previousTotals[field] || 0);
    const delta = current - previous;
    trend[field] = {
      current,
      previous,
      delta,
      deltaPct: previous > 0 ? Number(((delta / previous) * 100).toFixed(2)) : null
    };
  }
  return trend;
}

exports.handler = async (event) => {
  const startedAt = Date.now();
  const requestId = event?.requestContext?.requestId || `req-${startedAt}`;
  let actor = null;
  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    actor = await authenticateRequest(event);
    assertRole(isGovActor(actor) || isSuperAdmin(actor), 'Only government actors or superadmin can read insights');

    const query = event?.queryStringParameters || {};
    const scope = normalizeScope(query.scope || 'NATIONAL');
    const periodId = query.periodId;
    if (!periodId) return badRequest(event, 'periodId query parameter is required');
    validatePeriodId(periodId);

    const { govAggregatesTable } = getInsightsTableNames();
    const current = await dynamo.send(
      new GetCommand({
        TableName: govAggregatesTable,
        Key: { scope, periodId }
      })
    );
    if (!current.Item) return notFound(event, 'No aggregate found for scope and period');

    const previousId = previousPeriodId(periodId);
    let previous = null;
    if (previousId) {
      previous = await dynamo
        .send(
          new GetCommand({
            TableName: govAggregatesTable,
            Key: { scope, periodId: previousId }
          })
        )
        .catch(() => null);
    }

    const trend = computeTrend(current.Item.totals || {}, previous?.Item?.totals || {});
    await writeAuditLog({
      requestId,
      user: actor,
      route: 'GET /gov/insights',
      statusCode: 200,
      latencyMs: Date.now() - startedAt
    });

    return ok(event, {
      scope,
      periodId,
      totals: current.Item.totals || {},
      topCoopsBySales: current.Item.topCoopsBySales || [],
      trend,
      metadata: {
        createdAt: current.Item.createdAt || null,
        computedFromCount: Array.isArray(current.Item.computedFrom)
          ? current.Item.computedFrom.length
          : 0,
        previousPeriodId: previous?.Item?.periodId || null
      }
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    await writeAuditLog({
      requestId,
      user: actor,
      route: 'GET /gov/insights',
      statusCode,
      latencyMs: Date.now() - startedAt
    });
    if (statusCode === 400) return badRequest(event, error.message);
    if (statusCode === 401) return unauthorized(event, error.message);
    if (statusCode === 403) return forbidden(event, error.message);
    return serverError(event, 'Failed to load government insights');
  }
};
