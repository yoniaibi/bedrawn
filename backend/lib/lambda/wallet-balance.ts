import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${userId}`, SK: 'WALLET' },
  }));

  const balancePence: number = result.Item?.balancePence ?? 0;

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ balancePence }),
  };
};
