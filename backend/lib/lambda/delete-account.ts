import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const TABLE = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const userId = claims?.sub;
  const username = claims?.email ?? userId;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  // Query all items for this user
  let lastKey: Record<string, any> | undefined;
  const allItems: { PK: string; SK: string }[] = [];

  do {
    const result = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `USER#${userId}` },
      ProjectionExpression: 'PK, SK',
      ExclusiveStartKey: lastKey,
    }));
    for (const item of result.Items ?? []) {
      allItems.push({ PK: item.PK as string, SK: item.SK as string });
    }
    lastKey = result.LastEvaluatedKey as Record<string, any> | undefined;
  } while (lastKey);

  // Batch delete in chunks of 25 (DynamoDB limit)
  for (let i = 0; i < allItems.length; i += 25) {
    const chunk = allItems.slice(i, i + 25);
    await db.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE]: chunk.map(key => ({ DeleteRequest: { Key: key } })),
      },
    }));
  }

  // Delete from Cognito
  try {
    await cognito.send(new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }));
  } catch (err: any) {
    // If user not found in Cognito (already deleted), continue — DynamoDB data is gone
    if (err.name !== 'UserNotFoundException') throw err;
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ deleted: true }) };
};
