import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStripe, cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PLATFORM_FEE_RATE = 0.12; // 12%

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Draw ID required' }) };

  // Load draw record
  const drawRecord = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));

  const draw = drawRecord.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.payoutStatus === 'paid') return { statusCode: 200, headers: cors, body: JSON.stringify({ message: 'Already paid out' }) };
  if (!draw.winnerId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'No winner yet' }) };

  // Winner must be the one confirming delivery
  if (userId !== draw.winnerId) return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only the winner can confirm delivery' }) };

  // Load seller's connected account
  const sellerRecord = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${draw.sellerId}`, SK: 'STRIPE_ACCOUNT' },
  }));

  if (!sellerRecord.Item?.stripeAccountId) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Seller has no Stripe account' }) };
  }

  const totalRevenuePence: number = draw.totalRevenuePence; // all ticket sales
  const sellerPayoutPence = Math.floor(totalRevenuePence * (1 - PLATFORM_FEE_RATE));
  const platformFeePence = totalRevenuePence - sellerPayoutPence;

  const stripe = await getStripe();

  const transfer = await stripe.transfers.create({
    amount: sellerPayoutPence,
    currency: 'gbp',
    destination: sellerRecord.Item.stripeAccountId,
    metadata: {
      drawId,
      sellerId: draw.sellerId,
      winnerId: draw.winnerId,
      platformFeeGBP: (platformFeePence / 100).toFixed(2),
    },
    description: `Bedrawn draw #${drawId} seller payout`,
  });

  // Mark draw as paid in DynamoDB
  await db.send(new UpdateCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
    UpdateExpression: 'SET payoutStatus = :s, stripeTransferId = :t, paidAt = :d, sellerPayoutPence = :p, platformFeePence = :f',
    ExpressionAttributeValues: {
      ':s': 'paid',
      ':t': transfer.id,
      ':d': new Date().toISOString(),
      ':p': sellerPayoutPence,
      ':f': platformFeePence,
    },
  }));

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      message: 'Payout complete',
      sellerPayout: `£${(sellerPayoutPence / 100).toFixed(2)}`,
      platformFee: `£${(platformFeePence / 100).toFixed(2)}`,
      transferId: transfer.id,
    }),
  };
};
