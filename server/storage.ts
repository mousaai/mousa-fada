/**
 * File Storage — S3-compatible (AWS S3 / Cloudflare R2 / MinIO)
 * بدون أي اعتماد على Manus Forge
 *
 * المتغيرات المطلوبة في .env:
 *   S3_ENDPOINT    — رابط الـ endpoint (مثال: https://s3.amazonaws.com)
 *   S3_BUCKET      — اسم الـ bucket
 *   S3_ACCESS_KEY  — Access Key ID
 *   S3_SECRET_KEY  — Secret Access Key
 *   S3_REGION      — المنطقة (مثال: us-east-1 أو auto لـ R2)
 *   S3_PUBLIC_URL  — الرابط العام للملفات (مثال: https://cdn.yourdomain.com)
 */

import { createHmac, createHash } from "crypto";

const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
const S3_BUCKET = process.env.S3_BUCKET ?? "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? "";
const S3_REGION = process.env.S3_REGION ?? "auto";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL ?? "";

function sha256(data: string | Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

function hmacSha256(key: Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function toHex(buf: Buffer): string {
  return buf.toString("hex");
}

function getSigningKey(secretKey: string, date: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(Buffer.from("AWS4" + secretKey), date);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function buildS3Url(key: string): string {
  const endpoint = S3_ENDPOINT.replace(/\/+$/, "");
  return `${endpoint}/${S3_BUCKET}/${key}`;
}

function buildPublicUrl(key: string): string {
  if (S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  }
  return buildS3Url(key);
}

async function signedRequest(
  method: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<Response> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]|\.(\d{3})/g, "").slice(0, 15) + "Z";
  const dateShort = dateStr.slice(0, 8);

  const bodyBuffer = typeof body === "string" ? Buffer.from(body) : Buffer.from(body as any);
  const payloadHash = toHex(sha256(bodyBuffer));

  const url = buildS3Url(key);
  const urlObj = new URL(url);
  const host = urlObj.host;
  const path = urlObj.pathname;

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    method, path, "",
    canonicalHeaders, signedHeaders, payloadHash,
  ].join("\n");

  const credentialScope = `${dateShort}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256", dateStr, credentialScope,
    toHex(sha256(canonicalRequest)),
  ].join("\n");

  const signingKey = getSigningKey(S3_SECRET_KEY, dateShort, S3_REGION, "s3");
  const signature = toHex(hmacSha256(signingKey, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method,
    headers: {
      "Content-Type": contentType,
      "Host": host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": dateStr,
      "Authorization": authorization,
    },
    body: bodyBuffer,
  });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error(
      "Storage credentials missing: set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY"
    );
  }
  const key = relKey.replace(/^\/+/, "");
  const response = await signedRequest("PUT", key, data, contentType);
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${text}`);
  }
  return { key, url: buildPublicUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return { key, url: buildPublicUrl(key) };
}
