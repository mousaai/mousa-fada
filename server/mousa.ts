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

// ===== Idempotency Key Generator =====
import { randomUUID } from "crypto";

/**
 * توليد Idempotency Key فريد لكل طلب خصم.
 * يمنع الخصم المزدوج في حالة إعادة المحاولة أو انقطاع الشبكة.
 * الصيغة: fada_{uuid} — يُرسَل في header X-Idempotency-Key
 */
function generateIdempotencyKey(): string {
  return `fada_${randomUUID()}`;
}

function getApiKey(): string {
  // الأولوية: MOUSA_PLATFORM_API_KEY (مفتاح mousa.ai الحقيقي) إذا كانت قيمته صحيحة (ليست USAA)
  // ثم PLATFORM_API_KEY كـ fallback
  const mousaKey = process.env.MOUSA_PLATFORM_API_KEY;
  if (mousaKey && mousaKey !== "USAA" && mousaKey.length > 10) {
    return mousaKey;
  }
  const platformKey = process.env.PLATFORM_API_KEY;
  if (platformKey && platformKey !== "USAA" && platformKey.length > 10) {
    return platformKey;
  }
  throw new Error("MOUSA_PLATFORM_API_KEY is not set or invalid (got: " + (mousaKey ?? "undefined") + ")");
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
  description: string,
  idempotencyKey?: string
): Promise<MousaDeductResult | MousaInsufficientError> {
  const key = idempotencyKey ?? generateIdempotencyKey();
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/deduct-credits`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "X-Idempotency-Key": key,
    },
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
  description: string,
  idempotencyKey?: string
): Promise<MousaDeductResult | MousaInsufficientError> {
  const key = idempotencyKey ?? generateIdempotencyKey();
  const res = await fetch(`${MOUSA_BASE_URL}/api/platform/deduct-credits`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "X-Idempotency-Key": key,
    },
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
 * Credit costs per operation in م. اليازية (fada platform)
 * Updated v48.0 — based on actual workload analysis per service:
 *
 * analyzePhoto         20  — LLM + single image (high detail)
 * analyzeAndGenerate   35  — LLM (500+ line prompt) + multi-image + 3-6 ideas with BOQ (heaviest service)
 * generateVisualization 25 — generateImage with originalImages (inpainting) + auto fallback
 * generateIdeas        20  — LLM JSON schema, no image generation
 * reAnalyze            15  — LLM re-analysis with existing data, simpler prompt
 * applyStyle           20  — generateImage + LLM for title (two parallel calls)
 * refineDesign         20  — generateImage with originalImages × 2 (attempt + fallback)
 * voiceDesign          15  — transcribeAudio + LLM JSON (no image, lighter than analyzePhoto)
 * generateFloorPlan3D  25  — generateImage text-only prompt (no reference image)
 * generate3D           30  — generateImage with originalImages (floor plan as reference)
 * generatePlanDesign   25  — LLM with large JSON schema (BOQ + furniture + variants)
 * generatePDF           5  — frontend html2canvas only, no AI call
 */
export const CREDIT_COSTS = {
  analyzePhoto: 40,              // تحليل صورة داخلية — LLM + صورة واحدة
  analyzeAndGenerate: 70,        // تحليل + توليد 3-6 أفكار كاملة — الخدمة الأثقل
  generateVisualization: 50,     // توليد صورة تصورية مع الحفاظ على البنية
  generateIdeas: 40,             // توليد أفكار تصميمية بدون صورة مرجعية
  reAnalyze: 30,                 // إعادة تحليل مع تعديلات المستخدم
  applyStyle: 40,                // تغيير النمط — generateImage + LLM
  refineDesign: 40,              // تحسين بالقلم الرقمي — generateImage × 2
  voiceDesign: 30,               // تصميم صوتي — transcribe + LLM فقط
  generateFloorPlan3D: 50,       // رندر 3D من مسقط صوتي — generateImage نصي
  generate3D: 60,                // رندر 3D من مسقط محمّل — generateImage + originalImages
  generatePlanDesign: 50,        // بيانات تصميم كاملة من المسقط — LLM ضخم
  generatePDF: 10,               // تصدير PDF — معالجة frontend فقط
  designChat: 20,                // شات تعديل التصميم — LLM + generateImage اختياري
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

/** Upgrade URL for insufficient balance */
export const MOUSA_UPGRADE_URL = "https://www.mousa.ai/pricing?ref=fada";

// ─── Pricing Webhook ──────────────────────────────────────────────────────────

/**
 * إرسال الأسعار المحدّثة إلى Mousa.ai عبر Pricing Webhook.
 * يُستدعى عند بدء الخادم وعند أي تغيير في CREDIT_COSTS.
 *
 * Endpoint: POST https://www.mousa.ai/api/platform/pricing-webhook
 * Headers:  Authorization: Bearer <MOUSA_PLATFORM_API_KEY>
 *           X-Platform-ID: fada
 */
export async function notifyMousaPricing(): Promise<boolean> {
  const apiKey = process.env.PLATFORM_API_KEY || process.env.MOUSA_PLATFORM_API_KEY;
  if (!apiKey) {
    console.warn("[mousa] PLATFORM_API_KEY not set — skipping pricing webhook");
    return false;
  }

  const costs = CREDIT_COSTS;
  const values = Object.values(costs) as number[];
  const minCost = Math.min(...values);
  const maxCost = Math.max(...values);

  // بناء قائمة الخدمات من CREDIT_COSTS
  const services = (Object.entries(costs) as [CreditOperation, number][]).map(
    ([name, cost]) => ({ name, cost })
  );

  const payload = {
    services,
    minCost,
    maxCost,
    baseCost: costs.analyzePhoto, // التكلفة الافتراضية عند عدم تحديد العملية
    description: `fada platform (م. اليازية) — ${services.length} services, range ${minCost}–${maxCost} credits`,
  };

  try {
    const response = await fetch(
      "https://www.mousa.ai/api/platform/pricing-webhook",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Platform-ID": "fada",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`[mousa] Pricing webhook failed (${response.status}):`, err);
      return false;
    }

    const result = await response.json();
    console.log(`[mousa] Pricing webhook sent ✓ updatedAt=${result.updatedAt}`);
    return true;
  } catch (error) {
    console.error("[mousa] Pricing webhook error:", error);
    return false;
  }
}
