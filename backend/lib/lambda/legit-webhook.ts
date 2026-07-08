import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createHmac, timingSafeEqual } from 'crypto';
import { cors } from './stripe-client';
import { sendVerificationRejectedEmail } from './resend-client';

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

  if (status === 'authentic') {
    try {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #s = :open, certificateUrl = :cert, updatedAt = :now',
        // Only transition from pending_verification — prevents replays from reopening resolved/cancelled draws
        ConditionExpression: '#s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':open': 'open', ':cert': certificateUrl ?? '', ':now': now, ':pending': 'pending_verification' },
      }));
      console.log('[legit-webhook] draw', drawId, 'authenticated — set to open');
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        // Already transitioned (duplicate delivery or replay) — safe to ack
        console.warn('[legit-webhook] draw', drawId, 'already transitioned from pending_verification — ignoring duplicate authentic webhook');
        return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true, duplicate: true }) };
      }
      throw err;
    }
  } else {
    // inauthentic or inconclusive — reject draw, waive fee so seller isn't charged
    try {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #s = :rejected, verificationFeePence = :zero, updatedAt = :now',
        ConditionExpression: '#s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':rejected': 'rejected', ':zero': 0, ':now': now, ':pending': 'pending_verification' },
      }));
      console.log('[legit-webhook] draw', drawId, 'rejected (status:', status, ') — fee waived');
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.warn('[legit-webhook] draw', drawId, 'already transitioned — ignoring duplicate rejection webhook');
        return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true, duplicate: true }) };
      }
      throw err;
    }

    const drawTitle = (draw.title as string | undefined) ?? 'your listing';
    const sellerEmail = draw.sellerId ? await getSellerEmail(draw.sellerId as string) : null;
    if (sellerEmail) {
      await sendVerificationRejectedEmail(sellerEmail, drawTitle).catch(err => {
        console.error('[legit-webhook] failed to send rejection email:', err?.message);
      });
    }
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true }) };
};
