/**
 * MOUSA.AI Platform Integration Helper
 * Platform ID: fada
 * Base URL: https://www.mousa.ai
 * API Version: 2.0 (March 2026)
 *
 * Key changes in v2.0:
 * - verify-token returns { userId, creditBalance } (not balance/sufficient/platformCost)
 * - check-balance returns { balance, upgradeUrl } only (platform decides if sufficient)
 * - mousa.ai always opens platform regardless of balance
 * - Platform makes allow/deny decision itself
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

// ─── v2.0 Response Types ──────────────────────────────────────────────────────

/** Response from POST /api/platform/verify-token (v2.0) */
export interface MousaTokenData {
  valid: boolean;
  userId: number;
  openId: string;
  name: string;
  email?: string;
  creditBalance: number; // v2.0: was "balance" in v1.x
  platform: string;
}

/** Response from GET /api/platform/check-balance (v2.0) */
export interface MousaBalanceData {
  balance: number;
  upgradeUrl: string;
  // NOTE: v2.0 removed "sufficient" and "platformCost" — platform decides
}

/** Response from POST /api/platform/deduct-credits (200 — success) */
export interface MousaDeductResult {
  success: boolean;
  newBalance: number;
  deducted: number;
  platform: string;
  costBreakdown?: Record<string, number>;
  costRule?: string;
}

/** Response from POST /api/platform/deduct-credits (402 — insufficient) */
export interface MousaInsufficientError {
  error: string;
  currentBalance: number;
  required: number;
  upgradeUrl: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Verify a JWT token received from mousa.ai when user clicks the platform card.
 * Returns userId and creditBalance to identify the user and check their balance.
 */
export async function verifyMousaToken(token: string): Promise<MousaTokenData> {
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/verify-token`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errData = error as { code?: string };
    if (errData?.code === "TOKEN_EXPIRED") {
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(
      `MOUSA verify-token failed (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

/**
 * Check a user's current credit balance.
 * v2.0: Returns { balance, upgradeUrl } only.
 * Platform is responsible for deciding if balance is sufficient.
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
 * Deduct credits from a user AFTER a successful AI operation.
 * Supports fixed amount or usage_factors for dynamic pricing.
 *
 * v2.0 flow: check-balance first (platform decides) → run AI → deduct on success
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
    // Insufficient balance — return error object for caller to handle
    // Caller should show upgradeUrl dialog
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
 * Deduct credits using usage_factors for dynamic cost calculation by Mousa.ai.
 * Useful when cost depends on number of images, text length, or analysis depth.
 */
export async function deductMousaCreditsWithFactors(
  userId: number,
  usageFactors: {
    images?: number;
    text_length?: number;
    analysis_depth?: number;
  },
  description: string
): Promise<MousaDeductResult | MousaInsufficientError> {
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/deduct-credits`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ userId, usage_factors: usageFactors, description }),
  });

  const data = await res.json();

  if (res.status === 402) {
    return data as MousaInsufficientError;
  }

  if (!res.ok) {
    throw new Error(
      `MOUSA deduct-credits (factors) failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return data as MousaDeductResult;
}

/**
 * Get Mousa.ai userId by Manus openId.
 * NOTE: This endpoint may not exist in v2.0 API — used as best-effort.
 * If it fails, user must link manually via platform card.
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
    const data = await res.json() as { userId?: number; balance?: number; creditBalance?: number };
    if (data?.userId) {
      return {
        userId: data.userId,
        balance: data.creditBalance ?? data.balance ?? 0,
      };
    }
    return null;
  } catch {
    // Non-critical: if lookup fails, user can still link manually via platform card
    return null;
  }
}

// ─── Credit Costs ─────────────────────────────────────────────────────────────

/**
 * Credit costs per operation in م. سارة (fada platform)
 * Range: 15-40 credits per operation (per /api/platform/pricing for fada)
 * Platform sets its own prices within this range.
 */
export const CREDIT_COSTS = {
  analyzePhoto: 20,        // تحليل صورة داخلية
  generateIdeas: 20,       // توليد أفكار تصميم
  applyStyle: 15,          // تغيير النمط/الستايل
  refineDesign: 15,        // تحسين التصميم بالقلم
  generate3D: 30,          // توليد رندر 3D من المسقط
  generatePlanDesign: 20,  // توليد بيانات تصميم من المسقط
  generatePDF: 5,          // تصدير PDF
  voiceDesign: 20,         // تصميم صوتي بالذكاء الاصطناعي
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

/** Upgrade URL for insufficient balance */
export const MOUSA_UPGRADE_URL = "https://www.mousa.ai/pricing?ref=fada";
