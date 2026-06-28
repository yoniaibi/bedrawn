import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

function pickWeightedWinner(entries: { userId: string; ticketCount: number }[]): string {
  const total = entries.reduce((sum, e) => sum + e.ticketCount, 0);
  let roll = Math.floor(Math.random() * total);
  for (const entry of entries) {
    roll -= entry.ticketCount;
    if (roll < 0) return entry.userId;
  }
  return entries[entries.length - 1].userId;
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const email = claims?.email as string | undefined;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Admin access required' }) };
  }

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing drawId' }) };

  const drawResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));

  const draw = drawResult.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'open') {
    return { statusCode: 409, headers: cors, body: JSON.stringify({ error: `Draw is not open (status: ${draw.status})` }) };
  }

  const entriesResult = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `DRAW#${drawId}`, ':prefix': 'ENTRY#' },
  }));

  const entries = (entriesResult.Items ?? []).map(item => ({
    userId: item.userId as string,
    ticketCount: item.ticketCount as number,
  }));

  const soldTickets = entries.reduce((s, e) => s + e.ticketCount, 0);
  const now = new Date().toISOString();

  if (entries.length === 0) {
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `DRAW#${drawId}`, SK: 'META' },
      UpdateExpression: 'SET #st = :cancelled, resolvedAt = :d, cancelReason = :r',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':cancelled': 'cancelled', ':d': now, ':r': 'no entries (admin triggered)' },
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ result: 'cancelled', reason: 'no entries' }) };
  }

  const winnerId = pickWeightedWinner(entries);

  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
    UpdateExpression: 'SET #st = :resolved, winnerId = :winner, resolvedAt = :d',
    ConditionExpression: '#st = :open',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: {
      ':resolved': 'resolved',
      ':open': 'open',
      ':winner': winnerId,
      ':d': now,
    },
  }));

  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${winnerId}`,
      SK: `NOTIF#${now}`,
      type: 'draw_won',
      title: '🎉 You won!',
      body: `You won the draw for: ${draw.title as string}`,
      drawId,
      drawTitle: draw.title as string,
      read: false,
      createdAt: now,
    },
  }));

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      result: 'resolved',
      winnerId,
      drawTitle: draw.title,
      soldTickets,
      entries: entries.length,
    }),
  };
};
