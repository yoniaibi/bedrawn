import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const userId = claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const body = JSON.parse(event.body ?? '{}');
  const { handle, name } = body;

  if (handle !== undefined) {
    if (!HANDLE_RE.test(handle)) {
      return {
        statusCode: 400, headers: cors,
        body: JSON.stringify({ error: 'Handle must be 3–20 characters, letters/numbers/underscores only' }),
      };
    }
  }

  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
    UpdateExpression: 'SET #h = if_not_exists(#h, :h), #n = if_not_exists(#n, :n), updatedAt = :now',
    ExpressionAttributeNames: { '#h': 'handle', '#n': 'name' },
    ExpressionAttributeValues: {
      ':h': handle ?? claims?.email?.split('@')[0] ?? userId.slice(0, 8),
      ':n': name ?? claims?.name ?? '',
      ':now': new Date().toISOString(),
    },
  }));

  return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
};
