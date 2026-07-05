import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MIN_TOPUP_PENCE = 500;   // £5 minimum
const MAX_TOPUP_PENCE = 50000; // £500 maximum per transaction

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

    // Use SET…if_not_exists to avoid clobbering concurrent profile writes
    // and to dedup concurrent top-up requests that both try to create a customer.
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
    description: `Bedrawn wallet top-up — £${(amountPence / 100).toFixed(2)}`,
  });

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
  };
};
