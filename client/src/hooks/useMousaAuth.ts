import { useState, useEffect } from "react";

const MOUSA_API_URL = "https://www.mousa.ai";
const THIS_PLATFORM = "fada";
const PLATFORM_API_KEY = "USAA";

// FIX FADA-001: mousa.ai يضبط cookie باسم app_session_id على domain .mousa.ai
// fada.mousa.ai هو subdomain → يستقبل هذا الـ cookie تلقائياً
// كان خطأً سابقاً: 'mousa_session' (غير موجود) → user = GUEST_USER → canAfford = false → BLOCKED
const SHARED_COOKIE = "app_session_id";

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
      // قراءة الـ shared session cookie من .mousa.ai (app_session_id)
      const sessionCookie = getCookie(SHARED_COOKIE);

      if (sessionCookie) {
        try {
          const user = await verifySession(sessionCookie);
          setState({ user, loading: false, token: sessionCookie });
          return;
        } catch {
          // إذا فشل verify-session، نحاول trpc.auth.me كـ fallback
          // (يعمل لأن السيرفر يقرأ app_session_id مباشرة)
          try {
            const user = await verifyViaServer();
            if (user) {
              setState({ user, loading: false, token: sessionCookie });
              return;
            }
          } catch {
            // fallback فشل أيضاً
          }
        }
      } else {
        // لا يوجد app_session_id — قد يكون المستخدم مسجّلاً عبر Manus OAuth
        // نحاول السيرفر مباشرة
        try {
          const user = await verifyViaServer();
          if (user) {
            setState({ user, loading: false, token: null });
            return;
          }
        } catch {
          // لا يوجد جلسة
        }
      }

      // لا يوجد cookie ولا جلسة — يدخل كزائر بدون قيود
      setState({ user: GUEST_USER, loading: false, token: null });
    } catch {
      setState({ user: GUEST_USER, loading: false, token: null });
    }
  }

  // FIX FADA-001: استخدام السيرفر كـ fallback لجلب بيانات المستخدم
  // السيرفر يقرأ app_session_id مباشرة من cookie header
  async function verifyViaServer(): Promise<MousaUser | null> {
    try {
      // استخدام /api/trpc/mousa.getBalance للتحقق من الجلسة والرصيد
      const response = await fetch("/api/trpc/mousa.getBalance?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const result = data?.[0]?.result?.data?.json;
      if (result && result.requiresMousa && result.balance !== null) {
        // المستخدم مسجّل من mousa.ai
        // نجلب بيانات المستخدم من trpc.auth.me
        const meResponse = await fetch("/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          const me = meData?.[0]?.result?.data?.json;
          if (me) {
            return {
              userId: me.mousaUserId ?? 0,
              openId: me.openId ?? "unknown",
              name: me.name ?? "مستخدم",
              email: me.email ?? "",
              creditBalance: result.balance ?? 0,
              platform: "fada",
            };
          }
        }
        // إذا لم نجد بيانات المستخدم، نُنشئ مستخدماً مؤقتاً بالرصيد الصحيح
        return {
          userId: 1, // موجود في mousa.ai
          openId: "mousa_user",
          name: "مستخدم",
          email: "",
          creditBalance: result.balance ?? 0,
          platform: "fada",
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

    if (!response.ok) {
      throw new Error("فشل التحقق من الجلسة");
    }

    const data = await response.json();
    if (!data.authenticated) {
      throw new Error("الجلسة غير صالحة");
    }
    return {
      userId: data.userId,
      openId: data.openId,
      name: data.name,
      email: data.email,
      creditBalance: data.creditBalance,
      platform: data.platform ?? THIS_PLATFORM,
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
    if (!state.user || state.user.openId === "guest") return 0;
    try {
      // محاولة تحديث الرصيد عبر السيرفر أولاً
      const serverUser = await verifyViaServer();
      if (serverUser) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, creditBalance: serverUser.creditBalance } : null,
        }));
        return serverUser.creditBalance;
      }
      // fallback: verify-session
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
