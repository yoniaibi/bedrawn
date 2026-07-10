import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const SHARE_CREDIT_PENCE = 1000; // £10

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw id' }) };

  // Fetch draw
  const drawRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `DRAW#${drawId}`, SK: 'META' } }));
  const draw = drawRes.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'resolved') return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Draw has not resolved yet' }) };

  // Verify caller is the winner
  if (draw.winnerUserId !== userId) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only the draw winner can claim this reward' }) };
  }

  // Idempotent — skip if already credited
  if (draw.shareCredited) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, credited: false, alreadyClaimed: true }) };
  }

  const now = new Date().toISOString();

  // Atomically: mark draw.shareCredited = true AND credit wallet via condition expression
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: 'META' },
            UpdateExpression: 'SET shareCredited = :t, shareCreditedAt = :now',
            ConditionExpression: 'attribute_not_exists(shareCredited)',
            ExpressionAttributeValues: { ':t': true, ':now': now },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: 'WALLET' },
            UpdateExpression: 'ADD balancePence :amt',
            ExpressionAttributeValues: { ':amt': SHARE_CREDIT_PENCE },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `TX#${now}#winner_share`,
              type: 'credit',
              description: `Winner share bonus — ${draw.title}`,
              amountPence: SHARE_CREDIT_PENCE,
              drawId,
              createdAt: now,
            },
          },
        },
      ],
    }));
  } catch (err: any) {
    if (err?.name === 'TransactionCanceledException') {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, credited: false, alreadyClaimed: true }) };
    }
    throw err;
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ ok: true, credited: true, creditPence: SHARE_CREDIT_PENCE }),
  };
};
