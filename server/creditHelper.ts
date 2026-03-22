/**
 * creditHelper.ts
 * Helper موحّد لخصم الكريدت من Mousa.ai مع دعم تعدد الجلسات اليومية
 *
 * التدفق الصحيح وفق Mousa.ai API v2.0:
 * 1. checkMousaBalance → جلب الرصيد الحالي
 * 2. المنصة تقرر إذا كان الرصيد كافياً (balance >= finalCost)
 * 3. تنفيذ عملية AI
 * 4. deductMousaCredits → خصم بعد النجاح فقط
 *
 * معامل الجلسات اليومية:
 * - الجلسة الأولى: ×1.0 (التكلفة الأساسية)
 * - الجلسة الثانية: ×1.5
 * - الجلسة الثالثة فأكثر: ×2.0
 */

import { TRPCError } from "@trpc/server";
import {
  checkMousaBalance,
  deductMousaCredits,
  CREDIT_COSTS,
  MOUSA_UPGRADE_URL,
  type CreditOperation,
} from "./mousa";
import { getDb } from "./db";
import { aiUsageLogs } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// ─── Session Counting ─────────────────────────────────────────────────────────

/**
 * احسب عدد العمليات الناجحة للمستخدم اليوم (لتحديد معامل الجلسة)
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

    return Number(result[0]?.count ?? 0) + 1; // +1 للعملية الحالية
  } catch {
    return 1; // في حالة خطأ، نعتبرها الجلسة الأولى
  }
}

/**
 * احسب معامل الخصم بناءً على عدد الجلسات اليومية
 */
function getSessionMultiplier(sessionCount: number): number {
  if (sessionCount <= 1) return 1.0;  // الجلسة الأولى: بدون زيادة
  if (sessionCount === 2) return 1.5; // الجلسة الثانية: +50%
  return 2.0;                         // الجلسة الثالثة فأكثر: ×2
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditCheckResult {
  allowed: boolean;
  baseCost: number;
  finalCost: number;
  sessionCount: number;
  multiplier: number;
  newBalance?: number;
  upgradeUrl?: string;
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * التحقق من الرصيد وخصم الكريدت قبل/بعد تنفيذ عملية AI
 *
 * يُرمى TRPCError (PAYMENT_REQUIRED) إذا:
 * - الرصيد غير كافٍ
 * - فشل الخصم بسبب رصيد غير كافٍ (402 من Mousa.ai)
 *
 * @param userId - المعرّف المحلي للمستخدم (لتتبع الجلسات)
 * @param mousaUserId - معرّف المستخدم في Mousa.ai (للخصم)
 * @param operation - نوع العملية (لتحديد التكلفة)
 * @param description - وصف اختياري للعملية
 */
export async function checkAndDeductCredits(
  userId: number,
  mousaUserId: number | null | undefined,
  operation: CreditOperation,
  description?: string
): Promise<CreditCheckResult> {
  // ── التحقق من وجود mousaUserId (إلزامي) ─────────────────────────────────
  if (!mousaUserId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: JSON.stringify({
        code: "MOUSA_REQUIRED",
        message: "يجب الدخول من منصة Mousa.ai لاستخدام هذه الميزة",
        loginUrl: "https://www.mousa.ai",
      }),
    });
  }

  const baseCost = CREDIT_COSTS[operation];
  const sessionCount = await getDailySessionCount(userId);
  const multiplier = getSessionMultiplier(sessionCount);
  const finalCost = Math.ceil(baseCost * multiplier);

  // ── الخطوة 1: التحقق من الرصيد (v2.0: المنصة تقرر الكفاية) ──────────────
  let currentBalance = 0;
  let upgradeUrl = MOUSA_UPGRADE_URL;

  try {
    const balanceData = await checkMousaBalance(mousaUserId);
    currentBalance = balanceData.balance;
    upgradeUrl = balanceData.upgradeUrl || MOUSA_UPGRADE_URL;
  } catch (err) {
    console.error("[creditHelper] checkMousaBalance failed (Fail-Closed):", err);
    // Fail-Closed: عند فشل الاتصال بـ Mousa.ai، نرفض الطلب (بناءً على توجيه Mousa.ai)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: JSON.stringify({
        code: "MOUSA_UNAVAILABLE",
        message: "خدمة الكريدت غير متاحة مؤقتاً، يرجى المحاولة لاحقاً",
        upgradeUrl: MOUSA_UPGRADE_URL,
      }),
    });
  }

  // ── الخطوة 2: المنصة تقرر إذا كان الرصيد كافياً ──────────────────────────
  if (currentBalance < finalCost) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message: JSON.stringify({
        code: "INSUFFICIENT_CREDITS",
        message: `رصيدك غير كافٍ. تحتاج ${finalCost} نقطة، رصيدك الحالي ${currentBalance} نقطة`,
        currentBalance,
        required: finalCost,
        baseCost,
        multiplier,
        sessionCount,
        upgradeUrl,
      }),
    });
  }

  // ── الخطوة 3: خصم الكريدت بعد النجاح ─────────────────────────────────────
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
  const fullDescription =
    sessionCount > 1
      ? `${label} (جلسة ${sessionCount} × ${multiplier})`
      : label;

  let deductSuccess = false;
  let newBalance = currentBalance - finalCost;

  try {
    const result = await deductMousaCredits(mousaUserId, finalCost, fullDescription);

    if ("error" in result) {
      // 402 من Mousa.ai — رصيد غير كافٍ (race condition)
      throw new TRPCError({
        code: "PAYMENT_REQUIRED",
        message: JSON.stringify({
          code: "INSUFFICIENT_CREDITS",
          message: result.error,
          currentBalance: result.currentBalance,
          required: finalCost,
          upgradeUrl: result.upgradeUrl || upgradeUrl,
        }),
      });
    }

    deductSuccess = true;
    newBalance = result.newBalance;
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    // Fail-Closed: خطأ شبكي أو غير متوقع — نرفض العملية (بناءً على توجيه Mousa.ai)
    console.error("[creditHelper] deductMousaCredits failed (Fail-Closed):", err);
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: JSON.stringify({
        code: "MOUSA_UNAVAILABLE",
        message: "خدمة الكريدت غير متاحة مؤقتاً، يرجى المحاولة لاحقاً",
        upgradeUrl: MOUSA_UPGRADE_URL,
      }),
    });
  }

  // ── الخطوة 4: تسجيل الاستخدام في قاعدة البيانات ──────────────────────────
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
    newBalance,
    upgradeUrl,
  };
}
