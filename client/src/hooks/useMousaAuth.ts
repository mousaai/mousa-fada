import { useState, useEffect } from "react";

const MOUSA_API_URL = "https://www.mousa.ai";
const THIS_PLATFORM = "fada";
const PLATFORM_API_KEY = "USAA";

// FIX FADA-001: mousa.ai يضبط cookie باسم app_session_id على domain .mousa.ai
const SHARED_COOKIE = "app_session_id";

// الكريدت المجاني الممنوح عند تعذّر التحقق من mousa.ai
export const FREE_CREDITS = 200;
// مفتاح localStorage لتتبع الكريدت المجاني المستهلك
const FREE_CREDITS_KEY = "fada_free_credits_used";

export interface MousaUser {
  userId: number;
  openId: string;
  name: string;
  email: string;
  creditBalance: number;
  platform: string;
  isFreeMode?: boolean; // true = يستخدم الـ 200 نقطة المجانية
}

interface AuthState {
  user: MousaUser | null;
  loading: boolean;
  token: string | null;
}

// المستخدم المجاني: يحصل على 200 نقطة مجانية لحين ربط حسابه
function buildFreeUser(): MousaUser {
  const used = getFreeCreditsUsed();
  const remaining = Math.max(0, FREE_CREDITS - used);
  return {
    userId: 0,
    openId: "free",
    name: "مستخدم مجاني",
    email: "",
    creditBalance: remaining,
    platform: "fada",
    isFreeMode: true,
  };
}

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
      // ===== المسار 1: ?token= في URL من mousa.ai =====
      // عندما يضغط المستخدم على بطاقة fada في mousa.ai
      const urlParams = new URLSearchParams(window.location.search);
      const mousaToken = urlParams.get("token");

      if (mousaToken) {
        try {
          const user = await verifyViaSSOEndpoint(mousaToken);
          if (user) {
            // إزالة الـ token من URL بدون reload
            urlParams.delete("token");
            const cleanSearch = urlParams.toString();
            const cleanUrl = window.location.pathname + (cleanSearch ? "?" + cleanSearch : "");
            window.history.replaceState({}, "", cleanUrl);
            setState({ user, loading: false, token: mousaToken });
            return;
          }
        } catch {
          // فشل SSO — نكمل بالطرق الأخرى
        }
      }

      // ===== المسار 2: cookie app_session_id من .mousa.ai =====
      const sessionCookie = getCookie(SHARED_COOKIE);

      if (sessionCookie) {
        try {
          const user = await verifySession(sessionCookie);
          setState({ user, loading: false, token: sessionCookie });
          return;
        } catch {
          // فشل verify-session — نحاول السيرفر كـ fallback
        }
      }

      // ===== المسار 3: جلسة محلية عبر /api/sso/status =====
      try {
        const user = await verifyViaServer();
        if (user) {
          setState({ user, loading: false, token: sessionCookie });
          return;
        }
      } catch {
        // السيرفر لم يتعرف على الجلسة
      }

      // ===== المسار 4: زائر مجاني — لا قيود على الدخول =====
      setState({ user: buildFreeUser(), loading: false, token: null });
    } catch {
      setState({ user: buildFreeUser(), loading: false, token: null });
    }
  }

  /**
   * إرسال token لـ /api/sso/verify لإنشاء جلسة محلية تلقائياً
   */
  async function verifyViaSSOEndpoint(token: string): Promise<MousaUser | null> {
    const response = await fetch("/api/sso/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) return null;
    const data = await response.json() as {
      success: boolean;
      user?: {
        openId: string;
        name: string;
        email: string;
        creditBalance: number;
        userId: number;
      };
    };
    if (!data.success || !data.user) return null;
    return {
      userId: data.user.userId,
      openId: data.user.openId,
      name: data.user.name,
      email: data.user.email,
      creditBalance: data.user.creditBalance,
      platform: "fada",
      isFreeMode: false,
    };
  }

  // التحقق عبر /api/sso/status (جلسة محلية) أو mousa.getBalance (fallback)
  async function verifyViaServer(): Promise<MousaUser | null> {
    try {
      // أولاً: /api/sso/status — أسرع وأدق
      const statusRes = await fetch("/api/sso/status", { credentials: "include" });
      if (statusRes.ok) {
        const statusData = await statusRes.json() as {
          authenticated: boolean;
          user?: {
            openId: string;
            name: string | null;
            email: string | null;
            mousaUserId: number | null;
            mousaBalance: number | null;
          };
        };
        if (statusData.authenticated && statusData.user) {
          const u = statusData.user;
          return {
            userId: u.mousaUserId ?? 0,
            openId: u.openId,
            name: u.name ?? "مستخدم",
            email: u.email ?? "",
            creditBalance: u.mousaBalance ?? 0,
            platform: "fada",
            isFreeMode: !u.mousaUserId,
          };
        }
      }

      // ثانياً: fallback عبر mousa.getBalance
      const response = await fetch("/api/trpc/mousa.getBalance?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      const result = data?.[0]?.result?.data?.json;
      if (result && result.requiresMousa && result.balance !== null) {
        const meResponse = await fetch("/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (meResponse.ok) {
          const meData = await meResponse.json() as any;
          const me = meData?.[0]?.result?.data?.json;
          if (me) {
            return {
              userId: me.mousaUserId ?? 0,
              openId: me.openId ?? "unknown",
              name: me.name ?? "مستخدم",
              email: me.email ?? "",
              creditBalance: result.balance ?? 0,
              platform: "fada",
              isFreeMode: false,
            };
          }
        }
        return {
          userId: 1,
          openId: "mousa_user",
          name: "مستخدم",
          email: "",
          creditBalance: result.balance ?? 0,
          platform: "fada",
          isFreeMode: false,
        };
      }
      return null;
    } catch {
      return null;
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

    if (!response.ok) throw new Error("فشل التحقق من الجلسة");

    const data = await response.json();
    if (!data.authenticated) throw new Error("الجلسة غير صالحة");

    return {
      userId: data.userId,
      openId: data.openId,
      name: data.name,
      email: data.email,
      creditBalance: data.creditBalance,
      platform: data.platform ?? THIS_PLATFORM,
      isFreeMode: false,
    };
  }

  async function deductCredits(amount: number, description?: string): Promise<{ newBalance: number }> {
    if (!state.user) throw new Error("المستخدم غير مسجّل");

    // المستخدم في الوضع المجاني — خصم من الـ 200 نقطة المحلية
    if (state.user.isFreeMode) {
      const used = getFreeCreditsUsed() + amount;
      setFreeCreditsUsed(used);
      const remaining = Math.max(0, FREE_CREDITS - used);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, creditBalance: remaining } : null,
      }));
      return { newBalance: remaining };
    }

    // المستخدم المسجّل — خصم عبر mousa.ai API
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
      throw new Error((data as any).error || "فشل خصم الكريدت");
    }

    const data = await response.json();
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, creditBalance: (data as any).newBalance } : null,
    }));

    return { newBalance: (data as any).newBalance };
  }

  async function refreshBalance(): Promise<number> {
    if (!state.user) return 0;

    // الوضع المجاني — الرصيد محلي
    if (state.user.isFreeMode) {
      const remaining = Math.max(0, FREE_CREDITS - getFreeCreditsUsed());
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, creditBalance: remaining } : null,
      }));
      return remaining;
    }

    try {
      const serverUser = await verifyViaServer();
      if (serverUser) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, creditBalance: serverUser.creditBalance } : null,
        }));
        return serverUser.creditBalance;
      }
      if (state.token) {
        const user = await verifySession(state.token);
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, creditBalance: user.creditBalance } : null,
        }));
        return user.creditBalance;
      }
    } catch {
      // تجاهل الخطأ
    }
    return state.user?.creditBalance ?? 0;
  }

  function logout() {
    deleteCookie(SHARED_COOKIE);
    setState({ user: buildFreeUser(), loading: false, token: null });
  }

  return { ...state, deductCredits, refreshBalance, logout };
}

// ===== Free Credits Helpers (localStorage) =====

function getFreeCreditsUsed(): number {
  try {
    return parseInt(localStorage.getItem(FREE_CREDITS_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function setFreeCreditsUsed(amount: number) {
  try {
    localStorage.setItem(FREE_CREDITS_KEY, String(amount));
  } catch {
    // تجاهل
  }
}

// ===== Cookie Helpers =====

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.mousa.ai`;
}
