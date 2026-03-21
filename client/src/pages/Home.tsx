import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Camera, Sparkles, FolderOpen, Mic, MessageCircle, ChevronLeft, ShoppingBag } from "lucide-react";
import { CreditBadge } from "@/components/CreditBadge";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ===== Quick Analysis Card =====
function QuickAnalysisCard({ onClose }: { onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    overview: string;
    palette: { name: string; hex: string }[];
    topSuggestions: string[];
    estimatedCost: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.quickAnalyze.useMutation({
    onSuccess: (data: { overview?: string; palette?: { name: string; hex: string }[]; topSuggestions?: string[]; estimatedCost?: string }) => {
      setResult({
        overview: data.overview || "تحليل مكتمل",
        palette: data.palette?.slice(0, 4) || [],
        topSuggestions: data.topSuggestions?.slice(0, 3) || [],
        estimatedCost: data.estimatedCost || "",
      });
      setAnalyzing(false);
    },
    onError: () => {
      toast.error("حدث خطأ في التحليل، حاول مجدداً");
      setAnalyzing(false);
    },
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setAnalyzing(true);
      analyzeMutation.mutate({
        imageUrl: dataUrl,
        designStyle: "modern",
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#faf6f0]" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0]">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#8B6914]" />
        </button>
        <span className="font-bold text-[#8B6914] text-lg">تحليل سريع</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {!preview ? (
          /* Upload Zone */
          <div
            onClick={() => fileRef.current?.click()}
            className="relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#C9A84C]/50 bg-white p-10 cursor-pointer active:scale-95 transition-transform"
            style={{ minHeight: 260 }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center shadow-lg">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl font-bold text-[#5C3D11]">اضغط لرفع صورة</p>
            <p className="text-sm text-[#8B6914]/70 text-center">صورة الغرفة أو المخطط</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : analyzing ? (
          /* Analyzing State */
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C]/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-[#C9A84C]/40 animate-ping" style={{ animationDelay: "0.3s" }} />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#5C3D11]">م. سارة تحلل الفضاء...</p>
              <p className="text-sm text-[#8B6914]/70 mt-1">ثوانٍ قليلة</p>
            </div>
            <img src={preview} className="w-full rounded-2xl object-cover max-h-48" alt="preview" />
          </div>
        ) : result ? (
          /* Results */
          <div className="space-y-4">
            <img src={preview} className="w-full rounded-2xl object-cover max-h-48" alt="preview" />

            {/* Overview */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8d9c0]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                <span className="font-bold text-[#5C3D11]">تقييم م. سارة</span>
              </div>
              <p className="text-sm text-[#6B4C1E] leading-relaxed">{result.overview}</p>
            </div>

            {/* Color Palette */}
            {result.palette.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8d9c0]">
                <p className="font-bold text-[#5C3D11] mb-3">لوحة الألوان المقترحة</p>
                <div className="flex gap-3">
                  {result.palette.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-xl shadow-sm border border-white/50" style={{ backgroundColor: c.hex || "#C9A84C" }} />
                      <span className="text-xs text-[#8B6914]">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 3 Suggestions */}
            {result.topSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8d9c0]">
                <p className="font-bold text-[#5C3D11] mb-3">أبرز التوصيات</p>
                <div className="space-y-2">
                  {result.topSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#C9A84C]/20 text-[#8B6914] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-[#6B4C1E]">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost */}
            {result.estimatedCost && (
              <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-4 text-white">
                <p className="text-sm opacity-80">التكلفة التقديرية</p>
                <p className="text-xl font-bold">{result.estimatedCost}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <button
                onClick={() => { setPreview(null); setResult(null); }}
                className="py-3 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] font-bold text-sm active:scale-95 transition-transform"
              >
                تحليل آخر
              </button>
              <button
                onClick={onClose}
                className="py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-sm active:scale-95 transition-transform"
              >
                حفظ وتصميم
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ===== Main Home =====
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showQuickAnalysis, setShowQuickAnalysis] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f0]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Quick Analysis Overlay */}
      {showQuickAnalysis && <QuickAnalysisCard onClose={() => setShowQuickAnalysis(false)} />}

      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-3">
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0] || "م"}
              </div>
              <div>
                <p className="text-xs text-[#8B6914]/70">مرحباً</p>
                <p className="text-sm font-bold text-[#5C3D11]">{user?.name?.split(" ")[0] || "مستخدم"}</p>
              </div>
              <CreditBadge />
            </div>
          ) : (
            <button
              onClick={() => window.location.href = getLoginUrl()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold active:scale-95 transition-transform"
            >
              دخول
            </button>
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-[#5C3D11]">م. سارة</p>
          <p className="text-xs text-[#8B6914]/70">خبيرة التصميم المعماري</p>
        </div>
        <button
          onClick={() => navigate("/sarah-chat")}
          className="w-10 h-10 rounded-full bg-white border border-[#e8d9c0] flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <MessageCircle className="w-5 h-5 text-[#8B6914]" />
        </button>
      </header>

      {/* Hero — Big Camera Button */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
        {/* Main CTA */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#5C3D11] leading-tight">
            صمّم أي فضاء<br />
            <span className="text-[#C9A84C]">بلمسة واحدة</span>
          </h1>
          <p className="text-sm text-[#8B6914]/70">داخلي • واجهات المباني • لاندسكيپ • مسابح</p>
        </div>

        {/* BIG Camera Button */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              window.location.href = getLoginUrl();
              return;
            }
            navigate("/smart-capture");
          }}
          className="relative w-40 h-40 rounded-full bg-gradient-to-br from-[#C9A84C] via-[#A07820] to-[#8B6914] shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          style={{ boxShadow: "0 8px 40px rgba(201,168,76,0.5)" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C]/30 animate-ping" />
          <Camera className="w-14 h-14 text-white" />
          <span className="text-white font-bold text-sm">تحليل الآن</span>
        </button>

        {/* 2 Unique Quick Action Buttons — not duplicated in bottom nav */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* ارسم بصوتك — وظيفة فريدة غير موجودة في الشريط السفلي */}
          <button
            onClick={() => navigate("/voice-designer")}
            className="flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-[#e8d9c0] active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5C3D11]/15 to-[#C9A84C]/15 flex items-center justify-center">
              <Mic className="w-7 h-7 text-[#8B6914]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#5C3D11]">ارسم بصوتك</p>
              <p className="text-[10px] text-[#8B6914]/60 mt-0.5">صف فضاءك وسارة تصمّمه</p>
            </div>
          </button>

          {/* متجر الأثاث — وظيفة فريدة غير موجودة في الشريط السفلي */}
          <button
            onClick={() => navigate("/furniture")}
            className="relative flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-amber-200 active:scale-95 transition-transform"
          >
            {/* Beta badge */}
            <span className="absolute top-2 left-2 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">تجريبي</span>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-amber-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-amber-800">متجر الأثاث</p>
              <p className="text-[10px] text-amber-700/60 mt-0.5">أثاث حقيقي من متاجر محلية</p>
            </div>
          </button>
        </div>

        {/* Recent Projects Preview (if authenticated) */}
        {isAuthenticated && <RecentProjectsStrip />}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[#e8d9c0] pb-safe">
        <div className="grid grid-cols-4 py-2">
          {[
            { icon: Camera, label: "تحليل", action: () => setShowQuickAnalysis(true) },
            { icon: Sparkles, label: "استوديو", action: () => navigate("/design-studio") },
            { icon: MessageCircle, label: "م. سارة", action: () => navigate("/sarah-chat") },
            { icon: FolderOpen, label: "مشاريعي", action: () => navigate(isAuthenticated ? "/projects" : "/") },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1 py-2 active:scale-90 transition-transform"
            >
              <Icon className="w-5 h-5 text-[#8B6914]" />
              <span className="text-[10px] text-[#8B6914] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ===== Recent Projects Strip =====
function RecentProjectsStrip() {
  const { data: projects } = trpc.projects.list.useQuery();
  const [, navigate] = useLocation();

  if (!projects?.length) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[#5C3D11]">آخر المشاريع</span>
        <button onClick={() => navigate("/projects")} className="text-xs text-[#C9A84C] font-medium">عرض الكل</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {projects.slice(0, 4).map((p: { id: number; name: string; designStyle?: string; status?: string }) => (
          <button
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className="flex-shrink-0 w-28 bg-white rounded-2xl p-3 shadow-sm border border-[#e8d9c0] text-right active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#8B6914] mb-2 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold text-[#5C3D11] truncate">{p.name}</p>
            <p className="text-[10px] text-[#8B6914]/70 mt-0.5">{p.designStyle || "تصميم"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
