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
 *
 * ⚡ الإصلاح الجذري (v63):
 * - استخدام createSessionToken المحلية (localAuth.ts) بدلاً من sdk.createSessionToken
 * - تضمين mousaUserId + creditBalance + email في الـ JWT cookie مباشرة
 * - الـ frontend يقرأ البيانات من الـ JWT بدون الحاجة لـ /api/sso/status
 * - هذا يحل مشكلة Nginx على fada.mousa.ai الذي لا يُوجّه /api/* لـ Express
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import * as db from "../db";
import { verifyMousaToken, checkMousaBalance, getMousaUserByOpenId } from "../mousa";
import { createSessionToken, verifySessionToken } from "./localAuth";

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

      // 2. جلب الرصيد الحقيقي
      let liveBalance = mousaData.creditBalance ?? 0;
      try {
        const balanceData = await checkMousaBalance(mousaData.userId);
        liveBalance = balanceData.balance;
      } catch {
        // فشل check-balance — نستخدم قيمة verify-token
      }

      // 3. upsert المستخدم في قاعدة بيانات فضاء المحلية
      await db.upsertUser({
        openId: mousaData.openId,
        name: mousaData.name || null,
        email: mousaData.email || null,
        loginMethod: "mousa_sso",
        lastSignedIn: new Date(),
        mousaUserId: mousaData.userId,
        mousaBalance: liveBalance,
        mousaLastSync: new Date(),
      } as any);

      // 4. إنشاء جلسة محلية (JWT) مع بيانات mousa مضمّنة
      // ⚡ هذا يتيح للـ frontend قراءة البيانات من الـ cookie مباشرة
      const sessionToken = await createSessionToken(
        mousaData.openId,
        mousaData.name || "",
        {
          mousaUserId: mousaData.userId,
          creditBalance: liveBalance,
          email: mousaData.email || undefined,
        }
      );

      // 5. ضبط الـ cookie وإعادة التوجيه بدون أي نافذة
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log(`[SSO] ✅ User ${mousaData.openId} (${mousaData.name}) logged in via mousa.ai SSO, balance=${liveBalance}`);
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

      // جلب الرصيد الحقيقي عبر check-balance (أدق من verify-token)
      let liveBalance = mousaData.creditBalance ?? 0;
      try {
        const balanceData = await checkMousaBalance(mousaData.userId);
        liveBalance = balanceData.balance;
        console.log(`[SSO] ✅ Balance refreshed: ${liveBalance} (was ${mousaData.creditBalance})`);
      } catch {
        // فشل check-balance — نستخدم قيمة verify-token
      }

      // upsert المستخدم
      await db.upsertUser({
        openId: mousaData.openId,
        name: mousaData.name || null,
        email: mousaData.email || null,
        loginMethod: "mousa_sso",
        lastSignedIn: new Date(),
        mousaUserId: mousaData.userId,
        mousaBalance: liveBalance,
        mousaLastSync: new Date(),
      } as any);

      // إنشاء جلسة محلية مع بيانات mousa مضمّنة في JWT
      const sessionToken = await createSessionToken(
        mousaData.openId,
        mousaData.name || "",
        {
          mousaUserId: mousaData.userId,
          creditBalance: liveBalance,
          email: mousaData.email || undefined,
        }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log(`[SSO] ✅ User ${mousaData.openId} verified via POST /api/sso/verify, balance=${liveBalance}`);

      return res.json({
        success: true,
        user: {
          openId: mousaData.openId,
          name: mousaData.name,
          email: mousaData.email,
          creditBalance: liveBalance,
          userId: mousaData.userId,
        },
      });
    } catch (err: any) {
      console.error("[SSO] POST verify failed:", err?.message);
      return res.status(401).json({ success: false, error: "verification failed" });
    }
  });

  /**
   * POST /api/sso/relink
   *
   * يقبل token جديد من mousa.ai ويُحدّث mousaUserId للمستخدم الموجود.
   * يُستخدم للمستخدمين الذين سجلوا قبل الإصلاح ولديهم mousaUserId = null.
   */
  app.post("/api/sso/relink", async (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };
    if (!token) {
      return res.status(400).json({ success: false, error: "token required" });
    }
    // التحقق من الجلسة المحلية أولاً
    const cookieHeader = req.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies[COOKIE_NAME];
    if (!sessionCookie) {
      return res.status(401).json({ success: false, error: "no session" });
    }
    try {
      const session = await verifySessionToken(sessionCookie);
      if (!session) {
        return res.status(401).json({ success: false, error: "invalid session" });
      }
      // التحقق من الـ token الجديد
      const mousaData = await verifyMousaToken(token);
      if (!mousaData.userId || !mousaData.openId) {
        return res.status(401).json({ success: false, error: "invalid token" });
      }
      // تحديث mousaUserId والرصيد للمستخدم الحالي
      await db.upsertUser({
        openId: session.openId,
        mousaUserId: mousaData.userId,
        mousaBalance: mousaData.creditBalance,
        mousaLastSync: new Date(),
      } as any);
      // تحديث الـ cookie بالبيانات الجديدة
      const user = await db.getUserByOpenId(session.openId);
      const newSessionToken = await createSessionToken(
        session.openId,
        session.name,
        {
          mousaUserId: mousaData.userId,
          creditBalance: mousaData.creditBalance ?? 0,
          email: user?.email || undefined,
        }
      );
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, newSessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      console.log(`[SSO] ✅ Relinked ${session.openId} to mousa userId=${mousaData.userId}, balance=${mousaData.creditBalance}`);
      return res.json({
        success: true,
        userId: mousaData.userId,
        creditBalance: mousaData.creditBalance,
      });
    } catch (err: any) {
      console.error("[SSO] relink failed:", err?.message);
      return res.status(500).json({ success: false, error: "relink failed" });
    }
  });

  /**
   * GET /api/sso/status
   *
   * يُعيد حالة الجلسة الحالية (للتحقق من الواجهة الأمامية)
   * ⚡ الآن يُعيد البيانات من الـ JWT مباشرة (لا يحتاج DB call)
   * مع fallback لتحديث الرصيد من mousa.ai
   */
  app.get("/api/sso/status", async (req: Request, res: Response) => {
    const cookieHeader = req.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) {
      return res.json({ authenticated: false });
    }

    try {
      const session = await verifySessionToken(sessionCookie);
      if (!session) {
        return res.json({ authenticated: false });
      }

      // ⚡ البيانات الأساسية من الـ JWT مباشرة (بدون DB)
      let liveBalance = session.creditBalance ?? 0;
      let resolvedMousaUserId = session.mousaUserId;

      // محاولة تحديث الرصيد من DB (إذا كان السيرفر متاحاً)
      try {
        const user = await db.getUserByOpenId(session.openId);
        if (user) {
          if (!resolvedMousaUserId && user.mousaUserId) {
            resolvedMousaUserId = user.mousaUserId;
          }
          if (user.mousaBalance !== null && user.mousaBalance !== undefined) {
            liveBalance = user.mousaBalance;
          }
        }
      } catch {
        // DB غير متاح — نستخدم بيانات الـ JWT
      }

      // محاولة جلب الرصيد الحقيقي من mousa.ai
      if (resolvedMousaUserId) {
        try {
          const balanceData = await checkMousaBalance(resolvedMousaUserId);
          liveBalance = balanceData.balance;
          db.upsertUser({
            openId: session.openId,
            mousaBalance: liveBalance,
            mousaLastSync: new Date(),
          } as any).catch(() => {});
          console.log(`[SSO] ✅ Balance refreshed for ${session.openId}: ${liveBalance}`);
        } catch (err) {
          console.warn(`[SSO] Could not fetch live balance for userId=${resolvedMousaUserId}:`, err);
        }
      }

      return res.json({
        authenticated: true,
        user: {
          openId: session.openId,
          name: session.name,
          email: session.email,
          mousaUserId: resolvedMousaUserId,
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
