import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const email = (body.email ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  const PK = 'WAITLIST';
  const SK = `EMAIL#${email}`;

  // Idempotent — ignore if already registered
  const existing = await client.send(new GetCommand({ TableName: process.env.TABLE_NAME, Key: { PK, SK } }));
  if (existing.Item) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ message: 'Already on the waitlist' }) };
  }

  await client.send(new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: { PK, SK, email, name: body.name ?? '', joinedAt: new Date().toISOString() },
  }));

  return { statusCode: 201, headers: cors, body: JSON.stringify({ message: 'You\'re on the waitlist!' }) };
};
