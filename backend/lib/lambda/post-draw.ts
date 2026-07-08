import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { cors } from './stripe-client';

// LegitApp cheapest tier per category (prices in GBP pence, sourced from legitapp.com/pricing)
const LEGIT_FEE_MAP: Record<string, { feePence: number; legitCategory: string; turnaround: string }> = {
  'Bags':       { feePence: 800,  legitCategory: 'handbag',     turnaround: '3 hours' },
  'Trainers':   { feePence: 250,  legitCategory: 'sneaker',     turnaround: '30 min'  },
  'Watches':    { feePence: 1200, legitCategory: 'watch',       turnaround: '4 hours' },
  'Jewellery':  { feePence: 800,  legitCategory: 'accessory',   turnaround: '3 hours' },
  'Streetwear': { feePence: 320,  legitCategory: 'streetwear',  turnaround: '4 hours' },
  'Fashion':    { feePence: 800,  legitCategory: 'clothing',    turnaround: '3 hours' },
};

async function submitToLegitApp(drawId: string, legitCategory: string, imageUrls: string[]): Promise<void> {
  const apiKey = process.env.LEGIT_API_KEY;
  const webhookUrl = process.env.LEGIT_WEBHOOK_URL;
  if (!apiKey) {
    console.log('[legit] No API key configured — draw', drawId, 'will require manual activation');
    return;
  }
  const res = await fetch('https://api.legitapp.com/v1/submissions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ external_id: drawId, category: legitCategory, images: imageUrls, webhook_url: webhookUrl }),
  });
  if (!res.ok) throw new Error(`LegitApp ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const submissionId: string = data.id ?? data.submission_id ?? '';
  const db2 = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  await db2.send(new UpdateCommand({
    TableName: process.env.TABLE_NAME!,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
    UpdateExpression: 'SET legitSubmissionId = :id, updatedAt = :now',
    ExpressionAttributeValues: { ':id': submissionId, ':now': new Date().toISOString() },
  }));
  console.log('[legit] submitted draw', drawId, 'submission', submissionId);
}

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
    verificationRequested = false,
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

  const legitInfo = LEGIT_FEE_MAP[String(category)];
  const needsVerification = !!verificationRequested && !!legitInfo;

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
    ticketPricePence,
    totalTickets: totalTicketsNum,
    // Seller-chosen reserve: cancel if fewer than reservePct% of tickets sold by closing time
    minTickets: Math.ceil(totalTicketsNum * (Math.min(100, Math.max(25, Number(reservePct) || 25)) / 100)),
    retailValuePence,
    imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 6) : [],
    // No closingDate at listing time — set automatically by enter-draw when reserve is hit
    sellerId: userId,
    sellerHandle,
    sellerStripeAccountId: sellerRecord.Item.stripeAccountId,
    status: needsVerification ? 'pending_verification' : 'open',
    soldTickets: 0,
    totalRevenuePence: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (needsVerification) {
    draw.verificationProvider = 'legitapp';
    draw.verificationFeePence = legitInfo.feePence;
    draw.verificationTurnaround = legitInfo.turnaround;
  }

  await db.send(new PutCommand({ TableName: TABLE, Item: draw }));

  // Fire LegitApp submission non-blocking — draw is already in pending_verification state
  if (needsVerification && (imageUrls as string[]).length > 0) {
    void submitToLegitApp(drawId, legitInfo.legitCategory, imageUrls as string[]).catch(err => {
      console.warn('[legit] submission failed for draw', drawId, err?.message);
    });
  }

  return {
    statusCode: 201,
    headers: cors,
    body: JSON.stringify({ drawId, pendingVerification: needsVerification }),
  };
};
