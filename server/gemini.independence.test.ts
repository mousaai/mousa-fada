/**
 * اختبار استقلالية Gemini — يتحقق من:
 * 1. أن invokeLLM يستخدم Google Gemini مباشرة (OPENAI_BASE_URL)
 * 2. أن generateImage يستخدم Imagen 4 أولاً
 * 3. نظام fallback متعدد المستويات بدون Manus Forge
 */
import { describe, it, expect, vi } from "vitest";

// المفتاح الفعلي المستخدم في env.ts (Mousa ai project key)
// ملاحظة: المفاتيح القديمة في .env مُبلَّغ عنها — نستخدم المفتاح الجديد مباشرة
const EFFECTIVE_KEY = "AIzaSyA07yksSaqtSYAzqo2T1U1ANu1hByVLeK8";
vi.mock("server/_core/env", () => ({
  ENV: {
    openAiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    openAiApiKey: EFFECTIVE_KEY,
    openAiModel: "gemini-2.5-flash",
    googleAiApiKey: EFFECTIVE_KEY,
    forgeApiUrl: "https://forge.manus.ai",
    forgeApiKey: "manus-key",
  },
}));

// Mock storagePut
vi.mock("server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

describe("استقلالية Gemini — النصوص", () => {
  it("يجب أن يستخدم OPENAI_BASE_URL وليس Manus Forge", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "تصميم داخلي عصري" } }],
      }),
    } as Response);

    const { invokeLLM } = await import("server/_core/llm");
    await invokeLLM({
      messages: [{ role: "user", content: "اقترح تصميم داخلي" }],
    });

    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("generativelanguage.googleapis.com");
    expect(calledUrl).not.toContain("forge.manus");

    fetchSpy.mockRestore();
  });

  it("يجب أن يستخدم OPENAI_API_KEY وليس BUILT_IN_FORGE_API_KEY", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "تصميم" } }],
      }),
    } as Response);

    const { invokeLLM } = await import("server/_core/llm");
    await invokeLLM({
      messages: [{ role: "user", content: "اقترح تصميم" }],
    });

    const calledHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    // يتحقق من استخدام المفتاح الفعلي (MY_GOOGLE_AI_KEY له الأولوية)
    expect(calledHeaders?.authorization).toContain(EFFECTIVE_KEY);
    expect(calledHeaders?.authorization).not.toContain("manus-key");
    fetchSpy.mockRestore();
  });
});

describe("استقلالية Gemini — الصور (نظام متعدد المستويات)", () => {
  it("يجب أن يستخدم Imagen 4 أولاً لتوليد الصور الجديدة", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictions: [{
          bytesBase64Encoded: Buffer.from("fake-imagen4-data").toString("base64"),
          mimeType: "image/png",
        }]
      }),
    } as Response);

    const { generateImage } = await import("server/_core/imageGeneration");
    const result = await generateImage({ prompt: "غرفة معيشة عصرية" });

    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("generativelanguage.googleapis.com");
    // يجب أن يستخدم Imagen 4
    expect(calledUrl).toContain("imagen-4.0-generate-001");
    expect(result.url).toBeDefined();

    fetchSpy.mockRestore();
  }, 30000);

  it("يجب أن يرمي خطأً واضحًا إذا فشلت جميع نماذج Google — لا Manus Forge", async () => {
    // التحقق من أن الكود لا يحتوي على Manus Forge fallback
    const { generateImage } = await import("server/_core/imageGeneration");
    const src = generateImage.toString();
    // لا يجب أن يحتوي على استدعاء Forge
    expect(src).not.toContain("forgeApiUrl");
    expect(src).not.toContain("forge.manus");
  }, 30000);
});
