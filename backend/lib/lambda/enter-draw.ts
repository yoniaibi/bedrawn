import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const drawId = event.pathParameters?.id;
  if (!drawId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing draw ID' }) };

  const body = JSON.parse(event.body ?? '{}');
  const ticketCount: number = body.ticketCount;
  if (!ticketCount || ticketCount < 1 || !Number.isInteger(ticketCount)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'ticketCount must be a positive integer' }) };
  }

  // Fetch draw metadata
  const drawResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `DRAW#${drawId}`, SK: 'META' },
  }));

  const draw = drawResult.Item;
  if (!draw) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Draw not found' }) };
  if (draw.status !== 'open') return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw is no longer open' }) };

  const costPence = draw.ticketPricePence * ticketCount;

  // Atomic: deduct wallet balance + upsert entry record
  // If wallet balance is insufficient the condition fails and throws ConditionalCheckFailedException
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: 'WALLET' },
            UpdateExpression: 'SET balancePence = balancePence - :cost, updatedAt = :d',
            ConditionExpression: 'balancePence >= :cost',
            ExpressionAttributeValues: {
              ':cost': costPence,
              ':d': new Date().toISOString(),
            },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: `ENTRY#${userId}` },
            UpdateExpression: 'ADD ticketCount :qty SET userId = :uid, updatedAt = :d',
            ExpressionAttributeValues: {
              ':qty': ticketCount,
              ':uid': userId,
              ':d': new Date().toISOString(),
            },
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `DRAW#${drawId}`, SK: 'META' },
            UpdateExpression: 'ADD soldTickets :qty SET totalRevenuePence = if_not_exists(totalRevenuePence, :zero) + :cost, updatedAt = :d',
            ConditionExpression: '#st = :open',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: {
              ':qty': ticketCount,
              ':cost': costPence,
              ':zero': 0,
              ':open': 'open',
              ':d': new Date().toISOString(),
            },
          },
        },
      ],
    }));
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 402, headers: cors, body: JSON.stringify({ error: 'Insufficient wallet balance' }) };
      }
      if (reasons[2]?.Code === 'ConditionalCheckFailed') {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Draw is no longer open' }) };
      }
    }
    throw err;
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ success: true, ticketCount, costPence }),
  };
};
