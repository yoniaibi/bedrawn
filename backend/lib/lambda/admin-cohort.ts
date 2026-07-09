import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand,
  UpdateCommand, QueryCommand, BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { createHash, randomBytes } from 'crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db     = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.TABLE_NAME!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
const OPS_HOURLY_PENCE = 2500; // £25/h founder time

function isAdmin(event: APIGatewayProxyEventV2): boolean {
  const email = (event.requestContext as any).authorizer?.jwt?.claims?.email as string | undefined;
  return !!email && ADMIN_EMAILS.includes(email);
}
function forbidden(): APIGatewayProxyResultV2 {
  return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Forbidden' }) };
}
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain?.[0] ?? ''}***.${domain?.split('.').pop() ?? 'com'}`;
}

// ─── Metrics computation ──────────────────────────────────────────────────────

async function computeMetrics(): Promise<Record<string, unknown>> {
  // Scan all manual cohorts
  const cohortScan = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta',
    ExpressionAttributeValues: { ':prefix': 'COHORT#', ':meta': 'META' },
  }));
  const cohorts = cohortScan.Items ?? [];
  const resolved = cohorts.filter(c => c.status === 'resolved');
  const n = cohorts.length;

  // Fill rate: ticketsSold / thresholdTickets
  const fills = cohorts.filter(c => c.thresholdTickets > 0).map(c => c.ticketsSold / c.thresholdTickets * 100);
  const fillRatePct = fills.length ? fills.reduce((a, b) => a + b, 0) / fills.length : 0;

  // View-to-ticket: buyers / uniqueVisitors
  const vtts = cohorts.filter(c => c.uniqueVisitors > 0).map(c => c.buyers / c.uniqueVisitors * 100);
  const viewToTicketPct = vtts.length ? vtts.reduce((a, b) => a + b, 0) / vtts.length : 0;

  // Repeat buyer rate from BUYER_HASH records
  const buyerScan = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': 'BUYER_HASHES' },
  }));
  const buyerHashes = buyerScan.Items ?? [];
  const repeatHashes = buyerHashes.filter(b => Array.isArray(b.drawIds) && b.drawIds.length >= 2);
  const repeatBuyerPct = buyerHashes.length ? repeatHashes.length / buyerHashes.length * 100 : 0;

  // Seller repeat: sellers with 2+ cohorts
  const sellerIds = cohorts.map(c => c.sellerId).filter(Boolean);
  const sellerCount: Record<string, number> = {};
  sellerIds.forEach(id => { sellerCount[id] = (sellerCount[id] ?? 0) + 1; });
  const uniqueSellers = Object.keys(sellerCount).length;
  const repeatSellers = Object.values(sellerCount).filter(v => v >= 2).length;
  const sellerRepeatPct = uniqueSellers ? repeatSellers / uniqueSellers * 100 : 0;

  // Winner share
  const winnerSharePct = resolved.length
    ? resolved.filter(c => c.winnerShared).length / resolved.length * 100
    : 0;

  // Viral coefficient: newBuyersFromShares / totalBuyers per cycle
  const totalBuyers    = cohorts.reduce((s, c) => s + (c.buyers ?? 0), 0);
  const shareNewBuyers = cohorts.reduce((s, c) => s + (c.buyersFromShares ?? 0), 0);
  const viralCoefficient = totalBuyers ? shareNewBuyers / totalBuyers : 0;

  // Contribution margin (avg per draw)
  const margins = cohorts.map(c => {
    const fee     = c.platformFee ?? Math.round((c.grossRevenue ?? 0) * 0.12);
    const opsCost = Math.round((c.opsMinutes ?? 0) * OPS_HOURLY_PENCE / 60);
    return fee - (c.authCost ?? 0) - (c.processingCost ?? 0) - (c.shippingCost ?? 0) - opsCost;
  });
  const contributionMarginPence = margins.length ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0;

  // Pivot triggers
  const TARGETS = {
    fillRatePct:        { healthy: 70,  pivot: 40,  pivotAfterDraws: 10, dir: 'above' },
    viewToTicketPct:    { healthy: 8,   pivot: 3,   pivotAfterDraws: 6,  dir: 'above' },
    repeatBuyerPct:     { healthy: 35,  pivot: 15,  pivotAfterDraws: 10, dir: 'above' },
    sellerRepeatPct:    { healthy: 50,  pivot: 20,  pivotAfterDraws: 10, dir: 'above' },
    winnerSharePct:     { healthy: 40,  pivot: 15,  pivotAfterDraws: 8,  dir: 'above' },
    viralCoefficient:   { healthy: 0.5, pivot: 0.2, pivotAfterDraws: 10, dir: 'above' },
    contributionMargin: { healthy: 0,   pivot: 0,   pivotAfterDraws: 15, dir: 'above' },
  } as const;

  const SENTENCES: Record<string, string> = {
    fillRatePct:        'Fill rate below 40% after 10 draws — the threshold model needs a pivot-or-persevere decision.',
    viewToTicketPct:    'View-to-ticket conversion below 3% after 6 draws — the draw page or pricing needs a pivot-or-persevere decision.',
    repeatBuyerPct:     'Repeat buyer rate below 15% after 10 draws — retention is failing; pivot-or-persevere required.',
    sellerRepeatPct:    'Fewer than 20% of sellers have re-listed after 10 draws — supply-side retention needs a pivot-or-persevere decision.',
    winnerSharePct:     'Fewer than 15% of winners sharing after 8 draws — the viral loop is broken; pivot-or-persevere required.',
    viralCoefficient:   'Viral coefficient below 0.2 after 10 draws — word-of-mouth growth is negligible; pivot-or-persevere required.',
    contributionMargin: 'Contribution margin still negative after 15 draws — unit economics are not working; pivot-or-persevere required.',
  };

  const vals: Record<string, number> = {
    fillRatePct, viewToTicketPct, repeatBuyerPct, sellerRepeatPct,
    winnerSharePct, viralCoefficient, contributionMargin: contributionMarginPence,
  };

  const pivotTriggers = [];
  for (const [key, t] of Object.entries(TARGETS)) {
    const pivotDrawCount = key === 'viewToTicketPct' ? vtts.length : n;
    const value = vals[key] ?? 0;
    if (pivotDrawCount >= t.pivotAfterDraws && value < t.pivot) {
      // Check if decision already logged
      const decisionItem = await db.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: 'PIVOT_DECISIONS', SK: key },
      }));
      pivotTriggers.push({
        metric: key,
        value,
        threshold: t.pivot,
        drawCount: pivotDrawCount,
        sentence: SENTENCES[key],
        decisionNote: decisionItem.Item?.note,
        decisionAt: decisionItem.Item?.decidedAt,
      });
    }
  }

  return {
    fillRatePct, viewToTicketPct, repeatBuyerPct, sellerRepeatPct,
    winnerSharePct, viralCoefficient, contributionMarginPence,
    drawCount: n, computedAt: new Date().toISOString(),
    pivotTriggers,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (!isAdmin(event)) return forbidden();

  const method  = event.requestContext.http.method;
  const rawPath = event.rawPath;
  const cohortId = event.pathParameters?.id;
  const sub     = event.pathParameters?.sub; // for /cohorts/{id}/{sub}
  const now     = new Date().toISOString();

  let body: Record<string, unknown> = {};
  try { if (event.body) body = JSON.parse(event.body); } catch {}

  // GET /admin/metrics
  if (method === 'GET' && rawPath === '/admin/metrics') {
    const m = await computeMetrics();
    return { statusCode: 200, headers: cors, body: JSON.stringify(m) };
  }

  // POST /admin/metrics/decision — log pivot decision
  if (method === 'POST' && rawPath === '/admin/metrics/decision') {
    const { metric, note } = body;
    if (!metric || !note) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'metric and note required' }) };
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: 'PIVOT_DECISIONS', SK: metric, note, decidedAt: now },
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  // GET /admin/cohorts — list all cohorts + pivot triggers
  if (method === 'GET' && !cohortId) {
    const scan = await db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta',
      ExpressionAttributeValues: { ':prefix': 'COHORT#', ':meta': 'META' },
    }));
    const cohorts = (scan.Items ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const metrics = await computeMetrics();
    return { statusCode: 200, headers: cors, body: JSON.stringify({ cohorts, pivotTriggers: (metrics as any).pivotTriggers }) };
  }

  // POST /admin/cohorts — create manual cohort
  if (method === 'POST' && !cohortId) {
    const id = `manual-${Date.now().toString(36)}-${randomBytes(2).toString('hex')}`;
    const cohort = {
      PK: `COHORT#${id}`, SK: 'META', cohortId: id,
      label:            body.label            ?? '',
      brandId:          body.brandId          ?? '',
      mode:             'manual',
      listedAt:         body.listedAt         ?? now.slice(0, 10),
      closedAt:         null,
      ticketPricePence: Number(body.ticketPricePence ?? 0),
      totalTickets:     Number(body.totalTickets     ?? 0),
      thresholdTickets: Number(body.thresholdTickets ?? 0),
      retailValuePence: Number(body.retailValuePence ?? 0),
      views: 0, uniqueVisitors: 0, ticketsSold: 0,
      buyers: 0, newBuyers: 0, repeatBuyers: 0,
      status: 'open', rolloverCount: 0, daysToThreshold: null,
      winnerShared: false, shareLinkVisits: 0, buyersFromShares: 0,
      grossRevenue: 0, platformFee: 0, authCost: 0,
      processingCost: 0, opsMinutes: 0, shippingCost: 0,
      locked: false,
      sellerId: body.sellerId ?? 'manual',
      createdAt: now, updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLE, Item: cohort }));
    return { statusCode: 201, headers: cors, body: JSON.stringify({ cohortId: id, cohort }) };
  }

  // GET /admin/cohorts/{id} — get cohort + snapshots
  if (method === 'GET' && cohortId && !sub) {
    const [metaRes, snapsRes] = await Promise.all([
      db.send(new GetCommand({ TableName: TABLE, Key: { PK: `COHORT#${cohortId}`, SK: 'META' } })),
      db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: { ':pk': `COHORT#${cohortId}`, ':prefix': 'SNAP#' },
      })),
    ]);
    if (!metaRes.Item) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ cohort: metaRes.Item, snapshots: snapsRes.Items ?? [] }) };
  }

  // POST /admin/cohorts/{id}/snapshot — add or update daily snapshot
  if (method === 'POST' && cohortId && sub === 'snapshot') {
    const date = (body.date as string) ?? now.slice(0, 10);
    const snap = {
      PK: `COHORT#${cohortId}`, SK: `SNAP#${date}`,
      cohortId, date,
      ticketsSold:    Number(body.ticketsSold    ?? 0),
      uniqueVisitors: Number(body.uniqueVisitors ?? 0),
      newBuyerCount:  Number(body.newBuyerCount  ?? 0),
      shareLinkVisits:Number(body.shareLinkVisits?? 0),
      notes: body.notes ?? '',
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLE, Item: snap }));

    // Compute latest cumulative totals from all snapshots and update cohort META
    const allSnaps = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': `COHORT#${cohortId}`, ':prefix': 'SNAP#' },
    }));
    const snaps = allSnaps.Items ?? [];
    // Use the latest snapshot as current totals
    const latest = snaps.sort((a, b) => b.date.localeCompare(a.date))[0];
    const totalViews = snaps.reduce((s: number, sn: any) => s + (sn.uniqueVisitors ?? 0), 0);
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `COHORT#${cohortId}`, SK: 'META' },
      UpdateExpression: 'SET ticketsSold = :ts, uniqueVisitors = :uv, shareLinkVisits = :slv, updatedAt = :d',
      ExpressionAttributeValues: {
        ':ts':  latest?.ticketsSold    ?? 0,
        ':uv':  totalViews,
        ':slv': snaps.reduce((s: number, sn: any) => s + (sn.shareLinkVisits ?? 0), 0),
        ':d':   now,
      },
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, snap }) };
  }

  // PUT /admin/cohorts/{id}/resolve — lock the cohort after resolution
  if ((method === 'PUT' || method === 'POST') && cohortId && sub === 'resolve') {
    const cohortRes = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `COHORT#${cohortId}`, SK: 'META' } }));
    if (!cohortRes.Item) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Not found' }) };
    if (cohortRes.Item.locked && !body.amend) {
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Cohort is locked. Pass amend:true to force.' }) };
    }

    const gross      = Number(body.grossRevenue    ?? cohortRes.Item.grossRevenue    ?? 0);
    const platformFee= Math.round(gross * 0.12);
    const closeAt    = (body.closedAt as string) ?? now.slice(0, 10);
    const listed     = cohortRes.Item.listedAt ?? closeAt;
    const daysToThreshold = Math.max(0, Math.round((new Date(closeAt).getTime() - new Date(listed).getTime()) / 86_400_000));

    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `COHORT#${cohortId}`, SK: 'META' },
      UpdateExpression: `SET #st = :status, closedAt = :closed, buyers = :b, newBuyers = :nb,
        repeatBuyers = :rb, winnerShared = :ws, grossRevenue = :gr, platformFee = :pf,
        authCost = :ac, processingCost = :pc, opsMinutes = :om, shippingCost = :sc,
        daysToThreshold = :dtt, locked = :locked, updatedAt = :d`,
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':status':  body.status           ?? 'resolved',
        ':closed':  closeAt,
        ':b':       Number(body.buyers         ?? 0),
        ':nb':      Number(body.newBuyers       ?? 0),
        ':rb':      Number(body.repeatBuyers    ?? 0),
        ':ws':      Boolean(body.winnerShared),
        ':gr':      gross,
        ':pf':      platformFee,
        ':ac':      Number(body.authCost        ?? 0),
        ':pc':      Number(body.processingCost  ?? 0),
        ':om':      Number(body.opsMinutes       ?? 0),
        ':sc':      Number(body.shippingCost     ?? 0),
        ':dtt':     daysToThreshold,
        ':locked':  !body.amend,
        ':d':       now,
      },
    }));

    // Write audit record if amend
    if (body.amend) {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: { PK: `COHORT#${cohortId}`, SK: `AUDIT#${now}`, type: 'amend', changedBy: 'admin', body, amendedAt: now },
      }));
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  // POST /admin/cohorts/{id}/buyers — bulk buyer email hash upload
  if (method === 'POST' && cohortId && sub === 'buyers') {
    const emails: string[] = Array.isArray(body.emails) ? body.emails : [];
    if (!emails.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'emails array required' }) };

    const hashes = emails.map(e => hashEmail(e));
    // Upsert each hash — add drawId to their list
    await Promise.all(hashes.map(hash =>
      db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: 'BUYER_HASHES', SK: hash },
        UpdateExpression: 'ADD drawIds :id SET updatedAt = :d',
        ExpressionAttributeValues: {
          ':id': new Set([cohortId]),
          ':d':  now,
        },
      })),
    ));

    // Also update cohort buyers count
    const uniqueBuyers = hashes.length;
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `COHORT#${cohortId}`, SK: 'META' },
      UpdateExpression: 'SET buyers = :b, updatedAt = :d',
      ExpressionAttributeValues: { ':b': uniqueBuyers, ':d': now },
    }));

    return { statusCode: 200, headers: cors, body: JSON.stringify({ processed: hashes.length }) };
  }

  // GET /admin/sellers — seller supply health
  if (method === 'GET' && rawPath === '/admin/sellers') {
    const scan = await db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(PK, :prefix) AND SK = :meta',
      ExpressionAttributeValues: { ':prefix': 'COHORT#', ':meta': 'META' },
    }));
    const cohorts = scan.Items ?? [];
    const sellerMap: Record<string, { listings: number; resolved: number; fills: number[]; cohortIds: string[] }> = {};
    cohorts.forEach(c => {
      const sid = c.sellerId ?? 'unknown';
      if (!sellerMap[sid]) sellerMap[sid] = { listings: 0, resolved: 0, fills: [], cohortIds: [] };
      sellerMap[sid].listings++;
      sellerMap[sid].cohortIds.push(c.cohortId);
      if (c.status === 'resolved') {
        sellerMap[sid].resolved++;
        if (c.thresholdTickets > 0) sellerMap[sid].fills.push(c.ticketsSold / c.thresholdTickets * 100);
      }
    });
    const sellers = Object.entries(sellerMap).map(([id, s]) => ({
      sellerId: id,
      listings: s.listings,
      resolvedDraws: s.resolved,
      repeatLister: s.listings >= 2,
      avgFillPct: s.fills.length ? Math.round(s.fills.reduce((a, b) => a + b, 0) / s.fills.length) : null,
    }));
    const sellerRepeatPct = sellers.length ? sellers.filter(s => s.repeatLister).length / sellers.length * 100 : 0;
    return { statusCode: 200, headers: cors, body: JSON.stringify({ sellers, sellerRepeatPct }) };
  }

  return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'Not found' }) };
};
