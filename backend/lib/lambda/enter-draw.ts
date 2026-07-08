import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { randomUUID } from 'crypto';

// Returns tonight's date (YYYY-MM-DD UK) if before 9pm, otherwise tomorrow's
function getNextClosingDate(): string {
  const now = new Date();
  const ukHour = parseInt(
    new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
      .toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }),
    10,
  );
  const target = ukHour >= 21 ? new Date(now.getTime() + 86_400_000) : now;
  return target.toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw ID' }) };

  let body: Record<string, unknown>;
  try { body = event.body ? JSON.parse(event.body) : {}; }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }
  const ticketCount: number = body.ticketCount as number;
  if (!ticketCount || ticketCount < 1 || !Number.isInteger(ticketCount)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'ticketCount must be a positive integer' }) };
  }

  // Fetch draw metadata
  const drawResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));

  const draw = drawResult.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'open') return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw is no longer open' }) };
  if (draw.sellerId === userId) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Sellers cannot enter their own draws' }) };
  }

  // Reject entries after closing date (UK midnight)
  if (draw.closingDate) {
    const ukToday = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
      .split('/').reverse().join('-');
    if (ukToday > draw.closingDate) {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'This draw has closed' }) };
    }
  }

  const costPence = draw.ticketPricePence * ticketCount;

  // 25% per-user cap: one buyer can hold at most 25% of total tickets.
  // Math.max(1,...) prevents cap of 0 on draws with fewer than 4 total tickets.
  const perUserCap = Math.max(1, Math.floor((draw.totalTickets as number) * 0.25));
  if (ticketCount > perUserCap) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Maximum ${perUserCap} tickets per user (25% of ${draw.totalTickets} total)` }) };
  }
  // maxBeforePurchase: the most tickets the user can currently hold and still buy ticketCount more.
  // Computed as (cap - ticketCount); used in the ConditionExpression below because DynamoDB
  // ConditionExpressions cannot do arithmetic — so we transform (existing + qty <= cap) into
  // (existing <= cap - qty).
  const maxBeforePurchase = perUserCap - ticketCount;

  // Atomic: deduct wallet balance + upsert entry record + write transaction record
  const purchasedAt = new Date().toISOString();
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: 'WALLET' },
            UpdateExpression: 'SET balancePence = balancePence - :cost, updatedAt = :d',
            ConditionExpression: 'balancePence >= :cost',
            ExpressionAttributeValues: {
              ':cost': costPence,
              ':d': purchasedAt,
            },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: `ENTRY#${userId}` },
            UpdateExpression: 'ADD ticketCount :qty SET userId = :uid, updatedAt = :d',
            // Cap: user has no tickets yet, OR existing count <= (cap - qty) so after adding qty they stay <= cap
            ConditionExpression: 'attribute_not_exists(ticketCount) OR ticketCount <= :maxBefore',
            ExpressionAttributeValues: {
              ':qty': ticketCount,
              ':uid': userId,
              ':d': purchasedAt,
              ':maxBefore': maxBeforePurchase,
            },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: 'META' },
            UpdateExpression: 'ADD soldTickets :qty SET totalRevenuePence = if_not_exists(totalRevenuePence, :zero) + :cost, updatedAt = :d',
            // Prevent overselling: soldTickets must be <= totalTickets - ticketCount (i.e. tickets still available)
            ConditionExpression: '#st = :open AND (attribute_not_exists(soldTickets) OR soldTickets <= :soldCap)',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: {
              ':qty': ticketCount,
              ':cost': costPence,
              ':zero': 0,
              ':open': 'open',
              ':soldCap': (draw.totalTickets as number) - ticketCount,
              ':d': purchasedAt,
            },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: `ORDER#${drawId}` },
            UpdateExpression: 'ADD ticketCount :qty SET drawId = :drawId, drawTitle = :title, drawImageUrl = :img, ticketPricePence = :price, enteredAt = if_not_exists(enteredAt, :ts), closingDate = :close',
            ExpressionAttributeValues: {
              ':qty': ticketCount,
              ':drawId': drawId,
              ':title': draw.title,
              ':img': (draw.imageUrls as string[] | undefined)?.[0] ?? '',
              ':price': draw.ticketPricePence,
              ':ts': purchasedAt,
              ':close': draw.closingDate ?? '',
            },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `TX#${purchasedAt}-${randomUUID().slice(0, 8)}`,
              type: 'purchase',
              description: `Tickets for: ${draw.title as string}`,
              amountPence: -costPence,
              drawId,
              createdAt: purchasedAt,
            },
          },
        },
      ],
    }));
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 402, headers: cors, body: JSON.stringify({ error: 'Insufficient wallet balance' }) };
      }
      if (reasons[1]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Ticket cap reached — maximum ${perUserCap} tickets per person (25% of supply)` }) };
      }
      if (reasons[2]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw is no longer open or sold out' }) };
      }
    }
    throw err;
  }

  // Post-purchase: check for close triggers
  if (draw.endsAt) {
    // NEW draws with a fixed end date: trigger early close if fully sold out
    // Re-read fresh state to avoid acting on stale soldTickets from before the transaction
    const freshDraw = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
    }));
    const fresh = freshDraw.Item;
    if (fresh && (fresh.soldTickets as number) >= (fresh.totalTickets as number)) {
      // Fully sold out. Compute early close: at least 7 days from listing AND 4 days from now
      const listed = new Date(draw.createdAt as string);
      const sevenDaysFromListing = new Date(listed.getTime() + 7 * 86_400_000);
      const fourDaysFromNow = new Date(Date.now() + 4 * 86_400_000);
      const earlyClose = new Date(Math.max(sevenDaysFromListing.getTime(), fourDaysFromNow.getTime()));
      const earlyCloseDateStr = earlyClose.toLocaleDateString('en-GB', { timeZone: 'Europe/London' }).split('/').reverse().join('-');
      const postalDeadlineStr = new Date(earlyClose.getTime() - 4 * 86_400_000)
        .toLocaleDateString('en-GB', { timeZone: 'Europe/London' }).split('/').reverse().join('-');

      if (earlyCloseDateStr < (draw.endsAt as string)) {
        try {
          await db.send(new UpdateCommand({
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: 'META' },
            UpdateExpression: 'SET closingDate = :close, postalDeadline = :postal, earlyClose = :ec',
            // Only bring the close date forward — never push it out
            // Move close date forward only — also fires when closingDate is absent (new draw just sold out before first update)
            ConditionExpression: 'attribute_not_exists(closingDate) OR closingDate > :close',
            ExpressionAttributeValues: {
              ':close': earlyCloseDateStr,
              ':postal': postalDeadlineStr,
              ':ec': true,
            },
          }));
          console.log('[enter-draw] early close set for', drawId, 'at', earlyCloseDateStr, '(sold out)');
        } catch (err: any) {
          if (err.name !== 'ConditionalCheckFailedException') throw err;
          // Already at an earlier date — fine
        }
      }
    }
  } else if (!draw.closingDate) {
    // OLD draws without a fixed end date: reserve-triggered close (backward compat)
    const freshDraw = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
    }));
    const fresh = freshDraw.Item;
    if (fresh && !fresh.closingDate && (fresh.soldTickets as number) >= (fresh.minTickets as number)) {
      try {
        await db.send(new UpdateCommand({
          TableName: TABLE,
          Key: { PK: `DRAW#${drawId}`, SK: 'META' },
          UpdateExpression: 'SET closingDate = :date',
          ConditionExpression: 'attribute_not_exists(closingDate)',
          ExpressionAttributeValues: { ':date': getNextClosingDate() },
        }));
      } catch (err: any) {
        if (err.name !== 'ConditionalCheckFailedException') throw err;
      }
    }
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ success: true, ticketCount, costPence }),
  };
};
