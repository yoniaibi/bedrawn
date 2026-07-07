import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function ukToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub as string | undefined;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const today = ukToday();

  try {
    // Idempotency: conditional write — fails if already claimed today
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `GRAND#${today}`,
        claimedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 400 * 24 * 3600, // ~13 months
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Already claimed today', claimedToday: true }) };
    }
    throw err;
  }

  // Increment global entry count
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: 'GRAND#CONFIG', SK: 'META' },
    UpdateExpression: 'ADD totalEntries :one',
    ExpressionAttributeValues: { ':one': 1 },
  }));

  return { statusCode: 200, headers: cors, body: JSON.stringify({ claimed: true, claimedToday: true }) };
};
