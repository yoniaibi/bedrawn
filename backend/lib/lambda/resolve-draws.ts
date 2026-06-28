import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function ukDateToday(): string {
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

async function refundEntries(
  entries: { userId: string; ticketCount: number }[],
  ticketPricePence: number,
): Promise<void> {
  await Promise.all(
    entries.map(e =>
      db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${e.userId}`, SK: 'WALLET' },
        UpdateExpression: 'ADD balancePence :refund',
        ExpressionAttributeValues: { ':refund': e.ticketCount * ticketPricePence },
      })),
    ),
  );
}

async function notifyWinner(winnerId: string, drawId: string, drawTitle: string): Promise<void> {
  const now = new Date().toISOString();
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${winnerId}`,
      SK: `NOTIF#${now}`,
      type: 'draw_won',
      title: '🎉 You won!',
      body: `You won the draw for: ${drawTitle}`,
      drawId,
      drawTitle,
      read: false,
      createdAt: now,
    },
  }));
}

export const handler = async (): Promise<void> => {
  const today = ukDateToday();
  console.log(`Resolving draws for ${today}`);

  const scan = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'SK = :meta AND #st = :open AND closingDate = :today',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: { ':meta': 'META', ':open': 'open', ':today': today },
  }));

  const draws = scan.Items ?? [];
  console.log(`Found ${draws.length} draw(s) to resolve`);

  for (const draw of draws) {
    const drawId = (draw.PK as string).replace('DRAW#', '');
    const ticketPricePence = (draw.ticketPricePence as number) ?? 0;
    const minTickets = (draw.minTickets as number) ?? 0;
    const now = new Date().toISOString();

    console.log(`Resolving draw ${drawId}: ${draw.title}`);

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

    // Cancel and refund if no entries or below minimum ticket threshold
    if (entries.length === 0 || soldTickets < minTickets) {
      const reason = entries.length === 0 ? 'no entries' : `below minimum (${soldTickets}/${minTickets})`;
      console.log(`Draw ${drawId} cancelled — ${reason}`);

      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #st = :cancelled, resolvedAt = :d, cancelReason = :r',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':cancelled': 'cancelled', ':d': now, ':r': reason },
      }));

      if (entries.length > 0) {
        await refundEntries(entries, ticketPricePence);
        console.log(`Refunded ${entries.length} buyer(s) for draw ${drawId}`);
      }
      continue;
    }

    const winnerId = pickWeightedWinner(entries);
    console.log(`Draw ${drawId} winner: ${winnerId} (${soldTickets} tickets sold)`);

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

    await notifyWinner(winnerId, drawId, draw.title as string);
  }

  console.log('Draw resolution complete');
};
