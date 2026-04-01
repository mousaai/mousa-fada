import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Upload, MapPin, Sparkles, Loader2, CheckCircle, Building2, Trees, Car, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// أنواع الفضاءات الحضرية
const URBAN_TYPES = [
  { id: "residential_district", icon: Building2, label: "حي سكني", desc: "فلل، شقق، مجمعات" },
  { id: "commercial_street", icon: Car, label: "شارع تجاري", desc: "محلات، مطاعم، خدمات" },
  { id: "public_park", icon: Trees, label: "حديقة عامة", desc: "ممشيات، ملاعب، مناطق خضراء" },
  { id: "mixed_use", icon: Users, label: "متعدد الاستخدامات", desc: "سكني + تجاري + ترفيهي" },
  { id: "waterfront", icon: MapPin, label: "واجهة بحرية", desc: "كورنيش، مراسي، ممشيات" },
  { id: "cultural_district", icon: Sparkles, label: "حي ثقافي", desc: "متاحف، مراكز فنية، ساحات" },
];

// أنماط التصميم الحضري
const URBAN_STYLES = [
  { id: "modern", label: "حديث" },
  { id: "gulf", label: "خليجي" },
  { id: "mediterranean", label: "متوسطي" },
  { id: "sustainable", label: "مستدام" },
  { id: "smart_city", label: "مدينة ذكية" },
];

interface UrbanZone {
  name: string;
  type: string;
  area: number;
  description: string;
}

interface UrbanAnalysisResult {
  projectName: string;
  totalArea: number;
  zones: UrbanZone[];
  summary: string;
  keyFeatures: string[];
  sustainabilityScore: number;
  recommendations: string[];
  estimatedPopulation?: number;
}

export default function UrbanDesign() {
  const [, navigate] = useLocation();
  const { dir } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "config" | "analyzing" | "results">("upload");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [urbanType, setUrbanType] = useState("residential_district");
  const [designStyle, setDesignStyle] = useState("modern");
  const [projectScale, setProjectScale] = useState<"small" | "medium" | "large">("medium");
  const [analysisResult, setAnalysisResult] = useState<UrbanAnalysisResult | null>(null);

  const analyzeUrbanMutation = trpc.analyzeUrban.useMutation({
    onSuccess: (data: UrbanAnalysisResult) => {
      setAnalysisResult(data);
      setStep("results");
    },
    onError: (err: { message?: string }) => {
      toast.error("حدث خطأ في التحليل: " + (err.message || ""));
      setStep("config");
    },
  });

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFilePreview(dataUrl);
      setStep("config");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (!filePreview) return;
    setStep("analyzing");
    analyzeUrbanMutation.mutate({
      imageUrl: filePreview,
      urbanType,
      designStyle,
      projectScale,
    });
  };

  const handleDesignZone = (zone: UrbanZone) => {
    navigate(`/smart-capture?fromUrban=1&zone=${encodeURIComponent(zone.name)}&area=${zone.area}&style=${designStyle}`);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0]">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="text-center">
          <p className="text-base font-black text-[#5C3D11]">التصميم الحضري</p>
          <p className="text-xs text-[#8B6914]/70">أحياء، شوارع، مناطق عامة</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-[#2C5F2E] to-[#1a3d1b] rounded-3xl p-5 text-white">
              <p className="text-lg font-black mb-1">م. سارة للتصميم الحضري</p>
              <p className="text-sm opacity-80">ارفع صورة جوية أو مخطط عام للمنطقة وستحللها م. سارة وتقترح تصميماً حضرياً متكاملاً</p>
              <div className="flex gap-3 mt-3 flex-wrap">
                {["أحياء سكنية", "شوارع تجارية", "حدائق عامة", "واجهات بحرية"].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-white/20 text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[#2C5F2E]/40 bg-white p-10 cursor-pointer active:scale-95 transition-transform"
              style={{ minHeight: 260 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2C5F2E] to-[#1a3d1b] flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#1a3d1b]">ارفع صورة المنطقة</p>
                <p className="text-sm text-[#2C5F2E]/70 mt-1">صورة جوية، مخطط عام، أو صورة ميدانية</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {["صورة جوية", "Google Maps", "مخطط عام", "صورة ميدانية"].map(fmt => (
                  <span key={fmt} className="px-3 py-1 rounded-full bg-[#2C5F2E]/10 text-xs font-bold text-[#2C5F2E]">{fmt}</span>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Capabilities */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🏙️", title: "تحليل الكثافة", desc: "السكانية والعمرانية" },
                { icon: "🌿", title: "المساحات الخضراء", desc: "نسبة التشجير والحدائق" },
                { icon: "🚗", title: "شبكة الطرق", desc: "حركة المرور والمواقف" },
                { icon: "💡", title: "الاستدامة", desc: "الطاقة والبيئة" },
              ].map(card => (
                <div key={card.title} className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-xs font-bold text-[#5C3D11] mt-2">{card.title}</p>
                  <p className="text-[10px] text-[#8B6914]/70 mt-0.5">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Config */}
        {step === "config" && (
          <div className="space-y-6">
            {/* File Preview */}
            {filePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[#e8d9c0] bg-white">
                <img src={filePreview} alt="منطقة" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setStep("upload"); setFilePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                >✕</button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  {fileName || "الصورة المرفوعة"}
                </div>
              </div>
            )}

            {/* Urban Type */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نوع المنطقة الحضرية</p>
              <div className="grid grid-cols-2 gap-2">
                {URBAN_TYPES.map(ut => {
                  const Icon = ut.icon;
                  return (
                    <button
                      key={ut.id}
                      onClick={() => setUrbanType(ut.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${urbanType === ut.id ? "border-[#2C5F2E] bg-[#2C5F2E]/10" : "border-[#e8d9c0] bg-white"}`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${urbanType === ut.id ? "text-[#2C5F2E]" : "text-[#8B6914]/60"}`} />
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#5C3D11]">{ut.label}</p>
                        <p className="text-[9px] text-[#8B6914]/60">{ut.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Scale */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">حجم المشروع</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "small", label: "صغير", desc: "< 5 هكتار" },
                  { id: "medium", label: "متوسط", desc: "5-50 هكتار" },
                  { id: "large", label: "كبير", desc: "> 50 هكتار" },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setProjectScale(s.id as "small" | "medium" | "large")}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${projectScale === s.id ? "border-[#2C5F2E] bg-[#2C5F2E]/10" : "border-[#e8d9c0] bg-white"}`}
                  >
                    <p className="text-sm font-bold text-[#5C3D11]">{s.label}</p>
                    <p className="text-[10px] text-[#8B6914]/60">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Style */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نمط التصميم الحضري</p>
              <div className="flex gap-2 flex-wrap">
                {URBAN_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDesignStyle(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${designStyle === s.id ? "bg-[#2C5F2E] text-white" : "bg-white border border-[#e8d9c0] text-[#5C3D11]"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2C5F2E] to-[#1a3d1b] text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                ابدأ التحليل الحضري
              </span>
            </button>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2C5F2E] to-[#1a3d1b] animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-[#faf6f0] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#2C5F2E] animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-[#1a3d1b]">م. سارة تحلل المنطقة</p>
              <p className="text-sm text-[#2C5F2E]/70">تحليل الكثافة والمناطق والمساحات...</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {["قراءة الصورة الجوية", "تحديد المناطق", "تحليل الكثافة", "توليد التصميم"].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2C5F2E]/20 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-[#2C5F2E] animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <p className="text-sm text-[#1a3d1b]">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "results" && analysisResult && (
          <div className="space-y-5">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-[#2C5F2E] to-[#1a3d1b] rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold">{analysisResult.projectName || "تم تحليل المنطقة"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.totalArea}</p>
                  <p className="text-xs opacity-80">هكتار</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.zones.length}</p>
                  <p className="text-xs opacity-80">منطقة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.sustainabilityScore}%</p>
                  <p className="text-xs opacity-80">استدامة</p>
                </div>
              </div>
              {analysisResult.estimatedPopulation && (
                <p className="text-sm opacity-80 mt-2">السكان المتوقعون: {analysisResult.estimatedPopulation.toLocaleString()} شخص</p>
              )}
              <p className="text-sm opacity-90 mt-3 leading-relaxed">{analysisResult.summary}</p>
            </div>

            {/* Key Features */}
            {analysisResult.keyFeatures?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                <p className="text-sm font-bold text-[#5C3D11] mb-3">المميزات الرئيسية</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keyFeatures.map((f: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-[#2C5F2E]/10 text-xs font-bold text-[#2C5F2E]">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Zones */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">المناطق المكتشفة ({analysisResult.zones.length})</p>
              <div className="space-y-3">
                {analysisResult.zones.map((zone: UrbanZone) => (
                  <div key={zone.name} className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#5C3D11]">{zone.name}</p>
                        <p className="text-xs text-[#8B6914]/70 mt-0.5">{zone.type} — {zone.area} هكتار</p>
                        <p className="text-xs text-[#5C3D11]/70 mt-1">{zone.description}</p>
                      </div>
                      <button
                        onClick={() => handleDesignZone(zone)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2C5F2E] to-[#1a3d1b] text-white text-xs font-bold active:scale-95 transition-transform"
                      >
                        صمّم
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {analysisResult.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                <p className="text-sm font-bold text-[#5C3D11] mb-3">توصيات م. سارة الحضرية</p>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#2C5F2E] font-bold text-xs mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-[#5C3D11]">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
