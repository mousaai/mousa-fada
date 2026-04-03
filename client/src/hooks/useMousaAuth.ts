import { useState, useEffect } from "react";

const MOUSA_API_URL = "https://www.mousa.ai";
const STORAGE_KEY = "mousa_user_session";
const TOKEN_KEY = "mousa_auth_token";
const THIS_PLATFORM = "fada";
const PLATFORM_API_KEY = "USAA";

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
  error: string | null;
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
    error: null,
    token: null,
  });

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      // أولاً: تحقق من جلسة محفوظة
      const savedSession = loadSavedSession();
      if (savedSession) {
        setState({ user: savedSession.user, loading: false, error: null, token: savedSession.token });
        refreshBalanceInBackground(savedSession.token, savedSession.user);
        return;
      }

      // ثانياً: تحقق من token في الـ URL (قادم من mousa.ai)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        try {
          const user = await verifyToken(token);
          saveSession(token, user);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
          setState({ user, loading: false, error: null, token });
          return;
        } catch {
          // إذا فشل التحقق من الـ token، اعمل كزائر
        }
      }

      // ثالثاً: بدون token — يدخل كزائر بدون قيود
      setState({ user: GUEST_USER, loading: false, error: null, token: null });
    } catch {
      // في حالة أي خطأ، يدخل كزائر
      setState({ user: GUEST_USER, loading: false, error: null, token: null });
    }
  }

  async function verifyToken(token: string): Promise<MousaUser> {
    const response = await fetch(`${MOUSA_API_URL}/api/platform/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PLATFORM_API_KEY}`,
        "X-Platform-ID": THIS_PLATFORM,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.code === "TOKEN_EXPIRED") throw new Error("TOKEN_EXPIRED");
      throw new Error(data.error || "فشل التحقق من الهوية");
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

    if (state.token && state.user) {
      saveSession(state.token, { ...state.user, creditBalance: data.newBalance });
    }

    return { newBalance: data.newBalance };
  }

  async function refreshBalance(): Promise<number> {
    if (!state.user || !state.token || state.user.openId === "guest") return 0;
    try {
      const user = await verifyToken(state.token);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, creditBalance: user.creditBalance } : null,
      }));
      return user.creditBalance;
    } catch {
      return state.user?.creditBalance ?? 0;
    }
  }

  async function refreshBalanceInBackground(token: string, currentUser: MousaUser) {
    try {
      const user = await verifyToken(token);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, creditBalance: user.creditBalance } : null,
      }));
      saveSession(token, { ...currentUser, creditBalance: user.creditBalance });
    } catch {}
  }

  function logout() {
    clearSession();
    setState({ user: GUEST_USER, loading: false, error: null, token: null });
  }

  return { ...state, deductCredits, refreshBalance, logout };
}

function saveSession(token: string, user: MousaUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, savedAt: Date.now() }));
  } catch {}
}

function loadSavedSession(): { token: string; user: MousaUser } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const sessionStr = localStorage.getItem(STORAGE_KEY);
    if (!token || !sessionStr) return null;

    const session = JSON.parse(sessionStr);
    // الجلسة صالحة لمدة 23 ساعة
    if (Date.now() - session.savedAt > 23 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }

    return { token, user: session.user };
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
