/**
 * creditHelper.ts — نظام الكريدت
 * 
 * ⚠️ الوضع الحالي: مجاني بالكامل (تم إيقاف نظام الكريدت مؤقتاً)
 * جميع العمليات مسموحة بدون خصم أي نقاط
 */

import { getDb } from "./db";
import { aiUsageLogs } from "../drizzle/schema";
import { CREDIT_COSTS, MOUSA_UPGRADE_URL, type CreditOperation } from "./mousa";

export const FREE_CREDITS_LIMIT = 999999; // مجاني بالكامل

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
  isFreeMode?: boolean;
}

/**
 * تعطيل نظام الكريدت مؤقتاً — جميع العمليات مجانية
 */
export async function checkAndDeductCredits(
  userId: number,
  mousaUserId: number | null | undefined,
  operation: CreditOperation,
  _description?: string
): Promise<CreditCheckResult> {
  const baseCost = CREDIT_COSTS[operation];

  // تسجيل للإحصاء فقط (بدون خصم)
  await logUsage(userId, mousaUserId ?? 0, operation, 0, true);

  return {
    allowed: true,
    baseCost,
    finalCost: 0, // مجاني
    sessionCount: 1,
    multiplier: 1,
    newBalance: 999999,
    upgradeUrl: MOUSA_UPGRADE_URL,
    isGuest: !mousaUserId,
    isFreeMode: true,
  };
}

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
