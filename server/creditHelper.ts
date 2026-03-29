/**
 * creditHelper.ts
 * ⚠️ وضع مؤقت: جميع فحوصات Mousa.ai معطّلة — المنصة مفتوحة للجميع
 * سيتم إعادة تفعيل الفحوصات عند الأمر.
 */

import { getDb } from "./db";
import { aiUsageLogs } from "../drizzle/schema";
import { CREDIT_COSTS, MOUSA_UPGRADE_URL, type CreditOperation } from "./mousa";

export interface CreditCheckResult {
  allowed: boolean;
  baseCost: number;
  finalCost: number;
  sessionCount: number;
  multiplier: number;
  newBalance?: number;
  upgradeUrl?: string;
}

export async function checkAndDeductCredits(
  userId: number,
  mousaUserId: number | null | undefined,
  operation: CreditOperation,
  description?: string
): Promise<CreditCheckResult> {
  // ⚠️ مؤقت: تجاوز جميع فحوصات Mousa.ai — السماح للجميع
  const baseCost = CREDIT_COSTS[operation];

  // تسجيل الاستخدام في قاعدة البيانات (اختياري)
  try {
    const db = await getDb();
    if (db && userId) {
      await db.insert(aiUsageLogs).values({
        userId,
        mousaUserId: mousaUserId ?? 0,
        operation,
        creditsDeducted: baseCost,
        sessionMultiplier: 1,
        dailySessionCount: 1,
        success: true,
      });
    }
  } catch {
    // تجاهل أخطاء التسجيل
  }

  return {
    allowed: true,
    baseCost,
    finalCost: baseCost,
    sessionCount: 1,
    multiplier: 1,
    newBalance: 9999,
    upgradeUrl: MOUSA_UPGRADE_URL,
  };
}
