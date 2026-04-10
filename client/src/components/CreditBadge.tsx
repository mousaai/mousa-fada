import { useState } from "react";
import { useAuth as useMousaAuth } from "@/components/AuthGate";
import { Coins, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditBadgeProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * CreditBadge — يعرض رصيد الكريدت الحقيقي من mousa.ai
 * - إذا كان المستخدم مرتبطاً بـ mousa.ai: يعرض الرصيد الفعلي
 * - إذا كان زائراً: يعرض "سجّل دخول" مع رابط mousa.ai
 */
export function CreditBadge({ className = "", showLabel = false }: CreditBadgeProps) {
  const { user, refreshBalance } = useMousaAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  // مستخدم غير مرتبط بـ mousa.ai
  if (!user || user.isFreeMode || user.userId === 0) {
    // تحديد نوع المستخدم: زائر حقيقي أم مستخدم بجلسة لكن غير مربوط
    const hasLocalSession = user && user.openId && user.openId !== "guest";
    const returnUrl = encodeURIComponent(window.location.href);
    const mousaLinkUrl = hasLocalSession
      ? `https://www.mousa.ai?return=${returnUrl}` // مستخدم بجلسة — يعود بـ token
      : "https://www.mousa.ai"; // زائر حقيقي
    const buttonText = hasLocalSession ? "ربط حسابي" : "سجّل دخول";
    const tooltipTitle = hasLocalSession ? "ربط حسابك بـ mousa.ai" : "سجّل دخولك عبر mousa.ai";
    const tooltipDesc = hasLocalSession
      ? "اضغط للانتقال إلى mousa.ai وستُربط تلقائياً"
      : "للاستفادة من رصيد الكريدت الخاص بك";
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={mousaLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 ${className}`}
              dir="rtl"
            >
              <Coins className="w-4 h-4" />
              <span>{buttonText}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </TooltipTrigger>
          <TooltipContent dir="rtl">
            <p className="font-bold">{tooltipTitle}</p>
            <p className="text-xs opacity-70">{tooltipDesc}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // مستخدم مرتبط — عرض الرصيد الحقيقي
  const balance = user.creditBalance ?? 0;
  const isLow = balance < 50;
  const isEmpty = balance <= 0;

  const badgeStyle = isEmpty
    ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
    : isLow
    ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${badgeStyle} ${className}`}
            dir="rtl"
          >
            {isEmpty ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            <span>{balance.toLocaleString("ar-AE")} كريدت</span>
            {showLabel && <span className="text-xs opacity-70">💎</span>}
            <RefreshCw className={`w-3 h-3 opacity-50 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <p className="font-bold">رصيدك: {balance.toLocaleString("ar-AE")} كريدت</p>
          {user.name && <p className="text-xs opacity-70">مرحباً {user.name}</p>}
          {isLow && !isEmpty && (
            <p className="text-xs text-orange-600 mt-1">⚠️ رصيد منخفض — يُنصح بالشحن</p>
          )}
          {isEmpty && (
            <p className="text-xs text-red-600 mt-1">❌ رصيد نفد — اشحن من mousa.ai</p>
          )}
          <p className="text-xs opacity-50 mt-1">اضغط للتحديث</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * useMousaCredit — Hook لإدارة الكريدت في الـ UI
 * يستخدم الرصيد الحقيقي من mousa.ai ويخصم بعد كل عملية ناجحة
 */
export function useMousaCredit() {
  const { user, deductCredits } = useMousaAuth();

  const balance = user?.creditBalance ?? 0;
  const requiresMousa = !!(user && !user.isFreeMode && user.userId !== 0);
  const upgradeUrl = "https://www.mousa.ai/pricing?ref=fada";

  // تكاليف العمليات بالكريدت (مطابقة لـ CREDIT_COSTS في server/mousa.ts)
  const CREDIT_COSTS: Record<string, number> = {
    analyzePhoto: 40,
    analyzeAndGenerate: 70,
    generateVisualization: 50,
    generateIdeas: 40,
    reAnalyze: 30,
    applyStyle: 40,
    refineDesign: 40,
    voiceDesign: 30,
    generateFloorPlan3D: 50,
    generate3D: 60,
    generatePlanDesign: 50,
    generatePDF: 10,
  };

  /**
   * خصم الكريدت بعد نجاح العملية
   */
  const deduct = async (operation: string, description?: string): Promise<{ newBalance: number }> => {
    if (!requiresMousa) {
      return { newBalance: balance };
    }
    return deductCredits(0, description ?? operation);
  };

  /**
   * التحقق من إمكانية تنفيذ العملية بناءً على الرصيد
   */
  const canAfford = (operation: string): boolean => {
    if (!requiresMousa) return true;
    const cost = CREDIT_COSTS[operation] ?? 40;
    return balance >= cost;
  };

  /**
   * الحصول على تكلفة العملية بالكريدت
   */
  const getCost = (operation: string): number => {
    return CREDIT_COSTS[operation] ?? 40;
  };

  return {
    balance,
    requiresMousa,
    upgradeUrl,
    deduct,
    canAfford,
    getCost,
    isDeducting: false,
    isFreeMode: !requiresMousa,
    userName: user?.name,
  };
}
