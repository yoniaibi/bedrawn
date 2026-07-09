import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand, TransactWriteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { randomInt } from 'crypto';
import { sendWinnerEmail, sendSellerResolvedEmail, sendCancelledEmail } from './resend-client';
import type { DrawSummary, BrandId } from '../analytics/types';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
const TABLE = process.env.TABLE_NAME!;
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID!;

async function writeDrawSummary(
  draw: Record<string, unknown>,
  entries: { userId: string; ticketCount: number }[],
  outcome: 'complete' | 'cancelled',
  closedAt: string,
  winnerEntry?: { userId: string; ticketCount: number },
): Promise<void> {
  if (!ANALYTICS_TABLE || !draw.brandId || !draw.itemSlug) return;
  const brandId = draw.brandId as BrandId;
  const itemSlug = draw.itemSlug as string;
  const closedYM = closedAt.substring(0, 7);
  const soldTickets = entries.reduce((s, e) => s + e.ticketCount, 0);
  const totalRevenuePence = soldTickets * (draw.ticketPricePence as number);
  const effectiveSalePricePence = winnerEntry
    ? winnerEntry.ticketCount * (draw.ticketPricePence as number)
    : 0;

  const summary: DrawSummary = {
    PK: `DRAW#${draw.id as string}`,
    SK: 'SUMMARY',
    drawId: draw.id as string,
    brandId,
    itemSlug,
    modelName: draw.title as string,
    modelVariant: '',
    condition: draw.condition as string ?? 'unknown',
    retailValueGBP: ((draw.retailValuePence as number) ?? 0) / 100,
    ticketPricePence: draw.ticketPricePence as number,
    reserveTickets: draw.minTickets as number ?? 0,
    totalTickets: draw.totalTickets as number ?? 0,
    authStatus: (draw.auth as any)?.status,
    authTier: (draw.auth as any)?.tier,
    sellerTier: draw.sellerTier as string | null | undefined,
    outcome,
    totalTicketsSold: soldTickets,
    totalRevenuePence,
    effectiveSalePricePence,
    createdAt: draw.createdAt as string ?? closedAt,
    closedAt,
    uniqueBuyerCount: entries.length,
    saveCount: 0, // filled in by generate-brand-snapshots
    winnerTicketCount: winnerEntry?.ticketCount,
    winnerOdds: winnerEntry && soldTickets > 0
      ? Math.round(winnerEntry.ticketCount / soldTickets * 10000) / 100
      : undefined,
    brandId_closedAt: `BRAND#${brandId}#${closedYM}`,
    itemSlug_closedAt: `ITEM#${itemSlug}#${closedAt.substring(0, 10)}`,
  };

  try {
    await db.send(new PutCommand({ TableName: ANALYTICS_TABLE, Item: summary }));
  } catch (err) {
    console.error('[analytics] writeDrawSummary failed', draw.id, err);
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const res = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
    return res.UserAttributes?.find(a => a.Name === 'email')?.Value ?? null;
  } catch {
    return null;
  }
}

function ukDateToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

function pickWeightedWinner(entries: { userId: string; ticketCount: number }[]): string {
  const total = entries.reduce((sum, e) => sum + e.ticketCount, 0);
  let roll = randomInt(0, total);
  for (const entry of entries) {
    roll -= entry.ticketCount;
    if (roll < 0) return entry.userId;
  }
  return entries[entries.length - 1].userId;
}

/**
 * Refund a single entrant atomically. Uses a per-user dedup marker so retries
 * on partial failures never double-credit.
 */
async function refundEntrant(
  drawId: string,
  drawTitle: string,
  userId: string,
  ticketCount: number,
  ticketPricePence: number,
): Promise<boolean> {
  const refundPence = ticketCount * ticketPricePence;
  const now = new Date().toISOString();

  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `DEDUP#REFUND#${drawId}`,
              SK: `USER#${userId}`,
              refundedAt: now,
              ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 3600,
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        {
          Update: {
            TableName: TABLE,
            Key: { PK: `USER#${userId}`, SK: 'WALLET' },
            UpdateExpression: 'ADD balancePence :refund',
            ExpressionAttributeValues: { ':refund': refundPence },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `TX#${now}-REFUND-${drawId}`,
              type: 'refund',
              description: `Refund: ${drawTitle} (draw cancelled)`,
              amountPence: refundPence,
              drawId,
              createdAt: now,
            },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `USER#${userId}`,
              SK: `NOTIF#${now}-REFUND-${drawId}`,
              type: 'draw_cancelled',
              title: 'Draw cancelled — refund issued',
              body: `The draw "${drawTitle}" was cancelled. £${(refundPence / 100).toFixed(2)} has been returned to your wallet.`,
              drawId,
              drawTitle,
              read: false,
              createdAt: now,
            },
          },
        },
      ],
    }));
    return true;
  } catch (err: any) {
    if (err.name === 'TransactionCanceledException') {
      const reasons = err.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        return false;
      }
    }
    throw err;
  }
}

export const handler = async (): Promise<void> => {
  const today = ukDateToday();
  console.log(`Resolving draws for ${today}`);

  // Paginated scan — avoids silently skipping draws when table > 1MB
  const draws: Record<string, any>[] = [];
  let lastKey: Record<string, any> | undefined;
  do {
    const page = await db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'SK = :meta AND #st = :open AND closingDate <= :today',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':meta': 'META', ':open': 'open', ':today': today },
      ExclusiveStartKey: lastKey,
    }));
    draws.push(...(page.Items ?? []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Found ${draws.length} draw(s) to resolve`);

  for (const draw of draws) {
    const drawId = (draw.PK as string).replace('DRAW#', '');
    const ticketPricePence = (draw.ticketPricePence as number) ?? 0;
    const minTickets = (draw.minTickets as number) ?? 0;
    const drawTitle = draw.title as string;
    const now = new Date().toISOString();

    console.log(`Resolving draw ${drawId}: ${drawTitle}`);

    // C2 fix: atomically claim this draw for resolution before querying entries.
    // Any entry that arrives after this flip is rejected by enter-draw (status ≠ open).
    try {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `DRAW#${drawId}`, SK: 'META' },
        UpdateExpression: 'SET #st = :resolving',
        ConditionExpression: '#st = :open',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':resolving': 'resolving', ':open': 'open' },
      }));
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log(`Draw ${drawId} already claimed by a concurrent run — skipping`);
        continue;
      }
      throw err;
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

    if (entries.length === 0 || soldTickets < minTickets) {
      const reason = entries.length === 0 ? 'no entries' : `below minimum (${soldTickets}/${minTickets})`;
      console.log(`Draw ${drawId} cancelled — ${reason}`);

      let refunded = 0;
      for (const e of entries) {
        const applied = await refundEntrant(drawId, drawTitle, e.userId, e.ticketCount, ticketPricePence);
        if (applied) {
          refunded++;
          const email = await getUserEmail(e.userId);
          if (email) {
            const refundPounds = ((e.ticketCount * ticketPricePence) / 100).toFixed(2);
            await sendCancelledEmail(email, drawTitle, refundPounds).catch(err =>
              console.error(`Failed to send cancellation email to ${e.userId}:`, err));
          }
        }
      }
      if (refunded > 0) console.log(`Refunded ${refunded}/${entries.length} buyer(s) for draw ${drawId}`);

      try {
        await db.send(new UpdateCommand({
          TableName: TABLE,
          Key: { PK: `DRAW#${drawId}`, SK: 'META' },
          UpdateExpression: 'SET #st = :cancelled, resolvedAt = :d, cancelReason = :r',
          ConditionExpression: '#st = :resolving',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':cancelled': 'cancelled', ':resolving': 'resolving', ':d': now, ':r': reason },
        }));
      } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
          console.log(`Draw ${drawId} already flipped — skipping cancel`);
        } else {
          throw err;
        }
      }
      await writeDrawSummary(draw, entries, 'cancelled', now);
      continue;
    }

    const winnerId = pickWeightedWinner(entries);
    const isPostalWinner = winnerId.startsWith('POSTAL_');
    console.log(`Draw ${drawId} winner selected (${soldTickets} tickets sold)${isPostalWinner ? ' — POSTAL ENTRY, admin must contact winner manually' : ''}`);

    // M1 fix: status flip + notification are a single atomic TransactWrite.
    // If the Lambda is killed between them the whole transaction is not committed,
    // so a retry will retry both — no orphaned "draw resolved but winner never notified".
    const transactItems: any[] = [
      {
        Update: {
          TableName: TABLE,
          Key: { PK: `DRAW#${drawId}`, SK: 'META' },
          UpdateExpression: 'SET #st = :resolved, winnerId = :winner, resolvedAt = :d',
          ConditionExpression: '#st = :resolving',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: {
            ':resolved': 'resolved',
            ':resolving': 'resolving',
            ':winner': winnerId,
            ':d': now,
          },
        },
      },
    ];

    if (!isPostalWinner) {
      transactItems.push({
        Put: {
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
        },
      });
    }

    try {
      await db.send(new TransactWriteCommand({ TransactItems: transactItems }));
      if (isPostalWinner) {
        console.log(`POSTAL WINNER for draw ${drawId} — admin must retrieve winner profile USER#${winnerId}/PROFILE and contact manually`);
      } else {
        // Send winner email
        const winnerEmail = await getUserEmail(winnerId);
        if (winnerEmail) {
          await sendWinnerEmail(winnerEmail, drawTitle, drawId).catch(err =>
            console.error(`Failed to send winner email to ${winnerId}:`, err));
        }
        // Send seller resolved email
        const sellerEmail = draw.sellerId ? await getUserEmail(draw.sellerId as string) : null;
        if (sellerEmail) {
          await sendSellerResolvedEmail(sellerEmail, drawTitle, soldTickets, ticketPricePence, (draw.verificationFeePence as number | undefined) ?? 0).catch(err =>
            console.error(`Failed to send seller email to ${draw.sellerId}:`, err));
        }
      }
    } catch (err: any) {
      if (err.name === 'TransactionCanceledException') {
        const reasons = err.CancellationReasons ?? [];
        if (reasons[0]?.Code === 'ConditionalCheckFailed') {
          console.log(`Draw ${drawId} already resolved by a concurrent run — skipping`);
          continue;
        }
      }
      throw err;
    }

    // Analytics: draw completed — write summary for aggregation
    const winnerEntry = entries.find(e => e.userId === winnerId);
    await writeDrawSummary(draw, entries, 'complete', now, winnerEntry);
  }

  console.log('Draw resolution complete');
};
