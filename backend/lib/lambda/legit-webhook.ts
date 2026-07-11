import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createHmac, timingSafeEqual } from 'crypto';
import { cors } from './stripe-client';
import { sendVerificationRejectedEmail, sendVerificationPassedEmail } from './resend-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
const TABLE = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

// Known terminal statuses from LegitApp. Anything else (e.g. 'pending', 'processing')
// is acknowledged but not actioned — prevents unknown statuses from permanently rejecting draws.
const KNOWN_STATUSES = new Set(['authentic', 'inauthentic', 'inconclusive']);

async function getSellerEmail(userId: string): Promise<string | null> {
  try {
    const res = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
    return res.UserAttributes?.find(a => a.Name === 'email')?.Value ?? null;
  } catch {
    return null;
  }
}

/**
 * Refund a single entrant atomically — same transaction shape as resolve-draws.ts:
 * dedup marker + wallet credit + TX record + notification. The dedup marker means
 * webhook retries/replays can never double-credit a buyer.
 */
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
              description: `Refund: ${drawTitle} (item failed authentication)`,
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
              body: `The draw "${drawTitle}" was cancelled because the item could not be authenticated. £${(refundPence / 100).toFixed(2)} has been returned to your wallet.`,
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
  // HMAC verification. If LEGIT_WEBHOOK_SECRET is absent (env var not set), log a warning and
  // allow through — this is dev/sandbox mode only. In production the secret MUST be set in SSM
  // and the env var populated via CDK before enabling LegitApp. An empty string is treated as
  // misconfigured (not dev mode) and will cause all requests to be rejected.
  const secret = process.env.LEGIT_WEBHOOK_SECRET;
  if (secret === '') {
    console.error('[legit-webhook] LEGIT_WEBHOOK_SECRET is set to empty string — rejecting all requests. Set it in SSM or unset the env var for dev mode.');
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'Webhook endpoint misconfigured' }) };
  }
  if (secret) {
    const sig = event.headers['x-legit-signature'] ?? '';
    let valid = false;
    try {
      const expected = createHmac('sha256', secret).update(event.body ?? '').digest('hex');
      const sigBuf = Buffer.from(sig, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      // Guard byte-length equality before calling timingSafeEqual (it throws on mismatch)
      valid = sigBuf.length === expBuf.length && sigBuf.length === 32
        && timingSafeEqual(sigBuf, expBuf);
    } catch { /* malformed sig — valid stays false */ }
    if (!valid) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  } else {
    console.warn('[legit-webhook] LEGIT_WEBHOOK_SECRET not configured — HMAC check skipped (dev mode only, NOT safe for production)');
  }

  // Parse body — return 400 on malformed JSON rather than crashing with a 500
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  // LegitApp sends: { external_id, status: 'authentic' | 'inauthentic' | 'inconclusive', certificate_url? }
  const { external_id: drawId, status, certificate_url: certificateUrl } = payload as {
    external_id?: string;
    status?: string;
    certificate_url?: string;
  };

  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing external_id' }) };

  // Acknowledge but ignore unknown statuses (e.g. future 'pending', 'review_needed').
  // Returning 200 prevents LegitApp from retrying with the same payload.
  if (!status || !KNOWN_STATUSES.has(status)) {
    console.warn('[legit-webhook] draw', drawId, 'received unknown status:', status, '— ignoring');
    return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true, ignored: true }) };
  }

  const drawRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `DRAW#${drawId}`, SK: 'META' } }));
  const draw = drawRes.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };

  const now = new Date().toISOString();

  const drawTitle = (draw.title as string | undefined) ?? 'your listing';

  if (status === 'authentic') {
    try {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #s = :shipment, certificateUrl = :cert, updatedAt = :now',
        // Only transition from pending_auth — prevents replays from re-flipping shipped/complete draws
        ConditionExpression: '#s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':shipment': 'pending_shipment', ':cert': certificateUrl ?? '', ':now': now, ':pending': 'pending_auth' },
      }));
      console.log('[legit-webhook] draw', drawId, 'authenticated — set to pending_shipment');
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        // Already transitioned (duplicate delivery or replay) — safe to ack
        console.warn('[legit-webhook] draw', drawId, 'already transitioned from pending_auth — ignoring duplicate authentic webhook');
        return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true, duplicate: true }) };
      }
      throw err;
    }

    // Tell the seller to ship — include the winner's handle so they know who it's going to
    const winnerId = (draw.winnerId as string | undefined) ?? '';
    let winnerHandle = winnerId ? `user_${winnerId.slice(0, 6)}` : 'the winner';
    if (winnerId) {
      const winnerProfile = await db.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `USER#${winnerId}`, SK: 'PROFILE' },
      }));
      winnerHandle = (winnerProfile.Item?.handle as string | undefined) ?? winnerHandle;
    }
    const sellerEmail = draw.sellerId ? await getSellerEmail(draw.sellerId as string) : null;
    if (sellerEmail) {
      await sendVerificationPassedEmail(sellerEmail, drawTitle, winnerId, winnerHandle).catch(err => {
        console.error('[legit-webhook] failed to send verification-passed email:', err?.message);
      });
    }
  } else {
    // inauthentic or inconclusive — auth failed after resolution, so every buyer must be refunded
    try {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #s = :failed, updatedAt = :now',
        ConditionExpression: '#s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':failed': 'auth_failed', ':now': now, ':pending': 'pending_auth' },
      }));
      console.log('[legit-webhook] draw', drawId, 'auth failed (status:', status, ')');
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.warn('[legit-webhook] draw', drawId, 'already transitioned — ignoring duplicate rejection webhook');
        return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true, duplicate: true }) };
      }
      throw err;
    }

    // Refund every buyer — tickets were already sold when the draw resolved.
    // Per-entry dedup markers make this loop safe to re-run on partial failure.
    const ticketPricePence = (draw.ticketPricePence as number) ?? 0;
    const entriesResult = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': `DRAW#${drawId}`, ':prefix': 'ENTRY#' },
    }));
    const entries = (entriesResult.Items ?? []).map(item => ({
      userId: item.userId as string,
      ticketCount: item.ticketCount as number,
    }));
    let refunded = 0;
    for (const e of entries) {
      const applied = await refundEntrant(drawId, drawTitle, e.userId, e.ticketCount, ticketPricePence);
      if (applied) refunded++;
    }
    console.log(`[legit-webhook] refunded ${refunded}/${entries.length} buyer(s) for draw ${drawId}`);

    const sellerEmail = draw.sellerId ? await getSellerEmail(draw.sellerId as string) : null;
    if (sellerEmail) {
      await sendVerificationRejectedEmail(sellerEmail, drawTitle).catch(err => {
        console.error('[legit-webhook] failed to send rejection email:', err?.message);
      });
    }
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true }) };
};
