import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { randomUUID } from 'crypto';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const email = claims?.email as string | undefined;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Admin access required' }) };
  }

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing drawId' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const entrantName: string = (body.name ?? '').trim();
  const entrantEmail: string = (body.email ?? '').trim().toLowerCase();
  if (!entrantName || !entrantEmail) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'name and email are required' }) };
  }

  const drawResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));
  const draw = drawResult.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'open') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Draw is not open (${draw.status})` }) };
  }

  const postalId = `POSTAL_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  // Store a minimal profile record and a real ENTRY# record so postal entries are
  // included in the draw pool with equal odds alongside paid ticket holders.
  // resolve-draws.ts detects the POSTAL_ prefix and handles the winner without
  // attempting wallet/notification operations.
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${postalId}`,
              SK: 'PROFILE',
              handle: `postal_${postalId.slice(-6)}`,
              name: entrantName,
              email: entrantEmail,
              isPostal: true,
              createdAt: now,
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `DRAW#${drawId}`,
              SK: `ENTRY#${postalId}`,
              userId: postalId,
              ticketCount: 1,
              isPostal: true,
              entrantName,
              entrantEmail,
              enteredAt: now,
            },
            ConditionExpression: 'attribute_not_exists(SK)',
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: 'META' },
            UpdateExpression: 'ADD soldTickets :one',
            ExpressionAttributeValues: { ':one': 1 },
          },
        },
      ],
    }));
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[1]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'A postal entry from this ID already exists' }) };
      }
    }
    throw err;
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ success: true, postalId, drawTitle: draw.title }),
  };
};
