import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Home, Layers, Square, Circle, Lightbulb, DoorOpen, Sofa, Eye,
  Upload, Camera, Sparkles, CheckCircle, Clock, ChevronRight,
  ArrowRight, RotateCcw, Download, Share2, Plus, Trash2, Image
} from "lucide-react";
import { Link } from "wouter";

const ELEMENT_TYPES = [
  { key: "flooring", label: "الأرضيات", icon: Square, color: "bg-amber-100 text-amber-700", description: "بلاط، رخام، خشب، سيراميك" },
  { key: "walls", label: "الجدران", icon: Layers, color: "bg-blue-100 text-blue-700", description: "دهان، ورق جدران، حجر، خشب" },
  { key: "ceiling", label: "الأسقف", icon: Home, color: "bg-purple-100 text-purple-700", description: "جبس، خشب، معدن، إضاءة مدمجة" },
  { key: "windows", label: "النوافذ والستائر", icon: Circle, color: "bg-green-100 text-green-700", description: "ستائر، بلاكاوت، شيفون، رول" },
  { key: "doors", label: "الأبواب", icon: DoorOpen, color: "bg-orange-100 text-orange-700", description: "خشب، زجاج، معدن، ألمنيوم" },
  { key: "lighting", label: "الإضاءة", icon: Lightbulb, color: "bg-yellow-100 text-yellow-700", description: "سبوت، ثريا، إضاءة جانبية" },
  { key: "furniture", label: "الأثاث", icon: Sofa, color: "bg-rose-100 text-rose-700", description: "كنب، طاولات، خزائن، سرير" },
  { key: "perspective", label: "منظور كامل", icon: Eye, color: "bg-indigo-100 text-indigo-700", description: "صورة تصورية ثلاثية الأبعاد" },
];

const GLOBAL_STYLES_DISPLAY = [
  { key: "modern", label: "عصري حديث", emoji: "🏙️" },
  { key: "gulf", label: "خليجي أصيل", emoji: "🕌" },
  { key: "classic", label: "كلاسيكي فاخر", emoji: "🏛️" },
  { key: "minimal", label: "مينيمال", emoji: "⬜" },
  { key: "japanese", label: "ياباني زن", emoji: "🌸" },
  { key: "scandinavian", label: "سكندنافي", emoji: "🌿" },
  { key: "mediterranean", label: "متوسطي", emoji: "🌊" },
  { key: "industrial", label: "صناعي", emoji: "🔩" },
  { key: "moroccan", label: "مغربي", emoji: "🏮" },
  { key: "art_deco", label: "آرت ديكو", emoji: "✨" },
  { key: "tropical", label: "استوائي", emoji: "🌴" },
  { key: "luxury", label: "فاخر بريميوم", emoji: "💎" },
  { key: "bohemian", label: "بوهيمي", emoji: "🎨" },
  { key: "farmhouse", label: "ريفي", emoji: "🌾" },
  { key: "coastal", label: "ساحلي", emoji: "⛵" },
  { key: "indian", label: "هندي", emoji: "🪔" },
  { key: "chinese", label: "صيني كلاسيكي", emoji: "🏮" },
  { key: "neoclassical", label: "نيوكلاسيكي", emoji: "🏺" },
  { key: "eclectic", label: "انتقائي", emoji: "🎭" },
  { key: "contemporary", label: "معاصر مختلط", emoji: "🔮" },
];

const ROOM_TYPES = [
  "غرفة معيشة", "غرفة نوم رئيسية", "غرفة نوم ضيوف", "غرفة أطفال",
  "مطبخ", "غرفة طعام", "حمام رئيسي", "حمام ضيوف",
  "مكتب منزلي", "ممر", "مدخل", "غرفة ألعاب", "مكتبة", "صالة"
];

interface DesignResult {
  designConcept?: string;
  specifications?: Record<string, string>;
  products?: Array<{ name: string; brand?: string; priceMin?: number; priceMax?: number; unit?: string; quantity?: number }>;
  colorPalette?: Array<{ hex: string; name: string; role?: string }>;
  totalCostMin?: number;
  totalCostMax?: number;
  professionalNotes?: string;
  alternativeOptions?: Array<{ name: string; description: string; costMin?: number; costMax?: number }>;
  installationSteps?: string[];
  maintenanceTips?: string[];
}

interface DesignElementItem {
  id: number;
  elementType: string;
  roomName: string;
  roomArea?: number | null;
  specifications?: DesignResult | null;
  costMin?: number | null;
  costMax?: number | null;
  isCompleted?: boolean | null;
  imageUrl?: string | null;
}

interface PerspectiveItem {
  id: number;
  roomName: string;
  imageUrl?: string | null;
  designStyle?: string | null;
  description?: string | null;
  perspectiveType: string;
}

export default function DesignStudio() {
  const { isAuthenticated } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [roomArea, setRoomArea] = useState(25);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [projectContext, setProjectContext] = useState("");
  const [isDesigning, setIsDesigning] = useState(false);
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<DesignResult | null>(null);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const refImageInputRef = useRef<HTMLInputElement>(null);

  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: elements, refetch: refetchElements } = trpc.designElements.getByProject.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: perspectives, refetch: refetchPerspectives } = trpc.perspectives.getByProject.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const designMutation = trpc.designElements.design.useMutation();
  const generatePerspectiveMutation = trpc.perspectives.generate.useMutation();
  const markCompleteMutation = trpc.designElements.markComplete.useMutation();
  const deleteElementMutation = trpc.designElements.delete.useMutation();
  const uploadMutation = trpc.upload.image.useMutation();

  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingRef(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, mimeType: file.type });
        setReferenceImageUrl(result.url);
        toast.success("تم رفع الصورة المرجعية");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setIsUploadingRef(false);
    }
  };

  const handleDesignElement = async () => {
    if (!selectedProjectId || !selectedElement) {
      toast.error("يرجى اختيار المشروع والعنصر");
      return;
    }
    const room = customRoom || selectedRoom;
    if (!room) {
      toast.error("يرجى تحديد اسم الغرفة");
      return;
    }
    setIsDesigning(true);
    try {
      const result = await designMutation.mutateAsync({
        projectId: selectedProjectId,
        elementType: selectedElement as "flooring" | "walls" | "ceiling" | "windows" | "doors" | "lighting" | "furniture" | "perspective",
        roomName: room,
        roomArea,
        designStyle: selectedStyle,
        projectContext,
        referenceImageUrl: referenceImageUrl ?? undefined,
      });
      setCurrentDesign(result.design as DesignResult);
      setShowDesignModal(true);
      refetchElements();
      toast.success("تم تصميم العنصر بنجاح!");
    } catch (err) {
      toast.error("حدث خطأ أثناء التصميم");
      console.error(err);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleGeneratePerspective = async () => {
    if (!selectedProjectId) {
      toast.error("يرجى اختيار المشروع أولاً");
      return;
    }
    const room = customRoom || selectedRoom || "غرفة المعيشة";
    setIsGeneratingPerspective(true);
    try {
      const elementsMap: Record<string, unknown> = {};
      if (elements) {
        (elements as DesignElementItem[]).forEach(el => {
          if (el.roomName === room) {
            elementsMap[el.elementType] = el.specifications;
          }
        });
      }
      await generatePerspectiveMutation.mutateAsync({
        projectId: selectedProjectId,
        roomName: room,
        designStyle: selectedStyle,
        elements: elementsMap,
        area: roomArea,
        perspectiveType: "3d_render",
      });
      refetchPerspectives();
      toast.success("تم توليد المنظور بنجاح!");
    } catch (err) {
      toast.error("حدث خطأ أثناء توليد المنظور");
      console.error(err);
    } finally {
      setIsGeneratingPerspective(false);
    }
  };

  const handleMarkComplete = async (id: number, current: boolean) => {
    await markCompleteMutation.mutateAsync({ id, isCompleted: !current });
    refetchElements();
  };

  const handleDeleteElement = async (id: number) => {
    if (!confirm("هل تريد حذف هذا العنصر؟")) return;
    await deleteElementMutation.mutateAsync({ id });
    refetchElements();
    toast.success("تم الحذف");
  };

  const completedCount = (elements as DesignElementItem[] | undefined)?.filter(e => e.isCompleted).length || 0;
  const totalCount = (elements as DesignElementItem[] | undefined)?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">استوديو التصميم</h2>
          <p className="text-muted-foreground mb-6">يرجى تسجيل الدخول للوصول إلى استوديو التصميم المتقدم</p>
          <Link href="/">
            <Button className="btn-gold">العودة للرئيسية</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B6914] to-[#C9A84C] text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                استوديو التصميم المعماري
              </h1>
              <p className="text-white/80 text-sm mt-1">تصميم احترافي عنصراً بعنصر بمعايير عالمية</p>
            </div>
            <div className="flex gap-2">
              <Link href="/projects">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  مشاريعي
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  استشر م. سارة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6 w-full max-w-lg">
            <TabsTrigger value="setup">إعداد المشروع</TabsTrigger>
            <TabsTrigger value="design">التصميم</TabsTrigger>
            <TabsTrigger value="gallery">المعرض</TabsTrigger>
          </TabsList>

          {/* ===== تبويب الإعداد ===== */}
          <TabsContent value="setup">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* اختيار المشروع */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-gold" />
                    اختيار المشروع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>المشروع الحالي</Label>
                    <Select
                      value={selectedProjectId?.toString() || ""}
                      onValueChange={(v) => setSelectedProjectId(Number(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر مشروعاً..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(projects as Array<{ id: number; name: string; designStyle?: string }> | undefined)?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!projects?.length && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-3">لا توجد مشاريع بعد</p>
                      <Link href="/projects">
                        <Button size="sm" className="btn-gold">
                          <Plus className="w-4 h-4 ml-1" />
                          إنشاء مشروع جديد
                        </Button>
                      </Link>
                    </div>
                  )}
                  {selectedProjectId && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>تقدم التصميم</span>
                        <span className="font-medium">{completedCount}/{totalCount} عنصر</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إعدادات التصميم */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                    إعدادات التصميم
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الغرفة / الفضاء</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر الغرفة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>أو أدخل اسم مخصص</Label>
                    <Input
                      value={customRoom}
                      onChange={e => setCustomRoom(e.target.value)}
                      placeholder="مثال: صالة الاستقبال الكبرى"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>المساحة (م²)</Label>
                    <Input
                      type="number"
                      value={roomArea}
                      onChange={e => setRoomArea(Number(e.target.value))}
                      min={5}
                      max={500}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>سياق المشروع (اختياري)</Label>
                    <Textarea
                      value={projectContext}
                      onChange={e => setProjectContext(e.target.value)}
                      placeholder="مثال: فيلا خليجية فاخرة للعائلة، ميزانية متوسطة..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* اختيار النمط العالمي */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gold" />
                    نمط التصميم العالمي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {GLOBAL_STYLES_DISPLAY.map(style => (
                      <button
                        key={style.key}
                        onClick={() => setSelectedStyle(style.key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                          selectedStyle === style.key
                            ? "border-gold bg-gold/10 shadow-md"
                            : "border-border hover:border-gold/50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{style.emoji}</div>
                        <div className="text-xs font-medium text-foreground">{style.label}</div>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="btn-gold mt-4 w-full sm:w-auto"
                    onClick={() => setActiveTab("design")}
                    disabled={!selectedProjectId}
                  >
                    ابدأ التصميم
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== تبويب التصميم ===== */}
          <TabsContent value="design">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* لوحة اختيار العناصر */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">اختر العنصر للتصميم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ELEMENT_TYPES.map(el => {
                      const Icon = el.icon;
                      const isSelected = selectedElement === el.key;
                      return (
                        <button
                          key={el.key}
                          onClick={() => setSelectedElement(el.key)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${
                            isSelected
                              ? "border-gold bg-gold/10 shadow-sm"
                              : "border-border hover:border-gold/40"
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${el.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">{el.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{el.description}</div>
                          </div>
                          {isSelected && <ChevronRight className="w-4 h-4 text-gold flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* صورة مرجعية */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">صورة مرجعية (اختياري)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      type="file"
                      accept="image/*"
                      ref={refImageInputRef}
                      className="hidden"
                      onChange={handleUploadReference}
                    />
                    {referenceImageUrl ? (
                      <div className="relative">
                        <img src={referenceImageUrl} alt="مرجع" className="w-full h-32 object-cover rounded-lg" />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 left-1"
                          onClick={() => setReferenceImageUrl(null)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-20 border-dashed"
                        onClick={() => refImageInputRef.current?.click()}
                        disabled={isUploadingRef}
                      >
                        <div className="text-center">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {isUploadingRef ? "جاري الرفع..." : "ارفع صورة مرجعية"}
                          </span>
                        </div>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* منطقة التصميم الرئيسية */}
              <div className="lg:col-span-2 space-y-4">
                {/* معلومات الإعداد الحالي */}
                <Card className="bg-gradient-to-r from-gold/5 to-beige/30 border-gold/20">
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="border-gold/40 text-gold">
                        {GLOBAL_STYLES_DISPLAY.find(s => s.key === selectedStyle)?.emoji}{" "}
                        {GLOBAL_STYLES_DISPLAY.find(s => s.key === selectedStyle)?.label}
                      </Badge>
                      {(customRoom || selectedRoom) && (
                        <Badge variant="outline">
                          {customRoom || selectedRoom} — {roomArea} م²
                        </Badge>
                      )}
                      {selectedElement && (
                        <Badge className="bg-gold text-white">
                          {ELEMENT_TYPES.find(e => e.key === selectedElement)?.label}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* زر التصميم */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      {selectedElement ? (
                        <>
                          <div className="text-4xl mb-2">
                            {ELEMENT_TYPES.find(e => e.key === selectedElement)?.icon &&
                              (() => {
                                const Icon = ELEMENT_TYPES.find(e => e.key === selectedElement)!.icon;
                                return <Icon className="w-12 h-12 mx-auto text-gold" />;
                              })()
                            }
                          </div>
                          <h3 className="text-lg font-semibold">
                            تصميم {ELEMENT_TYPES.find(e => e.key === selectedElement)?.label}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            سيقوم الذكاء الاصطناعي بتصميم {ELEMENT_TYPES.find(e => e.key === selectedElement)?.label} بمواصفات احترافية كاملة
                          </p>
                          <Button
                            className="btn-gold text-lg px-8 py-3"
                            onClick={handleDesignElement}
                            disabled={isDesigning || !selectedProjectId}
                          >
                            {isDesigning ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                                جاري التصميم...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 ml-2" />
                                صمّم الآن
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="py-8">
                          <Layers className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-muted-foreground">اختر عنصراً من القائمة لبدء التصميم</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* زر توليد المنظور */}
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Eye className="w-4 h-4 text-indigo-600" />
                          توليد منظور تصوري
                        </h4>
                        <p className="text-sm text-muted-foreground">صورة ثلاثية الأبعاد للتصميم الكامل</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                        onClick={handleGeneratePerspective}
                        disabled={isGeneratingPerspective || !selectedProjectId}
                      >
                        {isGeneratingPerspective ? (
                          <>
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-2" />
                            جاري التوليد...
                          </>
                        ) : (
                          <>
                            <Image className="w-4 h-4 ml-2" />
                            توليد منظور
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* قائمة العناصر المصممة */}
                {elements && (elements as DesignElementItem[]).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">العناصر المصممة ({totalCount})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(elements as DesignElementItem[]).map(el => {
                        const elType = ELEMENT_TYPES.find(e => e.key === el.elementType);
                        const Icon = elType?.icon || Layers;
                        return (
                          <div
                            key={el.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              el.isCompleted ? "bg-green-50 border-green-200" : "bg-card border-border"
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${elType?.color || "bg-gray-100"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{elType?.label} — {el.roomName}</div>
                              {el.costMin && el.costMax && (
                                <div className="text-xs text-muted-foreground">
                                  {el.costMin.toLocaleString()} — {el.costMax.toLocaleString()} ر.س
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCurrentDesign(el.specifications as DesignResult);
                                  setShowDesignModal(true);
                                }}
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkComplete(el.id, el.isCompleted || false)}
                                title={el.isCompleted ? "إلغاء الإكمال" : "تحديد كمكتمل"}
                              >
                                {el.isCompleted
                                  ? <RotateCcw className="w-3 h-3 text-orange-500" />
                                  : <CheckCircle className="w-3 h-3 text-green-500" />
                                }
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteElement(el.id)}
                                title="حذف"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== تبويب المعرض ===== */}
          <TabsContent value="gallery">
            <div className="space-y-6">
              {/* المناظير */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gold" />
                    المناظير التصورية
                    <Badge variant="outline">{(perspectives as PerspectiveItem[] | undefined)?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {perspectives && (perspectives as PerspectiveItem[]).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(perspectives as PerspectiveItem[]).map(p => (
                        <div key={p.id} className="group relative rounded-xl overflow-hidden border border-border hover:border-gold/40 transition-all">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.roomName}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-muted flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-3">
                            <div className="font-medium text-sm">{p.roomName}</div>
                            <div className="text-xs text-muted-foreground">{p.description}</div>
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            {p.imageUrl && (
                              <a href={p.imageUrl} download target="_blank" rel="noreferrer">
                                <Button size="sm" className="bg-black/60 text-white hover:bg-black/80 h-7 w-7 p-0">
                                  <Download className="w-3 h-3" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">لا توجد مناظير بعد</p>
                      <p className="text-sm text-muted-foreground mt-1">اذهب لتبويب التصميم وولّد منظوراً تصورياً</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ملخص التكاليف */}
              {elements && (elements as DesignElementItem[]).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-gold" />
                      ملخص التكاليف التقديرية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(elements as DesignElementItem[]).map(el => {
                        if (!el.costMin && !el.costMax) return null;
                        const elType = ELEMENT_TYPES.find(e => e.key === el.elementType);
                        return (
                          <div key={el.id} className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm">{elType?.label} — {el.roomName}</span>
                            <span className="font-medium text-sm text-gold">
                              {el.costMin?.toLocaleString()} — {el.costMax?.toLocaleString()} ر.س
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center pt-2 font-bold">
                        <span>الإجمالي التقديري</span>
                        <span className="text-gold text-lg">
                          {(elements as DesignElementItem[]).reduce((sum, el) => sum + (el.costMin || 0), 0).toLocaleString()}
                          {" — "}
                          {(elements as DesignElementItem[]).reduce((sum, el) => sum + (el.costMax || 0), 0).toLocaleString()}
                          {" ر.س"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* مودال عرض التصميم */}
      <Dialog open={showDesignModal} onOpenChange={setShowDesignModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              تفاصيل التصميم
            </DialogTitle>
          </DialogHeader>
          {currentDesign && (
            <div className="space-y-4">
              {currentDesign.designConcept && (
                <div className="bg-gold/10 rounded-xl p-4 border border-gold/20">
                  <h4 className="font-semibold text-gold mb-2">مفهوم التصميم</h4>
                  <p className="text-sm text-foreground leading-relaxed">{currentDesign.designConcept}</p>
                </div>
              )}

              {currentDesign.colorPalette && currentDesign.colorPalette.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">لوحة الألوان</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentDesign.colorPalette.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <div
                          className="w-6 h-6 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div>
                          <div className="text-xs font-medium">{c.name}</div>
                          {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentDesign.specifications && Object.keys(currentDesign.specifications).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">المواصفات التفصيلية</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(currentDesign.specifications).map(([key, val]) => (
                      <div key={key} className="bg-muted/30 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">{key}</div>
                        <div className="text-sm font-medium">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentDesign.products && currentDesign.products.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">المنتجات المقترحة</h4>
                  <div className="space-y-2">
                    {currentDesign.products.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                        </div>
                        {p.priceMin && p.priceMax && (
                          <div className="text-sm font-medium text-gold">
                            {p.priceMin.toLocaleString()} — {p.priceMax.toLocaleString()} ر.س/{p.unit || "وحدة"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentDesign.totalCostMin && currentDesign.totalCostMax && (
                <div className="bg-gradient-to-r from-gold/10 to-beige/20 rounded-xl p-4 border border-gold/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">التكلفة الإجمالية التقديرية</span>
                    <span className="text-xl font-bold text-gold">
                      {currentDesign.totalCostMin.toLocaleString()} — {currentDesign.totalCostMax.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              )}

              {currentDesign.professionalNotes && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-700 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ملاحظات احترافية
                  </h4>
                  <p className="text-sm text-blue-800">{currentDesign.professionalNotes}</p>
                </div>
              )}

              {currentDesign.alternativeOptions && currentDesign.alternativeOptions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">خيارات بديلة</h4>
                  <div className="space-y-2">
                    {currentDesign.alternativeOptions.map((opt, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{opt.name}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                          {opt.costMin && opt.costMax && (
                            <div className="text-xs text-muted-foreground">
                              {opt.costMin.toLocaleString()} — {opt.costMax.toLocaleString()} ر.س
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button className="btn-gold flex-1" onClick={() => setShowDesignModal(false)}>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  تم
                </Button>
                <Button variant="outline" onClick={() => setShowDesignModal(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
