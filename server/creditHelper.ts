/**
 * creditHelper.ts
 * Helper موحّد لخصم الكريدت من Mousa.ai مع دعم تعدد الجلسات اليومية
 *
 * منطق الخصم:
 * - الجلسة الأولى في اليوم: التكلفة الأساسية (1x)
 * - الجلسة الثانية: 1.5x
 * - الجلسة الثالثة فأكثر: 2x
 */

import { TRPCError } from "@trpc/server";
import { checkMousaBalance, deductMousaCredits, CREDIT_COSTS, type CreditOperation } from "./mousa";
import { getDb } from "./db";
import { aiUsageLogs } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * احسب عدد الجلسات اليومية للمستخدم
 */
async function getDailySessionCount(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 1;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.userId, userId),
          gte(aiUsageLogs.createdAt, todayStart),
          eq(aiUsageLogs.success, true)
        )
      );

    return Number(result[0]?.count ?? 0) + 1; // +1 للجلسة الحالية
  } catch {
    return 1; // في حالة خطأ، نعتبرها الجلسة الأولى
  }
}

/**
 * احسب معامل الخصم بناءً على عدد الجلسات
 */
function getSessionMultiplier(sessionCount: number): number {
  if (sessionCount <= 1) return 1.0;
  if (sessionCount === 2) return 1.5;
  return 2.0; // الجلسة الثالثة فأكثر
}

export interface CreditCheckResult {
  allowed: boolean;
  baseCost: number;
  finalCost: number;
  sessionCount: number;
  multiplier: number;
  currentBalance?: number;
  upgradeUrl?: string;
  insufficientBalance?: boolean;
}

/**
 * التحقق من الرصيد وخصم الكريدت قبل تنفيذ عملية AI
 * يُرمى TRPCError إذا كان الرصيد غير كافٍ
 */
export async function checkAndDeductCredits(
  userId: number,
  mousaUserId: number,
  operation: CreditOperation,
  description?: string
): Promise<CreditCheckResult> {
  const baseCost = CREDIT_COSTS[operation];
  const sessionCount = await getDailySessionCount(userId);
  const multiplier = getSessionMultiplier(sessionCount);
  const finalCost = Math.ceil(baseCost * multiplier);

  // التحقق من الرصيد
  let balanceData;
  try {
    balanceData = await checkMousaBalance(mousaUserId);
  } catch (err) {
    console.error("[creditHelper] checkMousaBalance failed:", err);
    // في حالة خطأ في API، نسمح بالمتابعة ونسجّل الخطأ
    return {
      allowed: true,
      baseCost,
      finalCost,
      sessionCount,
      multiplier,
    };
  }

  if (balanceData.balance < finalCost) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message: JSON.stringify({
        code: "INSUFFICIENT_CREDITS",
        message: `رصيدك غير كافٍ. تحتاج ${finalCost} نقطة، رصيدك الحالي ${balanceData.balance} نقطة`,
        currentBalance: balanceData.balance,
        required: finalCost,
        baseCost,
        multiplier,
        sessionCount,
        upgradeUrl: balanceData.upgradeUrl || "https://www.mousa.ai",
      }),
    });
  }

  // خصم الكريدت
  const operationLabels: Record<CreditOperation, string> = {
    analyzePhoto: "تحليل صورة داخلية",
    generateIdeas: "توليد أفكار تصميم",
    applyStyle: "تغيير نمط التصميم",
    refineDesign: "تحسين التصميم",
    generate3D: "توليد رندر 3D",
    generatePlanDesign: "تحليل مخطط المسقط",
    generatePDF: "تصدير دفتر التصميم PDF",
    voiceDesign: "تصميم صوتي بالذكاء الاصطناعي",
  };

  const label = description || operationLabels[operation];
  const fullDescription = sessionCount > 1
    ? `${label} (جلسة ${sessionCount} × ${multiplier})`
    : label;

  let deductSuccess = false;
  try {
    const result = await deductMousaCredits(mousaUserId, finalCost, fullDescription);
    deductSuccess = !("error" in result);
    if ("error" in result) {
      throw new TRPCError({
        code: "PAYMENT_REQUIRED",
        message: JSON.stringify({
          code: "INSUFFICIENT_CREDITS",
          message: result.error,
          currentBalance: result.currentBalance,
          required: finalCost,
          upgradeUrl: result.upgradeUrl,
        }),
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    console.error("[creditHelper] deductMousaCredits failed:", err);
    // في حالة خطأ في API، نسجّل ونكمل
    deductSuccess = false;
  }

  // تسجيل الاستخدام في قاعدة البيانات
  try {
    const db = await getDb();
    if (db) {
      await db.insert(aiUsageLogs).values({
        userId,
        mousaUserId,
        operation,
        creditsDeducted: finalCost,
        sessionMultiplier: multiplier,
        dailySessionCount: sessionCount,
        success: deductSuccess,
      });
    }
  } catch (logErr) {
    console.error("[creditHelper] Failed to log usage:", logErr);
  }

  return {
    allowed: true,
    baseCost,
    finalCost,
    sessionCount,
    multiplier,
    currentBalance: balanceData.balance - finalCost,
  };
}
