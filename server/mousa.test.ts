import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyMousaToken,
  checkMousaBalance,
  deductMousaCredits,
  CREDIT_COSTS,
} from "./mousa";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MOUSA_PLATFORM_API_KEY = "USAA";
});

describe("MOUSA.AI Integration Helper", () => {
  describe("CREDIT_COSTS", () => {
    it("should have correct credit costs for all operations", () => {
      expect(CREDIT_COSTS.analyzePhoto).toBe(20);
      expect(CREDIT_COSTS.generateIdeas).toBe(20);
      expect(CREDIT_COSTS.applyStyle).toBe(15);
      expect(CREDIT_COSTS.refineDesign).toBe(15);
      expect(CREDIT_COSTS.generate3D).toBe(25);
      expect(CREDIT_COSTS.generatePlanDesign).toBe(20);
      expect(CREDIT_COSTS.generatePDF).toBe(5);
      expect(CREDIT_COSTS.voiceDesign).toBe(20);
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
    it("should use MOUSA_PLATFORM_API_KEY from env", async () => {
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

    it("should throw if API key is missing", async () => {
      delete process.env.MOUSA_PLATFORM_API_KEY;
      await expect(checkMousaBalance(1)).rejects.toThrow(
        "MOUSA_PLATFORM_API_KEY is not set"
      );
    });
  });
});
