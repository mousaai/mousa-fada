/**
 * Image generation helper — نظام توليد الصور متعدد المستويات
 * الأولوية:
 *   1. imagen-3.0-generate-002 (أعلى جودة — Google Imagen 3)
 *   2. gemini-2.0-flash-exp (سريع وجيد — Gemini Flash)
 *   3. Manus Forge (احتياطي نهائي)
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
  /** النموذج المستخدم — افتراضي: imagen-3.0-generate-002 */
  model?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

/**
 * توليد الصور عبر Google Imagen 3 (أعلى جودة)
 * يستخدم imagen-3.0-generate-002 عبر Vertex AI / Generative Language API
 */
async function generateImageViaImagen3(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.openAiApiKey;
  const model = "imagen-3.0-generate-002";
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
      `Imagen 3 generation failed (${response.status} ${response.statusText})${detail ? `: ${detail.substring(0, 200)}` : ""}`
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
    throw new Error("Imagen 3 did not return an image in the response");
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
 * توليد الصور عبر Gemini (gemini-2.0-flash-exp أو gemini-2.5-flash-image)
 * يستخدم REST API مباشرة بدون SDK إضافي
 */
async function generateImageViaGemini(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.openAiApiKey;
  // استخدام gemini-2.0-flash-exp كأفضل نموذج Gemini لتوليد الصور
  const model = options.model || "gemini-2.0-flash-exp";
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
      `Gemini image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail.substring(0, 200)}` : ""}`
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
    throw new Error("Gemini did not return an image in the response");
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
 * الترتيب: Imagen 3 → Gemini Flash → Manus Forge
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (ENV.openAiApiKey && ENV.openAiApiKey.trim().length > 0) {
    // المستوى الأول: Google Imagen 3 (أعلى جودة فوتوريالستيك)
    // فقط للصور الجديدة (بدون originalImages) لأن Imagen 3 لا يدعم التعديل
    if (!options.originalImages || options.originalImages.length === 0) {
      try {
        console.log("[generateImage] Trying Imagen 3 (highest quality)...");
        return await generateImageViaImagen3(options);
      } catch (imagen3Error) {
        console.warn("[generateImage] Imagen 3 failed, trying Gemini Flash:", (imagen3Error as Error).message?.substring(0, 100));
      }
    }

    // المستوى الثاني: Gemini Flash (سريع وجيد، يدعم التعديل)
    try {
      console.log("[generateImage] Trying Gemini Flash (gemini-2.0-flash-exp)...");
      return await generateImageViaGemini(options);
    } catch (geminiError) {
      console.warn("[generateImage] Gemini failed, falling back to Manus Forge:", (geminiError as Error).message?.substring(0, 100));
      if (ENV.forgeApiUrl && ENV.forgeApiKey) {
        return await generateImageViaManus(options);
      }
      throw geminiError;
    }
  }

  // المستوى الثالث: Manus Forge (احتياطي نهائي)
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("No image generation API configured. Set OPENAI_API_KEY for Gemini/Imagen or BUILT_IN_FORGE_API_URL/KEY for Manus.");
  }

  return await generateImageViaManus(options);
}
