import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'TX#' },
    ScanIndexForward: false,
    Limit: 50,
  }));

  const transactions = (result.Items ?? []).map(item => ({
    id: item.SK as string,
    type: item.type as string,
    description: item.description as string,
    amountPence: item.amountPence as number,
    drawId: item.drawId as string | undefined,
    createdAt: item.createdAt as string,
  }));

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ transactions }),
  };
};
