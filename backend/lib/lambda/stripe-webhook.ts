import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getStripe } from './stripe-client';

const ssm = new SSMClient({ region: 'eu-west-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const stripe = await getStripe();
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = event.headers['stripe-signature'] ?? '';
  const rawBody = event.body ?? '';

  let stripeEvent;
  try {
    if (!platformSecret) throw new Error('Webhook secret not configured');
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, platformSecret);
    } catch {
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
      const pi = stripeEvent.data.object as any;
      const { userId, type } = pi.metadata ?? {};
      if (type !== 'wallet_topup' || !userId) break;

      const amountPence: number = pi.amount;
      const piId: string = pi.id;
      const topupAt = new Date().toISOString();

      // Single atomic transaction: idempotency marker + wallet credit + TX record.
      // If the dedup Put's condition fails (marker already exists), the whole
      // transaction is cancelled → we catch ConditionalCheckFailed and skip.
      // This eliminates the previous race where the marker was written but the
      // wallet credit was never applied (money lost on retry suppression).
      try {
        await db.send(new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLE,
                Item: {
                  PK: `DEDUP#${piId}`,
                  SK: 'PAYMENT_INTENT',
                  processedAt: topupAt,
                  ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
                },
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
            {
              Update: {
                TableName: TABLE,
                Key: { PK: `USER#${userId}`, SK: 'WALLET' },
                UpdateExpression: 'ADD balancePence :amt SET updatedAt = :d',
                ExpressionAttributeValues: { ':amt': amountPence, ':d': topupAt },
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  PK: `USER#${userId}`,
                  SK: `TX#${topupAt}`,
                  type: 'topup',
                  description: 'Wallet top-up',
                  amountPence,
                  createdAt: topupAt,
                },
              },
            },
          ],
        }));
      } catch (err: any) {
        if (err.name === 'TransactionCanceledException') {
          const reasons = err.CancellationReasons ?? [];
          if (reasons[0]?.Code === 'ConditionalCheckFailed') {
            console.log(`Duplicate webhook for PaymentIntent [REDACTED] — skipping`);
            break;
          }
        }
        throw err;
      }
      break;
    }

    case 'account.updated': {
      const account = stripeEvent.data.object as any;
      const accountId = account.id as string;

      const lookup = await db.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `STRIPE#${accountId}`, SK: 'USER' },
      }));

      const ownerId = lookup.Item?.userId as string | undefined;
      if (!ownerId) {
        console.log(`No user found for Stripe account — skipping`);
        break;
      }

      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${ownerId}`, SK: 'STRIPE_ACCOUNT' },
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
      // Log failure without leaking the user sub
      console.log(`Payment failed:`, pi.last_payment_error?.code ?? 'unknown');
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
