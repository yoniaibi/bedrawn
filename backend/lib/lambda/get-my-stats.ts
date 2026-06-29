import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const [ordersResult, notifsResult] = await Promise.all([
    db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'ORDER#' },
    })),
    db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'NOTIF#' },
    })),
  ]);

  const orders = ordersResult.Items ?? [];
  const notifs = notifsResult.Items ?? [];

  const activeDraws = orders.filter(o => o.status === 'open').length;
  const totalTickets = orders.reduce((sum, o) => sum + (o.ticketCount as number ?? 0), 0);
  const wins = notifs.filter(n => n.type === 'draw_won').length;

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ activeDraws, totalTickets, wins, totalDrawsEntered: orders.length }),
  };
};
