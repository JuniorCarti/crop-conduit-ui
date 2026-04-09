const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('./dynamo');

function getTradeAuditTableName() {
  return process.env.TRADE_AUDIT_TABLE || process.env.API_AUDIT_LOG_TABLE;
}

async function writeTradeAudit({
  requestId,
  actorUid,
  actorRole,
  action,
  orgId = null,
  bidId = null,
  offerId = null,
  statusCode = null,
  ip = null,
  details = null
}) {
  const tableName = getTradeAuditTableName();
  if (!tableName) return;

  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  try {
    await dynamo.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          date,
          requestId: requestId || `trade-${Date.now()}`,
          actorUid: actorUid || 'unknown',
          actorRole: actorRole || null,
          action: action || 'unknown',
          orgId,
          bidId,
          offerId,
          statusCode,
          ip,
          details,
          timestamp: now.toISOString()
        }
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'warn',
        msg: 'trade_audit_write_failed',
        errorMessage: error?.message || 'unknown'
      })
    );
  }
}

module.exports = {
  writeTradeAudit
};

