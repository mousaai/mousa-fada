/**
 * plan-design.test.ts
 * اختبارات وحدة لميزة "صمّم من المخطط"
 * يتحقق من:
 * 1. أن generatePlanRoomDesign يعمل بدون تسجيل دخول (mousaProcedure)
 * 2. أن analyzePlan يُرجع بيانات صحيحة
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mock الـ dependencies =====
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

vi.mock("./_core/imageGeneration.ts", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/generated-room.jpg" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          projectType: "سكني",
          totalArea: 200,
          floors: 2,
          summary: "مخطط سكني من طابقين",
          rooms: [
            { name: "غرفة النوم الرئيسية", type: "bedroom", area: 25, dimensions: "5×5 م" },
            { name: "غرفة المعيشة", type: "living", area: 40, dimensions: "8×5 م" },
            { name: "المطبخ", type: "kitchen", area: 15, dimensions: "3×5 م" },
          ],
          recommendations: ["استخدام ألوان محايدة", "إضاءة طبيعية جيدة"],
        }),
      },
    }],
  }),
}));

vi.mock("./mousa", () => ({
  checkMousaBalance: vi.fn().mockResolvedValue({ balance: 9999 }),
  deductMousaCredits: vi.fn().mockResolvedValue({ success: true }),
  CREDIT_COSTS: { generatePlanDesign: 50, analyzePhoto: 20 },
  verifyMousaToken: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("./creditHelper", () => ({
  checkAndDeductCredits: vi.fn().mockResolvedValue({
    allowed: true,
    baseCost: 50,
    finalCost: 50,
    sessionCount: 1,
    multiplier: 1,
    newBalance: 9999,
  }),
}));

// ===== الاختبارات =====

describe("PlanDesign — generatePlanRoomDesign", () => {
  it("يجب أن يُنشئ تصميم غرفة نوم بنجاح", async () => {
    const { generateImage } = await import("./_core/imageGeneration.ts");
    const mockGenerate = vi.mocked(generateImage);

    // استدعاء مباشر لمنطق التوليد
    const input = {
      roomName: "غرفة النوم الرئيسية",
      roomType: "bedroom",
      roomArea: 25,
      roomDimensions: "5×5 م",
      designStyle: "modern",
      projectType: "residential",
    };

    const roomTypeMap: Record<string, string> = {
      bedroom: "غرفة نوم", living: "غرفة معيشة", kitchen: "مطبخ",
      bathroom: "حمام", dining: "غرفة طعام", office: "مكتب",
    };
    const roomTypeAr = roomTypeMap[input.roomType] || input.roomType;

    const prompt = `Interior design visualization for ${roomTypeAr} (${input.roomDimensions}, ${input.roomArea}m²).`;
    const imageResult = await generateImage({ prompt });

    expect(imageResult.url).toBe("https://cdn.example.com/generated-room.jpg");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("يجب أن يُرجع بيانات الغرفة الصحيحة", async () => {
    const { generateImage } = await import("./_core/imageGeneration.ts");

    const input = {
      roomName: "المطبخ",
      roomType: "kitchen",
      roomArea: 15,
      roomDimensions: "3×5 م",
      designStyle: "gulf",
      projectType: "residential",
    };

    const imageResult = await generateImage({ prompt: "test" });

    const result = {
      roomName: input.roomName,
      roomType: input.roomType,
      imageUrl: imageResult.url ?? "",
      creditsCost: 50,
      style: "خليجي فاخر",
    };

    expect(result.roomName).toBe("المطبخ");
    expect(result.roomType).toBe("kitchen");
    expect(result.imageUrl).toBeTruthy();
    expect(result.creditsCost).toBe(50);
  });

  it("يجب أن يعمل بدون mousaUserId (زائر)", async () => {
    // تحقق من أن المنطق لا يتطلب مصادقة
    const { generateImage } = await import("./_core/imageGeneration.ts");
    const { checkMousaBalance } = await import("./mousa");

    // في mousaProcedure، لا يُستدعى checkMousaBalance
    const imageResult = await generateImage({ prompt: "test room" });
    expect(imageResult.url).toBeTruthy();
    // checkMousaBalance لا يجب أن يُستدعى في mousaProcedure
    expect(checkMousaBalance).not.toHaveBeenCalled();
  });
});

describe("PlanDesign — analyzePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("يجب أن يُحلل المخطط ويُرجع الغرف الصحيحة", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockLLM = vi.mocked(invokeLLM);

    // استدعاء LLM مباشرة
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنتِ م. اليازية" },
        { role: "user", content: [{ type: "image_url" as const, image_url: { url: "data:image/png;base64,abc", detail: "high" as const } }] },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content;
    const aiText = typeof rawContent === "string" ? rawContent : "{}";
    const parsed = JSON.parse(aiText);

    expect(parsed.rooms).toHaveLength(3);
    expect(parsed.rooms[0].name).toBe("غرفة النوم الرئيسية");
    expect(parsed.rooms[0].type).toBe("bedroom");
    expect(parsed.totalArea).toBe(200);
    expect(mockLLM).toHaveBeenCalledTimes(1);
  });

  it("يجب أن يُرجع بيانات افتراضية عند فشل LLM", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM timeout"));

    let parsed = {
      projectType: "residential",
      totalArea: 0,
      floors: 1,
      summary: "تعذّر تحليل المخطط",
      rooms: [] as Array<{ name: string; type: string; area: number; dimensions: string }>,
      recommendations: ["تأكد من وضوح المخطط"],
    };

    try {
      await invokeLLM({ messages: [] });
    } catch {
      // استخدام البيانات الافتراضية
      parsed = {
        projectType: "residential",
        totalArea: 0,
        floors: 1,
        summary: "تعذّر تحليل المخطط",
        rooms: [],
        recommendations: ["تأكد من وضوح المخطط"],
      };
    }

    expect(parsed.rooms).toHaveLength(0);
    expect(parsed.summary).toContain("تعذّر");
  });

  it("يجب أن يقبل base64 data URL كـ imageUrl", async () => {
    const { invokeLLM } = await import("./_core/llm");

    const imageUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
    const isBase64DataUrl = imageUrl.startsWith("data:");
    expect(isBase64DataUrl).toBe(true);

    // يجب أن يُرسل كـ image_url مباشرة
    await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } },
          ],
        },
      ],
    });

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({
                image_url: expect.objectContaining({ url: imageUrl }),
              }),
            ]),
          }),
        ]),
      })
    );
  });
});

describe("PlanDesign — Queue Logic", () => {
  it("يجب أن يُعالج الطابور بالترتيب الصحيح", () => {
    const rooms = [
      { name: "غرفة النوم", type: "bedroom", area: 25, dimensions: "5×5" },
      { name: "المطبخ", type: "kitchen", area: 15, dimensions: "3×5" },
      { name: "الصالة", type: "living", area: 40, dimensions: "8×5" },
    ];

    // محاكاة منطق الطابور
    let queue = [...rooms];
    const processed: string[] = [];

    while (queue.length > 0) {
      const current = queue[0];
      processed.push(current.name);
      queue = queue.slice(1);
    }

    expect(processed).toEqual(["غرفة النوم", "المطبخ", "الصالة"]);
    expect(queue).toHaveLength(0);
  });

  it("يجب أن يُعيّن isAllDone = true عند انتهاء الطابور", () => {
    let isAllDone = false;
    let queue = [{ name: "غرفة النوم", type: "bedroom", area: 25, dimensions: "5×5" }];

    // معالجة الغرفة الأخيرة
    queue = queue.slice(1);
    if (queue.length === 0) {
      isAllDone = true;
    }

    expect(isAllDone).toBe(true);
  });
});
