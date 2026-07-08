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

async function getSellerEmail(userId: string): Promise<string | null> {
  try {
    const res = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
    return res.UserAttributes?.find(a => a.Name === 'email')?.Value ?? null;
  } catch {
    return null;
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Verify HMAC signature — skipped if secret not yet set (dev/sandbox mode)
  const secret = process.env.LEGIT_WEBHOOK_SECRET;
  if (secret) {
    const sig = event.headers['x-legit-signature'] ?? '';
    let valid = false;
    try {
      const expected = createHmac('sha256', secret).update(event.body ?? '').digest('hex');
      valid = sig.length === expected.length && timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch { /* malformed sig */ }
    if (!valid) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  }

  const payload = JSON.parse(event.body ?? '{}');
  // LegitApp sends: { external_id, status: 'authentic' | 'inauthentic' | 'inconclusive', certificate_url? }
  const { external_id: drawId, status, certificate_url: certificateUrl } = payload;

  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing external_id' }) };

  const drawRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `DRAW#${drawId}`, SK: 'META' } }));
  const draw = drawRes.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };

  const now = new Date().toISOString();

  if (status === 'authentic') {
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #s = :open, certificateUrl = :cert, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':open': 'open', ':cert': certificateUrl ?? '', ':now': now },
    }));
    console.log('[legit-webhook] draw', drawId, 'authenticated — set to open');
  } else {
    // inauthentic or inconclusive — close draw, waive fee so seller isn't charged
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #s = :rejected, verificationFeePence = :zero, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':rejected': 'rejected', ':zero': 0, ':now': now },
    }));
    console.log('[legit-webhook] draw', drawId, 'rejected (status:', status, ') — fee waived');

    const sellerEmail = draw.sellerId ? await getSellerEmail(draw.sellerId as string) : null;
    if (sellerEmail) {
      await sendVerificationRejectedEmail(sellerEmail, draw.title as string).catch(err => {
        console.error('[legit-webhook] failed to send rejection email:', err?.message);
      });
    }
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ received: true }) };
};
