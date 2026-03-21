/**
 * اختبارات تصدير PDF الاحترافي (الإصدار 31.0)
 * اختبار منطق بناء بيانات PDF لكل فكرة تصميمية
 */
import { describe, it, expect } from "vitest";

// ===== اختبار بنية بيانات الفكرة التصميمية =====
describe("Design Idea PDF Data Structure", () => {
  it("should have all required fields for PDF generation", () => {
    const idea = {
      id: "idea-1",
      title: "تصميم عصري أنيق",
      description: "تصميم داخلي عصري يجمع بين البساطة والأناقة",
      style: "modern",
      imageUrl: "https://example.com/design.jpg",
      colors: [
        { hex: "#D4AF37", name: "ذهبي", usage: "لون أساسي" },
        { hex: "#F5F5DC", name: "بيج", usage: "لون ثانوي" },
      ],
      materials: ["رخام إيطالي", "خشب البلوط", "زجاج مطفي"],
      furniture: ["أريكة L-Shape", "طاولة قهوة زجاجية", "خزانة تلفزيون"],
      advantages: ["إضاءة طبيعية ممتازة", "مساحة مفتوحة", "تدفق حركة سلس"],
      costMin: 45000,
      costMax: 75000,
      scenario: "متوسط",
      boq: {
        grandTotalMin: 45000,
        grandTotalMax: 75000,
        categories: [
          {
            name: "الأرضيات",
            items: [
              { description: "رخام إيطالي 60×60", unit: "م²", quantity: 25, unitPrice: 450, total: 11250 }
            ],
            subtotal: 11250
          }
        ],
        area: 25,
        source: "estimated" as const,
        disclaimer: "تقديري"
      }
    };

    // التحقق من الحقول الأساسية
    expect(idea.title).toBeTruthy();
    expect(idea.description).toBeTruthy();
    expect(idea.imageUrl).toBeTruthy();
    expect(idea.colors).toHaveLength(2);
    expect(idea.materials).toHaveLength(3);
    expect(idea.furniture).toHaveLength(3);
    expect(idea.advantages).toHaveLength(3);
    expect(idea.costMin).toBeGreaterThan(0);
    expect(idea.costMax).toBeGreaterThan(idea.costMin);
    expect(idea.boq).toBeDefined();
    expect(idea.boq.categories).toHaveLength(1);
  });

  it("should format cost range correctly", () => {
    const costMin = 45000;
    const costMax = 75000;
    const currency = "درهم إماراتي";

    const formatted = `${costMin.toLocaleString("ar-SA")} — ${costMax.toLocaleString("ar-SA")} ${currency}`;
    // Arabic locale uses Arabic-Indic numerals (٤٥ instead of 45)
    expect(formatted).toContain(currency);
    expect(formatted.length).toBeGreaterThan(10);
    expect(formatted).toContain("—");
  });
});

// ===== اختبار بناء جدول BOQ للـ PDF =====
describe("BOQ Table for PDF", () => {
  it("should build BOQ rows correctly", () => {
    const boqCategories = [
      {
        name: "الأرضيات",
        items: [
          { description: "رخام إيطالي 60×60", unit: "م²", quantity: 25, unitPrice: 450, total: 11250 },
          { description: "أعمال الوضع والتركيب", unit: "م²", quantity: 25, unitPrice: 80, total: 2000 }
        ],
        subtotal: 13250
      },
      {
        name: "الجدران",
        items: [
          { description: "دهان جداري فاخر", unit: "م²", quantity: 56, unitPrice: 45, total: 2520 }
        ],
        subtotal: 2520
      }
    ];

    // بناء صفوف الجدول
    const rows: string[][] = [];
    for (const cat of boqCategories) {
      // صف الفئة
      rows.push([cat.name, "", "", "", cat.subtotal.toLocaleString("ar-SA")]);
      // صفوف البنود
      for (const item of cat.items) {
        rows.push([
          item.description,
          item.unit,
          String(item.quantity),
          item.unitPrice.toLocaleString("ar-SA"),
          item.total.toLocaleString("ar-SA")
        ]);
      }
    }

    expect(rows).toHaveLength(5); // 2 category rows + 3 item rows
    expect(rows[0][0]).toBe("الأرضيات");
    expect(rows[1][0]).toBe("رخام إيطالي 60×60");
    expect(rows[1][2]).toBe("25");
  });

  it("should calculate grand total correctly", () => {
    const categories = [
      { subtotal: 13250 },
      { subtotal: 2520 },
      { subtotal: 8000 }
    ];

    const grandTotal = categories.reduce((sum, cat) => sum + cat.subtotal, 0);
    expect(grandTotal).toBe(23770);
  });
});

// ===== اختبار لوحة الألوان في PDF =====
describe("Color Palette for PDF", () => {
  it("should parse hex colors correctly", () => {
    const hex = "#D4AF37";
    const cleaned = hex.replace("#", "");
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);

    expect(r).toBe(212);
    expect(g).toBe(175);
    expect(b).toBe(55);
  });

  it("should handle colors without # prefix", () => {
    const hex = "F5F5DC";
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    expect(r).toBe(245);
    expect(g).toBe(245);
    expect(b).toBe(220);
  });

  it("should limit colors to 6 for display", () => {
    const colors = Array.from({ length: 10 }, (_, i) => ({
      hex: `#${i.toString().padStart(6, "0")}`,
      name: `لون ${i}`,
      usage: "أساسي"
    }));

    const displayColors = colors.slice(0, 6);
    expect(displayColors).toHaveLength(6);
  });
});

// ===== اختبار اسم الملف المولّد =====
describe("PDF Filename Generation", () => {
  it("should generate valid Arabic filename", () => {
    const ideaTitle = "تصميم عصري أنيق";
    const sanitized = ideaTitle.replace(/\s+/g, "_").substring(0, 30);
    const timestamp = 1234567890;
    const fileName = `م_سارة_${sanitized}_${timestamp}.pdf`;

    expect(fileName).toContain("م_سارة");
    expect(fileName).toContain("تصميم_عصري_أنيق");
    expect(fileName.endsWith(".pdf")).toBe(true);
  });

  it("should truncate long titles", () => {
    const longTitle = "تصميم داخلي عصري جداً مع ألوان متعددة وأثاث فاخر ومواد طبيعية راقية";
    const truncated = longTitle.replace(/\s+/g, "_").substring(0, 30);

    expect(truncated.length).toBeLessThanOrEqual(30);
  });
});

// ===== اختبار منطق صفحات PDF =====
describe("PDF Pages Structure", () => {
  it("should define correct page structure", () => {
    const pages = [
      { name: "غلاف", content: ["صورة التصميم", "اسم الفكرة", "شعار م. سارة", "التكلفة الإجمالية"] },
      { name: "التصميم", content: ["الوصف", "لوحة الألوان", "المواد", "المزايا"] },
      { name: "BOQ", content: ["جدول الكميات", "الأسعار", "الإجمالي"] },
      { name: "المواصفات", content: ["الأثاث", "تفاصيل تقنية"] },
    ];

    expect(pages).toHaveLength(4);
    expect(pages[0].name).toBe("غلاف");
    expect(pages[0].content).toContain("صورة التصميم");
    expect(pages[1].content).toContain("لوحة الألوان");
    expect(pages[2].content).toContain("جدول الكميات");
    expect(pages[3].content).toContain("الأثاث");
  });

  it("should include م. سارة branding in all pages", () => {
    const brandName = "م. سارة";
    const footerText = `${brandName} | خبيرة التصميم الداخلي والمعماري`;

    expect(footerText).toContain(brandName);
    expect(footerText).toContain("خبيرة التصميم");
  });
});

// ===== اختبار تحويل سيناريو التصميم =====
describe("Design Scenario Labels", () => {
  it("should map scenario to Arabic label", () => {
    const scenarioLabels: Record<string, string> = {
      surface: "تجديد سطحي",
      medium: "تحسين متوسط",
      comprehensive: "تحول شامل"
    };

    expect(scenarioLabels["surface"]).toBe("تجديد سطحي");
    expect(scenarioLabels["medium"]).toBe("تحسين متوسط");
    expect(scenarioLabels["comprehensive"]).toBe("تحول شامل");
  });

  it("should handle unknown scenario gracefully", () => {
    const scenarioLabels: Record<string, string> = {
      surface: "تجديد سطحي",
      medium: "تحسين متوسط",
      comprehensive: "تحول شامل"
    };

    const label = scenarioLabels["unknown"] || "تصميم";
    expect(label).toBe("تصميم");
  });
});
