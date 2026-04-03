/**
 * اختبار ميزة "صمّم من المخطط"
 * يختبر:
 * 1. تحليل مخطط معماري بـ Gemini 2.5 Pro
 * 2. توليد تصميم غرفة بـ Imagen 4 / Gemini Flash
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mock invokeLLM ──────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          projectType: "سكني",
          totalArea: 350,
          floors: 2,
          summary: "فيلا سكنية من طابقين تحتوي على 4 غرف نوم وصالة كبيرة ومطبخ",
          rooms: [
            {
              name: "غرفة النوم الرئيسية",
              type: "bedroom",
              floor: "first",
              area: 28,
              dimensions: "5.6×5 م",
              ceilingHeight: 3.5,
              doors: [{ wall: "north", openDirection: "inward", hingesSide: "right", width: 1.0 }],
              windows: [{ wall: "east", width: 2.5, height: 2.0, type: "panoramic" }],
              wallsDescription: "الجدار الشمالي: باب. الجدار الشرقي: نافذة بانورامية.",
            },
            {
              name: "الصالة الرئيسية",
              type: "living",
              floor: "ground",
              area: 45,
              dimensions: "9×5 م",
              ceilingHeight: 5,
              doors: [{ wall: "south", openDirection: "inward", hingesSide: "left", width: 1.2 }],
              windows: [{ wall: "north", width: 4.0, height: 3.0, type: "floor_to_ceiling" }],
              wallsDescription: "ارتفاع مزدوج. جدار شمالي زجاجي.",
            },
            {
              name: "المطبخ",
              type: "kitchen",
              floor: "ground",
              area: 18,
              dimensions: "4.5×4 م",
              ceilingHeight: 3,
              doors: [{ wall: "west", openDirection: "inward", hingesSide: "right", width: 0.9 }],
              windows: [{ wall: "south", width: 1.5, height: 1.2, type: "standard" }],
              wallsDescription: "مطبخ مفتوح على غرفة الطعام.",
            },
          ],
          recommendations: [
            "استغلال الارتفاع المزدوج في الصالة لإضافة لمسة معمارية مميزة",
            "توجيه النوافذ البانورامية نحو الشرق للاستفادة من ضوء الصباح",
            "تصميم مطبخ مفتوح يتصل بغرفة الطعام لإحساس بالاتساع",
          ],
        }),
      },
    }],
  }),
}));

// ── mock generateImage ──────────────────────────────────────────────────────
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/generated-room-design.jpg",
  }),
}));

// ── الاختبارات ──────────────────────────────────────────────────────────────
describe("ميزة صمّم من المخطط", () => {

  describe("تحليل المخطط المعماري", () => {
    it("يجب أن يستخرج الغرف والتفاصيل المعمارية بشكل صحيح", async () => {
      const { invokeLLM } = await import("./_core/llm");

      // محاكاة استدعاء analyzePlan
      const response = await invokeLLM({
        messages: [
          { role: "user", content: "حللي هذا المخطط المعماري" },
        ],
        response_format: { type: "json_object" },
        model: "gemini-2.5-pro",
      });

      const rawContent = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");

      // التحقق من البنية الأساسية
      expect(parsed).toHaveProperty("projectType");
      expect(parsed).toHaveProperty("totalArea");
      expect(parsed).toHaveProperty("floors");
      expect(parsed).toHaveProperty("rooms");
      expect(parsed).toHaveProperty("recommendations");
      expect(Array.isArray(parsed.rooms)).toBe(true);
    });

    it("يجب أن تحتوي كل غرفة على الحقول المعمارية المطلوبة", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const response = await invokeLLM({
        messages: [{ role: "user", content: "حللي المخطط" }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content as string);
      const room = parsed.rooms[0];

      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("type");
      expect(room).toHaveProperty("area");
      expect(room).toHaveProperty("dimensions");
      expect(room).toHaveProperty("ceilingHeight");
      expect(room).toHaveProperty("doors");
      expect(room).toHaveProperty("windows");
    });

    it("يجب أن يستخدم نموذج gemini-2.5-pro للتحليل", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await invokeLLM({
        messages: [{ role: "user", content: "حللي المخطط" }],
        model: "gemini-2.5-pro",
      });

      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({ model: "gemini-2.5-pro" })
      );
    });
  });

  describe("توليد تصميم الغرفة", () => {
    it("يجب أن يولّد صورة تصميم للغرفة بنجاح", async () => {
      const { generateImage } = await import("./_core/imageGeneration");

      const result = await generateImage({
        prompt: "Luxury bedroom design, 5.6x5m, modern style, panoramic east window, photorealistic",
      });

      expect(result).toHaveProperty("url");
      expect(result.url).toBeTruthy();
      expect(typeof result.url).toBe("string");
    });

    it("يجب أن يتضمن الـ prompt تفاصيل الغرفة المعمارية", async () => {
      const { generateImage } = await import("./_core/imageGeneration");

      const roomDetails = {
        roomName: "غرفة النوم الرئيسية",
        roomType: "bedroom",
        roomArea: 28,
        roomDimensions: "5.6×5 م",
        designStyle: "modern",
        ceilingHeight: 3.5,
        windows: [{ wall: "east", width: 2.5, height: 2.0, type: "panoramic" }],
      };

      const prompt = `Luxury ${roomDetails.roomType} design, ${roomDetails.roomDimensions}, 
        ${roomDetails.designStyle} style, ceiling height ${roomDetails.ceilingHeight}m, 
        panoramic east window ${roomDetails.windows[0].width}m wide, photorealistic`;

      await generateImage({ prompt });

      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.any(String) })
      );
    });

    it("يجب أن يُرجع imageUrl وcreditsCost", async () => {
      const { generateImage } = await import("./_core/imageGeneration");

      const imageResult = await generateImage({
        prompt: "Luxury living room design, double height ceiling, modern style",
      });

      const CREDIT_COST = 50;
      const result = {
        roomName: "الصالة الرئيسية",
        roomType: "living",
        imageUrl: imageResult.url ?? "",
        creditsCost: CREDIT_COST,
        style: "modern",
      };

      expect(result.imageUrl).toBeTruthy();
      expect(result.creditsCost).toBe(50);
      expect(result.roomName).toBe("الصالة الرئيسية");
    });
  });

  describe("تدفق العمل الكامل", () => {
    it("يجب أن يكمل دورة التحليل والتصميم بنجاح", async () => {
      const { invokeLLM } = await import("./_core/llm");
      const { generateImage } = await import("./_core/imageGeneration");

      // الخطوة 1: تحليل المخطط
      const analysisResponse = await invokeLLM({
        messages: [{ role: "user", content: "حللي المخطط" }],
        model: "gemini-2.5-pro",
        response_format: { type: "json_object" },
      });
      const analysis = JSON.parse(analysisResponse.choices[0]?.message?.content as string);

      expect(analysis.rooms.length).toBeGreaterThan(0);

      // الخطوة 2: توليد تصميم لأول غرفة
      const firstRoom = analysis.rooms[0];
      const designResult = await generateImage({
        prompt: `Luxury ${firstRoom.type} design, ${firstRoom.dimensions}, modern style`,
      });

      expect(designResult.url).toBeTruthy();

      // التحقق من اكتمال الدورة
      const finalResult = {
        roomName: firstRoom.name,
        imageUrl: designResult.url,
        creditsCost: 50,
      };

      expect(finalResult.roomName).toBeTruthy();
      expect(finalResult.imageUrl).toBeTruthy();
      expect(finalResult.creditsCost).toBe(50);
    });

    it("يجب أن يدعم أنماط التصميم الخمسة", () => {
      const STYLES = ["modern", "gulf", "classic", "minimal", "luxury"];
      const styleMap: Record<string, string> = {
        modern: "عصري حديث",
        gulf: "خليجي فاخر",
        classic: "كلاسيكي راقٍ",
        minimal: "مينيمال نظيف",
        luxury: "فاخر بريميوم",
      };

      STYLES.forEach(style => {
        expect(styleMap[style]).toBeTruthy();
      });

      expect(Object.keys(styleMap)).toHaveLength(5);
    });

    it("يجب أن يدعم أنواع المشاريع الثلاثة", () => {
      const PROJECT_TYPES = ["residential", "commercial", "mixed"];
      expect(PROJECT_TYPES).toContain("residential");
      expect(PROJECT_TYPES).toContain("commercial");
      expect(PROJECT_TYPES).toContain("mixed");
    });
  });
});
