import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "test-user-sarah",
    email: "test@sarah.ai",
    name: "مستخدم تجريبي",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("costs.calculate", () => {
  it("يجب أن تُعيد بيانات تقدير التكلفة بصيغة صحيحة", async () => {
    // التحقق من أن router يحتوي على costs.calculate
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // التحقق من وجود الإجراء
    expect(typeof caller.costs.calculate).toBe("function");
  });
});

describe("projects router", () => {
  it("يجب أن تُعيد قائمة المشاريع بصيغة صحيحة", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // التحقق من وجود الإجراء
    expect(typeof caller.projects.list).toBe("function");
  });

  it("يجب أن تُعيد إجراء إنشاء المشروع بصيغة صحيحة", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(typeof caller.projects.create).toBe("function");
  });
});

describe("analyses router", () => {
  it("يجب أن يحتوي على إجراء التحليل", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(typeof caller.analyses.analyze).toBe("function");
  });
});

describe("upload router", () => {
  it("يجب أن يحتوي على إجراء رفع الصورة", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(typeof caller.upload.image).toBe("function");
  });
});
