import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

// DEV_SEED: new users get a free £50 so they can test the full purchase flow
// without topping up. Remove DEV_SEED from the Lambda env to disable before go-live.
const DEV_SEED_PENCE = process.env.DEV_SEED === 'true' ? 5000 : 0;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'WALLET' },
  }));

  if (!result.Item && DEV_SEED_PENCE > 0) {
    // First-time access in dev mode — seed the wallet
    try {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'WALLET',
          balancePence: DEV_SEED_PENCE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          seeded: true,
        },
        ConditionExpression: 'attribute_not_exists(PK)', // race-safe: ignore if concurrent request won
      }));
    } catch { /* ConditionalCheckFailedException = concurrent seed — safe to ignore */ }
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ balancePence: DEV_SEED_PENCE }),
    };
  }

  const balancePence: number = result.Item?.balancePence ?? 0;

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ balancePence }),
  };
};
