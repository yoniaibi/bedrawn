import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getStripe } from './stripe-client';

const ssm = new SSMClient({ region: 'eu-west-1' });

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const stripe = await getStripe();
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = event.headers['stripe-signature'] ?? '';
  const rawBody = event.body ?? '';

  // Try platform secret first, then Connect secret (they have different signing keys)
  let stripeEvent;
  try {
    if (!platformSecret) throw new Error('Webhook secret not configured');
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, platformSecret);
    } catch {
      // May be a Connect event — fetch Connect secret from SSM and retry
      const connectSecretResult = await ssm.send(new GetParameterCommand({
        Name: '/bedrawn/stripe/connect-webhook-secret',
        WithDecryption: true,
      }));
      const connectSecret = connectSecretResult.Parameter?.Value;
      if (!connectSecret) throw new Error('Connect webhook secret not configured');
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, connectSecret);
    }
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid webhook signature' }) };
  }

  switch (stripeEvent.type) {
    case 'payment_intent.succeeded': {
      // Wallet top-up confirmed — credit user's balance in DynamoDB
      const pi = stripeEvent.data.object as any;
      const { userId, type } = pi.metadata ?? {};
      if (type !== 'wallet_topup' || !userId) break;

      const amountPence: number = pi.amount;

      await db.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'WALLET' },
        UpdateExpression: 'ADD balancePence :amt SET updatedAt = :d',
        ExpressionAttributeValues: {
          ':amt': amountPence,
          ':d': new Date().toISOString(),
        },
      }));
      break;
    }

    case 'account.updated': {
      // Seller's Express account verification changed
      const account = stripeEvent.data.object as any;
      const accountId = account.id;

      // Find which user owns this Stripe account
      const isEnabled = account.charges_enabled && account.payouts_enabled;

      // Look up by scanning (in production, maintain an index or GSI)
      await db.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `STRIPE#${accountId}`, SK: 'ACCOUNT' },
        UpdateExpression: 'SET chargesEnabled = :c, payoutsEnabled = :p, updatedAt = :d',
        ExpressionAttributeValues: {
          ':c': account.charges_enabled,
          ':p': account.payouts_enabled,
          ':d': new Date().toISOString(),
        },
      }));
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = stripeEvent.data.object as any;
      const { userId } = pi.metadata ?? {};
      if (!userId) break;
      // Could notify user — for now just log via CloudWatch
      console.log(`Payment failed for user ${userId}:`, pi.last_payment_error?.message);
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
