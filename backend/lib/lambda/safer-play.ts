import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

/** First instant of the current calendar month, ISO. */
function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Sum this month's wallet top-ups (total + credit-card-funded subtotal).
 * TX sort keys are `TX#<ISO timestamp>...` so a key-range query is enough.
 */
export async function getMonthlyTopups(userId: string): Promise<{ monthlySpendPence: number; ccTopupMtdPence: number }> {
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND SK BETWEEN :from AND :to',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':from': `TX#${monthStartIso()}`,
      ':to': 'TX#9999',
    },
  }));
  let monthlySpendPence = 0;
  let ccTopupMtdPence = 0;
  for (const item of result.Items ?? []) {
    if (item.type !== 'topup' || typeof item.amountPence !== 'number' || item.amountPence <= 0) continue;
    monthlySpendPence += item.amountPence;
    if (item.cardFunding === 'credit') ccTopupMtdPence += item.amountPence;
  }
  return { monthlySpendPence, ccTopupMtdPence };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const method = event.requestContext.http.method;

  if (method === 'GET') {
    const [profileRes, topups] = await Promise.all([
      db.send(new GetCommand({ TableName: TABLE, Key: { PK: `USER#${userId}`, SK: 'PROFILE' } })),
      getMonthlyTopups(userId),
    ]);
    const profile = profileRes.Item ?? {};
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        spendLimitPence: profile.spendLimitPence ?? null,
        suspendedUntil: profile.suspendedUntil ?? null,
        monthlySpendPence: topups.monthlySpendPence,
        ccTopupMtdPence: topups.ccTopupMtdPence,
      }),
    };
  }

  if (method === 'PUT') {
    let body: Record<string, unknown>;
    try { body = event.body ? JSON.parse(event.body) : {}; }
    catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

    const sets: string[] = [];
    const removes: string[] = [];
    const values: Record<string, unknown> = {};

    if ('spendLimitPence' in body) {
      const v = body.spendLimitPence;
      if (v === null) {
        removes.push('spendLimitPence');
      } else if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1000000) {
        sets.push('spendLimitPence = :limit');
        values[':limit'] = v;
      } else {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'spendLimitPence must be a non-negative integer (pence)' }) };
      }
    }

    if ('suspendedUntil' in body) {
      const v = body.suspendedUntil;
      if (v === null) {
        removes.push('suspendedUntil');
      } else if (typeof v === 'string' && !isNaN(new Date(v).getTime()) && new Date(v).getTime() > Date.now()) {
        sets.push('suspendedUntil = :until');
        values[':until'] = v;
      } else if (v === 'permanent') {
        sets.push('suspendedUntil = :until');
        values[':until'] = '9999-12-31T00:00:00.000Z';
      } else {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'suspendedUntil must be a future ISO date' }) };
      }
    }

    if ('harmDismissedMonth' in body && typeof body.harmDismissedMonth === 'string' && /^\d{4}-\d{2}$/.test(body.harmDismissedMonth)) {
      sets.push('harmDismissedMonth = :hdm');
      values[':hdm'] = body.harmDismissedMonth;
    }

    if (!sets.length && !removes.length) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Nothing to update' }) };
    }

    let expr = '';
    if (sets.length) expr += `SET ${sets.join(', ')}`;
    if (removes.length) expr += `${expr ? ' ' : ''}REMOVE ${removes.join(', ')}`;

    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: expr,
      ...(Object.keys(values).length ? { ExpressionAttributeValues: values } : {}),
    }));

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
};
