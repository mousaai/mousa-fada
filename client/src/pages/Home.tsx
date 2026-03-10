import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Sparkles, Upload, Palette, Calculator, FolderOpen,
  Star, ArrowLeft, CheckCircle2, Layers, Lightbulb, Home,
  MessageCircle, Wand2, Eye
} from "lucide-react";

const DESIGN_STYLES = [
  { id: "modern", label: "عصري", icon: "🏙️", desc: "خطوط نظيفة وتصميم معاصر" },
  { id: "gulf", label: "خليجي", icon: "🕌", desc: "أصالة عربية وفخامة خليجية" },
  { id: "classic", label: "كلاسيكي", icon: "🏛️", desc: "أناقة كلاسيكية خالدة" },
  { id: "minimal", label: "مينيمال", icon: "◻️", desc: "بساطة راقية وهدوء بصري" },
];

const FEATURES = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "تحليل الصور والمخططات",
    desc: "ارفع صورة فضائك أو مخططك المعماري وسأحلله فوراً بالذكاء الاصطناعي",
    color: "from-amber-50 to-yellow-50",
    border: "border-amber-200",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "اقتراح الألوان والمواد",
    desc: "أحصل على لوحة ألوان مخصصة واقتراحات للمواد والأثاث تناسب فضاءك",
    color: "from-orange-50 to-amber-50",
    border: "border-orange-200",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "أنماط التصميم المتعددة",
    desc: "اختر من بين الأنماط العصري والخليجي والكلاسيكي والمينيمال",
    color: "from-yellow-50 to-amber-50",
    border: "border-yellow-200",
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: "حساب التكاليف التقديرية",
    desc: "تقدير دقيق لتكاليف التصميم والأثاث والمواد بالريال السعودي",
    color: "from-amber-50 to-orange-50",
    border: "border-amber-200",
  },
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "حفظ المشاريع",
    desc: "احفظ جميع مشاريعك وتحليلاتك وارجع إليها في أي وقت",
    color: "from-stone-50 to-amber-50",
    border: "border-stone-200",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "توصيات ذكية",
    desc: "توصيات مخصصة تراعي المساحة والميزانية والذوق الشخصي",
    color: "from-yellow-50 to-stone-50",
    border: "border-yellow-200",
  },
];

const TESTIMONIALS = [
  { name: "أ. نورة الشمري", role: "مصممة ديكور", text: "منصة رائعة وفّرت عليّ ساعات من العمل. التحليل دقيق والتوصيات احترافية جداً.", rating: 5 },
  { name: "م. خالد العتيبي", role: "مالك منزل", text: "ساعدتني في تصميم غرفة المعيشة بنمط خليجي أصيل. النتيجة فاقت توقعاتي!", rating: 5 },
  { name: "أ. هند الزهراني", role: "مهندسة معمارية", text: "أداة لا غنى عنها لكل مصمم. تحليل المخططات وتقدير التكاليف ممتاز.", rating: 5 },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate("/analyze");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background font-['Tajawal',sans-serif]" dir="rtl">
      {/* ===== شريط التنقل ===== */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* الشعار */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-md">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-amber-800 leading-none">م. سارة</h1>
                <p className="text-xs text-amber-600">خبيرة التصميم الداخلي</p>
              </div>
            </div>

            {/* روابط التنقل */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate("/")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">الرئيسية</button>
              <button onClick={() => navigate("/analyze")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">تحليل التصميم</button>
              <button onClick={() => navigate("/costs")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">حساب التكاليف</button>
              {isAuthenticated && (
                <>
                  <button onClick={() => navigate("/projects")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">مشاريعي</button>
                  <button onClick={() => navigate("/studio")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">استوديو</button>
                  <button onClick={() => navigate("/ar-scan")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">مسح AR</button>
                  <button onClick={() => navigate("/moodboard")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">لوحة الإلهام</button>
                  <button onClick={() => navigate("/chat")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">م. سارة</button>
                </>
              )}
            </div>

            {/* زر الدخول */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-600 hidden sm:block">مرحباً، {user?.name?.split(" ")[0]}</span>
                  <Button
                    onClick={() => navigate("/projects")}
                    className="gold-gradient text-white text-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    مشاريعي
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="gold-gradient text-white text-sm px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                >
                  تسجيل الدخول
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ===== قسم البطل ===== */}
      <section className="hero-pattern relative overflow-hidden pt-16 pb-24">
        {/* زخارف الخلفية */}
        <div className="absolute inset-0 decorative-dots opacity-30 pointer-events-none" />
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-yellow-200/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* النص الرئيسي */}
            <div className="text-center lg:text-right">
              <Badge className="mb-6 bg-amber-100 text-amber-800 border-amber-200 text-sm px-4 py-1.5 rounded-full font-medium">
                <Sparkles className="w-4 h-4 ml-1.5 inline" />
                مدعوم بالذكاء الاصطناعي
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-800 leading-tight mb-6">
                صمّم فضاءك
                <br />
                <span className="gold-text">بذكاء وأناقة</span>
              </h1>

              <p className="text-lg text-stone-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                م. سارة خبيرتك الشخصية في التصميم الداخلي. ارفع صورة فضاءك وسأقدم لك توصيات احترافية للألوان والمواد والأثاث بأسلوب يناسب ذوقك وميزانيتك.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start flex-wrap">
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="gold-gradient text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                >
                  <Upload className="w-5 h-5 ml-2" />
                  ابدأ التحليل مجاناً
                </Button>
                <Button
                  onClick={() => isAuthenticated ? navigate("/studio") : (window.location.href = getLoginUrl())}
                  size="lg"
                  className="bg-stone-800 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all font-bold hover:bg-stone-700"
                >
                  <Wand2 className="w-5 h-5 ml-2" />
                  استوديو التصميم
                </Button>
                <Button
                  onClick={() => isAuthenticated ? navigate("/chat") : (window.location.href = getLoginUrl())}
                  variant="outline"
                  size="lg"
                  className="border-amber-300 text-amber-800 hover:bg-amber-50 px-8 py-4 text-lg rounded-xl font-medium"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  تحدث مع م. سارة
                </Button>
              </div>

              {/* إحصائيات */}
              <div className="flex gap-8 mt-10 justify-center lg:justify-start">
                {[
                  { num: "+500", label: "مشروع مكتمل" },
                  { num: "+20", label: "نمط تصميم عالمي" },
                  { num: "98%", label: "رضا العملاء" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-black gold-text">{stat.num}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* بطاقة العرض المرئي */}
            <div className="relative">
              <div className="elegant-card p-6 gold-shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">م. سارة</p>
                    <p className="text-xs text-stone-500">جاهزة للتحليل</p>
                  </div>
                  <div className="mr-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-600">متاحة الآن</span>
                  </div>
                </div>

                {/* معاينة التحليل */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 mb-4 border border-amber-100">
                  <p className="text-sm text-stone-600 mb-3">نتائج تحليل غرفة المعيشة:</p>
                  <div className="space-y-2">
                    {[
                      { label: "النمط المقترح", value: "خليجي عصري" },
                      { label: "الألوان الأساسية", value: "ذهبي، بيج، أبيض" },
                      { label: "التكلفة التقديرية", value: "٢٥,٠٠٠ - ٤٥,٠٠٠ ر.س" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">{item.label}</span>
                        <span className="font-semibold text-amber-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* لوحة الألوان */}
                <div>
                  <p className="text-xs text-stone-500 mb-2">لوحة الألوان المقترحة:</p>
                  <div className="flex gap-2">
                    {["#C9A84C", "#E8D5A3", "#F5F0E8", "#8B6914", "#D4B483", "#2C1810"].map((color) => (
                      <div
                        key={color}
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* بطاقات عائمة */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-amber-100 hidden lg:block">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-stone-700">تحليل فوري</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-amber-100 hidden lg:block">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium text-stone-700">جودة احترافية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== أنماط التصميم ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200">أنماط التصميم</Badge>
            <h2 className="text-3xl font-black text-stone-800 mb-3">اختر نمطك المفضل</h2>
            <p className="text-stone-500 max-w-lg mx-auto">أربعة أنماط تصميم متميزة تناسب جميع الأذواق والفضاءات</p>
          </div>

          {/* أزرار الوصول السريع */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Button onClick={() => isAuthenticated ? navigate("/studio") : (window.location.href = getLoginUrl())} className="gold-gradient text-white rounded-xl">
              <Wand2 className="w-4 h-4 ml-2" />
              استوديو التصميم المعماري
            </Button>
            <Button onClick={() => isAuthenticated ? navigate("/chat") : (window.location.href = getLoginUrl())} variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50 rounded-xl">
              <MessageCircle className="w-4 h-4 ml-2" />
              محادثة م. سارة
            </Button>
            <Button onClick={() => navigate("/analyze")} variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl">
              <Eye className="w-4 h-4 ml-2" />
              تحليل الصور
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {DESIGN_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={handleStart}
                className="elegant-card p-6 text-center group cursor-pointer"
              >
                <div className="text-4xl mb-3">{style.icon}</div>
                <h3 className="font-bold text-stone-800 mb-1 group-hover:text-amber-700 transition-colors">{style.label}</h3>
                <p className="text-xs text-stone-500">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== الميزات ===== */}
      <section className="py-16 hero-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200">الميزات</Badge>
            <h2 className="text-3xl font-black text-stone-800 mb-3">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-stone-500 max-w-lg mx-auto">منصة متكاملة لتصميم فضاءاتك بكفاءة واحترافية</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`elegant-card p-6 bg-gradient-to-br ${feature.color} border ${feature.border}`}
              >
                <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center text-white mb-4 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-stone-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== آراء العملاء ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200">آراء العملاء</Badge>
            <h2 className="text-3xl font-black text-stone-800 mb-3">ماذا يقول عملاؤنا</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="elegant-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{t.name}</p>
                    <p className="text-xs text-stone-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== دعوة للعمل ===== */}
      <section className="py-16 gold-gradient relative overflow-hidden">
        <div className="absolute inset-0 decorative-dots opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            ابدأ رحلة التصميم اليوم
          </h2>
          <p className="text-amber-100 text-lg mb-8 max-w-xl mx-auto">
            انضم إلى مئات المصممين وملاك المنازل الذين يثقون بم. سارة لتصميم فضاءاتهم
          </p>
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-white text-amber-800 hover:bg-amber-50 px-10 py-4 text-lg rounded-xl shadow-xl font-bold transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            ابدأ الآن مجاناً
          </Button>
        </div>
      </section>

      {/* ===== التذييل ===== */}
      <footer className="bg-stone-900 text-stone-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">م. سارة</span>
              <span className="text-stone-500 text-sm">خبيرة التصميم الداخلي بالذكاء الاصطناعي</span>
            </div>
            <p className="text-sm text-stone-500">
              © ٢٠٢٦ م. سارة. جميع الحقوق محفوظة. | مدعوم بمنصة بنيان AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
