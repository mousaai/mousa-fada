/**
 * Image generation helper — نظام توليد الصور متعدد المستويات
 * الأولوية (بالترتيب):
 *   1. imagen-4.0-generate-001 (أعلى جودة — Google Imagen 4)
 *   2. gemini-3-pro-image-preview (Gemini 3 Pro للصور — جودة عالية)
 *   3. gemini-2.5-flash-image (Gemini 2.5 Flash للصور — سريع ويدعم التعديل)
 *   4. gemini-3.1-flash-image-preview (Gemini 3.1 Flash للصور)
 * ⚠️ Manus Forge محذوف تماماً
 * ✅ نظام retry ذكي مع exponential backoff لكل نموذج
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

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

// ─── Retry Helper ────────────────────────────────────────────────────────────
/**
 * ينفذ دالة مع إعادة المحاولة عند فشل rate-limit (429) أو خطأ مؤقت (503/500)
 * exponential backoff: 2s → 5s → 12s
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3
): Promise<T> {
  // في بيئة الاختبار، نتجنب الانتظار الفعلي
  const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  const delays = isTest ? [0, 0, 0] : [2000, 5000, 12000];
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

      if (!isRetryable || attempt === maxAttempts) {
        throw lastError;
      }

      const delay = delays[attempt - 1] ?? 10000;
      console.log(
        `[${label}] محاولة ${attempt}/${maxAttempts} فشلت (${msg.substring(0, 60)}). إعادة المحاولة بعد ${delay / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Imagen 4 ────────────────────────────────────────────────────────────────
async function generateImageViaImagen4(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.googleAiApiKey;
  const model = "imagen-4.0-generate-001";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  const requestBody = {
    instances: [{ prompt: options.prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "4:3",
      safetyFilterLevel: "block_some",
      personGeneration: "allow_adult",
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Imagen 4 generation failed (${response.status} ${response.statusText})${detail ? `: ${detail.substring(0, 200)}` : ""}`
    );
  }

  const result = (await response.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };

  const prediction = result.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error("Imagen 4 did not return an image in the response");
  }

  const buffer = Buffer.from(prediction.bytesBase64Encoded, "base64");
  const mimeType = prediction.mimeType || "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";

  const { url } = await storagePut(
    `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
    buffer,
    mimeType
  );

  return { url, modelUsed: "Imagen 4" };
}

// ─── Gemini Image ─────────────────────────────────────────────────────────────
async function generateImageViaGemini(
  options: GenerateImageOptions,
  model: string = "gemini-2.5-flash-image"
): Promise<GenerateImageResponse> {
  const apiKey = ENV.googleAiApiKey;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: Array<Record<string, unknown>> = [{ text: options.prompt }];

  if (options.originalImages && options.originalImages.length > 0) {
    for (const img of options.originalImages) {
      if (img.b64Json) {
        parts.push({
          inline_data: {
            mime_type: img.mimeType || "image/jpeg",
            data: img.b64Json,
          },
        });
      } else if (img.url) {
        try {
          const imgResponse = await fetch(img.url);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const contentType =
              imgResponse.headers.get("content-type") ||
              img.mimeType ||
              "image/jpeg";
            parts.push({
              inline_data: { mime_type: contentType, data: base64 },
            });
          }
        } catch {
          // تجاهل الصورة إذا فشل التحميل
        }
      }
    }
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Gemini (${model}) image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail.substring(0, 200)}` : ""}`
    );
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { data: string; mimeType: string };
        }>;
      };
    }>;
  };

  const candidate = result.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error(`Gemini (${model}) did not return an image in the response`);
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";

  const { url } = await storagePut(
    `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
    buffer,
    mimeType
  );

  return { url, modelUsed: model };
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * الدالة الرئيسية — نظام توليد متعدد المستويات مع retry ذكي
 * كل نموذج يحاول 3 مرات مع exponential backoff قبل الانتقال للتالي
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const googleKey = ENV.googleAiApiKey;
  const hasOriginalImages =
    options.originalImages && options.originalImages.length > 0;

  if (!googleKey || googleKey.trim().length === 0) {
    throw new Error(
      "GOOGLE_AI_API_KEY غير مضبوط. يرجى إضافة MY_GOOGLE_AI_KEY في متغيرات البيئة."
    );
  }

  // المستوى الأول: Imagen 4 (للصور الجديدة فقط) — 3 محاولات
  if (!hasOriginalImages) {
    try {
      console.log("[generateImage] Trying Imagen 4 (highest quality)...");
      return await withRetry(
        () => generateImageViaImagen4(options),
        "Imagen 4"
      );
    } catch (err) {
      console.warn(
        "[generateImage] Imagen 4 failed after retries:",
        (err as Error).message?.substring(0, 120)
      );
    }
  }

  // المستوى الثاني: Gemini 3 Pro Image — 3 محاولات
  try {
    console.log("[generateImage] Trying Gemini 3 Pro Image...");
    return await withRetry(
      () => generateImageViaGemini(options, "gemini-3-pro-image-preview"),
      "Gemini 3 Pro Image"
    );
  } catch (err) {
    console.warn(
      "[generateImage] Gemini 3 Pro Image failed after retries:",
      (err as Error).message?.substring(0, 120)
    );
  }

  // المستوى الثالث: Gemini 2.5 Flash Image — 3 محاولات
  try {
    console.log("[generateImage] Trying Gemini 2.5 Flash Image...");
    return await withRetry(
      () => generateImageViaGemini(options, "gemini-2.5-flash-image"),
      "Gemini 2.5 Flash Image"
    );
  } catch (err) {
    console.warn(
      "[generateImage] Gemini 2.5 Flash Image failed after retries:",
      (err as Error).message?.substring(0, 120)
    );
  }

  // المستوى الرابع: Gemini 3.1 Flash Image Preview — 3 محاولات
  try {
    console.log("[generateImage] Trying Gemini 3.1 Flash Image Preview...");
    return await withRetry(
      () => generateImageViaGemini(options, "gemini-3.1-flash-image-preview"),
      "Gemini 3.1 Flash Image"
    );
  } catch (err) {
    console.warn(
      "[generateImage] Gemini 3.1 Flash Image failed after retries:",
      (err as Error).message?.substring(0, 120)
    );
  }

  throw new Error(
    "فشل توليد الصورة: جميع نماذج Google (Imagen 4, Gemini 3 Pro, Gemini 2.5 Flash, Gemini 3.1 Flash) غير متاحة حالياً بعد 3 محاولات لكل منها. يرجى المحاولة بعد دقيقة."
  );
}
