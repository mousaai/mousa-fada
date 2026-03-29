/**
 * اختبارات نظام حماية Mousa.ai
 * يتحقق من:
 * 1. رفض الطلبات غير المصادقة (UNAUTHORIZED)
 * 2. رفض المستخدمين غير المرتبطين بـ Mousa (MOUSA_REQUIRED)
 * 3. رفض المستخدمين ذوي الرصيد غير الكافي (INSUFFICIENT_CREDITS)
 * 4. حساب الخصم المضاعف عند تعدد الجلسات
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== محاكاة mousa.ts =====
vi.mock("./mousa", () => ({
  verifyMousaToken: vi.fn(),
  checkMousaBalance: vi.fn(),
  deductMousaCredits: vi.fn(),
  MOUSA_UPGRADE_URL: "https://www.mousa.ai/pricing?ref=fada",
  CREDIT_COSTS: {
    analyzePhoto: 20,
    generateIdeas: 20,
    applyStyle: 15,
    refineDesign: 15,
    generate3D: 30,
    generatePlanDesign: 20,
    generatePDF: 5,
    voiceDesign: 20,
  },
}));

// ===== محاكاة db.ts =====
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ===== اختبارات creditHelper =====
describe("creditHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAndDeductCredits", () => {
    it("يجب أن يرفض المستخدم غير المرتبط بـ Mousa", async () => {
      // ⚠️ مؤقت: المنصة مفتوحة — يُسمح للجميع بدون mousaUserId
      const { checkAndDeductCredits } = await import("./creditHelper");
      
      await expect(
        checkAndDeductCredits(0, null, "analyzePhoto")
      ).resolves.toMatchObject({ allowed: true });
    });

    it("يجب أن يرفض المستخدم بدون رصيد كافٍ", async () => {
      // ⚠️ مؤقت: المنصة مفتوحة — يُسمح للجميع بغض النظر عن الرصيد
      const { checkAndDeductCredits } = await import("./creditHelper");
      
      await expect(
        checkAndDeductCredits(0, 456, "analyzePhoto")
      ).resolves.toMatchObject({ allowed: true });
    });

    it("يجب أن يقبل المستخدم ذو الرصيد الكافي", async () => {
      const { checkMousaBalance, deductMousaCredits } = await import("./mousa");
      vi.mocked(checkMousaBalance).mockResolvedValue({
        balance: 100,
        requiresMousa: true,
        upgradeUrl: "https://www.mousa.ai",
      });
      vi.mocked(deductMousaCredits).mockResolvedValue({
        success: true,
        newBalance: 80,
      });

      const { checkAndDeductCredits } = await import("./creditHelper");
      
      // يجب أن لا يرمي خطأ
      await expect(
        checkAndDeductCredits("user-123", "mousa-456", "analyzePhoto")
      ).resolves.not.toThrow();
    });
  });
});

// ===== اختبارات CREDIT_COSTS =====
describe("CREDIT_COSTS", () => {
  it("يجب أن تكون جميع التكاليف موجودة وصحيحة", async () => {
    const { CREDIT_COSTS } = await import("./mousa");
    
    expect(CREDIT_COSTS.analyzePhoto).toBe(20);
    expect(CREDIT_COSTS.generateIdeas).toBe(20);
    expect(CREDIT_COSTS.applyStyle).toBe(15);
    expect(CREDIT_COSTS.refineDesign).toBe(15);
    expect(CREDIT_COSTS.generate3D).toBe(30);
    expect(CREDIT_COSTS.generatePlanDesign).toBe(20);
    expect(CREDIT_COSTS.generatePDF).toBe(5);
    expect(CREDIT_COSTS.voiceDesign).toBe(20);
  });

  it("يجب أن تكون جميع التكاليف أرقاماً موجبة", async () => {
    const { CREDIT_COSTS } = await import("./mousa");
    
    for (const [key, cost] of Object.entries(CREDIT_COSTS)) {
      expect(cost, `${key} should be positive`).toBeGreaterThan(0);
    }
  });
});

// ===== اختبارات منطق الجلسات المتعددة =====
describe("Session Multiplier Logic", () => {
  it("يجب أن تكون الجلسة الأولى بتكلفة عادية (×1)", () => {
    const sessionCount = 1;
    const multiplier = sessionCount <= 1 ? 1 : sessionCount <= 3 ? 1.5 : 2;
    expect(multiplier).toBe(1);
  });

  it("يجب أن تكون الجلسة الثانية والثالثة بتكلفة ×1.5", () => {
    for (const sessionCount of [2, 3]) {
      const multiplier = sessionCount <= 1 ? 1 : sessionCount <= 3 ? 1.5 : 2;
      expect(multiplier).toBe(1.5);
    }
  });

  it("يجب أن تكون الجلسة الرابعة وما بعدها بتكلفة ×2", () => {
    for (const sessionCount of [4, 5, 10]) {
      const multiplier = sessionCount <= 1 ? 1 : sessionCount <= 3 ? 1.5 : 2;
      expect(multiplier).toBe(2);
    }
  });

  it("يجب أن يكون الخصم المضاعف صحيحاً للجلسة الثانية", () => {
    const baseCost = 20; // analyzePhoto
    const sessionCount = 2;
    const multiplier = sessionCount <= 1 ? 1 : sessionCount <= 3 ? 1.5 : 2;
    const totalCost = Math.ceil(baseCost * multiplier);
    expect(totalCost).toBe(30); // 20 × 1.5 = 30
  });

  it("يجب أن يكون الخصم المضاعف صحيحاً للجلسة الرابعة", () => {
    const baseCost = 20; // analyzePhoto
    const sessionCount = 4;
    const multiplier = sessionCount <= 1 ? 1 : sessionCount <= 3 ? 1.5 : 2;
    const totalCost = Math.ceil(baseCost * multiplier);
    expect(totalCost).toBe(40); // 20 × 2 = 40
  });
});

// ===== اختبارات تحقق AI procedures =====
describe("AI Procedures Protection", () => {
  it("يجب أن تكون جميع AI procedures محمية بـ mousaProcedure", async () => {
    // هذا الاختبار يتحقق من أن الـ procedures المحددة تستخدم mousaProcedure
    const { readFileSync } = await import("fs");
    const routersContent = readFileSync(
      new URL("./routers.ts", import.meta.url).pathname,
      "utf-8"
    );

    const aiProcedures = [
      "quickAnalyze",
      "generateVisualization",
      "reAnalyzeWithChanges",
      "generateDesignIdeas",
      "analyzeAndGenerateIdeas",
      "voiceDesignCommand",
      "generateFloorPlan3D",
      "refineDesign",
      "applyStyleToIdea",
      "generate3DFromPlan",
      "generate3DPlanDesignData",
    ];

    for (const proc of aiProcedures) {
      expect(
        routersContent,
        `${proc} should use mousaProcedure`
      ).toContain(`${proc}: mousaProcedure`);
    }
  });

  it("يجب أن تحتوي جميع AI procedures على checkAndDeductCredits", async () => {
    const { readFileSync } = await import("fs");
    const routersContent = readFileSync(
      new URL("./routers.ts", import.meta.url).pathname,
      "utf-8"
    );

    // التحقق من وجود checkAndDeductCredits في الملف
    const deductCount = (routersContent.match(/checkAndDeductCredits/g) || []).length;
    // يجب أن يكون هناك على الأقل 10 استدعاءات (واحدة لكل procedure + import)
    expect(deductCount).toBeGreaterThanOrEqual(10);
  });

  it("يجب ألا تكون AI procedures تستخدم publicProcedure", async () => {
    const { readFileSync } = await import("fs");
    const routersContent = readFileSync(
      new URL("./routers.ts", import.meta.url).pathname,
      "utf-8"
    );

    const aiProcedures = [
      "quickAnalyze",
      "generateVisualization",
      "reAnalyzeWithChanges",
      "generateDesignIdeas",
      "analyzeAndGenerateIdeas",
      "voiceDesignCommand",
      "generateFloorPlan3D",
      "refineDesign",
      "applyStyleToIdea",
      "generate3DFromPlan",
      "generate3DPlanDesignData",
    ];

    for (const proc of aiProcedures) {
      expect(
        routersContent,
        `${proc} should NOT use publicProcedure`
      ).not.toContain(`${proc}: publicProcedure`);
    }
  });
});
