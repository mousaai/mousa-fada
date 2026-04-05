/**
 * PlanRenderResult — صفحة نتائج الرندر الكاملة بعد توليد 3D من المسقط
 * نفس تجربة SmartCapture: أزرار القلم، تغيير النمط والألوان، PDF، BOQ، بنيان
 */
import { useState, useRef } from "react";
import {
  X, Download, RefreshCw, ChevronDown, ChevronUp,
  Palette, Layers, Clock, Share2,
  Check, Sparkles, Wand2, DollarSign, FileDown, ShoppingBag,
  ZoomIn
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// ===== Types =====
interface PaletteColor { name: string; hex: string; }
interface FurnitureItem { name: string; description: string; priceRange: string; }
interface BOQItem { category: string; item: string; unit: string; qty: number; unitPrice: number; total: number; }
interface StyleVariant { id: string; label: string; emoji: string; }
interface DesignData {
  title: string;
  description: string;
  palette: PaletteColor[];
  materials: string[];
  highlights: string[];
  furniture: FurnitureItem[];
  estimatedCost: string;
  costMin: number;
  costMax: number;
  executionTime: string;
  boq: BOQItem[];
  styleVariants: StyleVariant[];
}
interface RoomInfo { label: string; width: number; height: number; }
interface DoorInfo { doorType: string; width: number; }
interface WindowInfo { windowType: string; width: number; }
interface PlanRenderResultProps {
  renderImageUrl: string;
  designData: DesignData | null;
  isLoadingData: boolean;
  currentStyle: string;
  rooms: RoomInfo[];
  doors: DoorInfo[];
  windows: WindowInfo[];
  onClose: () => void;
  onRegenerate: (style: string) => void;
  isRegenerating: boolean;
}

const STYLE_LABELS: Record<string, string> = {
  modern: "عصري معاصر", gulf: "خليجي فاخر", classic: "كلاسيكي",
  minimal: "مينيمال", luxury: "فاخر بريميوم", japanese: "ياباني زن",
  scandinavian: "سكندنافي", moroccan: "مغربي", industrial: "صناعي"
};

// ===== PDF Export (html2canvas approach for proper Arabic rendering) =====
async function generateRenderPDF(imageUrl: string, data: DesignData, style: string) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;

  // Helper: render an HTML string to a canvas and add to PDF
  async function addHtmlPage(html: string, isFirst = false) {
    const container = document.createElement("div");
    container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:794px;background:#faf6f0;font-family:'Tajawal','Arial',sans-serif;direction:rtl;`;
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#faf6f0", logging: false });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (!isFirst) doc.addPage();
      doc.addImage(imgData, "JPEG", 0, 0, W, H);
    } finally {
      document.body.removeChild(container);
    }
  }

  const styleLabel = STYLE_LABELS[style] || style;
  const goldHex = "#C9A84C";
  const brownHex = "#5C3D11";
  const emeraldHex = "#107C5A";

  // ===== صفحة 1: الغلاف =====
  let imgTag = "";
  if (imageUrl) {
    imgTag = `<img src="${imageUrl}" style="width:100%;height:340px;object-fit:cover;border-radius:8px;border:3px solid ${goldHex};display:block;margin-bottom:16px;" crossorigin="anonymous" />`;
  }
  const paletteSwatches = data.palette.map(c => `
    <div style="display:inline-block;text-align:center;margin:0 6px;">
      <div style="width:56px;height:32px;background:${c.hex};border-radius:6px;border:1px solid #d4b87a;"></div>
      <div style="font-size:10px;color:${brownHex};margin-top:4px;">${c.name}</div>
    </div>`).join("");

  await addHtmlPage(`
    <div style="background:#faf6f0;min-height:1123px;padding:0;">
      <div style="background:${goldHex};padding:14px 20px;text-align:center;">
        <span style="color:#fff;font-size:14px;font-weight:bold;">م. سارة | خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي</span>
      </div>
      <div style="background:${brownHex};height:3px;"></div>
      <div style="padding:20px 24px;">
        ${imgTag}
        <h1 style="font-size:26px;font-weight:bold;color:${brownHex};text-align:center;margin:0 0 8px;">${data.title}</h1>
        <p style="font-size:13px;color:${goldHex};text-align:center;margin:0 0 12px;">${styleLabel} • رندر 3D من المسقط</p>
        <hr style="border:none;border-top:1px solid ${goldHex};margin:0 40px 16px;" />
        <p style="font-size:12px;color:#503c1e;text-align:center;line-height:1.7;margin:0 0 20px;">${data.description}</p>
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:12px;font-weight:bold;color:${brownHex};margin-bottom:10px;">لوحة الألوان</div>
          <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px;">${paletteSwatches}</div>
        </div>
        <div style="background:${goldHex};border-radius:8px;padding:14px 24px;text-align:center;margin-top:16px;">
          <div style="color:#fff;font-size:16px;font-weight:bold;">التكلفة التقديرية: ${data.estimatedCost}</div>
          ${data.executionTime ? `<div style="color:#fff;font-size:11px;margin-top:4px;">المدة الزمنية: ${data.executionTime}</div>` : ""}
        </div>
      </div>
    </div>`, true);

  // ===== صفحة 2: المواد والمزايا =====
  const materialsHtml = data.materials.map(m => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0e8d8;">
      <div style="width:8px;height:8px;background:${goldHex};border-radius:50%;flex-shrink:0;"></div>
      <span style="font-size:12px;color:#503c1e;">${m}</span>
    </div>`).join("");
  const highlightsHtml = data.highlights.map(h => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #e8f5ee;">
      <div style="width:8px;height:8px;background:${emeraldHex};border-radius:50%;flex-shrink:0;"></div>
      <span style="font-size:12px;color:#503c1e;">${h}</span>
    </div>`).join("");
  const furnitureHtml = (data.furniture || []).slice(0, 6).map(f => `
    <div style="background:#fff;border:1px solid #e8d9c0;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
      <div style="font-size:12px;font-weight:bold;color:${brownHex};">${f.name}</div>
      <div style="font-size:10px;color:#666;margin:2px 0;">${f.description}</div>
      <div style="font-size:11px;color:${goldHex};font-weight:bold;">${f.priceRange}</div>
    </div>`).join("");

  await addHtmlPage(`
    <div style="background:#faf6f0;min-height:1123px;padding:0;">
      <div style="background:${goldHex};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#fff;font-size:12px;font-weight:bold;">م. سارة | التصميم الداخلي</span>
        <span style="color:#fff;font-size:12px;font-weight:bold;">${data.title}</span>
      </div>
      <div style="padding:20px 24px;">
        <h2 style="font-size:18px;font-weight:bold;color:${brownHex};text-align:center;margin:0 0 6px;">المواد والتشطيبات</h2>
        <hr style="border:none;border-top:1px solid ${goldHex};margin:0 0 12px;" />
        <div style="column-count:2;column-gap:20px;margin-bottom:24px;">${materialsHtml}</div>
        <h2 style="font-size:18px;font-weight:bold;color:${brownHex};text-align:center;margin:0 0 6px;">مزايا التصميم</h2>
        <hr style="border:none;border-top:1px solid ${goldHex};margin:0 0 12px;" />
        <div style="column-count:2;column-gap:20px;margin-bottom:24px;">${highlightsHtml}</div>
        ${data.furniture && data.furniture.length > 0 ? `
        <h2 style="font-size:18px;font-weight:bold;color:${brownHex};text-align:center;margin:0 0 6px;">الأثاث المقترح</h2>
        <hr style="border:none;border-top:1px solid ${goldHex};margin:0 0 12px;" />
        <div style="column-count:2;column-gap:16px;">${furnitureHtml}</div>` : ""}
      </div>
    </div>`);

  // ===== صفحة 3: BOQ =====
  if (data.boq && data.boq.length > 0) {
    const boqByCat = data.boq.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BOQItem[]>);
    let grandTotal = 0;
    const tablesHtml = Object.entries(boqByCat).map(([cat, items]) => {
      const catTotal = items.reduce((s, i) => s + (i.total || 0), 0);
      grandTotal += catTotal;
      const rows = items.map(i => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f5ee;font-size:11px;">${i.item}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f5ee;font-size:11px;text-align:center;">${i.unit}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f5ee;font-size:11px;text-align:center;">${i.qty}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f5ee;font-size:11px;text-align:center;">${i.unitPrice.toLocaleString()}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f5ee;font-size:11px;font-weight:bold;text-align:center;">${i.total.toLocaleString()}</td>
        </tr>`).join("");
      return `
        <div style="margin-bottom:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:${emeraldHex};">
                <th colspan="5" style="padding:8px 10px;color:#fff;font-size:12px;text-align:right;">${cat}</th>
              </tr>
              <tr style="background:#e8f5ee;">
                <th style="padding:6px 10px;font-size:10px;color:${brownHex};">البند</th>
                <th style="padding:6px 10px;font-size:10px;color:${brownHex};text-align:center;">الوحدة</th>
                <th style="padding:6px 10px;font-size:10px;color:${brownHex};text-align:center;">الكمية</th>
                <th style="padding:6px 10px;font-size:10px;color:${brownHex};text-align:center;">سعر الوحدة</th>
                <th style="padding:6px 10px;font-size:10px;color:${brownHex};text-align:center;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#e8f5ee;">
                <td colspan="4" style="padding:6px 10px;font-size:11px;font-weight:bold;color:${emeraldHex};">المجموع الفرعي</td>
                <td style="padding:6px 10px;font-size:12px;font-weight:bold;color:${emeraldHex};text-align:center;">${catTotal.toLocaleString()} ر.س</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    }).join("");

    await addHtmlPage(`
      <div style="background:#faf6f0;min-height:1123px;padding:0;">
        <div style="background:${goldHex};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#fff;font-size:12px;font-weight:bold;">م. سارة | جدول الكميات BOQ</span>
          <span style="color:#fff;font-size:12px;font-weight:bold;">${data.title}</span>
        </div>
        <div style="padding:20px 24px;">
          <h2 style="font-size:18px;font-weight:bold;color:${brownHex};text-align:center;margin:0 0 6px;">جدول الكميات التقديري (BOQ)</h2>
          <hr style="border:none;border-top:1px solid ${goldHex};margin:0 0 16px;" />
          ${tablesHtml}
          <div style="background:${goldHex};border-radius:8px;padding:14px 24px;text-align:center;margin-top:16px;">
            <span style="color:#fff;font-size:16px;font-weight:bold;">الإجمالي التقديري: ${grandTotal.toLocaleString()} ر.س</span>
          </div>
        </div>
      </div>`);
  }

  doc.save(`render-3d-${style}-${Date.now()}.pdf`);
}

// ===== Main Component =====
export default function PlanRenderResult({
  renderImageUrl,
  designData,
  isLoadingData,
  currentStyle,
  rooms,
  doors,
  windows,
  onClose,
  onRegenerate,
  isRegenerating,
}: PlanRenderResultProps) {
  const { t, dir } = useLanguage();
  const [localImageUrl, setLocalImageUrl] = useState(renderImageUrl);
  const [localDesignData, setLocalDesignData] = useState<DesignData | null>(designData);
  const [activeStyle, setActiveStyle] = useState(currentStyle);
  const [isChangingStyle, setIsChangingStyle] = useState(false);

  // أزرار القلم
  const [showRefine, setShowRefine] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [refineClickX, setRefineClickX] = useState<number | undefined>(undefined);
  const [refineClickY, setRefineClickY] = useState<number | undefined>(undefined);
  const refineImageRef = useRef<HTMLDivElement>(null);
  const [isRefining, setIsRefining] = useState(false);

  // تغيير النمط
  const [showStyleChanger, setShowStyleChanger] = useState(false);
  const [selectedNewStyle, setSelectedNewStyle] = useState<string | null>(null);
  const [selectedNewColors, setSelectedNewColors] = useState<string[]>([]);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);

  // BOQ
  const [showBOQ, setShowBOQ] = useState(false);
  const [expandedBOQCat, setExpandedBOQCat] = useState<string | null>(null);

  // مزايا + أثاث
  const [showHighlights, setShowHighlights] = useState(false);
  const [showFurniture, setShowFurniture] = useState(false);

  // Lightbox
  const [lightbox, setLightbox] = useState(false);

  // PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Bonyan
  const [showBonyan, setShowBonyan] = useState(false);
  const bonyanMatchMutation = trpc.bonyan.matchFurnitureToProducts.useMutation();
  const BONYAN_BASE = "https://bonyanpltf-gegfwhcg.manus.space";

  // Mutations
  const refineMutation = trpc.refineDesign.useMutation();
  const applyStyleMutation = trpc.applyStyleToIdea.useMutation();
  const getDesignDataMutation = trpc.generate3DPlanDesignData.useMutation();

  const data = localDesignData || designData;

  // ===== Handlers =====
  const handleRefineImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!refineImageRef.current) return;
    const rect = refineImageRef.current.getBoundingClientRect();
    setRefineClickX(Math.round(((e.clientX - rect.left) / rect.width) * 100));
    setRefineClickY(Math.round(((e.clientY - rect.top) / rect.height) * 100));
  };

  const handleRefineSubmit = async () => {
    if (!refineText.trim() || !localImageUrl) return;
    setIsRefining(true);
    try {
      const result = await refineMutation.mutateAsync({
        originalImageUrl: renderImageUrl,
        generatedImageUrl: localImageUrl,
        refinementRequest: refineText,
        clickX: refineClickX,
        clickY: refineClickY,
      });
      if (result.success && result.imageUrl) {
        setLocalImageUrl(result.imageUrl);
        setShowRefine(false);
        setRefineText("");
        setRefineClickX(undefined);
        setRefineClickY(undefined);
        toast.success("تم تطبيق التحسين ✨");
      } else {
        toast.error("لم يتمكن من تطبيق التحسين");
      }
    } catch {
      toast.error("حدث خطأ أثناء التحسين");
    } finally {
      setIsRefining(false);
    }
  };

  const handleApplyStyle = async () => {
    if (!selectedNewStyle || isApplyingStyle) return;
    setIsApplyingStyle(true);
    try {
      const result = await applyStyleMutation.mutateAsync({
        currentImageUrl: localImageUrl,
        currentTitle: data?.title || "تصميم داخلي",
        currentDescription: data?.description || "",
        newStyle: selectedNewStyle,
        newColors: selectedNewColors.length > 0 ? selectedNewColors : undefined,
        spaceType: rooms[0]?.label || "غرفة",
      });
      if (result.success && result.imageUrl) {
        setLocalImageUrl(result.imageUrl);
        setActiveStyle(selectedNewStyle);
        const dataResult = await getDesignDataMutation.mutateAsync({
          rooms, doors, windows,
          designStyle: selectedNewStyle,
          renderImageUrl: result.imageUrl,
        });
        if (dataResult.success && dataResult.data) setLocalDesignData(dataResult.data as DesignData);
        setShowStyleChanger(false);
        setSelectedNewStyle(null);
        setSelectedNewColors([]);
        toast.success("تم تغيير النمط ✨");
      } else {
        toast.error("لم يتمكن من تغيير النمط");
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير النمط");
    } finally {
      setIsApplyingStyle(false);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    setIsExportingPDF(true);
    try {
      await generateRenderPDF(localImageUrl, data, activeStyle);
      toast.success("تم تصدير دفتر التصميم PDF");
    } catch {
      toast.error("حدث خطأ أثناء تصدير PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleBonyanSearch = async () => {
    setShowBonyan(true);
    if (bonyanMatchMutation.data) return;
    const furniturePieces = [
      { nameAr: "كنبة", nameEn: "sofa", description: STYLE_LABELS[activeStyle] || activeStyle, searchKeyword: "sofa", priority: "أساسي" },
      { nameAr: "طاولة قهوة", nameEn: "coffee table", description: STYLE_LABELS[activeStyle] || activeStyle, searchKeyword: "coffee table", priority: "أساسي" },
      { nameAr: "سجادة", nameEn: "rug", description: STYLE_LABELS[activeStyle] || activeStyle, searchKeyword: "rug", priority: "ثانوي" },
      { nameAr: "وحدة تلفزيون", nameEn: "tv unit", description: STYLE_LABELS[activeStyle] || activeStyle, searchKeyword: "tv unit", priority: "ثانوي" },
    ];
    await bonyanMatchMutation.mutateAsync({ furniturePieces });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: data?.title || "تصميم م. سارة", url: localImageUrl });
      else { await navigator.clipboard.writeText(localImageUrl); toast.success("تم نسخ رابط الصورة"); }
    } catch { /* ignore */ }
  };

  const totalBOQ = data?.boq?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const boqByCategory = data?.boq?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BOQItem[]>) || {};

  const styleVariants: StyleVariant[] = data?.styleVariants || [
    { id: "modern", label: "عصري", emoji: "🏙️" },
    { id: "gulf", label: "خليجي", emoji: "🕌" },
    { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
    { id: "minimal", label: "مينيمال", emoji: "⬜" },
    { id: "luxury", label: "فاخر", emoji: "💎" },
  ];

  return (
    <>
      {/* ===== Main Modal ===== */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" dir={dir}>
        <div className="bg-[#faf6f0] w-full sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="bg-white border-b border-[#e8d9c0] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-[#5C3D11] text-sm leading-tight">{data?.title || "نتائج التصميم"}</h2>
                <p className="text-[9px] text-[#8B6914]">{STYLE_LABELS[activeStyle] || activeStyle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="w-8 h-8 rounded-xl bg-[#f5f0e8] flex items-center justify-center"><Share2 className="w-3.5 h-3.5 text-[#8B6914]" /></button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f0e8] flex items-center justify-center"><X className="w-4 h-4 text-[#8B6914]" /></button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">

            {/* الصورة مع أزرار القلم */}
            <div className="relative">
              {(isRegenerating || isChangingStyle || isApplyingStyle) ? (
                <div className="w-full h-56 bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <Wand2 className="w-7 h-7 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-sm text-[#8B6914] font-bold">
                    {isApplyingStyle ? "م. سارة تغيّر النمط..." : isChangingStyle ? "جاري تغيير النمط..." : "جاري إعادة التوليد..."}
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img src={localImageUrl} alt={data?.title || "رندر 3D"} className="w-full object-cover cursor-pointer" style={{ maxHeight: "280px" }} onClick={() => setLightbox(true)} />
                  {/* أزرار يمين */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button onClick={() => onRegenerate(activeStyle)} className="w-8 h-8 rounded-full bg-white/90 text-[#8B6914] flex items-center justify-center shadow-sm" title="إعادة توليد">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowRefine(!showRefine)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${showRefine ? "bg-[#C9A84C] text-white" : "bg-white/90 text-[#8B6914]"}`}
                      title="تحسين التصميم"
                    >
                      <span className="text-sm">✏️</span>
                    </button>
                    <button
                      onClick={() => setShowStyleChanger(true)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${showStyleChanger ? "bg-[#C9A84C] text-white" : "bg-white/90 text-[#8B6914]"}`}
                      title="غيّر النمط"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setLightbox(true)} className="w-8 h-8 rounded-full bg-white/90 text-[#8B6914] flex items-center justify-center shadow-sm" title="تكبير">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* التكلفة يسار أسفل */}
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {data?.estimatedCost || "جاري الحساب..."}
                  </div>
                  {/* المدة يمين أسفل */}
                  {data?.executionTime && (
                    <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />{data.executionTime}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">

              {/* تغيير النمط — أزرار سريعة */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-[#5C3D11]">تغيير النمط</p>
                  <Palette className="w-3.5 h-3.5 text-[#8B6914]" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {styleVariants.map(sv => (
                    <button
                      key={sv.id}
                      onClick={() => { setSelectedNewStyle(sv.id); setSelectedNewColors([]); setShowStyleChanger(true); }}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all ${activeStyle === sv.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-white"}`}
                    >
                      <span className="text-lg">{sv.emoji}</span>
                      <span className="text-[10px] font-bold text-[#5C3D11]">{sv.label}</span>
                      {activeStyle === sv.id && <Check className="w-3 h-3 text-[#C9A84C]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* الوصف */}
              {data?.description && <p className="text-xs text-[#6B4C1E] leading-relaxed">{data.description}</p>}

              {/* لوحة الألوان */}
              {data?.palette && data.palette.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-[#5C3D11]">لوحة الألوان</p>
                    <Palette className="w-3.5 h-3.5 text-[#8B6914]" />
                  </div>
                  <div className="flex gap-1.5">
                    {data.palette.map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                        <div className="w-full h-8 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                        <span className="text-[9px] text-[#8B6914] text-center leading-tight">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المواد */}
              {data?.materials && data.materials.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.materials.map((m, i) => <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">{m}</span>)}
                </div>
              )}

              {/* التكلفة */}
              {data?.estimatedCost && (
                <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/70 mb-0.5">التكلفة التقديرية</p>
                      <p className="text-base font-black text-white">{data.estimatedCost}</p>
                    </div>
                    <DollarSign className="w-5 h-5 text-white/70" />
                  </div>
                </div>
              )}

              {/* مزايا التصميم */}
              {data?.highlights && data.highlights.length > 0 && (
                <div>
                  <button onClick={() => setShowHighlights(!showHighlights)} className="w-full flex items-center justify-between py-2">
                    <span className="text-xs font-black text-[#5C3D11]">مزايا التصميم ({data.highlights.length})</span>
                    {showHighlights ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
                  </button>
                  {showHighlights && (
                    <div className="space-y-1.5 mt-1">
                      {data.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 bg-white rounded-xl p-2.5 border border-[#e8d9c0]">
                          <span className="text-[#C9A84C] text-xs mt-0.5">✦</span>
                          <p className="text-[11px] text-[#5C3D11] leading-relaxed">{h}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* الأثاث المقترح */}
              {data?.furniture && data.furniture.length > 0 && (
                <div>
                  <button onClick={() => setShowFurniture(!showFurniture)} className="w-full flex items-center justify-between py-2">
                    <span className="text-xs font-black text-[#5C3D11]">الأثاث المقترح ({data.furniture.length})</span>
                    {showFurniture ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
                  </button>
                  {showFurniture && (
                    <div className="space-y-2 mt-1">
                      {data.furniture.map((f, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#5C3D11]">{f.name}</p>
                            <p className="text-[10px] text-[#8B6914]/70 leading-tight mt-0.5">{f.description}</p>
                          </div>
                          <span className="text-[10px] text-[#C9A84C] font-bold flex-shrink-0 bg-[#C9A84C]/10 px-2 py-0.5 rounded-full whitespace-nowrap">{f.priceRange}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* تصدير PDF */}
              {data && (
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-black active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isExportingPDF ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />جاري التصدير...</>
                  ) : (
                    <><FileDown className="w-4 h-4" />تصدير دفتر التصميم (PDF)</>
                  )}
                </button>
              )}

              {/* جدول الكميات BOQ */}
              {data?.boq && data.boq.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowBOQ(!showBOQ)}
                    className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-700 to-emerald-500 text-white rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-black">جدول الكميات (BOQ)</span>
                      {totalBOQ > 0 && <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold">{totalBOQ.toLocaleString()} ر.س</span>}
                    </div>
                    {showBOQ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showBOQ && (
                    <div className="mt-2 bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                      {Object.entries(boqByCategory).map(([category, items]) => (
                        <div key={category}>
                          <button
                            onClick={() => setExpandedBOQCat(expandedBOQCat === category ? null : category)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-800">{category}</span>
                              <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">{items.length} بند</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-emerald-700">{items.reduce((s, i) => s + i.total, 0).toLocaleString()} ر.س</span>
                              {expandedBOQCat === category ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />}
                            </div>
                          </button>
                          {expandedBOQCat === category && (
                            <div className="px-4 pb-3 overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="border-b border-emerald-200">
                                    <th className="text-right py-1.5 text-emerald-700 font-bold w-2/5">البند</th>
                                    <th className="text-center py-1.5 text-emerald-700 font-bold">الوحدة</th>
                                    <th className="text-center py-1.5 text-emerald-700 font-bold">الكمية</th>
                                    <th className="text-center py-1.5 text-emerald-700 font-bold">سعر الوحدة</th>
                                    <th className="text-center py-1.5 text-emerald-700 font-bold">الإجمالي</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, ii) => (
                                    <tr key={ii} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                                      <td className="py-1.5 text-emerald-900 font-medium">{item.item}</td>
                                      <td className="text-center py-1.5 text-emerald-700">{item.unit}</td>
                                      <td className="text-center py-1.5 font-bold text-emerald-800">{item.qty}</td>
                                      <td className="text-center py-1.5 text-emerald-700">{item.unitPrice.toLocaleString()}</td>
                                      <td className="text-center py-1.5 font-black text-emerald-800">{item.total.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-emerald-100">
                                    <td colSpan={4} className="py-1.5 px-1 text-right font-black text-emerald-800">مجموع {category}</td>
                                    <td className="text-center py-1.5 font-black text-emerald-800">{items.reduce((s, i) => s + i.total, 0).toLocaleString()}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-3 py-2.5 flex items-center justify-between">
                        <span className="text-xs font-black text-white">الإجمالي التقديري</span>
                        <span className="text-sm font-black text-white">{totalBOQ.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* اشتري من بنيان */}
              <div>
                <button
                  onClick={handleBonyanSearch}
                  disabled={bonyanMatchMutation.isPending}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{bonyanMatchMutation.isPending ? "م. سارة تبحث في متاجر بنيان..." : "اشتري هذا الديكور من بنيان"}</span>
                  </div>
                  {!bonyanMatchMutation.isPending && <ChevronDown className={`w-4 h-4 transition-transform ${showBonyan ? "rotate-180" : ""}`} />}
                </button>
                {bonyanMatchMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    <p className="text-xs text-amber-700">م. سارة تبحث في متاجر بنيان...</p>
                  </div>
                )}
                {showBonyan && bonyanMatchMutation.data && (
                  <div className="mt-2 bg-amber-50 rounded-2xl border border-amber-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-amber-800">{bonyanMatchMutation.data.totalMatches} منتج من بنيان</p>
                      <button onClick={() => { bonyanMatchMutation.reset(); setShowBonyan(false); }} className="text-[10px] text-amber-600 underline">بحث جديد</button>
                    </div>
                    {bonyanMatchMutation.data.results.map((result, ri) => (
                      result.matches.length > 0 && (
                        <div key={ri} className="mb-3">
                          <p className="text-[10px] font-bold text-amber-700 mb-1.5">
                            {result.piece.nameAr} <span className="text-amber-500">({result.matches.length} منتج)</span>
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {result.matches.map((product, pi) => (
                              <a key={pi} href={`${BONYAN_BASE}/products/${product.slug}`} target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 w-28 bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm active:scale-95 transition-transform">
                                <img src={product.imageUrl} alt={product.nameAr || product.nameEn} className="w-full h-20 object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x80/f5f0e8/8B6914?text=أثاث"; }} />
                                <div className="p-1.5">
                                  <p className="text-[9px] font-bold text-amber-900 leading-tight line-clamp-2">{product.nameAr || product.nameEn}</p>
                                  <p className="text-[10px] font-black text-amber-700 mt-0.5">{parseFloat(product.price).toLocaleString()} د.إ</p>
                                  <p className="text-[8px] text-amber-600/70">{product.sourceName}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    {bonyanMatchMutation.data.totalMatches === 0 && (
                      <p className="text-xs text-amber-600 text-center py-2">لم يتم العثور على منتجات مطابقة حالياً</p>
                    )}
                  </div>
                )}
              </div>

              {/* Loading state */}
              {isLoadingData && !data && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-xs text-[#8B6914] font-medium">جاري تحليل التصميم...</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-[#e8d9c0] px-4 py-3 flex gap-2 flex-shrink-0">
            <button
              onClick={() => onRegenerate(activeStyle)}
              disabled={isRegenerating || isChangingStyle || isApplyingStyle}
              className="flex-1 py-2.5 rounded-2xl bg-[#f5f0e8] text-[#5C3D11] text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />إعادة توليد
            </button>
            <a
              href={localImageUrl}
              download="render-3d.png"
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />تحميل الصورة
            </a>
          </div>
        </div>
      </div>

      {/* ===== شاشة تحسين التصميم (القلم) — full-screen ===== */}
      {showRefine && localImageUrl && (
        <div className="fixed inset-0 z-[200] bg-[#faf6f0] flex flex-col" dir={dir}>
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8d9c0] shadow-sm">
            <button onClick={() => { setShowRefine(false); setRefineClickX(undefined); setRefineClickY(undefined); setRefineText(""); }}
              className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-[#5C3D11]">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-[#5C3D11]">✏️ تحسين التصميم</p>
              <p className="text-[10px] text-[#8B6914]/60">{data?.title || "رندر 3D"}</p>
            </div>
            <div className="w-9" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="relative">
              <p className="text-[10px] text-[#8B6914]/70 text-center py-2 bg-[#C9A84C]/5">
                {refineClickX !== undefined
                  ? `📍 تم تحديد المنطقة (${refineClickX}%, ${refineClickY}%) — اضغط مرة أخرى لتغييرها`
                  : 'اضغط على المنطقة التي تريد تحسينها (اختياري)'}
              </p>
              <div ref={refineImageRef} className="relative cursor-crosshair" onClick={handleRefineImageClick}>
                <img src={localImageUrl} className="w-full object-cover" style={{ maxHeight: '55vh' }} alt="التصميم الحالي" />
                {refineClickX !== undefined && refineClickY !== undefined && (
                  <div className="absolute w-8 h-8 rounded-full border-4 border-[#C9A84C] bg-[#C9A84C]/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                    style={{ left: `${refineClickX}%`, top: `${refineClickY}%` }} />
                )}
              </div>
            </div>
            <div className="px-4 pt-4">
              <p className="text-[10px] text-[#8B6914]/60 mb-2">اقتراحات سريعة:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {["غيّر لون الجدار", "أضف سجادة", "غيّر الإضاءة", "أضف نباتات", "غيّر الستائر", "أضف لوحة فنية", "غيّر الأرضية", "أضف إضاءة مخفية"].map(hint => (
                  <button key={hint} onClick={() => setRefineText(hint)}
                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-all active:scale-95 ${refineText === hint ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'bg-white text-[#8B6914] border-[#e8d9c0]'}`}>
                    {hint}
                  </button>
                ))}
              </div>
              <textarea
                value={refineText}
                onChange={e => setRefineText(e.target.value)}
                placeholder="صف التغيير المطلوب... مثل: غيّر لون الجدار إلى أخضر زيتوني"
                className="w-full text-sm border-2 border-[#e8d9c0] rounded-2xl px-4 py-3 bg-white text-[#5C3D11] placeholder-[#8B6914]/40 resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
                rows={3} dir={dir} autoFocus
              />
            </div>
          </div>
          <div className="px-4 py-4 bg-white border-t border-[#e8d9c0]">
            <button
              onClick={handleRefineSubmit}
              disabled={!refineText.trim() || isRefining}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg"
            >
              {isRefining ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />م. سارة تحسّن التصميم...</>
              ) : (
                <><span>✨</span>تطبيق التحسين</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== شاشة تغيير النمط — full-screen ===== */}
      {showStyleChanger && localImageUrl && (
        <div className="fixed inset-0 z-[200] bg-[#faf6f0] flex flex-col" dir={dir}>
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8d9c0] shadow-sm">
            <button onClick={() => { setShowStyleChanger(false); setSelectedNewStyle(null); setSelectedNewColors([]); }}
              className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-[#5C3D11]">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-[#5C3D11]">🎨 تغيير النمط</p>
              <p className="text-[10px] text-[#8B6914]/60">اختر نمطاً جديداً للتصميم</p>
            </div>
            <div className="w-9" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <img src={localImageUrl} className="w-full rounded-2xl object-cover" style={{ maxHeight: '200px' }} alt="التصميم الحالي" />
            {/* اختيار النمط */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-2">🏛️ النمط الجديد <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "modern", label: "عصري معاصر", emoji: "🏙️", colors: ["#E0E0E0", "#1565C0", "#FFFFFF"] },
                  { id: "gulf", label: "خليجي فاخر", emoji: "🕌", colors: ["#C9A84C", "#5C3D11", "#F5F0E8"] },
                  { id: "classic", label: "كلاسيكي", emoji: "🏛️", colors: ["#8B4513", "#F5F0E8", "#C9A84C"] },
                  { id: "minimal", label: "مينيمال", emoji: "⬜", colors: ["#FFFFFF", "#F5F5F5", "#212121"] },
                  { id: "luxury", label: "فاخر", emoji: "💎", colors: ["#212121", "#C9A84C", "#FFFFFF"] },
                  { id: "moroccan", label: "مغربي", emoji: "🌙", colors: ["#8B4513", "#C9A84C", "#1565C0"] },
                  { id: "scandinavian", label: "سكندنافي", emoji: "🌲", colors: ["#FFFFFF", "#F5F0E8", "#558B2F"] },
                  { id: "japanese", label: "ياباني زن", emoji: "🎋", colors: ["#F5F0E8", "#795548", "#558B2F"] },
                  { id: "industrial", label: "صناعي", emoji: "🏭", colors: ["#424242", "#795548", "#BDBDBD"] },
                ].map(({ id, label, emoji, colors }) => {
                  const isSel = selectedNewStyle === id;
                  return (
                    <button key={id} onClick={() => setSelectedNewStyle(id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${isSel ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-md" : "border-[#e8d9c0] bg-white"}`}>
                      <span className="text-2xl">{emoji}</span>
                      <div className="flex gap-0.5">{colors.map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />)}</div>
                      <span className="text-[10px] leading-tight text-center text-[#5C3D11] font-medium">{label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-[#C9A84C]" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* اختيار الألوان */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-2">🎨 ألوان محددة <span className="text-[10px] text-[#8B6914]/60 font-normal">(اختياري — متعدد)</span></p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "أبيض", hex: "#F5F5F5" }, { name: "بيج", hex: "#F5F0E8" },
                  { name: "رمادي", hex: "#9E9E9E" }, { name: "أسود", hex: "#212121" },
                  { name: "ذهبي", hex: "#C9A84C" }, { name: "بني", hex: "#8B4513" },
                  { name: "خشبي", hex: "#795548" }, { name: "أخضر زيتي", hex: "#558B2F" },
                  { name: "أزرق", hex: "#1565C0" }, { name: "أزرق بترولي", hex: "#00838F" },
                  { name: "وردي", hex: "#F48FB1" }, { name: "برتقالي", hex: "#FF9800" },
                  { name: "أحمر خمري", hex: "#880E4F" }, { name: "بنفسجي", hex: "#7B1FA2" },
                ].map(({ name, hex }) => {
                  const isSel = selectedNewColors.includes(name);
                  return (
                    <button key={name} onClick={() => setSelectedNewColors(prev => isSel ? prev.filter(c => c !== name) : [...prev, name])}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 transition-all ${isSel ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-sm" : "border-[#e8d9c0]"}`}>
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                      <span className="text-[11px] text-[#5C3D11] font-medium">{name}</span>
                      {isSel && <Check className="w-3 h-3 text-[#C9A84C]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="px-4 py-4 bg-white border-t border-[#e8d9c0]">
            <button
              onClick={handleApplyStyle}
              disabled={!selectedNewStyle || isApplyingStyle}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg"
            >
              {isApplyingStyle ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />م. سارة تغيّر النمط...</>
              ) : (
                <><Palette className="w-4 h-4" />طبّق {selectedNewStyle ? `نمط ${STYLE_LABELS[selectedNewStyle] || selectedNewStyle}` : "النمط"} على هذه الفكرة</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== Lightbox ===== */}
      {lightbox && localImageUrl && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <img src={localImageUrl} className="max-w-full max-h-full object-contain rounded-xl" alt={data?.title || "رندر 3D"} />
          <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"><X className="w-5 h-5" /></button>
        </div>
      )}
    </>
  );
}
