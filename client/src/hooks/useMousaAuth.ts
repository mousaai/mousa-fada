import { useState, useEffect } from "react";

const MOUSA_API_URL = "https://www.mousa.ai";
const THIS_PLATFORM = "fada";
const PLATFORM_API_KEY = "USAA";

// اسم الـ shared cookie الذي يضبطه mousa.ai على .mousa.ai
const SHARED_COOKIE = "mousa_session";

export interface MousaUser {
  userId: number;
  openId: string;
  name: string;
  email: string;
  creditBalance: number;
  platform: string;
}

interface AuthState {
  user: MousaUser | null;
  loading: boolean;
  token: string | null;
}

const GUEST_USER: MousaUser = {
  userId: 0,
  openId: "guest",
  name: "زائر",
  email: "",
  creditBalance: 0,
  platform: "fada",
};

export function useMousaAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    token: null,
  });

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      // قراءة الـ shared session cookie من .mousa.ai
      const sessionCookie = getCookie(SHARED_COOKIE);

      if (sessionCookie) {
        try {
          const user = await verifySession(sessionCookie);
          setState({ user, loading: false, token: sessionCookie });
          return;
        } catch {
          // إذا فشل التحقق، يدخل كزائر
        }
      }

      // لا يوجد cookie — يدخل كزائر بدون قيود
      setState({ user: GUEST_USER, loading: false, token: null });
    } catch {
      setState({ user: GUEST_USER, loading: false, token: null });
    }
  }

  async function verifySession(session: string): Promise<MousaUser> {
    const response = await fetch(`${MOUSA_API_URL}/api/platform/verify-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PLATFORM_API_KEY}`,
        "X-Platform-ID": THIS_PLATFORM,
      },
      body: JSON.stringify({ session }),
    });

    if (!response.ok) {
      throw new Error("فشل التحقق من الجلسة");
    }

    const data = await response.json();
    return {
      userId: data.userId,
      openId: data.openId,
      name: data.name,
      email: data.email,
      creditBalance: data.creditBalance,
      platform: data.platform,
    };
  }

  async function deductCredits(amount: number, description?: string): Promise<{ newBalance: number }> {
    if (!state.user || state.user.openId === "guest") throw new Error("المستخدم غير مسجّل الدخول");

    const response = await fetch(`${MOUSA_API_URL}/api/platform/deduct-credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PLATFORM_API_KEY}`,
        "X-Platform-ID": THIS_PLATFORM,
      },
      body: JSON.stringify({
        userId: state.user.userId,
        amount,
        description: description || `استخدام منصة ${THIS_PLATFORM}`,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "فشل خصم الكريدت");
    }

    const data = await response.json();
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, creditBalance: data.newBalance } : null,
    }));

    return { newBalance: data.newBalance };
  }

  async function refreshBalance(): Promise<number> {
    if (!state.user || !state.token || state.user.openId === "guest") return 0;
    try {
      const user = await verifySession(state.token);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, creditBalance: user.creditBalance } : null,
      }));
      return user.creditBalance;
    } catch {
      return state.user?.creditBalance ?? 0;
    }
  }

  function logout() {
    // حذف الـ cookie المحلي فقط — mousa.ai يتحكم في الـ shared cookie
    deleteCookie(SHARED_COOKIE);
    setState({ user: GUEST_USER, loading: false, token: null });
  }

  return { ...state, deductCredits, refreshBalance, logout };
}

// ===== Cookie Helpers =====

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.mousa.ai`;
}
