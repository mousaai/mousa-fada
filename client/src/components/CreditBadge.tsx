import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Coins, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CREDIT_COSTS_LABELS } from "@/lib/creditCosts";

interface CreditBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditBadge({ className = "", showLabel = false }: CreditBadgeProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: balanceData, refetch, isLoading } = trpc.mousa.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000, // تحديث كل دقيقة
    refetchOnWindowFocus: false,
  });

  if (!isAuthenticated) return null;
  if (!balanceData?.requiresMousa) return null;

  const balance = balanceData.balance ?? 0;
  const isLow = balance < 50;
  const isCritical = balance < 20;

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
              isCritical
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : isLow
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            } ${className}`}
            dir="rtl"
          >
            <Coins className="w-4 h-4" />
            {isLoading ? (
              <span className="w-8 h-3 bg-current opacity-20 rounded animate-pulse" />
            ) : (
              <span>{balance.toLocaleString("ar")}</span>
            )}
            {showLabel && <span className="text-xs opacity-70">كريدت</span>}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-72 p-0 shadow-xl border-0 rounded-2xl overflow-hidden"
          align="end"
          dir="rtl"
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between ${
              isCritical ? "bg-red-600" : isLow ? "bg-amber-500" : "bg-emerald-600"
            } text-white`}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-lg">{balance.toLocaleString("ar")} كريدت</span>
            </div>
            <button
              onClick={() => refetch()}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 bg-white">
            {isCritical && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>رصيدك منخفض جداً! قد لا تتمكن من استخدام ميزات الذكاء الاصطناعي.</span>
              </div>
            )}
            {isLow && !isCritical && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>رصيدك منخفض. يُنصح بشراء كريدت إضافي.</span>
              </div>
            )}

            {/* تكلفة العمليات */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">تكلفة الميزات</p>
              <div className="space-y-1.5">
                {CREDIT_COSTS_LABELS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className={`font-semibold ${balance >= item.cost ? "text-emerald-600" : "text-red-500"}`}>
                      {item.cost} كريدت
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* زر شراء كريدت */}
            {balanceData.upgradeUrl && (
              <a
                href={balanceData.upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                <Coins className="w-4 h-4" />
                شراء كريدت إضافي
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <p className="text-xs text-center text-gray-400">
              الرصيد من منصة{" "}
              <a
                href="https://www.mousa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline"
              >
                mousa.ai
              </a>
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}

/**
 * Hook لاستخدام نظام الكريدت في أي مكوّن
 */
export function useMousaCredit() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: balanceData } = trpc.mousa.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const deductMutation = trpc.mousa.deductCredits.useMutation({
    onSuccess: () => {
      utils.mousa.getBalance.invalidate();
    },
  });

  const deduct = async (
    operation: "analyzePhoto" | "generateIdeas" | "applyStyle" | "refineDesign" | "generate3D" | "generatePlanDesign" | "generatePDF" | "voiceDesign",
    description?: string
  ) => {
    if (!isAuthenticated) return { success: true };
    if (!balanceData?.requiresMousa) return { success: true };
    return deductMutation.mutateAsync({ operation, description });
  };

  const canAfford = (
    operation: "analyzePhoto" | "generateIdeas" | "applyStyle" | "refineDesign" | "generate3D" | "generatePlanDesign" | "generatePDF" | "voiceDesign"
  ) => {
    if (!balanceData?.requiresMousa) return true;
    const balance = balanceData.balance ?? 0;
    const costs: Record<string, number> = {
      analyzePhoto: 20, generateIdeas: 20, applyStyle: 15,
      refineDesign: 15, generate3D: 25, generatePlanDesign: 20,
      generatePDF: 5, voiceDesign: 20,
    };
    return balance >= (costs[operation] ?? 0);
  };

  return {
    balance: balanceData?.balance ?? null,
    requiresMousa: balanceData?.requiresMousa ?? false,
    upgradeUrl: balanceData?.upgradeUrl ?? null,
    deduct,
    canAfford,
    isDeducting: deductMutation.isPending,
  };
}
