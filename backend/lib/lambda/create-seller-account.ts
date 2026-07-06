import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  let body: Record<string, unknown>;
  try { body = event.body ? JSON.parse(event.body) : {}; }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }
  const { returnUrl, statusCheck } = body as { returnUrl?: string; statusCheck?: boolean };

  // Fetch existing DB record first
  const existing = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
  }));

  // Status-check mode: return current status without creating an account or generating a link
  if (statusCheck) {
    if (!existing.Item?.stripeAccountId) {
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ stripeAccountId: null, chargesEnabled: false, payoutsEnabled: false, onboardingUrl: null }),
      };
    }
    // If already verified in DB, trust the cached value — avoids hitting Stripe for test/bypassed accounts
    if (existing.Item.chargesEnabled) {
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({
          stripeAccountId: existing.Item.stripeAccountId,
          chargesEnabled: true,
          payoutsEnabled: existing.Item.payoutsEnabled ?? true,
          onboardingUrl: null,
        }),
      };
    }
    // Not yet verified — refresh from Stripe
    try {
      const stripe = await getStripe();
      const account = await stripe.accounts.retrieve(existing.Item.stripeAccountId as string);
      await db.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
        UpdateExpression: 'SET chargesEnabled = :c, payoutsEnabled = :p, updatedAt = :d',
        ExpressionAttributeValues: {
          ':c': account.charges_enabled ?? false,
          ':p': account.payouts_enabled ?? false,
          ':d': new Date().toISOString(),
        },
      }));
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({
          stripeAccountId: existing.Item.stripeAccountId,
          chargesEnabled: account.charges_enabled ?? false,
          payoutsEnabled: account.payouts_enabled ?? false,
          onboardingUrl: null,
        }),
      };
    } catch {
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({
          stripeAccountId: existing.Item.stripeAccountId,
          chargesEnabled: existing.Item.chargesEnabled ?? false,
          payoutsEnabled: existing.Item.payoutsEnabled ?? false,
          onboardingUrl: null,
        }),
      };
    }
  }

  const stripe = await getStripe();
  let accountId: string;

  if (existing.Item?.stripeAccountId) {
    accountId = existing.Item.stripeAccountId as string;
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

    // Write reverse lookup so account.updated webhook can resolve userId from accountId
    await db.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `STRIPE#${accountId}`,
        SK: 'USER',
        userId,
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
