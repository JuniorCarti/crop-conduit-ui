const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo, getInsightsTableNames } = require('./dynamo');

async function writeAuditLog({
  requestId,
  user,
  route,
  statusCode,
  latencyMs
}) {
  try {
    const { apiAuditLogTable } = getInsightsTableNames();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    await dynamo.send(
      new PutCommand({
        TableName: apiAuditLogTable,
        Item: {
          date,
          requestId: requestId || `req-${Date.now()}`,
          uid: user?.uid || 'anonymous',
          role: user?.role || null,
          orgId: user?.orgId || null,
          route,
          statusCode,
          latencyMs: Number.isFinite(latencyMs) ? latencyMs : null,
          createdAt: now.toISOString()
        }
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'warn',
        msg: 'audit_log_write_failed',
        errorMessage: error?.message || 'unknown'
      })
    );
  }
}

module.exports = { writeAuditLog };

