import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home, Layers, Square, Lightbulb, DoorOpen, Sofa, Eye,
  Sparkles, CheckCircle, ChevronRight, ArrowRight, Trash2,
  Palette, Ruler, Building2, Star, Lock, ChevronDown, ChevronUp,
  Info, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

// ===== أنماط التصميم =====
const DESIGN_STYLES = [
  { key: "modern", label: "عصري حديث", emoji: "🏙️", colors: ["#F5F5F0", "#2C2C2C", "#C9A84C"], mood: "نظيف وعصري" },
  { key: "gulf", label: "خليجي أصيل", emoji: "🕌", colors: ["#F8F0E3", "#8B6914", "#C9A84C"], mood: "فاخر وأصيل" },
  { key: "classic", label: "كلاسيكي فاخر", emoji: "🏛️", colors: ["#F5EFE6", "#5C4033", "#D4AF37"], mood: "راقٍ وكلاسيكي" },
  { key: "minimal", label: "مينيمال", emoji: "⬜", colors: ["#FFFFFF", "#E0E0E0", "#333333"], mood: "بسيط وهادئ" },
  { key: "japanese", label: "ياباني زن", emoji: "🌸", colors: ["#F5F0E8", "#8B7355", "#4A7C59"], mood: "هادئ وطبيعي" },
  { key: "scandinavian", label: "سكندنافي", emoji: "🌿", colors: ["#FAFAFA", "#D4C5B0", "#5C7A6B"], mood: "دافئ وبسيط" },
  { key: "mediterranean", label: "متوسطي", emoji: "🌊", colors: ["#F0F4F8", "#2B6CB0", "#E8A838"], mood: "مشرق وحيوي" },
  { key: "industrial", label: "صناعي", emoji: "🔩", colors: ["#3A3A3A", "#8B7355", "#C0C0C0"], mood: "خشن وعصري" },
  { key: "moroccan", label: "مغربي", emoji: "🏮", colors: ["#F5E6D3", "#8B1A1A", "#DAA520"], mood: "ملون وزاهي" },
  { key: "luxury", label: "فاخر بريميوم", emoji: "💎", colors: ["#1A1A2E", "#C9A84C", "#F5F5F0"], mood: "فاخر ومميز" },
];

// ===== مستويات الميزانية =====
const BUDGET_LEVELS = [
  { key: "economic", label: "اقتصادي", range: "5k - 20k ريال", icon: "💰", color: "bg-green-100 text-green-800 border-green-300" },
  { key: "medium", label: "متوسط", range: "20k - 60k ريال", icon: "💵", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "luxury", label: "فاخر", range: "60k - 150k ريال", icon: "💎", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "premium", label: "بريميوم", range: "150k+ ريال", icon: "👑", color: "bg-amber-100 text-amber-800 border-amber-300" },
];

// ===== خطوات Wizard =====
const WIZARD_STEPS = [
  { id: 1, label: "المشروع", icon: Building2, description: "اختر مشروعاً أو أنشئ جديداً" },
  { id: 2, label: "الهوية البصرية", icon: Palette, description: "النمط والألوان والمواد الموحدة" },
  { id: 3, label: "الأرضيات", icon: Square, description: "تصميم الأرضيات المتناسق" },
  { id: 4, label: "الجدران", icon: Layers, description: "تصميم الجدران المتناسق" },
  { id: 5, label: "الأسقف", icon: Home, description: "تصميم الأسقف المتناسق" },
  { id: 6, label: "الأبواب والنوافذ", icon: DoorOpen, description: "تصميم الفتحات المتناسق" },
  { id: 7, label: "الإضاءة", icon: Lightbulb, description: "تصميم الإضاءة المتناسق" },
  { id: 8, label: "الأثاث", icon: Sofa, description: "تصميم الأثاث المتناسق" },
  { id: 9, label: "المنظور الكامل", icon: Eye, description: "صورة تصورية ثلاثية الأبعاد" },
];

// ===== أنواع الغرف =====
const ROOM_TYPES = ["غرفة المعيشة", "غرفة النوم الرئيسية", "غرفة النوم", "المطبخ", "الحمام", "المكتب", "غرفة الطعام", "الردهة", "الصالة", "غرفة الأطفال"];

// ===== الهويات البصرية الجاهزة =====
const PRESET_IDENTITIES: Record<string, {
  primaryColor: string; secondaryColor: string; accentColor: string;
  primaryMaterial: string; woodTone: string; stoneType: string;
  metalFinish: string; overallMood: string;
}> = {
  modern: { primaryColor: "#F5F5F0", secondaryColor: "#2C2C2C", accentColor: "#C9A84C", primaryMaterial: "خرسانة مصقولة وزجاج", woodTone: "خشب فاتح طبيعي", stoneType: "رخام أبيض كارارا", metalFinish: "فولاذ مصقول", overallMood: "نظيف وعصري ومنفتح" },
  gulf: { primaryColor: "#F8F0E3", secondaryColor: "#8B6914", accentColor: "#C9A84C", primaryMaterial: "حجر طبيعي وخشب عود", woodTone: "خشب داكن غامق", stoneType: "حجر بيج فاخر", metalFinish: "ذهبي مطفي", overallMood: "فاخر وأصيل وكريم" },
  classic: { primaryColor: "#F5EFE6", secondaryColor: "#5C4033", accentColor: "#D4AF37", primaryMaterial: "رخام وخشب منحوت", woodTone: "خشب ماهوجني داكن", stoneType: "رخام إيطالي", metalFinish: "ذهبي لامع", overallMood: "راقٍ وكلاسيكي وأنيق" },
  minimal: { primaryColor: "#FFFFFF", secondaryColor: "#E0E0E0", accentColor: "#333333", primaryMaterial: "جبس أبيض وزجاج", woodTone: "خشب أبيض مطلي", stoneType: "حجر أبيض ناعم", metalFinish: "فولاذ مات", overallMood: "بسيط وهادئ ونظيف" },
  japanese: { primaryColor: "#F5F0E8", secondaryColor: "#8B7355", accentColor: "#4A7C59", primaryMaterial: "خشب طبيعي وحجارة", woodTone: "خشب بامبو فاتح", stoneType: "حجر طبيعي خشن", metalFinish: "نحاس مطفي", overallMood: "هادئ وطبيعي ومتناسق" },
  scandinavian: { primaryColor: "#FAFAFA", secondaryColor: "#D4C5B0", accentColor: "#5C7A6B", primaryMaterial: "خشب فاتح وصوف طبيعي", woodTone: "خشب بلوط فاتح", stoneType: "حجر رمادي ناعم", metalFinish: "فولاذ أسود مات", overallMood: "دافئ وبسيط ووظيفي" },
  mediterranean: { primaryColor: "#F0F4F8", secondaryColor: "#2B6CB0", accentColor: "#E8A838", primaryMaterial: "فسيفساء وطين", woodTone: "خشب زيتون طبيعي", stoneType: "حجر أزرق بحري", metalFinish: "نحاس مطرق", overallMood: "مشرق وحيوي وبحري" },
  industrial: { primaryColor: "#3A3A3A", secondaryColor: "#8B7355", accentColor: "#C0C0C0", primaryMaterial: "معدن وطوب مكشوف", woodTone: "خشب خام متشقق", stoneType: "خرسانة مكشوفة", metalFinish: "حديد مطفي", overallMood: "خشن وعصري وجريء" },
  moroccan: { primaryColor: "#F5E6D3", secondaryColor: "#8B1A1A", accentColor: "#DAA520", primaryMaterial: "زليج وجبس منحوت", woodTone: "خشب أرز مزخرف", stoneType: "حجر تادلاكت", metalFinish: "نحاس مزخرف", overallMood: "ملون وزاهي وأصيل" },
  luxury: { primaryColor: "#1A1A2E", secondaryColor: "#C9A84C", accentColor: "#F5F5F0", primaryMaterial: "رخام فاخر وذهب", woodTone: "خشب إيبونيا أسود", stoneType: "رخام نيرو ماركينا", metalFinish: "ذهبي 24 قيراط", overallMood: "فاخر ومميز وحصري" },
};

// ===== أنواع البيانات =====
interface VisualIdentity {
  primaryColor: string; secondaryColor: string; accentColor: string;
  primaryMaterial: string; woodTone: string; stoneType: string;
  metalFinish: string; overallMood: string;
}

interface DesignResult {
  elementType: string; roomName: string; designConcept: string;
  harmonyNote?: string; specifications: Record<string, string>;
  products: Array<{ name: string; brand?: string; priceMin: number; priceMax: number; unit: string; quantity: number }>;
  colorPalette: Array<{ hex: string; name: string; role: string }>;
  installationSteps: string[];
  totalCostMin: number; totalCostMax: number;
  unit: string; quantity: number; professionalNotes: string;
}

interface DesignElementItem {
  id: number; elementType: string; roomName: string; roomArea: number;
  specifications: DesignResult; costMin: number | null; costMax: number | null;
  isCompleted: boolean;
}

export default function DesignStudio() {
  const { isAuthenticated } = useAuth();
  const { t, dir } = useLanguage();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("غرفة المعيشة");
  const [roomArea, setRoomArea] = useState(25);
  const [selectedStyle, setSelectedStyle] = useState("gulf");
  const [selectedBudget, setSelectedBudget] = useState<"economic" | "medium" | "luxury" | "premium">("medium");
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity>(PRESET_IDENTITIES.gulf);
  const [isIdentityCustomized, setIsIdentityCustomized] = useState(false);
  const [showIdentityDetails, setShowIdentityDetails] = useState(false);

  // Design state
  const [isDesigning, setIsDesigning] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<DesignResult | null>(null);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);

  // Stable query inputs
  const projectQueryInput = useMemo(() => undefined, []);
  const elementsQueryInput = useMemo(() => ({ projectId: selectedProjectId! }), [selectedProjectId]);
  const perspectivesQueryInput = useMemo(() => ({ projectId: selectedProjectId! }), [selectedProjectId]);

  // Queries
  const { data: projects } = trpc.projects.list.useQuery(projectQueryInput, { enabled: isAuthenticated });
  const { data: elements, refetch: refetchElements } = trpc.designElements.getByProject.useQuery(
    elementsQueryInput, { enabled: !!selectedProjectId }
  );
  const { data: perspectives, refetch: refetchPerspectives } = trpc.perspectives.getByProject.useQuery(
    perspectivesQueryInput, { enabled: !!selectedProjectId }
  );

  // Mutations
  const designWithIdentityMutation = trpc.designElements.designWithIdentity.useMutation();
  const generatePerspectiveMutation = trpc.perspectives.generate.useMutation();
  const markCompleteMutation = trpc.designElements.markComplete.useMutation();
  const deleteElementMutation = trpc.designElements.delete.useMutation();

  // ===== حساب التقدم =====
  const completedCount = (elements as DesignElementItem[] | undefined)?.filter(e => e.isCompleted).length || 0;
  const totalCount = (elements as DesignElementItem[] | undefined)?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const totalCostMin = (elements as DesignElementItem[] | undefined)?.reduce((sum, e) => sum + (e.costMin || 0), 0) || 0;
  const totalCostMax = (elements as DesignElementItem[] | undefined)?.reduce((sum, e) => sum + (e.costMax || 0), 0) || 0;

  // ===== خريطة العناصر المصممة =====
  const existingElementsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (elements as DesignElementItem[] | undefined)?.forEach(el => {
      if (el.roomName === selectedRoom) {
        map[el.elementType] = {
          designConcept: el.specifications?.designConcept,
          primaryColor: el.specifications?.specifications?.primaryColor,
          primaryMaterial: el.specifications?.specifications?.primaryMaterial,
        };
      }
    });
    return map;
  }, [elements, selectedRoom]);

  // ===== الخطوة الحالية للعنصر =====
  const stepToElementType: Record<number, string> = {
    3: "flooring", 4: "walls", 5: "ceiling",
    6: "doors", 7: "lighting", 8: "furniture", 9: "perspective"
  };

  const isElementDesigned = (elementType: string) => {
    return (elements as DesignElementItem[] | undefined)?.some(
      e => e.elementType === elementType && e.roomName === selectedRoom
    ) || false;
  };

  // ===== تصميم عنصر =====
  const handleDesignElement = async (elementType: string) => {
    if (!selectedProjectId) { toast.error("يرجى اختيار المشروع أولاً"); return; }
    setIsDesigning(true);
    try {
      const result = await designWithIdentityMutation.mutateAsync({
        projectId: selectedProjectId,
        elementType: elementType as "flooring" | "walls" | "ceiling" | "windows" | "doors" | "lighting" | "furniture" | "perspective",
        roomName: selectedRoom,
        roomArea,
        designStyle: selectedStyle,
        budget: selectedBudget,
        visualIdentity,
        existingElements: existingElementsMap,
      });
      setCurrentDesign(result.design as unknown as DesignResult);
      setShowDesignModal(true);
      refetchElements();
      toast.success("✨ تم التصميم بتناسق كامل مع الهوية البصرية!");
    } catch (err) {
      toast.error("حدث خطأ أثناء التصميم");
      console.error(err);
    } finally {
      setIsDesigning(false);
    }
  };

  // ===== توليد المنظور =====
  const handleGeneratePerspective = async () => {
    if (!selectedProjectId) { toast.error("يرجى اختيار المشروع أولاً"); return; }
    setIsGeneratingPerspective(true);
    try {
      await generatePerspectiveMutation.mutateAsync({
        projectId: selectedProjectId,
        roomName: selectedRoom,
        designStyle: selectedStyle,
        elements: existingElementsMap,
        area: roomArea,
        perspectiveType: "3d_render",
      });
      refetchPerspectives();
      toast.success("تم توليد المنظور الكامل!");
    } catch (err) {
      toast.error("حدث خطأ أثناء توليد المنظور");
      console.error(err);
    } finally {
      setIsGeneratingPerspective(false);
    }
  };

  // ===== تحديث الهوية البصرية عند تغيير النمط =====
  const handleStyleChange = (styleKey: string) => {
    setSelectedStyle(styleKey);
    if (!isIdentityCustomized) {
      setVisualIdentity(PRESET_IDENTITIES[styleKey] || PRESET_IDENTITIES.modern);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <Card className="p-8 text-center max-w-md">
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">استوديو التصميم</h2>
          <p className="text-muted-foreground mb-6">يرجى تسجيل الدخول للوصول إلى استوديو التصميم</p>
          <Link href="/"><Button className="btn-gold">العودة للرئيسية</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B6914] to-[#C9A84C] text-white py-5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              استوديو التصميم المتكامل
            </h1>
            <p className="text-white/80 text-xs mt-0.5">هوية بصرية موحدة — كل عنصر يكمل الآخر</p>
          </div>
          <div className="flex gap-2">
            <Link href="/projects"><Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs">مشاريعي</Button></Link>
            <Link href="/chat"><Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs">استشر م. سارة</Button></Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {/* شريط التقدم العام */}
        {selectedProjectId && totalCount > 0 && (
          <Card className="mb-4 border-gold/30 bg-gold/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">تقدم التصميم الكلي</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{completedCount}/{totalCount} عنصر مكتمل</span>
                  <span className="text-xs font-bold text-gold">
                    {totalCostMin.toLocaleString()} - {totalCostMax.toLocaleString()} ريال
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Wizard Steps Bar */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {WIZARD_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isLocked = step.id > 2 && !selectedProjectId;
              const elementType = stepToElementType[step.id];
              const hasDesign = elementType ? isElementDesigned(elementType) : false;

              return (
                <button
                  key={step.id}
                  onClick={() => !isLocked && setCurrentStep(step.id)}
                  disabled={isLocked}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all min-w-[80px] ${
                    isActive
                      ? "border-gold bg-gold/10 shadow-md"
                      : isCompleted || hasDesign
                        ? "border-green-400 bg-green-50"
                        : isLocked
                          ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : "border-border hover:border-gold/50 cursor-pointer"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? "bg-gold text-white" :
                    hasDesign ? "bg-green-500 text-white" :
                    isLocked ? "bg-muted text-muted-foreground" :
                    "bg-muted text-foreground"
                  }`}>
                    {hasDesign ? <CheckCircle className="w-4 h-4" /> : isLocked ? <Lock className="w-3 h-3" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? "text-gold" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground absolute" style={{ right: -8 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== الخطوة 1: اختيار المشروع ===== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">اختر مشروعك</h2>
                <p className="text-xs text-muted-foreground">حدد المشروع والغرفة التي تريد تصميمها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gold" />
                    المشروع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedProjectId?.toString() || ""} onValueChange={(v) => setSelectedProjectId(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="اختر مشروعاً..." /></SelectTrigger>
                    <SelectContent>
                      {(projects as Array<{ id: number; name: string }> | undefined)?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!projects?.length && (
                    <div className="text-center py-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">لا توجد مشاريع بعد</p>
                      <Link href="/projects"><Button size="sm" className="btn-gold text-xs">إنشاء مشروع جديد</Button></Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gold" />
                    الغرفة والمساحة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">الغرفة</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">المساحة (م²)</Label>
                    <Input type="number" value={roomArea} onChange={e => setRoomArea(Number(e.target.value))} min={5} max={500} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              className="btn-gold w-full mt-2"
              disabled={!selectedProjectId}
              onClick={() => setCurrentStep(2)}
            >
              التالي: تحديد الهوية البصرية
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        )}

        {/* ===== الخطوة 2: الهوية البصرية ===== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">الهوية البصرية الموحدة</h2>
                <p className="text-xs text-muted-foreground">هذه الهوية ستُطبَّق على جميع عناصر التصميم لضمان التناسق الكامل</p>
              </div>
            </div>

            {/* تنبيه مهم */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>لماذا الهوية البصرية مهمة؟</strong> عند تصميم الأرضيات والجدران والأسقف بشكل منفصل، قد تبدو غير متناسقة. م. سارة ستستخدم هذه الهوية لضمان أن كل عنصر يكمل الآخر في الروح والمواد والألوان.
              </p>
            </div>

            {/* اختيار النمط */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" />
                  نمط التصميم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {DESIGN_STYLES.map(style => (
                    <button
                      key={style.key}
                      onClick={() => handleStyleChange(style.key)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                        selectedStyle === style.key ? "border-gold bg-gold/10 shadow-md" : "border-border hover:border-gold/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{style.emoji}</div>
                      <div className="text-[11px] font-medium text-foreground">{style.label}</div>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {style.colors.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* اختيار الميزانية */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">الميزانية الإجمالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {BUDGET_LEVELS.map(b => (
                    <button
                      key={b.key}
                      onClick={() => setSelectedBudget(b.key as "economic" | "medium" | "luxury" | "premium")}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedBudget === b.key ? "border-gold bg-gold/10 shadow-md" : "border-border hover:border-gold/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{b.icon}</div>
                      <div className="text-xs font-bold text-foreground">{b.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{b.range}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* تفاصيل الهوية البصرية */}
            <Card>
              <CardHeader className="pb-2">
                <button
                  onClick={() => setShowIdentityDetails(!showIdentityDetails)}
                  className="flex items-center justify-between w-full text-right"
                >
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gold" />
                    تفاصيل الهوية البصرية
                    {isIdentityCustomized && <Badge variant="outline" className="text-[10px] border-gold text-gold">مخصصة</Badge>}
                  </CardTitle>
                  {showIdentityDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CardHeader>
              {showIdentityDetails && (
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: "primaryColor", label: "اللون الأساسي", type: "color" },
                      { key: "secondaryColor", label: "اللون الثانوي", type: "color" },
                      { key: "accentColor", label: "لون التمييز", type: "color" },
                      { key: "primaryMaterial", label: "المادة الأساسية", type: "text" },
                      { key: "woodTone", label: "درجة الخشب", type: "text" },
                      { key: "stoneType", label: "نوع الحجر/الرخام", type: "text" },
                      { key: "metalFinish", label: "تشطيب المعادن", type: "text" },
                      { key: "overallMood", label: "الروح العامة", type: "text" },
                    ].map(field => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}</Label>
                        {field.type === "color" ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={visualIdentity[field.key as keyof VisualIdentity]}
                              onChange={e => {
                                setVisualIdentity(prev => ({ ...prev, [field.key]: e.target.value }));
                                setIsIdentityCustomized(true);
                              }}
                              className="w-8 h-8 rounded cursor-pointer border border-border"
                            />
                            <span className="text-xs font-mono text-muted-foreground">
                              {visualIdentity[field.key as keyof VisualIdentity]}
                            </span>
                          </div>
                        ) : (
                          <Input
                            value={visualIdentity[field.key as keyof VisualIdentity]}
                            onChange={e => {
                              setVisualIdentity(prev => ({ ...prev, [field.key]: e.target.value }));
                              setIsIdentityCustomized(true);
                            }}
                            className="mt-1 text-xs h-8"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {isIdentityCustomized && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setVisualIdentity(PRESET_IDENTITIES[selectedStyle] || PRESET_IDENTITIES.modern);
                        setIsIdentityCustomized(false);
                      }}
                    >
                      إعادة تعيين للافتراضي
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 text-sm">رجوع</Button>
              <Button className="btn-gold flex-1 text-sm" onClick={() => setCurrentStep(3)}>
                ابدأ التصميم
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ===== خطوات التصميم (3-9) ===== */}
        {currentStep >= 3 && currentStep <= 9 && (
          <DesignStepContent
            step={currentStep}
            selectedRoom={selectedRoom}
            roomArea={roomArea}
            selectedStyle={selectedStyle}
            selectedBudget={selectedBudget}
            visualIdentity={visualIdentity}
            elements={elements as DesignElementItem[] | undefined}
            perspectives={perspectives as Array<{ id: number; imageUrl: string; roomName: string; perspectiveType: string }> | undefined}
            isDesigning={isDesigning}
            isGeneratingPerspective={isGeneratingPerspective}
            onDesign={handleDesignElement}
            onGeneratePerspective={handleGeneratePerspective}
            onMarkComplete={async (id, current) => { await markCompleteMutation.mutateAsync({ id, isCompleted: !current }); refetchElements(); }}
            onDelete={async (id) => { if (!confirm("حذف هذا العنصر؟")) return; await deleteElementMutation.mutateAsync({ id }); refetchElements(); toast.success("تم الحذف"); }}
            onPrev={() => setCurrentStep(currentStep - 1)}
            onNext={() => setCurrentStep(Math.min(currentStep + 1, 9))}
            onViewDesign={(design) => { setCurrentDesign(design); setShowDesignModal(true); }}
          />
        )}

        {/* ===== Modal التصميم ===== */}
        <Dialog open={showDesignModal} onOpenChange={setShowDesignModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={dir}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                تفاصيل التصميم
              </DialogTitle>
            </DialogHeader>
            {currentDesign && <DesignResultView design={currentDesign} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ===== مكوّن خطوة التصميم =====
function DesignStepContent({
  step, selectedRoom, roomArea, selectedStyle, selectedBudget, visualIdentity,
  elements, perspectives, isDesigning, isGeneratingPerspective,
  onDesign, onGeneratePerspective, onMarkComplete, onDelete, onPrev, onNext, onViewDesign
}: {
  step: number; selectedRoom: string; roomArea: number; selectedStyle: string;
  selectedBudget: string; visualIdentity: VisualIdentity;
  elements: DesignElementItem[] | undefined;
  perspectives: Array<{ id: number; imageUrl: string; roomName: string; perspectiveType: string }> | undefined;
  isDesigning: boolean; isGeneratingPerspective: boolean;
  onDesign: (elementType: string) => void;
  onGeneratePerspective: () => void;
  onMarkComplete: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
  onPrev: () => void; onNext: () => void;
  onViewDesign: (design: DesignResult) => void;
}) {
  const stepConfig: Record<number, { elementType: string; label: string; icon: React.ElementType; description: string; tips: string[] }> = {
    3: { elementType: "flooring", label: "الأرضيات", icon: Square, description: "تصميم أرضيات متناسقة مع الهوية البصرية للمشروع", tips: ["الأرضية هي الأساس البصري للغرفة", "يجب أن تتناسق مع ألوان الجدران والأسقف", "اختر مواد تتحمل الاستخدام اليومي"] },
    4: { elementType: "walls", label: "الجدران", icon: Layers, description: "تصميم جدران تكمل الأرضيات وتمهد للأسقف", tips: ["الجدران تربط الأرضية بالسقف بصرياً", "جدار مميز واحد يضيف عمقاً للمساحة", "الألوان الفاتحة تُوسّع المساحة بصرياً"] },
    5: { elementType: "ceiling", label: "الأسقف", icon: Home, description: "تصميم أسقف تكمل الهوية البصرية الكاملة", tips: ["السقف هو العنصر الأكثر إغفالاً في التصميم", "الإضاءة المدمجة تضيف عمقاً وأناقة", "ارتفاع السقف يؤثر على الإحساس بالمساحة"] },
    6: { elementType: "doors", label: "الأبواب والنوافذ", icon: DoorOpen, description: "تصميم فتحات متناسقة مع باقي العناصر", tips: ["الأبواب والنوافذ هي 'إطارات' المساحة", "الستائر تضيف دفئاً ولمسة إنسانية", "اختر مواد تتناسق مع الأثاث"] },
    7: { elementType: "lighting", label: "الإضاءة", icon: Lightbulb, description: "تصميم إضاءة تُبرز جمال كل عنصر", tips: ["الإضاءة تُحوّل التصميم من جيد إلى استثنائي", "3 مستويات: عامة، وظيفية، تزيينية", "درجة حرارة الضوء تؤثر على الألوان"] },
    8: { elementType: "furniture", label: "الأثاث", icon: Sofa, description: "تصميم أثاث يكمل الهوية البصرية الكاملة", tips: ["الأثاث يجب أن يتناسب مع نسب الغرفة", "اترك 60-70% من المساحة فارغة للحركة", "اختر قطعة محورية واحدة تكون مركز الاهتمام"] },
    9: { elementType: "perspective", label: "المنظور الكامل", icon: Eye, description: "صورة تصورية ثلاثية الأبعاد تجمع كل العناصر", tips: ["المنظور يُظهر التصميم الكامل بشكل واقعي", "يمكنك مشاركته مع العميل أو المقاول", "استخدمه للمقارنة مع الواقع"] },
  };

  const config = stepConfig[step];
  if (!config) return null;

  const Icon = config.icon;
  const existingDesigns = elements?.filter(e => e.elementType === config.elementType && e.roomName === selectedRoom) || [];
  const hasDesign = existingDesigns.length > 0;
  const isPerspectiveStep = step === 9;

  const stepPerspectives = perspectives?.filter(p => p.roomName === selectedRoom) || [];

  return (
    <div className="space-y-4">
      {/* عنوان الخطوة */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">{step}</div>
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Icon className="w-5 h-5 text-gold" />
            {config.label}
          </h2>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        {hasDesign && <Badge className="mr-auto bg-green-500 text-white text-xs">✓ مصمّم</Badge>}
      </div>

      {/* نصائح م. سارة */}
      <Card className="border-gold/20 bg-gold/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gold mb-1">نصائح م. سارة</p>
              <ul className="space-y-0.5">
                {config.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-gold">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الهوية البصرية المطبقة */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="py-3 px-4">
          <p className="text-xs font-medium text-purple-700 mb-2">الهوية البصرية المطبقة على هذا العنصر</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "الأساسي", color: visualIdentity.primaryColor },
              { label: "الثانوي", color: visualIdentity.secondaryColor },
              { label: "التمييز", color: visualIdentity.accentColor },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-purple-100">
                <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-purple-700">{c.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-purple-100">
              <span className="text-[10px] text-purple-700">📦 {visualIdentity.primaryMaterial}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر التصميم أو المنظور */}
      {!isPerspectiveStep ? (
        <Card>
          <CardContent className="py-4">
            {hasDesign ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">تم تصميم {config.label} بنجاح</span>
                </div>
                {existingDesigns.map(el => (
                  <div key={el.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                    <div>
                      <p className="text-sm font-medium">{el.roomName}</p>
                      <p className="text-xs text-muted-foreground">
                        {el.costMin?.toLocaleString()} - {el.costMax?.toLocaleString()} ريال
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onViewDesign(el.specifications)}>
                        <Eye className="w-3 h-3 ml-1" /> تفاصيل
                      </Button>
                      <Button size="sm" variant="outline" className={`text-xs h-7 ${el.isCompleted ? "border-green-500 text-green-600" : ""}`} onClick={() => onMarkComplete(el.id, el.isCompleted)}>
                        <CheckCircle className="w-3 h-3 ml-1" /> {el.isCompleted ? "مكتمل" : "تأكيد"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500 hover:text-red-600" onClick={() => onDelete(el.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full text-sm border-gold/50 text-gold hover:bg-gold/10" onClick={() => onDesign(config.elementType)} disabled={isDesigning}>
                  {isDesigning ? "جارٍ إعادة التصميم..." : "إعادة التصميم بهوية مختلفة"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Icon className="w-10 h-10 text-gold/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  اضغط لتصميم {config.label} بهوية بصرية موحدة مع باقي عناصر {selectedRoom}
                </p>
                <Button className="btn-gold w-full" onClick={() => onDesign(config.elementType)} disabled={isDesigning}>
                  {isDesigning ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      م. سارة تصمم...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      صمّمي {config.label} يا م. سارة
                    </span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* خطوة المنظور */
        <Card>
          <CardContent className="py-4">
            {stepPerspectives.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> تم توليد {stepPerspectives.length} منظور
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stepPerspectives.map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden border">
                      <img src={p.imageUrl} alt="منظور" className="w-full h-48 object-cover" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full text-sm" onClick={onGeneratePerspective} disabled={isGeneratingPerspective}>
                  {isGeneratingPerspective ? "جارٍ التوليد..." : "توليد منظور جديد"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Eye className="w-12 h-12 text-gold/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  م. سارة ستولّد منظوراً ثلاثي الأبعاد يجمع كل العناصر المصممة
                </p>
                {(elements?.length || 0) < 3 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">للحصول على أفضل نتيجة، صمّم على الأقل 3 عناصر أولاً</p>
                  </div>
                )}
                <Button className="btn-gold w-full" onClick={onGeneratePerspective} disabled={isGeneratingPerspective}>
                  {isGeneratingPerspective ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      م. سارة تولّد المنظور...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      ولّدي المنظور الكامل
                    </span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* أزرار التنقل */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onPrev} className="flex-1 text-sm">
          ← السابق
        </Button>
        {step < 9 && (
          <Button className="btn-gold flex-1 text-sm" onClick={onNext}>
            التالي →
          </Button>
        )}
      </div>
    </div>
  );
}

// ===== مكوّن عرض نتيجة التصميم =====
function DesignResultView({ design }: { design: DesignResult }) {
  const { dir } = useLanguage();
  return (
    <div className="space-y-4" dir={dir}>
      {/* مفهوم التصميم */}
      <div className="bg-gold/10 rounded-xl p-4 border border-gold/20">
        <h3 className="font-bold text-gold mb-1 text-sm">مفهوم التصميم</h3>
        <p className="text-sm text-foreground">{design.designConcept}</p>
        {design.harmonyNote && (
          <p className="text-xs text-muted-foreground mt-2 border-t border-gold/20 pt-2">
            <strong>التناسق:</strong> {design.harmonyNote}
          </p>
        )}
      </div>

      {/* لوحة الألوان */}
      {design.colorPalette?.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2">لوحة الألوان</h3>
          <div className="flex flex-wrap gap-2">
            {design.colorPalette.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: c.hex }} />
                <div>
                  <p className="text-xs font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* المواصفات */}
      {design.specifications && Object.keys(design.specifications).length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2">المواصفات التفصيلية</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(design.specifications).map(([key, val]) => (
              <div key={key} className="bg-muted/30 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">{key}</p>
                <p className="text-xs font-medium">{String(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* المنتجات */}
      {design.products?.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2">المنتجات المقترحة</h3>
          <div className="space-y-2">
            {design.products.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border">
                <div>
                  <p className="text-xs font-medium">{p.name}</p>
                  {p.brand && <p className="text-[10px] text-muted-foreground">{p.brand}</p>}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gold">{p.priceMin?.toLocaleString()} - {p.priceMax?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{p.unit} × {p.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* التكلفة الإجمالية */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
        <span className="text-sm font-bold text-green-800">التكلفة الإجمالية</span>
        <span className="text-sm font-bold text-green-700">
          {design.totalCostMin?.toLocaleString()} - {design.totalCostMax?.toLocaleString()} ريال
        </span>
      </div>

      {/* ملاحظات م. سارة */}
      {design.professionalNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-700 mb-1">ملاحظات م. سارة المهنية</p>
          <p className="text-xs text-blue-600">{design.professionalNotes}</p>
        </div>
      )}
    </div>
  );
}
