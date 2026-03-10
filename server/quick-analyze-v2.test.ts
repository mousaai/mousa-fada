import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          overview: "الفضاء يحتاج إلى تحديث شامل بأسلوب عصري",
          palette: [
            { name: "بيج رملي", hex: "#F5F0E8" },
            { name: "ذهبي", hex: "#C9A84C" },
            { name: "رمادي فاتح", hex: "#E0E0E0" },
          ],
          topSuggestions: [
            "استبدال الأثاث القديم بقطع عصرية",
            "إضافة إضاءة مخفية في السقف",
            "استخدام أرضية خشبية فاتحة",
          ],
          estimatedCost: "25,000 - 60,000 ر.س",
          costBreakdown: {
            furniture: "15,000 ر.س",
            flooring: "8,000 ر.س",
            walls: "5,000 ر.س",
            lighting: "4,000 ر.س",
            accessories: "3,000 ر.س",
          },
          materials: ["خشب بلوط", "رخام بيج", "زجاج مطفي"],
        })
      }
    }]
  })
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/visualization.jpg" })
}));

// Mock DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createProject: vi.fn().mockResolvedValue({ id: 1 }),
  getUserProjects: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue(null),
  getProjectElements: vi.fn().mockResolvedValue([]),
  getProjectPerspectives: vi.fn().mockResolvedValue([]),
  saveAnalysis: vi.fn().mockResolvedValue({ id: 1 }),
  getUserAnalyses: vi.fn().mockResolvedValue([]),
  createArScan: vi.fn().mockResolvedValue({ id: 1, scanId: "test-scan-001" }),
  updateArScan: vi.fn().mockResolvedValue({}),
  getUserArScans: vi.fn().mockResolvedValue([]),
  createMoodBoard: vi.fn().mockResolvedValue({ id: 1 }),
  getProjectMoodBoards: vi.fn().mockResolvedValue([]),
  getMarketPrices: vi.fn().mockResolvedValue([]),
  updateMarketPrice: vi.fn().mockResolvedValue({}),
  createReport: vi.fn().mockResolvedValue({ id: 1 }),
  getProjectReports: vi.fn().mockResolvedValue([]),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("QuickAnalyze v2 — التحليل السريع المحسّن", () => {
  it("يحلل الصورة ويعيد لوحة ألوان وتوصيات وتكاليف", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quickAnalyze({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "modern",
    });
    expect(result).toBeDefined();
    expect(result.overview).toBeTruthy();
    expect(Array.isArray(result.palette)).toBe(true);
    expect(Array.isArray(result.topSuggestions)).toBe(true);
  });

  it("يقبل نمط التصميم الخليجي", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quickAnalyze({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "gulf",
    });
    expect(result).toBeDefined();
  });
});

describe("generateVisualization — توليد الصورة التصورية", () => {
  it("يولّد صورة تصورية بنجاح", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generateVisualization({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "modern",
      palette: [
        { name: "بيج رملي", hex: "#F5F0E8" },
        { name: "ذهبي", hex: "#C9A84C" },
      ],
      materials: "خشب بلوط، رخام بيج",
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeTruthy();
  });

  it("يعمل بدون ألوان مخصصة", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generateVisualization({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "gulf",
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("يدعم جميع أنماط التصميم", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const styles = ["modern", "gulf", "classic", "minimal", "japanese", "moroccan", "luxury"];
    for (const style of styles) {
      const result = await caller.generateVisualization({
        imageUrl: "https://example.com/room.jpg",
        designStyle: style,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("reAnalyzeWithChanges — إعادة التحليل مع التعديلات", () => {
  it("يعيد التحليل مع ألوان مخصصة", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reAnalyzeWithChanges({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "modern",
      customPalette: [
        { name: "أزرق سماوي", hex: "#87CEEB" },
        { name: "أبيض ناصع", hex: "#FFFFFF" },
      ],
    });
    expect(result).toBeDefined();
    expect(result.overview).toBeTruthy();
  });

  it("يعيد التحليل مع ميزانية محددة", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reAnalyzeWithChanges({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "gulf",
      budgetRange: { min: 20000, max: 60000 },
    });
    expect(result).toBeDefined();
    expect(result.estimatedCost).toBeTruthy();
  });

  it("يعيد التحليل مع متطلبات مخصصة", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reAnalyzeWithChanges({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "minimal",
      customRequirements: "أريد أرضية خشبية وإضاءة دافئة",
    });
    expect(result).toBeDefined();
  });

  it("يعيد التحليل مع جميع الخيارات معاً", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reAnalyzeWithChanges({
      imageUrl: "https://example.com/room.jpg",
      designStyle: "luxury",
      customPalette: [{ name: "ذهبي", hex: "#C9A84C" }],
      budgetRange: { min: 100000, max: 300000 },
      customRequirements: "تصميم فاخر بمواد ممتازة",
    });
    expect(result).toBeDefined();
    expect(result.overview).toBeTruthy();
  });
});

describe("generateDesignIdeas — توليد أفكار تصميمية متعددة", () => {
  it("يولّد 3 أفكار تصميمية بنجاح", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generateDesignIdeas({
      styles: ["modern", "gulf", "minimal"],
      budgetMin: 20000,
      budgetMax: 60000,
      count: 3,
    });
    expect(result).toBeDefined();
    expect(result.ideas).toBeDefined();
    expect(Array.isArray(result.ideas)).toBe(true);
  });

  it("يقبل ثيم ألوان مخصص", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generateDesignIdeas({
      styles: ["luxury"],
      budgetMin: 100000,
      budgetMax: 300000,
      colorTheme: "دافئ ذهبي",
      count: 2,
    });
    expect(result).toBeDefined();
    expect(result.ideas).toBeDefined();
  });

  it("يقبل صورة مرجعية", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generateDesignIdeas({
      styles: ["modern", "scandinavian"],
      budgetMin: 15000,
      budgetMax: 50000,
      count: 3,
      referenceImageUrl: "https://example.com/room.jpg",
    });
    expect(result).toBeDefined();
    expect(result.ideas).toBeDefined();
  });

  it("يقبل جميع أنماط التصميم", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const allStyles = ["modern", "gulf", "classic", "minimal", "japanese", "scandinavian", "moroccan", "luxury", "mediterranean", "industrial"];
    const result = await caller.generateDesignIdeas({
      styles: allStyles,
      budgetMin: 30000,
      budgetMax: 100000,
      count: 4,
    });
    expect(result).toBeDefined();
    expect(result.ideas).toBeDefined();
  });
});
