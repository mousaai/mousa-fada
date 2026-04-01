/**
 * Image generation helper — Gemini Nano Banana (Google AI Studio) أولاً
 * يستخدم gemini-2.5-flash-image (Nano Banana) عبر Google Generative AI SDK
 * مع fallback لـ Manus Forge إذا لم يكن OPENAI_API_KEY متاحاً
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{ url: "https://example.com/original.jpg" }]
 *   });
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
  /** النموذج المستخدم — افتراضي: gemini-2.5-flash-image */
  model?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

/**
 * توليد الصور عبر Gemini Nano Banana (Google AI Studio)
 * يستخدم REST API مباشرة بدون SDK إضافي
 */
async function generateImageViaGemini(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.openAiApiKey;
  const model = options.model || "gemini-2.5-flash-image";
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
      `Gemini image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
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
 * توليد الصور عبر Manus Forge (احتياطي)
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
 * الدالة الرئيسية — تستخدم Gemini Nano Banana أولاً، وتعود لـ Manus Forge احتياطياً
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  // الأولوية: Google Gemini Nano Banana مباشرة
  if (ENV.openAiApiKey && ENV.openAiApiKey.trim().length > 0) {
    try {
      return await generateImageViaGemini(options);
    } catch (geminiError) {
      console.warn("[generateImage] Gemini failed, falling back to Manus Forge:", geminiError);
      // إذا فشل Gemini وكان Manus Forge متاحاً، استخدمه كاحتياطي
      if (ENV.forgeApiUrl && ENV.forgeApiKey) {
        return await generateImageViaManus(options);
      }
      throw geminiError;
    }
  }

  // احتياطي: Manus Forge
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("No image generation API configured. Set OPENAI_API_KEY for Gemini or BUILT_IN_FORGE_API_URL/KEY for Manus.");
  }

  return await generateImageViaManus(options);
}
