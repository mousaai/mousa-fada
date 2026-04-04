import { describe, it, expect } from "vitest";

/**
 * اختبار التحقق من صحة مفتاح Gemini API الجديد من مشروع Mousa ai
 * النموذج: gemini-2.5-flash (الوحيد المتاح للمستخدمين الجدد)
 */
describe("Gemini API Key Validation", () => {
  const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
  // المفتاح الجديد من مشروع Mousa ai — يدعم gemini-2.5-flash فقط
  const NEW_API_KEY = "AIzaSyA07yksSaqtSYAzqo2T1U1ANu1hByVLeK8";

  it("should validate new Mousa ai Gemini key via direct HTTP call", async () => {
    const response = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NEW_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "قل: مرحبا" }],
        max_tokens: 500,
      }),
    });

    const data = (await response.json()) as any;

    // التحقق من عدم وجود أخطاء
    if (Array.isArray(data) && data[0]?.error) {
      throw new Error(`API Error: ${data[0].error.code} - ${data[0].error.message}`);
    }
    if (data.error) {
      throw new Error(`API Error: ${data.error.code} - ${data.error.message}`);
    }

    expect(response.status).toBe(200);
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
    expect(data.choices[0].message.content).toBeTruthy();

    console.log("✅ Gemini API Key صالح (مشروع Mousa ai)");
    console.log("✅ النموذج:", data.model);
    console.log("✅ الرد:", data.choices[0].message.content);
  }, 30000);

  it("should handle image analysis with gemini-2.5-flash", async () => {
    // اختبار تحليل صورة بسيط (base64 صورة صغيرة 1x1 pixel PNG)
    const tiny1x1PNG =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const response = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NEW_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "ما الذي تراه في هذه الصورة؟ أجب بجملة قصيرة." },
              { type: "image_url", image_url: { url: tiny1x1PNG } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = (await response.json()) as any;

    if (Array.isArray(data) && data[0]?.error) {
      throw new Error(`Image Analysis Error: ${data[0].error.code} - ${data[0].error.message}`);
    }
    if (data.error) {
      throw new Error(`Image Analysis Error: ${data.error.code} - ${data.error.message}`);
    }

    expect(response.status).toBe(200);
    expect(data.choices[0].message.content).toBeTruthy();

    console.log("✅ تحليل الصور يعمل بنجاح");
    console.log("✅ الرد:", data.choices[0].message.content?.substring(0, 100));
  }, 30000);

  it("should use invokeLLM helper correctly with new key", async () => {
    // اختبار الـ helper مباشرة — يجب أن يستخدم المفتاح الجديد من env.ts
    const { invokeLLM } = await import("./_core/llm");

    const result = await invokeLLM({
      messages: [{ role: "user", content: "قل: نجح الاختبار" }],
    });

    expect(result).toBeDefined();
    expect(result.choices).toBeDefined();
    expect(result.choices.length).toBeGreaterThan(0);
    expect(result.choices[0].message.content).toBeTruthy();

    console.log("✅ invokeLLM helper يعمل بنجاح");
    console.log("✅ الرد:", result.choices[0].message.content);
  }, 30000);
});
