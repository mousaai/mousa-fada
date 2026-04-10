/**
 * تخزين الملفات — Manus Forge API (أولوية) + Supabase (fallback)
 * يستخدم BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY للتخزين الأساسي
 * Fallback: SUPABASE_URL + SUPABASE_ANON_KEY
 */

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || "";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const BUCKET_NAME = "sarah-files";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * رفع ملف عبر Manus Forge API
 */
async function storagePutForge(
  relKey: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    throw new Error("[storage] BUILT_IN_FORGE_API_URL أو BUILT_IN_FORGE_API_KEY غير محدد");
  }

  const key = normalizeKey(relKey);
  const base64Content = buffer.toString("base64");

  // استخدام Forge storage API
  const response = await fetch(`${FORGE_API_URL}/storage/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      key,
      data: base64Content,
      contentType,
      isPublic: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Forge storage upload failed: ${response.status} – ${errorText}`);
  }

  const result = await response.json() as { url?: string; key?: string };
  const url = result.url || `${FORGE_API_URL}/storage/files/${key}`;
  console.log(`[storagePut] ✅ رُفع الملف عبر Forge: ${url}`);
  return { key, url };
}

/**
 * رفع ملف عبر Supabase Storage
 */
async function storagePutSupabase(
  relKey: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("[storage] SUPABASE_URL أو SUPABASE_ANON_KEY غير محدد");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const key = normalizeKey(relKey);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  const url = publicUrlData.publicUrl;
  console.log(`[storagePut] ✅ رُفع الملف إلى Supabase: ${url}`);
  return { key, url };
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

  // محاولة 1: Manus Forge API
  if (FORGE_API_URL && FORGE_API_KEY) {
    try {
      return await storagePutForge(key, buffer, contentType);
    } catch (forgeErr) {
      console.warn("[storagePut] Forge failed, trying Supabase:", (forgeErr as Error).message?.substring(0, 80));
    }
  }

  // محاولة 2: Supabase
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      return await storagePutSupabase(key, buffer, contentType);
    } catch (supabaseErr) {
      console.warn("[storagePut] Supabase failed:", (supabaseErr as Error).message?.substring(0, 80));
    }
  }

  // Fallback: data URL
  console.warn("[storagePut] ⚠️ كل وسائل التخزين فشلت، استخدام data URL كـ fallback");
  const base64Content = buffer.toString("base64");
  const url = `data:${contentType};base64,${base64Content}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(key);
      return { key, url: publicUrlData.publicUrl };
    }
  } catch {
    // ignore
  }
  return { key, url: key };
}
