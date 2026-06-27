import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function ukDateToday(): string {
  // Returns today's date in UK timezone as YYYY-MM-DD
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

function pickWeightedWinner(entries: { userId: string; ticketCount: number }[]): string {
  const total = entries.reduce((sum, e) => sum + e.ticketCount, 0);
  let roll = Math.floor(Math.random() * total);
  for (const entry of entries) {
    roll -= entry.ticketCount;
    if (roll < 0) return entry.userId;
  }
  return entries[entries.length - 1].userId;
}

export const handler = async (): Promise<void> => {
  const today = ukDateToday();
  console.log(`Resolving draws for ${today}`);

  // Scan for open draws closing today
  // (scale note: replace with GSI query once draw count grows)
  const scan = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'SK = :meta AND #st = :open AND closingDate = :today',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: {
      ':meta': 'META',
      ':open': 'open',
      ':today': today,
    },
  }));

  const draws = scan.Items ?? [];
  console.log(`Found ${draws.length} draw(s) to resolve`);

  for (const draw of draws) {
    const drawId = draw.PK.replace('DRAW#', '');
    console.log(`Resolving draw ${drawId}: ${draw.title}`);

    // Fetch all entries for this draw
    const entriesResult = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `DRAW#${drawId}`,
        ':prefix': 'ENTRY#',
      },
    }));

    const entries = (entriesResult.Items ?? []).map(item => ({
      userId: item.userId as string,
      ticketCount: item.ticketCount as number,
    }));

    if (entries.length === 0) {
      console.log(`Draw ${drawId} has no entries — marking as cancelled`);
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #st = :cancelled, resolvedAt = :d',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':cancelled': 'cancelled',
          ':d': new Date().toISOString(),
        },
      }));
      continue;
    }

    const winnerId = pickWeightedWinner(entries);
    const totalTicketsSold = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    console.log(`Draw ${drawId} winner: ${winnerId} (${totalTicketsSold} tickets sold)`);

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
        ':d': new Date().toISOString(),
      },
    }));
  }

  console.log('Draw resolution complete');
};
