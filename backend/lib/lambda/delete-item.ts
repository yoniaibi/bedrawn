import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const id = event.pathParameters?.id;
  if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing id' }) };

  try {
    await client.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `ITEM#${id}`, SK: 'META' },
      ConditionExpression: 'sellerId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Forbidden' }) };
    }
    throw err;
  }

  return { statusCode: 204, headers: cors, body: '' };
};
