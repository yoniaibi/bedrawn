import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MIN_TOPUP_PENCE = 500; // £5 minimum to keep Stripe fees manageable

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const amountPence: number = body.amountPence;

  if (!amountPence || amountPence < MIN_TOPUP_PENCE) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Minimum top-up is £${MIN_TOPUP_PENCE / 100}` }) };
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

    await db.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        ...(userRecord.Item ?? {}),
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        stripeCustomerId,
      },
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
