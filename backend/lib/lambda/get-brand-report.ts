/**
 * GET /analytics/brands/:brandId?period=all_time
 * Admin-only endpoint — returns brand aggregate + catalogue items.
 *
 * This is the data handback endpoint for brand partnership reports.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim());

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const email = (event.requestContext as any).authorizer?.jwt?.claims?.email as string | undefined;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const brandId = event.pathParameters?.brandId;
  if (!brandId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing brandId' }) };

  const period = event.queryStringParameters?.period ?? 'all_time';
  const includeDraws = event.queryStringParameters?.includeDraws === 'true';

  // Aggregate for the requested period
  const aggResult = await db.send(new QueryCommand({
    TableName: ANALYTICS_TABLE,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `BRAND#${brandId}`,
      ':sk': `AGGREGATE#${period}`,
    },
  }));

  // All available periods for this brand
  const periodsResult = await db.send(new QueryCommand({
    TableName: ANALYTICS_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `BRAND#${brandId}`, ':prefix': 'AGGREGATE#' },
    ProjectionExpression: 'SK',
  }));

  // Catalogue items for this brand via GSI
  const catalogueResult = await db.send(new QueryCommand({
    TableName: ANALYTICS_TABLE,
    IndexName: 'GSI-brandId-item',
    KeyConditionExpression: 'brandId_itemSlug = :b',
    ExpressionAttributeValues: { ':b': `BRAND#${brandId}` },
  }));

  // Individual draw summaries (optional — for detailed CSV export)
  let draws: unknown[] = [];
  if (includeDraws) {
    const drawsResult = await db.send(new ScanCommand({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'SK = :s AND brandId = :b',
      ExpressionAttributeValues: { ':s': 'SUMMARY', ':b': brandId },
    }));
    draws = drawsResult.Items ?? [];
    // Sort newest first
    (draws as any[]).sort((a: any, b: any) => b.closedAt.localeCompare(a.closedAt));
  }

  const availablePeriods = (periodsResult.Items ?? [])
    .map((i: any) => (i.SK as string).replace('AGGREGATE#', ''))
    .sort()
    .reverse();

  const aggregate = aggResult.Items?.[0] ?? null;

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      brandId,
      period,
      aggregate,
      availablePeriods,
      catalogue: (catalogueResult.Items ?? []).sort((a: any, b: any) =>
        (b.completedDraws ?? 0) - (a.completedDraws ?? 0),
      ),
      ...(includeDraws ? { draws } : {}),
    }),
  };
};
