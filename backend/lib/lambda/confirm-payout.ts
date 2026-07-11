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

  // Payout can only be confirmed once the seller has shipped (in_transit) and no dispute is open
  if (draw.status !== 'in_transit') {
    const reason =
      draw.status === 'pending_auth' ? 'Item is still being authenticated' :
      draw.status === 'pending_shipment' ? 'Seller has not uploaded tracking yet' :
      draw.status === 'disputed' ? 'A dispute is open on this draw — payout is on hold' :
      draw.status === 'complete' ? 'Draw is already complete' :
      `Draw is not in transit (status: ${draw.status})`;
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: reason }) };
  }

  const isPostalWinner = (draw.winnerId as string).startsWith('POSTAL_');
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e: string) => e.trim()).filter(Boolean);
  const callerEmail = (event.requestContext as any).authorizer?.jwt?.claims?.email as string | undefined;
  const callerIsAdmin = callerEmail ? ADMIN_EMAILS.includes(callerEmail) : false;

  // Postal winners have no account — only an admin can confirm payout after physical delivery.
  // Regular winners: only the winner themselves can confirm.
  if (isPostalWinner) {
    if (!callerIsAdmin) {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only an admin can confirm payout for a postal winner' }) };
    }
  } else {
    if (userId !== draw.winnerId) {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Only the winner can confirm delivery' }) };
    }
  }

  // Load seller's connected account
  const sellerRecord = await db.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${draw.sellerId}`, SK: 'STRIPE_ACCOUNT' },
  }));

  if (!sellerRecord.Item?.stripeAccountId) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Seller has no Stripe account' }) };
  }

  const totalRevenuePence: number = (draw.totalRevenuePence as number) ?? 0;
  if (!totalRevenuePence || isNaN(totalRevenuePence)) {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'No ticket revenue recorded — cannot pay out' }) };
  }
  const sellerPayoutPence = Math.floor(totalRevenuePence * (1 - PLATFORM_FEE_RATE));
  const platformFeePence = totalRevenuePence - sellerPayoutPence;

  const stripe = await getStripe();

  // Idempotency key ensures retries never double-pay
  const transfer = await stripe.transfers.create(
    {
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
    },
    { idempotencyKey: `payout-${drawId}` },
  );

  // Atomic update: only set payoutStatus = 'paid' if it isn't already 'paid'
  try {
    await db.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET payoutStatus = :s, #st = :complete, stripeTransferId = :t, paidAt = :d, sellerPayoutPence = :p, platformFeePence = :f',
      ConditionExpression: 'attribute_not_exists(payoutStatus) OR payoutStatus <> :s',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':s': 'paid',
        ':complete': 'complete',
        ':t': transfer.id,
        ':d': new Date().toISOString(),
        ':p': sellerPayoutPence,
        ':f': platformFeePence,
      },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ message: 'Already paid out' }) };
    }
    throw err;
  }

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
