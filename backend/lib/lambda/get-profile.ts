import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims ?? {};
  const userId = claims.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
  }));

  const profile = result.Item ?? {};
  // Fallback to email prefix — claims['cognito:username'] is a raw UUID for email-based accounts
  const emailPrefix = (claims.email as string | undefined)?.split('@')[0] ?? userId.slice(0, 8);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      handle: profile.handle ?? emailPrefix,
      name: profile.name ?? (claims.name as string | undefined) ?? '',
      createdAt: profile.createdAt ?? null,
    }),
  };
};
