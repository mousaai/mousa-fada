/**
 * context.ts — إنشاء سياق tRPC
 *
 * آلية المصادقة (حسب دليل mousa.ai التقني):
 * 1. نقرأ cookie app_session_id (يُرسَل تلقائياً لأن fada.mousa.ai هو subdomain)
 * 2. نفك JWT بـ MOUSA_JWT_SECRET ونستخرج openId
 * 3. نجلب بيانات المستخدم من قاعدة بيانات فضاء المحلية
 * 4. fallback: نقرأ cookie session (JWT المحلي للتطوير والاختبار)
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { verifyMousaSession } from "./mousaAuth";
import { verifySessionToken } from "./localAuth";
import * as db from "../db";
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
      }
      // إذا لم يكن موجوداً في قاعدة بيانات فضاء سيتم إنشاؤه عند أول طلب محمي
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
