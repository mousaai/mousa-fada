/**
 * تخزين الملفات — Google Cloud Storage مباشر (بدون Manus)
 *
 * يستخدم GCS JSON API مع API Key من مشروع Mousa ai
 * Bucket عام للقراءة — لا يحتاج signing
 */
import { ENV } from "./_core/env";

const GCS_BUCKET = process.env.GCS_BUCKET || "sarah-design-images";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const apiKey = ENV.googleAiApiKey;

  if (!apiKey) {
    throw new Error("MOUSA_GOOGLE_AI_KEY غير مضبوط — لا يمكن رفع الملفات");
  }

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.from(data instanceof Buffer ? data : new Uint8Array(data));

  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(key)}&key=${apiKey}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: buffer,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`GCS upload failed (${response.status}): ${message.substring(0, 200)}`);
  }

  const result = await response.json() as { name: string };
  const url = `https://storage.googleapis.com/${GCS_BUCKET}/${encodeURIComponent(result.name || key)}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = `https://storage.googleapis.com/${GCS_BUCKET}/${encodeURIComponent(key)}`;
  return { key, url };
}
