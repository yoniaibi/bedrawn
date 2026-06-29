import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { cors } from './stripe-client';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };

  const body = event.body ? JSON.parse(event.body) : {};
  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'filename and contentType required' }) };
  }

  const ext = filename.split('.').pop() ?? 'jpg';
  const fileKey = `uploads/${userId}/${randomUUID()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION ?? 'eu-west-1'}.amazonaws.com/${fileKey}`;

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ uploadUrl, publicUrl, fileKey }),
  };
};
