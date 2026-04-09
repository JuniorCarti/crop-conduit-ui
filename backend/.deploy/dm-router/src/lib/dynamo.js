const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

function getInsightsTableNames() {
  const coopSnapshotsTable = process.env.COOP_SNAPSHOTS_TABLE;
  const govAggregatesTable = process.env.GOV_AGGREGATES_TABLE;
  const apiAuditLogTable = process.env.API_AUDIT_LOG_TABLE;
  if (!coopSnapshotsTable || !govAggregatesTable || !apiAuditLogTable) {
    const error = new Error('Missing Insights table environment variables');
    error.statusCode = 500;
    throw error;
  }
  return { coopSnapshotsTable, govAggregatesTable, apiAuditLogTable };
}

module.exports = { dynamo, getInsightsTableNames };
