import React, { createContext, useContext } from "react";
import { useMousaAuth, MousaUser } from "@/hooks/useMousaAuth";

interface AuthContextType {
  user: MousaUser;
  deductCredits: (amount: number, description?: string) => Promise<{ newBalance: number }>;
  refreshBalance: () => Promise<number>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthGate");
  return ctx;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, deductCredits, refreshBalance, logout } = useMousaAuth();

  if (loading) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          background: "#080E1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "3px solid #D4A017",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: "#D4A017", fontWeight: 700, fontSize: "1.2rem" }}>م. سارة</div>
        <div style={{ color: "#8A9BB0", fontSize: "0.9rem" }}>جاري التحقق من هويتك...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          background: "#080E1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <div style={{ fontSize: "3rem" }}>🔐</div>
        <div style={{ color: "#D4A017", fontWeight: 700, fontSize: "1.2rem" }}>م. سارة</div>
        <div style={{ color: "#E8E0D0" }}>{error || "يجب الدخول عبر mousa.ai"}</div>
        <div style={{ color: "#8A9BB0", fontSize: "0.85rem" }}>جاري إعادة التوجيه...</div>
        <a
          href="https://www.mousa.ai"
          style={{
            padding: "10px 24px",
            background: "#D4A017",
            color: "#080E1A",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          الذهاب لـ mousa.ai
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
