/**
 * تخزين الملفات — Supabase Storage (مستقل 100%)
 * يستخدم SUPABASE_URL + SUPABASE_ANON_KEY
 * Bucket: sarah-files (Public)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const BUCKET_NAME = "sarah-files";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("[storage] SUPABASE_URL أو SUPABASE_ANON_KEY غير محدد");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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

  try {
    const supabase = getSupabaseClient();

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
  } catch (err) {
    console.error("[storagePut] ❌ فشل رفع الملف إلى Supabase:", err);
    // Fallback: data URL
    const base64Content = buffer.toString("base64");
    const url = `data:${contentType};base64,${base64Content}`;
    return { key, url };
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  try {
    const supabase = getSupabaseClient();
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(key);
    return { key, url: publicUrlData.publicUrl };
  } catch {
    return { key, url: key };
  }
}
