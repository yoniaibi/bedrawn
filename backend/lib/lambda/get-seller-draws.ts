import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const GSI = process.env.GSI_NAME ?? 'GSI1';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop&q=80';

function ukDateToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

function toDrawShape(item: Record<string, any>) {
  const today = ukDateToday();
  return {
    id: item.id,
    title: item.title ?? '',
    seller: item.sellerHandle ?? item.sellerId?.slice(0, 8) ?? 'seller',
    sellerId: item.sellerId ?? '',
    sellerName: item.sellerName ?? '',
    sellerAvatarUrl: item.sellerAvatarUrl ?? '',
    sellerEmoji: '',
    ticketPrice: item.ticketPricePence ?? 0,
    retailValue: (item.retailValuePence ?? 0) / 100,
    totalTickets: item.totalTickets ?? 0,
    soldTickets: item.soldTickets ?? 0,
    category: item.category ?? 'Fashion',
    style: item.style ?? 'Unisex',
    condition: item.condition ?? 'Good',
    isBundle: item.type === 'bundle',
    isClosingTonight: item.closingDate === today,
    isVerified: true,
    description: item.description ?? '',
    imageUrl: item.imageUrls?.[0] ?? DEFAULT_IMAGE,
    tags: item.tags ?? [],
    status: item.status,
    closingDate: item.closingDate,
  };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const sellerId = event.pathParameters?.id;
  if (!sellerId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing seller id' }) };

  let items: Record<string, any>[] = [];

  try {
    // Query open draws via GSI, filter by sellerId
    const result = await db.send(new QueryCommand({
      TableName: TABLE,
      IndexName: GSI,
      KeyConditionExpression: '#s = :open',
      FilterExpression: 'sellerId = :sid',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':open': 'open', ':sid': sellerId },
      Limit: 100,
    }));
    items = (result.Items ?? []) as Record<string, any>[];
  } catch {
    // Fallback: scan for this seller's draws
    try {
      const result = await db.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta AND sellerId = :sid AND #s = :open',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':prefix': 'DRAW#', ':meta': 'META', ':sid': sellerId, ':open': 'open' },
      }));
      items = (result.Items ?? []) as Record<string, any>[];
    } catch {
      // Return empty rather than error
    }
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ draws: items.map(toDrawShape) }),
  };
};
