/**
 * useMousaError.ts
 * Hook موحّد لمعالجة أخطاء Mousa.ai في الواجهة الأمامية
 * يُستخدم في جميع mutations التي تستدعي AI procedures
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface MousaErrorData {
  code?: string;
  message?: string;
  currentBalance?: number;
  required?: number;
  baseCost?: number;
  multiplier?: number;
  sessionCount?: number;
  upgradeUrl?: string;
}

/**
 * تحليل رسالة خطأ tRPC واستخراج بيانات Mousa
 */
function parseMousaError(error: { message?: string; data?: { code?: string } }): MousaErrorData | null {
  try {
    // محاولة تحليل الـ message كـ JSON
    if (error.message) {
      const parsed = JSON.parse(error.message);
      if (parsed.code && (parsed.code === "MOUSA_REQUIRED" || parsed.code === "INSUFFICIENT_CREDITS")) {
        return parsed;
      }
    }
  } catch {
    // ليست JSON
  }

  // فحص كود الخطأ مباشرة
  if (error.data?.code === "UNAUTHORIZED") {
    return {
      code: "UNAUTHORIZED",
      message: "يجب تسجيل الدخول أولاً",
    };
  }

  return null;
}

/**
 * Hook لمعالجة أخطاء Mousa
 */
export function useMousaError() {
  const handleMousaError = useCallback((error: { message?: string; data?: { code?: string } }) => {
    const mousaError = parseMousaError(error);

    if (!mousaError) return false; // ليس خطأ Mousa

    if (mousaError.code === "UNAUTHORIZED") {
      toast.error("يجب تسجيل الدخول أولاً", {
        description: "سجّل دخولك للاستمرار",
        action: {
          label: "تسجيل الدخول",
          onClick: () => {
            window.location.href = getLoginUrl();
          },
        },
        duration: 8000,
      });
      return true;
    }

    if (mousaError.code === "MOUSA_REQUIRED") {
      toast.error("يجب الدخول من منصة Mousa.ai", {
        description: "هذه الميزة متاحة فقط لمستخدمي Mousa.ai",
        action: {
          label: "الذهاب إلى Mousa.ai",
          onClick: () => {
            window.open(mousaError.upgradeUrl || "https://www.mousa.ai", "_blank");
          },
        },
        duration: 10000,
      });
      return true;
    }

    if (mousaError.code === "INSUFFICIENT_CREDITS") {
      const { currentBalance, required, multiplier, sessionCount } = mousaError;
      let description = `رصيدك الحالي: ${currentBalance ?? "?"} نقطة • تحتاج: ${required ?? "?"} نقطة`;
      
      if (multiplier && multiplier > 1 && sessionCount) {
        description += `\n(جلسة ${sessionCount} — خصم مضاعف ×${multiplier})`;
      }

      toast.error("رصيد غير كافٍ", {
        description,
        action: {
          label: "شراء نقاط",
          onClick: () => {
            window.open(mousaError.upgradeUrl || "https://www.mousa.ai", "_blank");
          },
        },
        duration: 10000,
      });
      return true;
    }

    return false;
  }, []);

  return { handleMousaError };
}

/**
 * دالة مساعدة لاستخدامها مباشرة في onError
 */
export function handleMousaErrorStatic(error: { message?: string; data?: { code?: string } }): boolean {
  const mousaError = parseMousaError(error);
  if (!mousaError) return false;

  if (mousaError.code === "UNAUTHORIZED") {
    toast.error("يجب تسجيل الدخول أولاً", {
      action: {
        label: "تسجيل الدخول",
        onClick: () => { window.location.href = getLoginUrl(); },
      },
      duration: 8000,
    });
    return true;
  }

  if (mousaError.code === "MOUSA_REQUIRED") {
    toast.error("يجب الدخول من منصة Mousa.ai", {
      description: "هذه الميزة متاحة فقط لمستخدمي Mousa.ai",
      action: {
        label: "الذهاب إلى Mousa.ai",
        onClick: () => { window.open("https://www.mousa.ai", "_blank"); },
      },
      duration: 10000,
    });
    return true;
  }

  if (mousaError.code === "INSUFFICIENT_CREDITS") {
    const { currentBalance, required, multiplier, sessionCount, upgradeUrl } = mousaError;
    let description = `رصيدك: ${currentBalance ?? "?"} نقطة • تحتاج: ${required ?? "?"} نقطة`;
    if (multiplier && multiplier > 1 && sessionCount) {
      description += ` (جلسة ${sessionCount} × ${multiplier})`;
    }
    toast.error("رصيد غير كافٍ", {
      description,
      action: {
        label: "شراء نقاط",
        onClick: () => { window.open(upgradeUrl || "https://www.mousa.ai", "_blank"); },
      },
      duration: 10000,
    });
    return true;
  }

  return false;
}
