import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, PutCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { randomInt } from 'crypto';
import { sendWinnerEmail, sendSellerResolvedEmail } from './resend-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
const TABLE = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
const USER_POOL_ID = process.env.USER_POOL_ID!;

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const res = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
    return res.UserAttributes?.find(a => a.Name === 'email')?.Value ?? null;
  } catch (err: any) {
    console.warn('[getUserEmail] failed for', userId, err?.name, err?.message);
    return null;
  }
}

function pickWeightedWinner(entries: { userId: string; ticketCount: number }[]): string {
  const total = entries.reduce((sum, e) => sum + e.ticketCount, 0);
  let roll = randomInt(0, total);
  for (const entry of entries) {
    roll -= entry.ticketCount;
    if (roll < 0) return entry.userId;
  }
  return entries[entries.length - 1].userId;
}

async function refundEntrant(
  drawId: string,
  drawTitle: string,
  userId: string,
  ticketCount: number,
  ticketPricePence: number,
): Promise<boolean> {
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
              description: `Refund: ${drawTitle} (draw cancelled)`,
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
              body: `The draw "${drawTitle}" was cancelled. £${(refundPence / 100).toFixed(2)} has been returned to your wallet.`,
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
      if (reasons[0]?.Code === 'ConditionalCheckFailed') return false;
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

  const soldTickets = entries.reduce((s, e) => s + e.ticketCount, 0);
  const minTickets = (draw.minTickets as number) ?? 0;
  const ticketPricePence = (draw.ticketPricePence as number) ?? 0;
  const drawTitle = draw.title as string;
  const now = new Date().toISOString();

  if (entries.length === 0 || soldTickets < minTickets) {
    const reason = entries.length === 0
      ? 'no entries (admin triggered)'
      : `below minimum (${soldTickets}/${minTickets}) (admin triggered)`;

    // Refund all entrants BEFORE flipping status, matching nightly cron behaviour.
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
        ExpressionAttributeValues: { ':cancelled': 'cancelled', ':open': 'open', ':d': now, ':r': reason },
      }));
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw was already resolved or cancelled by a concurrent operation' }) };
      }
      throw err;
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ result: 'cancelled', reason, refunded }) };
  }

  const winnerId = pickWeightedWinner(entries);
  const isPostalWinner = winnerId.startsWith('POSTAL_');

  const transactItems: any[] = [
    {
      Update: {
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #st = :resolved, winnerId = :winner, resolvedAt = :d',
        ConditionExpression: '#st = :open',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':resolved': 'resolved',
          ':open': 'open',
          ':winner': winnerId,
          ':d': now,
        },
      },
    },
  ];

  if (!isPostalWinner) {
    transactItems.push({
      Put: {
        TableName: TABLE,
        Item: {
          PK: `USER#${winnerId}`,
          SK: `NOTIF#${now}`,
          type: 'draw_won',
          title: '🎉 You won!',
          body: `You won the draw for: ${drawTitle}`,
          drawId,
          drawTitle,
          read: false,
          createdAt: now,
        },
      },
    });
  }

  try {
    await db.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw was already resolved or cancelled by a concurrent operation' }) };
      }
    }
    throw err;
  }

  // Send winner + seller emails — must be awaited before return or Lambda freezes mid-send
  if (!isPostalWinner) {
    console.log('[email] looking up emails for winner:', winnerId, 'seller:', draw.sellerId);
    const [winnerEmail, sellerEmail] = await Promise.all([
      getUserEmail(winnerId),
      draw.sellerId ? getUserEmail(draw.sellerId as string) : Promise.resolve(null),
    ]);
    console.log('[email] winnerEmail:', winnerEmail, 'sellerEmail:', sellerEmail);
    const emailResults = await Promise.allSettled([
      winnerEmail ? sendWinnerEmail(winnerEmail, drawTitle, drawId) : Promise.resolve(),
      sellerEmail ? sendSellerResolvedEmail(sellerEmail, drawTitle, soldTickets, draw.ticketPricePence as number) : Promise.resolve(),
    ]);
    emailResults.forEach((r, i) => {
      const label = i === 0 ? 'winner' : 'seller';
      if (r.status === 'rejected') console.error(`[email] ${label} failed:`, r.reason);
      else console.log(`[email] ${label} ${i === 0 ? winnerEmail : sellerEmail ? 'sent' : 'skipped (no email)'}`);
    });
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      result: 'resolved',
      drawTitle,
      soldTickets,
      entries: entries.length,
      winnerId,
      ...(isPostalWinner ? { postalWinner: winnerId, note: 'Postal winner — retrieve USER#POSTAL_.../PROFILE and contact manually' } : {}),
    }),
  };
};
