import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { AnalyticsEventType, BrandId } from './types';

const _client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function table(): string | undefined {
  return process.env.ANALYTICS_TABLE_NAME;
}

interface EventMeta {
  brandId?: BrandId;
  itemSlug?: string;
}

/**
 * Fire-and-forget analytics event.
 * Never throws — errors are logged but never propagate to the caller.
 */
export function recordEvent(
  drawId: string,
  eventType: AnalyticsEventType,
  payload: Record<string, unknown>,
  meta?: EventMeta,
): void {
  const t = table();
  if (!t) return;
  const createdAt = new Date().toISOString();
  const item: Record<string, unknown> = {
    PK: `DRAW#${drawId}`,
    SK: `EVENT#${createdAt}#${eventType}`,
    eventType,
    drawId,
    createdAt,
    payload,
  };
  if (meta?.brandId) item.brandId = meta.brandId;
  if (meta?.itemSlug) item.itemSlug = meta.itemSlug;

  _client.send(new PutCommand({ TableName: t, Item: item }))
    .catch(err => console.error('[analytics] recordEvent failed', { drawId, eventType, err }));
}

/**
 * Upsert a catalogue item — creates on first listing, increments listingCount on repeat.
 * Fire-and-forget.
 */
export function upsertCatalogueItem(params: {
  itemSlug: string;
  brandId: BrandId;
  modelName: string;
  modelVariant?: string;
  retailValueGBP: number;
  listedAt: string;
}): void {
  const t = table();
  if (!t) return;

  const { itemSlug, brandId, modelName, modelVariant, retailValueGBP, listedAt } = params;
  const category = inferCategory(modelName);

  _client.send(new UpdateCommand({
    TableName: t,
    Key: { PK: `ITEM#${itemSlug}`, SK: 'META' },
    UpdateExpression: `
      SET brandId = :brand,
          modelName = if_not_exists(modelName, :mname),
          modelVariant = if_not_exists(modelVariant, :mvariant),
          #cat = if_not_exists(#cat, :cat),
          firstListedAt = if_not_exists(firstListedAt, :ts),
          retailPriceLow = if_not_exists(retailPriceLow, :rv),
          brandId_itemSlug = :gsi3,
          itemSlug = :slug,
          lastListedAt = :ts
      ADD listingCount :one, completedDraws :zero
    `,
    ExpressionAttributeNames: { '#cat': 'category' },
    ExpressionAttributeValues: {
      ':brand': brandId,
      ':mname': modelName,
      ':mvariant': modelVariant ?? '',
      ':cat': category,
      ':ts': listedAt,
      ':rv': retailValueGBP,
      ':gsi3': `BRAND#${brandId}`,
      ':slug': itemSlug,
      ':one': 1,
      ':zero': 0,
    },
  })).catch(err => console.error('[analytics] upsertCatalogueItem failed', { itemSlug, err }));
}

function inferCategory(modelName: string): string {
  const lower = modelName.toLowerCase();
  if (lower.includes('wallet') || lower.includes('woc')) return 'wallet';
  if (lower.includes('backpack') || lower.includes('rucksack')) return 'backpack';
  if (lower.includes('clutch') || lower.includes('pouch')) return 'clutch';
  if (lower.includes('tote') || lower.includes('shopper') || lower.includes('neverfull')) return 'tote';
  if (lower.includes('crossbody') || lower.includes('pochette') || lower.includes('belt bag')) return 'crossbody';
  if (lower.includes('satchel') || lower.includes('saddl')) return 'satchel';
  return 'handbag';
}
