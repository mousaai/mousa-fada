/**
 * DesignIdeas — أفكار تصميمية متعددة مع فلاتر فورية
 * يعرض 3+ أفكار تصميمية مع صور تصورية، أثاث، ألوان، وتكاليف
 * الفلاتر (نمط/ميزانية/ألوان) تغير التصاميم فوراً
 */
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronRight, Sparkles, RefreshCw, Wand2, DollarSign,
  ChevronDown, ChevronUp, Palette, Sofa, Layers, Star,
  Filter, Check, Eye, Heart, Share2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { handleMousaErrorStatic } from "@/hooks/useMousaError";
import { CreditBadge, useMousaCredit } from "@/components/CreditBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ===== Types =====
interface DesignIdea {
  id: string;
  title: string;
  description: string;
  style: string;
  palette: { name: string; hex: string }[];
  furniture: { name: string; description: string; priceRange: string }[];
  materials: string[];
  estimatedCost: string;
  costMin: number;
  costMax: number;
  highlights: string[];
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

type StyleId = "modern" | "gulf" | "classic" | "minimal" | "japanese" | "scandinavian" | "moroccan" | "luxury" | "mediterranean" | "industrial";

const STYLES: { id: StyleId; label: string; emoji: string }[] = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "gulf", label: "خليجي", emoji: "🕌" },
  { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
  { id: "minimal", label: "مينيمال", emoji: "⬜" },
  { id: "japanese", label: "ياباني", emoji: "⛩️" },
  { id: "scandinavian", label: "سكندنافي", emoji: "🌿" },
  { id: "moroccan", label: "مغربي", emoji: "🌙" },
  { id: "luxury", label: "فاخر", emoji: "💎" },
  { id: "mediterranean", label: "متوسطي", emoji: "🌊" },
  { id: "industrial", label: "صناعي", emoji: "⚙️" },
];

const BUDGET_OPTIONS = [
  { label: "اقتصادي", min: 5000, max: 20000, color: "#4CAF50" },
  { label: "متوسط", min: 20000, max: 60000, color: "#2196F3" },
  { label: "فاخر", min: 60000, max: 150000, color: "#9C27B0" },
  { label: "بريميوم", min: 150000, max: 500000, color: "#FF9800" },
];

const COLOR_THEMES = [
  { label: "دافئ ذهبي", colors: ["#C9A84C", "#F5F0E8", "#8B6914", "#D4B896"] },
  { label: "بارد محايد", colors: ["#607D8B", "#ECEFF1", "#37474F", "#B0BEC5"] },
  { label: "أخضر طبيعي", colors: ["#4CAF50", "#F1F8E9", "#2E7D32", "#A5D6A7"] },
  { label: "أزرق سماوي", colors: ["#1976D2", "#E3F2FD", "#0D47A1", "#90CAF9"] },
  { label: "بيج كلاسيكي", colors: ["#8D6E63", "#EFEBE9", "#4E342E", "#BCAAA4"] },
  { label: "رمادي عصري", colors: ["#616161", "#F5F5F5", "#212121", "#BDBDBD"] },
];

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
  const [expanded, setExpanded] = useState(false);
  const [showFurniture, setShowFurniture] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-[#e8d9c0] shadow-sm overflow-hidden">
      {/* صورة تصورية */}
      <div className="relative">
        {idea.imageUrl ? (
          <img
            src={idea.imageUrl}
            className="w-full h-52 object-cover"
            alt={idea.title}
          />
        ) : idea.isGeneratingImage ? (
          <div className="w-full h-52 bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Wand2 className="w-7 h-7 text-[#C9A84C] animate-pulse" />
            </div>
            <p className="text-sm text-[#8B6914] font-medium">جاري توليد الصورة...</p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
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
            <div className="flex gap-1.5">
              {idea.palette.slice(0, 4).map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Badge النمط */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#5C3D11] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {STYLES.find(s => s.id === idea.style)?.emoji} {idea.style === "modern" ? "عصري" :
            idea.style === "gulf" ? "خليجي" : idea.style === "classic" ? "كلاسيكي" :
            idea.style === "minimal" ? "مينيمال" : idea.style === "japanese" ? "ياباني" :
            idea.style === "scandinavian" ? "سكندنافي" : idea.style === "moroccan" ? "مغربي" :
            idea.style === "luxury" ? "فاخر" : idea.style === "mediterranean" ? "متوسطي" : "صناعي"}
        </div>

        {/* أزرار الإجراءات */}
        <div className="absolute top-3 left-3 flex gap-2">
          <button
            onClick={() => onFavorite(idea.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
              isFavorited ? "bg-red-500 text-white" : "bg-white/90 text-[#8B6914]"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-white" : ""}`} />
          </button>
          {!idea.imageUrl && !idea.isGeneratingImage && (
            <button
              onClick={() => onGenerateImage(idea.id)}
              className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          {idea.imageUrl && (
            <button
              onClick={() => onGenerateImage(idea.id)}
              className="w-8 h-8 rounded-full bg-white/90 text-[#8B6914] flex items-center justify-center shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* التكلفة */}
        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {idea.estimatedCost}
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className="p-4">
        {/* العنوان والوصف */}
        <h3 className="font-black text-[#5C3D11] text-base mb-1">{idea.title}</h3>
        <p className="text-xs text-[#8B6914]/80 leading-relaxed mb-3">{idea.description}</p>

        {/* لوحة الألوان */}
        <div className="flex gap-1.5 mb-3">
          {idea.palette.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className="w-8 h-8 rounded-lg border border-white shadow-sm"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
              <span className="text-[8px] text-[#8B6914] text-center leading-tight w-8 truncate">{c.name}</span>
            </div>
          ))}
        </div>

        {/* المميزات */}
        <div className="space-y-1.5 mb-3">
          {idea.highlights.slice(0, expanded ? undefined : 2).map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <Star className="w-3 h-3 text-[#C9A84C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#6B4C1E] leading-relaxed">{h}</p>
            </div>
          ))}
          {idea.highlights.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#C9A84C] font-bold flex items-center gap-1"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> أقل</> : <><ChevronDown className="w-3 h-3" /> {idea.highlights.length - 2} مزايا أخرى</>}
            </button>
          )}
        </div>

        {/* المواد */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.materials.map((m, i) => (
            <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">
              {m}
            </span>
          ))}
        </div>

        {/* الأثاث — قابل للطي */}
        {idea.furniture.length > 0 && (
          <div>
            <button
              onClick={() => setShowFurniture(!showFurniture)}
              className="w-full flex items-center justify-between py-2 border-t border-[#f0e8d8]"
            >
              <div className="flex items-center gap-1.5">
                <Sofa className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span className="text-xs font-bold text-[#5C3D11]">الأثاث المقترح ({idea.furniture.length} قطعة)</span>
              </div>
              {showFurniture ? <ChevronUp className="w-3.5 h-3.5 text-[#8B6914]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B6914]" />}
            </button>
            {showFurniture && (
              <div className="space-y-2 mt-2">
                {idea.furniture.map((f, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 bg-[#faf6f0] rounded-xl p-2.5">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#5C3D11]">{f.name}</p>
                      <p className="text-[10px] text-[#8B6914]/70 leading-tight">{f.description}</p>
                    </div>
                    <span className="text-[10px] text-[#C9A84C] font-bold flex-shrink-0 bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                      {f.priceRange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function DesignIdeas() {
  const [, navigate] = useLocation();
  const { t, dir } = useLanguage();
  const { deduct, canAfford, balance, requiresMousa, upgradeUrl } = useMousaCredit();

  // حالة الفلاتر
  const [selectedStyles, setSelectedStyles] = useState<StyleId[]>(["modern", "gulf", "minimal"]);
  const [selectedBudget, setSelectedBudget] = useState(BUDGET_OPTIONS[1]);
  const [selectedColorTheme, setSelectedColorTheme] = useState<typeof COLOR_THEMES[0] | null>(null);
  const [ideasCount, setIdeasCount] = useState(3);
  const [showFilters, setShowFilters] = useState(true);
  const [showStyleFilter, setShowStyleFilter] = useState(false);
  const [showColorFilter, setShowColorFilter] = useState(false);

  // حالة الأفكار
  const [ideas, setIdeas] = useState<DesignIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // الصورة المرجعية (من QuickAnalyze)
  const [referenceImage] = useState<string | null>(() => {
    try { return sessionStorage.getItem("quickAnalyzeImage"); } catch { return null; }
  });

  const generateIdeasMutation = trpc.generateDesignIdeas.useMutation({
    onSuccess: async (data) => {
      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas.map((idea: Omit<DesignIdea, 'id'> & { id?: string }) => ({
          ...idea,
          id: idea.id || Math.random().toString(36).slice(2),
          imageUrl: undefined,
          isGeneratingImage: false,
        })));
      }
      setIsLoading(false);
    },
    onError: (err) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!handleMousaErrorStatic(err as any)) toast.error("فشل توليد الأفكار، حاول مجدداً");
      setIsLoading(false);
    },
  });

  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data, variables) => {
      const ideaId = (variables as { ideaId?: string }).ideaId;
      if (data.imageUrl && ideaId) {
        setIdeas(prev => prev.map(idea =>
          idea.id === ideaId
            ? { ...idea, imageUrl: data.imageUrl!, isGeneratingImage: false }
            : idea
        ));
      } else {
        setIdeas(prev => prev.map(idea =>
          idea.isGeneratingImage ? { ...idea, isGeneratingImage: false } : idea
        ));
      }
    },
    onError: (err) => {
      setIdeas(prev => prev.map(idea => ({ ...idea, isGeneratingImage: false })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!handleMousaErrorStatic(err as any)) toast.error("فشل توليد الصورة");
    },
  });

  const handleGenerateIdeas = useCallback(() => {
    if (selectedStyles.length === 0) {
      toast.error("اختر نمطاً واحداً على الأقل");
      return;
    }
    if (requiresMousa && !canAfford("generateIdeas")) {
      toast.error(`رصيدك غير كافٍ (${balance ?? 0} كريدت). توليد الأفكار يكلف 20 كريدت.`, {
        action: upgradeUrl ? { label: "شراء كريدت", onClick: () => window.open(upgradeUrl, "_blank") } : undefined,
      });
      return;
    }
    setIsLoading(true);
    setIdeas([]);
    generateIdeasMutation.mutate({
      styles: selectedStyles,
      budgetMin: selectedBudget.min,
      budgetMax: selectedBudget.max,
      colorTheme: selectedColorTheme?.label,
      count: ideasCount,
      referenceImageUrl: referenceImage || undefined,
    });
  }, [selectedStyles, selectedBudget, selectedColorTheme, ideasCount, referenceImage]);

  const handleGenerateImage = useCallback((ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, isGeneratingImage: true } : i
    ));
    // Use the imagePrompt from the idea for best photorealistic results
    const enhancedPrompt = idea.imagePrompt
      ? `${idea.imagePrompt}, photorealistic render, cinematic lighting, 8K quality, architectural digest style, no people`
      : undefined;
    generateVizMutation.mutate({
      imageUrl: referenceImage || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      designStyle: idea.style,
      palette: idea.palette,
      materials: enhancedPrompt || idea.materials.join(", "),
    } as Parameters<typeof generateVizMutation.mutate>[0] & { ideaId: string });
    // Store ideaId for tracking (passed via variables in onSuccess)
    (generateVizMutation as unknown as { _currentIdeaId: string })._currentIdeaId = ideaId;
  }, [ideas, referenceImage]);

  const toggleStyle = (styleId: StyleId) => {
    setSelectedStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // توليد تلقائي عند تغيير الفلاتر (مع debounce)
  useEffect(() => {
    if (ideas.length === 0) return;
    const timer = setTimeout(() => {
      handleGenerateIdeas();
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedBudget, selectedColorTheme]);

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/90 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-40">
        <button onClick={() => navigate(-1 as unknown as string)} className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronRight className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-[#5C3D11]">{t("ideas.title")}</p>
          <p className="text-xs text-[#8B6914]/70">
            {ideas.length > 0 ? `${ideas.length} ${t("ideas.results")}` : t("ideas.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreditBadge className="hidden sm:flex" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
              showFilters ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            فلاتر
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-24">

        {/* ===== الفلاتر ===== */}
        {showFilters && (
          <div className="bg-white border-b border-[#e8d9c0] px-5 py-4 space-y-4">

            {/* فلتر النمط */}
            <div>
              <button
                onClick={() => setShowStyleFilter(!showStyleFilter)}
                className="w-full flex items-center justify-between mb-2"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#5C3D11]">النمط</span>
                  <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">
                    {selectedStyles.length} مختار
                  </span>
                </div>
                {showStyleFilter ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showStyleFilter && (
                <div className="grid grid-cols-5 gap-1.5">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleStyle(s.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                        selectedStyles.includes(s.id)
                          ? "border-[#C9A84C] bg-[#C9A84C]/10"
                          : "border-[#e8d9c0] bg-[#faf6f0]"
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className={`text-[9px] font-bold ${selectedStyles.includes(s.id) ? "text-[#8B6914]" : "text-[#5C3D11]"}`}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!showStyleFilter && (
                <div className="flex gap-1.5 flex-wrap">
                  {selectedStyles.map(sid => {
                    const s = STYLES.find(x => x.id === sid);
                    return s ? (
                      <span key={sid} className="text-xs bg-[#C9A84C]/10 text-[#8B6914] border border-[#C9A84C]/30 px-2.5 py-1 rounded-full font-medium">
                        {s.emoji} {s.label}
                      </span>
                    ) : null;
                  })}
                  <button onClick={() => setShowStyleFilter(true)} className="text-xs text-[#C9A84C] font-bold px-2">
                    + تعديل
                  </button>
                </div>
              )}
            </div>

            {/* فلتر الميزانية */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-sm font-bold text-[#5C3D11]">الميزانية</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {BUDGET_OPTIONS.map(b => (
                  <button
                    key={b.label}
                    onClick={() => setSelectedBudget(b)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                      selectedBudget.label === b.label
                        ? "border-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-[#e8d9c0] bg-[#faf6f0]"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#5C3D11]">{b.label}</span>
                    <span className="text-[8px] text-[#8B6914] text-center leading-tight">
                      {b.min >= 1000 ? `${b.min / 1000}k` : b.min} - {b.max >= 1000 ? `${b.max / 1000}k` : b.max}
                    </span>
                    {selectedBudget.label === b.label && <Check className="w-3 h-3 text-[#C9A84C]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* فلتر الألوان */}
            <div>
              <button
                onClick={() => setShowColorFilter(!showColorFilter)}
                className="w-full flex items-center justify-between mb-2"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#5C3D11]">ثيم الألوان</span>
                  {selectedColorTheme && (
                    <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">{selectedColorTheme.label}</span>
                  )}
                </div>
                {showColorFilter ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showColorFilter && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedColorTheme(null)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      !selectedColorTheme ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0]"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {["#C9A84C", "#607D8B", "#4CAF50", "#1976D2"].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-[#5C3D11]">تلقائي</span>
                  </button>
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.label}
                      onClick={() => setSelectedColorTheme(theme)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                        selectedColorTheme?.label === theme.label
                          ? "border-[#C9A84C] bg-[#C9A84C]/10"
                          : "border-[#e8d9c0] bg-[#faf6f0]"
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {theme.colors.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-[#5C3D11] text-center leading-tight">{theme.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* عدد الأفكار */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-sm font-bold text-[#5C3D11]">عدد الأفكار</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIdeasCount(Math.max(2, ideasCount - 1))}
                  className="w-8 h-8 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center text-[#8B6914] font-bold active:scale-95"
                >
                  −
                </button>
                <span className="w-8 text-center font-black text-[#5C3D11]">{ideasCount}</span>
                <button
                  onClick={() => setIdeasCount(Math.min(6, ideasCount + 1))}
                  className="w-8 h-8 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center text-[#8B6914] font-bold active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* زر التوليد */}
            <button
              onClick={handleGenerateIdeas}
              disabled={isLoading || selectedStyles.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-60"
              style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t("ideas.generating")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {ideas.length > 0 ? t("smart.regenerate") : `${t("ideas.generate")} (${ideasCount})`}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ===== حالة التحميل ===== */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5 py-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center shadow-xl">
              <Wand2 className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-black text-[#5C3D11] text-lg">{t("ideas.generating")}</p>
              <p className="text-sm text-[#8B6914]/70 mt-1">{ideasCount} {t("ideas.results")}</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {["تحليل الفضاء والمتطلبات", "توليد أفكار متنوعة", "اقتراح الأثاث والمواد", "حساب التكاليف"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.25}s` }} />
                  </div>
                  <span className="text-xs text-[#5C3D11]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== الأفكار ===== */}
        {!isLoading && ideas.length > 0 && (
          <div className="px-5 py-5 space-y-5">
            {/* شريط الملخص */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#5C3D11]">
                {ideas.length} أفكار تصميمية
              </p>
              <div className="flex items-center gap-2">
                {favorites.size > 0 && (
                  <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                    ❤️ {favorites.size} مفضلة
                  </span>
                )}
                <button
                  onClick={handleGenerateIdeas}
                  className="flex items-center gap-1 text-xs text-[#C9A84C] font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تجديد
                </button>
              </div>
            </div>

            {/* بطاقات الأفكار */}
            {ideas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onGenerateImage={handleGenerateImage}
                onFavorite={toggleFavorite}
                isFavorited={favorites.has(idea.id)}
              />
            ))}

            {/* زر توليد المزيد */}
            <button
              onClick={() => {
                setIdeasCount(prev => Math.min(6, prev + 1));
                handleGenerateIdeas();
              }}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              توليد أفكار إضافية
            </button>

            {/* مشاركة المفضلة */}
            {favorites.size > 0 && (
              <button
                onClick={() => toast.success(`تم حفظ ${favorites.size} أفكار مفضلة`)}
                className="w-full py-4 rounded-2xl bg-[#5C3D11] text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4" />
                حفظ الأفكار المفضلة ({favorites.size})
              </button>
            )}
          </div>
        )}

        {/* ===== الحالة الفارغة ===== */}
        {!isLoading && ideas.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5 py-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f0e8d8] to-[#faf6f0] flex items-center justify-center">
              <Wand2 className="w-12 h-12 text-[#C9A84C]" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-[#5C3D11] text-xl mb-2">{t("ideas.subtitle")}</h3>
              <p className="text-sm text-[#8B6914]/70 leading-relaxed">
                {t("ideas.generate")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {["🏙️ عصري", "🕌 خليجي", "💎 فاخر"].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 text-center border border-[#e8d9c0]">
                  <p className="text-sm font-bold text-[#5C3D11]">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
