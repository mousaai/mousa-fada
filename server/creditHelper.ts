/**
 * creditHelper.ts — خصم الكريدت عبر mousa.ai API
 * حسب الدليل التقني الرسمي (أبريل 2026)
 *
 * التدفق:
 * 1. فحص الرصيد قبل العملية (check-balance)
 * 2. تنفيذ العملية
 * 3. خصم الكريدت بعد النجاح (deduct-credits)
 */

import { getDb } from "./db";
import { aiUsageLogs } from "../drizzle/schema";
import { CREDIT_COSTS, MOUSA_UPGRADE_URL, type CreditOperation } from "./mousa";
import { checkBalance, deductCredits } from "./_core/mousaAuth";

export interface CreditCheckResult {
  allowed: boolean;
  baseCost: number;
  finalCost: number;
  sessionCount: number;
  multiplier: number;
  newBalance?: number;
  upgradeUrl?: string;
  error?: string;
  isGuest?: boolean;
}

export async function checkAndDeductCredits(
  userId: number,
  mousaUserId: number | null | undefined,
  operation: CreditOperation,
  description?: string
): Promise<CreditCheckResult> {
  const baseCost = CREDIT_COSTS[operation];

  // ===== الزائر: وصول مجاني بدون خصم كريدت =====
  if (!mousaUserId) {
    await logUsage(userId, 0, operation, 0, true); // تسجيل بدون خصم (للإحصاء)
    return {
      allowed: true,
      baseCost,
      finalCost: 0, // الزائر لا يدفع
      sessionCount: 1,
      multiplier: 1,
      newBalance: undefined,
      upgradeUrl: MOUSA_UPGRADE_URL,
      isGuest: true,
    };
  }

  // ===== فحص الرصيد قبل العملية =====
  try {
    const balanceResult = await checkBalance(mousaUserId);
    if (balanceResult.balance < baseCost) {
      await logUsage(userId, mousaUserId, operation, baseCost, false);
      return {
        allowed: false,
        baseCost,
        finalCost: baseCost,
        sessionCount: 1,
        multiplier: 1,
        newBalance: balanceResult.balance,
        upgradeUrl: balanceResult.upgradeUrl,
        error: `رصيدك الحالي ${balanceResult.balance} كريدت، وهذه العملية تحتاج ${baseCost} كريدت`,
      };
    }
  } catch (err) {
    // في حالة فشل فحص الرصيد، نسمح بالعملية (لا نعطّل الخدمة)
    console.warn("[creditHelper] checkBalance failed, allowing operation:", err);
    await logUsage(userId, mousaUserId, operation, baseCost, true);
    return {
      allowed: true,
      baseCost,
      finalCost: baseCost,
      sessionCount: 1,
      multiplier: 1,
      newBalance: undefined,
      upgradeUrl: MOUSA_UPGRADE_URL,
    };
  }

  // ===== خصم الكريدت بعد العملية =====
  try {
    const deductResult = await deductCredits(
      mousaUserId,
      baseCost,
      description ?? operation
    );

    if (!deductResult.success) {
      await logUsage(userId, mousaUserId, operation, baseCost, false);
      return {
        allowed: false,
        baseCost,
        finalCost: baseCost,
        sessionCount: 1,
        multiplier: 1,
        newBalance: deductResult.currentBalance,
        upgradeUrl: deductResult.upgradeUrl ?? MOUSA_UPGRADE_URL,
        error: deductResult.error ?? "فشل خصم الكريدت",
      };
    }

    await logUsage(userId, mousaUserId, operation, baseCost, true);
    return {
      allowed: true,
      baseCost,
      finalCost: baseCost,
      sessionCount: 1,
      multiplier: 1,
      newBalance: deductResult.newBalance,
      upgradeUrl: MOUSA_UPGRADE_URL,
    };
  } catch (err) {
    console.error("[creditHelper] deductCredits error:", err);
    // في حالة فشل الخصم، نسمح بالعملية ونسجّل الخطأ
    await logUsage(userId, mousaUserId, operation, baseCost, true);
    return {
      allowed: true,
      baseCost,
      finalCost: baseCost,
      sessionCount: 1,
      multiplier: 1,
      newBalance: undefined,
      upgradeUrl: MOUSA_UPGRADE_URL,
    };
  }
}

// ===== تسجيل الاستخدام في قاعدة بيانات فضاء =====
async function logUsage(
  userId: number,
  mousaUserId: number,
  operation: CreditOperation,
  creditsDeducted: number,
  success: boolean
): Promise<void> {
  try {
    const db = await getDb();
    if (db && userId) {
      await db.insert(aiUsageLogs).values({
        userId,
        mousaUserId,
        operation,
        creditsDeducted,
        sessionMultiplier: 1,
        dailySessionCount: 1,
        success,
      });
    }
  } catch {
    // تجاهل أخطاء التسجيل
  }
}
