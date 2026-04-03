/**
 * Auth Router — نظام مصادقة مستقل بالكامل
 * Email/Password + JWT محلي — أسرع من Manus OAuth
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { registerUser, loginUser, requestPasswordReset, resetPassword } from "../_core/localAuth";
import * as db from "../db";

export const authRouter = router({
  // ===== جلب بيانات المستخدم الحالي =====
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  // ===== تسجيل حساب جديد =====
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
      email: z.string().email("بريد إلكتروني غير صحيح"),
      password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { openId, sessionToken } = await registerUser(input);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        const user = await db.getUserByOpenId(openId);
        return { success: true, user };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message ?? "فشل إنشاء الحساب",
        });
      }
    }),

  // ===== تسجيل الدخول =====
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { user, sessionToken } = await loginUser(input);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user };
      } catch (error: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message ?? "بيانات الدخول غير صحيحة",
        });
      }
    }),

  // ===== تسجيل الخروج =====
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME);
    return { success: true };
  }),

  // ===== طلب إعادة تعيين كلمة المرور =====
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const token = await requestPasswordReset(input.email);
      // في بيئة الإنتاج: أرسل الـ token عبر البريد الإلكتروني
      // حالياً نُعيده في الاستجابة للاختبار فقط
      if (process.env.NODE_ENV !== "production") {
        return { success: true, resetToken: token };
      }
      return { success: true };
    }),

  // ===== إعادة تعيين كلمة المرور =====
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const success = await resetPassword(input.token, input.newPassword);
      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "الرابط منتهي الصلاحية أو غير صحيح",
        });
      }
      return { success: true };
    }),

  // ===== تغيير كلمة المرور (للمستخدم المسجّل) =====
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user?.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تغيير كلمة المرور لهذا الحساب" });
      }
      const { verifyPassword, hashPassword } = await import("../_core/localAuth");
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });
      }
      const newHash = await hashPassword(input.newPassword);
      await db.upsertUser({ openId: ctx.user.openId, passwordHash: newHash });
      return { success: true };
    }),
});
