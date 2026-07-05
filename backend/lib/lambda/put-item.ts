import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const id = event.pathParameters?.id;
  if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing id' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const fields = Object.entries(body).filter(([k]) => k !== 'PK' && k !== 'SK');
  if (fields.length === 0) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'No fields to update' }) };

  const updateExpr = 'SET ' + fields.map(([k]) => `#${k} = :${k}`).join(', ') + ', updatedAt = :updatedAt';
  const exprNames = Object.fromEntries(fields.map(([k]) => [`#${k}`, k]));
  const exprValues = { ...Object.fromEntries(fields.map(([k, v]) => [`:${k}`, v])), ':updatedAt': new Date().toISOString(), ':uid': userId };

  try {
    const result = await client.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `ITEM#${id}`, SK: 'META' },
      UpdateExpression: updateExpr,
      ConditionExpression: 'sellerId = :uid',
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ item: result.Attributes }),
    };
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Forbidden' }) };
    }
    throw err;
  }
};
