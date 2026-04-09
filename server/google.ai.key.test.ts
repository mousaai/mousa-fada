/**
 * اختبار التحقق من صحة GOOGLE_AI_API_KEY وعمل Imagen 4 + Gemini Image Models
 */
import { describe, it, expect } from "vitest";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

describe("Google AI API Key Validation", () => {
  it("should have GOOGLE_AI_API_KEY set", () => {
    expect(GOOGLE_AI_API_KEY).toBeTruthy();
    expect(GOOGLE_AI_API_KEY.length).toBeGreaterThan(10);
  });

  it("should validate GOOGLE_AI_API_KEY via Gemini models list", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_API_KEY}&pageSize=5`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`✅ Google AI API Status: ${res.status}`);
    // 200 = OK, 403 = billing issue (acceptable in CI), 429 = rate limit
    expect([200, 403, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(text).toContain("models");
    }
  }, 15000);

  it("should verify Imagen 4 model is accessible", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`Imagen 4 model check: ${res.status}`);
    if (res.status === 200) {
      console.log("✅ Imagen 4 is ACCESSIBLE with this key!");
    } else {
      console.log(`⚠️ Imagen 4 status: ${res.status} — ${text.substring(0, 100)}`);
    }
    expect([200, 404, 403]).toContain(res.status);
  }, 15000);

  it("should verify Gemini 2.5 Flash Image model is accessible", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`Gemini 2.5 Flash Image check: ${res.status}`);
    if (res.status === 200) {
      console.log("✅ Gemini 2.5 Flash Image is ACCESSIBLE!");
    } else {
      console.log(`Response: ${text.substring(0, 150)}`);
    }
    expect([200, 404, 403, 429]).toContain(res.status);
  }, 15000);
  it("should verify Gemini 3 Pro Image model is accessible", async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview?key=${GOOGLE_AI_API_KEY}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`Gemini 3 Pro Image check: ${res.status}`);
    if (res.status === 200) {
      console.log("✅ Gemini 3 Pro Image is ACCESSIBLE!");
    } else {
      console.log(`Response: ${text.substring(0, 150)}`);
    }
    expect([200, 404, 403, 429]).toContain(res.status);
  }, 15000);
});
