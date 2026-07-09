/**
 * Nightly Lambda: reads all DrawSummary items from the analytics table,
 * then computes and writes BrandAggregate + CatalogueItem snapshots.
 *
 * Triggered by EventBridge 30 minutes after the 9pm draw resolution window
 * (21:30 GMT / 20:30 BST), so all draw outcomes are already written.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { DrawSummary, BrandAggregate, CatalogueItem, BrandId } from '../analytics/types';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME!;

export const handler = async (): Promise<void> => {
  // 1. Scan all SUMMARY items
  const summaries: DrawSummary[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(new ScanCommand({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'SK = :s',
      ExpressionAttributeValues: { ':s': 'SUMMARY' },
      ExclusiveStartKey: lastKey,
    }));
    summaries.push(...(res.Items ?? []) as DrawSummary[]);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  if (summaries.length === 0) {
    console.log('[generate-brand-snapshots] No summaries found — skipping');
    return;
  }

  // 2. Fill saveCount from draw_saved events (count distinct users who saved each draw)
  const saveCountByDraw = await loadSaveCounts(summaries.map(s => s.drawId));
  for (const s of summaries) {
    s.saveCount = saveCountByDraw.get(s.drawId) ?? 0;
  }

  // 3. Group by brand and item
  const byBrand = new Map<BrandId, DrawSummary[]>();
  const byItem = new Map<string, DrawSummary[]>();
  for (const s of summaries) {
    if (!byBrand.has(s.brandId)) byBrand.set(s.brandId, []);
    byBrand.get(s.brandId)!.push(s);
    if (!byItem.has(s.itemSlug)) byItem.set(s.itemSlug, []);
    byItem.get(s.itemSlug)!.push(s);
  }

  const now = new Date().toISOString();
  const writes: Record<string, unknown>[] = [];

  // 4. Brand aggregates: all_time + last 6 monthly periods
  const sixMonthsAgo = new Date(Date.now() - 180 * 86_400_000);
  for (const [brandId, draws] of byBrand) {
    writes.push({ PutRequest: { Item: computeBrandAggregate(brandId, 'all_time', draws, now) } });

    const byMonth = new Map<string, DrawSummary[]>();
    for (const d of draws) {
      const m = d.closedAt?.substring(0, 7);
      if (m && new Date(d.closedAt) >= sixMonthsAgo) {
        if (!byMonth.has(m)) byMonth.set(m, []);
        byMonth.get(m)!.push(d);
      }
    }
    for (const [month, monthDraws] of byMonth) {
      writes.push({ PutRequest: { Item: computeBrandAggregate(brandId, month, monthDraws, now) } });
    }
  }

  // 5. Catalogue item snapshots
  for (const [itemSlug, draws] of byItem) {
    const sample = draws[0];
    const completed = draws.filter(d => d.outcome === 'complete');
    const withThreshold = completed.filter(d => d.hoursToThreshold != null);

    const retailValues = draws.map(d => d.retailValueGBP).filter(Boolean);
    const sortedByDate = [...draws].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const item: CatalogueItem = {
      PK: `ITEM#${itemSlug}`,
      SK: 'META',
      itemSlug,
      brandId: sample.brandId,
      modelName: sample.modelName,
      modelVariant: sample.modelVariant || undefined,
      category: 'handbag',
      retailPriceLow: retailValues.length ? Math.min(...retailValues) : undefined,
      retailPriceHigh: retailValues.length ? Math.max(...retailValues) : undefined,
      firstListedAt: sortedByDate[0].createdAt,
      lastListedAt: sortedByDate[sortedByDate.length - 1].closedAt,
      listingCount: draws.length,
      completedDraws: completed.length,
      avgHoursToThreshold: withThreshold.length
        ? avg(withThreshold.map(d => d.hoursToThreshold!))
        : null,
      avgEffectiveSalePricePence: completed.length
        ? avg(completed.map(d => d.effectiveSalePricePence))
        : null,
      avgSaveCount: avg(draws.map(d => d.saveCount ?? 0)),
      brandId_itemSlug: `BRAND#${sample.brandId}`,
    };
    writes.push({ PutRequest: { Item: item } });
  }

  // 6. Batch write (DynamoDB max 25 per call)
  for (let i = 0; i < writes.length; i += 25) {
    await db.send(new BatchWriteCommand({
      RequestItems: { [ANALYTICS_TABLE]: writes.slice(i, i + 25) },
    }));
  }

  console.log(`[generate-brand-snapshots] wrote ${writes.length} aggregates for ${byBrand.size} brands, ${byItem.size} items`);
};

// ─── Aggregate computation ────────────────────────────────────────────────────

function computeBrandAggregate(brandId: BrandId, period: string, draws: DrawSummary[], now: string): BrandAggregate {
  const completed = draws.filter(d => d.outcome === 'complete');
  const cancelled = draws.filter(d => d.outcome === 'cancelled');

  const completedRevenues = completed.map(d => d.totalRevenuePence);
  const effectiveSalePrices = completed.map(d => d.effectiveSalePricePence);
  const retailValues = completed.map(d => d.retailValueGBP);
  const saveCounts = draws.map(d => d.saveCount ?? 0);
  const hoursToThreshold = completed.filter(d => d.hoursToThreshold != null).map(d => d.hoursToThreshold!);

  const authPassed = draws.filter(d => d.authStatus === 'passed').length;
  const authTotal = draws.filter(d => d.authStatus != null).length;

  const avgRetailValueGBP = retailValues.length ? avg(retailValues) : 0;
  const avgEffectiveSale = effectiveSalePrices.length ? avg(effectiveSalePrices) : 0;

  // Top models
  const bySlug = new Map<string, DrawSummary[]>();
  for (const d of draws) {
    if (!bySlug.has(d.itemSlug)) bySlug.set(d.itemSlug, []);
    bySlug.get(d.itemSlug)!.push(d);
  }
  const topModels = [...bySlug.entries()]
    .map(([itemSlug, modelDraws]) => {
      const mc = modelDraws.filter(d => d.outcome === 'complete');
      const mh = mc.filter(d => d.hoursToThreshold != null).map(d => d.hoursToThreshold!);
      return {
        itemSlug,
        modelName: modelDraws[0].modelName,
        drawCount: modelDraws.length,
        completedDraws: mc.length,
        avgRevenuePence: Math.round(mc.length ? avg(mc.map(d => d.totalRevenuePence)) : 0),
        avgHoursToThreshold: mh.length ? round1(avg(mh)) : null,
      };
    })
    .sort((a, b) => b.completedDraws - a.completedDraws)
    .slice(0, 10);

  // Condition breakdown
  const conditionBreakdown: BrandAggregate['conditionBreakdown'] = {};
  for (const d of draws) {
    const k = d.condition ?? 'unknown';
    if (!conditionBreakdown[k]) conditionBreakdown[k] = { count: 0, avgRevenuePence: 0, completionRate: 0 };
    conditionBreakdown[k].count++;
  }
  for (const [k] of Object.entries(conditionBreakdown)) {
    const kDraws = draws.filter(d => d.condition === k);
    const kCompleted = kDraws.filter(d => d.outcome === 'complete');
    conditionBreakdown[k].avgRevenuePence = Math.round(kCompleted.length ? avg(kCompleted.map(d => d.totalRevenuePence)) : 0);
    conditionBreakdown[k].completionRate = kDraws.length ? round2(kCompleted.length / kDraws.length) : 0;
  }

  // Ticket price breakdown
  const ticketPriceBreakdown: BrandAggregate['ticketPriceBreakdown'] = {};
  for (const d of draws) {
    const p = d.ticketPricePence;
    if (!ticketPriceBreakdown[p]) ticketPriceBreakdown[p] = { count: 0, avgRevenuePence: 0 };
    ticketPriceBreakdown[p].count++;
  }
  for (const [p] of Object.entries(ticketPriceBreakdown)) {
    const pDraws = draws.filter(d => d.ticketPricePence === Number(p));
    const pCompleted = pDraws.filter(d => d.outcome === 'complete');
    ticketPriceBreakdown[Number(p)].avgRevenuePence = Math.round(pCompleted.length ? avg(pCompleted.map(d => d.totalRevenuePence)) : 0);
  }

  return {
    PK: `BRAND#${brandId}`,
    SK: `AGGREGATE#${period}`,
    brandId,
    period,
    totalDraws: draws.length,
    completedDraws: completed.length,
    cancelledDraws: cancelled.length,
    completionRate: draws.length ? round2(completed.length / draws.length) : 0,
    totalRevenuePence: completedRevenues.reduce((a, b) => a + b, 0),
    avgRevenuePence: Math.round(completedRevenues.length ? avg(completedRevenues) : 0),
    avgEffectiveSalePricePence: Math.round(avgEffectiveSale),
    avgRetailValueGBP: Math.round(avgRetailValueGBP),
    avgDiscountToRetailPct: avgRetailValueGBP > 0
      ? round2((avgEffectiveSale / 100) / avgRetailValueGBP * 100)
      : 0,
    avgSaveCount: Math.round(avg(saveCounts)),
    avgHoursToThreshold: hoursToThreshold.length ? round1(avg(hoursToThreshold)) : null,
    authTotal,
    authPassCount: authPassed,
    authPassRate: authTotal ? round2(authPassed / authTotal * 100) : 0,
    topModels,
    conditionBreakdown,
    ticketPriceBreakdown,
    updatedAt: now,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

async function loadSaveCounts(drawIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  // Query save events in batches
  for (const drawId of drawIds) {
    const res = await db.send(new QueryCommand({
      TableName: ANALYTICS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      FilterExpression: 'eventType = :et',
      ExpressionAttributeValues: {
        ':pk': `DRAW#${drawId}`,
        ':prefix': 'EVENT#',
        ':et': 'draw_saved',
      },
      Select: 'COUNT',
    }));
    result.set(drawId, res.Count ?? 0);
  }
  return result;
}
