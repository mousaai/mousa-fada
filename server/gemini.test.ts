/**
 * اختبار الاتصال بـ Google AI Studio عبر OpenAI-compatible endpoint
 */
import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("Google AI Studio (Gemini) Connection", () => {
  it("يجب أن يتصل بـ Gemini ويعيد رداً", async () => {
    const response = await invokeLLM({
      messages: [
        { role: "user", content: "قل: مرحباً فقط" },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    const content = response.choices[0]?.message?.content;
    expect(typeof content).toBe("string");
    expect((content as string).length).toBeGreaterThan(0);
    console.log("✅ Gemini response:", content);
  }, 30000);
});
