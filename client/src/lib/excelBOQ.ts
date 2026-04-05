import * as XLSX from "xlsx";

interface BOQItem {
  category: string;
  item: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPriceMin: number;
  unitPriceMax: number;
  notes?: string;
}

interface ProjectBOQData {
  projectName: string;
  designStyle: string;
  spaceType?: string;
  area?: number;
  materials?: Array<{ name: string; type: string; brand?: string; priceRange?: string }>;
  furniture?: Array<{ name: string; quantity?: number; material?: string; priceRange?: string }>;
  costEstimate?: {
    breakdown?: Record<string, number>;
    timeline?: string;
  };
  totalCostMin?: number;
  totalCostMax?: number;
}

const STYLE_NAMES: Record<string, string> = {
  modern: "عصري", gulf: "خليجي", classical: "كلاسيكي", minimal: "مينيمال",
  japanese: "ياباني", moroccan: "مغربي", scandinavian: "إسكندنافي",
  industrial: "صناعي", art_deco: "آرت ديكو", chinese: "صيني",
};

const CATEGORY_NAMES: Record<string, string> = {
  flooring: "أعمال الأرضيات",
  walls: "أعمال الجدران",
  ceiling: "أعمال الأسقف",
  lighting: "أعمال الإضاءة",
  furniture: "الأثاث والمفروشات",
  curtains: "الستائر والمفروشات",
  labor: "أعمال التركيب والعمالة",
};

function parsePriceRange(priceRange?: string): { min: number; max: number } {
  if (!priceRange) return { min: 0, max: 0 };
  const numbers = priceRange.match(/[\d,]+/g);
  if (!numbers) return { min: 0, max: 0 };
  const vals = numbers.map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => !isNaN(n));
  if (vals.length === 0) return { min: 0, max: 0 };
  if (vals.length === 1) return { min: vals[0], max: vals[0] };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

export function generateBOQExcel(project: ProjectBOQData): void {
  const wb = XLSX.utils.book_new();

  // ===== ورقة 1: ملخص المشروع =====
  const summaryData = [
    ["منصة م. سارة — خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي", "", "", ""],
    ["جدول الكميات والمواصفات (BOQ)", "", "", ""],
    ["", "", "", ""],
    ["اسم المشروع:", project.projectName, "", ""],
    ["نمط التصميم:", STYLE_NAMES[project.designStyle] || project.designStyle, "", ""],
    ["نوع الفضاء:", project.spaceType || "—", "", ""],
    ["المساحة الإجمالية:", project.area ? `${project.area} م²` : "—", "", ""],
    ["تاريخ التقرير:", new Date().toLocaleDateString("ar-SA"), "", ""],
    ["", "", "", ""],
    ["إجمالي التكلفة التقديرية:", "", "", ""],
    ["الحد الأدنى:", `${(project.totalCostMin || 0).toLocaleString("ar-SA")} ريال سعودي`, "", ""],
    ["الحد الأقصى:", `${(project.totalCostMax || 0).toLocaleString("ar-SA")} ريال سعودي`, "", ""],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص المشروع");

  // ===== ورقة 2: جدول الكميات الكامل =====
  const boqItems: BOQItem[] = [];

  // أعمال الأرضيات
  if (project.area) {
    boqItems.push({
      category: "أعمال الأرضيات",
      item: "تركيب أرضيات (سيراميك/رخام/خشب)",
      description: "توريد وتركيب أرضيات حسب المواصفات المعتمدة",
      unit: "م²",
      quantity: project.area,
      unitPriceMin: 150,
      unitPriceMax: 800,
      notes: "يشمل مواد اللصق والتسوية",
    });
    boqItems.push({
      category: "أعمال الأرضيات",
      item: "أعمال تسوية وتجهيز الأرضية",
      unit: "م²",
      quantity: project.area,
      unitPriceMin: 30,
      unitPriceMax: 60,
    });
  }

  // أعمال الجدران
  if (project.area) {
    const wallArea = project.area * 2.8; // تقدير محيط الجدران
    boqItems.push({
      category: "أعمال الجدران",
      item: "دهان جدران (طبقتان)",
      description: "دهان بطلاء عالي الجودة مع البطانة",
      unit: "م²",
      quantity: wallArea,
      unitPriceMin: 15,
      unitPriceMax: 45,
    });
    boqItems.push({
      category: "أعمال الجدران",
      item: "ورق جدران أو كسوة تزيينية",
      unit: "م²",
      quantity: wallArea * 0.3,
      unitPriceMin: 80,
      unitPriceMax: 350,
      notes: "للجدران المميزة فقط",
    });
  }

  // أعمال الأسقف
  if (project.area) {
    boqItems.push({
      category: "أعمال الأسقف",
      item: "جبس بورد مع إضاءة مدمجة",
      unit: "م²",
      quantity: project.area,
      unitPriceMin: 120,
      unitPriceMax: 400,
      notes: "يشمل الهيكل المعدني والتشطيب",
    });
  }

  // المواد من التحليل
  if (project.materials) {
    project.materials.forEach((mat) => {
      const price = parsePriceRange(mat.priceRange);
      boqItems.push({
        category: "مواد التشطيب",
        item: mat.name,
        description: `${mat.type}${mat.brand ? ` — ${mat.brand}` : ""}`,
        unit: "م²",
        quantity: project.area || 1,
        unitPriceMin: price.min || 100,
        unitPriceMax: price.max || 500,
      });
    });
  }

  // الأثاث
  if (project.furniture) {
    project.furniture.forEach((f) => {
      const price = parsePriceRange(f.priceRange);
      boqItems.push({
        category: "الأثاث والمفروشات",
        item: f.name,
        description: f.material || "",
        unit: "قطعة",
        quantity: f.quantity || 1,
        unitPriceMin: price.min || 500,
        unitPriceMax: price.max || 5000,
      });
    });
  }

  // أعمال الإضاءة
  boqItems.push({
    category: "أعمال الإضاءة",
    item: "إضاءة رئيسية (سبوت لايت)",
    unit: "قطعة",
    quantity: Math.ceil((project.area || 20) / 4),
    unitPriceMin: 80,
    unitPriceMax: 350,
  });
  boqItems.push({
    category: "أعمال الإضاءة",
    item: "إضاءة ديكورية وجداريات",
    unit: "قطعة",
    quantity: 3,
    unitPriceMin: 200,
    unitPriceMax: 1500,
  });

  // أعمال العمالة
  boqItems.push({
    category: "أعمال التركيب والعمالة",
    item: "أجور العمالة والتركيب الشامل",
    unit: "إجمالي",
    quantity: 1,
    unitPriceMin: Math.round((project.totalCostMin || 10000) * 0.15),
    unitPriceMax: Math.round((project.totalCostMax || 50000) * 0.2),
    notes: "يشمل جميع أعمال التركيب والتشطيب",
  });

  // بناء ورقة BOQ
  const boqHeaders = [
    "ملاحظات",
    "الإجمالي الأقصى (ر.س)",
    "الإجمالي الأدنى (ر.س)",
    "سعر الوحدة الأقصى",
    "سعر الوحدة الأدنى",
    "الكمية",
    "الوحدة",
    "الوصف",
    "البند",
    "الفئة",
    "م",
  ];

  const boqRows = boqItems.map((item, i) => [
    item.notes || "",
    item.quantity * item.unitPriceMax,
    item.quantity * item.unitPriceMin,
    item.unitPriceMax,
    item.unitPriceMin,
    item.quantity,
    item.unit,
    item.description || "",
    item.item,
    item.category,
    i + 1,
  ]);

  // إضافة صف الإجمالي
  const totalMin = boqItems.reduce((sum, item) => sum + item.quantity * item.unitPriceMin, 0);
  const totalMax = boqItems.reduce((sum, item) => sum + item.quantity * item.unitPriceMax, 0);
  boqRows.push(["", totalMax, totalMin, "", "", "", "", "", "", "الإجمالي الكلي", ""]);

  const wsBoq = XLSX.utils.aoa_to_sheet([boqHeaders, ...boqRows]);
  wsBoq["!cols"] = [
    { wch: 6 }, { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 10 },
    { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBoq, "جدول الكميات BOQ");

  // ===== ورقة 3: توزيع التكاليف =====
  if (project.costEstimate?.breakdown) {
    const breakdownHeaders = ["النسبة المئوية", "الحد الأقصى (ر.س)", "الحد الأدنى (ر.س)", "البند"];
    const breakdown = project.costEstimate.breakdown;
    const total = project.totalCostMin || 1;

    const breakdownRows = Object.entries(breakdown)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => {
        const pct = Math.round(((v as number) / total) * 100);
        return [`${pct}%`, `${((v as number) * 1.3).toLocaleString()}`, `${(v as number).toLocaleString()}`, CATEGORY_NAMES[k] || k];
      });

    breakdownRows.push([
      "100%",
      `${(project.totalCostMax || 0).toLocaleString()} ر.س`,
      `${(project.totalCostMin || 0).toLocaleString()} ر.س`,
      "الإجمالي",
    ]);

    const wsBreakdown = XLSX.utils.aoa_to_sheet([breakdownHeaders, ...breakdownRows]);
    wsBreakdown["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsBreakdown, "توزيع التكاليف");
  }

  // حفظ الملف
  const fileName = `BOQ-${project.projectName}-${new Date().toLocaleDateString("ar-SA").replace(/\//g, "-")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
