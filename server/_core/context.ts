/**
 * context.ts — إنشاء سياق tRPC
 *
 * آلية المصادقة (حسب دليل mousa.ai التقني):
 * 1. نقرأ cookie app_session_id (يُرسَل تلقائياً لأن fada.mousa.ai هو subdomain)
 * 2. نفك JWT بـ MOUSA_JWT_SECRET ونستخرج openId
 * 3. نجلب بيانات المستخدم من قاعدة بيانات فضاء المحلية
 *    FIX FADA-001: إذا لم يكن موجوداً → نُنشئه ونجلب mousaUserId من mousa.ai API
 * 4. fallback: نقرأ cookie session (JWT المحلي للتطوير والاختبار)
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { verifyMousaSession } from "./mousaAuth";
import { verifySessionToken } from "./localAuth";
import * as db from "../db";
import { getMousaUserByOpenId } from "../mousa";
import { parse as parseCookies } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookieHeader = opts.req.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);

    // ===== المسار الأول: mousa.ai JWT (app_session_id) =====
    // يعمل عندما تكون فضاء على نفس سيرفر mousa.ai (fada.mousa.ai)
    const mousaSession = await verifyMousaSession(cookieHeader);
    if (mousaSession?.openId) {
      const dbUser = await db.getUserByOpenId(mousaSession.openId);
      if (dbUser) {
        user = dbUser;
        // تحديث lastSignedIn بشكل غير متزامن
        db.upsertUser({ openId: dbUser.openId, lastSignedIn: new Date() }).catch(() => {});

        // FIX FADA-001: إذا لم يكن mousaUserId مضبوطاً، نجلبه من mousa.ai API
        if (!dbUser.mousaUserId) {
          getMousaUserByOpenId(dbUser.openId).then(mousaData => {
            if (mousaData?.userId) {
              db.upsertUser({
                openId: dbUser.openId,
                mousaUserId: mousaData.userId,
                mousaBalance: mousaData.balance,
                mousaLastSync: new Date(),
              } as any).catch(() => {});
            }
          }).catch(() => {});
        }
      } else {
        // FIX FADA-001: المستخدم غير موجود في DB فضاء
        // نُنشئه تلقائياً ونجلب mousaUserId من mousa.ai API
        try {
          const mousaData = await getMousaUserByOpenId(mousaSession.openId);
          await db.upsertUser({
            openId: mousaSession.openId,
            name: null,
            email: null,
            loginMethod: "mousa",
            lastSignedIn: new Date(),
            mousaUserId: mousaData?.userId ?? undefined,
            mousaBalance: mousaData?.balance ?? 0,
            mousaLastSync: mousaData ? new Date() : undefined,
          });
          const newUser = await db.getUserByOpenId(mousaSession.openId);
          if (newUser) {
            user = newUser;
          }
        } catch (err) {
          console.error("[context] Failed to auto-create mousa user:", err);
        }
      }
    }

    // ===== المسار الثاني: JWT المحلي (session cookie) =====
    // fallback للتطوير أو عند عدم توفر mousa.ai JWT
    if (!user) {
      const sessionToken = cookies[COOKIE_NAME];
      if (sessionToken) {
        const session = await verifySessionToken(sessionToken);
        if (session) {
          const dbUser = await db.getUserByOpenId(session.openId);
          if (dbUser) {
            user = dbUser;
            db.upsertUser({ openId: dbUser.openId, lastSignedIn: new Date() }).catch(() => {});
          }
        }
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
