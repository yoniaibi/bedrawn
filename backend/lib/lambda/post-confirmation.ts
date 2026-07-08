import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const DEV_SEED_PENCE = process.env.DEV_SEED === 'true' ? 5000 : 0;

export const handler = async (event: any): Promise<any> => {
  const userId: string = event.request?.userAttributes?.sub ?? event.userName;
  const email: string = event.request?.userAttributes?.email ?? '';
  const name: string = event.request?.userAttributes?.name ?? '';

  if (!userId) return event;

  const now = new Date().toISOString();
  // Derive a readable default handle from the email prefix
  const defaultHandle = email.split('@')[0] || userId.slice(0, 8);

  // Write profile — condition prevents overwrite if already set (e.g. social login retry)
  try {
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        handle: defaultHandle,
        name,
        email,
        signedUpAt: now,
        createdAt: now,
        updatedAt: now,
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }));
  } catch { /* already exists — fine */ }

  // Seed wallet in dev mode — definitive place, avoids lazy-seed race in wallet-balance
  if (DEV_SEED_PENCE > 0) {
    try {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'WALLET',
          balancePence: DEV_SEED_PENCE,
          createdAt: now,
          updatedAt: now,
          seeded: true,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }));
    } catch { /* already seeded */ }
  }

  return event;
};
