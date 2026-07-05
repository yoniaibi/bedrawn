import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await client.send(new ScanCommand({
    TableName: process.env.TABLE_NAME,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta AND sellerId = :uid',
    ExpressionAttributeValues: { ':prefix': 'ITEM#', ':meta': 'META', ':uid': userId },
  }));

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ items: result.Items ?? [] }),
  };
};
