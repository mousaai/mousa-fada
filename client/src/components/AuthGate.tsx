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
  const { user, loading, deductCredits, refreshBalance, logout } = useMousaAuth();

  // شاشة تحميل قصيرة فقط
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
        <p style={{ color: "#8a7560", fontSize: 16, margin: 0 }}>جاري التحميل...</p>
      </div>
    );
  }

  const activeUser = user ?? GUEST_USER;

  return (
    <AuthContext.Provider value={{ user: activeUser, deductCredits, refreshBalance, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
