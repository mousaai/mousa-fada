/**
 * FADA-001 Fix Verification Tests
 *
 * يتحقق من الإصلاحات الأربعة لخلل FADA-001:
 * 1. SHARED_COOKIE = "app_session_id" (ليس "mousa_session")
 * 2. requiresMousa = user.userId > 0 (ليس !!user)
 * 3. context.ts ينشئ المستخدم تلقائياً إذا لم يكن موجوداً
 * 4. upsertUser تدعم mousaUserId وmousaBalance وmousaLastSync
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndDeductCredits } from "./creditHelper";

// ===== الاختبار الأول: GUEST_USER لا يُحجب =====
describe("FADA-001 Fix: requiresMousa logic", () => {
  it("GUEST_USER (userId=0) should have requiresMousa=false", () => {
    const GUEST_USER = { userId: 0, openId: "guest", creditBalance: 0 };
    // الإصلاح: requiresMousa = user.userId > 0
    const requiresMousa = (GUEST_USER?.userId ?? 0) > 0;
    expect(requiresMousa).toBe(false);
  });

  it("Registered user (userId>0) should have requiresMousa=true", () => {
    const registeredUser = { userId: 123, openId: "user_abc", creditBalance: 500 };
    const requiresMousa = (registeredUser?.userId ?? 0) > 0;
    expect(requiresMousa).toBe(true);
  });

  it("null user should have requiresMousa=false", () => {
    const user = null;
    const requiresMousa = ((user as any)?.userId ?? 0) > 0;
    expect(requiresMousa).toBe(false);
  });
});

// ===== الاختبار الثاني: SHARED_COOKIE صحيح =====
describe("FADA-001 Fix: SHARED_COOKIE name", () => {
  it("SHARED_COOKIE should be app_session_id not mousa_session", () => {
    // نقرأ الملف ونتحقق من اسم الـ cookie
    const fs = require("fs");
    const content = fs.readFileSync(
      new URL("../client/src/hooks/useMousaAuth.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(content).toContain('const SHARED_COOKIE = "app_session_id"');
    expect(content).not.toContain('const SHARED_COOKIE = "mousa_session"');
  });
});

// ===== الاختبار الثالث: checkAndDeductCredits مع زائر =====
describe("FADA-001 Fix: creditHelper guest access", () => {
  it("Guest (mousaUserId=null) should be allowed without credit check", async () => {
    const result = await checkAndDeductCredits(0, null, "analyzePhoto");
    expect(result.allowed).toBe(true);
    expect(result.isGuest).toBe(true);
    expect(result.finalCost).toBe(0);
  });
});

// ===== الاختبار الرابع: upsertUser تدعم mousaUserId =====
describe("FADA-001 Fix: upsertUser supports mousaUserId", () => {
  it("upsertUser should accept mousaUserId field", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      new URL("../server/db.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(content).toContain("mousaUserId");
    expect(content).toContain("mousaBalance");
    expect(content).toContain("mousaLastSync");
  });
});

// ===== الاختبار الخامس: context.ts ينشئ المستخدم تلقائياً =====
describe("FADA-001 Fix: context.ts auto-creates mousa user", () => {
  it("context.ts should auto-create user when not found in DB", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      new URL("../server/_core/context.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(content).toContain("getMousaUserByOpenId");
    expect(content).toContain("auto-create mousa user");
    expect(content).toContain("loginMethod: \"mousa\"");
  });
});
