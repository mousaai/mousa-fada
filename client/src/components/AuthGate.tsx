import React, { createContext, useContext } from "react";

export interface MousaUser {
  userId: number;
  openId: string;
  name: string;
  email: string;
  creditBalance: number;
  platform: string;
}

interface AuthContextType {
  user: MousaUser;
  deductCredits: (amount: number, description?: string) => Promise<{ newBalance: number }>;
  refreshBalance: () => Promise<number>;
  logout: () => void;
}

// مستخدم افتراضي — المنصة مفتوحة للجميع بدون تحقق
const GUEST_USER: MousaUser = {
  userId: 0,
  openId: "guest",
  name: "زائر",
  email: "",
  creditBalance: 9999,
  platform: "fada",
};

const AuthContext = createContext<AuthContextType>({
  user: GUEST_USER,
  deductCredits: async () => ({ newBalance: 9999 }),
  refreshBalance: async () => 9999,
  logout: () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // المنصة مفتوحة مباشرة — لا يوجد أي حاجز أو شاشة تحقق
  return (
    <AuthContext.Provider
      value={{
        user: GUEST_USER,
        deductCredits: async () => ({ newBalance: 9999 }),
        refreshBalance: async () => 9999,
        logout: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
