import { useState } from "react";
import { useAuth as useMousaAuth } from "@/components/AuthGate";
import { Coins, RefreshCw } from "lucide-react";
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

// ✅ وضع مجاني بالكامل — نظام الكريدت موقف مؤقتاً
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 ${className}`}
            dir="rtl"
          >
            <Coins className="w-4 h-4" />
            <span>مجاني</span>
            {showLabel && <span className="text-xs opacity-70">✨</span>}
            <RefreshCw className={`w-3 h-3 opacity-50 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <p>جميع الخدمات مجانية مؤقتاً 🎉</p>
          {user?.name && <p className="text-xs opacity-70">مرحباً {user.name}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook لاستخدام نظام الكريدت — وضع مجاني بالكامل
 */
export function useMousaCredit() {
  const { user, deductCredits } = useMousaAuth();

  const deduct = async (_operation: string, _description?: string) => {
    // ✅ وضع مجاني — لا خصم
    return deductCredits(0, _description);
  };

  const canAfford = (_operation: string) => {
    // ✅ وضع مجاني — كل العمليات مسموحة
    return true;
  };

  return {
    balance: 999999,
    requiresMousa: false,
    upgradeUrl: "https://www.mousa.ai/pricing",
    deduct,
    canAfford,
    isDeducting: false,
    isFreeMode: true,
  };
}
