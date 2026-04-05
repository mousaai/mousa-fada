import { describe, it, expect } from "vitest";
import {
  BEST_PRACTICE_STYLES,
  QUALITY_ENHANCERS,
  buildBestPracticePrompt,
  getBestStylesForSpace,
  buildBestPracticeSystemPrompt,
  buildIdeaImagePrompt,
} from "./bestPracticeEngine";

describe("Best Practice Engine", () => {
  it("should have at least 10 best practice styles", () => {
    expect(Object.keys(BEST_PRACTICE_STYLES).length).toBeGreaterThanOrEqual(10);
  });

  it("each style should have required fields", () => {
    for (const [key, style] of Object.entries(BEST_PRACTICE_STYLES)) {
      expect(style.label, `${key} missing label`).toBeTruthy();
      expect(style.visualKeywords, `${key} missing visualKeywords`).toBeTruthy();
      expect(style.bestMaterials, `${key} missing bestMaterials`).toBeTruthy();
      expect(style.bestPalette, `${key} missing bestPalette`).toBeTruthy();
      expect(style.bestLighting, `${key} missing bestLighting`).toBeTruthy();
      expect(style.signatureDetails, `${key} missing signatureDetails`).toBeTruthy();
      expect(style.avoid, `${key} missing avoid`).toBeTruthy();
      expect(style.globalPopularity).toBeGreaterThanOrEqual(1);
      expect(style.gulfPopularity).toBeGreaterThanOrEqual(1);
    }
  });

  it("QUALITY_ENHANCERS should have all required keys", () => {
    expect(QUALITY_ENHANCERS.lighting).toBeTruthy();
    expect(QUALITY_ENHANCERS.imageQuality).toBeTruthy();
    expect(QUALITY_ENHANCERS.composition).toBeTruthy();
    expect(QUALITY_ENHANCERS.details).toBeTruthy();
    expect(QUALITY_ENHANCERS.atmosphere).toBeTruthy();
    expect(QUALITY_ENHANCERS.interior).toBeTruthy();
  });

  it("buildBestPracticePrompt should return a non-empty string", () => {
    const prompt = buildBestPracticePrompt({
      styleKey: "japandi",
      spaceType: "living room",
    });
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain("Japandi");
    expect(prompt).toContain("8K");
  });

  it("buildBestPracticePrompt with palette should include palette colors", () => {
    const prompt = buildBestPracticePrompt({
      styleKey: "quiet_luxury",
      spaceType: "bedroom",
      palette: [{ name: "cream", hex: "#F2EDE4" }],
    });
    expect(prompt).toContain("cream");
    expect(prompt).toContain("#F2EDE4");
  });

  it("buildBestPracticePrompt with isEdit should include structural constraint", () => {
    const prompt = buildBestPracticePrompt({
      styleKey: "modern_gulf",
      spaceType: "majlis",
      isEdit: true,
    });
    expect(prompt).toContain("KEEP IDENTICAL");
  });

  it("getBestStylesForSpace should return 3 styles", () => {
    const styles = getBestStylesForSpace("غرفة نوم رئيسية");
    expect(styles).toHaveLength(3);
    expect(styles[0]).toBe("quiet_luxury");
  });

  it("getBestStylesForSpace for majlis should return gulf styles", () => {
    const styles = getBestStylesForSpace("مجلس رجالي");
    expect(styles).toContain("modern_gulf");
  });

  it("getBestStylesForSpace for kitchen should return kitchen styles", () => {
    const styles = getBestStylesForSpace("مطبخ");
    expect(styles).toContain("modern_kitchen");
  });

  it("getBestStylesForSpace for unknown space should return defaults", () => {
    const styles = getBestStylesForSpace("unknown space xyz");
    expect(styles).toHaveLength(3);
  });

  it("buildBestPracticeSystemPrompt should contain key phrases", () => {
    const prompt = buildBestPracticeSystemPrompt();
    expect(prompt).toContain("Architectural Digest");
    expect(prompt).toContain("Japandi");
    expect(prompt).toContain("Quiet Luxury");
    expect(prompt).toContain("Modern Gulf");
    expect(prompt).toContain("2025");
  });

  it("buildIdeaImagePrompt should return a comprehensive prompt", () => {
    const prompt = buildIdeaImagePrompt({
      styleKey: "warm_contemporary",
      spaceType: "living room",
      palette: [{ name: "warm white", hex: "#F5F0E8" }],
      materials: ["walnut wood", "travertine"],
    });
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(200);
    expect(prompt).toContain("warm white");
    expect(prompt).toContain("walnut wood");
    expect(prompt).toContain("8K");
  });

  it("buildIdeaImagePrompt with isEdit should include structural note", () => {
    const prompt = buildIdeaImagePrompt({
      styleKey: "japandi",
      spaceType: "bedroom",
      palette: [],
      materials: [],
      isEdit: true,
      originalStructure: "door at center, window on left",
    });
    expect(prompt).toContain("door at center");
    expect(prompt).toContain("KEEP IDENTICAL");
  });

  it("japandi should be the highest globally popular style", () => {
    const japandi = BEST_PRACTICE_STYLES.japandi;
    expect(japandi.globalPopularity).toBe(10);
  });

  it("modern_gulf and quiet_gulf_luxury should be highest gulf popular", () => {
    const modernGulf = BEST_PRACTICE_STYLES.modern_gulf;
    const quietGulf = BEST_PRACTICE_STYLES.quiet_gulf_luxury;
    expect(modernGulf.gulfPopularity).toBe(10);
    expect(quietGulf.gulfPopularity).toBe(10);
  });
});
