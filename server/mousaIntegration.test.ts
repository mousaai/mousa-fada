/**
 * mousaIntegration.test.ts
 * اختبارات تكامل منصة فضاء مع mousa.ai
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyMousaSession, getMousaLoginRedirectUrl } from "./_core/mousaAuth";

// ===== اختبارات verifyMousaSession =====
describe("verifyMousaSession", () => {
  it("يُرجع null إذا لم يكن هناك cookie header", async () => {
    const result = await verifyMousaSession(undefined);
    expect(result).toBeNull();
  });

  it("يُرجع null إذا لم يكن هناك app_session_id في الـ cookie", async () => {
    const result = await verifyMousaSession("other_cookie=value");
    expect(result).toBeNull();
  });

  it("يُرجع null إذا كان الـ token غير صالح", async () => {
    const result = await verifyMousaSession("app_session_id=invalid_token");
    expect(result).toBeNull();
  });

  it("يُرجع null إذا كان الـ token منتهي الصلاحية أو مزيّف", async () => {
    // JWT مزيّف لا يتطابق مع MOUSA_JWT_SECRET
    const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJvcGVuSWQiOiJ0ZXN0In0.wrongsignature";
    const result = await verifyMousaSession(`app_session_id=${fakeToken}`);
    expect(result).toBeNull();
  });
});

// ===== اختبارات getMousaLoginRedirectUrl =====
describe("getMousaLoginRedirectUrl", () => {
  it("يُنشئ رابط إعادة توجيه صحيح", () => {
    const url = getMousaLoginRedirectUrl("https://fada.mousa.ai/dashboard");
    expect(url).toContain("mousa.ai");
    expect(url).toContain("platform=fada");
    expect(url).toContain("return_url=");
    expect(url).toContain(encodeURIComponent("https://fada.mousa.ai/dashboard"));
  });

  it("يحتوي على platform=fada", () => {
    const url = getMousaLoginRedirectUrl("https://fada.mousa.ai/");
    expect(url).toContain("platform=fada");
  });
});

// ===== اختبارات creditHelper =====
describe("checkAndDeductCredits — وضع التطوير (بدون mousaUserId)", () => {
  it("يسمح بالعملية إذا لم يكن هناك mousaUserId", async () => {
    const { checkAndDeductCredits } = await import("./creditHelper");
    const result = await checkAndDeductCredits(1, null, "generateVisualization");
    expect(result.allowed).toBe(true);
    expect(result.baseCost).toBeGreaterThan(0);
  });

  it("يُرجع newBalance=9999 في وضع التطوير", async () => {
    const { checkAndDeductCredits } = await import("./creditHelper");
    const result = await checkAndDeductCredits(1, undefined, "analyzeRoom");
    expect(result.allowed).toBe(true);
    expect(result.newBalance).toBe(9999);
  });
});

// ===== اختبارات ENV =====
describe("ENV — متغيرات mousa.ai", () => {
  it("يحتوي على mousaJwtSecret", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.mousaJwtSecret).toBeTruthy();
    expect(typeof ENV.mousaJwtSecret).toBe("string");
  });

  it("يحتوي على mousaPlatformApiKey", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.mousaPlatformApiKey).toBeTruthy();
  });
});
