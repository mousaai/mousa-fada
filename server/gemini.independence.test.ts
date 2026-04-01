/**
 * اختبار استقلالية Gemini — يتحقق من:
 * 1. أن invokeLLM يستخدم Google Gemini مباشرة (OPENAI_BASE_URL)
 * 2. أن generateImage يستخدم Imagen 3 أولاً ثم Gemini Flash ثم Manus Forge
 * 3. نظام fallback متعدد المستويات
 */
import { describe, it, expect, vi } from "vitest";

// Mock ENV
vi.mock("server/_core/env", () => ({
  ENV: {
    openAiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    openAiApiKey: process.env.OPENAI_API_KEY || "test-key",
    openAiModel: "gemini-2.5-flash",
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
    expect(calledHeaders?.authorization).toContain(process.env.OPENAI_API_KEY || "test-key");
    expect(calledHeaders?.authorization).not.toContain("manus-key");

    fetchSpy.mockRestore();
  });
});

describe("استقلالية Gemini — الصور (نظام متعدد المستويات)", () => {
  it("يجب أن يستخدم Imagen 3 أولاً لتوليد الصور الجديدة", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictions: [{
          bytesBase64Encoded: Buffer.from("fake-imagen3-data").toString("base64"),
          mimeType: "image/png",
        }]
      }),
    } as Response);

    const { generateImage } = await import("server/_core/imageGeneration");
    const result = await generateImage({ prompt: "غرفة معيشة عصرية" });

    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("generativelanguage.googleapis.com");
    expect(calledUrl).toContain("imagen-3.0-generate-002");
    expect(result.url).toBeDefined();

    fetchSpy.mockRestore();
  }, 10000);

  it("يجب أن يعود لـ Gemini Flash إذا فشل Imagen 3", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      // Imagen 3 يفشل
      .mockResolvedValueOnce({ ok: false, text: async () => "Imagen 3 error", statusText: "Error", status: 500 } as Response)
      // Gemini Flash ينجح
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: Buffer.from("gemini-flash-image").toString("base64"),
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
    // يجب أن يُستدعى مرتين: Imagen 3 (فشل) + Gemini Flash (نجح)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondUrl = fetchSpy.mock.calls[1]?.[0] as string;
    expect(secondUrl).toContain("gemini-2.0-flash-exp");

    fetchSpy.mockRestore();
  }, 10000);

  it("يجب أن يعود لـ Manus Forge إذا فشل Imagen 3 وGemini Flash", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      // Imagen 3 يفشل
      .mockResolvedValueOnce({ ok: false, text: async () => "Imagen 3 error", statusText: "Error", status: 500 } as Response)
      // Gemini Flash يفشل (لا يُعيد صورة)
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
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    fetchSpy.mockRestore();
  }, 10000);
});
