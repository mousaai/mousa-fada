import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ColorItem {
  hex: string;
  name: string;
  usage: string;
}

interface MaterialItem {
  name: string;
  type: string;
  brand?: string;
  priceRange?: string;
  priority?: string;
}

interface FurnitureItem {
  name: string;
  quantity?: number;
  material?: string;
  priceRange?: string;
}

interface CostBreakdown {
  furniture?: number;
  flooring?: number;
  walls?: number;
  ceiling?: number;
  lighting?: number;
  curtains?: number;
  labor?: number;
  [key: string]: number | undefined;
}

interface AnalysisResult {
  spaceDescription?: string;
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
  styleDescription?: string;
}

interface ProjectData {
  name: string;
  designStyle: string;
  spaceType?: string;
  area?: number;
  colorPalette?: ColorItem[];
  materials?: MaterialItem[];
  furniture?: FurnitureItem[];
  costEstimate?: {
    breakdown?: CostBreakdown;
    timeline?: string;
    savingTips?: string[];
  };
  totalCostMin?: number;
  totalCostMax?: number;
  analysisResult?: AnalysisResult;
  perspectives?: Array<{ imageUrl?: string; roomName?: string; description?: string }>;
  createdAt?: string;
}

const STYLE_NAMES: Record<string, string> = {
  modern: "عصري",
  gulf: "خليجي",
  classical: "كلاسيكي",
  minimal: "مينيمال",
  japanese: "ياباني",
  moroccan: "مغربي",
  mediterranean: "متوسطي",
  scandinavian: "إسكندنافي",
  industrial: "صناعي",
  bohemian: "بوهيمي",
  art_deco: "آرت ديكو",
  bauhaus: "باوهاوس",
  chinese: "صيني",
  indian: "هندي",
  french: "فرنسي",
  italian: "إيطالي",
};

const SPACE_NAMES: Record<string, string> = {
  living_room: "غرفة المعيشة",
  bedroom: "غرفة النوم",
  kitchen: "المطبخ",
  bathroom: "الحمام",
  dining_room: "غرفة الطعام",
  office: "المكتب",
  kids_room: "غرفة الأطفال",
  master_bedroom: "غرفة النوم الرئيسية",
  entrance: "المدخل",
  villa: "فيلا",
  apartment: "شقة",
};

export async function generatePDFReport(project: ProjectData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ألوان المنصة
  const GOLD = [184, 134, 11] as [number, number, number];
  const BEIGE = [245, 235, 220] as [number, number, number];
  const DARK = [30, 20, 10] as [number, number, number];
  const LIGHT_GOLD = [212, 175, 55] as [number, number, number];

  // دالة مساعدة لرسم نص عربي (RTL simulation)
  const addArabicText = (
    text: string,
    x: number,
    y: number,
    options: { align?: "left" | "center" | "right"; fontSize?: number; color?: [number, number, number]; bold?: boolean } = {}
  ) => {
    const { align = "right", fontSize = 11, color = DARK, bold = false } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(text, x, y, { align });
  };

  // ===== صفحة الغلاف =====
  // خلفية ذهبية للهيدر
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, pageWidth, 60, "F");

  // شريط بيج
  doc.setFillColor(BEIGE[0], BEIGE[1], BEIGE[2]);
  doc.rect(0, 60, pageWidth, 8, "F");

  // اسم المنصة
  addArabicText("م. سارة", pageWidth - margin, 25, { align: "right", fontSize: 28, color: [255, 255, 255], bold: true });
  addArabicText("خبيرة التصميم المعماري والبيئي", pageWidth - margin, 38, { align: "right", fontSize: 13, color: [255, 240, 200] });
  addArabicText("بالذكاء الاصطناعي", pageWidth - margin, 47, { align: "right", fontSize: 11, color: [255, 240, 200] });

  // عنوان التقرير
  doc.setFillColor(250, 245, 235);
  doc.rect(0, 68, pageWidth, pageHeight - 68, "F");

  addArabicText("تقرير التصميم الداخلي الاحترافي", pageWidth / 2, 90, { align: "center", fontSize: 20, color: GOLD, bold: true });

  // خط فاصل ذهبي
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, 95, pageWidth - margin, 95);

  // معلومات المشروع
  const styleName = STYLE_NAMES[project.designStyle] || project.designStyle;
  const spaceName = SPACE_NAMES[project.spaceType || ""] || project.spaceType || "—";

  const infoY = 110;
  const col1X = pageWidth - margin;
  const col2X = pageWidth / 2 + 10;

  addArabicText("معلومات المشروع", col1X, infoY, { align: "right", fontSize: 14, color: GOLD, bold: true });

  const infoItems = [
    ["اسم المشروع", project.name],
    ["نمط التصميم", styleName],
    ["نوع الفضاء", spaceName],
    ["المساحة", project.area ? `${project.area} م²` : "—"],
    ["تاريخ التقرير", new Date().toLocaleDateString("ar-SA")],
  ];

  infoItems.forEach((item, i) => {
    const y = infoY + 12 + i * 10;
    addArabicText(`${item[0]}:`, col1X, y, { align: "right", fontSize: 11, color: DARK });
    addArabicText(item[1] || "—", col2X, y, { align: "right", fontSize: 11, color: [100, 80, 40] });
  });

  // التكلفة التقديرية في مربع بارز
  if (project.totalCostMin && project.totalCostMax) {
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.roundedRect(margin, 170, pageWidth - margin * 2, 30, 3, 3, "F");
    addArabicText("التكلفة التقديرية الإجمالية", pageWidth - margin - 5, 183, { align: "right", fontSize: 12, color: [255, 255, 255] });
    addArabicText(
      `${project.totalCostMin.toLocaleString("ar-SA")} — ${project.totalCostMax.toLocaleString("ar-SA")} ريال سعودي`,
      pageWidth / 2,
      190,
      { align: "center", fontSize: 14, color: [255, 255, 255], bold: true }
    );
  }

  // ===== صفحة 2: التحليل والتوصيات =====
  doc.addPage();
  doc.setFillColor(250, 245, 235);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // هيدر الصفحة
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, pageWidth, 18, "F");
  addArabicText("تحليل الفضاء والتوصيات", pageWidth - margin, 12, { align: "right", fontSize: 13, color: [255, 255, 255], bold: true });
  addArabicText("م. سارة | خبيرة التصميم المعماري والبيئي", margin + 5, 12, { align: "left", fontSize: 9, color: [255, 240, 200] });

  let currentY = 30;

  if (project.analysisResult) {
    const ar = project.analysisResult;

    if (ar.spaceDescription) {
      addArabicText("وصف الفضاء", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
      currentY += 7;
      doc.setFillColor(255, 250, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 2, 2, "F");
      addArabicText(ar.spaceDescription.substring(0, 120), pageWidth - margin - 3, currentY + 8, { align: "right", fontSize: 9, color: DARK });
      currentY += 25;
    }

    if (ar.recommendations && ar.recommendations.length > 0) {
      addArabicText("توصيات م. سارة", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
      currentY += 8;
      ar.recommendations.slice(0, 5).forEach((rec, i) => {
        doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 250 : 244, i % 2 === 0 ? 240 : 230);
        doc.rect(margin, currentY - 5, pageWidth - margin * 2, 9, "F");
        addArabicText(`${i + 1}. ${rec.substring(0, 90)}`, pageWidth - margin - 3, currentY + 1, { align: "right", fontSize: 9, color: DARK });
        currentY += 10;
      });
      currentY += 5;
    }
  }

  // ===== صفحة 3: لوحة الألوان والمواد =====
  doc.addPage();
  doc.setFillColor(250, 245, 235);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, pageWidth, 18, "F");
  addArabicText("لوحة الألوان والمواد المقترحة", pageWidth - margin, 12, { align: "right", fontSize: 13, color: [255, 255, 255], bold: true });

  currentY = 30;

  // لوحة الألوان
  if (project.colorPalette && project.colorPalette.length > 0) {
    addArabicText("لوحة الألوان", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
    currentY += 10;

    const colorBoxSize = 18;
    const colorsPerRow = 5;
    const colorSpacing = (pageWidth - margin * 2) / colorsPerRow;

    project.colorPalette.slice(0, 6).forEach((color, i) => {
      const col = i % colorsPerRow;
      const row = Math.floor(i / colorsPerRow);
      const x = margin + col * colorSpacing + colorSpacing / 2 - colorBoxSize / 2;
      const y = currentY + row * 35;

      // مربع اللون
      const hex = color.hex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(200, 180, 150);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, colorBoxSize, colorBoxSize, 2, 2, "FD");

      // اسم اللون
      addArabicText(color.name || color.hex, x + colorBoxSize / 2, y + colorBoxSize + 5, { align: "center", fontSize: 7, color: DARK });
      addArabicText(color.hex, x + colorBoxSize / 2, y + colorBoxSize + 10, { align: "center", fontSize: 6, color: [150, 130, 100] });
    });
    currentY += 55;
  }

  // المواد المقترحة
  if (project.materials && project.materials.length > 0) {
    addArabicText("المواد المقترحة", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
    currentY += 8;

    const materialsData = project.materials.slice(0, 8).map((m) => [
      m.priceRange || "—",
      m.brand || "—",
      m.type || "—",
      m.name || "—",
    ]);

    autoTable(doc, {
      head: [["نطاق السعر", "الماركة", "النوع", "المادة"]],
      body: materialsData,
      startY: currentY,
      margin: { right: margin, left: margin },
      styles: { font: "helvetica", fontSize: 9, halign: "right", cellPadding: 3 },
      headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 250, 240] },
      tableWidth: "auto",
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== صفحة 4: الأثاث وجدول التكاليف =====
  doc.addPage();
  doc.setFillColor(250, 245, 235);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, pageWidth, 18, "F");
  addArabicText("الأثاث المقترح وجدول التكاليف", pageWidth - margin, 12, { align: "right", fontSize: 13, color: [255, 255, 255], bold: true });

  currentY = 30;

  // الأثاث
  if (project.furniture && project.furniture.length > 0) {
    addArabicText("قائمة الأثاث المقترح", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
    currentY += 8;

    const furnitureData = project.furniture.slice(0, 10).map((f) => [
      f.priceRange || "—",
      f.material || "—",
      String(f.quantity || 1),
      f.name || "—",
    ]);

    autoTable(doc, {
      head: [["نطاق السعر (ر.س)", "المادة", "الكمية", "القطعة"]],
      body: furnitureData,
      startY: currentY,
      margin: { right: margin, left: margin },
      styles: { font: "helvetica", fontSize: 9, halign: "right", cellPadding: 3 },
      headStyles: { fillColor: LIGHT_GOLD, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 250, 240] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // جدول التكاليف التفصيلي
  if (project.costEstimate?.breakdown) {
    addArabicText("توزيع التكاليف التفصيلي", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
    currentY += 8;

    const costLabels: Record<string, string> = {
      furniture: "الأثاث",
      flooring: "الأرضيات",
      walls: "الجدران والدهان",
      ceiling: "الأسقف",
      lighting: "الإضاءة",
      curtains: "الستائر والمفروشات",
      labor: "أعمال التركيب والعمالة",
    };

    const breakdown = project.costEstimate.breakdown;
    const costData = Object.entries(breakdown)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => {
        const total = project.totalCostMin || 1;
        const pct = Math.round(((v as number) / total) * 100);
        return [`${pct}%`, `${(v as number).toLocaleString("ar-SA")} ر.س`, costLabels[k] || k];
      });

    autoTable(doc, {
      head: [["النسبة", "التكلفة التقديرية", "البند"]],
      body: costData,
      startY: currentY,
      margin: { right: margin, left: margin },
      styles: { font: "helvetica", fontSize: 10, halign: "right", cellPadding: 4 },
      headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 250, 240] },
      foot: [["100%", `${(project.totalCostMin || 0).toLocaleString("ar-SA")} — ${(project.totalCostMax || 0).toLocaleString("ar-SA")} ر.س`, "الإجمالي"]],
      footStyles: { fillColor: DARK, textColor: [255, 240, 200], fontStyle: "bold" },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // الجدول الزمني ونصائح التوفير
  if (project.costEstimate?.timeline) {
    doc.setFillColor(BEIGE[0], BEIGE[1], BEIGE[2]);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, "F");
    addArabicText(`الجدول الزمني المقدّر: ${project.costEstimate.timeline}`, pageWidth - margin - 3, currentY + 8, {
      align: "right", fontSize: 10, color: DARK, bold: true,
    });
    currentY += 18;
  }

  // ===== صفحة 5: الخاتمة والتوقيع =====
  doc.addPage();
  doc.setFillColor(250, 245, 235);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // هيدر ذهبي
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, pageWidth, 18, "F");
  addArabicText("ملاحظات ختامية", pageWidth - margin, 12, { align: "right", fontSize: 13, color: [255, 255, 255], bold: true });

  currentY = 35;

  if (project.costEstimate?.savingTips && project.costEstimate.savingTips.length > 0) {
    addArabicText("نصائح لتوفير التكاليف", pageWidth - margin, currentY, { align: "right", fontSize: 13, color: GOLD, bold: true });
    currentY += 10;

    project.costEstimate.savingTips.slice(0, 5).forEach((tip, i) => {
      doc.setFillColor(255, 250, 240);
      doc.roundedRect(margin, currentY - 4, pageWidth - margin * 2, 10, 1, 1, "F");
      doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.circle(pageWidth - margin - 3, currentY + 1, 2, "F");
      addArabicText(`${tip.substring(0, 100)}`, pageWidth - margin - 8, currentY + 2, { align: "right", fontSize: 9, color: DARK });
      currentY += 13;
    });
    currentY += 10;
  }

  // توقيع م. سارة
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 45, 4, 4, "F");
  addArabicText("م. سارة", pageWidth / 2, currentY + 15, { align: "center", fontSize: 18, color: [255, 255, 255], bold: true });
  addArabicText("خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي", pageWidth / 2, currentY + 25, { align: "center", fontSize: 10, color: [255, 240, 200] });
  addArabicText("هذا التقرير مولّد بالذكاء الاصطناعي ويُعدّ مرجعاً تقديرياً", pageWidth / 2, currentY + 35, { align: "center", fontSize: 8, color: [255, 235, 180] });

  // فوتر كل الصفحات
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    addArabicText(`صفحة ${i} من ${totalPages}`, pageWidth / 2, pageHeight - 3, { align: "center", fontSize: 8, color: [255, 255, 255] });
    addArabicText("م. سارة | sarahdesign.manus.space", margin, pageHeight - 3, { align: "left", fontSize: 7, color: [255, 240, 200] });
  }

  // حفظ الملف
  const fileName = `تقرير-${project.name}-${new Date().toLocaleDateString("ar-SA").replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
}
