import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  const userId = claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'NOTIF#' },
    ScanIndexForward: false, // newest first
    Limit: 50,
  }));

  const notifications = (result.Items ?? []).map(item => {
    const type = item.type as string;
    const drawTitle = item.drawTitle as string | undefined;
    let title = item.title as string | undefined;
    let body = item.body as string | undefined;
    if (!title) {
      if (type === 'draw_won') title = '🎉 You won!';
      else title = 'Notification';
    }
    if (!body && type === 'draw_won' && drawTitle) {
      body = `You won the draw for: ${drawTitle}`;
    }
    return {
      id: item.SK as string,
      type,
      title,
      body,
      drawId: item.drawId as string | undefined,
      drawTitle,
      read: item.read as boolean,
      createdAt: item.createdAt as string,
    };
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark all as read in the background (fire-and-forget)
  const unread = (result.Items ?? []).filter(item => !item.read);
  if (unread.length > 0) {
    await Promise.all(
      unread.map(item =>
        db.send(new UpdateCommand({
          TableName: TABLE,
          Key: { PK: `USER#${userId}`, SK: item.SK as string },
          UpdateExpression: 'SET #r = :true',
          ExpressionAttributeNames: { '#r': 'read' },
          ExpressionAttributeValues: { ':true': true },
        })),
      ),
    );
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ notifications, unreadCount }),
  };
};
