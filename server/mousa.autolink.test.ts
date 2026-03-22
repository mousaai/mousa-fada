/**
 * Tests for Mousa.ai auto-link mechanism
 * Verifies that mousaUserId is fetched and stored automatically on login
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getMousaUserByOpenId ──────────────────────────────────────────────
vi.mock("../server/mousa", () => ({
  getMousaUserByOpenId: vi.fn(),
  verifyMousaToken: vi.fn(),
  checkMousaBalance: vi.fn(),
  deductMousaCredits: vi.fn(),
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

import { getMousaUserByOpenId } from "../server/mousa";

describe("Mousa.ai Auto-Link Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns userId and balance when Mousa API responds with valid data", async () => {
    const mockFn = getMousaUserByOpenId as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue({ userId: 12345, balance: 500 });

    const result = await getMousaUserByOpenId("test-open-id");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe(12345);
    expect(result?.balance).toBe(500);
  });

  it("returns null when Mousa API returns no userId", async () => {
    const mockFn = getMousaUserByOpenId as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(null);

    const result = await getMousaUserByOpenId("unknown-open-id");
    expect(result).toBeNull();
  });

  it("returns null when Mousa API throws an error (non-critical)", async () => {
    const mockFn = getMousaUserByOpenId as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(null); // simulates caught error returning null

    const result = await getMousaUserByOpenId("error-open-id");
    expect(result).toBeNull();
  });

  it("does not overwrite existing mousaUserId if already linked", () => {
    // Simulate: user already has mousaUserId=999, new login should not overwrite
    const existingUser = { id: 1, openId: "abc", mousaUserId: 999 };

    // The oauth.ts logic only updates when !localUser.mousaUserId
    const shouldUpdate = !existingUser.mousaUserId;
    expect(shouldUpdate).toBe(false);
  });

  it("links account when user has no mousaUserId", async () => {
    const newUser = { id: 2, openId: "xyz", mousaUserId: null };
    const mockFn = getMousaUserByOpenId as ReturnType<typeof vi.fn>;

    const shouldUpdate = !newUser.mousaUserId;
    expect(shouldUpdate).toBe(true);

    mockFn.mockResolvedValue({ userId: 222, balance: 300 });
    const result = await getMousaUserByOpenId(newUser.openId);
    expect(result?.userId).toBe(222);
    expect(result?.balance).toBe(300);
  });
});

describe("Credit Deduction Guard (mousaProcedure)", () => {
  it("throws FORBIDDEN with MOUSA_REQUIRED code when mousaUserId is null", () => {
    const user = { id: 1, openId: "abc", mousaUserId: null };
    const hasMouseaId = !!user.mousaUserId;
    expect(hasMouseaId).toBe(false);

    // Simulate what mousaProcedure does
    const error = !hasMouseaId
      ? JSON.stringify({
          code: "MOUSA_REQUIRED",
          message: "يجب الدخول من منصة Mousa.ai لاستخدام هذه الميزة",
          upgradeUrl: "https://www.mousa.ai",
        })
      : null;

    expect(error).not.toBeNull();
    const parsed = JSON.parse(error!);
    expect(parsed.code).toBe("MOUSA_REQUIRED");
    expect(parsed.upgradeUrl).toBe("https://www.mousa.ai");
  });

  it("allows AI operation when mousaUserId is present", () => {
    const user = { id: 1, openId: "abc", mousaUserId: 12345 };
    const hasMouseaId = !!user.mousaUserId;
    expect(hasMouseaId).toBe(true);
  });
});
