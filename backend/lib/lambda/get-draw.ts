import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop&q=80';

function ukDateToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const id = event.pathParameters?.id;
  if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw id' }) };

  const result = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${id}`, SK: 'META' },
  }));

  if (!result.Item) {
    return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  }

  const item = result.Item as Record<string, any>;
  const today = ukDateToday();

  // Fetch entry count for this user (if authed) — read from ENTRY records
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  let userTickets = 0;
  if (claims?.sub) {
    const entryResult = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${id}`, SK: `ENTRY#${claims.sub}` },
    }));
    userTickets = (entryResult.Item as any)?.ticketCount ?? 0;
  }

  // Fetch winner's handle if draw is resolved
  let winnerHandle: string | undefined;
  if (item.status === 'resolved' && item.winnerId) {
    const winnerProfile = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${item.winnerId}`, SK: 'PROFILE' },
    }));
    winnerHandle = (winnerProfile.Item as any)?.handle
      ?? `user_${(item.winnerId as string).slice(0, 6)}`;
  }

  const draw = {
    id: item.id,
    title: item.title ?? '',
    description: item.description ?? '',
    seller: item.sellerHandle ?? 'seller',
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
    isVerified: !!item.certificateUrl,
    imageUrl: item.imageUrls?.[0] ?? DEFAULT_IMAGE,
    imageUrls: item.imageUrls ?? [],
    tags: item.tags ?? [],
    status: item.status,
    closingDate: item.closingDate,
    endsAt: item.endsAt,
    postalDeadline: item.postalDeadline,
    earlyClose: item.earlyClose ?? false,
    certificateUrl: item.certificateUrl,
    verificationProvider: item.verificationProvider,
    // winnerHandle is safe to expose; winnerId (Cognito sub) is never sent
    winnerHandle: item.status === 'resolved' ? winnerHandle : undefined,
    resolvedAt: item.resolvedAt,
    userTickets,
  };

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ draw }),
  };
};
