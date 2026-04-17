/**
 * SmartCapture — التصوير الذكي مع التحليل المعماري
 * لمسة واحدة → اختيار وضع التصوير → تصوير → تحليل معماري + 3-6 أفكار تصميمية فورية
 * يحافظ على البنية الأصلية للغرفة (الأبواب، السلالم، الأبعاد)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Camera, ChevronRight, Sparkles, RefreshCw, X, Wand2,
  DollarSign, Palette, ChevronDown, ChevronUp, Heart,
  Share2, ZoomIn, Video, ScanLine, Box, ImageIcon,
  Plus, Minus, Check, RotateCcw, Layers, AlertTriangle,
  Building2, Home, Info, Star, ShoppingBag, FileDown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditBadge, useMousaCredit } from "@/components/CreditBadge";
import { handleMousaErrorStatic } from "@/hooks/useMousaError";
import { useGuestDesigns } from "@/hooks/useGuestDesigns";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ===== Types =====
type CaptureMode = "single";

interface ReplacementCost {
  item: string;
  currentEstimate: string;
  replacementCost: string;
  notes: string;
}

interface StructuralElement {
  element: string;
  position: string;
  width?: string;
  height?: string;
  type?: string;
  keepInDesign: boolean;
}

interface CameraAnalysis {
  cameraHeight: string;
  viewingAngle: string;
  zoomLevel: string;
  perspectiveLines: string;
}

interface StructuralSuggestion {
  id: string;
  title: string;
  element: string;
  reason: string;
  benefit: string;
  additionalCost: string;
  structuralWarning: string;
  timeRequired: string;
}

interface FrameElement {
  type: "primary" | "secondary" | "context";
  name: string;
  description: string;
  canDesign: boolean;
  designNote: string;
}

interface SpaceAnalysis {
  spaceType: string;
  spaceCategory?: string;
  designTarget?: string;
  designTargetReason?: string;
  frameElements?: FrameElement[];
  designBoundary?: string;
  untouchableElements?: string[];
  urbanContext?: string;
  estimatedArea: string;
  cameraAnalysis?: CameraAnalysis;
  roomShape?: string;
  roomProportions?: string;
  ceilingHeight?: string;
  structuralElements: StructuralElement[];
  currentIssues: string[];
  currentMaterials: string[];
  technicalWarnings?: TechnicalWarning[];
}

interface TechnicalWarning {
  issue: string;
  location?: string;
  severity: 'عالي' | 'متوسط' | 'منخفض';
  treatment: string;
  specialist?: string;
}

// ===== BOQ Types =====
interface BOQItem {
  name: string;
  unit: string;
  qty: number;
  unitPriceMin: number;
  unitPriceMax: number;
  totalMin: number;
  totalMax: number;
  notes: string;
  basis: string;
}
interface BOQCategory {
  category: string;
  icon?: string;
  items: BOQItem[];
  subtotalMin: number;
  subtotalMax: number;
}
interface BOQResult {
  categories: BOQCategory[];
  grandTotalMin: number;
  grandTotalMax: number;
  area: number;
  perimeter: number;
  wallArea: number;
  ceilingArea: number;
  source: "exact" | "estimated";
  disclaimer: string;
}

interface DesignIdea {
  id: string;
  title: string;
  style: string;
  styleLabel: string;
  scenario: string;
  scenarioLabel: string;
  description: string;
  palette: { name: string; hex: string }[];
  materials: string[];
  highlights: string[];
  estimatedCost: string;
  costMin: number;
  costMax: number;
  timeline: string;
  replacementCosts: ReplacementCost[];
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  boq?: BOQResult;
}

// ===== Capture Mode Selector =====
// Only single mode is active now

// ===== Image compression helper =====
function compressImage(dataUrl: string, maxWidth = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

// ===== Scenario badge colors =====
const SCENARIO_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  surface: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7", label: "تجديد سطحي" },
  moderate: { bg: "#FFF3E0", text: "#E65100", border: "#FFCC80", label: "تحسين متوسط" },
  complete: { bg: "#F3E5F5", text: "#6A1B9A", border: "#CE93D8", label: "تحول شامل" },
};

// ===== Space Category Icons =====
const SPACE_CATEGORY_ICONS: Record<string, string> = {
  interior: "🏠",
  facade: "🏗️",
  landscape: "🌿",
  pool: "🏊",
  pathway: "🚶",
  urban: "🏙️",
  empty_land: "📍",
};

const SPACE_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  interior: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  facade: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  landscape: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  pool: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  pathway: { bg: "#FAFAF9", text: "#57534E", border: "#D6D3D1" },
  urban: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  empty_land: { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" },
};

// ===== Structural Analysis Card =====
function SpaceAnalysisCard({ analysis }: { analysis: SpaceAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const keepElements = analysis.structuralElements?.filter(e => e.keepInDesign) || [];
  const cam = analysis.cameraAnalysis;
  const cat = analysis.spaceCategory || "interior";
  const catColors = SPACE_CATEGORY_COLORS[cat] || SPACE_CATEGORY_COLORS.interior;
  const catIcon = SPACE_CATEGORY_ICONS[cat] || "🏠";
  const hasFrameData = analysis.designTarget || (analysis.frameElements && analysis.frameElements.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
      {/* Header: Smart Target Detection */}
      {hasFrameData && (
        <div style={{ background: catColors.bg, borderBottom: `1px solid ${catColors.border}` }} className="px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">{catIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm" style={{ color: catColors.text }}>الهدف: {analysis.designTarget || analysis.spaceType}</span>
              </div>
              {analysis.designTargetReason && (
                <p className="text-[10px] mt-0.5" style={{ color: catColors.text, opacity: 0.8 }}>{analysis.designTargetReason}</p>
              )}
              {analysis.designBoundary && (
                <div className="mt-1.5 flex items-start gap-1">
                  <span className="text-[9px] font-bold" style={{ color: catColors.text }}>حدود التصميم:</span>
                  <span className="text-[9px]" style={{ color: catColors.text, opacity: 0.9 }}>{analysis.designBoundary}</span>
                </div>
              )}
            </div>
          </div>
          {/* Frame Elements Map */}
          {analysis.frameElements && analysis.frameElements.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.frameElements.map((el, i) => (
                <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium border ${
                  el.canDesign
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                  <span>{el.canDesign ? "✅" : "🚫"}</span>
                  <span>{el.name}</span>
                  {el.designNote && <span className="opacity-60">({el.designNote})</span>}
                </div>
              ))}
            </div>
          )}
          {/* Untouchable Elements */}
          {analysis.untouchableElements && analysis.untouchableElements.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-bold text-red-600">لا يُمَس:</span>
              {analysis.untouchableElements.map((el, i) => (
                <span key={i} className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100">{el}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#C9A84C]" />
          <span className="font-bold text-[#5C3D11] text-sm">تحليل الإطار</span>
          <span className="text-[10px] bg-[#C9A84C]/10 text-[#8B6914] px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
            {analysis.spaceType} • {analysis.estimatedArea}
          </span>
          {analysis.urbanContext && (
            <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">{analysis.urbanContext}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
      </button>

      {/* Camera analysis summary — always visible */}
      {cam && (
        <div className="px-4 pb-3 border-b border-[#f0e8d8]">
          <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800 mb-1.5 flex items-center gap-1">
              📷 زاوية الكاميرا المحفوظة في التصاميم
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-blue-600 font-bold">المستوى:</span>
                <span className="text-[9px] text-blue-800">{cam.cameraHeight}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-blue-600 font-bold">الاتجاه:</span>
                <span className="text-[9px] text-blue-800">{cam.viewingAngle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-blue-600 font-bold">الزوم:</span>
                <span className="text-[9px] text-blue-800">{cam.zoomLevel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-blue-600 font-bold">المنظور:</span>
                <span className="text-[9px] text-blue-800">{cam.perspectiveLines}</span>
              </div>
            </div>
          </div>
          {(analysis.roomShape || analysis.ceilingHeight) && (
            <div className="flex gap-2 mt-2">
              {analysis.roomShape && (
                <span className="text-[9px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">📐 {analysis.roomShape}</span>
              )}
              {analysis.roomProportions && (
                <span className="text-[9px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">نسبة {analysis.roomProportions}</span>
              )}
              {analysis.ceilingHeight && (
                <span className="text-[9px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">⬆️ سقف {analysis.ceilingHeight}</span>
              )}
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* العناصر البنيوية المحافظ عليها */}
          {keepElements.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#5C3D11] mb-2 flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                فتحات وعناصر محافظ عليها في كل التصاميم
              </p>
              <div className="space-y-1.5">
                {keepElements.map((el, i) => (
                  <div key={i} className="bg-green-50 rounded-xl px-3 py-2 border border-green-100">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-800 font-bold">{el.element}</span>
                      {el.type && <span className="text-[9px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">{el.type}</span>}
                    </div>
                    <div className="flex items-center gap-3 mr-4">
                      <span className="text-[10px] text-green-700">📍 {el.position}</span>
                      {el.width && <span className="text-[10px] text-green-600">عرض: {el.width}</span>}
                      {el.height && <span className="text-[10px] text-green-600">ارتفاع: {el.height}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المشاكل الحالية */}
          {analysis.currentIssues?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#5C3D11] mb-2 flex items-center gap-1">
                <Info className="w-3 h-3 text-orange-500" />
                ملاحظات م. سارة
              </p>
              <div className="space-y-1">
                {analysis.currentIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-orange-400 text-xs mt-0.5">•</span>
                    <p className="text-xs text-[#6B4C1E] leading-relaxed">{issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* التنبيهات الفنية — بطاقة مميزة */}
          {analysis.technicalWarnings && analysis.technicalWarnings.length > 0 && (
            <div className="mt-3 rounded-xl border border-orange-300 bg-orange-50 p-3">
              <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
                <span>⚠️</span>
                تنبيهات فنية تتطلب معالجة خاصة
              </p>
              <div className="space-y-2">
                {analysis.technicalWarnings.map((w, i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5 border border-orange-200">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-orange-800">{w.issue}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        w.severity === 'عالي' ? 'bg-red-100 text-red-700' :
                        w.severity === 'متوسط' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{w.severity}</span>
                    </div>
                    {w.location && <p className="text-[10px] text-orange-600 mb-1">📍 {w.location}</p>}
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      <span className="font-semibold">المعالجة:</span> {w.treatment}
                    </p>
                    {w.specialist && (
                      <p className="text-[10px] text-gray-600 mt-1">
                        <span className="font-semibold">المختص:</span> {w.specialist}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-orange-600 mt-2 leading-relaxed">
                ℹ️ تم استبدال هذه الأسطح في التصور التصميمي. يُنصح بمعالجتها قبل البدء بالتنفيذ.
              </p>
            </div>
          )}

          {/* المواد الحالية */}
          {analysis.currentMaterials?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#5C3D11] mb-2">المواد الحالية</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.currentMaterials.map((m, i) => (
                  <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Structural Suggestions Card =====
function StructuralSuggestionsCard({ suggestions }: { suggestions: StructuralSuggestion[] }) {
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-amber-800 text-sm">مقترحات تحسين بنيوية</span>
          <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
            {suggestions.length} مقترح
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[10px] text-amber-700 bg-amber-100 rounded-xl px-3 py-2 leading-relaxed">
            ⚠️ هذه مقترحات اختيارية تتطلب أعمال إنشائية. م. سارة تقدمها كأفكار إضافية — التصاميم الأساسية تحافظ على البنية الأصلية.
          </p>
          {suggestions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <button
                onClick={() => setOpenId(openId === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-[#5C3D11]">{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-700 font-bold">{s.additionalCost}</span>
                  {openId === s.id ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-600" />}
                </div>
              </button>
              {openId === s.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-amber-100">
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-[#8B6914] flex-shrink-0 mt-0.5">السبب:</span>
                      <p className="text-[10px] text-[#6B4C1E] leading-relaxed">{s.reason}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-green-700 flex-shrink-0 mt-0.5">الفائدة:</span>
                      <p className="text-[10px] text-green-800 leading-relaxed">{s.benefit}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-700 leading-relaxed font-medium">{s.structuralWarning}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-2 py-1.5">
                      <span className="text-[10px] text-amber-700">⏱️ {s.timeRequired}</span>
                      <span className="text-[10px] text-amber-800 font-bold mr-auto">{s.additionalCost} إضافية</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Idea Card Component =====
// ===== Shop The Look Component =====
// الأثاث الافتراضي حسب نوع الفضاء
// يعمل بطريقتين: (1) تحليل الصورة إذا توفرت (2) بحث مباشر بناءً على بيانات الفكرة
const SPACE_FURNITURE_MAP: Record<string, string[]> = {
  "صالة": ["sofa", "coffee table", "tv unit", "armchair", "rug"],
  "غرفة معيشة": ["sofa", "coffee table", "tv unit", "armchair", "rug"],
  "غرفة نوم": ["bed", "wardrobe", "bedside table", "dresser"],
  "مطبخ": ["dining table", "dining chair", "kitchen cabinet"],
  "غرفة طعام": ["dining table", "dining chair", "sideboard"],
  "مكتب": ["desk", "office chair", "bookshelf"],
  "مجلس": ["sofa", "armchair", "coffee table", "rug", "cushion"],
  "مدخل": ["console table", "mirror", "coat rack"],
  "حمام": ["bathroom vanity", "mirror", "towel rack"],
};

function ShopTheLookPanel({
  imageUrl,
  designStyle,
  styleLabel,
  materials,
  spaceType,
}: {
  imageUrl: string;
  designStyle: string;
  styleLabel?: string;
  materials?: string[];
  spaceType?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPieceIdx, setSelectedPieceIdx] = useState<number | null>(null);

  const extractMutation = trpc.bonyan.extractFurnitureFromImage.useMutation();
  const matchMutation = trpc.bonyan.matchFurnitureToProducts.useMutation();

  // البحث المباشر بدون صورة — يستخدم بيانات الفكرة مباشرة
  const handleDirectSearch = async () => {
    const spaceKey = Object.keys(SPACE_FURNITURE_MAP).find(k => (spaceType || "").includes(k)) || "غرفة معيشة";
    const defaultPieces = SPACE_FURNITURE_MAP[spaceKey] || ["sofa", "coffee table", "rug"];
    const furniturePieces = defaultPieces.slice(0, 4).map(keyword => ({
      nameAr: keyword === "sofa" ? "كنبة" :
               keyword === "coffee table" ? "طاولة قهوة" :
               keyword === "tv unit" ? "وحدة تلفزيون" :
               keyword === "armchair" ? "كرسي استراحة" :
               keyword === "rug" ? "سجادة" :
               keyword === "bed" ? "سرير" :
               keyword === "wardrobe" ? "خزانة" :
               keyword === "dining table" ? "طاولة طعام" :
               keyword === "dining chair" ? "كرسي طعام" :
               keyword === "desk" ? "مكتب" :
               keyword === "bookshelf" ? "رف كتب" :
               keyword === "mirror" ? "مرآة" : keyword,
      nameEn: keyword,
      description: `${styleLabel || designStyle} نمط — ${materials?.slice(0, 2).join(", ") || ""}`,
      searchKeyword: keyword,
      priority: "أساسي",
    }));
    await matchMutation.mutateAsync({ furniturePieces });
  };

  const handleExtract = async () => {
    setIsOpen(true);
    if (matchMutation.data || extractMutation.data) return; // already done
    if (imageUrl) {
      // عندما توجد صورة: تحليل الصورة بالذكاء الاصطناعي
      await extractMutation.mutateAsync({ imageUrl, designStyle, spaceType });
    } else {
      // بدون صورة: بحث مباشر بناءً على نوع الفضاء والنمط
      await handleDirectSearch();
    }
  };

  const handleMatch = async (idx: number) => {
    if (!extractMutation.data?.furniturePieces) return;
    setSelectedPieceIdx(idx);
    const piece = extractMutation.data.furniturePieces[idx];
    if (!piece) return;
    await matchMutation.mutateAsync({ furniturePieces: [piece] });
  };

  const handleMatchAll = async () => {
    if (!extractMutation.data?.furniturePieces?.length) return;
    setSelectedPieceIdx(null);
    await matchMutation.mutateAsync({ furniturePieces: extractMutation.data.furniturePieces.slice(0, 5) });
  };

  const BONYAN_BASE = "https://bonyanpltf-gegfwhcg.manus.space";

  const isLoading = extractMutation.isPending || matchMutation.isPending;
  // البيانات المعروضة: إما من تحليل الصورة أو من البحث المباشر
  const displayResults = matchMutation.data;
  const extractedPieces = extractMutation.data?.furniturePieces || [];

  return (
    <div className="mt-3">
      <button
        onClick={handleExtract}
        disabled={isLoading}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-70"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          {isLoading
            ? (imageUrl ? "جاري تحليل الصورة..." : "جاري البحث في بنيان...")
            : "اشتري هذا الديكور من بنيان"}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 bg-amber-50 rounded-2xl border border-amber-200 p-3">

          {/* حالة التحميل */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6">
              <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-xs text-amber-700">م. سارة تبحث في متاجر بنيان...</p>
            </div>
          )}

          {/* بعد تحليل الصورة: عرض القطع المكتشفة وزر بحث عن الكل */}
          {!isLoading && extractedPieces.length > 0 && !displayResults && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-800">
                  {extractedPieces.length} قطعة مكتشفة — اختر للبحث
                </p>
                <button
                  onClick={handleMatchAll}
                  disabled={isLoading}
                  className="text-[10px] font-bold text-white bg-amber-600 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  بحث عن الكل
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extractedPieces.map((piece, i) => (
                  <button
                    key={i}
                    onClick={() => handleMatch(i)}
                    disabled={isLoading}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                      selectedPieceIdx === i
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-amber-800 border-amber-300"
                    }`}
                  >
                    {piece.nameAr}
                    {piece.priority === "أساسي" && <span className="mr-1 text-amber-400">★</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* نتائج المطابقة */}
          {!isLoading && displayResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-amber-800">
                  {displayResults.totalMatches} منتج من بنيان
                </p>
                <button
                  onClick={() => { matchMutation.reset(); extractMutation.reset(); }}
                  className="text-[10px] text-amber-600 underline"
                >
                  بحث جديد
                </button>
              </div>
              {displayResults.results.map((result, ri) => (
                result.matches.length > 0 && (
                  <div key={ri}>
                    <p className="text-[10px] font-bold text-amber-700 mb-1.5">
                      {result.piece.nameAr}
                      <span className="text-amber-500 mr-1">({result.matches.length} منتج)</span>
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {result.matches.map((product, pi) => (
                        <a
                          key={pi}
                          href={`${BONYAN_BASE}/products/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-28 bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm active:scale-95 transition-transform"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.nameAr || product.nameEn}
                            className="w-full h-20 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x80/f5f0e8/8B6914?text=أثاث"; }}
                          />
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
              {displayResults.totalMatches === 0 && (
                <p className="text-xs text-amber-600 text-center py-2">لم يتم العثور على منتجات مطابقة حالياً</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== PDF Export: دفتر التصميم الاحترافي (html2canvas approach for proper Arabic) =====
// تحويل URL صورة إلى base64 data URL لتجنب مشاكل CORS في html2canvas
async function imageUrlToBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url; // already base64
  try {
    const response = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generateDesignBookPDF(idea: DesignIdea, spaceType?: string) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  // Ensure fonts are loaded
  await document.fonts.ready;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;

  const gold = "#C9A84C";
  const darkBrown = "#5C3D11";
  const lightBg = "#faf6f0";
  const white = "#ffffff";
  const emerald = "#107C5A";
  const today = new Date().toLocaleDateString("ar-AE");

  // تحويل صورة التصميم إلى base64 مسبقاً لتجنب CORS
  const imageBase64 = idea.imageUrl ? await imageUrlToBase64(idea.imageUrl) : null;

  // Helper: render HTML page to canvas and add to PDF
  async function addHtmlPage(html: string, isFirst = false) {
    const container = document.createElement("div");
    container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:794px;min-height:1123px;background:${lightBg};font-family:'Tajawal','Arial',sans-serif;direction:rtl;`;
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      // انتظار تحميل الصور داخل الـ container
      const imgs = container.querySelectorAll("img");
      await Promise.all(Array.from(imgs).map(img =>
        img.complete ? Promise.resolve() : new Promise<void>(res => {
          img.onload = () => res();
          img.onerror = () => res();
        })
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: lightBg,
        logging: false,
        width: 794,
        height: 1123,
        imageTimeout: 8000,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.88);
      if (!isFirst) doc.addPage();
      doc.addImage(imgData, "JPEG", 0, 0, W, H);
    } finally {
      document.body.removeChild(container);
    }
  }

  // ===== صفحة 1: الغلاف =====
  const paletteSwatches = idea.palette.map(c => `
    <div style="display:inline-block;text-align:center;margin:0 5px;">
      <div style="width:52px;height:30px;background:${c.hex};border-radius:6px;border:1px solid #d4b87a;"></div>
      <div style="font-size:9px;color:${darkBrown};margin-top:3px;">${c.name}</div>
    </div>`).join("");

  // استخدام base64 للصورة لتجنب مشاكل CORS في html2canvas
  const imgTag = imageBase64
    ? `<img src="${imageBase64}" style="width:100%;height:320px;object-fit:cover;border-radius:8px;border:3px solid ${gold};display:block;margin-bottom:14px;" />`
    : `<div style="width:100%;height:320px;background:linear-gradient(135deg,${gold},${darkBrown});border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><span style="color:white;font-size:18px;font-weight:bold;">صورة التصميم</span></div>`;

  await addHtmlPage(`
    <div style="background:${lightBg};min-height:1123px;padding:0;">
      <div style="background:${gold};padding:12px 20px;text-align:center;">
        <span style="color:${white};font-size:13px;font-weight:bold;">م. سارة | خبيرة التصميم المعماري والبيئي بالذكاء الاصطناعي</span>
      </div>
      <div style="background:${darkBrown};height:3px;"></div>
      <div style="padding:18px 24px;">
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
      <div style="background:${gold};padding:6px 20px;text-align:center;position:absolute;bottom:0;width:100%;box-sizing:border-box;">
        <span style="color:${white};font-size:8px;">م. سارة — دفتر التصميم الاحترافي — ${today} | fada.mousa.ai</span>
      </div>
    </div>`, true);

  // ===== صفحة 2: المزايا والأثاث =====
  const highlightsHtml = idea.highlights.map(h => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #e8f5ee;">
      <div style="width:7px;height:7px;background:${emerald};border-radius:50%;flex-shrink:0;margin-top:3px;"></div>
      <span style="font-size:10px;color:#503c1e;">${h}</span>
    </div>`).join("");

  await addHtmlPage(`
    <div style="background:${lightBg};min-height:1123px;padding:0;">
      <div style="background:${gold};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${white};font-size:11px;font-weight:bold;">م. سارة | مزايا التصميم</span>
        <span style="color:${white};font-size:11px;font-weight:bold;">${idea.title}</span>
      </div>
      <div style="padding:18px 24px;">
        <h2 style="font-size:16px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 5px;">مزايا ومميزات التصميم</h2>
        <hr style="border:none;border-top:1px solid ${gold};margin:0 0 12px;" />
        <div style="column-count:2;column-gap:20px;margin-bottom:20px;">${highlightsHtml}</div>

        ${idea.replacementCosts && idea.replacementCosts.length > 0 ? `
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
        </table>` : ""}

        <div style="background:${white};border-radius:8px;padding:12px 16px;margin-top:16px;border:1px solid #e8d9c0;">
          <div style="font-size:11px;font-weight:bold;color:${darkBrown};margin-bottom:8px;">توصيات التنفيذ</div>
          ${[
            `النمط المختار: ${idea.styleLabel} — يتطلب مقاولاً متخصصاً في هذا النمط`,
            `الميزانية التقديرية: ${idea.estimatedCost} — يُنصح بتخصيص 10-15% احتياطياً للطوارئ`,
            `الجدول الزمني: ${idea.timeline || "يُحدد بعد الاتفاق مع المقاول"}`,
            "يُنصح بالحصول على 3 عروض أسعار من مقاولين معتمدين قبل البدء",
            "م. سارة تقدم هذا التصميم كمرجع إلهامي — التنفيذ النهائي يحتاج مهندساً معتمداً",
          ].map(r => `<div style="font-size:9px;color:#503c1e;padding:3px 0;border-bottom:1px solid #f0e8d8;">• ${r}</div>`).join("")}
        </div>
      </div>
      <div style="background:${gold};padding:6px 20px;text-align:center;position:absolute;bottom:0;width:100%;box-sizing:border-box;">
        <span style="color:${white};font-size:8px;">م. سارة — مزايا التصميم — ${today} | fada.mousa.ai</span>
      </div>
    </div>`);

  // ===== صفحة 3: BOQ =====
  if (idea.boq && idea.boq.categories.length > 0) {
    const boqTablesHtml = idea.boq.categories.map(cat => {
      const rows = cat.items.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? white : "#f5f0e8"};">
          <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;">${item.name}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.unit}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.qty}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;text-align:center;">${item.unitPriceMin.toLocaleString()} – ${item.unitPriceMax.toLocaleString()}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e8d9c0;font-size:9px;font-weight:bold;text-align:center;">${item.totalMin.toLocaleString()} – ${item.totalMax.toLocaleString()}</td>
        </tr>`).join("");
      return `
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
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join("");

    await addHtmlPage(`
      <div style="background:${lightBg};min-height:1123px;padding:0;">
        <div style="background:${gold};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:${white};font-size:11px;font-weight:bold;">م. سارة | جدول الكميات BOQ</span>
          <span style="color:${white};font-size:11px;font-weight:bold;">${idea.title}</span>
        </div>
        <div style="padding:16px 24px;">
          <h2 style="font-size:16px;font-weight:bold;color:${darkBrown};text-align:center;margin:0 0 4px;">جدول الكميات والمواصفات (BOQ)</h2>
          <p style="font-size:9px;color:#888;text-align:center;margin:0 0 12px;">الفضاء: ${spaceType || "غير محدد"} | المساحة: ${idea.boq.area} م² | المحيط: ${idea.boq.perimeter} م</p>
          ${boqTablesHtml}
          <div style="background:${emerald};border-radius:8px;padding:12px 20px;text-align:center;margin-top:14px;">
            <div style="color:${white};font-size:14px;font-weight:bold;">الإجمالي الكلي التقديري</div>
            <div style="color:${white};font-size:12px;margin-top:4px;">${idea.boq.grandTotalMin.toLocaleString()} – ${idea.boq.grandTotalMax.toLocaleString()} د.إ</div>
          </div>
          ${idea.boq.disclaimer ? `<p style="font-size:8px;color:#888;text-align:center;margin-top:10px;">${idea.boq.disclaimer}</p>` : ""}
        </div>
        <div style="background:${gold};padding:6px 20px;text-align:center;position:absolute;bottom:0;width:100%;box-sizing:border-box;">
          <span style="color:${white};font-size:8px;">م. سارة — جدول الكميات — ${today} | fada.mousa.ai</span>
        </div>
      </div>`);
  }

  // حفظ الملف
  const fileName = `م_سارة_${idea.title.replace(/\s+/g, "_").substring(0, 30)}_${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
}

function IdeaCard({
  idea,
  onGenerateImage,
  onFavorite,
  isFavorited,
  spaceType,
  originalImageUrl,
  onUpdateIdea,
}: {
  idea: DesignIdea;
  onGenerateImage: (id: string) => void;
  onFavorite: (id: string) => void;
  isFavorited: boolean;
  spaceType?: string;
  originalImageUrl?: string;
  onUpdateIdea?: (id: string, updates: Partial<DesignIdea>) => void;
}) {
  const { t, dir } = useLanguage();
  const [showReplacement, setShowReplacement] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showBOQ, setShowBOQ] = useState(false);
  const [expandedBOQCat, setExpandedBOQCat] = useState<string | null>(null);
  const [showRefine, setShowRefine] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [refineClickX, setRefineClickX] = useState<number | undefined>(undefined);
  const [refineClickY, setRefineClickY] = useState<number | undefined>(undefined);
  const [isRefining, setIsRefining] = useState(false);
  const refineImageRef = useRef<HTMLDivElement>(null);

  // مؤشر الوقت أثناء توليد الصورة
  const [imgElapsed, setImgElapsed] = useState(0);
  const imgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (idea.isGeneratingImage) {
      setImgElapsed(0);
      imgTimerRef.current = setInterval(() => setImgElapsed(s => s + 1), 1000);
    } else {
      if (imgTimerRef.current) clearInterval(imgTimerRef.current);
    }
    return () => { if (imgTimerRef.current) clearInterval(imgTimerRef.current); };
  }, [idea.isGeneratingImage]);

  // حالة تصدير PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateDesignBookPDF(idea, spaceType);
      toast.success("تم تصدير دفتر التصميم بنجاح! تحقق من مجلد التنزيلات");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[PDF Export Error]", errMsg, err);
      // رسائل خطأ مختلفة حسب نوع المشكلة
      if (errMsg.includes("canvas") || errMsg.includes("tainted") || errMsg.includes("CORS")) {
        toast.error("خطأ في معالجة الصورة — جاري التصدير بدون صورة...");
        // محاولة ثانية بدون صورة
        try {
          await generateDesignBookPDF({ ...idea, imageUrl: undefined }, spaceType);
          toast.success("تم تصدير الدفتر بدون صورة (جاري إصلاح الصورة)");
        } catch {
          toast.error("تعذّر تصدير PDF — حاول مرة أخرى");
        }
      } else if (errMsg.includes("memory") || errMsg.includes("heap")) {
        toast.error("الملف كبير جداً — جاري تقليل جودة الصورة...");
      } else {
        toast.error("تعذّر تصدير PDF — تأكد من اتصال الإنترنت وحاول مرة أخرى");
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  // حالة تغيير النمط
  const [showStyleChanger, setShowStyleChanger] = useState(false);
  const [selectedNewStyle, setSelectedNewStyle] = useState<string | null>(null);
  const [selectedNewColors, setSelectedNewColors] = useState<string[]>([]);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);

  const refineMutation = trpc.refineDesign.useMutation();
  const applyStyleMutation = trpc.applyStyleToIdea.useMutation();
  const { deduct: deductCredit } = useMousaCredit();

  const handleApplyStyle = async () => {
    if (!selectedNewStyle || !idea.imageUrl) return;
    setIsApplyingStyle(true);
    try {
      const result = await applyStyleMutation.mutateAsync({
        currentImageUrl: idea.imageUrl,
        currentTitle: idea.title,
        currentDescription: idea.description,
        newStyle: selectedNewStyle,
        newColors: selectedNewColors.length > 0 ? selectedNewColors : undefined,
        spaceType: spaceType,
      });
      if (result.success && result.imageUrl) {
        deductCredit("applyStyle", "تغيير نمط التصميم").catch(() => {});
        onUpdateIdea?.(idea.id, {
          imageUrl: result.imageUrl,
          title: result.newTitle,
          description: result.newDescription,
        });
        setShowStyleChanger(false);
        setSelectedNewStyle(null);
        setSelectedNewColors([]);
      } else {
        toast.error("حدث خطأ أثناء تغيير النمط");
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير النمط");
    } finally {
      setIsApplyingStyle(false);
    }
  };

  const handleRefineImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setRefineClickX(Math.round(x));
    setRefineClickY(Math.round(y));
  };

  const handleRefineSubmit = async () => {
    if (!refineText.trim() || !idea.imageUrl || !originalImageUrl) return;
    setIsRefining(true);
    try {
      const result = await refineMutation.mutateAsync({
        originalImageUrl,
        generatedImageUrl: idea.imageUrl,
        refinementRequest: refineText,
        clickX: refineClickX,
        clickY: refineClickY,
        originalPrompt: idea.imagePrompt,
      });
      if (result.imageUrl && onUpdateIdea) {
        onUpdateIdea(idea.id, { imageUrl: result.imageUrl });
        setShowRefine(false);
        setRefineText("");
        setRefineClickX(undefined);
        setRefineClickY(undefined);
        toast.success("تم تحسين التصميم بنجاح!");
      } else {
        toast.error("حدث خطأ أثناء التحسين");
      }
    } catch {
      toast.error("حدث خطأ أثناء التحسين");
    } finally {
      setIsRefining(false);
    }
  };

  const scenario = SCENARIO_COLORS[idea.scenario] || SCENARIO_COLORS.surface;

  return (
    <div className="bg-white rounded-3xl border border-[#e8d9c0] shadow-sm overflow-hidden">
      {/* صورة تصورية */}
      <div className="relative">
        {idea.imageUrl ? (
          <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
            <img src={idea.imageUrl} className="w-full h-52 object-cover" alt={idea.title} />
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> {t("smart.zoom")}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
              disabled={isExportingPDF}
              className="absolute bottom-2 left-2 bg-[#C9A84C]/90 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-[#C9A84C] transition-colors disabled:opacity-60"
            >
              {isExportingPDF ? (
                <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> جاري...</>
              ) : (
                <><FileDown className="w-3 h-3" /> تصدير PDF</>
              )}
            </button>
          </div>
        ) : idea.isGeneratingImage ? (
          <div className="w-full h-52 bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Wand2 className="w-7 h-7 text-[#C9A84C] animate-pulse" />
            </div>
            <p className="text-sm text-[#8B6914] font-medium">{t("smart.generating")}</p>
            <p className="text-xs text-[#C9A84C] font-mono">{imgElapsed}s / ~10-25s</p>
            <p className="text-[10px] text-[#8B6914]/60">تحافظ على موقع الأبواب والسلالم</p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="w-full h-52 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${idea.palette[0]?.hex || "#C9A84C"}30, ${idea.palette[1]?.hex || "#F5F0E8"}60)`,
            }}
            onClick={() => onGenerateImage(idea.id)}
          >
            <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur flex items-center justify-center shadow-lg">
              <Wand2 className="w-7 h-7 text-[#8B6914]" />
            </div>
            <p className="text-sm font-bold text-[#5C3D11]">{t("smart.generateIdeas")}</p>
            <p className="text-[10px] text-[#8B6914]/70">مع الحفاظ على البنية الأصلية</p>
            <div className="flex gap-1.5">
              {idea.palette.slice(0, 4).map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>
        )}

        {/* Badge النمط */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#5C3D11] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {idea.styleLabel}
        </div>

        {/* Badge السيناريو */}
        <div
          className="absolute top-3 left-12 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm border"
          style={{ backgroundColor: scenario.bg, color: scenario.text, borderColor: scenario.border }}
        >
          {scenario.label}
        </div>

        {/* أزرار الإجراءات */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <button
            onClick={() => onFavorite(idea.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
              isFavorited ? "bg-red-500 text-white" : "bg-white/90 text-[#8B6914]"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-white" : ""}`} />
          </button>
          {idea.imageUrl && (
            <button
              onClick={() => onGenerateImage(idea.id)}
              className="w-8 h-8 rounded-full bg-white/90 text-[#8B6914] flex items-center justify-center shadow-sm"
              title={t("smart.regenerate")}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {idea.imageUrl && originalImageUrl && (
            <button
              onClick={() => setShowRefine(!showRefine)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                showRefine ? "bg-[#C9A84C] text-white" : "bg-white/90 text-[#8B6914]"
              }`}
              title={t("smart.refine")}
            >
              <span className="text-sm">✏️</span>
            </button>
          )}
          {idea.imageUrl && (
            <button
              onClick={() => setShowStyleChanger(!showStyleChanger)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                showStyleChanger ? "bg-[#C9A84C] text-white" : "bg-white/90 text-[#8B6914]"
              }`}
              title={t("smart.changeStyle")}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* التكلفة */}
        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {idea.estimatedCost}
        </div>

        {/* المدة الزمنية */}
        {idea.timeline && (
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] px-2 py-1 rounded-full">
            ⏱️ {idea.timeline}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title + Description */}
        <h3 className="font-black text-[#5C3D11] text-base mb-1">{idea.title}</h3>
        <p className="text-xs text-[#6B4C1E] leading-relaxed mb-3">{idea.description}</p>

        {/* Color palette */}
        <div className="flex gap-1.5 mb-3">
          {idea.palette.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="w-full h-8 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
              <span className="text-[9px] text-[#8B6914] text-center leading-tight">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Materials */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.materials.map((m, i) => (
            <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">{m}</span>
          ))}
        </div>

        {/* Cost summary */}
        <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-3 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setShowReplacement(!showReplacement)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/70 mb-0.5">{t("smart.cost")}</p>
              <p className="text-base font-black text-white">{idea.estimatedCost}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <DollarSign className="w-5 h-5 text-white/70" />
              {showReplacement ? <ChevronUp className="w-3 h-3 text-white/70" /> : <ChevronDown className="w-3 h-3 text-white/70" />}
            </div>
          </div>
        </div>

        {/* Replacement costs */}
        {showReplacement && idea.replacementCosts.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-xs font-bold text-[#5C3D11] mb-2">تكاليف الاستبدال التفصيلية:</p>
            {idea.replacementCosts.map((r, i) => (
              <div key={i} className="bg-[#faf6f0] rounded-xl p-3 border border-[#e8d9c0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#5C3D11]">{r.item}</span>
                  <span className="text-[10px] text-[#C9A84C] font-bold bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">{r.replacementCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8B6914]/60">التقدير الحالي: {r.currentEstimate}</span>
                </div>
                {r.notes && <p className="text-[10px] text-[#8B6914]/70 mt-1 leading-tight">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Highlights toggle */}
        <button onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between py-2 border-t border-[#f0e8d8]">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#5C3D11]">{t("smart.advantages")} ({idea.highlights.length})</span>
          </div>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-[#8B6914]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B6914]" />}
        </button>
        {showDetails && (
          <div className="mt-2 space-y-1.5">
            {idea.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B4C1E] leading-relaxed">{h}</p>
              </div>
            ))}
          </div>
        )}

        {/* Generate image button if not generated */}
        {!idea.imageUrl && !idea.isGeneratingImage && (
          <button onClick={() => onGenerateImage(idea.id)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-[#C9A84C]/10 text-[#8B6914] text-xs font-bold rounded-xl border border-[#C9A84C]/30 active:scale-95 transition-transform">
            <Wand2 className="w-3.5 h-3.5" />
            توليد الصورة التصورية (مع الحفاظ على البنية)
          </button>
        )}

        {/* جدول الكميات الهندسي */}
        {idea.boq && (
          <div className="mt-3">
            {/* زر تصدير دفتر التصميم */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-[#C9A84C] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-60"
            >
              {isExportingPDF ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> جاري إعداد دفتر التصميم...</>
              ) : (
                <><FileDown className="w-4 h-4" /> {t("smart.exportPdf")}</>
              )}
            </button>
            <button
              onClick={() => setShowBOQ(!showBOQ)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 text-white text-sm font-bold active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span>{t("smart.boq")}</span>
                {idea.boq.source === "estimated" && (
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">تقديري</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full">
                  {idea.boq.grandTotalMin.toLocaleString()} – {idea.boq.grandTotalMax.toLocaleString()} د.إ
                </span>
                {showBOQ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showBOQ && (
              <div className="mt-2 bg-emerald-50 rounded-2xl border border-emerald-200 overflow-hidden">
                {/* معلومات الغرفة */}
                <div className="px-4 py-3 bg-emerald-100/50 border-b border-emerald-200">
                  {/* مصدر الأبعاد */}
                  <div className={`flex items-center justify-center gap-1.5 mb-2 px-2 py-1 rounded-lg text-[9px] font-bold ${
                    idea.boq.source === 'exact'
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <span>{idea.boq.source === 'exact' ? '📍' : '🧠'}</span>
                    <span>{idea.boq.source === 'exact' ? 'أبعاد دقيقة (مدخلة يدوياً)' : 'أبعاد مقدّرة بالذكاء الاصطناعي من الصورة'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-emerald-600 font-bold">مساحة الأرضية</p>
                      <p className="text-sm font-black text-emerald-800">{idea.boq.area}م²</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-emerald-600 font-bold">مساحة الجدران</p>
                      <p className="text-sm font-black text-emerald-800">{idea.boq.wallArea}م²</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-emerald-600 font-bold">المحيط</p>
                      <p className="text-sm font-black text-emerald-800">{idea.boq.perimeter}م</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-emerald-600 mt-2 text-center">{idea.boq.disclaimer}</p>
                  {idea.boq.source === 'estimated' && (
                    <p className="text-[8px] text-amber-600 mt-1 text-center">
                      💡 لدقة أعلى: أدخل أبعاد الغرفة يدوياً في خيارات التخصيص
                    </p>
                  )}
                </div>

                {/* الفئات */}
                <div className="divide-y divide-emerald-100">
                  {idea.boq.categories.map((cat, ci) => (
                    <div key={ci}>
                      <button
                        onClick={() => setExpandedBOQCat(expandedBOQCat === cat.category ? null : cat.category)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon || '📦'}</span>
                          <span className="text-xs font-bold text-emerald-800">{cat.category}</span>
                          <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            {cat.items.length} بند
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-700">
                            {(cat.subtotalMin || 0).toLocaleString()} – {(cat.subtotalMax || 0).toLocaleString()}
                          </span>
                          {expandedBOQCat === cat.category
                            ? <ChevronUp className="w-3 h-3 text-emerald-600" />
                            : <ChevronDown className="w-3 h-3 text-emerald-600" />}
                        </div>
                      </button>

                      {expandedBOQCat === cat.category && (
                        <div className="px-4 pb-3">
                          <div className="overflow-x-auto">
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
                                {cat.items.map((item, ii) => (
                                  <tr key={ii} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                                    <td className="py-1.5 text-emerald-900 font-medium leading-tight">
                                      <div>{item.name}</div>
                                      {item.basis && (
                                        <div className="text-[8px] text-emerald-500 mt-0.5">{item.basis}</div>
                                      )}
                                    </td>
                                    <td className="text-center py-1.5 text-emerald-700">{item.unit}</td>
                                    <td className="text-center py-1.5 font-bold text-emerald-800">{item.qty}</td>
                                    <td className="text-center py-1.5 text-emerald-700">
                                      {item.unitPriceMin.toLocaleString()}–{item.unitPriceMax.toLocaleString()}
                                    </td>
                                    <td className="text-center py-1.5 font-black text-emerald-800">
                                      {item.totalMin.toLocaleString()}–{item.totalMax.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-emerald-100">
                                  <td colSpan={4} className="py-1.5 px-1 text-right font-black text-emerald-800">مجموع {cat.category}</td>
                                  <td className="text-center py-1.5 font-black text-emerald-800">
                                    {(cat.subtotalMin || 0).toLocaleString()}–{(cat.subtotalMax || 0).toLocaleString()}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {cat.items.some(i => i.notes) && (
                            <div className="mt-2 space-y-1">
                              {cat.items.filter(i => i.notes).map((item, ii) => (
                                <p key={ii} className="text-[9px] text-emerald-600">
                                  <span className="font-bold">{item.name}:</span> {item.notes}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* الإجمالي الكلي */}
                <div className="px-4 py-3 bg-emerald-700 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">إجمالي جدول الكميات</span>
                    <span className="text-sm font-black">
                      {idea.boq.grandTotalMin.toLocaleString()} – {idea.boq.grandTotalMax.toLocaleString()} د.إ
                    </span>
                  </div>
                  <p className="text-[9px] text-white/60 mt-1">★ الأسعار تقديرية وفق متوسط سوق الإمارات 2024-2025 • لا تشمل ضريبة القيمة المضافة</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop The Look — استخراج مصدر الأثاث من بنيان */}
        <ShopTheLookPanel
          imageUrl={idea.imageUrl || ""}
          designStyle={idea.style}
          styleLabel={idea.styleLabel}
          materials={idea.materials}
          spaceType={spaceType}
        />

        {/* واجهة التحسين الذكي — inline full-screen */}
        {showRefine && idea.imageUrl && originalImageUrl && (
          <div className="fixed inset-0 z-[200] bg-[#faf6f0] flex flex-col" dir={dir}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8d9c0] shadow-sm">
              <button onClick={() => { setShowRefine(false); setRefineClickX(undefined); setRefineClickY(undefined); setRefineText(""); }}
                className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-[#5C3D11]">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-black text-[#5C3D11]">✏️ تحسين التصميم</p>
                <p className="text-[10px] text-[#8B6914]/60">{idea.title}</p>
              </div>
              <div className="w-9" />
            </div>

            {/* الصورة الكاملة مع إمكانية النقر */}
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                <p className="text-[10px] text-[#8B6914]/70 text-center py-2 bg-[#C9A84C]/5">
                  {refineClickX !== undefined
                    ? `📍 تم تحديد المنطقة (${refineClickX}%, ${refineClickY}%) — اضغط مرة أخرى لتغييرها`
                    : 'اضغط على المنطقة التي تريد تحسينها (اختياري)'}
                </p>
                <div
                  ref={refineImageRef}
                  className="relative cursor-crosshair"
                  onClick={handleRefineImageClick}
                >
                  <img src={idea.imageUrl} className="w-full object-cover" style={{ maxHeight: '55vh' }} alt="التصميم الحالي" />
                  {refineClickX !== undefined && refineClickY !== undefined && (
                    <div
                      className="absolute w-8 h-8 rounded-full border-4 border-[#C9A84C] bg-[#C9A84C]/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                      style={{ left: `${refineClickX}%`, top: `${refineClickY}%` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
                    <span className="text-white text-xs bg-black/60 px-3 py-1.5 rounded-full">📍 اضغط لتحديد المنطقة</span>
                  </div>
                </div>
              </div>

              {/* اقتراحات سريعة */}
              <div className="px-4 pt-4">
                <p className="text-[10px] text-[#8B6914]/60 mb-2">اقتراحات سريعة:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["غيّر لون الجدار", "أضف سجادة", "غيّر الإضاءة", "أضف نباتات", "غيّر الستائر", "أضف لوحة فنية"].map(hint => (
                    <button
                      key={hint}
                      onClick={() => setRefineText(hint)}
                      className={`text-[10px] px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                        refineText === hint
                          ? 'bg-[#C9A84C] text-white border-[#C9A84C]'
                          : 'bg-white text-[#8B6914] border-[#e8d9c0]'
                      }`}
                    >
                      {hint}
                    </button>
                  ))}
                </div>

                {/* حقل النص */}
                <textarea
                  value={refineText}
                  onChange={e => setRefineText(e.target.value)}
                  placeholder="صف التغيير المطلوب... مثل: غيّر لون الجدار إلى أخضر زيتوني"
                  className="w-full text-sm border-2 border-[#e8d9c0] rounded-2xl px-4 py-3 bg-white text-[#5C3D11] placeholder-[#8B6914]/40 resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
                  rows={3}
                  dir={dir}
                  autoFocus
                />
              </div>
            </div>

            {/* زر التطبيق */}
            <div className="px-4 py-4 bg-white border-t border-[#e8d9c0] safe-area-pb">
              <button
                onClick={handleRefineSubmit}
                disabled={!refineText.trim() || isRefining}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg"
              >
                {isRefining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    م. سارة تحسّن التصميم...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    تطبيق التحسين
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* شاشة تغيير النمط — full-screen */}
        {showStyleChanger && idea.imageUrl && (
          <div className="fixed inset-0 z-[200] bg-[#faf6f0] flex flex-col" dir={dir}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8d9c0] shadow-sm">
              <button onClick={() => { setShowStyleChanger(false); setSelectedNewStyle(null); setSelectedNewColors([]); }}
                className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-[#5C3D11]">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center">
               <h2 className="text-xl font-black text-[#5C3D11]">{t("smart.changeStyle")}</h2>
                <p className="text-[10px] text-[#8B6914]/60">{idea.title}</p>
              </div>
              <div className="w-9" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* معاينة الصورة الحالية */}
              <div className="relative">
                <img src={idea.imageUrl} className="w-full object-cover" style={{ maxHeight: '35vh' }} alt="التصميم الحالي" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full">التصميم الحالي</div>
              </div>

              <div className="px-4 py-4 space-y-4">
                {/* اختيار النمط الجديد */}
                <div>
                  <p className="text-sm font-bold text-[#5C3D11] mb-2">🎨 اختر النمط الجديد</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "modern", label: "عصري", icon: "🏙️", colors: ["#E0E0E0","#212121","#2196F3"] },
                      { key: "gulf", label: "خليجي", icon: "🌙", colors: ["#F5F0E8","#C9A84C","#5C3D11"] },
                      { key: "classic", label: "كلاسيكي", icon: "🏛️", colors: ["#FFF8F0","#8B6914","#4A2C0A"] },
                      { key: "minimal", label: "مينيمال", icon: "⬜", colors: ["#FAFAFA","#9E9E9E","#212121"] },
                      { key: "luxury", label: "فاخر", icon: "✨", colors: ["#1A1A1A","#C9A84C","#F5F0E8"] },
                      { key: "scandinavian", label: "سكاندنافي", icon: "❄️", colors: ["#ECEFF1","#90A4AE","#546E7A"] },
                      { key: "moroccan", label: "مغربي", icon: "🕌", colors: ["#E65100","#1565C0","#F9A825"] },
                      { key: "industrial", label: "صناعي", icon: "🔩", colors: ["#455A64","#78909C","#B0BEC5"] },
                      { key: "bohemian", label: "بوهيمي", icon: "🌿", colors: ["#8D6E63","#A5D6A7","#FFB74D"] },
                      { key: "mediterranean", label: "متوسطي", icon: "🌊", colors: ["#1565C0","#F5F5DC","#FF8F00"] },
                      { key: "neoclassical", label: "نيوكلاسيك", icon: "🏛️", colors: ["#F5F0E8","#B8860B","#4A4A4A"] },
                      { key: "art_deco", label: "آرت ديكو", icon: "💎", colors: ["#1A1A1A","#FFD700","#FFFFFF"] },
                    ].map(({ key, label, icon, colors }) => (
                      <button key={key} onClick={() => setSelectedNewStyle(selectedNewStyle === key ? null : key)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                          selectedNewStyle === key
                            ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914] shadow-sm"
                            : "border-[#e8d9c0] text-[#5C3D11]"
                        }`}>
                        <span className="text-lg">{icon}</span>
                        <div className="flex gap-0.5">
                          {colors.map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c}} />)}
                        </div>
                        <span className="text-[10px] leading-tight text-center">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* اختيار الألوان الجديدة (اختياري) */}
                <div>
                  <p className="text-sm font-bold text-[#5C3D11] mb-2">
                    🎨 ألوان محددة <span className="text-[10px] text-[#8B6914]/60 font-normal">(اختياري — متعدد)</span>
                  </p>
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
                        <button key={name}
                          onClick={() => setSelectedNewColors(prev => isSel ? prev.filter(c => c !== name) : [...prev, name])}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 transition-all ${
                            isSel ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-sm" : "border-[#e8d9c0]"
                          }`}>
                          <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                          <span className="text-[11px] text-[#5C3D11] font-medium">{name}</span>
                          {isSel && <Check className="w-3 h-3 text-[#C9A84C]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* زر التطبيق */}
            <div className="px-4 py-4 bg-white border-t border-[#e8d9c0] safe-area-pb">
              <button
                onClick={handleApplyStyle}
                disabled={!selectedNewStyle || isApplyingStyle}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg"
              >
                {isApplyingStyle ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    م. سارة تغيّر النمط...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    طبّق {selectedNewStyle ? `نمط ${selectedNewStyle}` : "النمط"} على هذه الفكرة
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox && idea.imageUrl && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <img src={idea.imageUrl} className="max-w-full max-h-full object-contain rounded-xl" alt={idea.title} />
            <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"><X className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Camera utility: open ultra-wide then apply zoom =====
async function openUltraWideCamera(): Promise<MediaStream> {
  // Try 4K first, then FHD, then any resolution
  const resolutions = [
    { width: 3840, height: 2160 },
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
  ];

  for (const res of resolutions) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: res.width },
          height: { ideal: res.height },
        },
        audio: false,
      });
      return s;
    } catch { /* try next */ }
  }
  // fallback without exact facingMode
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
}

// Apply zoom via MediaStreamTrack constraints (hardware zoom on supported devices)
async function applyHardwareZoom(stream: MediaStream, zoomLevel: number): Promise<void> {
  const track = stream.getVideoTracks()[0];
  if (!track) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caps = (track as any).getCapabilities?.();
    if (caps?.zoom) {
      const minZoom = caps.zoom.min ?? 0.5;
      const maxZoom = caps.zoom.max ?? 10;
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track as any).applyConstraints({ advanced: [{ zoom: clampedZoom }] });
    }
  } catch { /* zoom not supported */ }
}

// ===== Live Camera Component =====
function LiveCamera({
  mode,
  capturedCount,
  targetCount,
  onCapture,
  onClose,
}: {
  mode: CaptureMode;
  capturedCount: number;
  targetCount: number;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const { dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(10);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  // Pinch state
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const s = await openUltraWideCamera();
        activeStream = s;
        setStream(s);

        // Detect zoom capabilities
        const track = s.getVideoTracks()[0];
        if (track) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = (track as any).getCapabilities?.();
          if (caps?.zoom) {
            setMinZoom(caps.zoom.min ?? 0.5);
            setMaxZoom(caps.zoom.max ?? 10);
            setHasHardwareZoom(true);
            // Start at minimum zoom = widest angle
            const startZoom = caps.zoom.min ?? 0.5;
            setZoom(startZoom);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ zoom: startZoom }] }).catch(() => {});
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch {
        setError("لا يمكن الوصول للكاميرا. تأكد من منح الإذن.");
      }
    };
    startCamera();
    return () => { activeStream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const adjustZoom = async (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clamped);
    if (stream) await applyHardwareZoom(stream, clamped);
  };

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, pinchStartZoomRef.current * scale));
      setZoom(newZoom);
      if (stream) applyHardwareZoom(stream, newZoom);
    }
  };

  const handleTouchEnd = () => { pinchStartDistRef.current = null; };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.95);
    // Keep high resolution — compress only if > 2MP
    const compressed = await compressImage(raw, 2048, 0.9);
    onCapture(compressed);
  };

  // Zoom preset buttons based on capabilities
  const zoomPresets = hasHardwareZoom
    ? [minZoom, 1, 2, 3].filter(z => z <= maxZoom)
    : [1, 2, 3];

  const zoomPercent = hasHardwareZoom
    ? Math.round(((zoom - minZoom) / (maxZoom - minZoom)) * 100)
    : Math.round(((zoom - 1) / (maxZoom - 1)) * 100);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      dir={dir}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-white font-bold text-sm">التقط صورة</span>
          {/* Zoom indicator */}
          <p className="text-[#C9A84C] text-[10px] font-bold">
            {zoom < 1 ? `عريض ${zoom.toFixed(1)}×` : `زوم ${zoom.toFixed(1)}×`}
            {!hasHardwareZoom && " (رقمي)"}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Camera className="w-12 h-12 text-red-400" />
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold text-sm">
            إغلاق
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder corners */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-6 border border-white/20 rounded-2xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C9A84C] rounded-br-xl" />
            </div>
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-0.5 bg-white/40" />
              <div className="w-0.5 h-6 bg-white/40 -mt-3 mx-auto" />
            </div>
          </div>

          {/* Zoom bar + presets — bottom left */}
          <div className="absolute bottom-32 left-4 flex flex-col items-center gap-2">
            {/* Vertical zoom slider */}
            <div className="h-32 w-1.5 bg-white/20 rounded-full relative">
              <div
                className="absolute bottom-0 left-0 right-0 bg-[#C9A84C] rounded-full transition-all"
                style={{ height: `${zoomPercent}%` }}
              />
            </div>
            {/* Preset buttons */}
            <div className="flex flex-col gap-1.5">
              {zoomPresets.map(z => (
                <button
                  key={z}
                  onClick={() => adjustZoom(z)}
                  className={`w-10 h-10 rounded-full text-[11px] font-bold transition-all shadow-lg ${
                    Math.abs(zoom - z) < 0.15
                      ? "bg-[#C9A84C] text-white scale-110"
                      : "bg-black/50 text-white/80 border border-white/20"
                  }`}
                >
                  {z < 1 ? `×${z}` : `${z}×`}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom +/- buttons — right side */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <button
              onClick={() => adjustZoom(Math.min(maxZoom, zoom + 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform"
            >
              +
            </button>
            <button
              onClick={() => adjustZoom(Math.max(minZoom, zoom - 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform"
            >
              −
            </button>
          </div>

          {/* Capture button */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8">
            <button onClick={capture} disabled={!isReady}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Panorama Capture =====
function PanoramaCapture({
  onCapture,
  onClose,
}: {
  onCapture: (images: string[]) => void;
  onClose: () => void;
}) {
  const { dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(10);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const ANGLES = ["0°", "90°", "180°", "270°"];

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const s = await openUltraWideCamera();
        activeStream = s;
        setStream(s);
        // Detect & apply minimum zoom (widest angle)
        const track = s.getVideoTracks()[0];
        if (track) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = (track as any).getCapabilities?.();
          if (caps?.zoom) {
            const mn = caps.zoom.min ?? 0.5;
            const mx = caps.zoom.max ?? 10;
            setMinZoom(mn); setMaxZoom(mx);
            setZoom(mn);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ zoom: mn }] }).catch(() => {});
          }
        }
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch {
        setError("لا يمكن الوصول للكاميرا.");
      }
    };
    startCamera();
    return () => { activeStream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const adjustZoom = async (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clamped);
    if (stream) await applyHardwareZoom(stream, clamped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoom;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, pinchStartZoomRef.current * scale));
      setZoom(newZoom);
      if (stream) applyHardwareZoom(stream, newZoom);
    }
  };
  const handleTouchEnd = () => { pinchStartDistRef.current = null; };

  const captureAngle = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.85);
    const compressed = await compressImage(raw, 1280, 0.8);
    const newCaptured = [...captured, compressed];
    setCaptured(newCaptured);
    if (newCaptured.length >= 4) {
      stream?.getTracks().forEach(t => t.stop());
      onCapture(newCaptured);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      dir={dir}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">بانوراما — {captured.length}/4</p>
          <p className="text-white/60 text-[10px]">اتجاه {ANGLES[captured.length] || "مكتمل"}</p>
          <p className="text-[#C9A84C] text-[10px] font-bold">
            {zoom < 1 ? `عريض ${zoom.toFixed(1)}×` : `زوم ${zoom.toFixed(1)}×`}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold text-sm">إغلاق</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />

          {/* Progress dots */}
          <div className="absolute top-20 left-0 right-0 flex justify-center gap-2">
            {ANGLES.map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${i < captured.length ? "bg-[#C9A84C]" : "bg-white/30"}`} />
                <span className="text-[9px] text-white/60">{a}</span>
              </div>
            ))}
          </div>

          {/* Zoom +/- buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <button
              onClick={() => adjustZoom(Math.min(maxZoom, zoom + 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform"
            >+</button>
            <button
              onClick={() => adjustZoom(Math.max(minZoom, zoom - 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform"
            >−</button>
          </div>

          {/* Zoom presets */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[minZoom, 1, 2].filter(z => z <= maxZoom).map(z => (
              <button
                key={z}
                onClick={() => adjustZoom(z)}
                className={`w-10 h-10 rounded-full text-[11px] font-bold transition-all shadow-lg ${
                  Math.abs(zoom - z) < 0.15
                    ? "bg-[#C9A84C] text-white scale-110"
                    : "bg-black/50 text-white/80 border border-white/20"
                }`}
              >
                {z < 1 ? `×${z}` : `${z}×`}
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8">
            <button onClick={captureAngle} disabled={!isReady}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Video Recorder =====
function VideoRecorder({
  onCapture,
  onClose,
}: {
  onCapture: (thumb: string) => void;
  onClose: () => void;
}) {
  const { dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const s = await openUltraWideCamera();
        activeStream = s;
        setStream(s);
        // Apply widest zoom
        const track = s.getVideoTracks()[0];
        if (track) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = (track as any).getCapabilities?.();
          if (caps?.zoom) {
            const mn = caps.zoom.min ?? 0.5;
            const mx = caps.zoom.max ?? 10;
            setMinZoom(mn); setMaxZoom(mx); setZoom(mn);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ zoom: mn }] }).catch(() => {});
          }
        }
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch { setError("لا يمكن الوصول للكاميرا."); }
    };
    startCamera();
    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const adjustZoom = async (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clamped);
    if (stream) await applyHardwareZoom(stream, clamped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoom;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.max(minZoom, Math.min(maxZoom, pinchStartZoomRef.current * (dist / pinchStartDistRef.current)));
      setZoom(newZoom);
      if (stream) applyHardwareZoom(stream, newZoom);
    }
  };
  const handleTouchEnd = () => { pinchStartDistRef.current = null; };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      if (!videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const raw = canvas.toDataURL("image/jpeg", 0.85);
      const compressed = await compressImage(raw, 1280, 0.8);
      stream?.getTracks().forEach(t => t.stop());
      onCapture(compressed);
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s >= 29) { stopRecording(); return 30; }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      dir={dir}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white"><X className="w-5 h-5" /></button>
        <div className="text-center">
          {recording ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-bold text-sm">REC {seconds}s</span>
            </div>
          ) : (
            <span className="text-white font-bold text-sm">فيديو 360°</span>
          )}
          <p className="text-[#C9A84C] text-[10px] font-bold">
            {zoom < 1 ? `عريض ${zoom.toFixed(1)}×` : `زوم ${zoom.toFixed(1)}×`}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold text-sm">إغلاق</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />

          {/* Zoom +/- */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <button onClick={() => adjustZoom(Math.min(maxZoom, zoom + 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform">+</button>
            <button onClick={() => adjustZoom(Math.max(minZoom, zoom - 0.5))}
              className="w-11 h-11 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-transform">−</button>
          </div>

          {/* Zoom presets */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[minZoom, 1, 2].filter(z => z <= maxZoom).map(z => (
              <button key={z} onClick={() => adjustZoom(z)}
                className={`w-10 h-10 rounded-full text-[11px] font-bold transition-all shadow-lg ${
                  Math.abs(zoom - z) < 0.15 ? "bg-[#C9A84C] text-white scale-110" : "bg-black/50 text-white/80 border border-white/20"
                }`}>
                {z < 1 ? `×${z}` : `${z}×`}
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform ${recording ? "bg-red-500" : "bg-white/20 backdrop-blur"}`}
            >
              {recording ? (
                <div className="w-8 h-8 rounded bg-white" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Main Page =====
export default function SmartCapture() {
  const [, navigate] = useLocation();
  const { t, dir } = useLanguage();
  const { data: currentUser } = trpc.auth.me.useQuery();
   const { deduct, canAfford, balance, requiresMousa, upgradeUrl } = useMousaCredit();
  const { saveGuestDesign, hasGuestDesigns, guestDesignsCount } = useGuestDesigns();
  // UI state
  const [step, setStep] = useState<"select" | "capture" | "filter" | "analyzing" | "results">("select");
  const [selectedMode, setSelectedMode] = useState<CaptureMode | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Captured images
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [primaryImageS3Url, setPrimaryImageS3Url] = useState<string | null>(null); // S3 URL للصورة الأصلية

  // Results
  const [ideas, setIdeas] = useState<DesignIdea[]>([]);
  const [spaceAnalysis, setSpaceAnalysis] = useState<SpaceAnalysis | null>(null);
  const [structuralSuggestions, setStructuralSuggestions] = useState<StructuralSuggestion[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [ideasCount, setIdeasCount] = useState(3);
  const [budgetLevel, setBudgetLevel] = useState<"economy" | "mid" | "luxury" | "premium">("mid");
  const [budgetAmount, setBudgetAmount] = useState<string>("");
  // حرية النظر المعماري — الافتراضي: م. سارة تحافظ على مواضع الأبواب والنوافذ تلقائياً
  const [allowPlatformFreedom, setAllowPlatformFreedom] = useState(false);
  // متغيرات قديمة محتفظ بها للتوافق مع الكود القديم
  const lockStructural = false;
  const lockDoors = true;
  const lockWindows = true;
  const lockOpenings = true;
  const lockColumns = false;
  const [showFilters, setShowFilters] = useState(false);

  // Preferred style & colors (optional filters)
  const [preferredStyle, setPreferredStyle] = useState<string | null>(null);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);

  // أبعاد الغرفة الاختيارية لجدول الكميات
  const [roomLength, setRoomLength] = useState<string>("");
  const [roomWidth, setRoomWidth] = useState<string>("");
  const [roomHeight, setRoomHeight] = useState<string>("");
  const [showRoomDims, setShowRoomDims] = useState(false);

  // Design Reference state
  const [showRefCamera, setShowRefCamera] = useState(false);
  const [refFileRef] = useState(() => ({ current: null as HTMLInputElement | null }));
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null);
  const [refImageKey, setRefImageKey] = useState<string | null>(null);
  const [refUrlInput, setRefUrlInput] = useState("");
  const [showRefUrlInput, setShowRefUrlInput] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState<number | null>(null);
  const [useReference, setUseReference] = useState(false); // هل يريد تقليد مرجع؟
  const [refAnalysisResult, setRefAnalysisResult] = useState<{
    id?: number; title?: string; spaceType?: string; styleLabel?: string;
    styleKey?: string; description?: string; colorMood?: string;
    palette?: Array<{ name: string; hex: string }>; materials?: string[];
    highlights?: string[]; imageUrl?: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const BUDGET_MAP = {
    economy: { min: 5000, max: 20000, label: "اقتصادي", range: "5k-20k" },
    mid: { min: 20000, max: 60000, label: "متوسط", range: "20k-60k" },
    luxury: { min: 60000, max: 150000, label: "فاخر", range: "60k-150k" },
    premium: { min: 150000, max: 500000, label: "بريميوم", range: "150k+" },
  };

  const targetCount = 1;

  // Design Reference mutations
  const analyzeRefMutation = trpc.designReference.analyze.useMutation({
    onSuccess: (data) => {
      setRefAnalysisResult(data);
      setSelectedRefId(data.id ?? null);
      toast.success("تم حفظ المرجع بنجاح!");
    },
    onError: (err) => {
      console.error("[analyzeRefMutation error]", err);
      const msg = err?.message || "";
      if (msg.includes("UNAUTHORIZED") || msg.includes("401") || msg.includes("auth")) {
        toast.error("يجب تسجيل الدخول أولاً لاستخدام هذه الخاصية");
      } else {
        toast.error("فشل تحليل المرجع. تأكد من اتصالك وحاول مجدداً");
      }
    },
  });
  const refListQuery = trpc.designReference.list.useQuery(undefined, { enabled: useReference });

  const analyzeAndGenerateMutation = trpc.analyzeAndGenerateIdeas.useMutation({
    onSuccess: async (data) => {
      // خصم الكريدت بعد نجاح التحليل
      deduct("analyzeAndGenerate", "تحليل + توليد أفكار تصميمية").catch(() => {});
      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas.map((idea: Partial<DesignIdea> & { id?: string }) => ({
          id: idea.id || Math.random().toString(36).slice(2),
          title: idea.title || "فكرة تصميمية",
          style: idea.style || "modern",
          styleLabel: idea.styleLabel || "عصري",
          scenario: idea.scenario || "surface",
          scenarioLabel: idea.scenarioLabel || "تجديد سطحي",
          description: idea.description || "",
          palette: idea.palette || [],
          materials: idea.materials || [],
          highlights: idea.highlights || [],
          estimatedCost: idea.estimatedCost || "",
          costMin: idea.costMin || 0,
          costMax: idea.costMax || 0,
          timeline: idea.timeline || "",
          replacementCosts: idea.replacementCosts || [],
          imagePrompt: idea.imagePrompt || "",
          imageUrl: undefined,
          isGeneratingImage: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          boq: idea.boq as any,
        })));
      }
      // حفظ التحليل المعماري
      if (data.spaceAnalysis) {
        setSpaceAnalysis(data.spaceAnalysis as SpaceAnalysis);
      }
      if (data.structuralSuggestions) {
        setStructuralSuggestions(data.structuralSuggestions as StructuralSuggestion[]);
      }
      setStep("results");
      // حفظ التصميم في localStorage إذا كان الزائر غير مسجل
      if (!currentUser && data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
        const firstIdea = data.ideas[0] as Partial<DesignIdea>;
        saveGuestDesign({
          primaryImageUrl: primaryImageS3Url || primaryImage || undefined,
          spaceType: (data.spaceAnalysis as SpaceAnalysis | null)?.spaceType,
          styleLabel: firstIdea.styleLabel,
          ideas: (data.ideas as Partial<DesignIdea>[]).map(idea => ({
            id: idea.id || Math.random().toString(36).slice(2),
            title: idea.title || "",
            description: idea.description || "",
            style: idea.style || "",
            imageUrl: idea.imageUrl,
            palette: idea.palette,
            materials: idea.materials,
            totalCost: idea.costMax,
          })),
          budgetLevel,
          roomDimensions: { length: roomLength, width: roomWidth, height: roomHeight },
        });
      }
    },
    onError: (err) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!handleMousaErrorStatic(err as any)) {
        toast.error("فشل التحليل، حاول مجدداً");
      }
      // إعادة إلى select وليس capture (لأن capture لا يوجد له JSX فيترك الصفحة فارغة)
      setStep("select");
    },
  });
  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data, variables) => {
      const vars = variables as typeof variables & { ideaId?: string };
      if (data.imageUrl && vars.ideaId) {
        // خصم كريدت توليد الصورة
        deduct("generateVisualization", "توليد صورة تصورية").catch(() => {});
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === vars.ideaId
              ? { ...idea, imageUrl: data.imageUrl!, isGeneratingImage: false }
              : idea
          )
        );
        toast.success("تم توليد الصورة مع الحفاظ على البنية الأصلية!");
      } else {
        setIdeas((prev) => prev.map((idea) => ({ ...idea, isGeneratingImage: false })));
        toast.error("فشل توليد الصورة");
      }
    },
    onError: (err) => {
      setIdeas((prev) => prev.map((idea) => ({ ...idea, isGeneratingImage: false })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!handleMousaErrorStatic(err as any)) {
        toast.error("فشل توليد الصورة");
      }
    },
  });
  const handleModeSelect = (_mode: CaptureMode) => {
    setSelectedMode("single");
    setShowCamera(true);
    setStep("capture");
  };

  const handleStartCapture = () => {
    setSelectedMode("single");
    setShowCamera(true);
    setStep("capture");
  };

  const handleCapture = async (dataUrl: string) => {
    // ضغط الصورة قبل التحليل لتجنب timeout مع صور الهاتف الكبيرة
    const compressed = await compressImage(dataUrl, 1280, 0.85);
    const newImages = [...capturedImages, compressed];
    setCapturedImages(newImages);
    if (newImages.length === 1) setPrimaryImage(compressed);
    // بعد التصوير ننتقل مباشرة للتحليل — بدون شاشة فلتر
    setShowCamera(false);
    startAnalysis(newImages);
  };

  const handleVideoCapture = (thumb: string) => {
    setShowVideo(false);
    setPrimaryImage(thumb);
    setCapturedImages([thumb]);
    startAnalysis([thumb]);
  };

  const startAnalysis = async (images: string[]) => {
    // التحقق من الرصيد قبل التحليل
    if (requiresMousa && !canAfford("analyzePhoto")) {
      toast.error(`رصيدك غير كافٍ (${balance ?? 0} كريدت). تحليل الصورة يكلف 20 كريدت.`, {
        action: upgradeUrl ? { label: "شراء كريدت", onClick: () => window.open(upgradeUrl, "_blank") } : undefined,
      });
      return;
    }
    setStep("analyzing");
    const budget = BUDGET_MAP[budgetLevel];
    const customAmount = budgetAmount ? parseInt(budgetAmount.replace(/,/g, "")) : null;

    // ===== رفع الصور لـ /api/upload/image أولاً إذا كانت data URLs =====
    // هذا يحل مشكلة SyntaxError: Bad control character in JSON
    let resolvedImages = images;
    try {
      resolvedImages = await Promise.all(
        images.map(async (img) => {
          if (!img.startsWith("data:")) return img; // URL عادي — لا حاجة للرفع
          // رفع data URL لـ /api/upload/image
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) return img;
          const mimeType = match[1];
          const base64 = match[2];
          // إرسال data URL كـ JSON لـ /api/upload/image
          const res = await fetch("/api/upload/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: img, mimeType }),
            credentials: "include",
          });
          if (!res.ok) return img; // fallback: إرسال data URL
          const data = await res.json() as { url?: string };
          return data.url || img;
        })
      );
    } catch {
      // fallback: استخدام الصور الأصلية
      resolvedImages = images;
    }

    // تتبع S3 URL للصورة الأصلية
    try {
      const img = resolvedImages[0];
      if (img && !img.startsWith("data:")) {
        setPrimaryImageS3Url(img);
      } else {
        setPrimaryImageS3Url(null);
      }
    } catch {
      setPrimaryImageS3Url(null);
    }

    // بناء بيانات المرجع إذا كان مفعّلاً
    const referenceData = (useReference && refAnalysisResult) ? {
      referenceId: refAnalysisResult.id,
      styleLabel: refAnalysisResult.styleLabel,
      styleKey: refAnalysisResult.styleKey,
      description: refAnalysisResult.description,
      colorMood: refAnalysisResult.colorMood,
      palette: refAnalysisResult.palette,
      materials: refAnalysisResult.materials,
      highlights: refAnalysisResult.highlights,
      imageUrl: refAnalysisResult.imageUrl,
    } : undefined;
    // أبعاد الغرفة إذا أدخلها المستخدم
    const roomDimensions = (roomLength && roomWidth)
      ? {
          length: parseFloat(roomLength),
          width: parseFloat(roomWidth),
          height: roomHeight ? parseFloat(roomHeight) : undefined,
        }
      : undefined;
    analyzeAndGenerateMutation.mutate({
      imageUrl: resolvedImages[0],
      imageUrls: resolvedImages.length > 1 ? resolvedImages : undefined,
      captureMode: "single",
      count: ideasCount,
      budgetMin: customAmount ? Math.round(customAmount * 0.7) : budget.min,
      budgetMax: customAmount ? Math.round(customAmount * 1.3) : budget.max,
      referenceData,
      preferredStyle: preferredStyle || undefined,
      preferredColors: preferredColors.length > 0 ? preferredColors : undefined,
      roomDimensions,
      lockStructuralElements: {
        enabled: !allowPlatformFreedom,
        lockDoors: !allowPlatformFreedom,
        lockWindows: !allowPlatformFreedom,
        lockOpenings: !allowPlatformFreedom,
        lockColumns: !allowPlatformFreedom,
        lockSteps: !allowPlatformFreedom,   // الدرجات وفروق المستويات
        lockCeiling: !allowPlatformFreedom, // نوع السقف (مستوٍ يبقى مستوياً)
        allowPlatformFreedom,
      },
    });
  };

  // معالجة صورة المرجع (base64 → S3 → تحليل)
  const uploadImageMutation = trpc.upload.image.useMutation();

  const handleRefImageReady = async (dataUrl: string) => {
    setShowRefCamera(false);
    // رفع الصورة إلى S3 عبر trpc.upload.image
    try {
      const base64 = dataUrl.split(",")[1];
      const mimeType = dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
      console.log("[handleRefImageReady] Uploading image, base64 length:", base64?.length, "mimeType:", mimeType);
      const result = await uploadImageMutation.mutateAsync({ base64, mimeType });
      console.log("[handleRefImageReady] Upload success, url:", result.url);
      setRefImageUrl(result.url);
      setRefImageKey(result.key);
      analyzeRefMutation.mutate({ imageUrl: result.url, imageKey: result.key });
    } catch (uploadErr) {
      console.error("[handleRefImageReady] Upload failed:", uploadErr);
      // إظهار رسالة خطأ واضحة بدلاً من إرسال data URL للـ LLM
      toast.error("تعذّر رفع الصورة. تأكد من اتصالك بالإنترنت وحاول مجدداً");
    }
  };

  const handleRefFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      const compressed = await compressImage(raw, 1280, 0.85);
      await handleRefImageReady(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleRefUrlSubmit = () => {
    if (!refUrlInput.trim()) return;
    setRefImageUrl(refUrlInput.trim());
    analyzeRefMutation.mutate({ imageUrl: refUrlInput.trim() });
    setShowRefUrlInput(false);
  };

  const handleGenerateImage = useCallback((ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || !primaryImage) return;
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, isGeneratingImage: true } : i));

    // استخدام imagePrompt المخصص من التحليل المعماري
    // وتمرير العناصر البنيوية للحفاظ عليها
    const keepElements = spaceAnalysis?.structuralElements
      ?.filter(e => e.keepInDesign)
      .map(e => ({ element: e.element, position: e.position })) || [];

    (generateVizMutation.mutate as (input: Parameters<typeof generateVizMutation.mutate>[0] & { ideaId: string }) => void)({
      imageUrl: primaryImage,
      designStyle: idea.style,
      palette: idea.palette,
      materials: idea.materials.join(", "),
      imagePrompt: idea.imagePrompt || undefined,
      structuralElements: keepElements.length > 0 ? keepElements : undefined,
      ideaId,
    });
  }, [ideas, primaryImage, spaceAnalysis]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      const dataUrl = await compressImage(raw, 1280, 0.85);
      setPrimaryImage(dataUrl);
      setCapturedImages([dataUrl]);
      setSelectedMode("single");
      // عرض شاشة الفلتر أولاً قبل التحليل
      setStep("filter");
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStep("select");
    setSelectedMode(null);
    setCapturedImages([]);
    setPrimaryImage(null);
    setPrimaryImageS3Url(null);
    setIdeas([]);
    setSpaceAnalysis(null);
    setStructuralSuggestions([]);
    setFavorites(new Set());
  };

  const budget = BUDGET_MAP[budgetLevel];

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Camera overlays */}
      {showCamera && selectedMode && (
        <LiveCamera
          mode="single"
          capturedCount={capturedImages.length}
          targetCount={targetCount}
          onCapture={handleCapture}
          onClose={() => { setShowCamera(false); setStep("select"); setCapturedImages([]); }}
        />
      )}
      {showVideo && (
        <VideoRecorder
          onCapture={handleVideoCapture}
          onClose={() => { setShowVideo(false); setStep("select"); }}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/90 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-40">
        <button onClick={() => step === "select" ? navigate("/") : reset()}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronRight className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-[#5C3D11]">
            {step === "select" ? t("smart.title") :
             step === "capture" ? t("smart.upload") :
             step === "filter" ? t("smart.styleType") :
             step === "analyzing" ? t("smart.analyzing") : t("smart.results")}
          </p>
          {step === "results" && (
            <p className="text-xs text-[#8B6914]/70">{ideas.length} أفكار • {budget.label} • اضغط لتوليد الصور</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CreditBadge className="hidden sm:flex" />
          {step === "results" && (
            <>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border-2 transition-all ${showFilters ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
                <Palette className="w-4 h-4" />
              </button>
              <button onClick={reset} className="p-2 rounded-xl border-2 border-[#e8d9c0] text-[#5C3D11]">
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 pb-24">

        {/* ===== STEP 1: Select Mode ===== */}
        {step === "select" && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-[#5C3D11]">{t("smart.title")}</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">{t("smart.subtitle")}</p>
            </div>

            {/* زر التصوير الوحيد */}
            <button
              onClick={handleStartCapture}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-[#C9A84C] bg-gradient-to-br from-amber-50 to-white active:scale-95 transition-all shadow-sm"
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#C9A84C22", color: "#C9A84C" }}>
                <Camera className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="font-black text-[#5C3D11] text-lg">{t("home.hero.cta")}</p>
                <p className="text-xs text-[#8B6914]/60 mt-1">غرفة • واجهة مبنى • حديقة • مسبح</p>
              </div>
            </button>

            {/* Or upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e8d9c0]" />
              <span className="text-xs text-[#8B6914]/60">أو</span>
              <div className="flex-1 h-px bg-[#e8d9c0]" />
            </div>

            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#C9A84C]/40 bg-[#C9A84C]/5 text-[#8B6914] font-bold text-sm active:scale-95 transition-transform">
              <ImageIcon className="w-5 h-5" />
              {t("smart.upload")}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

            {/* Architectural integrity note */}
            <div className="bg-[#C9A84C]/10 rounded-2xl p-3 border border-[#C9A84C]/20">
              <p className="text-xs text-[#8B6914] leading-relaxed">
                🏗️ <strong>م. سارة</strong> تحلل أي فضاء: غرفة، واجهة مبنى، حديقة، مسبح — وتولد تصاميم مخصصة لكل نوع
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP 1.5: Filter Screen ===== */}
        {step === "filter" && (
          <div className="flex-1 flex flex-col gap-5">
            {/* معاينة الصورة */}
            {primaryImage && (
              <div className="relative rounded-2xl overflow-hidden h-40">
                <img src={primaryImage} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 right-3">
                  <span className="text-white text-xs font-bold">جاهزة للتحليل ✨</span>
                </div>
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-black text-[#5C3D11]">{t("smart.title")}</h2>
              <p className="text-xs text-[#8B6914]/70 mt-1">حدد تفضيلاتك قبل التحليل</p>
            </div>

            {/* الميزانية */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <p className="text-sm font-bold text-[#5C3D11] mb-3">💰 الميزانية</p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {(Object.entries(BUDGET_MAP) as [typeof budgetLevel, typeof BUDGET_MAP[typeof budgetLevel]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setBudgetLevel(key)}
                    className={`py-2.5 rounded-xl text-[10px] font-bold transition-all border-2 ${
                      budgetLevel === key
                        ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]"
                        : "border-[#e8d9c0] text-[#5C3D11]"
                    }`}>
                    <div>{val.label}</div>
                    <div className="text-[8px] opacity-60 mt-0.5">{val.range}</div>
                  </button>
                ))}
              </div>
              {/* حقل المبلغ المحدد */}
              <div className="mt-3">
                <p className="text-xs text-[#8B6914] mb-1.5">أو حدّد مبلغاً تقريبياً (درهم)</p>
                <div className="relative">
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="مثال: 35000"
                    className="w-full border-2 border-[#e8d9c0] rounded-xl px-3 py-2.5 text-sm text-right text-[#5C3D11] placeholder:text-[#8B6914]/40 focus:border-[#C9A84C] focus:outline-none"
                  />
                  {budgetAmount && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8B6914]/60">AED</span>
                  )}
                </div>
              </div>
            </div>

            {/* م. سارة لها صلاحية كاملة على جميع عناصر الفضاء */}

            {/* عدد الأفكار */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#5C3D11]">✨ عدد الأفكار</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIdeasCount((c) => Math.max(2, c - 1))}
                    className="w-8 h-8 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Minus className="w-3.5 h-3.5 text-[#8B6914]" />
                  </button>
                  <span className="text-lg font-black text-[#5C3D11] w-6 text-center">{ideasCount}</span>
                  <button onClick={() => setIdeasCount((c) => Math.min(6, c + 1))}
                    className="w-8 h-8 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                  </button>
                </div>
              </div>
            </div>

            {/* قسم النمط المفضّل — دائماً مرئي */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
              <div className="px-4 py-3.5 flex items-center gap-2 border-b border-[#e8d9c0]/50">
                <Palette className="w-4 h-4 text-[#C9A84C]" />
                <div className="text-right flex-1">
                  <p className="text-sm font-bold text-[#5C3D11]">🎨 النمط المفضّل</p>
                  <p className="text-[10px] text-[#8B6914]/60">اختر الطابع الذي تريده — م. سارة ستلتزم به في كل الأفكار</p>
                </div>
                {preferredStyle && (
                  <button onClick={() => setPreferredStyle(null)}
                    className="text-[10px] text-[#C9A84C] border border-[#C9A84C] rounded-full px-2 py-0.5">
                    إلغاء
                  </button>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "modern", label: "عصري", icon: "🏙️", colors: ["#E0E0E0","#212121","#2196F3"] },
                    { key: "gulf", label: "خليجي", icon: "🌙", colors: ["#F5F0E8","#C9A84C","#5C3D11"] },
                    { key: "classical", label: "كلاسيكي", icon: "🏛️", colors: ["#FFF8F0","#8B6914","#4A2C0A"] },
                    { key: "minimal", label: "مينيمال", icon: "⬜", colors: ["#FAFAFA","#9E9E9E","#212121"] },
                    { key: "industrial", label: "صناعي", icon: "🔩", colors: ["#455A64","#78909C","#B0BEC5"] },
                    { key: "bohemian", label: "بوهيمي", icon: "🌿", colors: ["#8D6E63","#A5D6A7","#FFB74D"] },
                    { key: "scandinavian", label: "سكاندنافي", icon: "❄️", colors: ["#ECEFF1","#90A4AE","#546E7A"] },
                    { key: "luxury", label: "فاخر", icon: "✨", colors: ["#1A1A1A","#C9A84C","#F5F0E8"] },
                    { key: "moroccan", label: "مغربي", icon: "🕌", colors: ["#E65100","#1565C0","#F9A825"] },
                    { key: "mediterranean", label: "متوسطي", icon: "🌊", colors: ["#1565C0","#F5F5DC","#FF8F00"] },
                    { key: "arabic_facade", label: "واجهة عربية", icon: "🏛️", colors: ["#F5F0E8","#8B6914","#C9A84C"] },
                    { key: "modern_facade", label: "واجهة عصرية", icon: "🏗️", colors: ["#263238","#546E7A","#B0BEC5"] },
                  ].map(({ key, label, icon, colors }) => (
                    <button key={key} onClick={() => setPreferredStyle(preferredStyle === key ? null : key)}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                        preferredStyle === key
                          ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914] shadow-sm"
                          : "border-[#e8d9c0] text-[#5C3D11] hover:border-[#C9A84C]/50"
                      }`}>
                      <span className="text-lg">{icon}</span>
                      <div className="flex gap-0.5">
                        {colors.map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c}} />)}
                      </div>
                      <span className="text-[10px] leading-tight text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* قسم الألوان المفضّلة — دائماً مرئي */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
              <div className="px-4 py-3.5 flex items-center gap-2 border-b border-[#e8d9c0]/50">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-rose-400" />
                <div className="text-right flex-1">
                  <p className="text-sm font-bold text-[#5C3D11]">🎨 الألوان المفضّلة</p>
                  <p className="text-[10px] text-[#8B6914]/60">اختر ألواناً محددة — م. سارة ستبني عليها (متعدد الاختيار)</p>
                </div>
                {preferredColors.length > 0 && (
                  <button onClick={() => setPreferredColors([])}
                    className="text-[10px] text-[#C9A84C] border border-[#C9A84C] rounded-full px-2 py-0.5">
                    مسح ({preferredColors.length})
                  </button>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "أبيض", hex: "#F5F5F5" },
                    { name: "بيج", hex: "#F5F0E8" },
                    { name: "رمادي فاتح", hex: "#E0E0E0" },
                    { name: "رمادي", hex: "#9E9E9E" },
                    { name: "أسود", hex: "#212121" },
                    { name: "ذهبي", hex: "#C9A84C" },
                    { name: "بني فاتح", hex: "#D7B899" },
                    { name: "بني", hex: "#8B4513" },
                    { name: "خشبي", hex: "#795548" },
                    { name: "أخضر زيتي", hex: "#558B2F" },
                    { name: "أخضر", hex: "#4CAF50" },
                    { name: "أزرق فاتح", hex: "#90CAF9" },
                    { name: "أزرق", hex: "#1565C0" },
                    { name: "أزرق بترولي", hex: "#00838F" },
                    { name: "وردي", hex: "#F48FB1" },
                    { name: "برتقالي", hex: "#FF9800" },
                    { name: "أحمر خمري", hex: "#880E4F" },
                    { name: "بنفسجي", hex: "#7B1FA2" },
                  ].map(({ name, hex }) => {
                    const isSelected = preferredColors.includes(name);
                    return (
                      <button key={name}
                        onClick={() => setPreferredColors(prev =>
                          isSelected ? prev.filter(c => c !== name) : [...prev, name]
                        )}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-sm"
                            : "border-[#e8d9c0] hover:border-[#C9A84C]/50"
                        }`}>
                        <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hex }} />
                        <span className="text-[11px] text-[#5C3D11] font-medium whitespace-nowrap">{name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* قسم تقليد نمط معين (اختياري) */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
              {/* رأس القسم */}
              <button
                onClick={() => {
                  setUseReference(!useReference);
                }}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#C9A84C]" />
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#5C3D11]">تقليد نمط معين</p>
                    <p className="text-[10px] text-[#8B6914]/60">اختياري — صوّر فضاءً أعجبك وستقلده م. سارة في غرفتك</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  useReference ? "bg-[#C9A84C]" : "bg-gray-200"
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                    useReference ? "left-6" : "left-0.5"
                  }`} />
                </div>
              </button>

              {/* محتوى القسم عند التفعيل */}
              {useReference && (
                <div className="px-4 pb-4 border-t border-[#f0e8d8] pt-3 space-y-3">

                  {/* إذا تم تحليل مرجع بالفعل */}
                  {refAnalysisResult && (
                    <div className="bg-[#f0e8d8] rounded-xl p-3 border border-[#C9A84C]/30">
                      <div className="flex items-start gap-2">
                        {refImageUrl && (
                          <img src={refImageUrl} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" alt="ref" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Check className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0" />
                            <p className="text-xs font-bold text-[#5C3D11] truncate">{refAnalysisResult.title}</p>
                          </div>
                          <p className="text-[10px] text-[#8B6914]">{refAnalysisResult.styleLabel} • {refAnalysisResult.colorMood}</p>
                          <div className="flex gap-1 mt-1.5">
                            {(refAnalysisResult.palette || []).slice(0, 4).map((c, i) => (
                              <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => { setRefAnalysisResult(null); setRefImageUrl(null); setSelectedRefId(null); }}
                          className="p-1 text-[#8B6914]/60 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* تحليل جاري */}
                  {analyzeRefMutation.isPending && (
                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3">
                      <div className="w-4 h-4 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                      <p className="text-xs text-[#8B6914]">م. سارة تحلّل المرجع...</p>
                    </div>
                  )}

                  {/* طرق إضافة مرجع */}
                  {!refAnalysisResult && !analyzeRefMutation.isPending && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#8B6914] font-medium">أضف مرجع تصميم:</p>

                      {/* صوّر مرجع */}
                      <button
                        onClick={() => setShowRefCamera(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#5C3D11] text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Camera className="w-4 h-4 text-[#C9A84C]" />
                        صوّر فضاءً أعجبك
                      </button>

                      {/* رفع من المعرض */}
                      <button
                        onClick={() => { const el = document.getElementById("ref-file-input") as HTMLInputElement; el?.click(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#C9A84C]/30 bg-transparent text-[#5C3D11] text-sm font-medium active:scale-95 transition-transform"
                      >
                        <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
                        رفع صورة من المعرض
                      </button>
                      <input id="ref-file-input" type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleRefFileUpload(e.target.files[0])} />

                      {/* رابط URL */}
                      <button
                        onClick={() => setShowRefUrlInput(!showRefUrlInput)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#C9A84C]/30 bg-transparent text-[#5C3D11] text-sm font-medium active:scale-95 transition-transform"
                      >
                        <Layers className="w-4 h-4 text-[#C9A84C]" />
                        لصق رابط صورة من الإنترنت
                      </button>
                      {showRefUrlInput && (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={refUrlInput}
                            onChange={(e) => setRefUrlInput(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 border-2 border-[#e8d9c0] rounded-xl px-3 py-2 text-sm text-right text-[#5C3D11] focus:border-[#C9A84C] focus:outline-none"
                          />
                          <button
                            onClick={handleRefUrlSubmit}
                            className="px-3 py-2 bg-[#C9A84C] text-white rounded-xl text-sm font-bold"
                          >
                            تحليل
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* المراجع المحفوظة مسبقاً */}
                  {refListQuery.data && refListQuery.data.length > 0 && !refAnalysisResult && !analyzeRefMutation.isPending && (
                    <div className="mt-2">
                      <p className="text-[10px] text-[#8B6914]/60 mb-2">أو اختر من مراجعك المحفوظة:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {refListQuery.data.slice(0, 5).map((ref: (typeof refListQuery.data)[number]) => (
                          <button
                            key={ref.id}
                            onClick={() => {
                              setSelectedRefId(ref.id);
                              setRefImageUrl(ref.imageUrl);
                              setRefAnalysisResult({
                                id: ref.id,
                                title: ref.title,
                                spaceType: ref.spaceType ?? undefined,
                                styleLabel: ref.styleLabel ?? undefined,
                                styleKey: ref.styleKey ?? undefined,
                                description: ref.description ?? undefined,
                                colorMood: ref.colorMood ?? undefined,
                                palette: (ref.palette as Array<{ name: string; hex: string }>) || [],
                                materials: (ref.materials as string[]) || [],
                                highlights: (ref.highlights as string[]) || [],
                                imageUrl: ref.imageUrl,
                              });
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                              selectedRefId === ref.id ? "border-[#C9A84C] scale-105" : "border-[#e8d9c0]"
                            }`}
                          >
                            <img src={ref.imageUrl} className="w-full h-full object-cover" alt={ref.title} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* أبعاد الغرفة — اختياري لدقة جدول الكميات */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
              <button
                onClick={() => setShowRoomDims(!showRoomDims)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📏</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#5C3D11]">أبعاد الغرفة</p>
                    <p className="text-[10px] text-[#8B6914]/60">
                      {(roomLength && roomWidth)
                        ? `✅ ${roomLength}م × ${roomWidth}م${roomHeight ? ` × ${roomHeight}م` : ''} = ${(parseFloat(roomLength || '0') * parseFloat(roomWidth || '0')).toFixed(1)}م²`
                        : 'اختياري — لحساب جدول الكميات بدقة عالية'}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  showRoomDims ? "bg-[#C9A84C]" : "bg-gray-200"
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                    showRoomDims ? "left-6" : "left-0.5"
                  }`} />
                </div>
              </button>

              {showRoomDims && (
                <div className="px-4 pb-4 border-t border-[#f0e8d8] pt-3">
                  <p className="text-[10px] text-[#8B6914]/70 mb-3 leading-relaxed">
                    أدخل أبعاد الغرفة لتحسب كميات الأرضيات والأصباغ والستائر بدقة هندسية عالية
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8B6914] font-bold block mb-1">📏 الطول (م)</label>
                      <input
                        type="number"
                        value={roomLength}
                        onChange={(e) => setRoomLength(e.target.value)}
                        placeholder="5.5"
                        step="0.1"
                        min="1"
                        max="50"
                        className="w-full border-2 border-[#e8d9c0] rounded-xl px-2 py-2 text-sm text-center text-[#5C3D11] placeholder:text-[#8B6914]/30 focus:border-[#C9A84C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8B6914] font-bold block mb-1">📏 العرض (م)</label>
                      <input
                        type="number"
                        value={roomWidth}
                        onChange={(e) => setRoomWidth(e.target.value)}
                        placeholder="4.0"
                        step="0.1"
                        min="1"
                        max="50"
                        className="w-full border-2 border-[#e8d9c0] rounded-xl px-2 py-2 text-sm text-center text-[#5C3D11] placeholder:text-[#8B6914]/30 focus:border-[#C9A84C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8B6914] font-bold block mb-1">⬆️ الارتفاع (م)</label>
                      <input
                        type="number"
                        value={roomHeight}
                        onChange={(e) => setRoomHeight(e.target.value)}
                        placeholder="2.8"
                        step="0.1"
                        min="2"
                        max="10"
                        className="w-full border-2 border-[#e8d9c0] rounded-xl px-2 py-2 text-sm text-center text-[#5C3D11] placeholder:text-[#8B6914]/30 focus:border-[#C9A84C] focus:outline-none"
                      />
                    </div>
                  </div>
                  {roomLength && roomWidth && (
                    <div className="mt-3 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
                      <p className="text-[10px] text-emerald-700 font-bold text-center">
                        ✅ مساحة الأرضية: {(parseFloat(roomLength) * parseFloat(roomWidth)).toFixed(1)}م²
                        {roomHeight && ` • مساحة الجدران: ${(2 * (parseFloat(roomLength) + parseFloat(roomWidth)) * parseFloat(roomHeight)).toFixed(1)}م²`}
                      </p>
                      <p className="text-[9px] text-emerald-600 text-center mt-0.5">سيتم حساب جدول الكميات بناءً على هذه الأبعاد</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* خيار السماح بتغيير الفتحات والبنية */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] overflow-hidden">
              <button
                onClick={() => setAllowPlatformFreedom(!allowPlatformFreedom)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{allowPlatformFreedom ? '🔓' : '🔒'}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#5C3D11]">
                      {allowPlatformFreedom ? 'حرية معمارية كاملة' : 'حفاظ على البنية الإنشائية ✔️'}
                    </p>
                    <p className="text-[10px] text-[#8B6914]/60">
                      {allowPlatformFreedom
                        ? 'م. سارة تغيّر كل شيء بما فيها الأبواب والنوافذ والدرجات'
                        : 'الأبواب والنوافذ والدرجات والسقف ثابتة — الإبداع في التصميم فقط'}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  allowPlatformFreedom ? 'bg-[#C9A84C]' : 'bg-[#5C3D11]'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                    allowPlatformFreedom ? 'left-6' : 'left-0.5'
                  }`} />
                </div>
              </button>

              {!allowPlatformFreedom && (
                <div className="px-4 pb-3 border-t border-[#f0e8d8] pt-3">
                  <div className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
                    <p className="text-[10px] text-amber-800 text-right leading-relaxed font-semibold mb-1">
                      🔒 العناصر الثابتة المحفوظة تلقائياً:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['الأبواب', 'النوافذ', 'الفتحات', 'الأعمدة', 'الدرجات', 'نوع السقف'].map(el => (
                        <span key={el} className="text-[10px] bg-amber-100 border border-amber-300 text-amber-800 rounded-lg px-2 py-1">
                          ✔ {el}
                        </span>
                      ))}
                    </div>
                    <p className="text-[9px] text-amber-600/70 text-center mt-2">م. سارة تبدع بحرية كاملة في: الألوان • المواد • الأثاث • الإضاءة • التشطيبات</p>
                  </div>
                </div>
              )}
              {allowPlatformFreedom && (
                <div className="px-4 pb-3 border-t border-[#f0e8d8] pt-3">
                  <div className="bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-200">
                    <p className="text-[10px] text-orange-700 text-center leading-relaxed">
                      ⚠️ حرية كاملة — م. سارة قد تغيّر مواضع الأبواب والنوافذ والدرجات وفق تقديرها المعماري
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* كاميرا المرجع */}
            {showRefCamera && (
              <div className="fixed inset-0 z-50">
                <LiveCamera
                  mode="single"
                  capturedCount={0}
                  targetCount={1}
                  onCapture={async (dataUrl) => { await handleRefImageReady(dataUrl); }}
                  onClose={() => setShowRefCamera(false)}
                />
              </div>
            )}

            {/* زر التحليل */}
            <button
              onClick={() => startAnalysis(capturedImages)}
              className="w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-base rounded-2xl active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {useReference && refAnalysisResult ? "ابدأ التحليل والتقليد" : "ابدأ التحليل"}
            </button>

            {/* زر الرجوع */}
            <button
              onClick={() => { setStep("select"); setCapturedImages([]); setPrimaryImage(null); }}
              className="w-full py-3 border-2 border-[#e8d9c0] text-[#8B6914] font-bold text-sm rounded-2xl active:scale-95 transition-transform"
            >
              ← إعادة التصوير
            </button>
          </div>
        )}

        {/* ===== STEP 2: Analyzing ===== */}
        {step === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {primaryImage && (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden">
                <img src={primaryImage} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-[#5C3D11]/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-white font-black text-lg">م. سارة تحلل الفضاء</p>
                  <p className="text-white/70 text-sm">تولّد {ideasCount} أفكار تصميمية...</p>
                </div>
              </div>
            )}
            {/* شريط التقدم الزمني الكلي */}
            <div className="w-full bg-[#e8d9c0] rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-[#8B6914] text-center">المدة الإجمالية المتوقعة: 30 – 60 ثانية</p>
            <div className="w-full space-y-2.5">
              {[
                { label: "تحليل البنية المعمارية (أبواب، سلالم، أبعاد)", duration: "~10 ث" },
                { label: `توليد ${ideasCount} أفكار تصميمية متنوعة`, duration: "~20 ث" },
                { label: "حساب تكاليف الاستبدال التفصيلية", duration: "~15 ث" },
                { label: "اقتراح تحسينات بنيوية اختيارية", duration: "~10 ث" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11] flex-1">{s.label}</span>
                  <span className="text-[10px] text-[#C9A84C] font-bold bg-[#C9A84C]/10 px-2 py-0.5 rounded-full flex-shrink-0">{s.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 3: Results ===== */}
        {step === "results" && (
          <div className="flex-1 flex flex-col gap-4">

            {/* Original image */}
            {primaryImage && (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={primaryImage} className="w-full h-36 object-cover" alt="original" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-white/70">الصورة الأصلية</span>
                    <p className="text-white font-bold text-sm">صورة الفضاء</p>
                  </div>
                  <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 backdrop-blur rounded-xl text-white text-[10px] font-bold">
                    <RotateCcw className="w-3 h-3" /> تصوير جديد
                  </button>
                </div>
              </div>
            )}

            {/* Scenario legend */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(SCENARIO_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold"
                  style={{ backgroundColor: val.bg, color: val.text, borderColor: val.border }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.text }} />
                  {val.label}
                </div>
              ))}
            </div>

            {/* Space Analysis */}
            {spaceAnalysis && <SpaceAnalysisCard analysis={spaceAnalysis} />}

            {/* Structural Suggestions */}
            {structuralSuggestions.length > 0 && (
              <StructuralSuggestionsCard suggestions={structuralSuggestions} />
            )}

            {/* Filters panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="text-sm font-bold text-[#5C3D11] mb-3">تعديل الفلاتر</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {(Object.entries(BUDGET_MAP) as [typeof budgetLevel, typeof BUDGET_MAP[typeof budgetLevel]][]).map(([key, val]) => (
                    <button key={key} onClick={() => setBudgetLevel(key)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${budgetLevel === key ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5C3D11]">عدد الأفكار</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIdeasCount((c) => Math.max(2, c - 1))}
                      className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center"><Minus className="w-3 h-3 text-[#8B6914]" /></button>
                    <span className="font-black text-[#5C3D11]">{ideasCount}</span>
                    <button onClick={() => setIdeasCount((c) => Math.min(6, c + 1))}
                      className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center"><Plus className="w-3 h-3 text-[#8B6914]" /></button>
                  </div>
                </div>
                <button onClick={() => { setShowFilters(false); startAnalysis(capturedImages); }}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform">
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> تحديث الأفكار
                  </span>
                </button>
              </div>
            )}

            {/* Ideas header */}
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#5C3D11]">{ideas.length} أفكار تصميمية</p>
              <button onClick={() => startAnalysis(capturedImages)}
                className="flex items-center gap-1.5 text-xs text-[#8B6914] font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> تجديد
              </button>
            </div>

            {/* Idea cards */}
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onGenerateImage={handleGenerateImage}
                onFavorite={toggleFavorite}
                isFavorited={favorites.has(idea.id)}
                spaceType={spaceAnalysis?.spaceType}
                originalImageUrl={primaryImageS3Url || primaryImage || undefined}
                onUpdateIdea={(id, updates) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))}
              />
            ))}

            {/* زر متجر الأثاث المحلي من بنيان */}
            <button
              onClick={() => navigate("/furniture")}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg active:scale-95 transition-transform mt-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">اشتري الأثاث من متاجر محلية</p>
                  <p className="text-[11px] text-amber-200">منتجات حقيقية من الإمارات — بنيان</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </button>

            {/* Share / Save */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => toast.success("تم الحفظ في مشاريعك")}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white text-[#5C3D11] text-sm font-bold active:scale-95 transition-transform">
                <Home className="w-4 h-4" /> حفظ في المشاريع
              </button>
              <button onClick={() => {
                if (navigator.share) navigator.share({ title: "أفكار م. سارة", text: `${ideas.length} أفكار تصميمية` });
                else toast.success("تم النسخ");
              }} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold active:scale-95 transition-transform">
                <Share2 className="w-4 h-4" /> مشاركة
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
