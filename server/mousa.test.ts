import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  verifyMousaToken,
  checkMousaBalance,
  deductMousaCredits,
  CREDIT_COSTS,
} from "./mousa";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// حفظ القيم الأصلية لاستعادتها بعد كل اختبار
const originalPlatformApiKey = process.env.PLATFORM_API_KEY;
const originalMousaPlatformApiKey = process.env.MOUSA_PLATFORM_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  // حذف PLATFORM_API_KEY الحقيقي لضمان استخدام MOUSA_PLATFORM_API_KEY في الاختبارات
  delete process.env.PLATFORM_API_KEY;
  process.env.MOUSA_PLATFORM_API_KEY = "USAA";
});

afterEach(() => {
  // استعادة القيم الأصلية بعد كل اختبار
  if (originalPlatformApiKey) {
    process.env.PLATFORM_API_KEY = originalPlatformApiKey;
  }
  if (originalMousaPlatformApiKey) {
    process.env.MOUSA_PLATFORM_API_KEY = originalMousaPlatformApiKey;
  }
});

describe("MOUSA.AI Integration Helper", () => {
  describe("CREDIT_COSTS", () => {
    it("should have correct credit costs for all operations (v49.0 doubled pricing)", () => {
      // مضاعفة جميع الأسعار ×2
      expect(CREDIT_COSTS.analyzePhoto).toBe(40);
      expect(CREDIT_COSTS.generateIdeas).toBe(40);
      expect(CREDIT_COSTS.generate3D).toBe(60);
      expect(CREDIT_COSTS.generatePDF).toBe(10);
      expect(CREDIT_COSTS.analyzeAndGenerate).toBe(70);
      expect(CREDIT_COSTS.generateVisualization).toBe(50);
      expect(CREDIT_COSTS.applyStyle).toBe(40);
      expect(CREDIT_COSTS.refineDesign).toBe(40);
      expect(CREDIT_COSTS.generateFloorPlan3D).toBe(50);
      expect(CREDIT_COSTS.generatePlanDesign).toBe(50);
      expect(CREDIT_COSTS.reAnalyze).toBe(30);
      expect(CREDIT_COSTS.voiceDesign).toBe(30);
    });
  });

  describe("verifyMousaToken", () => {
    it("should call correct endpoint with token", async () => {
      const mockResponse = {
        valid: true,
        userId: 42,
        userName: "محمد أحمد",
        balance: 350,
        platformCost: 20,
        sufficient: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyMousaToken("test-token-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.mousa.ai/api/platform/verify-token",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer USAA",
            "X-Platform-ID": "fada",
          }),
          body: JSON.stringify({ token: "test-token-123" }),
        })
      );
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(42);
      expect(result.balance).toBe(350);
    });

    it("should throw error on invalid token (401)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      await expect(verifyMousaToken("bad-token")).rejects.toThrow(
        "MOUSA verify-token failed (401)"
      );
    });
  });

  describe("checkMousaBalance", () => {
    it("should call correct endpoint with userId", async () => {
      const mockResponse = {
        balance: 350,
        sufficient: true,
        platformCost: 20,
        upgradeUrl: "https://www.mousa.ai/pricing?ref=fada",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkMousaBalance(42);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.mousa.ai/api/platform/check-balance?userId=42",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer USAA",
            "X-Platform-ID": "fada",
          }),
        })
      );
      expect(result.sufficient).toBe(true);
      expect(result.balance).toBe(350);
    });

    it("should return insufficient when balance is low", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          balance: 5,
          sufficient: false,
          platformCost: 20,
          upgradeUrl: "https://www.mousa.ai/pricing?ref=fada",
        }),
      });

      const result = await checkMousaBalance(42);
      expect(result.sufficient).toBe(false);
      expect(result.upgradeUrl).toContain("mousa.ai/pricing");
    });
  });

  describe("deductMousaCredits", () => {
    it("should deduct credits successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          newBalance: 330,
          deducted: 20,
          platform: "fada",
        }),
      });

      const result = await deductMousaCredits(
        42,
        20,
        "تحليل مساحة داخلية — غرفة المعيشة"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.mousa.ai/api/platform/deduct-credits",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            userId: 42,
            amount: 20,
            description: "تحليل مساحة داخلية — غرفة المعيشة",
          }),
        })
      );
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { newBalance: number }).newBalance).toBe(330);
    });

    it("should return insufficient error on 402", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({
          error: "رصيد الكريدت غير كافٍ",
          currentBalance: 5,
          required: 20,
          upgradeUrl: "https://www.mousa.ai/pricing?ref=fada",
        }),
      });

      const result = await deductMousaCredits(42, 20, "test");
      expect((result as { error: string }).error).toContain("رصيد");
      expect((result as { currentBalance: number }).currentBalance).toBe(5);
    });
  });

  describe("API Key validation", () => {
    it("should use PLATFORM_API_KEY when both are set (PLATFORM_API_KEY takes precedence)", async () => {
      // PLATFORM_API_KEY له الأولوية على MOUSA_PLATFORM_API_KEY
      process.env.PLATFORM_API_KEY = "real-key-123";
      process.env.MOUSA_PLATFORM_API_KEY = "USAA";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balance: 100, sufficient: true, platformCost: 20, upgradeUrl: "" }),
      });

      await checkMousaBalance(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer real-key-123",
          }),
        })
      );
      delete process.env.PLATFORM_API_KEY;
    });

    it("should use MOUSA_PLATFORM_API_KEY as fallback when PLATFORM_API_KEY is not set", async () => {
      delete process.env.PLATFORM_API_KEY;
      process.env.MOUSA_PLATFORM_API_KEY = "USAA";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balance: 100, sufficient: true, platformCost: 20, upgradeUrl: "" }),
      });

      await checkMousaBalance(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer USAA",
          }),
        })
      );
    });

    it("should throw if both API keys are missing", async () => {
      delete process.env.PLATFORM_API_KEY;
      delete process.env.MOUSA_PLATFORM_API_KEY;
      await expect(checkMousaBalance(1)).rejects.toThrow(
        "PLATFORM_API_KEY is not set"
      );
    });
  });
});

// ─── Pricing Webhook Tests ────────────────────────────────────────────────────
import { notifyMousaPricing } from "./mousa";

describe("notifyMousaPricing (Pricing Webhook)", () => {
  it("should POST to correct endpoint with all services and correct headers", async () => {
    delete process.env.PLATFORM_API_KEY;
    process.env.MOUSA_PLATFORM_API_KEY = "USAA";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        platform: "fada",
        updated: { minCost: 10, maxCost: 70 },
        updatedAt: "2026-03-23T12:00:00.000Z",
      }),
    });

    const result = await notifyMousaPricing();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.mousa.ai/api/platform/pricing-webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer USAA",
          "X-Platform-ID": "fada",
          "Content-Type": "application/json",
        }),
      })
    );

    // التحقق من محتوى الـ body
    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.services).toBeInstanceOf(Array);
    expect(body.services.length).toBe(12); // 12 خدمة في CREDIT_COSTS
    expect(body.minCost).toBe(10);          // generatePDF = 10
    expect(body.maxCost).toBe(70);          // analyzeAndGenerate = 70
    expect(body.baseCost).toBe(40);         // analyzePhoto = 40
    expect(body.description).toContain("fada");
  });

  it("should return false when API key is missing", async () => {
    delete process.env.PLATFORM_API_KEY;
    delete process.env.MOUSA_PLATFORM_API_KEY;
    const result = await notifyMousaPricing();
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return false on non-ok response", async () => {
    delete process.env.PLATFORM_API_KEY;
    process.env.MOUSA_PLATFORM_API_KEY = "USAA";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "invalid payload" }),
    });

    const result = await notifyMousaPricing();
    expect(result).toBe(false);
  });

  it("should return false on network error", async () => {
    delete process.env.PLATFORM_API_KEY;
    process.env.MOUSA_PLATFORM_API_KEY = "USAA";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await notifyMousaPricing();
    expect(result).toBe(false);
  });
});
