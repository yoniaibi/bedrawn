import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { cors } from './stripe-client';
import { recordEvent, upsertCatalogueItem } from '../analytics/client';
import { toItemSlug, type BrandId } from '../analytics/types';

// LegitApp cheapest tier per category (prices in GBP pence, sourced from legitapp.com/pricing).
// Post-draw no longer submits to LegitApp — authentication now happens after resolution
// (admin-resolve-draw / resolve-draws), which import this map for the category lookup.
export const LEGIT_FEE_MAP: Record<string, { feePence: number; legitCategory: string; turnaround: string }> = {
  'Bags':       { feePence: 800,  legitCategory: 'handbag',     turnaround: '3 hours' },
  'Trainers':   { feePence: 250,  legitCategory: 'sneaker',     turnaround: '30 min'  },
  'Watches':    { feePence: 1200, legitCategory: 'watch',       turnaround: '4 hours' },
  'Jewellery':  { feePence: 800,  legitCategory: 'accessory',   turnaround: '3 hours' },
  'Streetwear': { feePence: 320,  legitCategory: 'streetwear',  turnaround: '4 hours' },
  'Fashion':    { feePence: 800,  legitCategory: 'clothing',    turnaround: '3 hours' },
};

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

function ukDatePlusDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toLocaleDateString('en-GB', { timeZone: 'Europe/London' }).split('/').reverse().join('-');
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
  let sellerRecord = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
  }));

  if (!sellerRecord.Item?.chargesEnabled) {
    // DEV_SEED: auto-approve seller so listing works without KYC. Remove before go-live.
    if (process.env.DEV_SEED === 'true') {
      try {
        await db.send(new PutCommand({
          TableName: TABLE,
          Item: {
            PK: `USER#${userId}`,
            SK: 'STRIPE_ACCOUNT',
            stripeAccountId: 'dev_auto_approved',
            chargesEnabled: true,
            payoutsEnabled: true,
            status: 'dev_approved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(PK)',
        }));
      } catch { /* already exists — fine */ }
      sellerRecord = { Item: { stripeAccountId: 'dev_auto_approved', chargesEnabled: true }, $metadata: {} } as typeof sellerRecord;
    } else {
      return {
        statusCode: 403, headers: cors,
        body: JSON.stringify({ error: 'Complete Stripe seller verification before listing.' }),
      };
    }
  }

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }
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
    drawDurationDays = 30, // seller-chosen: 14 / 21 / 30 / 60
    brandId,           // BrandId | undefined — from ListItemScreen brand step
    sellerTier,        // SellerTier | undefined
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

  if (ticketPricePence < 1 || totalTicketsNum < 1 || retailValuePence < 1) {
    return {
      statusCode: 400, headers: cors,
      body: JSON.stringify({ error: 'ticketPrice, totalTickets, and retailValue must all be positive' }),
    };
  }

  const drawId = randomUUID();
  const now = new Date().toISOString();

  // Enforce minimum 7-day listing period; clamp seller choice to valid options
  const durationDays = Math.max(7, [14, 21, 30, 60].includes(Number(drawDurationDays)) ? Number(drawDurationDays) : 30);
  const endsAt = ukDatePlusDays(durationDays);
  const postalDeadline = ukDatePlusDays(durationDays - 4); // 4-day postal buffer before close

  const brandIdStr = typeof brandId === 'string' ? brandId : undefined;
  const itemSlug = brandIdStr ? toItemSlug(brandIdStr, String(title)) : undefined;

  const draw: Record<string, unknown> = {
    PK: `DRAW#${drawId}`,
    SK: 'META',
    id: drawId,
    title: String(title).slice(0, 200),
    description: String(description).slice(0, 2000),
    category: String(category),
    style: String(style),
    condition: String(condition),
    type: String(type),
    brandId: brandIdStr,
    itemSlug,
    sellerTier: sellerTier ?? null,
    ticketPricePence,
    totalTickets: totalTicketsNum,
    // Seller-chosen reserve: cancel if fewer than reservePct% of tickets sold by closing time
    minTickets: Math.ceil(totalTicketsNum * (Math.min(100, Math.max(25, Number(reservePct) || 25)) / 100)),
    retailValuePence,
    imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 6) : [],
    endsAt,
    closingDate: endsAt,
    postalDeadline,
    sellerId: userId,
    sellerHandle,
    sellerStripeAccountId: sellerRecord.Item?.stripeAccountId ?? '',
    // Draws go live immediately — LegitApp authentication now happens post-resolution
    status: 'open',
    soldTickets: 0,
    totalRevenuePence: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: draw }));

  // Analytics: fire draw_created event and upsert catalogue item
  if (brandIdStr) {
    recordEvent(drawId, 'draw_created', {
      brandId: brandIdStr,
      itemSlug,
      ticketPricePence,
      totalTickets: totalTicketsNum,
      retailValueGBP: retailValuePence / 100,
      condition: String(condition),
    }, { brandId: brandIdStr as BrandId, itemSlug });

    if (itemSlug) {
      upsertCatalogueItem({
        itemSlug,
        brandId: brandIdStr as BrandId,
        modelName: String(title).slice(0, 100),
        retailValueGBP: retailValuePence / 100,
        listedAt: now,
      });
    }
  }

  return {
    statusCode: 201,
    headers: cors,
    body: JSON.stringify({ drawId }),
  };
};
