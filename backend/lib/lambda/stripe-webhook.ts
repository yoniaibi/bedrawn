import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const stripe = await getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Verify webhook signature
  let stripeEvent;
  try {
    if (!webhookSecret) throw new Error('Webhook secret not configured');
    stripeEvent = stripe.webhooks.constructEvent(
      event.body ?? '',
      event.headers['stripe-signature'] ?? '',
      webhookSecret,
    );
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
