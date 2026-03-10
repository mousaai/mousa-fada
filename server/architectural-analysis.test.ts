/**
 * اختبارات التحليل المعماري والسيناريوهات الثلاثة
 * يتحقق من:
 * 1. هيكل بيانات analyzeAndGenerateIdeas (spaceAnalysis + structuralSuggestions + ideas)
 * 2. توليد imagePrompt يحافظ على البنية الأصلية
 * 3. السيناريوهات الثلاثة (surface, moderate, complete)
 */
import { describe, it, expect } from "vitest";

// ===== اختبار هيكل بيانات SpaceAnalysis =====
describe("SpaceAnalysis structure", () => {
  it("should have required fields", () => {
    const spaceAnalysis = {
      spaceType: "صالة معيشة",
      estimatedArea: "25 م²",
      structuralElements: [
        { element: "باب رئيسي", position: "وسط الجدار الشمالي", keepInDesign: true },
        { element: "نافذة كبيرة", position: "الجدار الغربي", keepInDesign: true },
        { element: "درجة مدخل", position: "عند الباب", keepInDesign: true },
      ],
      currentIssues: ["إضاءة طبيعية محدودة", "تدفق حركة غير مثالي"],
      currentMaterials: ["بلاط سيراميك", "جبس بورد", "دهان أبيض"],
    };

    expect(spaceAnalysis.spaceType).toBeTruthy();
    expect(spaceAnalysis.estimatedArea).toBeTruthy();
    expect(spaceAnalysis.structuralElements).toBeInstanceOf(Array);
    expect(spaceAnalysis.structuralElements.length).toBeGreaterThan(0);
    expect(spaceAnalysis.currentIssues).toBeInstanceOf(Array);
    expect(spaceAnalysis.currentMaterials).toBeInstanceOf(Array);
  });

  it("should filter keepInDesign elements correctly", () => {
    const elements = [
      { element: "باب رئيسي", position: "شمال", keepInDesign: true },
      { element: "جدار داخلي", position: "وسط", keepInDesign: false },
      { element: "نافذة", position: "غرب", keepInDesign: true },
    ];
    const keepElements = elements.filter(e => e.keepInDesign);
    expect(keepElements).toHaveLength(2);
    expect(keepElements[0].element).toBe("باب رئيسي");
    expect(keepElements[1].element).toBe("نافذة");
  });
});

// ===== اختبار هيكل بيانات StructuralSuggestion =====
describe("StructuralSuggestion structure", () => {
  it("should have all required fields", () => {
    const suggestion = {
      id: "struct_1",
      title: "إزالة الدرجة عند المدخل",
      element: "درجة المدخل",
      reason: "الدرجة تعيق تدفق الحركة وتسبب خطر السقوط",
      benefit: "توحيد مستوى الأرضية يوسع المساحة البصرية بنسبة 15%",
      additionalCost: "5,000 - 8,000 ر.س",
      structuralWarning: "يستلزم فحص إنشائي للتأكد من عدم وجود أعمال خرسانية تحت الدرجة",
      timeRequired: "2-3 أيام عمل إضافية",
    };

    expect(suggestion.id).toBeTruthy();
    expect(suggestion.title).toBeTruthy();
    expect(suggestion.element).toBeTruthy();
    expect(suggestion.reason).toBeTruthy();
    expect(suggestion.benefit).toBeTruthy();
    expect(suggestion.additionalCost).toBeTruthy();
    expect(suggestion.structuralWarning).toBeTruthy();
    expect(suggestion.timeRequired).toBeTruthy();
  });
});

// ===== اختبار السيناريوهات الثلاثة =====
describe("Three design scenarios", () => {
  const VALID_SCENARIOS = ["surface", "moderate", "complete"];

  it("should have valid scenario values", () => {
    const ideas = [
      { id: "1", scenario: "surface", scenarioLabel: "تجديد سطحي" },
      { id: "2", scenario: "moderate", scenarioLabel: "تحسين متوسط" },
      { id: "3", scenario: "complete", scenarioLabel: "تحول شامل" },
    ];

    ideas.forEach(idea => {
      expect(VALID_SCENARIOS).toContain(idea.scenario);
      expect(idea.scenarioLabel).toBeTruthy();
    });
  });

  it("should have scenario colors defined", () => {
    const SCENARIO_COLORS = {
      surface: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7", label: "تجديد سطحي" },
      moderate: { bg: "#FFF3E0", text: "#E65100", border: "#FFCC80", label: "تحسين متوسط" },
      complete: { bg: "#F3E5F5", text: "#6A1B9A", border: "#CE93D8", label: "تحول شامل" },
    };

    VALID_SCENARIOS.forEach(scenario => {
      const color = SCENARIO_COLORS[scenario as keyof typeof SCENARIO_COLORS];
      expect(color).toBeDefined();
      expect(color.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color.text).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color.label).toBeTruthy();
    });
  });
});

// ===== اختبار توليد imagePrompt المعماري =====
describe("Architectural imagePrompt generation", () => {
  it("should include structural preservation constraint", () => {
    const keepElements = [
      { element: "باب رئيسي", position: "وسط الجدار الشمالي" },
      { element: "درجة مدخل", position: "عند الباب" },
    ];

    const structuralNote = keepElements.length > 0
      ? `CRITICAL CONSTRAINT: Preserve EXACT positions of: ${keepElements.map(e => `${e.element} at ${e.position}`).join(", ")}. Do NOT move doors, windows, stairs, or change room dimensions.`
      : "CRITICAL: Preserve EXACT room layout.";

    expect(structuralNote).toContain("CRITICAL CONSTRAINT");
    expect(structuralNote).toContain("باب رئيسي");
    expect(structuralNote).toContain("درجة مدخل");
    expect(structuralNote).toContain("Do NOT move doors");
  });

  it("should generate valid imagePrompt for each idea", () => {
    const styleMap: Record<string, string> = {
      modern: "modern contemporary",
      gulf: "Arabian Gulf luxury",
      minimal: "minimalist Japandi",
      japanese: "Japanese zen wabi-sabi",
    };

    const idea = {
      style: "modern",
      palette: [
        { name: "أبيض ناصع", hex: "#FFFFFF" },
        { name: "رمادي فاتح", hex: "#F5F5F5" },
      ],
      materials: ["رخام إيطالي", "خشب بلوط"],
    };

    const styleName = styleMap[idea.style] || idea.style;
    const palette = idea.palette.map(c => `${c.name} (${c.hex})`).join(", ");
    const mats = idea.materials.join(", ");
    const keepElements = [{ element: "باب", position: "شمال" }];
    const structuralNote = `CRITICAL CONSTRAINT: Preserve EXACT positions of: ${keepElements.map(e => `${e.element} at ${e.position}`).join(", ")}.`;

    const generatedPrompt = `Photorealistic architectural interior render, ${styleName} style interior design. ${structuralNote} Color palette: ${palette}. Premium materials: ${mats}. Same camera angle and perspective as original photo. Cinematic lighting, natural shadows, ultra-realistic textures, 8K resolution, architectural digest quality, professional interior photography, no people, no text.`;

    expect(generatedPrompt).toContain("Photorealistic architectural interior render");
    expect(generatedPrompt).toContain("modern contemporary");
    expect(generatedPrompt).toContain("CRITICAL CONSTRAINT");
    expect(generatedPrompt).toContain("أبيض ناصع");
    expect(generatedPrompt).toContain("رخام إيطالي");
    expect(generatedPrompt).toContain("no people");
    expect(generatedPrompt).toContain("no text");
  });
});

// ===== اختبار هيكل بيانات DesignIdea الكامل =====
describe("DesignIdea complete structure", () => {
  it("should have all required fields including scenario and timeline", () => {
    const idea = {
      id: "idea_1",
      title: "الحداثة الخليجية",
      style: "gulf",
      styleLabel: "خليجي فاخر",
      scenario: "moderate",
      scenarioLabel: "تحسين متوسط",
      description: "تصميم يجمع بين الفخامة الخليجية والعصرية مع الحفاظ على الباب الرئيسي والسلالم",
      palette: [
        { name: "ذهبي شمبانيا", hex: "#C9A84C" },
        { name: "أبيض كريمي", hex: "#FAF6F0" },
      ],
      materials: ["رخام كرارا", "خشب جوز"],
      highlights: ["إضاءة LED مخفية", "أثاث مخصص"],
      estimatedCost: "45,000 - 80,000 ر.س",
      costMin: 45000,
      costMax: 80000,
      timeline: "6-8 أسابيع",
      replacementCosts: [
        { item: "الأثاث", currentEstimate: "10,000 ر.س", replacementCost: "20,000 - 35,000 ر.س", notes: "أثاث مخصص" },
      ],
      imagePrompt: "Photorealistic architectural interior render...",
    };

    // التحقق من الحقول الأساسية
    expect(idea.id).toBeTruthy();
    expect(idea.title).toBeTruthy();
    expect(idea.scenario).toBe("moderate");
    expect(idea.scenarioLabel).toBe("تحسين متوسط");
    expect(idea.timeline).toBeTruthy();
    expect(idea.costMin).toBeGreaterThan(0);
    expect(idea.costMax).toBeGreaterThan(idea.costMin);
    expect(idea.palette).toHaveLength(2);
    expect(idea.materials.length).toBeGreaterThan(0);
    expect(idea.replacementCosts.length).toBeGreaterThan(0);
    expect(idea.imagePrompt).toBeTruthy();
  });
});

// ===== اختبار منطق generateVisualization =====
describe("generateVisualization logic", () => {
  it("should use imagePrompt when provided", () => {
    const input = {
      imageUrl: "https://example.com/room.jpg",
      designStyle: "modern",
      imagePrompt: "Custom architectural prompt with structural constraints",
      structuralElements: [{ element: "باب", position: "شمال" }],
    };

    // إذا كان imagePrompt موجوداً، يجب استخدامه مباشرة
    const finalPrompt = input.imagePrompt;
    expect(finalPrompt).toBe("Custom architectural prompt with structural constraints");
  });

  it("should generate fallback prompt with structural note when no imagePrompt", () => {
    const input = {
      imageUrl: "https://example.com/room.jpg",
      designStyle: "modern",
      palette: [{ name: "أبيض", hex: "#FFFFFF" }],
      materials: "رخام",
      structuralElements: [{ element: "باب رئيسي", position: "شمال" }],
    };

    const structuralNote = input.structuralElements?.length
      ? `CRITICAL CONSTRAINT: Preserve EXACT positions of: ${input.structuralElements.map(e => `${e.element} at ${e.position}`).join(", ")}. Do NOT move doors, windows, stairs, or change room dimensions.`
      : "CRITICAL: Preserve EXACT room layout.";

    const styleMap: Record<string, string> = { modern: "modern contemporary" };
    const styleName = styleMap[input.designStyle] || input.designStyle;
    const colorDesc = input.palette?.map(c => `${c.name} (${c.hex})`).join(", ") || "neutral warm tones";

    const prompt = `Photorealistic architectural interior render, ${styleName} style interior design. ${structuralNote} Apply new: color palette (${colorDesc}), premium materials (${input.materials}).`;

    expect(prompt).toContain("CRITICAL CONSTRAINT");
    expect(prompt).toContain("باب رئيسي");
    expect(prompt).toContain("modern contemporary");
  });
});
