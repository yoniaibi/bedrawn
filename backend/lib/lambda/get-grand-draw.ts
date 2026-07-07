import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function ukToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

function monthKey(): string {
  return ukToday().slice(0, 7); // YYYY-MM
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub as string | undefined;

  // Grand draw config lives at GRAND#CONFIG / META
  const configResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: 'GRAND#CONFIG', SK: 'META' },
  }));

  const config = configResult.Item ?? {
    prize: 'Monthly Grand Prize',
    value: 5000,
    imageUrl: '',
    emoji: '🏆',
    totalEntries: 0,
  };

  if (!userId) {
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ config, userEntries: 0, claimedToday: false, streak: 0, loginDays: [] }),
    };
  }

  const month = monthKey();

  // User's entries for this month
  const entriesResult = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': `GRAND#${month}` },
  }));

  const items = entriesResult.Items ?? [];
  const today = ukToday();
  const claimedToday = items.some(i => i.SK === `GRAND#${today}`);
  const loginDays = items.map(i => Number(i.SK.slice(-2))); // day of month

  // Streak: count consecutive days ending today or yesterday
  const sortedDays = [...loginDays].sort((a, b) => a - b);
  let streak = 0;
  const todayNum = Number(today.slice(-2));
  let check = claimedToday ? todayNum : todayNum - 1;
  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (sortedDays[i] === check) { streak++; check--; } else break;
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      config,
      userEntries: items.length,
      claimedToday,
      streak,
      loginDays,
    }),
  };
};
