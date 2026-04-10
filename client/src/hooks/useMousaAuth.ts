import { useState, useEffect } from "react";
import { loadGuestDesignsForMigration, clearGuestDesignsAfterMigration } from "./guestDesignsMigration";

const THIS_PLATFORM = "fada";

// FIX FADA-001: mousa.ai يضبط cookie باسم app_session_id على domain .mousa.ai
const SHARED_COOKIE = "app_session_id";

export interface MousaUser {
  userId: number;
  openId: string;
  name: string;
  email: string;
  creditBalance: number;
  platform: string;
  isFreeMode?: boolean; // true = مستخدم غير مرتبط بـ mousa.ai
}

interface AuthState {
  user: MousaUser | null;
  loading: boolean;
  token: string | null;
}

// المستخدم الزائر — بدون حساب mousa.ai
function buildGuestUser(): MousaUser {
  return {
    userId: 0,
    openId: "guest",
    name: "زائر",
    email: "",
    creditBalance: 0,
    platform: "fada",
    isFreeMode: true,
  };
}

/**
 * ⚡ قراءة بيانات المستخدم من JWT cookie مباشرة (بدون API call)
 *
 * الـ JWT يحتوي على: openId, name, mousaUserId, creditBalance, email
 * هذا يحل مشكلة Nginx على fada.mousa.ai الذي لا يُوجّه /api/* لـ Express
 */
function parseJWTCookie(cookieValue: string): {
  openId?: string;
  name?: string;
  mousaUserId?: number;
  creditBalance?: number;
  email?: string;
} | null {
  try {
    // JWT = header.payload.signature — نحتاج الـ payload فقط
    const parts = cookieValue.split(".");
    if (parts.length !== 3) return null;
    // Base64URL decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    // التحقق من انتهاء الصلاحية
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // منتهي الصلاحية
    }
    return {
      openId: typeof payload.openId === "string" ? payload.openId : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      mousaUserId: typeof payload.mousaUserId === "number" ? payload.mousaUserId : undefined,
      creditBalance: typeof payload.creditBalance === "number" ? payload.creditBalance : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
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
      const urlParams = new URLSearchParams(window.location.search);
      const mousaToken = urlParams.get("token");

      if (mousaToken) {
        // محاولة verify كامل (مستخدم جديد أو جلسة منتهية)
        let ssoUser: MousaUser | null = null;
        try {
          ssoUser = await verifyViaSSOEndpoint(mousaToken);
        } catch {
          // خطأ شبكة — نتجاوز
        }

        if (ssoUser) {
          // تسجيل دخول ناجح
          urlParams.delete("token");
          const cleanSearch = urlParams.toString();
          const cleanUrl = window.location.pathname + (cleanSearch ? "?" + cleanSearch : "");
          window.history.replaceState({}, "", cleanUrl);
          setState({ user: ssoUser, loading: false, token: mousaToken });
          migrateGuestDesignsOnLogin();
          return;
        } else {
          // فشل verify — نحاول relink للمستخدمين الذين لديهم جلسة محلية قديمة
          try {
            const relinkRes = await fetch("/api/sso/relink", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: mousaToken }),
            });
            if (relinkRes.ok) {
              const relinkData = await relinkRes.json() as { success: boolean; userId?: number; creditBalance?: number };
              if (relinkData.success) {
                console.log("[Auth] ✅ Relinked account with mousa.ai, userId=", relinkData.userId);
                // قراءة الجلسة المحدّثة من الـ cookie الجديد
                await new Promise(r => setTimeout(r, 200)); // انتظار ضبط الـ cookie
                const updatedUser = readUserFromCookie() || await verifyViaServer();
                if (updatedUser) {
                  urlParams.delete("token");
                  const cleanUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
                  window.history.replaceState({}, "", cleanUrl);
                  setState({ user: updatedUser, loading: false, token: mousaToken });
                  migrateGuestDesignsOnLogin();
                  return;
                }
              }
            }
          } catch {
            // فشل relink — نكمل بالطرق الأخرى
          }
        }
      }

      // ===== المسار 2: قراءة بيانات المستخدم من JWT cookie مباشرة =====
      // ⚡ هذا يعمل حتى لو Nginx لا يُوجّه /api/* لـ Express
      const sessionCookie = getCookie(SHARED_COOKIE);
      if (sessionCookie) {
        const jwtData = parseJWTCookie(sessionCookie);
        if (jwtData?.openId && jwtData.openId !== "guest") {
          const userFromCookie: MousaUser = {
            userId: jwtData.mousaUserId ?? 0,
            openId: jwtData.openId,
            name: jwtData.name ?? "مستخدم",
            email: jwtData.email ?? "",
            creditBalance: jwtData.creditBalance ?? 0,
            platform: THIS_PLATFORM,
            isFreeMode: !jwtData.mousaUserId,
          };
          console.log(`[Auth] ✅ Loaded user from JWT cookie: ${jwtData.openId}, balance=${jwtData.creditBalance}, mousaUserId=${jwtData.mousaUserId}`);
          setState({ user: userFromCookie, loading: false, token: sessionCookie });

          // في الخلفية: محاولة تحديث الرصيد من السيرفر (إذا كان متاحاً)
          refreshBalanceInBackground(userFromCookie);
          return;
        }
      }

      // ===== المسار 3: جلسة محلية عبر /api/sso/status (fallback) =====
      try {
        const user = await verifyViaServer();
        if (user) {
          setState({ user, loading: false, token: sessionCookie });
          return;
        }
      } catch {
        // السيرفر لم يتعرف على الجلسة
      }

      // ===== المسار 4: زائر بدون حساب =====
      setState({ user: buildGuestUser(), loading: false, token: null });
    } catch {
      setState({ user: buildGuestUser(), loading: false, token: null });
    }
  }

  /**
   * قراءة بيانات المستخدم من الـ cookie الحالي
   */
  function readUserFromCookie(): MousaUser | null {
    const sessionCookie = getCookie(SHARED_COOKIE);
    if (!sessionCookie) return null;
    const jwtData = parseJWTCookie(sessionCookie);
    if (!jwtData?.openId || jwtData.openId === "guest") return null;
    return {
      userId: jwtData.mousaUserId ?? 0,
      openId: jwtData.openId,
      name: jwtData.name ?? "مستخدم",
      email: jwtData.email ?? "",
      creditBalance: jwtData.creditBalance ?? 0,
      platform: THIS_PLATFORM,
      isFreeMode: !jwtData.mousaUserId,
    };
  }

  /**
   * تحديث الرصيد في الخلفية من السيرفر (بدون انتظار)
   */
  async function refreshBalanceInBackground(currentUser: MousaUser) {
    if (!currentUser.userId || currentUser.isFreeMode) return;
    try {
      // محاولة /api/sso/status أولاً
      const statusRes = await fetch("/api/sso/status", {
        credentials: "include",
        signal: AbortSignal.timeout(5000), // timeout 5 ثوانٍ
      });
      if (statusRes.ok) {
        const contentType = statusRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const statusData = await statusRes.json() as {
            authenticated: boolean;
            user?: { mousaBalance?: number | null; mousaUserId?: number | null };
          };
          if (statusData.authenticated && statusData.user?.mousaBalance !== null && statusData.user?.mousaBalance !== undefined) {
            const newBalance = statusData.user.mousaBalance;
            setState(prev => ({
              ...prev,
              user: prev.user ? { ...prev.user, creditBalance: newBalance } : prev.user,
            }));
            console.log(`[Auth] ✅ Background balance refresh: ${newBalance}`);
            return;
          }
        }
      }
    } catch {
      // السيرفر غير متاح — نبقى على بيانات الـ JWT
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
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null; // HTML response = Nginx issue
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
      const statusRes = await fetch("/api/sso/status", {
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      });
      if (statusRes.ok) {
        const contentType = statusRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
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
      }

      // ثانياً: fallback عبر mousa.getBalance
      const response = await fetch("/api/trpc/mousa.getBalance?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
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
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * خصم الكريدت الفعلي عبر tRPC → mousa.deductCredits
   * يُستدعى بعد نجاح كل عملية AI
   */
  async function deductCredits(amount: number, description?: string): Promise<{ newBalance: number }> {
    if (!state.user || state.user.isFreeMode || state.user.userId === 0) {
      // مستخدم غير مرتبط — لا خصم
      return { newBalance: state.user?.creditBalance ?? 0 };
    }

    try {
      // تحديد العملية من الوصف
      const operationMap: Record<string, string> = {
        "تحليل صورة": "analyzePhoto",
        "تحليل + توليد": "analyzeAndGenerate",
        "توليد صورة": "generateVisualization",
        "توليد أفكار": "generateIdeas",
        "إعادة تحليل": "reAnalyze",
        "تغيير نمط": "applyStyle",
        "تحسين التصميم": "refineDesign",
        "تصميم صوتي": "voiceDesign",
        "رندر 3D مسقط": "generateFloorPlan3D",
        "رندر 3D": "generate3D",
        "بيانات تصميم": "generatePlanDesign",
        "تصدير PDF": "generatePDF",
      };

      let operation = "analyzePhoto";
      if (description) {
        for (const [key, val] of Object.entries(operationMap)) {
          if (description.includes(key)) {
            operation = val;
            break;
          }
        }
      }

      const response = await fetch("/api/trpc/mousa.deductCredits?batch=1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "0": {
            json: { operation, description: description ?? operation }
          }
        }),
      });

      if (!response.ok) {
        return { newBalance: state.user.creditBalance };
      }

      const data = await response.json() as any;
      const result = data?.[0]?.result?.data?.json;

      if (result?.success && result.newBalance !== null) {
        // تحديث الرصيد المحلي
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, creditBalance: result.newBalance } : prev.user,
        }));
        return { newBalance: result.newBalance };
      }

      return { newBalance: state.user.creditBalance };
    } catch {
      return { newBalance: state.user?.creditBalance ?? 0 };
    }
  }

  /**
   * تحديث الرصيد من mousa.ai
   */
  async function refreshBalance(): Promise<number> {
    if (!state.user || state.user.isFreeMode || state.user.userId === 0) {
      return state.user?.creditBalance ?? 0;
    }

    try {
      const response = await fetch("/api/trpc/mousa.getBalance?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) return state.user.creditBalance;

      const data = await response.json() as any;
      const result = data?.[0]?.result?.data?.json;

      if (result?.balance !== null && result?.balance !== undefined) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, creditBalance: result.balance } : prev.user,
        }));
        return result.balance;
      }

      return state.user.creditBalance;
    } catch {
      return state.user?.creditBalance ?? 0;
    }
  }

  function logout() {
    deleteCookie(SHARED_COOKIE);
    setState({ user: buildGuestUser(), loading: false, token: null });
  }

  /**
   * نقل تصاميم الزائر للحساب عند تسجيل الدخول
   * يعمل في الخلفية بدون إزعاج المستخدم
   */
  function migrateGuestDesignsOnLogin() {
    const designs = loadGuestDesignsForMigration();
    if (designs.length === 0) return;

    // إرسال التصاميم للسيرفر لحفظها في الحساب
    fetch("/api/trpc/designs.migrateGuestDesigns?batch=1", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "0": {
          json: { designs }
        }
      }),
    })
    .then(res => {
      if (res.ok) {
        clearGuestDesignsAfterMigration();
        console.log(`[GuestMigration] ✅ Migrated ${designs.length} guest designs to account`);
      }
    })
    .catch(err => {
      console.warn("[GuestMigration] Failed to migrate guest designs:", err);
    });
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
