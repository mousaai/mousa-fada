import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Upload, FileText, Sparkles, CheckCircle, AlertCircle, Loader2, Building2, Home, Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// أنواع المشاريع
const PROJECT_TYPES = [
  { id: "residential", icon: Home, label: "سكني", labelEn: "Residential", desc: "فيلا، شقة، دوبلكس" },
  { id: "commercial", icon: Briefcase, label: "تجاري", labelEn: "Commercial", desc: "مكتب، محل، مطعم" },
  { id: "mixed", icon: Building2, label: "مختلط", labelEn: "Mixed Use", desc: "سكني + تجاري" },
];

// أنماط التصميم
const STYLES = [
  { id: "modern", label: "عصري" },
  { id: "gulf", label: "خليجي" },
  { id: "classic", label: "كلاسيكي" },
  { id: "minimal", label: "مينيمال" },
  { id: "luxury", label: "فاخر" },
];

interface RoomResult {
  name: string;
  type: string;
  area: number;
  dimensions: string;
}

interface PlanAnalysisResult {
  projectType: string;
  totalArea: number;
  rooms: RoomResult[];
  floors: number;
  summary: string;
  recommendations: string[];
}

export default function PlanDesign() {
  const [, navigate] = useLocation();
  const { dir } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "config" | "analyzing" | "results">("upload");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [projectType, setProjectType] = useState("residential");
  const [designStyle, setDesignStyle] = useState("modern");
  const [analysisResult, setAnalysisResult] = useState<PlanAnalysisResult | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  const analyzePlanMutation = trpc.analyzePlan.useMutation({
    onSuccess: (data: PlanAnalysisResult) => {
      setAnalysisResult(data);
      setSelectedRooms(data.rooms.map((r: RoomResult) => r.name));
      setStep("results");
    },
    onError: (err: { message?: string }) => {
      toast.error("حدث خطأ في تحليل المخطط: " + (err.message || ""));
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
    analyzePlanMutation.mutate({
      imageUrl: filePreview,
      projectType: projectType as "residential" | "commercial" | "mixed",
      designStyle,
    });
  };

  const toggleRoom = (name: string) => {
    setSelectedRooms(prev =>
      prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]
    );
  };

  const handleDesignRoom = (room: RoomResult) => {
    // الانتقال إلى SmartCapture مع بيانات الغرفة
    navigate(`/smart-capture?fromPlan=1&room=${encodeURIComponent(room.name)}&area=${room.area}&style=${designStyle}`);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0]">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="text-center">
          <p className="text-base font-black text-[#5C3D11]">صمّم من المخطط</p>
          <p className="text-xs text-[#8B6914]/70">ارفع مخططك واحصل على تصميم كامل</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {["رفع المخطط", "الإعدادات", "التحليل", "النتائج"].map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#C9A84C] text-white" : "bg-[#e8d9c0] text-[#8B6914]"}`}>
                    {i + 1}
                  </div>
                  {i < 3 && <div className="flex-1 h-0.5 bg-[#e8d9c0]" />}
                </div>
              ))}
            </div>

            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[#C9A84C]/50 bg-white p-10 cursor-pointer active:scale-95 transition-transform"
              style={{ minHeight: 280 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#5C3D11]">ارفع مخطط المشروع</p>
                <p className="text-sm text-[#8B6914]/70 mt-1">صورة أو PDF للمخطط المعماري</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {["JPG", "PNG", "PDF", "WebP"].map(fmt => (
                  <span key={fmt} className="px-3 py-1 rounded-full bg-[#f0e8d8] text-xs font-bold text-[#8B6914]">{fmt}</span>
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

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🏠", title: "استخراج الغرف", desc: "تحليل تلقائي لجميع الغرف والمساحات" },
                { icon: "📐", title: "الأبعاد الدقيقة", desc: "استخراج الأبعاد والمساحات من المخطط" },
                { icon: "🎨", title: "تصور ثلاثي الأبعاد", desc: "توليد صور تصورية لكل غرفة" },
                { icon: "💰", title: "تقرير التكاليف", desc: "BOQ كامل لجميع غرف المشروع" },
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
                {filePreview.startsWith("data:image") ? (
                  <img src={filePreview} alt="مخطط" className="w-full max-h-48 object-contain" />
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText className="w-8 h-8 text-[#C9A84C]" />
                    <div>
                      <p className="text-sm font-bold text-[#5C3D11]">{fileName}</p>
                      <p className="text-xs text-[#8B6914]/70">PDF مرفوع</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setStep("upload"); setFilePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                >✕</button>
              </div>
            )}

            {/* Project Type */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نوع المشروع</p>
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_TYPES.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => setProjectType(pt.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${projectType === pt.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-white"}`}
                    >
                      <Icon className={`w-6 h-6 ${projectType === pt.id ? "text-[#C9A84C]" : "text-[#8B6914]/60"}`} />
                      <p className="text-xs font-bold text-[#5C3D11]">{pt.label}</p>
                      <p className="text-[9px] text-[#8B6914]/60 text-center">{pt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Design Style */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نمط التصميم</p>
              <div className="flex gap-2 flex-wrap">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDesignStyle(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${designStyle === s.id ? "bg-[#C9A84C] text-white" : "bg-white border border-[#e8d9c0] text-[#8B6914]"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                ابدأ تحليل المخطط
              </span>
            </button>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-[#faf6f0] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-[#5C3D11]">م. سارة تحلل مخططك</p>
              <p className="text-sm text-[#8B6914]/70">استخراج الغرف والأبعاد والمساحات...</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {["قراءة المخطط", "استخراج الغرف", "حساب المساحات", "تحضير التصاميم"].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-[#C9A84C] animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <p className="text-sm text-[#8B6914]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "results" && analysisResult && (
          <div className="space-y-5">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-[#C9A84C] to-[#8B6914] rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold">تم تحليل المخطط بنجاح</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.totalArea}</p>
                  <p className="text-xs opacity-80">م² إجمالي</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.rooms.length}</p>
                  <p className="text-xs opacity-80">غرفة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black">{analysisResult.floors}</p>
                  <p className="text-xs opacity-80">طابق</p>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3 leading-relaxed">{analysisResult.summary}</p>
            </div>

            {/* Recommendations */}
            {analysisResult.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                <p className="text-sm font-bold text-[#5C3D11] mb-3">توصيات م. سارة</p>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#5C3D11]">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms List */}
            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">الغرف المكتشفة ({analysisResult.rooms.length})</p>
              <div className="space-y-3">
                {analysisResult.rooms.map((room: RoomResult) => (
                  <div key={room.name} className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleRoom(room.name)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedRooms.includes(room.name) ? "border-[#C9A84C] bg-[#C9A84C]" : "border-[#e8d9c0]"}`}
                        >
                          {selectedRooms.includes(room.name) && <CheckCircle className="w-4 h-4 text-white" />}
                        </button>
                        <div>
                          <p className="text-sm font-bold text-[#5C3D11]">{room.name}</p>
                          <p className="text-xs text-[#8B6914]/70">{room.dimensions} — {room.area} م²</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDesignRoom(room)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold active:scale-95 transition-transform"
                      >
                        صمّم
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Design All Button */}
            <button
              onClick={() => {
                const firstRoom = analysisResult.rooms.find((r: RoomResult) => selectedRooms.includes(r.name));
                if (firstRoom) handleDesignRoom(firstRoom);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                صمّم الغرف المحددة ({selectedRooms.length})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
