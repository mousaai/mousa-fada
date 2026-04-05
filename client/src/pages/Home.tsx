import { useAuth } from "@/components/AuthGate";
import { useLocation } from "wouter";
import { Camera, Sparkles, FolderOpen, Mic, MessageCircle, ChevronLeft, ShoppingBag, Map, FileText } from "lucide-react";
import { CreditBadge } from "@/components/CreditBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ===== Quick Analysis Card =====
function QuickAnalysisCard({ onClose }: { onClose: () => void }) {
  const { t, dir } = useLanguage();
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
        overview: data.overview || t("smart.results"),
        palette: data.palette?.slice(0, 4) || [],
        topSuggestions: data.topSuggestions?.slice(0, 3) || [],
        estimatedCost: data.estimatedCost || "",
      });
      setAnalyzing(false);
    },
    onError: () => {
      toast.error(t("smart.error"));
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#faf6f0]" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0]">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#8B6914]" />
        </button>
        <span className="font-bold text-[#8B6914] text-lg">{t("home.sections.analyze")}</span>
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
            <p className="text-xl font-bold text-[#5C3D11]">{t("smart.upload")}</p>
            <p className="text-sm text-[#8B6914]/70 text-center">{t("smart.uploadDesc")}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        ) : analyzing ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] animate-spin" style={{ borderTopColor: "transparent" }} />
            <p className="text-[#8B6914] font-medium">{t("smart.analyzing")}</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Preview */}
            <div className="rounded-2xl overflow-hidden aspect-video">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            </div>
            {/* Overview */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <p className="text-sm text-[#5C3D11] leading-relaxed">{result.overview}</p>
            </div>
            {/* Palette */}
            {result.palette.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                <p className="text-xs font-bold text-[#8B6914] mb-3">{t("smart.colors")}</p>
                <div className="flex gap-2">
                  {result.palette.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl shadow-sm" style={{ background: c.hex }} />
                      <span className="text-[9px] text-[#8B6914]/70">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Suggestions */}
            {result.topSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] space-y-2">
                <p className="text-xs font-bold text-[#8B6914] mb-2">{t("smart.advantages")}</p>
                {result.topSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#C9A84C] mt-0.5">✦</span>
                    <p className="text-sm text-[#5C3D11]">{s}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Cost */}
            {result.estimatedCost && (
              <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#8B6914]/10 rounded-2xl p-4 border border-[#C9A84C]/20">
                <p className="text-xs text-[#8B6914]/70">{t("smart.cost")}</p>
                <p className="text-lg font-black text-[#5C3D11]">{result.estimatedCost}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <button
                onClick={() => { setPreview(null); setResult(null); }}
                className="py-3 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] font-bold text-sm active:scale-95 transition-transform"
              >
                {t("smart.regenerate")}
              </button>
              <button
                onClick={onClose}
                className="py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-sm active:scale-95 transition-transform"
              >
                {t("common.done")}
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
  const { user, refreshBalance } = useAuth();
  const loading = false;
  const isAuthenticated = true;
  const [, navigate] = useLocation();
  const { t, dir, isRtl } = useLanguage();
  const [showQuickAnalysis, setShowQuickAnalysis] = useState(false);

  // ✅ وضع مجاني — لا إشعارات رصيد منخفض

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f0]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Quick Analysis Overlay */}
      {showQuickAnalysis && <QuickAnalysisCard onClose={() => setShowQuickAnalysis(false)} />}

      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0] || "م"}
              </div>
              <div>
                <p className="text-xs text-[#8B6914]/70">{t("home.welcome")}</p>
                <p className="text-sm font-bold text-[#5C3D11]">{user?.name?.split(" ")[0] || "زائر"}</p>
              </div>
              <CreditBadge />
            </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-[#5C3D11]">{t("app.name")}</p>
          <p className="text-xs text-[#8B6914]/70">{t("app.tagline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => navigate("/sarah-chat")}
            className="w-10 h-10 rounded-full bg-white border border-[#e8d9c0] flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <MessageCircle className="w-5 h-5 text-[#8B6914]" />
          </button>
        </div>
      </header>

      {/* Hero — Big Camera Button */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
        {/* Main CTA */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#5C3D11] leading-tight whitespace-pre-line">
            {t("home.hero.title")}
          </h1>
          <p className="text-sm text-[#8B6914]/70">{t("home.hero.subtitle")}</p>
        </div>

        {/* BIG Camera Button */}
        <button
          onClick={() => navigate("/smart-capture")}
          className="relative w-40 h-40 rounded-full bg-gradient-to-br from-[#C9A84C] via-[#A07820] to-[#8B6914] shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          style={{ boxShadow: "0 8px 40px rgba(201,168,76,0.5)" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C]/30 animate-ping" />
          <Camera className="w-14 h-14 text-white" />
          <span className="text-white font-bold text-sm">{t("home.hero.cta")}</span>
        </button>

        {/* Quick Action Buttons — 2x2 grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* Draw by Voice */}
          <button
            onClick={() => navigate("/voice-designer")}
            className="flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-[#e8d9c0] active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5C3D11]/15 to-[#C9A84C]/15 flex items-center justify-center">
              <Mic className="w-7 h-7 text-[#8B6914]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#5C3D11]">{t("home.sections.studio")}</p>
              <p className="text-[10px] text-[#8B6914]/60 mt-0.5">{t("home.sections.studio.desc")}</p>
            </div>
          </button>

          {/* Furniture Store */}
          <button
            onClick={() => navigate("/furniture")}
            className="relative flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-amber-200 active:scale-95 transition-transform"
          >
            <span className="absolute top-2 left-2 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">{t("common.beta")}</span>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-amber-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-amber-800">{t("home.sections.store")}</p>
              <p className="text-[10px] text-amber-700/60 mt-0.5">{t("home.sections.store.desc")}</p>
            </div>
          </button>

          {/* Design from Plan — v40 */}
          <button
            onClick={() => navigate("/plan-design")}
            className="flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-blue-100 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-blue-800">صمّم من المخطط</p>
              <p className="text-[10px] text-blue-700/60 mt-0.5">ارفع مخططك واحصل على تصميم</p>
            </div>
          </button>

          {/* Urban Design */}
          <button
            onClick={() => navigate("/urban-design")}
            className="flex flex-col items-center gap-3 bg-white rounded-3xl p-5 shadow-sm border border-green-100 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <Map className="w-7 h-7 text-green-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-green-800">التصميم الحضري</p>
              <p className="text-[10px] text-green-700/60 mt-0.5">أحياء، شوارع، مناطق عامة</p>
            </div>
          </button>
        </div>

        {/* Recent Projects Preview (if authenticated) */}
        <RecentProjectsStrip />
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[#e8d9c0] pb-safe">
        <div className="grid grid-cols-4 py-2">
          {[
            { icon: Camera, label: t("nav.analyze"), action: () => setShowQuickAnalysis(true) },
            { icon: Sparkles, label: t("nav.studio"), action: () => navigate("/design-studio") },
            { icon: MessageCircle, label: t("nav.sarah"), action: () => navigate("/sarah-chat") },
            { icon: FolderOpen, label: t("nav.projects"), action: () => navigate("/projects") },
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
  const { t, isRtl } = useLanguage();

  if (!projects?.length) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[#5C3D11]">{t("home.recentProjects")}</span>
        <button onClick={() => navigate("/projects")} className="text-xs text-[#C9A84C] font-medium">{t("home.viewAll")}</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {projects.slice(0, 4).map((p: { id: number; name: string; designStyle?: string; status?: string }) => (
          <button
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className={`flex-shrink-0 w-28 bg-white rounded-2xl p-3 shadow-sm border border-[#e8d9c0] active:scale-95 transition-transform ${isRtl ? "text-right" : "text-left"}`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#8B6914] mb-2 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold text-[#5C3D11] truncate">{p.name}</p>
            <p className="text-[10px] text-[#8B6914]/70 mt-0.5">{p.designStyle || t("smart.style")}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
