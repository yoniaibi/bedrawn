import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const savedResult = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'SAVED#' },
    ScanIndexForward: false,
  }));

  const saved = savedResult.Items ?? [];
  if (saved.length === 0) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ draws: [] }) };
  }

  const keys = saved.map(s => ({ PK: `DRAW#${s.drawId}`, SK: 'META' }));
  const batchResult = await db.send(new BatchGetCommand({
    RequestItems: { [TABLE]: { Keys: keys } },
  }));

  const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' }).split('/').reverse().join('-');

  const draws = (batchResult.Responses?.[TABLE] ?? [])
    .filter(item => item.status === 'open')
    .map(item => ({
      id: item.PK.replace('DRAW#', ''),
      title: item.title,
      seller: item.sellerHandle ?? '',
      ticketPrice: item.ticketPricePence,
      retailValue: Math.round((item.retailValuePence as number) / 100),
      totalTickets: item.totalTickets,
      soldTickets: item.soldTickets,
      isClosingTonight: item.closingDate === today,
      imageUrl: (item.imageUrls as string[] | undefined)?.[0] ?? '',
      status: item.status,
      category: item.category ?? '',
    }));

  return { statusCode: 200, headers: cors, body: JSON.stringify({ draws }) };
};
