import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';
import { getMonthlyTopups } from './safer-play';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MIN_TOPUP_PENCE = 500;   // £5 minimum
const MAX_TOPUP_PENCE = 50000; // £500 maximum per transaction
const CC_CAP_PENCE    = 25000; // £250 credit-card monthly cap

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  let body: Record<string, unknown>;
  try { body = event.body ? JSON.parse(event.body) : {}; }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }
  const amountPence = body.amountPence as number;

  if (!Number.isInteger(amountPence) || amountPence < MIN_TOPUP_PENCE) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Minimum top-up is £${MIN_TOPUP_PENCE / 100}` }) };
  }
  if (amountPence > MAX_TOPUP_PENCE) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Maximum top-up is £${MAX_TOPUP_PENCE / 100} per transaction` }) };
  }

  // Safer play checks — read profile + monthly spend before charging
  const [profileRes, topups] = await Promise.all([
    db.send(new GetCommand({ TableName: process.env.TABLE_NAME, Key: { PK: `USER#${userId}`, SK: 'PROFILE' } })),
    getMonthlyTopups(userId),
  ]);
  const profile = profileRes.Item ?? {};

  // Account suspension
  if (profile.suspendedUntil) {
    const until = new Date(profile.suspendedUntil).getTime();
    if (!isNaN(until) && until > Date.now()) {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Your account is currently suspended. Visit Safer Play to learn more.' }) };
    }
  }

  // Monthly spend limit (£0 = fully paused)
  if (typeof profile.spendLimitPence === 'number') {
    if (profile.spendLimitPence === 0) {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Spending is paused on your account. Visit Safer Play to change your limit.' }) };
    }
    const projectedSpend = topups.monthlySpendPence + amountPence;
    if (projectedSpend > profile.spendLimitPence) {
      const remaining = Math.max(0, profile.spendLimitPence - topups.monthlySpendPence);
      return {
        statusCode: 403,
        headers: cors,
        body: JSON.stringify({
          error: `This top-up would exceed your £${(profile.spendLimitPence / 100).toFixed(0)} monthly spend limit. You have £${(remaining / 100).toFixed(2)} remaining this month.`,
        }),
      };
    }
  }

  const stripe = await getStripe();

  // Get or create Stripe customer for this user
  const userRecord = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
  }));

  let stripeCustomerId: string;

  if (userRecord.Item?.stripeCustomerId) {
    stripeCustomerId = userRecord.Item.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    stripeCustomerId = customer.id;

    await db.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET stripeCustomerId = if_not_exists(stripeCustomerId, :id)',
      ExpressionAttributeValues: { ':id': stripeCustomerId },
    }));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    metadata: { userId, type: 'wallet_topup' },
    description: `bedrawn wallet top-up — £${(amountPence / 100).toFixed(2)}`,
  });

  // CC cap is enforced post-payment in the Stripe webhook (card funding is only
  // known after payment confirmation). Flag the pending amount so the webhook can
  // reject credit-card top-ups that breach CC_CAP_PENCE = £250/month.
  // We store the limit in metadata so the webhook can reference it without a DB read.
  await stripe.paymentIntents.update(paymentIntent.id, {
    metadata: {
      userId,
      type: 'wallet_topup',
      ccCapPence: String(CC_CAP_PENCE),
      ccTopupMtdPence: String(topups.ccTopupMtdPence),
    },
  });

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
  };
};
