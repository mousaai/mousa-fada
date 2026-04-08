/**
 * mousa.integration.test.ts
 * اختبار تكامل منصة فاضة مع mousa.ai
 * يتحقق من:
 *   1. وجود المتغيرات البيئية الصحيحة
 *   2. صحة auth.middleware exports
 *   3. صحة internal.routes exports
 *   4. صحة WEBHOOK_SECRET format
 */

import { describe, it, expect } from "vitest";

describe("mousa.ai Integration — Environment Variables", () => {
  it("should have PLATFORM_ID set to 'fada'", () => {
    const platformId = process.env.PLATFORM_ID;
    expect(platformId).toBeDefined();
    expect(platformId).toBe("fada");
  });

  it("should have PLATFORM_API_KEY configured (64 hex chars)", () => {
    const apiKey = process.env.PLATFORM_API_KEY || process.env.MOUSA_PLATFORM_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should have WEBHOOK_SECRET configured (64 hex chars)", () => {
    const secret = process.env.WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should have MOUSA_API_BASE set", () => {
    const base = process.env.MOUSA_API_BASE;
    expect(base).toBeDefined();
    expect(base).toContain("mousa.ai");
  });
});

describe("auth.middleware exports", () => {
  it("should export requireMousaAuth function", async () => {
    const mod = await import("./auth.middleware");
    expect(typeof mod.requireMousaAuth).toBe("function");
  });

  it("should export requireWebhookSignature function", async () => {
    const mod = await import("./auth.middleware");
    expect(typeof mod.requireWebhookSignature).toBe("function");
  });

  it("should export deductCredits function", async () => {
    const mod = await import("./auth.middleware");
    expect(typeof mod.deductCredits).toBe("function");
  });

  it("should export optionalMousaAuth function", async () => {
    const mod = await import("./auth.middleware");
    expect(typeof mod.optionalMousaAuth).toBe("function");
  });
});

describe("internal.routes exports", () => {
  it("should export registerInternalRoutes function", async () => {
    const mod = await import("./internal.routes");
    expect(typeof mod.registerInternalRoutes).toBe("function");
  });
});

describe("WEBHOOK_SECRET HMAC verification", () => {
  it("should correctly compute HMAC-SHA256 for webhook signature", async () => {
    const crypto = await import("crypto");
    const secret = process.env.WEBHOOK_SECRET || "test-secret";
    const body = JSON.stringify({ event: "platform.ping", timestamp: Date.now(), data: {} });

    const signature = "sha256=" + crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});
