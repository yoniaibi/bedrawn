import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  // API GW passes cognito:groups as "[admin]" (no quotes inside) — not valid JSON
  const raw = String(claims?.['cognito:groups'] ?? '');
  const groups = raw.replace(/^\[|\]$/g, '').split(',').map(g => g.trim()).filter(Boolean);

  if (!groups.includes('admin')) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const result = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta',
    ExpressionAttributeValues: { ':prefix': 'DRAW#', ':meta': 'META' },
  }));

  const draws = (result.Items ?? []).map(item => ({
    id: item.id,
    title: item.title,
    status: item.status,
    sellerId: item.sellerId,
    sellerHandle: item.sellerHandle,
    ticketPricePence: item.ticketPricePence,
    totalTickets: item.totalTickets,
    soldTickets: item.soldTickets,
    minTickets: item.minTickets,
    retailValuePence: item.retailValuePence,
    closingDate: item.closingDate,
    winnerId: item.winnerId,
    cancelReason: item.cancelReason,
    resolvedAt: item.resolvedAt,
    createdAt: item.createdAt,
    category: item.category,
    imageUrls: item.imageUrls,
  })).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const counts = draws.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ draws, counts }),
  };
};
