import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { randomUUID } from 'crypto';

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

  // 25% per-user cap: one buyer can hold at most 25% of total tickets
  const perUserCap = Math.floor((draw.totalTickets as number) * 0.25);
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

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ success: true, ticketCount, costPence }),
  };
};
