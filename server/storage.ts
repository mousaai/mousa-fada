/**
 * تخزين الملفات — Manus Forge API المدمج
 * يستخدم BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY
 * لا يحتاج إعداد خارجي — يعمل تلقائياً في بيئة Manus
 */
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.from(data instanceof Buffer ? data : new Uint8Array(data));

  const base64Content = buffer.toString("base64");

  const forgeUrl = ENV.forgeApiUrl || process.env.BUILT_IN_FORGE_API_URL || "";
  const forgeKey = ENV.forgeApiKey || process.env.BUILT_IN_FORGE_API_KEY || "";

  if (forgeUrl && forgeKey) {
    try {
      const baseUrl = forgeUrl.endsWith("/") ? forgeUrl : `${forgeUrl}/`;
      const uploadUrl = new URL("webdevtoken.v1.WebDevService/UploadFile", baseUrl).toString();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "connect-protocol-version": "1",
          Authorization: `Bearer ${forgeKey}`,
        },
        body: JSON.stringify({
          filename: key,
          content: base64Content,
          contentType,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const result = await response.json() as { url?: string; fileUrl?: string; publicUrl?: string };
        const url = result.url || result.fileUrl || result.publicUrl || "";
        if (url) return { key, url };
      }

      // Try alternative endpoint
      const altUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();
      const altResponse = await fetch(altUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "connect-protocol-version": "1",
          Authorization: `Bearer ${forgeKey}`,
        },
        body: JSON.stringify({
          apiId: "storage/upload",
          body: { filename: key, content: base64Content, contentType },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (altResponse.ok) {
        const altResult = await altResponse.json() as { url?: string; jsonData?: string };
        let url = altResult.url || "";
        if (!url && altResult.jsonData) {
          try {
            const parsed = JSON.parse(altResult.jsonData) as { url?: string };
            url = parsed.url || "";
          } catch { /* ignore */ }
        }
        if (url) return { key, url };
      }
    } catch (err) {
      console.warn("[storagePut] Forge API failed, using data URL fallback:", err);
    }
  }

  // Fallback: data URL (works in browser directly)
  const url = `data:${contentType};base64,${base64Content}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const forgeUrl = ENV.forgeApiUrl || process.env.BUILT_IN_FORGE_API_URL || "";
  // Return a CDN-style URL if forge is configured
  if (forgeUrl) {
    const baseUrl = forgeUrl.endsWith("/") ? forgeUrl : `${forgeUrl}/`;
    const url = `${baseUrl}files/${encodeURIComponent(key)}`;
    return { key, url };
  }
  return { key, url: key };
}
