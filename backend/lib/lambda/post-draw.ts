import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function getUKClosingDate(): string {
  const now = new Date();
  const ukHour = parseInt(
    new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
      .toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }),
    10,
  );
  // If submitted after 9pm UK, draw closes tomorrow night
  const target = ukHour >= 21 ? new Date(now.getTime() + 86_400_000) : now;
  return target.toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

function parseTicketPricePence(raw: unknown): number {
  const s = String(raw ?? '').trim();
  if (s.endsWith('p')) return parseInt(s, 10);
  if (s.startsWith('£')) return Math.round(parseFloat(s.slice(1)) * 100);
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 25;
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const userId = claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  // Derive a display handle from the Cognito email claim
  const email: string = claims?.email ?? '';
  const sellerHandle = email.split('@')[0] || userId.slice(0, 8);

  // Seller must have a verified Stripe account
  const sellerRecord = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
  }));
  if (!sellerRecord.Item?.chargesEnabled) {
    return {
      statusCode: 403, headers: cors,
      body: JSON.stringify({ error: 'Complete Stripe seller verification before listing.' }),
    };
  }

  const body = JSON.parse(event.body ?? '{}');
  const {
    title,
    description = '',
    category = 'Fashion',
    style = 'Unisex',
    condition = 'Good',
    type = 'single',
    ticketPrice,       // string from wizard: '10p', '25p', '50p', '£1'
    totalTickets,
    retailValue,       // pounds (e.g. "6800")
    reservePct,        // seller-chosen reserve: 25 | 50 | 75 | 100 (default 25)
    imageUrls = [],
    closingDate,       // optional override (YYYY-MM-DD); defaults to tonight/tomorrow
  } = body;

  if (!title || !ticketPrice || !totalTickets || !retailValue) {
    return {
      statusCode: 400, headers: cors,
      body: JSON.stringify({ error: 'Required: title, ticketPrice, totalTickets, retailValue' }),
    };
  }

  const ticketPricePence = parseTicketPricePence(ticketPrice);
  const totalTicketsNum = Math.max(1, Math.round(Number(totalTickets)));
  const retailValuePence = Math.round(parseFloat(String(retailValue)) * 100);
  const resolvedClosingDate: string = closingDate ?? getUKClosingDate();

  if (ticketPricePence < 1 || totalTicketsNum < 1 || retailValuePence < 1) {
    return {
      statusCode: 400, headers: cors,
      body: JSON.stringify({ error: 'ticketPrice, totalTickets, and retailValue must all be positive' }),
    };
  }

  const drawId = randomUUID();
  const now = new Date().toISOString();

  const draw = {
    PK: `DRAW#${drawId}`,
    SK: 'META',
    id: drawId,
    title: String(title).slice(0, 200),
    description: String(description).slice(0, 2000),
    category: String(category),
    style: String(style),
    condition: String(condition),
    type: String(type),
    ticketPricePence,
    totalTickets: totalTicketsNum,
    // Seller-chosen reserve: cancel if fewer than reservePct% of tickets sold by closing time
    minTickets: Math.ceil(totalTicketsNum * (Math.min(100, Math.max(25, Number(reservePct) || 25)) / 100)),
    retailValuePence,
    imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 6) : [],
    closingDate: resolvedClosingDate,
    sellerId: userId,
    sellerHandle,
    sellerStripeAccountId: sellerRecord.Item.stripeAccountId,
    status: 'open',
    soldTickets: 0,
    totalRevenuePence: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: draw }));

  return {
    statusCode: 201,
    headers: cors,
    body: JSON.stringify({ drawId, closingDate: resolvedClosingDate }),
  };
};
