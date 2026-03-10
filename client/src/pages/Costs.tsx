import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Calculator, Home, Sparkles, Loader2, ChevronDown,
  TrendingUp, Clock, Lightbulb, DollarSign, ArrowRight
} from "lucide-react";

const DESIGN_STYLES = [
  { id: "modern", label: "عصري", icon: "🏙️" },
  { id: "gulf", label: "خليجي", icon: "🕌" },
  { id: "classic", label: "كلاسيكي", icon: "🏛️" },
  { id: "minimal", label: "مينيمال", icon: "◻️" },
];

const SPACE_TYPES = [
  "غرفة معيشة", "غرفة نوم", "مطبخ", "غرفة طعام", "مكتب منزلي",
  "حمام", "ردهة", "غرفة أطفال", "غرفة ضيوف", "فضاء مفتوح"
];

const QUALITY_LEVELS = [
  { id: "budget", label: "اقتصادي", desc: "جودة جيدة بأسعار مناسبة", icon: "💰", color: "border-green-300 bg-green-50" },
  { id: "mid", label: "متوسط", desc: "توازن بين الجودة والسعر", icon: "⚖️", color: "border-amber-300 bg-amber-50" },
  { id: "luxury", label: "فاخر", desc: "أعلى مستويات الجودة", icon: "👑", color: "border-yellow-400 bg-yellow-50" },
];

type CostResult = {
  breakdown?: Array<{ category: string; min: number; max: number; notes: string }>;
  total?: { min: number; max: number };
  pricePerSqm?: { min: number; max: number };
  timeline?: string;
  tips?: string[];
};

function formatCurrency(num: number) {
  return num.toLocaleString("ar-SA") + " ر.س";
}

export default function CostsPage() {
  const [, navigate] = useLocation();
  const [area, setArea] = useState(50);
  const [designStyle, setDesignStyle] = useState("gulf");
  const [spaceType, setSpaceType] = useState("غرفة معيشة");
  const [quality, setQuality] = useState<"budget" | "mid" | "luxury">("mid");
  const [result, setResult] = useState<CostResult | null>(null);

  const calculateMutation = trpc.costs.calculate.useMutation();

  const handleCalculate = async () => {
    try {
      const data = await calculateMutation.mutateAsync({
        area,
        designStyle: designStyle as "modern" | "gulf" | "classic" | "minimal",
        spaceType,
        quality,
      });
      setResult(data);
    } catch {
      toast.error("حدث خطأ أثناء حساب التكاليف، يرجى المحاولة مرة أخرى");
    }
  };

  const maxCategory = result?.breakdown?.reduce((max, item) => item.max > max ? item.max : max, 0) || 1;

  return (
    <div className="min-h-screen bg-background font-['Tajawal',sans-serif]" dir="rtl">
      {/* شريط التنقل */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-amber-800 hover:text-amber-600 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-bold">م. سارة</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/analyze")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">
              تحليل التصميم
            </button>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Calculator className="w-3 h-3 ml-1" />
              حساب التكاليف
            </Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-stone-800 mb-2">حساب تكاليف التصميم</h1>
          <p className="text-stone-500">احصل على تقدير دقيق لتكاليف تصميم فضاءك بالريال السعودي</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* نموذج الإدخال */}
          <div className="space-y-6">
            <div className="elegant-card p-6">
              <h2 className="font-bold text-stone-800 mb-5 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                بيانات الفضاء
              </h2>

              <div className="space-y-5">
                {/* المساحة */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">
                    المساحة: <span className="text-amber-700 font-bold text-base">{area} م²</span>
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
                  <div className="flex gap-2 mt-2">
                    {[20, 40, 60, 100, 150, 200].map((val) => (
                      <button
                        key={val}
                        onClick={() => setArea(val)}
                        className={`text-xs px-2 py-1 rounded-md border transition-all ${
                          area === val ? "bg-amber-500 text-white border-amber-500" : "border-stone-200 text-stone-600 hover:border-amber-300"
                        }`}
                      >
                        {val}م²
                      </button>
                    ))}
                  </div>
                </div>

                {/* نوع الفضاء */}
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

                {/* نمط التصميم */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">نمط التصميم</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DESIGN_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                          designStyle === style.id
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : "border-stone-200 hover:border-amber-300"
                        }`}
                      >
                        <div className="text-xl mb-0.5">{style.icon}</div>
                        <div className="text-xs font-medium text-stone-700">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* مستوى الجودة */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">مستوى الجودة</label>
                  <div className="grid grid-cols-3 gap-3">
                    {QUALITY_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setQuality(level.id as "budget" | "mid" | "luxury")}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          quality === level.id
                            ? `${level.color} border-opacity-100 shadow-md`
                            : "border-stone-200 hover:border-amber-200"
                        }`}
                      >
                        <div className="text-2xl mb-1">{level.icon}</div>
                        <div className="text-sm font-bold text-stone-800">{level.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="w-full gold-gradient text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
            >
              {calculateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  م. سارة تحسب التكاليف...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  احسب التكاليف التقديرية
                </>
              )}
            </Button>
          </div>

          {/* النتائج */}
          <div>
            {!result ? (
              <div className="elegant-card p-8 text-center h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calculator className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">جاهزة لحساب التكاليف</h3>
                <p className="text-stone-500 text-sm">اختر معطيات فضاءك واضغط على زر الحساب للحصول على تقدير دقيق</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* الإجمالي */}
                {result.total && (
                  <div className="elegant-card p-6 gold-gradient text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <h2 className="font-bold">التكلفة الإجمالية التقديرية</h2>
                    </div>
                    <div className="text-3xl font-black">
                      {formatCurrency(result.total.min)} — {formatCurrency(result.total.max)}
                    </div>
                    {result.pricePerSqm && (
                      <p className="text-amber-100 text-sm mt-2">
                        {formatCurrency(result.pricePerSqm.min)} - {formatCurrency(result.pricePerSqm.max)} / م²
                      </p>
                    )}
                    {result.timeline && (
                      <div className="flex items-center gap-2 mt-3 text-amber-100 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>مدة التنفيذ: {result.timeline}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* تفاصيل البنود */}
                {result.breakdown && result.breakdown.length > 0 && (
                  <div className="elegant-card p-5">
                    <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      تفاصيل البنود
                    </h2>
                    <div className="space-y-4">
                      {result.breakdown.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-stone-700">{item.category}</span>
                            <span className="text-sm font-bold text-amber-700">
                              {formatCurrency(item.min)} - {formatCurrency(item.max)}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-2 mb-1">
                            <div
                              className="gold-gradient h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(item.max / maxCategory) * 100}%` }}
                            />
                          </div>
                          {item.notes && (
                            <p className="text-xs text-stone-500">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* نصائح التوفير */}
                {result.tips && result.tips.length > 0 && (
                  <div className="elegant-card p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      نصائح م. سارة للتوفير
                    </h2>
                    <ul className="space-y-2">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* زر التحليل الكامل */}
                <Button
                  onClick={() => navigate("/analyze")}
                  className="w-full gold-gradient text-white py-3 rounded-xl font-bold"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  احصل على تحليل تصميم كامل
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
