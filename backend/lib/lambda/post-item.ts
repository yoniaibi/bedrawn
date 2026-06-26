import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const body = event.body ? JSON.parse(event.body) : {};
  const id = randomUUID();
  const item = { PK: `ITEM#${id}`, SK: 'META', id, ...body, createdAt: new Date().toISOString() };

  await client.send(new PutCommand({ TableName: process.env.TABLE_NAME, Item: item }));

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  };
};
