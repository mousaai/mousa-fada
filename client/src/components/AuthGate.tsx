import React, { createContext, useContext } from "react";
import { useMousaAuth, type MousaUser, FREE_CREDITS } from "../hooks/useMousaAuth";

export type { MousaUser };

interface AuthContextType {
  user: MousaUser;
  deductCredits: (amount: number, description?: string) => Promise<{ newBalance: number }>;
  refreshBalance: () => Promise<number>;
  logout: () => void;
}

const GUEST_USER: MousaUser = {
  userId: 0,
  openId: "free",
  name: "مستخدم مجاني",
  email: "",
  creditBalance: FREE_CREDITS,
  platform: "fada",
  isFreeMode: true,
};

const AuthContext = createContext<AuthContextType>({
  user: GUEST_USER,
  deductCredits: async () => ({ newBalance: 0 }),
  refreshBalance: async () => 0,
  logout: () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

/**
 * AuthGate — بوابة المصادقة
 * 
 * المبدأ: المنصة مفتوحة للجميع بدون قفل أو redirect إجباري.
 * - الزوار يحصلون على 200 نقطة مجانية تلقائياً
 * - المستخدمون من mousa.ai يُربطون تلقائياً عبر ?token= في URL
 * - لا توجد شاشة قفل أو إجبار على تسجيل الدخول
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, deductCredits, refreshBalance, logout } = useMousaAuth();

  // شاشة تحميل بسيطة وسريعة — بدون أي redirect أو قفل
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f0e8",
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #c9a96e",
          borderTopColor: "transparent",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // دائماً يعرض المحتوى — إما بمستخدم حقيقي أو مستخدم مجاني
  const activeUser = user ?? GUEST_USER;

  return (
    <AuthContext.Provider value={{ user: activeUser, deductCredits, refreshBalance, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
