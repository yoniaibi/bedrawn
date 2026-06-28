import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const token = body.token as string | undefined;
  if (!token) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing token' }) };

  const method = event.requestContext.http.method;

  if (method === 'DELETE') {
    await db.send(new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: `PUSH_TOKEN#${token}` },
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };
  }

  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `PUSH_TOKEN#${token}`,
      token,
      updatedAt: new Date().toISOString(),
    },
  }));

  return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };
};
