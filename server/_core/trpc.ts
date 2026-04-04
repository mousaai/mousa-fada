import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * mousaProcedure: المنصة مفتوحة للجميع
 * - الزائر: يحصل على وصول كامل بدون خصم كريدت
 * - المسجّل: يُخصم الكريدت من رصيده في mousa.ai عند استخدام خدمات AI
 *
 * ctx.isGuest = true  → زائر غير مسجّل
 * ctx.mousaUserId     → رقم المستخدم في mousa.ai (null للزوار)
 */
export const mousaProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const guestUser = {
      id: 0, openId: "guest", name: "زائر", email: "",
      role: "user" as const,
      mousaUserId: null, mousaBalance: 0, mousaLastSync: null,
      passwordHash: null, passwordResetToken: null, passwordResetExpiry: null,
      emailVerified: false, emailVerifyToken: null,
      loginMethod: "guest",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date()
    };

    const effectiveUser = ctx.user ?? guestUser;
    const isGuest = !ctx.user;

    // mousaUserId: رقم المستخدم في mousa.ai — مستخرج من JWT الجلسة
    // null للزوار → creditHelper سيسمح بالعملية بدون خصم
    const mousaUserId = isGuest ? null : ((ctx.user as any)?.mousaUserId ?? null);

    return next({
      ctx: {
        ...ctx,
        user: effectiveUser,
        isGuest,
        mousaUserId,
      },
    });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
