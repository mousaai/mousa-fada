/**
 * useMousaError.ts
 * Hook موحّد لمعالجة أخطاء Mousa.ai في الواجهة الأمامية
 * المبدأ: لا redirect إجباري — المنصة مفتوحة للجميع
 */

import { useCallback } from "react";
import { toast } from "sonner";

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

function parseMousaError(error: { message?: string; data?: { code?: string } }): MousaErrorData | null {
  try {
    if (error.message) {
      const parsed = JSON.parse(error.message);
      if (parsed.code && (parsed.code === "MOUSA_REQUIRED" || parsed.code === "INSUFFICIENT_CREDITS")) {
        return parsed;
      }
    }
  } catch { /* ليست JSON */ }

  if (error.data?.code === "UNAUTHORIZED") {
    return { code: "UNAUTHORIZED", message: "انتهت صلاحية الجلسة" };
  }

  return null;
}

export function useMousaError() {
  const handleMousaError = useCallback((error: { message?: string; data?: { code?: string } }) => {
    const mousaError = parseMousaError(error);
    if (!mousaError) return false;

    if (mousaError.code === "UNAUTHORIZED") {
      // لا redirect — فقط إشعار بسيط
      toast.warning("انتهت صلاحية الجلسة", {
        description: "يمكنك المتابعة كزائر بـ 200 نقطة مجانية",
        duration: 4000,
      });
      return true;
    }

    if (mousaError.code === "MOUSA_REQUIRED") {
      toast.info("ميزة حصرية لمستخدمي Mousa.ai", {
        description: "سجّل في mousa.ai للوصول لهذه الميزة",
        action: {
          label: "mousa.ai",
          onClick: () => window.open(mousaError.upgradeUrl || "https://www.mousa.ai", "_blank"),
        },
        duration: 8000,
      });
      return true;
    }

    if (mousaError.code === "INSUFFICIENT_CREDITS") {
      const { currentBalance, required, multiplier, sessionCount } = mousaError;
      let description = `رصيدك: ${currentBalance ?? "?"} نقطة • تحتاج: ${required ?? "?"} نقطة`;
      if (multiplier && multiplier > 1 && sessionCount) {
        description += ` (جلسة ${sessionCount} × ${multiplier})`;
      }
      toast.error("رصيد غير كافٍ", {
        description,
        action: {
          label: "شحن الرصيد",
          onClick: () => window.open(mousaError.upgradeUrl || "https://www.mousa.ai", "_blank"),
        },
        duration: 10000,
      });
      return true;
    }

    return false;
  }, []);

  return { handleMousaError };
}

export function handleMousaErrorStatic(error: { message?: string; data?: { code?: string } }): boolean {
  const mousaError = parseMousaError(error);
  if (!mousaError) return false;

  if (mousaError.code === "UNAUTHORIZED") {
    toast.warning("انتهت صلاحية الجلسة", {
      description: "يمكنك المتابعة كزائر بـ 200 نقطة مجانية",
      duration: 4000,
    });
    return true;
  }

  if (mousaError.code === "MOUSA_REQUIRED") {
    toast.info("ميزة حصرية لمستخدمي Mousa.ai", {
      action: {
        label: "mousa.ai",
        onClick: () => window.open("https://www.mousa.ai", "_blank"),
      },
      duration: 8000,
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
        label: "شحن الرصيد",
        onClick: () => window.open(upgradeUrl || "https://www.mousa.ai", "_blank"),
      },
      duration: 10000,
    });
    return true;
  }

  return false;
}
