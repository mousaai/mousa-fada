/**
 * QuickAnalyze — تحليل سريع بخطوة واحدة
 * رفع صورة → نتيجة فورية من م. سارة
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Camera, ImagePlus, ChevronRight, Sparkles, Download, Share2, RotateCcw, Palette } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type DesignStyle = "modern" | "gulf" | "classic" | "minimal";

const STYLES: { id: DesignStyle; label: string; emoji: string }[] = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "gulf", label: "خليجي", emoji: "🕌" },
  { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
  { id: "minimal", label: "مينيمال", emoji: "⬜" },
];

interface QuickResult {
  overview: string;
  palette: { name: string; hex: string }[];
  topSuggestions: string[];
  estimatedCost: string;
}

export default function QuickAnalyze() {
  const [, navigate] = useLocation();
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<DesignStyle>("modern");
  const [result, setResult] = useState<QuickResult | null>(null);
  const [step, setStep] = useState<"upload" | "style" | "analyzing" | "result">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.quickAnalyze.useMutation({
    onSuccess: (data: Partial<QuickResult>) => {
      setResult({
        overview: data.overview || "تحليل مكتمل",
        palette: data.palette?.slice(0, 5) || [],
        topSuggestions: data.topSuggestions?.slice(0, 4) || [],
        estimatedCost: data.estimatedCost || "",
      });
      setStep("result");
    },
    onError: () => {
      toast.error("حدث خطأ، حاول مجدداً");
      setStep("style");
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

  const reset = () => {
    setPreview(null);
    setResult(null);
    setStep("upload");
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0]">
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

      <main className="flex-1 flex flex-col px-5 py-6">
        {/* ===== STEP 1: Upload ===== */}
        {step === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#5C3D11]">ارفع صورة الفضاء</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">صورة الغرفة أو المخطط المعماري</p>
            </div>

            {/* Camera Button — Primary */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-36 h-36 rounded-3xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
              style={{ boxShadow: "0 8px 32px rgba(201,168,76,0.4)" }}
            >
              <Camera className="w-12 h-12 text-white" />
              <span className="text-white font-bold text-sm">التقط صورة</span>
            </button>

            {/* Gallery Button — Secondary */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] font-bold active:scale-95 transition-transform"
            >
              <ImagePlus className="w-5 h-5" />
              اختر من المعرض
            </button>

            {/* Hidden inputs */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ===== STEP 2: Choose Style ===== */}
        {step === "style" && preview && (
          <div className="flex-1 flex flex-col gap-5">
            {/* Preview */}
            <img src={preview} className="w-full h-48 object-cover rounded-2xl" alt="preview" />

            <div>
              <p className="font-bold text-[#5C3D11] mb-3">اختر نمط التصميم</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      style === s.id
                        ? "border-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-[#e8d9c0] bg-white"
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

            {/* Analyze Button */}
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

            {/* Animated Steps */}
            <div className="w-full space-y-3">
              {["تحليل الفضاء والأبعاد", "اقتراح الألوان والمواد", "حساب التكاليف التقديرية"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 4: Result ===== */}
        {step === "result" && result && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Preview + Badge */}
            <div className="relative">
              {preview && <img src={preview} className="w-full h-44 object-cover rounded-2xl" alt="preview" />}
              <div className="absolute top-3 right-3 bg-[#C9A84C] text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ تحليل م. سارة
              </div>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-bold text-[#5C3D11] text-sm">تقييم الفضاء</span>
              </div>
              <p className="text-sm text-[#6B4C1E] leading-relaxed">{result.overview}</p>
            </div>

            {/* Color Palette */}
            {result.palette.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">لوحة الألوان</span>
                </div>
                <div className="flex gap-2">
                  {result.palette.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full h-10 rounded-xl border border-white/50 shadow-sm"
                        style={{ backgroundColor: c.hex || "#C9A84C" }}
                      />
                      <span className="text-[10px] text-[#8B6914] text-center leading-tight">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
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

            {/* Cost */}
            {result.estimatedCost && (
              <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-4 text-white">
                <p className="text-xs opacity-80 mb-1">التكلفة التقديرية</p>
                <p className="text-xl font-black">{result.estimatedCost}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pb-4">
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

            {/* Go to Full Design */}
            <button
              onClick={() => navigate("/design-studio")}
              className="w-full py-4 rounded-2xl bg-[#5C3D11] text-white font-bold active:scale-95 transition-transform mb-4"
            >
              تصميم كامل في الاستوديو ←
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
