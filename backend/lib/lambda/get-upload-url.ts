import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const body = event.body ? JSON.parse(event.body) : {};
  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return { statusCode: 400, body: JSON.stringify({ error: 'filename and contentType required' }) };
  }

  const fileKey = `uploads/${randomUUID()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadUrl, fileKey }),
  };
};
