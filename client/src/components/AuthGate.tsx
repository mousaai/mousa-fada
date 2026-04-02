import React, { createContext, useContext } from "react";
import { useMousaAuth, type MousaUser } from "../hooks/useMousaAuth";

export type { MousaUser };

interface AuthContextType {
  user: MousaUser;
  deductCredits: (amount: number, description?: string) => Promise<{ newBalance: number }>;
  refreshBalance: () => Promise<number>;
  logout: () => void;
}

const GUEST_USER: MousaUser = {
  userId: 0,
  openId: "guest",
  name: "زائر",
  email: "",
  creditBalance: 0,
  platform: "fada",
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

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, deductCredits, refreshBalance, logout } = useMousaAuth();

  // شاشة التحميل أثناء التحقق من الهوية
  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f0e8",
        fontFamily: "system-ui, sans-serif",
        direction: "rtl",
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "4px solid #c9a96e",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
          marginBottom: 20,
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#8a7560", fontSize: 16, margin: 0 }}>جاري التحقق من هويتك...</p>
      </div>
    );
  }

  // شاشة الخطأ — إعادة التوجيه لـ mousa.ai
  if (error || !user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f0e8",
        fontFamily: "system-ui, sans-serif",
        direction: "rtl",
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ color: "#3d2b1f", fontSize: 22, marginBottom: 8 }}>يجب الدخول عبر موسى</h2>
        <p style={{ color: "#8a7560", fontSize: 15, marginBottom: 24, maxWidth: 320 }}>
          للوصول إلى منصة فضاء، يرجى الدخول من خلال حسابك على موسى
        </p>
        <a
          href="https://www.mousa.ai/?ref=fada"
          style={{
            background: "#c9a96e",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: 12,
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          الذهاب إلى موسى
        </a>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, deductCredits, refreshBalance, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
