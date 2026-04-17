/**
 * PDF Report Generator — HTML-based approach for proper Arabic/English rendering
 * Uses window.print() with a hidden iframe to render HTML with Google Fonts (Tajawal + Inter)
 */

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

const STYLE_NAMES_AR: Record<string, string> = {
  modern: "عصري", gulf: "خليجي", classical: "كلاسيكي", minimal: "مينيمال",
  japanese: "ياباني", moroccan: "مغربي", mediterranean: "متوسطي",
  scandinavian: "إسكندنافي", industrial: "صناعي", bohemian: "بوهيمي",
  art_deco: "آرت ديكو", bauhaus: "باوهاوس", chinese: "صيني",
  indian: "هندي", french: "فرنسي", italian: "إيطالي",
};

const STYLE_NAMES_EN: Record<string, string> = {
  modern: "Modern", gulf: "Gulf", classical: "Classical", minimal: "Minimal",
  japanese: "Japanese", moroccan: "Moroccan", mediterranean: "Mediterranean",
  scandinavian: "Scandinavian", industrial: "Industrial", bohemian: "Bohemian",
  art_deco: "Art Deco", bauhaus: "Bauhaus", chinese: "Chinese",
  indian: "Indian", french: "French", italian: "Italian",
};

const SPACE_NAMES_AR: Record<string, string> = {
  living_room: "غرفة المعيشة", bedroom: "غرفة النوم", kitchen: "المطبخ",
  bathroom: "الحمام", dining_room: "غرفة الطعام", office: "المكتب",
  kids_room: "غرفة الأطفال", master_bedroom: "غرفة النوم الرئيسية",
  entrance: "المدخل", villa: "فيلا", apartment: "شقة",
};

const SPACE_NAMES_EN: Record<string, string> = {
  living_room: "Living Room", bedroom: "Bedroom", kitchen: "Kitchen",
  bathroom: "Bathroom", dining_room: "Dining Room", office: "Office",
  kids_room: "Kids Room", master_bedroom: "Master Bedroom",
  entrance: "Entrance", villa: "Villa", apartment: "Apartment",
};

const COST_LABELS_AR: Record<string, string> = {
  furniture: "الأثاث", flooring: "الأرضيات", walls: "الجدران والدهان",
  ceiling: "الأسقف", lighting: "الإضاءة", curtains: "الستائر والمفروشات",
  labor: "أعمال التركيب والعمالة",
};

const COST_LABELS_EN: Record<string, string> = {
  furniture: "Furniture", flooring: "Flooring", walls: "Walls & Paint",
  ceiling: "Ceiling", lighting: "Lighting", curtains: "Curtains & Soft Furnishings",
  labor: "Installation & Labor",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US");
}

function buildHTML(project: ProjectData): string {
  const styleAr = STYLE_NAMES_AR[project.designStyle] || project.designStyle;
  const styleEn = STYLE_NAMES_EN[project.designStyle] || project.designStyle;
  const spaceAr = SPACE_NAMES_AR[project.spaceType || ""] || project.spaceType || "—";
  const spaceEn = SPACE_NAMES_EN[project.spaceType || ""] || project.spaceType || "—";
  const dateAr = new Date().toLocaleDateString("ar-SA");
  const dateEn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const colorsHTML = project.colorPalette?.slice(0, 6).map(c => `
    <div class="color-item">
      <div class="color-swatch" style="background:${c.hex}"></div>
      <div class="color-name">${c.name || c.hex}</div>
      <div class="color-hex">${c.hex}</div>
    </div>
  `).join("") || "";

  const materialsRowsAr = project.materials?.slice(0, 8).map(m => `
    <tr>
      <td>${m.name || "—"}</td>
      <td>${m.type || "—"}</td>
      <td>${m.brand || "—"}</td>
      <td>${m.priceRange || "—"}</td>
    </tr>
  `).join("") || "";

  const materialsRowsEn = project.materials?.slice(0, 8).map(m => `
    <tr>
      <td>${m.name || "—"}</td>
      <td>${m.type || "—"}</td>
      <td>${m.brand || "—"}</td>
      <td>${m.priceRange || "—"}</td>
    </tr>
  `).join("") || "";

  const furnitureRowsAr = project.furniture?.slice(0, 10).map(f => `
    <tr>
      <td>${f.name || "—"}</td>
      <td>${f.quantity || 1}</td>
      <td>${f.material || "—"}</td>
      <td>${f.priceRange || "—"}</td>
    </tr>
  `).join("") || "";

  const furnitureRowsEn = project.furniture?.slice(0, 10).map(f => `
    <tr>
      <td>${f.name || "—"}</td>
      <td>${f.quantity || 1}</td>
      <td>${f.material || "—"}</td>
      <td>${f.priceRange || "—"}</td>
    </tr>
  `).join("") || "";

  const costRowsAr = project.costEstimate?.breakdown
    ? Object.entries(project.costEstimate.breakdown)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => {
          const total = project.totalCostMin || 1;
          const pct = Math.round(((v as number) / total) * 100);
          return `<tr>
            <td>${COST_LABELS_AR[k] || k}</td>
            <td>${formatCurrency(v as number)} ر.س</td>
            <td>${pct}%</td>
          </tr>`;
        }).join("")
    : "";

  const costRowsEn = project.costEstimate?.breakdown
    ? Object.entries(project.costEstimate.breakdown)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => {
          const total = project.totalCostMin || 1;
          const pct = Math.round(((v as number) / total) * 100);
          return `<tr>
            <td>${COST_LABELS_EN[k] || k}</td>
            <td>SAR ${formatCurrency(v as number)}</td>
            <td>${pct}%</td>
          </tr>`;
        }).join("")
    : "";

  const recommendationsAr = project.analysisResult?.recommendations?.slice(0, 5).map((r, i) => `
    <div class="rec-item"><span class="rec-num">${i + 1}</span><span>${r}</span></div>
  `).join("") || "";

  const recommendationsEn = project.analysisResult?.recommendations?.slice(0, 5).map((r, i) => `
    <div class="rec-item"><span class="rec-num">${i + 1}</span><span>${r}</span></div>
  `).join("") || "";

  const savingTipsAr = project.costEstimate?.savingTips?.slice(0, 5).map(t => `
    <li>${t}</li>
  `).join("") || "";

  const savingTipsEn = project.costEstimate?.savingTips?.slice(0, 5).map(t => `
    <li>${t}</li>
  `).join("") || "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Design Report — ${project.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e140a; }

  /* ===== Page Layout ===== */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    page-break-after: always;
    position: relative;
    background: #faf5eb;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }

  /* ===== Header ===== */
  .page-header {
    background: #b8860b;
    color: white;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .page-header .ar { font-family: 'Tajawal', sans-serif; font-size: 13px; font-weight: 700; }
  .page-header .en { font-size: 11px; font-weight: 500; opacity: 0.85; }

  /* ===== Cover Page ===== */
  .cover-hero {
    background: linear-gradient(135deg, #b8860b 0%, #8b6508 60%, #5c4205 100%);
    padding: 40px 30px 30px;
    text-align: center;
    color: white;
  }
  .cover-hero .brand-ar { font-family: 'Tajawal', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 1px; }
  .cover-hero .brand-en { font-size: 14px; font-weight: 500; opacity: 0.8; margin-top: 4px; }
  .cover-hero .tagline-ar { font-family: 'Tajawal', sans-serif; font-size: 13px; opacity: 0.85; margin-top: 6px; }
  .cover-hero .tagline-en { font-size: 11px; opacity: 0.7; margin-top: 2px; }

  .cover-body { padding: 25px 30px; }

  .report-title {
    text-align: center;
    margin-bottom: 20px;
  }
  .report-title .title-ar { font-family: 'Tajawal', sans-serif; font-size: 22px; font-weight: 700; color: #b8860b; }
  .report-title .title-en { font-size: 14px; color: #8b6508; margin-top: 4px; font-weight: 600; }

  .divider { height: 2px; background: linear-gradient(90deg, transparent, #b8860b, transparent); margin: 15px 0; }

  /* ===== Info Grid ===== */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 15px 0;
  }
  .info-card {
    background: white;
    border-radius: 8px;
    padding: 12px 15px;
    border-right: 3px solid #b8860b;
  }
  .info-card .label-ar { font-family: 'Tajawal', sans-serif; font-size: 10px; color: #8b6508; font-weight: 500; }
  .info-card .label-en { font-size: 9px; color: #aaa; }
  .info-card .value-ar { font-family: 'Tajawal', sans-serif; font-size: 14px; font-weight: 700; color: #1e140a; margin-top: 3px; }
  .info-card .value-en { font-size: 12px; font-weight: 600; color: #333; }

  /* ===== Cost Banner ===== */
  .cost-banner {
    background: linear-gradient(135deg, #b8860b, #d4af37);
    border-radius: 10px;
    padding: 18px 20px;
    text-align: center;
    color: white;
    margin: 20px 0;
  }
  .cost-banner .label-ar { font-family: 'Tajawal', sans-serif; font-size: 12px; opacity: 0.9; }
  .cost-banner .label-en { font-size: 10px; opacity: 0.75; margin-bottom: 6px; }
  .cost-banner .amount { font-size: 22px; font-weight: 700; margin: 4px 0; }
  .cost-banner .amount-ar { font-family: 'Tajawal', sans-serif; font-size: 14px; opacity: 0.85; }

  /* ===== Section Title ===== */
  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0 12px;
  }
  .section-title .bar { width: 4px; height: 22px; background: #b8860b; border-radius: 2px; }
  .section-title .title-ar { font-family: 'Tajawal', sans-serif; font-size: 15px; font-weight: 700; color: #b8860b; }
  .section-title .title-en { font-size: 11px; color: #8b6508; margin-top: 1px; }

  /* ===== Content Area ===== */
  .content { padding: 20px 25px; }

  /* ===== Description Box ===== */
  .desc-box {
    background: white;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #e8d9b0;
    margin-bottom: 15px;
  }
  .desc-box .text-ar { font-family: 'Tajawal', sans-serif; font-size: 11px; line-height: 1.8; color: #333; direction: rtl; text-align: right; }
  .desc-box .text-en { font-size: 10px; line-height: 1.6; color: #555; margin-top: 8px; border-top: 1px solid #f0e8d0; padding-top: 8px; }

  /* ===== Recommendations ===== */
  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    background: white;
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid #f0e8d0;
  }
  .rec-item .rec-num {
    background: #b8860b;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .rec-item span:last-child { font-family: 'Tajawal', sans-serif; font-size: 10px; line-height: 1.6; direction: rtl; text-align: right; }
  .rec-item.en span:last-child { font-family: 'Inter', sans-serif; direction: ltr; text-align: left; font-size: 10px; }

  /* ===== Colors ===== */
  .colors-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 10px 0;
  }
  .color-item { text-align: center; }
  .color-swatch {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    border: 2px solid #e8d9b0;
    margin: 0 auto 4px;
  }
  .color-name { font-family: 'Tajawal', sans-serif; font-size: 9px; color: #333; }
  .color-hex { font-size: 8px; color: #999; }

  /* ===== Tables ===== */
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
  thead tr { background: #b8860b; color: white; }
  thead th { padding: 8px 10px; font-weight: 600; }
  thead th.ar { font-family: 'Tajawal', sans-serif; font-size: 11px; }
  tbody tr:nth-child(even) { background: #fff8ee; }
  tbody tr:nth-child(odd) { background: white; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f0e8d0; }
  tbody td.ar { font-family: 'Tajawal', sans-serif; font-size: 11px; }
  tfoot tr { background: #1e140a; color: #ffd700; font-weight: 700; }
  tfoot td { padding: 8px 10px; }
  tfoot td.ar { font-family: 'Tajawal', sans-serif; }

  /* ===== Bilingual Row ===== */
  .bilingual-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 10px 0;
  }
  .lang-block { }
  .lang-label {
    font-size: 9px;
    font-weight: 700;
    color: #b8860b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e8d9b0;
  }

  /* ===== Saving Tips ===== */
  .tips-list { padding-right: 15px; }
  .tips-list li { font-family: 'Tajawal', sans-serif; font-size: 10px; line-height: 1.7; color: #333; margin-bottom: 5px; direction: rtl; }
  .tips-list.en li { font-family: 'Inter', sans-serif; direction: ltr; padding-right: 0; padding-left: 15px; }

  /* ===== Footer Signature ===== */
  .signature-box {
    background: linear-gradient(135deg, #b8860b, #8b6508);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    color: white;
    margin: 20px 0;
  }
  .signature-box .name-ar { font-family: 'Tajawal', sans-serif; font-size: 24px; font-weight: 800; }
  .signature-box .name-en { font-size: 14px; font-weight: 600; opacity: 0.9; margin-top: 2px; }
  .signature-box .sub-ar { font-family: 'Tajawal', sans-serif; font-size: 11px; opacity: 0.85; margin-top: 6px; }
  .signature-box .sub-en { font-size: 10px; opacity: 0.75; margin-top: 2px; }
  .signature-box .disclaimer { font-size: 9px; opacity: 0.65; margin-top: 10px; }

  /* ===== Page Footer ===== */
  .page-footer {
    background: #b8860b;
    color: white;
    padding: 6px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .page-footer .ar { font-family: 'Tajawal', sans-serif; }

  /* ===== Print ===== */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>

<!-- ===== PAGE 1: COVER ===== -->
<div class="page">
  <div class="cover-hero">
    <div class="brand-ar">م. اليازية | فضاء</div>
    <div class="brand-en">Sarah AI | Fadaa Platform</div>
    <div class="tagline-ar">خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي</div>
    <div class="tagline-en">AI-Powered Architectural & Environmental Design Expert</div>
  </div>

  <div class="cover-body">
    <div class="report-title">
      <div class="title-ar">تقرير التصميم الاحترافي</div>
      <div class="title-en">Professional Design Report</div>
    </div>
    <div class="divider"></div>

    <div class="info-grid">
      <div class="info-card">
        <div class="label-ar">اسم المشروع</div>
        <div class="label-en">Project Name</div>
        <div class="value-ar">${project.name}</div>
        <div class="value-en">${project.name}</div>
      </div>
      <div class="info-card">
        <div class="label-ar">نمط التصميم</div>
        <div class="label-en">Design Style</div>
        <div class="value-ar">${styleAr}</div>
        <div class="value-en">${styleEn}</div>
      </div>
      <div class="info-card">
        <div class="label-ar">نوع الفضاء</div>
        <div class="label-en">Space Type</div>
        <div class="value-ar">${spaceAr}</div>
        <div class="value-en">${spaceEn}</div>
      </div>
      <div class="info-card">
        <div class="label-ar">المساحة</div>
        <div class="label-en">Area</div>
        <div class="value-ar">${project.area ? `${project.area} م²` : "—"}</div>
        <div class="value-en">${project.area ? `${project.area} m²` : "—"}</div>
      </div>
      <div class="info-card">
        <div class="label-ar">تاريخ التقرير</div>
        <div class="label-en">Report Date</div>
        <div class="value-ar">${dateAr}</div>
        <div class="value-en">${dateEn}</div>
      </div>
    </div>

    ${project.totalCostMin && project.totalCostMax ? `
    <div class="cost-banner">
      <div class="label-ar">التكلفة التقديرية الإجمالية</div>
      <div class="label-en">Total Estimated Cost</div>
      <div class="amount">${formatCurrency(project.totalCostMin)} — ${formatCurrency(project.totalCostMax)}</div>
      <div class="amount-ar">ريال سعودي | SAR</div>
    </div>
    ` : ""}
  </div>

  <div class="page-footer">
    <span>fada.mousa.ai</span>
    <span class="ar">م. اليازية | خبيرة التصميم المعماري والبيئي</span>
    <span>Page 1</span>
  </div>
</div>

<!-- ===== PAGE 2: ANALYSIS & RECOMMENDATIONS ===== -->
<div class="page">
  <div class="page-header">
    <span class="en">Space Analysis & Recommendations</span>
    <span class="ar">تحليل الفضاء والتوصيات</span>
  </div>

  <div class="content">
    ${project.analysisResult?.spaceDescription ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">وصف الفضاء</div>
        <div class="title-en">Space Description</div>
      </div>
    </div>
    <div class="desc-box">
      <div class="text-ar">${project.analysisResult.spaceDescription}</div>
    </div>
    ` : ""}

    ${recommendationsAr ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">توصيات م. اليازية</div>
        <div class="title-en">Sarah's Recommendations</div>
      </div>
    </div>
    <div class="bilingual-section">
      <div class="lang-block">
        <div class="lang-label">العربية</div>
        ${recommendationsAr}
      </div>
      <div class="lang-block">
        <div class="lang-label">English</div>
        ${recommendationsEn.replace(/rec-item/g, "rec-item en")}
      </div>
    </div>
    ` : ""}

    ${project.analysisResult?.styleDescription ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">وصف الأسلوب التصميمي</div>
        <div class="title-en">Design Style Description</div>
      </div>
    </div>
    <div class="desc-box">
      <div class="text-ar">${project.analysisResult.styleDescription}</div>
    </div>
    ` : ""}
  </div>

  <div class="page-footer">
    <span>fada.mousa.ai</span>
    <span class="ar">م. اليازية | تحليل الفضاء</span>
    <span>Page 2</span>
  </div>
</div>

<!-- ===== PAGE 3: COLORS & MATERIALS ===== -->
<div class="page">
  <div class="page-header">
    <span class="en">Color Palette & Proposed Materials</span>
    <span class="ar">لوحة الألوان والمواد المقترحة</span>
  </div>

  <div class="content">
    ${colorsHTML ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">لوحة الألوان</div>
        <div class="title-en">Color Palette</div>
      </div>
    </div>
    <div class="colors-grid">${colorsHTML}</div>
    ` : ""}

    ${materialsRowsAr ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">المواد المقترحة</div>
        <div class="title-en">Proposed Materials</div>
      </div>
    </div>
    <div class="bilingual-section">
      <div class="lang-block">
        <div class="lang-label">العربية</div>
        <table>
          <thead><tr>
            <th class="ar">المادة</th><th class="ar">النوع</th><th class="ar">الماركة</th><th class="ar">السعر</th>
          </tr></thead>
          <tbody>${materialsRowsAr}</tbody>
        </table>
      </div>
      <div class="lang-block">
        <div class="lang-label">English</div>
        <table>
          <thead><tr>
            <th>Material</th><th>Type</th><th>Brand</th><th>Price</th>
          </tr></thead>
          <tbody>${materialsRowsEn}</tbody>
        </table>
      </div>
    </div>
    ` : ""}
  </div>

  <div class="page-footer">
    <span>fada.mousa.ai</span>
    <span class="ar">م. اليازية | الألوان والمواد</span>
    <span>Page 3</span>
  </div>
</div>

<!-- ===== PAGE 4: FURNITURE & COSTS ===== -->
<div class="page">
  <div class="page-header">
    <span class="en">Furniture List & Cost Breakdown (BOQ)</span>
    <span class="ar">قائمة الأثاث وجدول التكاليف (BOQ)</span>
  </div>

  <div class="content">
    ${furnitureRowsAr ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">قائمة الأثاث المقترح</div>
        <div class="title-en">Proposed Furniture List</div>
      </div>
    </div>
    <div class="bilingual-section">
      <div class="lang-block">
        <div class="lang-label">العربية</div>
        <table>
          <thead><tr>
            <th class="ar">القطعة</th><th class="ar">الكمية</th><th class="ar">المادة</th><th class="ar">السعر</th>
          </tr></thead>
          <tbody>${furnitureRowsAr}</tbody>
        </table>
      </div>
      <div class="lang-block">
        <div class="lang-label">English</div>
        <table>
          <thead><tr>
            <th>Item</th><th>Qty</th><th>Material</th><th>Price</th>
          </tr></thead>
          <tbody>${furnitureRowsEn}</tbody>
        </table>
      </div>
    </div>
    ` : ""}

    ${costRowsAr ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">توزيع التكاليف التفصيلي</div>
        <div class="title-en">Detailed Cost Breakdown</div>
      </div>
    </div>
    <div class="bilingual-section">
      <div class="lang-block">
        <div class="lang-label">العربية</div>
        <table>
          <thead><tr><th class="ar">البند</th><th class="ar">التكلفة</th><th class="ar">النسبة</th></tr></thead>
          <tbody>${costRowsAr}</tbody>
          ${project.totalCostMin && project.totalCostMax ? `
          <tfoot><tr>
            <td class="ar">الإجمالي</td>
            <td class="ar">${formatCurrency(project.totalCostMin)} — ${formatCurrency(project.totalCostMax)} ر.س</td>
            <td>100%</td>
          </tr></tfoot>` : ""}
        </table>
      </div>
      <div class="lang-block">
        <div class="lang-label">English</div>
        <table>
          <thead><tr><th>Item</th><th>Cost</th><th>%</th></tr></thead>
          <tbody>${costRowsEn}</tbody>
          ${project.totalCostMin && project.totalCostMax ? `
          <tfoot><tr>
            <td>Total</td>
            <td>SAR ${formatCurrency(project.totalCostMin)} — ${formatCurrency(project.totalCostMax)}</td>
            <td>100%</td>
          </tr></tfoot>` : ""}
        </table>
      </div>
    </div>
    ` : ""}

    ${project.costEstimate?.timeline ? `
    <div class="desc-box" style="margin-top:15px">
      <div class="text-ar">الجدول الزمني المقدّر: ${project.costEstimate.timeline}</div>
      <div class="text-en">Estimated Timeline: ${project.costEstimate.timeline}</div>
    </div>
    ` : ""}
  </div>

  <div class="page-footer">
    <span>fada.mousa.ai</span>
    <span class="ar">م. اليازية | الأثاث والتكاليف</span>
    <span>Page 4</span>
  </div>
</div>

<!-- ===== PAGE 5: CLOSING ===== -->
<div class="page">
  <div class="page-header">
    <span class="en">Closing Notes & Recommendations</span>
    <span class="ar">ملاحظات ختامية وتوصيات</span>
  </div>

  <div class="content">
    ${savingTipsAr ? `
    <div class="section-title">
      <div class="bar"></div>
      <div>
        <div class="title-ar">نصائح لتوفير التكاليف</div>
        <div class="title-en">Cost-Saving Tips</div>
      </div>
    </div>
    <div class="bilingual-section">
      <div class="lang-block">
        <div class="lang-label">العربية</div>
        <ul class="tips-list">${savingTipsAr}</ul>
      </div>
      <div class="lang-block">
        <div class="lang-label">English</div>
        <ul class="tips-list en">${savingTipsEn}</ul>
      </div>
    </div>
    ` : ""}

    <div class="signature-box" style="margin-top: 30px;">
      <div class="name-ar">م. اليازية | فضاء</div>
      <div class="name-en">Sarah AI | Fadaa Platform</div>
      <div class="sub-ar">خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي</div>
      <div class="sub-en">AI-Powered Architectural & Environmental Design Expert</div>
      <div class="disclaimer">
        هذا التقرير مولّد بالذكاء الاصطناعي ويُعدّ مرجعاً تقديرياً — 2025-2026 ©<br>
        This report is AI-generated and serves as an estimative reference — © 2025-2026
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>fada.mousa.ai</span>
    <span class="ar">م. اليازية | الخاتمة</span>
    <span>Page 5</span>
  </div>
</div>

</body>
</html>`;
}

export async function generatePDFReport(project: ProjectData): Promise<void> {
  const html = buildHTML(project);

  // Create hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  iframe.contentWindow?.print();

  // Cleanup after print dialog closes
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
}
