/**
 * Image generation helper — نظام توليد الصور متعدد المستويات
 * الأولوية (بالترتيب):
 *   1. imagen-4.0-generate-001 (أعلى جودة — Google Imagen 4)
 *   2. gemini-3-pro-image-preview (Gemini 3 Pro للصور — جودة عالية)
 *   3. gemini-2.5-flash-image (Gemini 2.5 Flash للصور — سريع ويدعم التعديل)
 *   4. gemini-3.1-flash-image-preview (Gemini 3.1 Flash للصور)
 *   5. Manus Forge (احتياطي نهائي)
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
  /** النموذج المستخدم — افتراضي: imagen-4.0-generate-001 */
  model?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

/**
 * توليد الصور عبر Google Imagen 4 (أعلى جودة فوتوريالستيك)
 * يستخدم imagen-4.0-generate-001 عبر Generative Language API
 * ملاحظة: Imagen 4 لا يدعم تعديل الصور، فقط التوليد من نص
 */
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

  const result = await response.json() as {
    predictions?: Array<{
      bytesBase64Encoded?: string;
      mimeType?: string;
    }>;
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

  return { url };
}

/**
 * توليد الصور عبر Gemini (يدعم التوليد والتعديل)
 * النماذج المدعومة:
 *   - gemini-3-pro-image-preview (أعلى جودة)
 *   - gemini-2.5-flash-image (سريع)
 *   - gemini-3.1-flash-image-preview (أحدث)
 */
async function generateImageViaGemini(
  options: GenerateImageOptions,
  model: string = "gemini-2.5-flash-image"
): Promise<GenerateImageResponse> {
  const apiKey = ENV.googleAiApiKey;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // بناء المحتوى — نص فقط أو نص + صورة للتعديل
  const parts: Array<Record<string, unknown>> = [
    { text: options.prompt }
  ];

  // إضافة الصور المرجعية إذا وُجدت (للتعديل)
  if (options.originalImages && options.originalImages.length > 0) {
    for (const img of options.originalImages) {
      if (img.b64Json) {
        parts.push({
          inline_data: {
            mime_type: img.mimeType || "image/jpeg",
            data: img.b64Json,
          }
        });
      } else if (img.url) {
        // تحميل الصورة وتحويلها لـ base64
        try {
          const imgResponse = await fetch(img.url);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const contentType = imgResponse.headers.get("content-type") || img.mimeType || "image/jpeg";
            parts.push({
              inline_data: {
                mime_type: contentType,
                data: base64,
              }
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
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
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
      `Gemini (${model}) image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail.substring(0, 200)}` : ""}`
    );
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { data: string; mimeType: string };
        }>;
      };
    }>;
  };

  // استخراج الصورة من الرد
  const candidate = result.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error(`Gemini (${model}) did not return an image in the response`);
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";

  // رفع الصورة لـ S3
  const { url } = await storagePut(
    `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
    buffer,
    mimeType
  );

  return { url };
}

/**
 * توليد الصور عبر Manus Forge (احتياطي نهائي)
 */
async function generateImageViaManus(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Manus image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: { b64Json: string; mimeType: string };
  };

  const buffer = Buffer.from(result.image.b64Json, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );

  return { url };
}

/**
 * الدالة الرئيسية — نظام توليد متعدد المستويات
 * الترتيب:
 *   للصور الجديدة: Imagen 4 → Gemini 3 Pro Image → Gemini 2.5 Flash Image → Gemini 3.1 Flash Image → Manus Forge
 *   للتعديل: Gemini 3 Pro Image → Gemini 2.5 Flash Image → Gemini 3.1 Flash Image → Manus Forge
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const googleKey = ENV.googleAiApiKey;
  const hasOriginalImages = options.originalImages && options.originalImages.length > 0;

  if (googleKey && googleKey.trim().length > 0) {
    // المستوى الأول: Google Imagen 4 (أعلى جودة — للصور الجديدة فقط)
    if (!hasOriginalImages) {
      try {
        console.log("[generateImage] Trying Imagen 4 (highest quality)...");
        return await generateImageViaImagen4(options);
      } catch (err) {
        console.warn("[generateImage] Imagen 4 failed:", (err as Error).message?.substring(0, 120));
      }
    }

    // المستوى الثاني: Gemini 3 Pro Image (جودة عالية، يدعم التعديل)
    try {
      console.log("[generateImage] Trying Gemini 3 Pro Image...");
      return await generateImageViaGemini(options, "gemini-3-pro-image-preview");
    } catch (err) {
      console.warn("[generateImage] Gemini 3 Pro Image failed:", (err as Error).message?.substring(0, 120));
    }

    // المستوى الثالث: Gemini 2.5 Flash Image (سريع، يدعم التعديل)
    try {
      console.log("[generateImage] Trying Gemini 2.5 Flash Image...");
      return await generateImageViaGemini(options, "gemini-2.5-flash-image");
    } catch (err) {
      console.warn("[generateImage] Gemini 2.5 Flash Image failed:", (err as Error).message?.substring(0, 120));
    }

    // المستوى الرابع: Gemini 3.1 Flash Image Preview
    try {
      console.log("[generateImage] Trying Gemini 3.1 Flash Image Preview...");
      return await generateImageViaGemini(options, "gemini-3.1-flash-image-preview");
    } catch (err) {
      console.warn("[generateImage] Gemini 3.1 Flash Image failed:", (err as Error).message?.substring(0, 120));
    }
  }

  // المستوى الأخير: Manus Forge (احتياطي نهائي)
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("No image generation API configured. Set GOOGLE_AI_API_KEY for Google APIs or BUILT_IN_FORGE_API_URL/KEY for Manus.");
  }

  console.log("[generateImage] Falling back to Manus Forge...");
  return await generateImageViaManus(options);
}
