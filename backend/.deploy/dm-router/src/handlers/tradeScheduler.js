const { QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { writeTradeAudit } = require('../lib/tradeAudit');

const COMMODITIES = ['kales', 'cabbage', 'tomatoes'];

function getTradeTableNames() {
  const bidsTable = process.env.TRADE_BIDS_TABLE;
  const offersTable = process.env.TRADE_OFFERS_TABLE;
  if (!bidsTable || !offersTable) {
    throw new Error('TRADE_BIDS_TABLE and TRADE_OFFERS_TABLE must be configured');
  }
  return { bidsTable, offersTable };
}

async function listOffersForBid(offersTable, bidId) {
  const res = await dynamo.send(
    new QueryCommand({
      TableName: offersTable,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `BID#${bidId}`,
        ':skPrefix': 'OFFER#'
      }
    })
  );
  return res.Items || [];
}

async function closeBidAuto({ bidsTable, offersTable, bid }) {
  const offers = await listOffersForBid(offersTable, bid.bidId);
  const activeOffers = offers
    .filter((offer) => offer.status === 'active' || offer.status === 'winning')
    .sort((a, b) => Number(b.pricePerKg || 0) - Number(a.pricePerKg || 0));
  const winner = activeOffers[0] || null;
  const now = new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: bidsTable,
      Key: { pk: bid.pk, sk: bid.sk },
      UpdateExpression:
        'SET #status = :status, closedAt = :closedAt, winningOfferId = :winningOfferId, winningBuyerId = :winningBuyerId, winningBuyerLabel = :winningBuyerLabel, winningPrice = :winningPrice, updatedAt = :updatedAt REMOVE gsi1pk, gsi1sk',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'closed',
        ':closedAt': now,
        ':winningOfferId': winner?.offerId || null,
        ':winningBuyerId': winner?.buyerUid || null,
        ':winningBuyerLabel': winner?.buyerUid ? `Buyer ${String(winner.buyerUid).slice(0, 1).toUpperCase()}` : null,
        ':winningPrice': winner ? Number(winner.pricePerKg || 0) : null,
        ':updatedAt': now
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
            ':updatedAt': now
          }
        })
      )
    )
  );

  return { winnerOfferId: winner?.offerId || null };
}

exports.handler = async () => {
  const { bidsTable, offersTable } = getTradeTableNames();
  const now = new Date().toISOString();
  let closedCount = 0;

  for (const commodity of COMMODITIES) {
    const query = await dynamo.send(
      new QueryCommand({
        TableName: bidsTable,
        IndexName: 'GSI1-OpenByCommodity',
        KeyConditionExpression: 'gsi1pk = :pk AND gsi1sk <= :cutoff',
        ExpressionAttributeValues: {
          ':pk': `OPEN#${commodity}`,
          ':cutoff': `${now}#~`
        },
        Limit: 100
      })
    );

    for (const bid of query.Items || []) {
      if (bid.status !== 'open') continue;
      await closeBidAuto({ bidsTable, offersTable, bid });
      closedCount += 1;
      await writeTradeAudit({
        requestId: `scheduler-${Date.now()}-${bid.bidId}`,
        actorUid: 'system',
        actorRole: 'scheduler',
        action: 'trade.bid.auto_close',
        orgId: bid.orgId,
        bidId: bid.bidId,
        statusCode: 200
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      closedCount
    })
  };
};

