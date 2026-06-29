import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  // Query all ORDER# records for this user
  const ordersResult = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'ORDER#' },
    ScanIndexForward: false,
  }));

  const orders = ordersResult.Items ?? [];
  if (orders.length === 0) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ entries: [] }) };
  }

  // Batch-get draw META for each order to get current status
  const drawIds = orders.map(o => o.drawId as string);
  const keys = drawIds.map(id => ({ PK: `DRAW#${id}`, SK: 'META' }));
  const batchResult = await db.send(new BatchGetCommand({
    RequestItems: { [TABLE]: { Keys: keys } },
  }));

  const drawMap = new Map<string, Record<string, unknown>>();
  for (const item of (batchResult.Responses?.[TABLE] ?? [])) {
    drawMap.set(item.SK === 'META' ? item.PK.replace('DRAW#', '') : '', item as Record<string, unknown>);
  }

  const entries = orders.map(order => {
    const draw = drawMap.get(order.drawId as string);
    return {
      drawId: order.drawId,
      drawTitle: order.drawTitle ?? draw?.title ?? 'Unknown draw',
      drawImageUrl: order.drawImageUrl ?? (draw?.imageUrls as string[] | undefined)?.[0] ?? '',
      ticketCount: order.ticketCount ?? 0,
      ticketPricePence: order.ticketPricePence ?? draw?.ticketPricePence ?? 0,
      enteredAt: order.enteredAt,
      closingDate: order.closingDate ?? draw?.closingDate ?? '',
      status: (draw?.status as string) ?? 'unknown',
      winnerId: draw?.winnerId,
      isWinner: draw?.winnerId === userId,
    };
  });

  return { statusCode: 200, headers: cors, body: JSON.stringify({ entries }) };
};
