/**
 * sso.ts — نظام الدخول الموحد (SSO) مع mousa.ai
 *
 * التدفق:
 * 1. المستخدم يضغط على بطاقة fada في mousa.ai
 * 2. mousa.ai يوجّهه إلى: fada.mousa.ai?token=XXX
 * 3. الواجهة الأمامية تستقبل الـ token وتُرسله لـ /api/sso/token
 * 4. السيرفر يتحقق من الـ token عبر mousa.ai API
 * 5. السيرفر يُنشئ جلسة محلية ويُعيد التوجيه بدون أي نافذة
 *
 * النتيجة: دخول سلس بدون تسجيل مزدوج
 *
 * ملاحظة (v2.0): mousa.ai لا يُعيد حقل "valid" في الاستجابة.
 * الشرط الصحيح هو التحقق من وجود userId و openId.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { verifyMousaToken, checkMousaBalance, getMousaUserByOpenId } from "../mousa";
import { ENV } from "./env";

const MOUSA_BASE_URL = "https://www.mousa.ai";
const PLATFORM_ID = "fada";

/**
 * تسجيل routes نظام SSO
 */
export function registerSSORoutes(app: Express) {
  /**
   * GET /api/sso/token?token=XXX&return_url=/
   *
   * يستقبل token من mousa.ai، يتحقق منه، يُنشئ جلسة محلية،
   * ثم يُعيد التوجيه للصفحة المطلوبة بدون أي نافذة.
   *
   * يُستدعى من:
   * - الواجهة الأمامية عند وجود ?token= في URL
   * - mousa.ai مباشرة كـ redirect URL
   */
  app.get("/api/sso/token", async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    const returnUrl = (req.query.return_url as string) || "/";

    if (!token) {
      // لا يوجد token — توجيه للصفحة الرئيسية كزائر
      return res.redirect(302, returnUrl);
    }

    try {
      // 1. التحقق من الـ token عبر mousa.ai API
      const mousaData = await verifyMousaToken(token);

      // v2.0: mousa.ai لا يُعيد "valid" — نتحقق من userId و openId مباشرة
      if (!mousaData.userId || !mousaData.openId) {
        console.warn("[SSO] Invalid token from mousa.ai — missing userId or openId");
        return res.redirect(302, returnUrl);
      }

      // 2. upsert المستخدم في قاعدة بيانات فضاء المحلية
      await db.upsertUser({
        openId: mousaData.openId,
        name: mousaData.name || null,
        email: mousaData.email || null,
        loginMethod: "mousa_sso",
        lastSignedIn: new Date(),
        mousaUserId: mousaData.userId,
        mousaBalance: mousaData.creditBalance,
        mousaLastSync: new Date(),
      } as any);

      // 3. إنشاء جلسة محلية (JWT) بدون Manus OAuth
      const sessionToken = await sdk.createSessionToken(mousaData.openId, {
        name: mousaData.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // 4. ضبط الـ cookie وإعادة التوجيه بدون أي نافذة
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log(`[SSO] ✅ User ${mousaData.openId} (${mousaData.name}) logged in via mousa.ai SSO`);
      return res.redirect(302, returnUrl);
    } catch (err: any) {
      console.error("[SSO] Token verification failed:", err?.message);
      // فشل التحقق — نُوجّه كزائر بدون خطأ
      return res.redirect(302, returnUrl);
    }
  });

  /**
   * POST /api/sso/verify
   *
   * للاستخدام من الواجهة الأمامية (fetch) بدلاً من redirect.
   * يتحقق من الـ token ويُنشئ جلسة ويُعيد بيانات المستخدم.
   */
  app.post("/api/sso/verify", async (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };

    if (!token) {
      return res.status(400).json({ success: false, error: "token required" });
    }

    try {
      const mousaData = await verifyMousaToken(token);

      // v2.0: mousa.ai لا يُعيد "valid" — نتحقق من userId و openId مباشرة
      if (!mousaData.userId || !mousaData.openId) {
        return res.status(401).json({ success: false, error: "invalid token" });
      }

      // upsert المستخدم
      await db.upsertUser({
        openId: mousaData.openId,
        name: mousaData.name || null,
        email: mousaData.email || null,
        loginMethod: "mousa_sso",
        lastSignedIn: new Date(),
        mousaUserId: mousaData.userId,
        mousaBalance: mousaData.creditBalance,
        mousaLastSync: new Date(),
      } as any);

      // إنشاء جلسة محلية
      const sessionToken = await sdk.createSessionToken(mousaData.openId, {
        name: mousaData.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log(`[SSO] ✅ User ${mousaData.openId} verified via POST /api/sso/verify`);

      return res.json({
        success: true,
        user: {
          openId: mousaData.openId,
          name: mousaData.name,
          email: mousaData.email,
          creditBalance: mousaData.creditBalance,
          userId: mousaData.userId,
        },
      });
    } catch (err: any) {
      console.error("[SSO] POST verify failed:", err?.message);
      return res.status(401).json({ success: false, error: "verification failed" });
    }
  });

  /**
   * GET /api/sso/status
   *
   * يُعيد حالة الجلسة الحالية (للتحقق من الواجهة الأمامية)
   */
  app.get("/api/sso/status", async (req: Request, res: Response) => {
    const cookieHeader = req.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) {
      return res.json({ authenticated: false });
    }

    try {
      const { verifySessionToken } = await import("./localAuth");
      const session = await verifySessionToken(sessionCookie);
      if (!session) {
        return res.json({ authenticated: false });
      }

      const user = await db.getUserByOpenId(session.openId);
      if (!user) {
        return res.json({ authenticated: false });
      }

      // جلب الرصيد الحقيقي من mousa.ai
      let liveBalance = user.mousaBalance ?? 0;
      let resolvedMousaUserId = user.mousaUserId;

      // إذا لم يكن مربوطاً بعد — نحاول الربط تلقائياً
      if (!resolvedMousaUserId) {
        try {
          const mousaData = await getMousaUserByOpenId(user.openId);
          if (mousaData?.userId) {
            resolvedMousaUserId = mousaData.userId;
            liveBalance = mousaData.balance;
            db.upsertUser({
              openId: user.openId,
              mousaUserId: mousaData.userId,
              mousaBalance: mousaData.balance,
              mousaLastSync: new Date(),
            } as any).catch(() => {});
            console.log(`[SSO] ✅ Auto-linked ${user.openId} to mousa userId=${mousaData.userId}, balance=${mousaData.balance}`);
          }
        } catch {
          // فشل الربط — ليس خطأ حرج
        }
      }

      // إذا كان مربوطاً — جلب الرصيد الحقيقي
      if (resolvedMousaUserId) {
        try {
          const balanceData = await checkMousaBalance(resolvedMousaUserId);
          liveBalance = balanceData.balance;
          db.upsertUser({
            openId: user.openId,
            mousaBalance: liveBalance,
            mousaLastSync: new Date(),
          } as any).catch(() => {});
          console.log(`[SSO] ✅ Balance refreshed for ${user.openId}: ${liveBalance}`);
        } catch (err) {
          console.warn(`[SSO] Could not fetch live balance for userId=${resolvedMousaUserId}:`, err);
        }
      }

      return res.json({
        authenticated: true,
        user: {
          openId: user.openId,
          name: user.name,
          email: user.email,
          mousaUserId: user.mousaUserId,
          mousaBalance: liveBalance,
        },
      });
    } catch {
      return res.json({ authenticated: false });
    }
  });
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieHeader.split(";").forEach((part) => {
    const [key, ...vals] = part.trim().split("=");
    if (key) result[key.trim()] = decodeURIComponent(vals.join("="));
  });
  return result;
}
