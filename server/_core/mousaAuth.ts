/**
 * mousaAuth.ts — تكامل منصة فضاء مع mousa.ai
 * حسب الدليل التقني الرسمي (أبريل 2026)
 *
 * المبدأ:
 * - فضاء تعمل على نفس سيرفر mousa.ai
 * - cookie باسم app_session_id يُرسَل تلقائياً من المتصفح
 * - نفك JWT بـ MOUSA_JWT_SECRET ونجلب بيانات المستخدم من DB mousa.ai
 * - نخصم الكريدت عبر mousa.ai API بعد كل عملية AI
 */

import { jwtVerify } from "jose";
import { ENV } from "./env";

const MOUSA_API_BASE = "https://www.mousa.ai";
const COOKIE_NAME = "app_session_id";

// ===== أنواع البيانات =====
export type MousaUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  balance: number;
};

export type DeductResult = {
  success: boolean;
  newBalance?: number;
  deducted?: number;
  error?: string;
  currentBalance?: number;
  required?: number;
  upgradeUrl?: string;
};

export type CheckBalanceResult = {
  balance: number;
  upgradeUrl: string;
};

// ===== فك تشفير الجلسة من cookie =====
export async function verifyMousaSession(cookieHeader: string | undefined): Promise<{ openId: string } | null> {
  if (!cookieHeader) return null;

  // استخراج app_session_id من الـ cookie header
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(ENV.mousaJwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const openId = payload.openId as string;
    if (!openId) return null;
    return { openId };
  } catch {
    return null;
  }
}

// ===== جلب بيانات المستخدم من قاعدة بيانات mousa.ai =====
export async function getMousaUserFromDb(openId: string): Promise<MousaUser | null> {
  // إذا لم تكن قاعدة بيانات mousa.ai متاحة، نعود لقاعدة بيانات فضاء المحلية
  if (!ENV.mousaDbUrl) return null;

  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(ENV.mousaDbUrl);
    const [rows] = await conn.execute(
      `SELECT u.id, u.openId, u.name, u.email, COALESCE(w.balance, 0) as balance
       FROM users u
       LEFT JOIN credit_wallets w ON w.userId = u.id
       WHERE u.openId = ?
       LIMIT 1`,
      [openId]
    ) as any[];
    await conn.end();

    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      openId: row.openId,
      name: row.name ?? null,
      email: row.email ?? null,
      balance: row.balance ?? 0,
    };
  } catch (err) {
    console.error("[mousaAuth] DB error:", err);
    return null;
  }
}

// ===== فحص رصيد الكريدت =====
export async function checkBalance(userId: number): Promise<CheckBalanceResult> {
  try {
    const res = await fetch(
      `${MOUSA_API_BASE}/api/platform/check-balance?userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${ENV.mousaPlatformApiKey}`,
          "X-Platform-ID": "fada",
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      balance: data.balance ?? 0,
      upgradeUrl: data.upgradeUrl ?? `${MOUSA_API_BASE}/pricing?ref=fada`,
    };
  } catch (err) {
    console.error("[mousaAuth] checkBalance error:", err);
    return { balance: 0, upgradeUrl: `${MOUSA_API_BASE}/pricing?ref=fada` };
  }
}

// ===== خصم الكريدت بعد عملية AI =====
export async function deductCredits(
  userId: number,
  amount: number,
  description: string
): Promise<DeductResult> {
  try {
    const res = await fetch(`${MOUSA_API_BASE}/api/platform/deduct-credits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.mousaPlatformApiKey}`,
        "X-Platform-ID": "fada",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, amount, description }),
    });

    const data = await res.json();

    if (res.status === 402) {
      // رصيد غير كافٍ
      return {
        success: false,
        error: "رصيد غير كافٍ",
        currentBalance: data.currentBalance,
        required: data.required,
        upgradeUrl: data.upgradeUrl ?? `${MOUSA_API_BASE}/pricing?ref=fada`,
      };
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return {
      success: true,
      newBalance: data.newBalance,
      deducted: data.deducted,
    };
  } catch (err) {
    console.error("[mousaAuth] deductCredits error:", err);
    return { success: false, error: "خطأ في خصم الكريدت" };
  }
}

// ===== رابط إعادة التوجيه لتسجيل الدخول =====
export function getMousaLoginRedirectUrl(returnUrl: string): string {
  return `${MOUSA_API_BASE}/api/platform/login-redirect?platform=fada&return_url=${encodeURIComponent(returnUrl)}`;
}

// ===== مساعد: تحليل الـ cookies =====
function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieHeader.split(";").forEach(part => {
    const [key, ...vals] = part.trim().split("=");
    if (key) result[key.trim()] = decodeURIComponent(vals.join("="));
  });
  return result;
}
