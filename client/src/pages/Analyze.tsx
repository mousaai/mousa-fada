import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthGate";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Upload, Sparkles, Palette, Layers, ArrowRight, Home,
  CheckCircle2, Loader2, ImageIcon, X, ChevronDown, Info,
  DollarSign, Clock, Wrench, Sofa, Lightbulb, Star
} from "lucide-react";
import { Streamdown } from "streamdown";
import { useLanguage } from "@/contexts/LanguageContext";

const DESIGN_STYLES = [
  { id: "modern", label: "عصري", icon: "🏙️", desc: "خطوط نظيفة وتصميم معاصر" },
  { id: "gulf", label: "خليجي", icon: "🕌", desc: "أصالة عربية وفخامة خليجية" },
  { id: "classic", label: "كلاسيكي", icon: "🏛️", desc: "أناقة كلاسيكية خالدة" },
  { id: "minimal", label: "مينيمال", icon: "◻️", desc: "بساطة راقية وهدوء بصري" },
];

const SPACE_TYPES = [
  "غرفة معيشة", "غرفة نوم", "مطبخ", "غرفة طعام", "مكتب منزلي",
  "حمام", "ردهة", "غرفة أطفال", "غرفة ضيوف", "فضاء مفتوح"
];

type AnalysisResult = {
  overview?: string;
  styleDescription?: string;
  colorPalette?: Array<{ name: string; hex: string; usage: string; percentage?: number }>;
  materials?: Array<{ name: string; type: string; description: string; priceRange: string }>;
  furniture?: Array<{ name: string; description: string; quantity: number; priceMin: number; priceMax: number; priority: string }>;
  lighting?: string;
  flooring?: string;
  walls?: string;
  ceiling?: string;
  recommendations?: string[];
  costEstimate?: {
    furniture?: { min: number; max: number };
    materials?: { min: number; max: number };
    labor?: { min: number; max: number };
    total?: { min: number; max: number };
  };
  timelineWeeks?: number;
};

function formatCurrency(num: number) {
  return num.toLocaleString("ar-SA") + " ر.س";
}

export default function AnalyzePage() {
  useAuth();
  const isAuthenticated = true;
  const [, navigate] = useLocation();
  const { t, dir } = useLanguage();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [designStyle, setDesignStyle] = useState("gulf");
  const [spaceType, setSpaceType] = useState("غرفة معيشة");
  const [area, setArea] = useState(30);
  const [projectName, setProjectName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.image.useMutation();
  const createProjectMutation = trpc.projects.create.useMutation();
  const analyzeMutation = trpc.analyses.analyze.useMutation();

  const isLoading = uploadMutation.isPending || createProjectMutation.isPending || analyzeMutation.isPending;

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى رفع ملف صورة صالح");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!imageFile || !imagePreview) {
      toast.error("يرجى رفع صورة أولاً");
      return;
    }

    try {
      // رفع الصورة
      const base64 = imagePreview.split(",")[1];
      const { url: imageUrl, key: imageKey } = await uploadMutation.mutateAsync({
        base64,
        mimeType: imageFile.type,
        fileName: imageFile.name,
      });

      // إنشاء المشروع
      const name = projectName || `مشروع ${spaceType} - ${new Date().toLocaleDateString("ar-SA")}`;
      const project = await createProjectMutation.mutateAsync({
        name,
        designStyle: designStyle as "modern" | "gulf" | "classic" | "minimal",
        spaceType,
        area,
      });

      if (!project) throw new Error("فشل إنشاء المشروع");
      setCurrentProjectId(project.id);

      // تحليل الصورة
      const analysis = await analyzeMutation.mutateAsync({
        projectId: project.id,
        imageUrl,
        imageKey,
        designStyle: designStyle as "modern" | "gulf" | "classic" | "minimal",
        spaceType,
        area,
      });

      if (analysis?.analysisResult) {
        setAnalysisResult(analysis.analysisResult as AnalysisResult);
        toast.success("تم التحليل بنجاح! تم تحليل صورتك وحفظ النتائج");
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء التحليل، يرجى المحاولة مرة أخرى");
    }
  };

  return (
    <div className="min-h-screen bg-background font-['Tajawal',sans-serif]" dir={dir}>
      {/* شريط التنقل */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-amber-800 hover:text-amber-600 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-bold">م. سارة</span>
          </button>
          <div className="flex items-center gap-3">
            {currentProjectId && (
              <Button variant="outline" size="sm" onClick={() => navigate("/projects")} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <ArrowRight className="w-4 h-4 ml-1" />
                مشاريعي
              </Button>
            )}
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Sparkles className="w-3 h-3 ml-1" />
              تحليل ذكي
            </Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!analysisResult ? (
          /* ===== نموذج التحليل ===== */
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-stone-800 mb-2">تحليل التصميم الداخلي</h1>
              <p className="text-stone-500">ارفع صورة فضاءك وسأقدم لك توصيات تصميم احترافية</p>
            </div>

            <div className="space-y-6">
              {/* رفع الصورة */}
              <div className="elegant-card p-6">
                <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  رفع الصورة أو المخطط
                </h2>

                {!imagePreview ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDragging ? "border-amber-500 bg-amber-50" : "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-stone-700 font-semibold mb-1">اسحب الصورة هنا أو انقر للاختيار</p>
                    <p className="text-stone-400 text-sm">PNG, JPG, JPEG — حتى 10 ميجابايت</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="الصورة المرفوعة" className="w-full max-h-64 object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-3 left-3 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-3 py-1.5 shadow-md">
                      <p className="text-xs font-medium text-stone-700">{imageFile?.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* إعدادات التحليل */}
              <div className="elegant-card p-6">
                <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  إعدادات التصميم
                </h2>

                <div className="space-y-5">
                  {/* اسم المشروع */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-2">اسم المشروع (اختياري)</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="مثال: غرفة معيشة منزل الرياض"
                      className="w-full border border-amber-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                    />
                  </div>

                  {/* نمط التصميم */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-2">نمط التصميم</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DESIGN_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setDesignStyle(style.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            designStyle === style.id
                              ? "border-amber-500 bg-amber-50 shadow-md"
                              : "border-stone-200 hover:border-amber-300 hover:bg-amber-50/50"
                          }`}
                        >
                          <div className="text-2xl mb-1">{style.icon}</div>
                          <div className="text-sm font-semibold text-stone-800">{style.label}</div>
                          <div className="text-xs text-stone-500 mt-0.5">{style.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* نوع الفضاء والمساحة */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700 block mb-2">نوع الفضاء</label>
                      <div className="relative">
                        <select
                          value={spaceType}
                          onChange={(e) => setSpaceType(e.target.value)}
                          className="w-full border border-amber-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white appearance-none"
                        >
                          {SPACE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-stone-700 block mb-2">
                        المساحة التقريبية: <span className="text-amber-700 font-bold">{area} م²</span>
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={500}
                        step={5}
                        value={area}
                        onChange={(e) => setArea(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-stone-400 mt-1">
                        <span>١٠ م²</span>
                        <span>٥٠٠ م²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* زر التحليل */}
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !imageFile}
                className="w-full gold-gradient text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all font-bold disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    {uploadMutation.isPending ? "جاري رفع الصورة..." : createProjectMutation.isPending ? "جاري إنشاء المشروع..." : "م. سارة تحلل الفضاء..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    ابدأ التحليل بالذكاء الاصطناعي
                  </>
                )}
              </Button>

              
            </div>
          </div>
        ) : (
          /* ===== نتائج التحليل ===== */
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-stone-800">نتائج التحليل</h1>
                <p className="text-stone-500 text-sm mt-1">تحليل م. سارة لفضائك</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setAnalysisResult(null); setImagePreview(null); setImageFile(null); }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  تحليل جديد
                </Button>
                {currentProjectId && (
                  <Button
                    onClick={() => navigate("/projects")}
                    className="gold-gradient text-white"
                  >
                    <ArrowRight className="w-4 h-4 ml-1" />
                    مشاريعي
                  </Button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* العمود الرئيسي */}
              <div className="lg:col-span-2 space-y-6">
                {/* نظرة عامة */}
                {analysisResult.overview && (
                  <div className="elegant-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800">تقييم م. سارة</h2>
                    </div>
                    <div className="text-stone-700 leading-relaxed text-sm">
                      <Streamdown>{analysisResult.overview}</Streamdown>
                    </div>
                  </div>
                )}

                {/* وصف النمط */}
                {analysisResult.styleDescription && (
                  <div className="elegant-card p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800">تطبيق النمط المختار</h2>
                    </div>
                    <div className="text-stone-700 leading-relaxed text-sm">
                      <Streamdown>{analysisResult.styleDescription}</Streamdown>
                    </div>
                  </div>
                )}

                {/* الأثاث المقترح */}
                {analysisResult.furniture && analysisResult.furniture.length > 0 && (
                  <div className="elegant-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                        <Sofa className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800">الأثاث المقترح</h2>
                    </div>
                    <div className="space-y-3">
                      {analysisResult.furniture.map((item, i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-stone-800 text-sm">{item.name}</span>
                              <Badge className={`text-xs px-2 py-0 ${item.priority === "أساسي" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-stone-100 text-stone-600 border-stone-200"}`}>
                                {item.priority}
                              </Badge>
                              {item.quantity > 1 && (
                                <Badge className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                  × {item.quantity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-500">{item.description}</p>
                          </div>
                          <div className="text-left mr-3 flex-shrink-0">
                            <p className="text-xs font-semibold text-amber-700">
                              {formatCurrency(item.priceMin)} - {formatCurrency(item.priceMax)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* المواد */}
                {analysisResult.materials && analysisResult.materials.length > 0 && (
                  <div className="elegant-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800">المواد والتشطيبات</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {analysisResult.materials.map((mat, i) => (
                        <div key={i} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-stone-800 text-sm">{mat.name}</span>
                            <Badge className={`text-xs px-2 py-0 ${
                              mat.priceRange === "فاخر" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              mat.priceRange === "متوسط" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-green-50 text-green-700 border-green-200"
                            }`}>
                              {mat.priceRange}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-500">{mat.type}</p>
                          <p className="text-xs text-stone-600 mt-1">{mat.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* توصيات إضافية */}
                {(analysisResult.lighting || analysisResult.flooring || analysisResult.walls) && (
                  <div className="elegant-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800">توصيات التشطيب</h2>
                    </div>
                    <div className="space-y-4">
                      {analysisResult.lighting && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800 mb-1">الإضاءة</h3>
                          <p className="text-sm text-stone-600">{analysisResult.lighting}</p>
                        </div>
                      )}
                      {analysisResult.flooring && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800 mb-1">الأرضيات</h3>
                          <p className="text-sm text-stone-600">{analysisResult.flooring}</p>
                        </div>
                      )}
                      {analysisResult.walls && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800 mb-1">الجدران</h3>
                          <p className="text-sm text-stone-600">{analysisResult.walls}</p>
                        </div>
                      )}
                      {analysisResult.ceiling && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800 mb-1">الأسقف</h3>
                          <p className="text-sm text-stone-600">{analysisResult.ceiling}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* الشريط الجانبي */}
              <div className="space-y-6">
                {/* الصورة المرفوعة */}
                {imagePreview && (
                  <div className="elegant-card overflow-hidden">
                    <img src={imagePreview} alt="الفضاء المحلل" className="w-full h-48 object-cover" />
                    <div className="p-3">
                      <p className="text-xs text-stone-500 text-center">الصورة المحللة</p>
                    </div>
                  </div>
                )}

                {/* لوحة الألوان */}
                {analysisResult.colorPalette && analysisResult.colorPalette.length > 0 && (
                  <div className="elegant-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                        <Palette className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800 text-sm">لوحة الألوان</h2>
                    </div>
                    <div className="space-y-3">
                      {analysisResult.colorPalette.map((color, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg shadow-sm border-2 border-white flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate">{color.name}</p>
                            <p className="text-xs text-stone-500 truncate">{color.usage}</p>
                          </div>
                          <span className="text-xs font-mono text-stone-400 flex-shrink-0">{color.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* تقدير التكاليف */}
                {analysisResult.costEstimate && (
                  <div className="elegant-card p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                        <DollarSign className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h2 className="font-bold text-stone-800 text-sm">تقدير التكاليف</h2>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.costEstimate.furniture && (
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-600">الأثاث</span>
                          <span className="font-semibold text-stone-800">
                            {formatCurrency(analysisResult.costEstimate.furniture.min)} - {formatCurrency(analysisResult.costEstimate.furniture.max)}
                          </span>
                        </div>
                      )}
                      {analysisResult.costEstimate.materials && (
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-600">المواد</span>
                          <span className="font-semibold text-stone-800">
                            {formatCurrency(analysisResult.costEstimate.materials.min)} - {formatCurrency(analysisResult.costEstimate.materials.max)}
                          </span>
                        </div>
                      )}
                      {analysisResult.costEstimate.labor && (
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-600">العمالة</span>
                          <span className="font-semibold text-stone-800">
                            {formatCurrency(analysisResult.costEstimate.labor.min)} - {formatCurrency(analysisResult.costEstimate.labor.max)}
                          </span>
                        </div>
                      )}
                      {analysisResult.costEstimate.total && (
                        <div className="flex justify-between text-sm pt-2 border-t border-amber-200 mt-2">
                          <span className="font-bold text-stone-800">الإجمالي</span>
                          <span className="font-black text-amber-700">
                            {formatCurrency(analysisResult.costEstimate.total.min)} - {formatCurrency(analysisResult.costEstimate.total.max)}
                          </span>
                        </div>
                      )}
                    </div>
                    {analysisResult.timelineWeeks && (
                      <div className="mt-3 pt-3 border-t border-amber-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-stone-600">
                          مدة التنفيذ المتوقعة: <strong className="text-amber-700">{analysisResult.timelineWeeks} أسبوع</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* التوصيات */}
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="elegant-card p-5">
                    <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      توصيات م. سارة
                    </h2>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
