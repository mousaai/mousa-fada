import { describe, it, expect } from "vitest";

describe("Google AI API Key Validation", () => {
  it("should have MY_GOOGLE_AI_KEY configured", () => {
    const key = process.env.MY_GOOGLE_AI_KEY;
    expect(key).toBeTruthy();
    expect(key!.startsWith("AIzaSy")).toBe(true);
    expect(key!.length).toBeGreaterThan(30);
  });

  it("MY_GOOGLE_AI_KEY should be the new key (not the old system key)", () => {
    const key = process.env.MY_GOOGLE_AI_KEY;
    // المفتاح القديم: AIzaSyDDdg3c1vObcY... (مفتاح Manus الافتراضي)
    // المفتاح الجديد: AIzaSyAIMIAu6wWY... (مفتاح My First Project)
    expect(key).not.toBe("AIzaSyDDdg3c1vObcYMyLxGLU7oIN5");
    expect(key!.includes("AIMIAu")).toBe(true);
  });

  it("should successfully call Gemini API with the new key", async () => {
    const key = process.env.MY_GOOGLE_AI_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
        }),
      }
    );
    expect(response.ok).toBe(true);
    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    expect(text.length).toBeGreaterThan(0);
  }, 15000);
});
