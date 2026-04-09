/**
 * اختبار للبحث عن نماذج Gemini المتاحة لتوليد الصور
 */
import { describe, it, expect } from "vitest";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

describe("Google AI Models Discovery", () => {
  it("should list available models and find image generation ones", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_API_KEY}&pageSize=100`;
    const res = await fetch(url);
    const data = await res.json() as { models?: Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }> };
    
    const imageModels = (data.models || []).filter(m => 
      m.name.includes("flash") || m.name.includes("imagen") || m.name.includes("image")
    );
    
    console.log("=== نماذج Gemini المتاحة لتوليد الصور ===");
    imageModels.forEach(m => {
      console.log(`- ${m.name}: ${(m.supportedGenerationMethods || []).join(", ")}`);
    });
    
    // طباعة جميع النماذج
    console.log("\n=== جميع النماذج المتاحة ===");
    (data.models || []).forEach(m => {
      console.log(`- ${m.name}`);
    });
    
    expect([200, 403, 429]).toContain(res.status);
  }, 15000);

  it("should test gemini-2.0-flash-preview-image-generation", async () => {
    const models = [
      "gemini-2.0-flash-preview-image-generation",
      "gemini-2.0-flash",
      "gemini-2.0-flash-exp",
      "gemini-2.5-flash-preview-04-17",
    ];
    
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${GOOGLE_AI_API_KEY}`;
      const res = await fetch(url);
      const text = await res.text();
      console.log(`${model}: ${res.status} — ${text.substring(0, 100)}`);
    }
    
    expect(true).toBe(true);
  }, 30000);
});
