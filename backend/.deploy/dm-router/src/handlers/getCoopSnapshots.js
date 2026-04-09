const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { isOptionsRequest, preflightResponse, ok, badRequest, unauthorized, forbidden, serverError } = require('../lib/response');
const { authenticateRequest } = require('../lib/authFirebase');
const { validatePeriodId } = require('../lib/validators');
const { isOrgActor, isSuperAdmin, assertRole } = require('../lib/rbac');
const { dynamo, getInsightsTableNames } = require('../lib/dynamo');
const { writeAuditLog } = require('../lib/audit');

exports.handler = async (event) => {
  const startedAt = Date.now();
  const requestId = event?.requestContext?.requestId || `req-${startedAt}`;
  let actor = null;
  try {
    if (isOptionsRequest(event)) return preflightResponse(event);

    actor = await authenticateRequest(event);
    const orgActor = isOrgActor(actor);
    const superAdmin = isSuperAdmin(actor);
    assertRole(orgActor || superAdmin, 'Only cooperative actors or superadmin can view snapshots');

    const query = event?.queryStringParameters || {};
    const orgId = superAdmin ? (query.orgId || actor.orgId) : actor.orgId;
    const periodId = query.periodId;
    if (!orgId) return badRequest(event, 'orgId is required');
    if (periodId) validatePeriodId(periodId);

    const { coopSnapshotsTable } = getInsightsTableNames();
    const commandInput = {
      TableName: coopSnapshotsTable,
      KeyConditionExpression: 'orgId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': orgId
      },
      ScanIndexForward: false,
      Limit: 100
    };

    if (periodId) {
      commandInput.KeyConditionExpression = 'orgId = :orgId AND periodId = :periodId';
      commandInput.ExpressionAttributeValues[':periodId'] = periodId;
      commandInput.Limit = 1;
    }

    const result = await dynamo.send(new QueryCommand(commandInput));
    const items = result.Items || [];

    await writeAuditLog({
      requestId,
      user: actor,
      route: 'GET /coop/snapshots',
      statusCode: 200,
      latencyMs: Date.now() - startedAt
    });
    return ok(event, { orgId, periodId: periodId || null, items });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    await writeAuditLog({
      requestId,
      user: actor,
      route: 'GET /coop/snapshots',
      statusCode,
      latencyMs: Date.now() - startedAt
    });

    if (statusCode === 400) return badRequest(event, error.message);
    if (statusCode === 401) return unauthorized(event, error.message);
    if (statusCode === 403) return forbidden(event, error.message);
    return serverError(event, 'Failed to load snapshots');
  }
};
