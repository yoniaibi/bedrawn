import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const body = JSON.parse(event.body ?? '{}');
  const { returnUrl, statusCheck } = body;
  const stripe = await getStripe();

  // Fetch existing DB record
  const existing = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
  }));

  let accountId: string;

  if (existing.Item?.stripeAccountId) {
    accountId = existing.Item.stripeAccountId;
  } else {
    // Create new Express account
    const account = await stripe.accounts.create({
      controller: {
        stripe_dashboard: { type: 'express' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
      },
      country: 'GB',
      capabilities: { transfers: { requested: true } },
    });
    accountId = account.id;

    await db.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'STRIPE_ACCOUNT',
        stripeAccountId: accountId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    }));
  }

  // Fetch live account status from Stripe
  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  // Update DB with latest status
  await db.send(new UpdateCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
    UpdateExpression: 'SET chargesEnabled = :c, payoutsEnabled = :p, updatedAt = :d',
    ExpressionAttributeValues: {
      ':c': chargesEnabled,
      ':p': payoutsEnabled,
      ':d': new Date().toISOString(),
    },
  }));

  // Status-check mode: return status without generating a new onboarding link
  if (statusCheck) {
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ stripeAccountId: accountId, chargesEnabled, payoutsEnabled, onboardingUrl: null }),
    };
  }

  // Generate fresh onboarding link
  const origin = event.headers?.origin ?? 'https://www.bedrawn.app';
  const resolvedReturnUrl = returnUrl ?? `${origin}/seller/dashboard`;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/seller/dashboard`,
    return_url: resolvedReturnUrl,
    type: 'account_onboarding',
  });

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      stripeAccountId: accountId,
      chargesEnabled,
      payoutsEnabled,
      onboardingUrl: accountLink.url,
    }),
  };
};
