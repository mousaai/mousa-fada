/**
 * MOUSA.AI Platform Integration Helper
 * Platform ID: fada
 * Base URL: https://www.mousa.ai
 */

const MOUSA_BASE_URL = "https://www.mousa.ai";
const PLATFORM_ID = "fada";

function getApiKey(): string {
  const key = process.env.MOUSA_PLATFORM_API_KEY;
  if (!key) throw new Error("MOUSA_PLATFORM_API_KEY is not set");
  return key;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "X-Platform-ID": PLATFORM_ID,
    "Content-Type": "application/json",
  };
}

export interface MousaTokenData {
  valid: boolean;
  userId: number;
  userName: string;
  balance: number;
  platformCost: number;
  sufficient: boolean;
}

export interface MousaBalanceData {
  balance: number;
  sufficient: boolean;
  platformCost: number;
  upgradeUrl: string;
}

export interface MousaDeductResult {
  success: boolean;
  newBalance: number;
  deducted: number;
  platform: string;
}

export interface MousaInsufficientError {
  error: string;
  currentBalance: number;
  required: number;
  upgradeUrl: string;
}

/**
 * Verify a token received from mousa.ai when user clicks the platform card
 */
export async function verifyMousaToken(token: string): Promise<MousaTokenData> {
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/verify-token`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `MOUSA verify-token failed (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

/**
 * Check if a user has sufficient balance before running an AI operation
 */
export async function checkMousaBalance(
  userId: number
): Promise<MousaBalanceData> {
  const res = await fetch(
    `${MOUSA_BASE_URL}/api/platform/check-balance?userId=${userId}`,
    { headers: getHeaders() }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `MOUSA check-balance failed (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

/**
 * Deduct credits from a user after a successful AI operation
 */
export async function deductMousaCredits(
  userId: number,
  amount: number,
  description: string
): Promise<MousaDeductResult | MousaInsufficientError> {
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/deduct-credits`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ userId, amount, description }),
  });

  const data = await res.json();

  if (res.status === 402) {
    // Insufficient balance — return the error object for the caller to handle
    return data as MousaInsufficientError;
  }

  if (!res.ok) {
    throw new Error(
      `MOUSA deduct-credits failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return data as MousaDeductResult;
}

/**
 * Get Mousa.ai userId by Manus openId
 * Called automatically during OAuth login to link accounts silently
 */
export async function getMousaUserByOpenId(
  openId: string
): Promise<{ userId: number; balance: number } | null> {
  try {
    const res = await fetch(
      `${MOUSA_BASE_URL}/api/platform/user-by-openid?openId=${encodeURIComponent(openId)}`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.userId) {
      return { userId: data.userId, balance: data.balance ?? 0 };
    }
    return null;
  } catch {
    // Non-critical: if lookup fails, user can still link manually via platform card
    return null;
  }
}

/**
 * Credit costs per operation in م. سارة
 * Based on MOUSA.AI platform cost for fada (20 credits base)
 */
export const CREDIT_COSTS = {
  analyzePhoto: 20,       // تحليل صورة
  generateIdeas: 20,      // توليد أفكار تصميم
  applyStyle: 15,         // تغيير النمط/الستايل
  refineDesign: 15,       // تحسين التصميم بالقلم
  generate3D: 25,         // توليد رندر 3D من المسقط
  generatePlanDesign: 20, // توليد بيانات تصميم من المسقط
  generatePDF: 5,         // تصدير PDF
  voiceDesign: 20,        // تصميم صوتي
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;
