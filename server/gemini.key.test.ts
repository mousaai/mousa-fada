import { describe, it, expect } from "vitest";

// اختبار التحقق من صحة مفتاح Gemini API الجديد
describe("Gemini API Key Validation", () => {
  it("should validate the new Gemini API key via direct HTTP call", async () => {
    const apiKey = "AIzaSyBe2Jiub9AzErcyzhhqWQv8UVwFNW0VTok";
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "مرحبا" }],
        max_tokens: 10,
      }),
    });

    // يجب أن يكون الرد 200 أو على الأقل ليس 400 (مفتاح غير صالح)
    expect(response.status).not.toBe(400);
    expect(response.status).toBeLessThan(500);
    
    const data = await response.json() as any;
    // لا يجب أن يحتوي على رسالة خطأ "API key not valid"
    if (data.error) {
      expect(data.error.message).not.toContain("API key not valid");
    }
    
    console.log("✅ Gemini API key status:", response.status);
    console.log("✅ Response:", JSON.stringify(data).substring(0, 100));
  }, 30000);
});
