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
 * mousaProcedure: procedure مستقلة — لا تعتمد على Mousa.ai
 * المستخدم المسجّل يحصل على وصول كامل، الزوار يحصلون على guest mode
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
    return next({
      ctx: {
        ...ctx,
        user: ctx.user ?? guestUser,
        mousaUserId: ctx.user?.id ?? null,
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
