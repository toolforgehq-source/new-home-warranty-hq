import { Readable } from "node:stream";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const credentials =
  process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      }
    : null;

const client =
  credentials && process.env.R2_ENDPOINT
    ? new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials,
      })
    : null;

const bucket = process.env.R2_BUCKET_NAME || "";

export async function uploadFile(file: File, key: string) {
  if (!client) throw new Error("Storage is not configured");

  const bytes = await file.arrayBuffer();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    })
  );
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  if (!client) throw new Error("Storage is not configured");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 60 * 60) {
  if (!client) throw new Error("Storage is not configured");

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

export async function downloadFile(key: string) {
  if (!client) throw new Error("Storage is not configured");

  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = response.Body;
  if (!body) throw new Error("Empty response from storage");

  if (body instanceof Readable) {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      body.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      body.on("end", () => resolve(Buffer.concat(chunks)));
      body.on("error", reject);
    });
  }

  const arrayBuffer = await new Response(body as ReadableStream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function getPublicUrl(key: string) {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
  return null;
}
