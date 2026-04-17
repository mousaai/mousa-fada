/**
 * pdf.routes.ts — Server-side PDF generation using weasyprint
 * يولد دفتر التصميم PDF على السيرفر ويُرسله للمستخدم
 * يعمل على iOS Safari وجميع المتصفحات بدون مشاكل CORS أو html2canvas
 */

import type { Express, Request, Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { nanoid } from "nanoid";

const execFileAsync = promisify(execFile);

// ─── HTML Template Builder ────────────────────────────────────────────────────

interface PaletteColor {
  hex: string;
  name: string;
}

interface ReplacementCost {
  item: string;
  currentEstimate: string;
  replacementCost: string;
  notes: string;
}

interface BOQItem {
  name: string;
  unit: string;
  qty: number;
  unitPriceMin: number;
  unitPriceMax: number;
  totalMin: number;
  totalMax: number;
}

interface BOQCategory {
  category: string;
  icon?: string;
  subtotalMin: number;
  subtotalMax: number;
  items: BOQItem[];
}

interface BOQData {
  area: number;
  perimeter: number;
  grandTotalMin: number;
  grandTotalMax: number;
  disclaimer?: string;
  categories: BOQCategory[];
}

interface DesignIdeaForPDF {
  title: string;
  styleLabel: string;
  scenarioLabel?: string;
  description: string;
  estimatedCost: string;
  timeline?: string;
  palette: PaletteColor[];
  materials: string[];
  highlights: string[];
  replacementCosts?: ReplacementCost[];
  boq?: BOQData;
  imageUrl?: string;
}

function buildPDFHtml(idea: DesignIdeaForPDF, spaceType?: string, imageBase64?: string): string {
  const gold = "#C9A84C";
  const darkBrown = "#5C3D11";
  const lightBg = "#faf6f0";
  const white = "#ffffff";
  const emerald = "#107C5A";
  const today = new Date().toLocaleDateString("ar-AE");

  const paletteSwatches = idea.palette.map(c => `
    <div style="display:inline-block;text-align:center;margin:0 5px;">
      <div style="width:52px;height:30px;background:${c.hex};border-radius:6px;border:1px solid #d4b87a;"></div>
      <div style="font-size:9px;color:${darkBrown};margin-top:3px;">${c.name}</div>
    </div>`).join("");

  const imgTag = imageBase64
    ? `<img src="${imageBase64}" style="width:100%;height:320px;object-fit:cover;border-radius:8px;border:3px solid ${gold};display:block;margin-bottom:14px;" />`
    : `<div style="width:100%;height:320px;background:linear-gradient(135deg,${gold},${darkBrown});border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><span style="color:white;font-size:18px;font-weight:bold;">صورة التصميم</span></div>`;

  const highlightsHtml = idea.highlights.map(h => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #e8f5ee;">
      <div style="width:7px;height:7px;background:${emerald};border-radius:50%;flex-shrink:0;margin-top:3px;"></div>
      <span style="font-size:10px;color:#503c1e;">${h}</span>
    </div>`).join("");

  const replacementHtml = idea.replacementCosts && idea.replacementCosts.length > 0 ? `
    <h2 style="font-size:16px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 5px;">تكاليف الاستبدال التفصيلية</h2>
    <hr style="border:none;border-top:1px solid ${gold};margin:0 0 12px;" />
    <table style="width:100%;border-collapse:collapse;font-size:9px;">
      <thead>
        <tr style="background:${darkBrown};">
          <th style="padding:6px 8px;color:${white};text-align:right;">البند</th>
          <th style="padding:6px 8px;color:${white};text-align:center;">التقدير الحالي</th>
          <th style="padding:6px 8px;color:${white};text-align:center;">تكلفة الاستبدال</th>
          <th style="padding:6px 8px;color:${white};text-align:right;">ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${idea.replacementCosts.map((r, i) => `
        <tr style="background:${i % 2 === 0 ? white : "#f5f0e8"};">
          <td style="padding:5px 8px;border-bottom:1px solid #e8d9c0;">${r.item}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e8d9c0;text-align:center;">${r.currentEstimate}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e8d9c0;text-align:center;">${r.replacementCost}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e8d9c0;font-size:8px;">${r.notes}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : "";

  const boqHtml = idea.boq && idea.boq.categories.length > 0 ? `
    <div style="page-break-before:always;background:${lightBg};padding:0;">
      <div style="background:${gold};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${white};font-size:11px;font-weight:bold;">م. اليازية | جدول الكميات BOQ</span>
        <span style="color:${white};font-size:11px;font-weight:bold;">${idea.title}</span>
      </div>
      <div style="padding:16px 24px;">
        <h2 style="font-size:16px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 4px;">جدول الكميات والمواصفات (BOQ)</h2>
        <p style="font-size:9px;color:#888;text-align:center;margin:0 0 12px;">الفضاء: ${spaceType || "غير محدد"} | المساحة: ${idea.boq.area} م² | المحيط: ${idea.boq.perimeter} م</p>
        ${idea.boq.categories.map(cat => `
          <div style="margin-bottom:12px;">
            <div style="background:${darkBrown};padding:6px 10px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:${white};font-size:10px;font-weight:bold;">${cat.icon || ""} ${cat.category}</span>
              <span style="color:${gold};font-size:9px;font-weight:bold;">${cat.subtotalMin.toLocaleString()} – ${cat.subtotalMax.toLocaleString()} د.إ</span>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#e8f5ee;">
                  <th style="padding:5px 8px;font-size:9px;color:${darkBrown};text-align:right;">البند</th>
                  <th style="padding:5px 8px;font-size:9px;color:${darkBrown};text-align:center;">الوحدة</th>
                  <th style="padding:5px 8px;font-size:9px;color:${darkBrown};text-align:center;">الكمية</th>
                  <th style="padding:5px 8px;font-size:9px;color:${darkBrown};text-align:center;">سعر الوحدة (د.إ)</th>
                  <th style="padding:5px 8px;font-size:9px;color:${darkBrown};text-align:center;">الإجمالي (د.إ)</th>
                </tr>
              </thead>
              <tbody>
                ${cat.items.map((item, i) => `
                <tr style="background:${i % 2 === 0 ? white : "#f5f0e8"};">
                  <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;">${item.name}</td>
                  <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.unit}</td>
                  <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.qty}</td>
                  <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.unitPriceMin.toLocaleString()} – ${item.unitPriceMax.toLocaleString()}</td>
                  <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;font-weight:bold;text-align:center;">${item.totalMin.toLocaleString()} – ${item.totalMax.toLocaleString()}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </div>`).join("")}
        <div style="background:${emerald};border-radius:8px;padding:12px 20px;text-align:center;margin-top:14px;">
          <div style="color:${white};font-size:14px;font-weight:bold;">الإجمالي الكلي التقديري</div>
          <div style="color:${white};font-size:12px;margin-top:4px;">${idea.boq.grandTotalMin.toLocaleString()} – ${idea.boq.grandTotalMax.toLocaleString()} د.إ</div>
        </div>
        ${idea.boq.disclaimer ? `<p style="font-size:8px;color:#888;text-align:center;margin-top:10px;">${idea.boq.disclaimer}</p>` : ""}
      </div>
      <div style="background:${gold};padding:6px 20px;text-align:center;">
        <span style="color:${white};font-size:8px;">م. اليازية — جدول الكميات — ${today} | fada.mousa.ai</span>
      </div>
    </div>` : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', 'Arial', sans-serif; direction: rtl; background: ${lightBg}; }
    @page { size: A4; margin: 0; }
    .page { width: 210mm; min-height: 297mm; page-break-after: always; position: relative; background: ${lightBg}; }
    .page:last-child { page-break-after: auto; }
    .header { background: ${gold}; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
    .header span { color: ${white}; font-size: 11px; font-weight: bold; }
    .footer { background: ${gold}; padding: 6px 20px; text-align: center; }
    .footer span { color: ${white}; font-size: 8px; }
    .content { padding: 18px 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: right; }
  </style>
</head>
<body>

<!-- صفحة 1: الغلاف -->
<div class="page">
  <div style="background:${gold};padding:12px 20px;text-align:center;">
    <span style="color:${white};font-size:13px;font-weight:bold;">م. اليازية | خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي</span>
  </div>
  <div style="background:${darkBrown};height:3px;"></div>
  <div class="content">
    ${imgTag}
    <h1 style="font-size:24px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 6px;">${idea.title}</h1>
    <p style="font-size:12px;color:${gold};text-align:center;margin:0 0 10px;">${idea.styleLabel} • ${idea.scenarioLabel || ""} • ${spaceType || ""}</p>
    <hr style="border:none;border-top:1px solid ${gold};margin:0 40px 14px;" />
    <p style="font-size:11px;color:#503c1e;text-align:center;line-height:1.7;margin:0 0 16px;">${idea.description}</p>
    <div style="text-align:center;margin-bottom:14px;">
      <div style="font-size:11px;font-weight:bold;color:${darkBrown};margin-bottom:8px;">لوحة الألوان</div>
      <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:6px;">${paletteSwatches}</div>
    </div>
    <div style="background:${gold};border-radius:8px;padding:12px 20px;text-align:center;margin-top:14px;">
      <div style="color:${white};font-size:15px;font-weight:bold;">التكلفة التقديرية: ${idea.estimatedCost}</div>
      ${idea.timeline ? `<div style="color:${white};font-size:10px;margin-top:3px;">المدة الزمنية: ${idea.timeline}</div>` : ""}
    </div>
    <div style="background:${white};border-radius:8px;padding:10px 16px;margin-top:10px;border:1px solid #e8d9c0;">
      <div style="font-size:10px;font-weight:bold;color:${darkBrown};margin-bottom:6px;">المواد والتشطيبات المقترحة</div>
      <div style="column-count:2;column-gap:16px;">
        ${idea.materials.slice(0, 8).map(m => `<div style="font-size:9px;color:#503c1e;padding:2px 0;border-bottom:1px solid #f0e8d8;">• ${m}</div>`).join("")}
      </div>
    </div>
  </div>
  <div class="footer">
    <span>م. اليازية — دفتر التصميم الاحترافي — ${today} | fada.mousa.ai</span>
  </div>
</div>

<!-- صفحة 2: المزايا والتوصيات -->
<div class="page">
  <div class="header">
    <span>م. اليازية | مزايا التصميم</span>
    <span>${idea.title}</span>
  </div>
  <div class="content">
    <h2 style="font-size:16px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 5px;">مزايا ومميزات التصميم</h2>
    <hr style="border:none;border-top:1px solid ${gold};margin:0 0 12px;" />
    <div style="column-count:2;column-gap:20px;margin-bottom:20px;">${highlightsHtml}</div>
    ${replacementHtml}
    <div style="background:${white};border-radius:8px;padding:12px 16px;margin-top:16px;border:1px solid #e8d9c0;">
      <div style="font-size:11px;font-weight:bold;color:${darkBrown};margin-bottom:8px;">توصيات التنفيذ</div>
      ${[
        `النمط المختار: ${idea.styleLabel} — يتطلب مقاولاً متخصصاً في هذا النمط`,
        `الميزانية التقديرية: ${idea.estimatedCost} — يُنصح بتخصيص 10-15% احتياطياً للطوارئ`,
        `الجدول الزمني: ${idea.timeline || "يُحدد بعد الاتفاق مع المقاول"}`,
        "يُنصح بالحصول على 3 عروض أسعار من مقاولين معتمدين قبل البدء",
        "م. اليازية تقدم هذا التصميم كمرجع إلهامي — التنفيذ النهائي يحتاج مهندساً معتمداً",
      ].map(r => `<div style="font-size:9px;color:#503c1e;padding:3px 0;border-bottom:1px solid #f0e8d8;">• ${r}</div>`).join("")}
    </div>
  </div>
  <div class="footer">
    <span>م. اليازية — مزايا التصميم — ${today} | fada.mousa.ai</span>
  </div>
</div>

${boqHtml}

</body>
</html>`;
}

// ─── Register PDF Route ───────────────────────────────────────────────────────

export function registerPDFRoutes(app: Express): void {
  app.post("/api/export-pdf", async (req: Request, res: Response) => {
    const tmpHtml = join(tmpdir(), `fada-pdf-${nanoid()}.html`);
    const tmpPdf = join(tmpdir(), `fada-pdf-${nanoid()}.pdf`);

    try {
      const { idea, spaceType } = req.body as { idea: DesignIdeaForPDF; spaceType?: string };

      if (!idea || !idea.title) {
        return res.status(400).json({ error: "Missing idea data" });
      }

      // تحميل الصورة وتحويلها إلى base64 على السيرفر (بدون قيود CORS)
      let imageBase64: string | undefined;
      if (idea.imageUrl) {
        try {
          const imgRes = await fetch(idea.imageUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            imageBase64 = `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
          }
        } catch {
          // الصورة اختيارية — نكمل بدونها
        }
      }

      // بناء HTML
      const html = buildPDFHtml(idea, spaceType, imageBase64);

      // كتابة HTML مؤقت
      await writeFile(tmpHtml, html, "utf-8");

      // توليد PDF باستخدام weasyprint (python3.11 -m weasyprint)
      // نمرر PYTHONPATH فارغاً لتجنب تعارض python3.13 مع python3.11
      await execFileAsync("/usr/bin/python3.11", [
        "-m", "weasyprint",
        tmpHtml,
        tmpPdf,
        "--encoding", "utf-8",
      ], {
        timeout: 30000,
        env: { ...process.env, PYTHONPATH: "", PYTHONHOME: "" },
      });

      // قراءة وإرسال PDF
      const pdfBuffer = await readFile(tmpPdf);
      const fileName = `م_اليازية_${idea.title.replace(/\s+/g, "_").substring(0, 30)}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(pdfBuffer);

    } catch (err) {
      console.error("[PDF Export] Error:", err);
      return res.status(500).json({ error: "PDF generation failed", details: String(err) });
    } finally {
      // تنظيف الملفات المؤقتة
      unlink(tmpHtml).catch(() => {});
      unlink(tmpPdf).catch(() => {});
    }
  });

  console.log("[PDFRoutes] Registered: POST /api/export-pdf");
}
