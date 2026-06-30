import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const GSI = process.env.GSI_NAME ?? 'GSI1';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const sellerId = event.pathParameters?.id;
  if (!sellerId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing seller id' }) };

  const profileResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${sellerId}`, SK: 'PROFILE' },
  }));

  if (!profileResult.Item) {
    return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Seller not found' }) };
  }

  const profile = profileResult.Item as Record<string, any>;

  // Count resolved draws + total value given away (best-effort via GSI or scan)
  let completedDraws = 0;
  let totalValuePence = 0;

  try {
    const drawsResult = await db.send(new QueryCommand({
      TableName: TABLE,
      IndexName: GSI,
      KeyConditionExpression: '#s = :resolved',
      FilterExpression: 'sellerId = :sid',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':resolved': 'resolved', ':sid': sellerId },
      Limit: 500,
    }));
    const items = (drawsResult.Items ?? []) as Record<string, any>[];
    completedDraws = items.length;
    totalValuePence = items.reduce((sum, item) => sum + (item.retailValuePence ?? 0), 0);
  } catch {
    // GSI may not support filter on sellerId — fall back to scan
    try {
      const scanResult = await db.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta AND #s = :resolved AND sellerId = :sid',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':prefix': 'DRAW#', ':meta': 'META', ':resolved': 'resolved', ':sid': sellerId },
      }));
      const items = (scanResult.Items ?? []) as Record<string, any>[];
      completedDraws = items.length;
      totalValuePence = items.reduce((sum, item) => sum + (item.retailValuePence ?? 0), 0);
    } catch {
      // Non-fatal — return zeros
    }
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      id: sellerId,
      handle: profile.handle ?? `seller_${sellerId.slice(0, 6)}`,
      name: profile.name ?? '',
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      memberSince: profile.createdAt ?? null,
      completedDraws,
      totalValueGiven: totalValuePence / 100,
    }),
  };
};
