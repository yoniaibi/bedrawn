import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { sendWinnerTrackingEmail } from './resend-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
const TABLE = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

/** Add 7 calendar days to an ISO timestamp, return YYYY-MM-DD. */
function datePlus7Days(isoString: string): string {
  return new Date(Date.parse(isoString) + 7 * 86_400_000).toISOString().slice(0, 10);
}

async function getUserEmail(userId: string): Promise<string | null> {
  // Prefer the profile record; fall back to Cognito
  try {
    const profile = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
    }));
    const email = profile.Item?.email as string | undefined;
    if (email) return email;
  } catch { /* fall through to Cognito */ }
  try {
    const res = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
    return res.UserAttributes?.find(a => a.Name === 'email')?.Value ?? null;
  } catch {
    return null;
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw id' }) };

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const carrier = String(body.carrier ?? '').trim().slice(0, 100);
  const trackingNumber = String(body.trackingNumber ?? '').trim().slice(0, 100);
  if (!carrier || !trackingNumber) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Required: carrier, trackingNumber' }) };
  }

  const drawRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `DRAW#${drawId}`, SK: 'META' } }));
  const draw = drawRes.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.sellerId !== userId) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only the seller can upload tracking' }) };
  }
  if (draw.status !== 'pending_shipment') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Draw is not awaiting shipment (status: ${draw.status})` }) };
  }

  const now = new Date().toISOString();
  const autoReleaseAt = datePlus7Days(now);

  // Conditional on pending_shipment so a concurrent submit can't restart the 7-day clock
  try {
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #s = :inTransit, tracking = :tracking, autoReleaseAt = :release, updatedAt = :now',
      ConditionExpression: '#s = :pendingShipment',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':inTransit': 'in_transit',
        ':pendingShipment': 'pending_shipment',
        ':tracking': { carrier, trackingNumber, shippedAt: now },
        ':release': autoReleaseAt,
        ':now': now,
      },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Tracking was already submitted for this draw' }) };
    }
    throw err;
  }

  // Notify the winner — email + in-app notification. Failures here must not fail the
  // request: the status transition has already been committed.
  const drawTitle = (draw.title as string | undefined) ?? 'your item';
  const winnerId = draw.winnerId as string | undefined;
  if (winnerId && !winnerId.startsWith('POSTAL_')) {
    const winnerEmail = await getUserEmail(winnerId);
    if (winnerEmail) {
      await sendWinnerTrackingEmail(winnerEmail, drawTitle, carrier, trackingNumber).catch(err =>
        console.error('[submit-tracking] failed to send winner tracking email:', err?.message ?? err));
    }
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${winnerId}`,
        SK: `NOTIF#${now}-SHIPPED-${drawId}`,
        type: 'item_shipped',
        title: 'Your item is on its way!',
        body: `Track it with ${carrier}: ${trackingNumber}`,
        drawId,
        drawTitle,
        read: false,
        createdAt: now,
      },
    })).catch(err => console.error('[submit-tracking] failed to write winner notification:', err?.message ?? err));
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true, autoReleaseAt }) };
};
