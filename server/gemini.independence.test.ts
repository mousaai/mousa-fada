/**
 * اختبار استقلالية Gemini — يتحقق من:
 * 1. أن invokeLLM يستخدم Google Gemini مباشرة (OPENAI_BASE_URL)
 * 2. أن generateImage يستخدم Imagen 4 أولاً ثم Gemini 3 Pro Image ثم Gemini 2.5 Flash Image ثم Manus Forge
 * 3. نظام fallback متعدد المستويات
 */
import { describe, it, expect, vi } from "vitest";

// Mock ENV — يستخدم MY_GOOGLE_AI_KEY كأولوية (Manus يحمي OPENAI_API_KEY)
const EFFECTIVE_KEY = process.env.MY_GOOGLE_AI_KEY || process.env.OPENAI_API_KEY || "test-key";
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
  }, 10000);

  it("يجب أن يعود لـ Gemini 3 Pro Image إذا فشل Imagen 4", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      // Imagen 4 يفشل
      .mockResolvedValueOnce({ ok: false, text: async () => "Imagen 4 error", statusText: "Error", status: 500 } as Response)
      // Gemini 3 Pro Image ينجح
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: Buffer.from("gemini3-pro-image").toString("base64"),
                  mimeType: "image/png",
                }
              }]
            }
          }]
        }),
      } as Response);

    const { generateImage } = await import("server/_core/imageGeneration");
    const result = await generateImage({ prompt: "غرفة نوم هادئة" });

    expect(result.url).toBeDefined();
    // يجب أن يُستدعى مرتين: Imagen 4 (فشل) + Gemini 3 Pro Image (نجح)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondUrl = fetchSpy.mock.calls[1]?.[0] as string;
    expect(secondUrl).toContain("gemini-3-pro-image-preview");

    fetchSpy.mockRestore();
  }, 10000);

  it("يجب أن يعود لـ Manus Forge إذا فشلت جميع نماذج Google", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      // Imagen 4 يفشل
      .mockResolvedValueOnce({ ok: false, text: async () => "Imagen 4 error", statusText: "Error", status: 500 } as Response)
      // Gemini 3 Pro Image يفشل (لا يُعيد صورة)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "no image" }] } }] }),
      } as Response)
      // Gemini 2.5 Flash Image يفشل
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "no image" }] } }] }),
      } as Response)
      // Gemini 3.1 Flash Image يفشل
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "no image" }] } }] }),
      } as Response)
      // Manus Forge ينجح
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          image: {
            b64Json: Buffer.from("manus-image").toString("base64"),
            mimeType: "image/png",
          }
        }),
      } as Response);

    const { generateImage } = await import("server/_core/imageGeneration");
    const result = await generateImage({ prompt: "مطبخ عصري" });

    expect(result.url).toBeDefined();
    // 4 محاولات Google + 1 Manus Forge
    expect(fetchSpy).toHaveBeenCalledTimes(5);

    fetchSpy.mockRestore();
  }, 15000);
});
