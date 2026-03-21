/**
 * PlanRenderResult — صفحة نتائج الرندر الكاملة بعد توليد 3D من المسقط
 * تعرض: الصورة + الألوان + المواد + التكلفة + المزايا + BOQ + تغيير الثيم
 */
import { useState } from "react";
import {
  X, Download, RefreshCw, ChevronDown, ChevronUp,
  Star, Wand2, Palette, Layers, Sofa, Clock, Share2,
  Check, Sparkles, RotateCcw
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  scandinavian: "سكندنافي", moroccan: "مغربي"
};

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
  const [activeStyle, setActiveStyle] = useState(currentStyle);
  const [showBOQ, setShowBOQ] = useState(false);
  const [showFurniture, setShowFurniture] = useState(false);
  const [expandedHighlights, setExpandedHighlights] = useState(false);
  const [isChangingStyle, setIsChangingStyle] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(renderImageUrl);
  const [localDesignData, setLocalDesignData] = useState<DesignData | null>(designData);

  const applyStyleMutation = trpc.applyStyleToIdea.useMutation();
  const getDesignDataMutation = trpc.generate3DPlanDesignData.useMutation();

  const handleStyleChange = async (newStyle: string) => {
    if (newStyle === activeStyle || isChangingStyle) return;
    setIsChangingStyle(true);
    setActiveStyle(newStyle);
    try {
      // 1. تغيير الصورة بالستايل الجديد
      const styleResult = await applyStyleMutation.mutateAsync({
        currentImageUrl: localImageUrl,
        currentTitle: localDesignData?.title || "تصميم داخلي",
        currentDescription: localDesignData?.description || "",
        newStyle,
        spaceType: rooms[0]?.label || "غرفة",
      });
      if (styleResult.success && styleResult.imageUrl) {
        setLocalImageUrl(styleResult.imageUrl);
      }
      // 2. تحديث بيانات التصميم للستايل الجديد
      const dataResult = await getDesignDataMutation.mutateAsync({
        rooms,
        doors,
        windows,
        designStyle: newStyle,
        renderImageUrl: styleResult.imageUrl || localImageUrl,
      });
      if (dataResult.success && dataResult.data) {
        setLocalDesignData(dataResult.data as DesignData);
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير النمط");
      setActiveStyle(currentStyle);
    } finally {
      setIsChangingStyle(false);
    }
  };

  const handleRegenerate = () => {
    onRegenerate(activeStyle);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: localDesignData?.title || "تصميم م. سارة", url: localImageUrl });
      } else {
        await navigator.clipboard.writeText(localImageUrl);
        toast.success("تم نسخ رابط الصورة");
      }
    } catch { /* ignore */ }
  };

  const data = localDesignData || designData;
  const totalBOQ = data?.boq?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  // Group BOQ by category
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" dir="rtl">
      <div className="bg-[#faf6f0] w-full sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* ===== Header ===== */}
        <div className="bg-white border-b border-[#e8d9c0] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-[#5C3D11] text-sm leading-tight">
                {data?.title || "نتائج التصميم"}
              </h2>
              <p className="text-[9px] text-[#8B6914]">{STYLE_LABELS[activeStyle] || activeStyle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-xl bg-[#f5f0e8] flex items-center justify-center"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8B6914]" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#f5f0e8] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-[#8B6914]" />
            </button>
          </div>
        </div>

        {/* ===== Scrollable Content ===== */}
        <div className="flex-1 overflow-y-auto">
          {/* الصورة */}
          <div className="relative">
            {(isRegenerating || isChangingStyle) ? (
              <div className="w-full h-56 bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <Wand2 className="w-7 h-7 text-[#C9A84C] animate-pulse" />
                </div>
                <p className="text-sm text-[#8B6914] font-bold">
                  {isChangingStyle ? "جاري تغيير النمط..." : "جاري إعادة التوليد..."}
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={localImageUrl}
                alt="3D Render"
                className="w-full object-cover"
                style={{ maxHeight: "280px" }}
              />
            )}
            {/* أزرار على الصورة */}
            {!isRegenerating && !isChangingStyle && (
              <>
                <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                  {data?.estimatedCost || "..."}
                </div>
                {data?.executionTime && (
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {data.executionTime}
                  </div>
                )}
                <button
                  onClick={handleRegenerate}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-[#8B6914]" />
                </button>
                <a
                  href={localImageUrl}
                  download="render-3d.png"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md"
                >
                  <Download className="w-4 h-4 text-[#8B6914]" />
                </a>
              </>
            )}
          </div>

          {/* ===== تغيير الثيم ===== */}
          <div className="bg-white border-b border-[#e8d9c0] px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-[#C9A84C]" />
              <p className="text-xs font-black text-[#5C3D11]">تغيير النمط</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {styleVariants.map(sv => (
                <button
                  key={sv.id}
                  onClick={() => handleStyleChange(sv.id)}
                  disabled={isChangingStyle || isRegenerating}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all text-center ${
                    activeStyle === sv.id
                      ? "bg-gradient-to-b from-[#C9A84C] to-[#8B6914] text-white shadow-md"
                      : "bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede3d0]"
                  } disabled:opacity-50`}
                >
                  <span className="text-base">{sv.emoji}</span>
                  <span className="text-[9px] font-bold whitespace-nowrap">{sv.label}</span>
                  {activeStyle === sv.id && <Check className="w-2.5 h-2.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* ===== المحتوى الرئيسي ===== */}
          <div className="p-4 space-y-4">
            {/* الوصف */}
            {data?.description && (
              <p className="text-xs text-[#6B4C1E] leading-relaxed">{data.description}</p>
            )}

            {/* لوحة الألوان */}
            {data?.palette && data.palette.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Palette className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <p className="text-xs font-black text-[#5C3D11]">لوحة الألوان</p>
                </div>
                <div className="flex gap-2">
                  {data.palette.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-white shadow-md"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                      <span className="text-[8px] text-[#8B6914] text-center leading-tight w-10 truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المواد */}
            {data?.materials && data.materials.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <p className="text-xs font-black text-[#5C3D11]">المواد والتشطيبات</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.materials.map((m, i) => (
                    <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2.5 py-1 rounded-full font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* مزايا التصميم */}
            {data?.highlights && data.highlights.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#C9A84C]" />
                    <p className="text-xs font-black text-[#5C3D11]">مزايا التصميم ({data.highlights.length})</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {data.highlights.slice(0, expandedHighlights ? undefined : 3).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-[#C9A84C]" />
                      </div>
                      <p className="text-xs text-[#6B4C1E] leading-relaxed">{h}</p>
                    </div>
                  ))}
                  {data.highlights.length > 3 && (
                    <button
                      onClick={() => setExpandedHighlights(!expandedHighlights)}
                      className="text-xs text-[#C9A84C] font-bold flex items-center gap-1 mt-1"
                    >
                      {expandedHighlights
                        ? <><ChevronUp className="w-3 h-3" /> أقل</>
                        : <><ChevronDown className="w-3 h-3" /> {data.highlights.length - 3} مزايا أخرى</>
                      }
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* الأثاث المقترح */}
            {data?.furniture && data.furniture.length > 0 && (
              <div>
                <button
                  onClick={() => setShowFurniture(!showFurniture)}
                  className="w-full flex items-center justify-between py-2 border-t border-[#f0e8d8]"
                >
                  <div className="flex items-center gap-1.5">
                    <Sofa className="w-3.5 h-3.5 text-[#C9A84C]" />
                    <span className="text-xs font-black text-[#5C3D11]">الأثاث المقترح ({data.furniture.length} قطعة)</span>
                  </div>
                  {showFurniture ? <ChevronUp className="w-3.5 h-3.5 text-[#8B6914]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B6914]" />}
                </button>
                {showFurniture && (
                  <div className="space-y-2 mt-2">
                    {data.furniture.map((f, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[#5C3D11]">{f.name}</p>
                          <p className="text-[10px] text-[#8B6914]/70 leading-tight mt-0.5">{f.description}</p>
                        </div>
                        <span className="text-[10px] text-[#C9A84C] font-bold flex-shrink-0 bg-[#C9A84C]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {f.priceRange}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* جدول الكميات BOQ */}
            {data?.boq && data.boq.length > 0 && (
              <div>
                <button
                  onClick={() => setShowBOQ(!showBOQ)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-[#5C3D11] to-[#8B6914] text-white rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span className="text-xs font-black">جدول الكميات BOQ</span>
                    {totalBOQ > 0 && (
                      <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {totalBOQ.toLocaleString("ar-SA")} ر.س
                      </span>
                    )}
                  </div>
                  {showBOQ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showBOQ && (
                  <div className="mt-2 bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
                    {Object.entries(boqByCategory).map(([category, items]) => (
                      <div key={category}>
                        <div className="bg-[#f5f0e8] px-3 py-1.5">
                          <p className="text-[10px] font-black text-[#5C3D11]">{category}</p>
                        </div>
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-[#f0e8d8] last:border-0">
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-[#5C3D11]">{item.item}</p>
                              <p className="text-[9px] text-[#8B6914]">{item.qty} {item.unit} × {item.unitPrice.toLocaleString("ar-SA")} ر.س</p>
                            </div>
                            <span className="text-[10px] font-black text-[#C9A84C]">
                              {item.total.toLocaleString("ar-SA")} ر.س
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {/* الإجمالي */}
                    <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-black text-white">الإجمالي التقديري</span>
                      <span className="text-sm font-black text-white">{totalBOQ.toLocaleString("ar-SA")} ر.س</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading state for design data */}
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

        {/* ===== Footer Actions ===== */}
        <div className="bg-white border-t border-[#e8d9c0] px-4 py-3 flex gap-2 flex-shrink-0">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isChangingStyle}
            className="flex-1 py-2.5 rounded-2xl bg-[#f5f0e8] text-[#5C3D11] text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة توليد
          </button>
          <a
            href={localImageUrl}
            download="render-3d.png"
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل الصورة
          </a>
        </div>
      </div>
    </div>
  );
}
