/**
 * اختبار منظومة Gemini — يتحقق من صحة التوجيه لـ Google Gemini مباشرة
 * يستخدم mock لتجنب استهلاك API key في بيئة الاختبار
 */
import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Google AI Studio (Gemini) — توجيه الطلبات", () => {
  it("يجب أن يوجّه طلبات النصوص لـ Google Gemini مباشرة", async () => {
    // Mock fetch لالتقاط الطلب
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: "assistant", content: "مرحباً" } }],
      }),
    } as Response);

    const { invokeLLM } = await import("./_core/llm");
    const response = await invokeLLM({
      messages: [{ role: "user", content: "قل: مرحباً فقط" }],
    });

    // التحقق من أن الطلب ذهب لـ Google وليس Manus
    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    console.log("✅ URL المستخدم:", calledUrl);

    expect(calledUrl).toContain("generativelanguage.googleapis.com");
    expect(calledUrl).not.toContain("forge.manus");
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
  });

  it("يجب أن يستخدم OPENAI_API_KEY في Authorization header", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: "assistant", content: "تصميم" } }],
      }),
    } as Response);

    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({
      messages: [{ role: "user", content: "اقترح تصميم داخلي" }],
    });

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    const authHeader = headers?.authorization || "";
    console.log("✅ Authorization header:", authHeader.substring(0, 20) + "...");

    // يجب أن يحتوي على Bearer + مفتاح (ليس مفتاح Manus)
    expect(authHeader).toMatch(/^Bearer /);
    expect(authHeader).not.toContain("manus-key");
  });

  it("يجب أن يستخدم نموذج Gemini الصحيح", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: "assistant", content: "ok" } }],
      }),
    } as Response);

    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({
      messages: [{ role: "user", content: "test" }],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
    console.log("✅ النموذج المستخدم:", body.model);

    expect(body.model).toContain("gemini");
    expect(body.thinking).toBeUndefined(); // يجب ألا يحتوي على thinking
  });
});
