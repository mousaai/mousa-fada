import { useState } from "react";
import { useAuth as useMousaAuth } from "@/components/AuthGate";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t, dir } = useLanguage();
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
    const hasLocalSession = user && user.openId && user.openId !== "guest";
    const returnUrl = encodeURIComponent(window.location.origin);
    const mousaLinkUrl = `https://www.mousa.ai/redirect?platform=fada&return=${returnUrl}`;
    const buttonText = hasLocalSession ? t("credit.link") : t("credit.login");
    const tooltipTitle = hasLocalSession ? t("credit.linkTitle") : t("credit.loginTitle");
    const tooltipDesc = hasLocalSession ? t("credit.linkDesc") : t("credit.loginDesc");
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={mousaLinkUrl}
              target="_self"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 ${className}`}
              dir={dir}
            >
              <Coins className="w-4 h-4" />
              <span>{buttonText}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </TooltipTrigger>
          <TooltipContent dir={dir}>
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
            dir={dir}
          >
            {isEmpty ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            <span>{balance.toLocaleString()} {t("credit.balance")}</span>
            {showLabel && <span className="text-xs opacity-70">💎</span>}
            <RefreshCw className={`w-3 h-3 opacity-50 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent dir={dir}>
          <p className="font-bold">{t("credit.yourBalance")}: {balance.toLocaleString()} {t("credit.balance")}</p>
          {user.name && <p className="text-xs opacity-70">{t("credit.hello")} {user.name}</p>}
          {isLow && !isEmpty && (
            <p className="text-xs text-orange-600 mt-1">{t("credit.low")}</p>
          )}
          {isEmpty && (
            <p className="text-xs text-red-600 mt-1">{t("credit.empty")}</p>
          )}
          <p className="text-xs opacity-50 mt-1">{t("credit.refresh")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * useMousaCredit — Hook لإدارة الكريدت في الـ UI
 */
export function useMousaCredit() {
  const { user, deductCredits } = useMousaAuth();

  const balance = user?.creditBalance ?? 0;
  const requiresMousa = !!(user && !user.isFreeMode && user.userId !== 0);
  const upgradeUrl = "https://www.mousa.ai/pricing?ref=fada";

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

  const deduct = async (operation: string, description?: string): Promise<{ newBalance: number }> => {
    if (!requiresMousa) {
      return { newBalance: balance };
    }
    return deductCredits(0, description ?? operation);
  };

  const canAfford = (operation: string): boolean => {
    if (!requiresMousa) return true;
    const cost = CREDIT_COSTS[operation] ?? 40;
    return balance >= cost;
  };

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
