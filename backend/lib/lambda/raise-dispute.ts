import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { sendDisputeReceivedEmail } from './resend-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw id' }) };

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const reason = String(body.reason ?? '').trim().slice(0, 2000);
  if (!reason) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Required: reason' }) };
  }

  const drawRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `DRAW#${drawId}`, SK: 'META' } }));
  const draw = drawRes.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.winnerId !== userId) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only the winner can raise a dispute' }) };
  }
  if (draw.status === 'disputed') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'A dispute is already open on this draw' }) };
  }
  if (draw.status !== 'in_transit') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Draw is not in transit (status: ${draw.status})` }) };
  }

  // Dispute window: open while autoReleaseAt >= today (7 days from tracking upload)
  const today = new Date().toISOString().slice(0, 10);
  const autoReleaseAt = draw.autoReleaseAt as string | undefined;
  if (autoReleaseAt && autoReleaseAt < today) {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Dispute window closed — payout already released' }) };
  }

  const now = new Date().toISOString();

  // Conditional on in_transit so a concurrent auto-release/confirm can't be overwritten
  try {
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #s = :disputed, disputeReason = :reason, disputedAt = :now, updatedAt = :now',
      ConditionExpression: '#s = :inTransit',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':disputed': 'disputed',
        ':inTransit': 'in_transit',
        ':reason': reason,
        ':now': now,
      },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw state changed — dispute could not be opened' }) };
    }
    throw err;
  }

  const drawTitle = (draw.title as string | undefined) ?? 'a draw';

  // Alert every admin by email — failures logged, never fail the request (dispute is committed)
  for (const adminEmail of ADMIN_EMAILS) {
    await sendDisputeReceivedEmail(adminEmail, drawTitle, drawId, reason).catch(err =>
      console.error(`[raise-dispute] failed to email admin ${adminEmail}:`, err?.message ?? err));
  }

  // Acknowledge to the winner in-app
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `NOTIF#${now}-DISPUTE-${drawId}`,
      type: 'dispute_received',
      title: 'Dispute received',
      body: "We'll review your case within 24 hours.",
      drawId,
      drawTitle,
      read: false,
      createdAt: now,
    },
  })).catch(err => console.error('[raise-dispute] failed to write winner notification:', err?.message ?? err));

  return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };
};
