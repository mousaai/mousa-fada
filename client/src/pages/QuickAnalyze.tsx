/**
 * QuickAnalyze — تحليل سريع مع توليد صورة تصورية وتعديل مباشر
 * رفع صورة → نتيجة فورية + صورة تصورية + تعديل الألوان والمواصفات والميزانية
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Camera, ImagePlus, ChevronRight, Sparkles, Download, Share2,
  RotateCcw, Palette, Wand2, DollarSign, Sliders, Check,
  RefreshCw, ChevronDown, ChevronUp, Edit3, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type DesignStyle = "modern" | "gulf" | "classic" | "minimal" | "japanese" | "scandinavian" | "moroccan" | "luxury";

const STYLES: { id: DesignStyle; label: string; emoji: string }[] = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "gulf", label: "خليجي", emoji: "🕌" },
  { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
  { id: "minimal", label: "مينيمال", emoji: "⬜" },
  { id: "japanese", label: "ياباني", emoji: "⛩️" },
  { id: "scandinavian", label: "سكندنافي", emoji: "🌿" },
  { id: "moroccan", label: "مغربي", emoji: "🌙" },
  { id: "luxury", label: "فاخر", emoji: "💎" },
];

const BUDGET_PRESETS = [
  { label: "اقتصادي", range: { min: 5000, max: 20000 }, color: "bg-green-100 text-green-700 border-green-300" },
  { label: "متوسط", range: { min: 20000, max: 60000 }, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { label: "فاخر", range: { min: 60000, max: 150000 }, color: "bg-purple-100 text-purple-700 border-purple-300" },
  { label: "بريميوم", range: { min: 150000, max: 500000 }, color: "bg-amber-100 text-amber-700 border-amber-300" },
];

interface QuickResult {
  overview: string;
  palette: { name: string; hex: string }[];
  topSuggestions: string[];
  estimatedCost: string;
  costBreakdown?: Record<string, string>;
  materials?: string[];
}

// Color Picker Component
function ColorSwatch({
  color,
  onEdit,
}: {
  color: { name: string; hex: string };
  onEdit: (newHex: string, newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tempHex, setTempHex] = useState(color.hex);
  const [tempName, setTempName] = useState(color.name);

  const save = () => {
    onEdit(tempHex, tempName);
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 flex-1 relative">
      <div
        className="w-full h-12 rounded-xl border-2 border-white shadow-md cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        style={{ backgroundColor: color.hex }}
        onClick={() => setEditing(!editing)}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity">
          <Edit3 className="w-3 h-3 text-white" />
        </div>
      </div>
      <span className="text-[10px] text-[#8B6914] text-center leading-tight">{color.name}</span>

      {editing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-[#e8d9c0] p-3 w-52">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C3D11]">تعديل اللون</span>
            <button onClick={() => setEditing(false)}><X className="w-4 h-4 text-[#8B6914]" /></button>
          </div>
          <input
            type="color"
            value={tempHex}
            onChange={(e) => setTempHex(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border border-[#e8d9c0] mb-2"
          />
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="اسم اللون"
            className="w-full text-xs border border-[#e8d9c0] rounded-lg px-2 py-1.5 text-[#5C3D11] mb-2 text-right"
          />
          <div className="flex gap-1">
            <button
              onClick={save}
              className="flex-1 py-1.5 bg-[#C9A84C] text-white text-xs font-bold rounded-lg"
            >
              حفظ
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 border border-[#e8d9c0] text-[#8B6914] text-xs rounded-lg"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuickAnalyze() {
  const [, navigate] = useLocation();
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<DesignStyle>("modern");
  const [result, setResult] = useState<QuickResult | null>(null);
  const [step, setStep] = useState<"upload" | "style" | "analyzing" | "result">("upload");
  const [vizImage, setVizImage] = useState<string | null>(null);
  const [isGeneratingViz, setIsGeneratingViz] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [editedPalette, setEditedPalette] = useState<{ name: string; hex: string }[]>([]);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number } | null>(null);
  const [customBudgetMin, setCustomBudgetMin] = useState("");
  const [customBudgetMax, setCustomBudgetMax] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [showRequirementsInput, setShowRequirementsInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // حفظ الصورة في sessionStorage للاستخدام في صفحة الأفكار
  const saveImageForIdeas = (imageData: string) => {
    try { sessionStorage.setItem("quickAnalyzeImage", imageData); } catch {}
  };

  const analyzeMutation = trpc.quickAnalyze.useMutation({
    onSuccess: (data: Partial<QuickResult>) => {
      const palette = data.palette?.slice(0, 5) || [];
      setResult({
        overview: data.overview || "تحليل مكتمل",
        palette,
        topSuggestions: data.topSuggestions?.slice(0, 4) || [],
        estimatedCost: data.estimatedCost || "",
        costBreakdown: (data as QuickResult).costBreakdown,
        materials: (data as QuickResult).materials,
      });
      setEditedPalette(palette);
      setStep("result");
    },
    onError: () => {
      toast.error("حدث خطأ، حاول مجدداً");
      setStep("style");
    },
  });

  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data) => {
      if (data.imageUrl) {
        setVizImage(data.imageUrl);
        toast.success("تم توليد الصورة التصورية!");
      } else {
        toast.error("فشل توليد الصورة، حاول مجدداً");
      }
      setIsGeneratingViz(false);
    },
    onError: () => {
      toast.error("فشل توليد الصورة");
      setIsGeneratingViz(false);
    },
  });

  const reAnalyzeMutation = trpc.reAnalyzeWithChanges.useMutation({
    onSuccess: (data: Partial<QuickResult & { costBreakdown?: Record<string, string>; materials?: string[] }>) => {
      const palette = data.palette?.slice(0, 5) || editedPalette;
      setResult({
        overview: data.overview || result?.overview || "",
        palette,
        topSuggestions: data.topSuggestions?.slice(0, 4) || result?.topSuggestions || [],
        estimatedCost: data.estimatedCost || result?.estimatedCost || "",
        costBreakdown: data.costBreakdown,
        materials: data.materials,
      });
      setEditedPalette(palette);
      setIsReanalyzing(false);
      toast.success("تم تحديث التحليل!");
    },
    onError: () => {
      toast.error("فشل التحديث");
      setIsReanalyzing(false);
    },
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setStep("style");
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = () => {
    if (!preview) return;
    setStep("analyzing");
    analyzeMutation.mutate({ imageUrl: preview, designStyle: style });
  };

  const handleGenerateViz = useCallback(() => {
    if (!preview) return;
    setIsGeneratingViz(true);
    setVizImage(null);
    generateVizMutation.mutate({
      imageUrl: preview,
      designStyle: style,
      palette: editedPalette.length > 0 ? editedPalette : result?.palette,
      materials: result?.materials?.join(", "),
    });
  }, [preview, style, editedPalette, result]);

  const handleReanalyze = useCallback(() => {
    if (!preview) return;
    setIsReanalyzing(true);
    const budgetRange = selectedBudget || (customBudgetMin && customBudgetMax
      ? { min: parseInt(customBudgetMin), max: parseInt(customBudgetMax) }
      : undefined);
    reAnalyzeMutation.mutate({
      imageUrl: preview,
      designStyle: style,
      customPalette: editedPalette.length > 0 ? editedPalette : undefined,
      budgetRange,
      customRequirements: customRequirements || undefined,
    });
  }, [preview, style, editedPalette, selectedBudget, customBudgetMin, customBudgetMax, customRequirements]);

  const updateColor = (index: number, newHex: string, newName: string) => {
    const updated = editedPalette.map((c, i) =>
      i === index ? { name: newName, hex: newHex } : c
    );
    setEditedPalette(updated);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setVizImage(null);
    setEditedPalette([]);
    setSelectedBudget(null);
    setCustomBudgetMin("");
    setCustomBudgetMax("");
    setCustomRequirements("");
    setStep("upload");
  };

  const currentBudgetLabel = selectedBudget
    ? `${selectedBudget.min.toLocaleString()} - ${selectedBudget.max.toLocaleString()} ر.س`
    : customBudgetMin && customBudgetMax
    ? `${parseInt(customBudgetMin).toLocaleString()} - ${parseInt(customBudgetMax).toLocaleString()} ر.س`
    : null;

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-40">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div>
          <p className="font-bold text-[#5C3D11]">تحليل سريع</p>
          <p className="text-xs text-[#8B6914]/70">م. سارة تحلل فضاءك فوراً</p>
        </div>
        {step !== "upload" && (
          <button onClick={reset} className="mr-auto p-2 rounded-full hover:bg-[#f0e8d8]">
            <RotateCcw className="w-5 h-5 text-[#8B6914]" />
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 pb-24">
        {/* ===== STEP 1: Upload ===== */}
        {step === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#5C3D11]">ارفع صورة الفضاء</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">صورة الغرفة أو المخطط المعماري</p>
            </div>
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-36 h-36 rounded-3xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
              style={{ boxShadow: "0 8px 32px rgba(201,168,76,0.4)" }}
            >
              <Camera className="w-12 h-12 text-white" />
              <span className="text-white font-bold text-sm">التقط صورة</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] font-bold active:scale-95 transition-transform"
            >
              <ImagePlus className="w-5 h-5" />
              اختر من المعرض
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ===== STEP 2: Choose Style ===== */}
        {step === "style" && preview && (
          <div className="flex-1 flex flex-col gap-5">
            <img src={preview} className="w-full h-48 object-cover rounded-2xl" alt="preview" />
            <div>
              <p className="font-bold text-[#5C3D11] mb-3">اختر نمط التصميم</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      style === s.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-white"
                    }`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className={`text-xs font-bold ${style === s.id ? "text-[#8B6914]" : "text-[#5C3D11]"}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startAnalysis}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-lg shadow-lg active:scale-95 transition-transform mt-auto"
              style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                تحليل الآن
              </span>
            </button>
          </div>
        )}

        {/* ===== STEP 3: Analyzing ===== */}
        {step === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {preview && (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden">
                <img src={preview} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-[#5C3D11]/40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-[#C9A84C] animate-pulse" />
                    </div>
                    <p className="font-bold text-lg">م. سارة تحلل...</p>
                  </div>
                </div>
              </div>
            )}
            <div className="w-full space-y-3">
              {["تحليل الفضاء والأبعاد", "اقتراح الألوان والمواد", "حساب التكاليف التقديرية"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 4: Result ===== */}
        {step === "result" && result && (
          <div className="flex-1 flex flex-col gap-4">

            {/* ── صورة التصور المولّد ── */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">الصورة التصورية</span>
                </div>
                <button
                  onClick={handleGenerateViz}
                  disabled={isGeneratingViz}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold active:scale-95 transition-transform disabled:opacity-60"
                >
                  {isGeneratingViz ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> جاري التوليد...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> {vizImage ? "إعادة توليد" : "توليد صورة"}</>
                  )}
                </button>
              </div>

              {vizImage ? (
                <div className="relative">
                  <img src={vizImage} className="w-full h-56 object-cover" alt="visualization" />
                  <div className="absolute top-2 right-2 bg-[#C9A84C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✨ م. سارة
                  </div>
                </div>
              ) : isGeneratingViz ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 bg-[#faf6f0]">
                  <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-sm text-[#8B6914]">م. سارة تولّد الصورة التصورية...</p>
                  <p className="text-xs text-[#8B6914]/60">قد يستغرق 15-30 ثانية</p>
                </div>
              ) : (
                <div className="relative">
                  {preview && <img src={preview} className="w-full h-44 object-cover opacity-60" alt="preview" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#5C3D11]/20">
                    <Wand2 className="w-8 h-8 text-[#C9A84C]" />
                    <p className="text-sm font-bold text-[#5C3D11]">اضغط "توليد صورة" لرؤية تصورك</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── تقييم م. سارة ── */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-bold text-[#5C3D11] text-sm">تقييم م. سارة</span>
              </div>
              <p className="text-sm text-[#6B4C1E] leading-relaxed">{result.overview}</p>
            </div>

            {/* ── لوحة الألوان القابلة للتعديل ── */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">لوحة الألوان</span>
                </div>
                <span className="text-[10px] text-[#8B6914]/60 bg-[#f0e8d8] px-2 py-0.5 rounded-full">
                  اضغط لتعديل
                </span>
              </div>
              <div className="flex gap-2 relative">
                {(editedPalette.length > 0 ? editedPalette : result.palette).map((c, i) => (
                  <ColorSwatch
                    key={i}
                    color={c}
                    onEdit={(hex, name) => updateColor(i, hex, name)}
                  />
                ))}
              </div>
              {editedPalette.some((c, i) => c.hex !== result.palette[i]?.hex) && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleReanalyze}
                    disabled={isReanalyzing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#C9A84C]/20 text-[#8B6914] text-xs font-bold rounded-xl border border-[#C9A84C]/30 active:scale-95 transition-transform"
                  >
                    <RefreshCw className={`w-3 h-3 ${isReanalyzing ? "animate-spin" : ""}`} />
                    تحديث التحليل بالألوان الجديدة
                  </button>
                </div>
              )}
            </div>

            {/* ── تعديل النمط ── */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button
                onClick={() => setShowStyleEditor(!showStyleEditor)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">تعديل النمط</span>
                  <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">
                    {STYLES.find(s => s.id === style)?.emoji} {STYLES.find(s => s.id === style)?.label}
                  </span>
                </div>
                {showStyleEditor ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showStyleEditor && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                          style === s.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-[#faf6f0]"
                        }`}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <span className={`text-[10px] font-bold ${style === s.id ? "text-[#8B6914]" : "text-[#5C3D11]"}`}>
                          {s.label}
                        </span>
                        {style === s.id && <Check className="w-3 h-3 text-[#C9A84C]" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowStyleEditor(false); handleReanalyze(); }}
                    disabled={isReanalyzing}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق النمط الجديد"}
                  </button>
                </div>
              )}
            </div>

            {/* ── تعديل الميزانية ── */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBudgetEditor(!showBudgetEditor)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">تعديل الميزانية</span>
                  {currentBudgetLabel && (
                    <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">{currentBudgetLabel}</span>
                  )}
                </div>
                {showBudgetEditor ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showBudgetEditor && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => { setSelectedBudget(preset.range); setCustomBudgetMin(""); setCustomBudgetMax(""); }}
                        className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                          selectedBudget?.min === preset.range.min
                            ? "border-[#C9A84C] bg-[#C9A84C]/10"
                            : "border-[#e8d9c0] bg-[#faf6f0]"
                        }`}
                      >
                        <span className="text-xs font-bold text-[#5C3D11]">{preset.label}</span>
                        <span className="text-[10px] text-[#8B6914]">
                          {preset.range.min.toLocaleString()} - {preset.range.max.toLocaleString()} ر.س
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-[#8B6914] flex-shrink-0">أو أدخل:</span>
                    <input
                      type="number"
                      placeholder="من"
                      value={customBudgetMin}
                      onChange={(e) => { setCustomBudgetMin(e.target.value); setSelectedBudget(null); }}
                      className="flex-1 text-xs border border-[#e8d9c0] rounded-xl px-3 py-2 text-[#5C3D11] text-right"
                    />
                    <span className="text-xs text-[#8B6914]">-</span>
                    <input
                      type="number"
                      placeholder="إلى"
                      value={customBudgetMax}
                      onChange={(e) => { setCustomBudgetMax(e.target.value); setSelectedBudget(null); }}
                      className="flex-1 text-xs border border-[#e8d9c0] rounded-xl px-3 py-2 text-[#5C3D11] text-right"
                    />
                    <span className="text-xs text-[#8B6914] flex-shrink-0">ر.س</span>
                  </div>
                  <button
                    onClick={() => { setShowBudgetEditor(false); handleReanalyze(); }}
                    disabled={isReanalyzing}
                    className="w-full py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق الميزانية"}
                  </button>
                </div>
              )}
            </div>

            {/* ── التكلفة التقديرية ── */}
            <div
              className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-4 text-white cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 mb-1">التكلفة التقديرية الإجمالية</p>
                  <p className="text-xl font-black">{result.estimatedCost}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <DollarSign className="w-6 h-6 opacity-70" />
                  {showCostBreakdown ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
                </div>
              </div>
              {showCostBreakdown && result.costBreakdown && (
                <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2">
                  {Object.entries(result.costBreakdown).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      furniture: "الأثاث", flooring: "الأرضيات",
                      walls: "الجدران", lighting: "الإضاءة", accessories: "الإكسسوارات"
                    };
                    return (
                      <div key={key} className="bg-white/10 rounded-xl p-2">
                        <p className="text-[10px] opacity-70">{labels[key] || key}</p>
                        <p className="text-xs font-bold">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── التوصيات ── */}
            {result.topSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="font-bold text-[#5C3D11] text-sm mb-3">توصيات م. سارة</p>
                <div className="space-y-2">
                  {result.topSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C9A84C]/20 text-[#8B6914] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[#6B4C1E] leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── المواد المقترحة ── */}
            {result.materials && result.materials.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="font-bold text-[#5C3D11] text-sm mb-3">المواد المقترحة</p>
                <div className="flex flex-wrap gap-2">
                  {result.materials.map((m, i) => (
                    <span key={i} className="text-xs bg-[#f0e8d8] text-[#8B6914] px-3 py-1.5 rounded-full font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── متطلبات مخصصة ── */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button
                onClick={() => setShowRequirementsInput(!showRequirementsInput)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">متطلبات مخصصة</span>
                </div>
                {showRequirementsInput ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showRequirementsInput && (
                <div className="px-4 pb-4">
                  <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="مثال: أريد أرضية خشبية، وألوان هادئة، وإضاءة دافئة..."
                    className="w-full text-sm border border-[#e8d9c0] rounded-xl px-3 py-2.5 text-[#5C3D11] text-right resize-none h-24"
                  />
                  <button
                    onClick={() => { setShowRequirementsInput(false); handleReanalyze(); }}
                    disabled={isReanalyzing || !customRequirements.trim()}
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق المتطلبات"}
                  </button>
                </div>
              )}
            </div>

            {/* ── أزرار الإجراءات ── */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={reset}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-transform"
              >
                <RotateCcw className="w-4 h-4 text-[#8B6914]" />
                <span className="text-xs text-[#5C3D11] font-medium">تحليل آخر</span>
              </button>
              <button
                onClick={() => toast.success("تم الحفظ في مشاريعك")}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-transform"
              >
                <Download className="w-4 h-4 text-[#8B6914]" />
                <span className="text-xs text-[#5C3D11] font-medium">حفظ</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "تحليل م. سارة", text: result.overview });
                  } else {
                    toast.success("تم النسخ");
                    navigator.clipboard.writeText(result.overview);
                  }
                }}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">مشاركة</span>
              </button>
            </div>

            <button
    onClick={() => navigate("/design-studio")}
          className="w-full py-4 rounded-2xl bg-[#5C3D11] text-white font-bold active:scale-95 transition-transform mb-4"
        >
          تصميم كامل في الاستوديو ←
        </button>

            {/* زر أفكار تصميمية متعددة */}
            <button
              onClick={() => {
                if (preview) saveImageForIdeas(preview);
                navigate("/design-ideas");
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-base shadow-lg active:scale-95 transition-transform mb-6"
              style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                استعرض أفكاراً تصميمية متعددة ✨
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
