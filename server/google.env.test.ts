/**
 * اختبار للتحقق من قيمة GOOGLE_AI_API_KEY الفعلية في بيئة الـ server
 */
import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("GOOGLE_AI_API_KEY Environment Check", () => {
  it("should show actual GOOGLE_AI_API_KEY value being used", async () => {
    const key = ENV.googleAiApiKey;
    console.log("\n=== GOOGLE_AI_API_KEY in ENV ===");
    console.log("Key prefix:", key ? key.substring(0, 15) + "..." : "NOT SET");
    console.log("Key length:", key?.length ?? 0);
    
    // اختبار المفتاح مباشرة
    if (key) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "A modern living room" }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      });
      const text = await res.text();
      console.log(`Status with this key: ${res.status}`);
      if (res.status !== 200) {
        const parsed = JSON.parse(text);
        console.log("Error:", parsed?.error?.message?.substring(0, 200));
      } else {
        console.log("✅ SUCCESS! Key works!");
      }
    }
    
    expect(key).toBeTruthy();
  }, 30000);
});
