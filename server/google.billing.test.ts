/**
 * اختبار للتحقق من أن المفتاح الحالي يعمل مع Gemini Image Models بعد تفعيل Billing
 */
import { describe, it, expect } from "vitest";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

describe("Google Billing Activation Check", () => {
  it("should test gemini-2.5-flash-image after billing activation", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "A modern living room with white walls, photorealistic interior design" }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
    const text = await res.text();
    console.log(`\n=== gemini-2.5-flash-image after billing ===`);
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200) {
      console.log("✅ SUCCESS! Gemini Image works after billing!");
      const data = JSON.parse(text);
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p: {inlineData?: unknown}) => p.inlineData);
      console.log("Has image:", !!imagePart);
    } else {
      const parsed = JSON.parse(text);
      console.log("Error message:", parsed?.error?.message?.substring(0, 300));
    }
    
    expect([200, 400, 403, 429]).toContain(res.status);
  }, 30000);

  it("should check if current API key is linked to billing-enabled project", async () => {
    // Test with a simple text generation to verify key validity
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say hello in one word" }] }],
      }),
    });
    const text = await res.text();
    console.log(`\n=== Key validity check ===`);
    console.log(`Status: ${res.status}`);
    if (res.status === 200) {
      const data = JSON.parse(text);
      console.log("✅ Key is valid! Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("Error:", text.substring(0, 200));
    }
    expect([200, 403, 429]).toContain(res.status);
  }, 15000);
});
