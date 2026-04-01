/**
 * اختبار استقلالية Gemini — يتحقق من:
 * 1. أن invokeLLM يستخدم Google Gemini مباشرة (OPENAI_BASE_URL)
 * 2. أن generateImage يستخدم Gemini Nano Banana مباشرة
 * 3. قياس الأداء (زمن الاستجابة)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("استقلالية Gemini — الصور", () => {
  it("يجب أن يستخدم Gemini Nano Banana وليس Manus Forge للصور", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from("fake-image-data").toString("base64"),
                mimeType: "image/png",
              }
            }]
          }
        }]
      }),
    } as Response);

    const { generateImage } = await import("server/_core/imageGeneration");
    const result = await generateImage({ prompt: "غرفة معيشة عصرية" });

    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("generativelanguage.googleapis.com");
    expect(calledUrl).toContain("gemini-2.5-flash-image");
    expect(result.url).toBeDefined();

    fetchSpy.mockRestore();
  });

  it("يجب أن يعود لـ Manus Forge إذا فشل Gemini", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("Gemini unavailable"))
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
    const result = await generateImage({ prompt: "غرفة نوم هادئة" });

    expect(result.url).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });
});
