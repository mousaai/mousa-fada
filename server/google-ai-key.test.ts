import { describe, it, expect } from "vitest";

/**
 * اختبار مفتاح Google AI API
 * المفتاح الجديد من مشروع Mousa ai: AIzaSyA07yksSaqtSYAzqo2T1U1ANu1hByVLeK8
 * يدعم: gemini-2.5-flash فقط (المفاتيح القديمة مُبلَّغ عنها)
 */
describe("Google AI API Key Validation", () => {
  // المفتاح الجديد من مشروع Mousa ai
  const MOUSA_AI_KEY = "AIzaSyA07yksSaqtSYAzqo2T1U1ANu1hByVLeK8";

  it("should have MY_GOOGLE_AI_KEY configured in env.ts", async () => {
    // env.ts يستخدم MOUSA_AI_GEMINI_KEY مباشرة (بدون الاعتماد على .env القديم)
    const { ENV } = await import("server/_core/env");
    const key = ENV.googleAiApiKey || ENV.openAiApiKey;
    expect(key).toBeTruthy();
    expect(key.startsWith("AIzaSy")).toBe(true);
    expect(key.length).toBeGreaterThan(30);
  });

  it("env.ts should use the new Mousa ai key (not old leaked keys)", async () => {
    const { ENV } = await import("server/_core/env");
    const key = ENV.googleAiApiKey || ENV.openAiApiKey;
    // يجب أن يكون المفتاح الجديد
    expect(key).toBe(MOUSA_AI_KEY);
    // لا يجب أن يكون المفاتيح القديمة المُبلَغ عنها
    expect(key).not.toContain("AIMIAu6wWY");
    expect(key).not.toContain("Be2Jiub9Az");
    expect(key).not.toContain("DDdg3c1vOb");
  });

  it("should successfully call Gemini API with the new Mousa ai key", async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${MOUSA_AI_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
        }),
      }
    );
    expect(response.ok).toBe(true);
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    expect(text.length).toBeGreaterThan(0);
    console.log("✅ Gemini API يعمل بنجاح:", text.substring(0, 50));
  }, 30000);
});
