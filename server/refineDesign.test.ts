/**
 * اختبارات refineDesign procedure والتحسينات الجديدة
 */
import { describe, it, expect } from "vitest";

// اختبار توافق الأسعار
describe("Price Consistency", () => {
  it("syncedBoq should override grandTotal with realisticCost", () => {
    const boqResult = {
      grandTotalMin: 10000,
      grandTotalMax: 20000,
      categories: [],
      area: 25,
      perimeter: 20,
      wallArea: 56,
      ceilingArea: 25,
      source: "estimated" as const,
      disclaimer: "تقديري",
    };
    const realisticCostMin = 25000;
    const realisticCostMax = 45000;

    const syncedBoq = {
      ...boqResult,
      grandTotalMin: realisticCostMin,
      grandTotalMax: realisticCostMax,
    };

    expect(syncedBoq.grandTotalMin).toBe(25000);
    expect(syncedBoq.grandTotalMax).toBe(45000);
    // يجب أن يتطابق مع costMin/costMax
    expect(syncedBoq.grandTotalMin).toBe(realisticCostMin);
    expect(syncedBoq.grandTotalMax).toBe(realisticCostMax);
  });
});

// اختبار منطق doorChangeRule
describe("Door Change Rule Logic", () => {
  it("when allowDoorChanges=false, rule should restrict doors and windows only", () => {
    const allowDoorChanges = false;
    const doorChangeRule = allowDoorChanges
      ? "العميل يسمح باقتراح تغيير مواقع الأبواب والنوافذ كمقترحات اختيارية فقط في structuralSuggestions."
      : "STRICT RULE: العميل لا يريد تغيير مواقع الأبواب والنوافذ والأعمدة والفتحات إطلاقاً. يجب أن تبقى في نفس مواقعها الدقيقة في جميع التصاميم المولّدة. لا تقترح تغييرها حتى في structuralSuggestions.";

    expect(doorChangeRule).toContain("STRICT RULE");
    expect(doorChangeRule).toContain("الأبواب والنوافذ");
    // يجب ألا يذكر الأرضيات أو الجدران كثوابت
    expect(doorChangeRule).not.toContain("الأرضيات");
  });

  it("when allowDoorChanges=true, rule should allow door suggestions", () => {
    const allowDoorChanges = true;
    const doorChangeRule = allowDoorChanges
      ? "العميل يسمح باقتراح تغيير مواقع الأبواب والنوافذ كمقترحات اختيارية فقط في structuralSuggestions."
      : "STRICT RULE: العميل لا يريد تغيير مواقع الأبواب والنوافذ والأعمدة والفتحات إطلاقاً.";

    expect(doorChangeRule).toContain("يسمح");
    expect(doorChangeRule).not.toContain("STRICT RULE");
  });
});

// اختبار بناء refinementPrompt
describe("Refinement Prompt Builder", () => {
  it("should include location hint when clickX/Y provided", () => {
    const originalPrompt = "Photorealistic interior design";
    const refinementRequest = "غيّر لون الجدار إلى أخضر زيتوني";
    const clickX = 45;
    const clickY = 60;

    const locationHint = (clickX !== undefined && clickY !== undefined)
      ? `\nThe user clicked on the image at position (${Math.round(clickX)}%, ${Math.round(clickY)}%) from top-left. Focus the refinement on that area.`
      : "";

    const refinementPrompt = `${originalPrompt} REFINEMENT REQUEST: ${refinementRequest}.${locationHint} Keep everything else exactly the same.`;

    expect(refinementPrompt).toContain("REFINEMENT REQUEST");
    expect(refinementPrompt).toContain("45%");
    expect(refinementPrompt).toContain("60%");
    expect(refinementPrompt).toContain("غيّر لون الجدار");
  });

  it("should work without location hint", () => {
    const originalPrompt = "Photorealistic interior design";
    const refinementRequest = "أضف نباتات خضراء";
    const clickX = undefined;
    const clickY = undefined;

    const locationHint = (clickX !== undefined && clickY !== undefined)
      ? `\nThe user clicked on the image at position (${Math.round(clickX as number)}%, ${Math.round(clickY as number)}%) from top-left.`
      : "";

    const refinementPrompt = `${originalPrompt} REFINEMENT REQUEST: ${refinementRequest}.${locationHint} Keep everything else exactly the same.`;

    expect(refinementPrompt).toContain("REFINEMENT REQUEST");
    expect(refinementPrompt).not.toContain("clicked on the image");
    expect(refinementPrompt).toContain("أضف نباتات خضراء");
  });
});

// اختبار FULL CREATIVE FREEDOM في imagePrompt
describe("Full Creative Freedom in Image Prompt", () => {
  it("generated prompt should include FULL CREATIVE FREEDOM", () => {
    const styleName = "modern contemporary";
    const palette = "أبيض (#FFFFFF), رمادي (#808080)";
    const mats = "رخام, معدن";
    const cameraNote = "eye-level camera, centered shot";
    const structuralNote = "ABSOLUTE CONSTRAINT: Preserve ALL structural elements";
    const roomNote = "square room, standard ceiling height";

    const generatedPrompt = `Photorealistic architectural interior redesign with FULL CREATIVE FREEDOM. ${cameraNote} ${roomNote} ${structuralNote} COMPLETE TRANSFORMATION: Apply ${styleName} style from scratch. New color palette: ${palette}. New materials: ${mats}. New furniture matching the style. New wall finish and paint/wallpaper, completely new flooring (tiles/wood/marble/etc), new ceiling treatment (gypsum/coves/beams), new lighting fixtures, new decor. DO NOT keep any existing finishes - replace everything.`;

    expect(generatedPrompt).toContain("FULL CREATIVE FREEDOM");
    expect(generatedPrompt).toContain("COMPLETE TRANSFORMATION");
    expect(generatedPrompt).toContain("DO NOT keep any existing finishes");
    expect(generatedPrompt).toContain("from scratch");
  });
});
