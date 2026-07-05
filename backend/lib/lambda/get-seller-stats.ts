import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const [scanResult, stripeResult] = await Promise.all([
    db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(PK, :draw) AND SK = :meta AND sellerId = :uid',
      ExpressionAttributeValues: { ':draw': 'DRAW#', ':meta': 'META', ':uid': userId },
    })),
    db.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: 'STRIPE_ACCOUNT' },
    })),
  ]);

  const draws = (scanResult.Items ?? []).sort((a, b) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
  );

  const PLATFORM_FEE = 0.12;
  let totalEarningsPence = 0;
  let pendingPayoutPence = 0;

  const drawList = draws.map(d => {
    const revenue = (d.totalRevenuePence as number) ?? 0;
    const sellerRevenue = Math.round(revenue * (1 - PLATFORM_FEE));
    if (d.status === 'resolved' && d.payoutStatus !== 'paid') pendingPayoutPence += sellerRevenue;
    if (d.status === 'resolved') totalEarningsPence += sellerRevenue;
    return {
      id: d.PK.replace('DRAW#', ''),
      title: d.title,
      status: d.status,
      soldTickets: d.soldTickets ?? 0,
      totalTickets: d.totalTickets ?? 0,
      ticketPricePence: d.ticketPricePence ?? 0,
      retailValuePence: d.retailValuePence ?? 0,
      sellerRevenuePence: sellerRevenue,
      closingDate: d.closingDate,
      payoutStatus: d.payoutStatus ?? 'pending',
    };
  });

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      draws: drawList,
      totalEarningsPence,
      pendingPayoutPence,
      stripeConnected: !!(stripeResult.Item?.chargesEnabled),
    }),
  };
};
