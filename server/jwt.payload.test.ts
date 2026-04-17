/**
 * اختبار JWT payload — التحقق من أن createSessionToken تضمّن mousaUserId وcreditBalance
 */
import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "./_core/localAuth";

describe("JWT Payload with Mousa Data", () => {
  it("should include mousaUserId and creditBalance in JWT payload", async () => {
    const token = await createSessionToken("test_openId_123", "أحمد", {
      mousaUserId: 42,
      creditBalance: 150,
      email: "ahmed@test.com",
    });

    // فك تشفير الـ payload
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    expect(payload.openId).toBe("test_openId_123");
    expect(payload.name).toBe("أحمد");
    expect(payload.mousaUserId).toBe(42);
    expect(payload.creditBalance).toBe(150);
    expect(payload.email).toBe("ahmed@test.com");
    expect(payload.appId).toBe("fada-local");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("should verify JWT and return all fields", async () => {
    const token = await createSessionToken("openId_xyz", "اليازية", {
      mousaUserId: 7,
      creditBalance: 200,
      email: "sarah@design.com",
    });

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified!.openId).toBe("openId_xyz");
    expect(verified!.name).toBe("اليازية");
    expect(verified!.mousaUserId).toBe(7);
    expect(verified!.creditBalance).toBe(200);
    expect(verified!.email).toBe("sarah@design.com");
  });

  it("should work without extra fields (backward compatibility)", async () => {
    const token = await createSessionToken("old_user_openId", "مستخدم قديم");
    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified!.openId).toBe("old_user_openId");
    expect(verified!.mousaUserId).toBeUndefined();
    expect(verified!.creditBalance).toBeUndefined();
  });

  it("frontend parseJWTCookie should extract fields correctly", () => {
    // محاكاة دالة parseJWTCookie من useMousaAuth.ts
    function parseJWTCookie(cookieValue: string) {
      try {
        const parts = cookieValue.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
        const decoded = atob(padded);
        const payload = JSON.parse(decoded);
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return {
          openId: typeof payload.openId === "string" ? payload.openId : undefined,
          name: typeof payload.name === "string" ? payload.name : undefined,
          mousaUserId: typeof payload.mousaUserId === "number" ? payload.mousaUserId : undefined,
          creditBalance: typeof payload.creditBalance === "number" ? payload.creditBalance : undefined,
          email: typeof payload.email === "string" ? payload.email : undefined,
        };
      } catch {
        return null;
      }
    }

    // إنشاء JWT payload يدوياً
    const payload = {
      openId: "ZiSTZeFw48Gx7FpBCmCndh",
      name: "م. اليازية",
      mousaUserId: 2,
      creditBalance: 10,
      email: "mousa@almaskanengineering.com",
      appId: "fada-local",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const fakeJWT = `eyJhbGciOiJIUzI1NiJ9.${payloadB64}.fake_signature`;

    const result = parseJWTCookie(fakeJWT);
    expect(result).not.toBeNull();
    expect(result!.openId).toBe("ZiSTZeFw48Gx7FpBCmCndh");
    expect(result!.mousaUserId).toBe(2);
    expect(result!.creditBalance).toBe(10);
    expect(result!.email).toBe("mousa@almaskanengineering.com");
  });
});
