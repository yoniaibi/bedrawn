import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

async function refundEntrant(
  drawId: string,
  drawTitle: string,
  userId: string,
  ticketCount: number,
  ticketPricePence: number,
): Promise<boolean> {
  if (userId.startsWith('POSTAL_')) return true; // postal entries have no wallet
  const refundPence = ticketCount * ticketPricePence;
  const now = new Date().toISOString();
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `DEDUP#REFUND#${drawId}`,
              SK: `USER#${userId}`,
              refundedAt: now,
              ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 3600,
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: 'WALLET' },
            UpdateExpression: 'ADD balancePence :refund',
            ExpressionAttributeValues: { ':refund': refundPence },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `TX#${now}-REFUND-${drawId}`,
              type: 'refund',
              description: `Refund: ${drawTitle} (draw cancelled by admin)`,
              amountPence: refundPence,
              drawId,
              createdAt: now,
            },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `NOTIF#${now}-REFUND-${drawId}`,
              type: 'draw_cancelled',
              title: 'Draw cancelled — refund issued',
              body: `The draw "${drawTitle}" was cancelled by admin. £${(refundPence / 100).toFixed(2)} has been returned to your wallet.`,
              drawId,
              drawTitle,
              read: false,
              createdAt: now,
            },
          },
        },
      ],
    }));
    return true;
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') return false; // already refunded
    }
    throw err;
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const email = claims?.email as string | undefined;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Admin access required' }) };
  }

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing drawId' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const reason: string = (body.reason ?? 'Cancelled by admin').trim();

  const drawResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));
  const draw = drawResult.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'open') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Draw is not open (status: ${draw.status})` }) };
  }

  const entriesResult = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `DRAW#${drawId}`, ':prefix': 'ENTRY#' },
  }));
  const entries = (entriesResult.Items ?? []).map(item => ({
    userId: item.userId as string,
    ticketCount: item.ticketCount as number,
  }));

  const ticketPricePence = (draw.ticketPricePence as number) ?? 0;
  const drawTitle = draw.title as string;
  const now = new Date().toISOString();

  let refunded = 0;
  for (const e of entries) {
    const applied = await refundEntrant(drawId, drawTitle, e.userId, e.ticketCount, ticketPricePence);
    if (applied) refunded++;
  }

  try {
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #st = :cancelled, resolvedAt = :d, cancelReason = :r',
      ConditionExpression: '#st = :open',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':cancelled': 'cancelled',
        ':open': 'open',
        ':d': now,
        ':r': reason,
      },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw was already cancelled by a concurrent operation' }) };
    }
    throw err;
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      result: 'cancelled',
      drawTitle,
      reason,
      refunded,
      soldTickets: entries.reduce((s, e) => s + e.ticketCount, 0),
    }),
  };
};
