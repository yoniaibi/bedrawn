import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw ID' }) };

  const key = { PK: `USER#${userId}`, SK: `SAVED#${drawId}` };

  if (event.requestContext.http.method === 'DELETE') {
    await db.send(new DeleteCommand({ TableName: TABLE, Key: key }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ saved: false }) };
  }

  // Check if already saved (GET)
  if (event.requestContext.http.method === 'GET') {
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: key }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ saved: !!result.Item }) };
  }

  // POST — save the draw
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { ...key, drawId, savedAt: new Date().toISOString() },
  }));
  return { statusCode: 200, headers: cors, body: JSON.stringify({ saved: true }) };
};
