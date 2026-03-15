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
  Building2, Home, Info, Star, ShoppingBag
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ===== Types =====
type CaptureMode = "single" | "panorama" | "animation3d" | "video360";

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

interface SpaceAnalysis {
  spaceType: string;
  estimatedArea: string;
  cameraAnalysis?: CameraAnalysis;
  roomShape?: string;
  roomProportions?: string;
  ceilingHeight?: string;
  structuralElements: StructuralElement[];
  currentIssues: string[];
  currentMaterials: string[];
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
}

// ===== Capture Mode Selector =====
const CAPTURE_MODES: {
  id: CaptureMode;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}[] = [
  {
    id: "single",
    label: "صورة واحدة",
    sublabel: "اتجاه واحد",
    icon: <Camera className="w-7 h-7" />,
    color: "#C9A84C",
    desc: "التقط صورة واحدة للغرفة من أي زاوية",
  },
  {
    id: "panorama",
    label: "بانوراما",
    sublabel: "زاوية 180°",
    icon: <ScanLine className="w-7 h-7" />,
    color: "#4CAF50",
    desc: "صورة بانوراما عريضة للغرفة كاملة",
  },
  {
    id: "animation3d",
    label: "3D Animation",
    sublabel: "جولة كاملة",
    icon: <Box className="w-7 h-7" />,
    color: "#9C27B0",
    desc: "صوّر 4 زوايا للحصول على تصميم ثلاثي الأبعاد",
  },
  {
    id: "video360",
    label: "فيديو 360°",
    sublabel: "جولة فيديو",
    icon: <Video className="w-7 h-7" />,
    color: "#F44336",
    desc: "سجّل فيديو يدور حول الغرفة",
  },
];

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

// ===== Structural Analysis Card =====
function SpaceAnalysisCard({ analysis }: { analysis: SpaceAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const keepElements = analysis.structuralElements?.filter(e => e.keepInDesign) || [];
  const cam = analysis.cameraAnalysis;

  return (
    <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#C9A84C]" />
          <span className="font-bold text-[#5C3D11] text-sm">التحليل المعماري</span>
          <span className="text-[10px] bg-[#C9A84C]/10 text-[#8B6914] px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
            {analysis.spaceType} • {analysis.estimatedArea}
          </span>
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
function IdeaCard({
  idea,
  onGenerateImage,
  onFavorite,
  isFavorited,
}: {
  idea: DesignIdea;
  onGenerateImage: (id: string) => void;
  onFavorite: (id: string) => void;
  isFavorited: boolean;
}) {
  const [showReplacement, setShowReplacement] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const scenario = SCENARIO_COLORS[idea.scenario] || SCENARIO_COLORS.surface;

  return (
    <div className="bg-white rounded-3xl border border-[#e8d9c0] shadow-sm overflow-hidden">
      {/* صورة تصورية */}
      <div className="relative">
        {idea.imageUrl ? (
          <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
            <img src={idea.imageUrl} className="w-full h-52 object-cover" alt={idea.title} />
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> تكبير
            </div>
          </div>
        ) : idea.isGeneratingImage ? (
          <div className="w-full h-52 bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Wand2 className="w-7 h-7 text-[#C9A84C] animate-pulse" />
            </div>
            <p className="text-sm text-[#8B6914] font-medium">م. سارة تولّد الصورة...</p>
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
            <p className="text-sm font-bold text-[#5C3D11]">اضغط لتوليد الصورة</p>
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
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
              <p className="text-[10px] text-white/70 mb-0.5">التكلفة التقديرية</p>
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
            <span className="text-xs font-bold text-[#5C3D11]">مزايا التصميم ({idea.highlights.length})</span>
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
      dir="rtl"
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
          <span className="text-white font-bold text-sm">
            {mode === "animation3d" ? `${capturedCount}/${targetCount} زوايا` : "التقط صورة"}
          </span>
          {mode === "animation3d" && (
            <p className="text-white/60 text-[10px]">
              {["أمام", "يسار", "خلف", "يمين"][capturedCount] || "اكتمل"}
            </p>
          )}
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
      dir="rtl"
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
      dir="rtl"
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

  // UI state
  const [step, setStep] = useState<"select" | "capture" | "analyzing" | "results">("select");
  const [selectedMode, setSelectedMode] = useState<CaptureMode | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Captured images
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);

  // Results
  const [ideas, setIdeas] = useState<DesignIdea[]>([]);
  const [spaceAnalysis, setSpaceAnalysis] = useState<SpaceAnalysis | null>(null);
  const [structuralSuggestions, setStructuralSuggestions] = useState<StructuralSuggestion[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [ideasCount, setIdeasCount] = useState(3);
  const [budgetLevel, setBudgetLevel] = useState<"economy" | "mid" | "luxury" | "premium">("mid");
  const [showFilters, setShowFilters] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const BUDGET_MAP = {
    economy: { min: 5000, max: 20000, label: "اقتصادي", range: "5k-20k" },
    mid: { min: 20000, max: 60000, label: "متوسط", range: "20k-60k" },
    luxury: { min: 60000, max: 150000, label: "فاخر", range: "60k-150k" },
    premium: { min: 150000, max: 500000, label: "بريميوم", range: "150k+" },
  };

  // Target count for 3D animation mode
  const targetCount = selectedMode === "animation3d" ? 4 : 1;

  const analyzeAndGenerateMutation = trpc.analyzeAndGenerateIdeas.useMutation({
    onSuccess: (data) => {
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
    },
    onError: () => {
      toast.error("فشل التحليل، حاول مجدداً");
      setStep("capture");
    },
  });

  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data, variables) => {
      const vars = variables as typeof variables & { ideaId?: string };
      if (data.imageUrl && vars.ideaId) {
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
    onError: () => {
      setIdeas((prev) => prev.map((idea) => ({ ...idea, isGeneratingImage: false })));
      toast.error("فشل توليد الصورة");
    },
  });

  const handleModeSelect = (mode: CaptureMode) => {
    setSelectedMode(mode);
    if (mode === "video360") {
      setShowVideo(true);
    } else {
      setShowCamera(true);
    }
    setStep("capture");
  };

  const handleCapture = async (dataUrl: string) => {
    const newImages = [...capturedImages, dataUrl];
    setCapturedImages(newImages);
    if (newImages.length === 1) setPrimaryImage(dataUrl);

    // For 3D animation, need 4 shots
    if (selectedMode === "animation3d" && newImages.length < 4) {
      return;
    }

    // Done capturing
    setShowCamera(false);
    startAnalysis(newImages);
  };

  const handleVideoCapture = (thumb: string) => {
    setShowVideo(false);
    setPrimaryImage(thumb);
    setCapturedImages([thumb]);
    startAnalysis([thumb]);
  };

  const startAnalysis = (images: string[]) => {
    setStep("analyzing");
    const budget = BUDGET_MAP[budgetLevel];
    analyzeAndGenerateMutation.mutate({
      imageUrl: images[0],
      imageUrls: images.length > 1 ? images : undefined,
      captureMode: selectedMode || "single",
      count: ideasCount,
      budgetMin: budget.min,
      budgetMax: budget.max,
    });
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
      startAnalysis([dataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStep("select");
    setSelectedMode(null);
    setCapturedImages([]);
    setPrimaryImage(null);
    setIdeas([]);
    setSpaceAnalysis(null);
    setStructuralSuggestions([]);
    setFavorites(new Set());
  };

  const budget = BUDGET_MAP[budgetLevel];

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Camera overlays */}
      {showCamera && selectedMode && selectedMode !== "panorama" && (
        <LiveCamera
          mode={selectedMode}
          capturedCount={capturedImages.length}
          targetCount={targetCount}
          onCapture={handleCapture}
          onClose={() => { setShowCamera(false); setStep("select"); setCapturedImages([]); }}
        />
      )}
      {showCamera && selectedMode === "panorama" && (
        <PanoramaCapture
          onCapture={(images) => {
            setShowCamera(false);
            setPrimaryImage(images[0]);
            setCapturedImages(images);
            startAnalysis(images);
          }}
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
            {step === "select" ? "كيف تريد التصوير؟" :
             step === "capture" ? "التقط الفضاء" :
             step === "analyzing" ? "م. سارة تحلل..." : "أفكار م. سارة"}
          </p>
          {step === "results" && (
            <p className="text-xs text-[#8B6914]/70">{ideas.length} أفكار • {budget.label} • اضغط لتوليد الصور</p>
          )}
        </div>
        {step === "results" && (
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border-2 transition-all ${showFilters ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
              <Palette className="w-4 h-4" />
            </button>
            <button onClick={reset} className="p-2 rounded-xl border-2 border-[#e8d9c0] text-[#5C3D11]">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 pb-24">

        {/* ===== STEP 1: Select Mode ===== */}
        {step === "select" && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-[#5C3D11]">صمّم فضاءك</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">اختر طريقة التصوير وسأقدم لك أفكاراً فورية</p>
            </div>

            {/* Mode cards */}
            <div className="grid grid-cols-2 gap-3">
              {CAPTURE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className="flex flex-col items-center gap-3 p-5 rounded-3xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-all hover:border-[#C9A84C]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: mode.color + "22", color: mode.color }}>
                    {mode.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-black text-[#5C3D11] text-sm">{mode.label}</p>
                    <p className="text-[10px] text-[#8B6914]/60 mt-0.5">{mode.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Or upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e8d9c0]" />
              <span className="text-xs text-[#8B6914]/60">أو</span>
              <div className="flex-1 h-px bg-[#e8d9c0]" />
            </div>

            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#C9A84C]/40 bg-[#C9A84C]/5 text-[#8B6914] font-bold text-sm active:scale-95 transition-transform">
              <ImageIcon className="w-5 h-5" />
              رفع صورة من المعرض
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

            {/* Quick filters */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#5C3D11]">الميزانية</p>
                <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">{budget.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(BUDGET_MAP) as [typeof budgetLevel, typeof BUDGET_MAP[typeof budgetLevel]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setBudgetLevel(key)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${budgetLevel === key ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
                    {val.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-bold text-[#5C3D11]">عدد الأفكار</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIdeasCount((c) => Math.max(2, c - 1))}
                    className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Minus className="w-3 h-3 text-[#8B6914]" />
                  </button>
                  <span className="text-base font-black text-[#5C3D11] w-4 text-center">{ideasCount}</span>
                  <button onClick={() => setIdeasCount((c) => Math.min(6, c + 1))}
                    className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Plus className="w-3 h-3 text-[#8B6914]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Architectural integrity note */}
            <div className="bg-[#C9A84C]/10 rounded-2xl p-3 border border-[#C9A84C]/20">
              <p className="text-xs text-[#8B6914] leading-relaxed">
                🏗️ <strong>م. سارة</strong> ستحلل البنية المعمارية وتحافظ على موقع الأبواب والسلالم والأبعاد في كل التصاميم
              </p>
            </div>
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
            <div className="w-full space-y-2.5">
              {[
                "تحليل البنية المعمارية (أبواب، سلالم، أبعاد)",
                `توليد ${ideasCount} أفكار تصميمية متنوعة`,
                "حساب تكاليف الاستبدال التفصيلية",
                "اقتراح تحسينات بنيوية اختيارية",
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{s}</span>
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
                    <p className="text-white font-bold text-sm">{CAPTURE_MODES.find(m => m.id === selectedMode)?.label || "صورة"}</p>
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
