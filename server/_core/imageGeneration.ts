/**
 * توليد الصور — Google AI مباشر (بدون أي وسيط)
 *
 * الأولوية:
 *   1. Imagen 4 Fast (5-10 ثوانٍ) — للصور الجديدة فقط
 *   2. Imagen 4 Standard (10-20 ثانية) — للصور الجديدة فقط
 *   3. Gemini 2.5 Flash Image (15-25 ثانية) — يدعم التعديل
 *   4. Gemini 3 Pro Image (20-35 ثانية) — fallback
 *
 * التخزين: Manus Forge API المدمج (storagePut) — بدون GCS
 */
import { ENV } from "./env";
import { storagePut } from "../storage";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
  model?: string;
};

export type GenerateImageResponse = {
  url?: string;
  modelUsed?: string;
};

// ─── حفظ الصورة في Manus Forge Storage ──────────────────────────────────────
async function saveImageToStorage(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const fileName = `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(base64Data, "base64");

  try {
    const { url } = await storagePut(fileName, buffer, mimeType);
    if (url && !url.startsWith("data:")) {
      return url;
    }
  } catch (err) {
    console.warn("[saveImageToStorage] storagePut failed, using data URL:", (err as Error).message?.substring(0, 80));
  }

  // Fallback: إرجاع data URL مؤقت (يعمل في المتصفح مباشرة)
  return `data:${mimeType};base64,${base64Data}`;
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 2
): Promise<T> {
  const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  const delays = isTest ? [0, 0] : [3000, 8000];
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const msg = lastError.message || "";
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("500") ||
        msg.includes("Too Many Requests") ||
        msg.includes("Service Unavailable") ||
        msg.includes("RESOURCE_EXHAUSTED");

      if (!isRetryable || attempt === maxAttempts) throw lastError;

      const delay = delays[attempt - 1] ?? 5000;
      console.log(`[${label}] retry ${attempt}/${maxAttempts} after ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Imagen 4 (predict API) ───────────────────────────────────────────────────
async function generateViaImagen4(
  prompt: string,
  model = "imagen-4.0-fast-generate-001"
): Promise<GenerateImageResponse> {
  const apiKey = ENV.googleAiApiKey;
  if (!apiKey) throw new Error("MOUSA_GOOGLE_AI_KEY غير مضبوط");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "4:3",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult",
      },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Imagen (${model}) ${response.status}: ${detail.substring(0, 150)}`);
  }

  const result = await response.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };

  const prediction = result.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error(`Imagen (${model}) لم يُرجع صورة`);
  }

  const mimeType = prediction.mimeType || "image/png";
  const imageUrl = await saveImageToStorage(prediction.bytesBase64Encoded, mimeType);
  return { url: imageUrl, modelUsed: model };
}

// ─── Gemini Image (generateContent API) ───────────────────────────────────────
async function generateViaGemini(
  options: GenerateImageOptions,
  model = "gemini-2.5-flash-image"
): Promise<GenerateImageResponse> {
  const apiKey = ENV.googleAiApiKey;
  if (!apiKey) throw new Error("MOUSA_GOOGLE_AI_KEY غير مضبوط");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // بناء الـ parts
  const parts: Array<Record<string, unknown>> = [{ text: options.prompt }];

  if (options.originalImages?.length) {
    for (const img of options.originalImages) {
      if (img.b64Json) {
        parts.push({ inline_data: { mime_type: img.mimeType || "image/jpeg", data: img.b64Json } });
      } else if (img.url) {
        try {
          const imgRes = await fetch(img.url, { signal: AbortSignal.timeout(15000) });
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const b64 = Buffer.from(buf).toString("base64");
            const ct = imgRes.headers.get("content-type") || img.mimeType || "image/jpeg";
            parts.push({ inline_data: { mime_type: ct, data: b64 } });
          }
        } catch { /* تجاهل */ }
      }
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini (${model}) ${response.status}: ${detail.substring(0, 150)}`);
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
    }>;
  };

  const imgPart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart?.inlineData) throw new Error(`Gemini (${model}) لم يُرجع صورة`);

  const mimeType = imgPart.inlineData.mimeType || "image/png";
  const imageUrl = await saveImageToStorage(imgPart.inlineData.data, mimeType);
  return { url: imageUrl, modelUsed: model };
}

// ─── الدالة الرئيسية ───────────────────────────────────────────────────────────
/**
 * توليد صورة — Google AI مباشر بدون أي وسيط
 *
 * الوقت المتوقع:
 *   - Imagen 4 Fast: 5-10 ثوانٍ (للصور الجديدة)
 *   - Imagen 4 Standard: 10-20 ثانية (للصور الجديدة)
 *   - Gemini 2.5 Flash Image: 15-25 ثانية (مع التعديل)
 *   - Gemini 3 Pro Image: 20-35 ثانية (fallback)
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const hasOriginalImages = !!(options.originalImages?.length);

  // للصور الجديدة: Imagen 4 أولاً (الأسرع)
  if (!hasOriginalImages) {
    try {
      console.log("[generateImage] Imagen 4 Fast (5-10s)...");
      return await withRetry(() => generateViaImagen4(options.prompt, "imagen-4.0-fast-generate-001"), "Imagen4Fast");
    } catch (err) {
      console.warn("[generateImage] Imagen4Fast failed:", (err as Error).message?.substring(0, 80));
    }

    try {
      console.log("[generateImage] Imagen 4 Standard (10-20s)...");
      return await withRetry(() => generateViaImagen4(options.prompt, "imagen-4.0-generate-001"), "Imagen4");
    } catch (err) {
      console.warn("[generateImage] Imagen4 failed:", (err as Error).message?.substring(0, 80));
    }
  }

  // Gemini 2.5 Flash Image (يدعم التعديل)
  try {
    console.log("[generateImage] Gemini 2.5 Flash Image (15-25s)...");
    return await withRetry(() => generateViaGemini(options, "gemini-2.5-flash-image"), "Gemini2.5Flash");
  } catch (err) {
    console.warn("[generateImage] Gemini2.5Flash failed:", (err as Error).message?.substring(0, 80));
  }

  // Gemini 3 Pro Image
  try {
    console.log("[generateImage] Gemini 3 Pro Image (20-35s)...");
    return await withRetry(() => generateViaGemini(options, "gemini-3-pro-image-preview"), "Gemini3Pro");
  } catch (err) {
    console.warn("[generateImage] Gemini3Pro failed:", (err as Error).message?.substring(0, 80));
  }

  throw new Error("فشل توليد الصورة — يرجى المحاولة بعد دقيقة.");
}
