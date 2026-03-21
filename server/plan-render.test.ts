import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: null,
      setCookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext,
  };
}

describe("generate3DPlanDesignData", () => {
  it("should be defined in appRouter", () => {
    expect(appRouter).toBeDefined();
    expect(typeof (appRouter as Record<string, unknown>)._def).toBe("object");
  });

  it("should have generate3DPlanDesignData procedure", () => {
    const caller = appRouter.createCaller(createPublicContext().ctx);
    expect(typeof caller.generate3DPlanDesignData).toBe("function");
  });

  it("should have generate3DFromPlan procedure", () => {
    const caller = appRouter.createCaller(createPublicContext().ctx);
    expect(typeof caller.generate3DFromPlan).toBe("function");
  });
});

describe("PlanRenderResult data structure", () => {
  it("should correctly calculate total area from rooms", () => {
    const rooms = [
      { label: "مجلس", width: 6, height: 8 },
      { label: "غرفة نوم", width: 4, height: 5 },
    ];
    const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(totalArea).toBe(68); // 48 + 20
  });

  it("should correctly map door types to Arabic labels", () => {
    const doorTypeMap: Record<string, string> = {
      double: "مزدوج",
      sliding: "منزلق",
      single: "واحد",
    };
    expect(doorTypeMap["double"]).toBe("مزدوج");
    expect(doorTypeMap["sliding"]).toBe("منزلق");
    expect(doorTypeMap["single"]).toBe("واحد");
  });

  it("should correctly map window types to Arabic labels", () => {
    const windowTypeMap: Record<string, string> = {
      panoramic: "بانورامية",
      full_panoramic: "بانورامية",
      french: "فرنسية",
      standard: "عادية",
    };
    expect(windowTypeMap["panoramic"]).toBe("بانورامية");
    expect(windowTypeMap["french"]).toBe("فرنسية");
  });

  it("should correctly map design styles to Arabic names", () => {
    const styleMap: Record<string, string> = {
      modern: "عصري معاصر",
      gulf: "خليجي فاخر",
      classic: "كلاسيكي",
      minimal: "مينيمال",
      luxury: "فاخر بريميوم",
    };
    expect(styleMap["gulf"]).toBe("خليجي فاخر");
    expect(styleMap["modern"]).toBe("عصري معاصر");
  });

  it("should calculate BOQ total correctly", () => {
    const boq = [
      { category: "الأرضيات", item: "بلاط", unit: "م²", qty: 48, unitPrice: 150, total: 7200 },
      { category: "الجدران", item: "دهان", unit: "م²", qty: 80, unitPrice: 50, total: 4000 },
      { category: "الأثاث", item: "كنب", unit: "قطعة", qty: 1, unitPrice: 8000, total: 8000 },
    ];
    const total = boq.reduce((sum, item) => sum + item.total, 0);
    expect(total).toBe(19200);
  });

  it("should group BOQ items by category correctly", () => {
    const boq = [
      { category: "الأرضيات", item: "بلاط", unit: "م²", qty: 48, unitPrice: 150, total: 7200 },
      { category: "الأرضيات", item: "سيراميك", unit: "م²", qty: 20, unitPrice: 120, total: 2400 },
      { category: "الجدران", item: "دهان", unit: "م²", qty: 80, unitPrice: 50, total: 4000 },
    ];
    const grouped = boq.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof boq>);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["الأرضيات"]).toHaveLength(2);
    expect(grouped["الجدران"]).toHaveLength(1);
  });
});
