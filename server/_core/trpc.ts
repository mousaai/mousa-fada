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
 * mousaProcedure: تتطلب تسجيل الدخول + ربط حساب Mousa.ai
 * تُستخدم لجميع عمليات AI التي تخصم كريدت
 */
export const mousaProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // 1. يجب تسجيل الدخول
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // 2. يجب الربط بمنصة Mousa.ai
    if (!ctx.user.mousaUserId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: JSON.stringify({
          code: "MOUSA_REQUIRED",
          message: "يجب الدخول من منصة Mousa.ai لاستخدام هذه الميزة",
          upgradeUrl: "https://www.mousa.ai",
        }),
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        mousaUserId: ctx.user.mousaUserId as number,
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
