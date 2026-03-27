import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/components/AuthGate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home, Layers, Square, Circle, Lightbulb, DoorOpen, Sofa, Eye,
  Download, Share2, ArrowRight, CheckCircle, Clock, Image as ImageIcon,
  FileText, BarChart3, Palette, Package, Loader2, Box, Table
} from "lucide-react";
import { Link, useRoute } from "wouter";
import Room3DViewer from "@/components/Room3DViewer";
import { generatePDFReport } from "@/lib/pdfReport";
import { generateBOQExcel } from "@/lib/excelBOQ";
import { useLanguage } from "@/contexts/LanguageContext";

const ELEMENT_TYPES: Record<string, { label: string; color: string }> = {
  flooring: { label: "الأرضيات", color: "bg-amber-100 text-amber-700" },
  walls: { label: "الجدران", color: "bg-blue-100 text-blue-700" },
  ceiling: { label: "الأسقف", color: "bg-purple-100 text-purple-700" },
  windows: { label: "النوافذ والستائر", color: "bg-green-100 text-green-700" },
  doors: { label: "الأبواب", color: "bg-orange-100 text-orange-700" },
  lighting: { label: "الإضاءة", color: "bg-yellow-100 text-yellow-700" },
  furniture: { label: "الأثاث", color: "bg-rose-100 text-rose-700" },
  perspective: { label: "منظور", color: "bg-indigo-100 text-indigo-700" },
};

const STYLE_LABELS: Record<string, string> = {
  modern: "عصري حديث", gulf: "خليجي أصيل", classic: "كلاسيكي فاخر",
  minimal: "مينيمال", japanese: "ياباني زن", scandinavian: "سكندنافي",
  mediterranean: "متوسطي", industrial: "صناعي", moroccan: "مغربي",
  art_deco: "آرت ديكو", tropical: "استوائي", luxury: "فاخر بريميوم",
  bohemian: "بوهيمي", farmhouse: "ريفي", coastal: "ساحلي",
  indian: "هندي", chinese: "صيني كلاسيكي", neoclassical: "نيوكلاسيكي",
  eclectic: "انتقائي", contemporary: "معاصر مختلط",
};

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

interface ProjectData {
  id: number;
  name: string;
  description?: string | null;
  projectType?: string | null;
  designStyle?: string | null;
  totalArea?: number | null;
  status?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt?: Date | null;
}

export default function ProjectDetail() {
  const { t, dir } = useLanguage();
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? Number(params.id) : null;
  const { } = useAuth();
  const isAuthenticated = true;
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingMoodboard, setIsGeneratingMoodboard] = useState(false);

  const { data: project } = trpc.projects.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId && isAuthenticated }
  );
  const { data: elements } = trpc.designElements.getByProject.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && isAuthenticated }
  );
  const { data: perspectives } = trpc.perspectives.getByProject.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && isAuthenticated }
  );

  const { data: moodboards } = trpc.moodboard.getByProject.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && isAuthenticated }
  );

  const generateMoodboardMutation = trpc.moodboard.generate.useMutation({
    onSuccess: () => { setIsGeneratingMoodboard(false); toast.success("تم توليد لوحة الإلهام!"); },
    onError: (e) => { setIsGeneratingMoodboard(false); toast.error("خطأ: " + e.message); },
  });

  const handleDownloadPDF = async () => {
    if (!typedProject) return;
    setIsGeneratingPDF(true);
    try {
      const allColors: Array<{ hex: string; name: string; usage: string }> = [];
      typedElements?.forEach(el => {
        const specs = el.specifications as DesignResult | null;
        specs?.colorPalette?.forEach(c => {
          if (!allColors.find(ac => ac.hex === c.hex)) {
            allColors.push({ hex: c.hex, name: c.name, usage: el.roomName });
          }
        });
      });
      const allProducts: Array<{ name: string; quantity?: number; material?: string; priceRange?: string }> = [];
      typedElements?.forEach(el => {
        const specs = el.specifications as DesignResult | null;
        specs?.products?.forEach(p => {
          allProducts.push({ name: p.name, quantity: p.quantity, material: undefined, priceRange: p.priceMin ? `${p.priceMin}-${p.priceMax} ر.س` : undefined });
        });
      });
      await generatePDFReport({
        name: typedProject.name,
        designStyle: typedProject.designStyle || "modern",
        spaceType: typedProject.projectType || undefined,
        area: typedProject.totalArea || undefined,
        colorPalette: allColors,
        furniture: allProducts,
        totalCostMin: totalCostMin || undefined,
        totalCostMax: totalCostMax || undefined,
        perspectives: typedPerspectives?.map(p => ({ imageUrl: p.imageUrl || undefined, roomName: p.roomName, description: p.description || undefined })),
      });
      toast.success("تم تنزيل تقرير PDF بنجاح!");
    } catch { toast.error("خطأ في توليد PDF"); }
    finally { setIsGeneratingPDF(false); }
  };

  const handleDownloadExcel = async () => {
    if (!typedProject) return;
    setIsGeneratingExcel(true);
    try {
      const allProducts: Array<{ name: string; quantity?: number; material?: string; priceRange?: string }> = [];
      typedElements?.forEach(el => {
        const specs = el.specifications as DesignResult | null;
        specs?.products?.forEach(p => {
          allProducts.push({ name: p.name, quantity: p.quantity, priceRange: p.priceMin ? `${p.priceMin}-${p.priceMax} ر.س` : undefined });
        });
      });
      generateBOQExcel({
        projectName: typedProject.name,
        designStyle: typedProject.designStyle || "modern",
        spaceType: typedProject.projectType || undefined,
        area: typedProject.totalArea || undefined,
        furniture: allProducts,
        totalCostMin: totalCostMin || undefined,
        totalCostMax: totalCostMax || undefined,
      });
      toast.success("تم تنزيل جدول الكميات بنجاح!");
    } catch { toast.error("خطأ في توليد Excel"); }
    finally { setIsGeneratingExcel(false); }
  };

  const handleGenerateMoodboard = () => {
    if (!typedProject) return;
    setIsGeneratingMoodboard(true);
    generateMoodboardMutation.mutate({
      designStyle: typedProject.designStyle || "modern",
      spaceType: typedProject.projectType || "living_room",
      projectId: typedProject.id,
    });
  };

  const typedProject = project as ProjectData | undefined;
  const typedElements = elements as DesignElementItem[] | undefined;
  const typedPerspectives = perspectives as PerspectiveItem[] | undefined;
  const typedMoodboards = moodboards as Array<{
    id: number; title: string; description?: string | null;
    colorPalette?: unknown; materials?: unknown; images?: unknown;
  }> | undefined;

  const completedCount = typedElements?.filter(e => e.isCompleted).length || 0;
  const totalCount = typedElements?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const totalCostMin = typedElements?.reduce((s, e) => s + (e.costMin || 0), 0) || 0;
  const totalCostMax = typedElements?.reduce((s, e) => s + (e.costMax || 0), 0) || 0;

  // تجميع العناصر حسب الغرفة
  const roomsMap: Record<string, DesignElementItem[]> = {};
  typedElements?.forEach(el => {
    if (!roomsMap[el.roomName]) roomsMap[el.roomName] = [];
    roomsMap[el.roomName].push(el);
  });

  // تجميع كل الألوان من جميع العناصر
  const allColors: Array<{ hex: string; name: string; role?: string; room: string }> = [];
  typedElements?.forEach(el => {
    const specs = el.specifications as DesignResult | null;
    specs?.colorPalette?.forEach(c => {
      if (!allColors.find(ac => ac.hex === c.hex)) {
        allColors.push({ ...c, room: el.roomName });
      }
    });
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">يرجى تسجيل الدخول</p>
          <Link href="/"><Button className="btn-gold">الرئيسية</Button></Link>
        </Card>
      </div>
    );
  }

  if (!typedProject) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل المشروع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B6914] to-[#C9A84C] text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <Link href="/projects">
                  <span className="hover:text-white cursor-pointer">مشاريعي</span>
                </Link>
                <ArrowRight className="w-3 h-3" />
                <span>{typedProject.name}</span>
              </div>
              <h1 className="text-2xl font-bold">{typedProject.name}</h1>
              {typedProject.description && (
                <p className="text-white/80 text-sm mt-1">{typedProject.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {typedProject.designStyle && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {STYLE_LABELS[typedProject.designStyle] || typedProject.designStyle}
                  </Badge>
                )}
                {typedProject.projectType && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {typedProject.projectType}
                  </Badge>
                )}
                {typedProject.totalArea && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {typedProject.totalArea} م²
                  </Badge>
                )}
                <Badge className={`${
                  typedProject.status === "completed" ? "bg-green-500" :
                  typedProject.status === "in_progress" ? "bg-blue-500" : "bg-gray-500"
                } text-white border-0`}>
                  {typedProject.status === "completed" ? "مكتمل" :
                   typedProject.status === "in_progress" ? "قيد التنفيذ" : "مسودة"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/studio`}>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Layers className="w-4 h-4 ml-2" />
                  استوديو التصميم
                </Button>
              </Link>
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="mt-4 bg-white/10 rounded-xl p-3">
            <div className="flex justify-between text-sm mb-1">
              <span>تقدم التصميم</span>
              <span>{completedCount}/{totalCount} عنصر مكتمل</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-gold">{totalCount}</div>
              <div className="text-xs text-muted-foreground">عنصر مصمم</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-xs text-muted-foreground">مكتمل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{typedPerspectives?.length || 0}</div>
              <div className="text-xs text-muted-foreground">منظور تصوري</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-lg font-bold text-gold">
                {totalCostMin > 0 ? `${(totalCostMin / 1000).toFixed(0)}K` : "—"}
              </div>
              <div className="text-xs text-muted-foreground">تكلفة تقديرية (ر.س)</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="elements">العناصر</TabsTrigger>
              <TabsTrigger value="gallery">المعرض</TabsTrigger>
              <TabsTrigger value="3d" className="flex items-center gap-1"><Box className="w-3 h-3" />ثلاثي الأبعاد</TabsTrigger>
              <TabsTrigger value="moodboard" className="flex items-center gap-1"><Palette className="w-3 h-3" />لوحة الإلهام</TabsTrigger>
              <TabsTrigger value="costs">التكاليف</TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1"><FileText className="w-3 h-3" />التقارير</TabsTrigger>
            </TabsList>
          </div>

          {/* نظرة عامة */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* الغرف */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="w-4 h-4 text-gold" />
                    الغرف والفضاءات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(roomsMap).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(roomsMap).map(([room, roomElements]) => {
                        const completed = roomElements.filter(e => e.isCompleted).length;
                        const total = roomElements.length;
                        return (
                          <div key={room} className="p-3 bg-muted/30 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{room}</span>
                              <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                            </div>
                            <Progress value={(completed / total) * 100} className="h-1.5 mb-2" />
                            <div className="flex flex-wrap gap-1">
                              {roomElements.map(el => (
                                <Badge
                                  key={el.id}
                                  variant="outline"
                                  className={`text-xs ${ELEMENT_TYPES[el.elementType]?.color || ""} ${el.isCompleted ? "opacity-100" : "opacity-60"}`}
                                >
                                  {el.isCompleted && <CheckCircle className="w-2 h-2 ml-1" />}
                                  {ELEMENT_TYPES[el.elementType]?.label || el.elementType}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Home className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground text-sm">لم يتم تصميم أي غرفة بعد</p>
                      <Link href="/studio">
                        <Button size="sm" className="btn-gold mt-3">ابدأ التصميم</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* لوحة الألوان */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="w-4 h-4 text-gold" />
                    لوحة الألوان الكاملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allColors.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {allColors.slice(0, 12).map((c, i) => (
                        <div key={i} className="text-center">
                          <div
                            className="w-full h-12 rounded-lg border border-border shadow-sm mb-1"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div className="text-xs font-medium truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.hex}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Palette className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground text-sm">ستظهر الألوان بعد التصميم</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* المناظير الأخيرة */}
              {typedPerspectives && typedPerspectives.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="w-4 h-4 text-gold" />
                      أحدث المناظير التصورية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {typedPerspectives.slice(0, 6).map(p => (
                        <div key={p.id} className="relative rounded-xl overflow-hidden border border-border group">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.roomName}
                              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-36 bg-muted flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <div className="text-white text-xs font-medium">{p.roomName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* العناصر */}
          <TabsContent value="elements">
            <div className="space-y-4">
              {typedElements && typedElements.length > 0 ? (
                Object.entries(roomsMap).map(([room, roomElements]) => (
                  <Card key={room}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="w-4 h-4 text-gold" />
                        {room}
                        <Badge variant="outline">{roomElements.length} عنصر</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roomElements.map(el => {
                          const specs = el.specifications as DesignResult | null;
                          const elType = ELEMENT_TYPES[el.elementType];
                          return (
                            <div
                              key={el.id}
                              className={`p-4 rounded-xl border ${el.isCompleted ? "bg-green-50/50 border-green-200" : "bg-card border-border"}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${elType?.color || "bg-gray-100 text-gray-700"}`}>
                                    {elType?.label || el.elementType}
                                  </Badge>
                                  {el.isCompleted && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                {el.costMin && el.costMax && (
                                  <span className="text-xs font-medium text-gold">
                                    {el.costMin.toLocaleString()} — {el.costMax.toLocaleString()} ر.س
                                  </span>
                                )}
                              </div>
                              {specs?.designConcept && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {specs.designConcept}
                                </p>
                              )}
                              {specs?.colorPalette && specs.colorPalette.length > 0 && (
                                <div className="flex gap-1">
                                  {specs.colorPalette.slice(0, 5).map((c, i) => (
                                    <div
                                      key={i}
                                      className="w-5 h-5 rounded-full border border-border"
                                      style={{ backgroundColor: c.hex }}
                                      title={c.name}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">لا توجد عناصر مصممة بعد</p>
                  <Link href="/studio">
                    <Button className="btn-gold mt-4">ابدأ التصميم</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* المعرض */}
          <TabsContent value="gallery">
            {typedPerspectives && typedPerspectives.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedPerspectives.map(p => (
                  <div key={p.id} className="group relative rounded-2xl overflow-hidden border border-border hover:border-gold/40 transition-all hover:shadow-lg">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.roomName}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-56 bg-muted flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="text-white font-medium">{p.roomName}</div>
                      {p.designStyle && (
                        <div className="text-white/70 text-xs">{STYLE_LABELS[p.designStyle] || p.designStyle}</div>
                      )}
                    </div>
                    {p.imageUrl && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={p.imageUrl} download target="_blank" rel="noreferrer">
                          <Button size="sm" className="bg-black/60 text-white hover:bg-black/80 h-7 w-7 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">لا توجد مناظير تصورية بعد</p>
                <Link href="/studio">
                  <Button className="btn-gold mt-4">توليد منظور</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* المخطط ثلاثي الأبعاد */}
          <TabsContent value="3d">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Box className="w-4 h-4 text-gold" />
                  المخطط ثلاثي الأبعاد التفاعلي
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Room3DViewer
                  dimensions={{ width: 6, length: 8, height: 3 }}
                  designStyle={typedProject?.designStyle || "modern"}
                  roomName={typedProject?.name}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* لوحة الإلهام */}
          <TabsContent value="moodboard">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-gold">لوحات الإلهام</h2>
                <Button size="sm" onClick={handleGenerateMoodboard} disabled={isGeneratingMoodboard} className="btn-gold text-xs">
                  {isGeneratingMoodboard ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Palette className="w-3 h-3 ml-1" />}
                  توليد لوحة جديدة
                </Button>
              </div>
              {typedMoodboards && typedMoodboards.length > 0 ? (
                typedMoodboards.map((mb, i) => {
                  const palette = mb.colorPalette as { name: string; colors: string[]; description?: string } | null;
                  const items = mb.materials as Array<{ type: string; title: string; description: string; color?: string }> | null;
                  const images = mb.images as string[] | null;
                  return (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-gold">{mb.title}</CardTitle>
                        {mb.description && <p className="text-muted-foreground text-sm">{mb.description}</p>}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {palette && (
                          <div>
                            <p className="text-sm font-medium mb-2">{palette.name}</p>
                            <div className="flex gap-2">
                              {palette.colors.map((c, ci) => (
                                <div key={ci} className="flex-1 h-12 rounded-lg border border-border" style={{ backgroundColor: c }} title={c} />
                              ))}
                            </div>
                            {palette.description && <p className="text-xs text-muted-foreground mt-1">{palette.description}</p>}
                          </div>
                        )}
                        {items && items.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {items.map((item, ii) => (
                              <div key={ii} className="p-3 rounded-xl border border-border bg-muted/30">
                                {item.color && <div className="w-full h-8 rounded mb-2" style={{ backgroundColor: item.color }} />}
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {images && images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {images.map((url, ii) => (
                              <img key={ii} src={url} alt={`إلهام ${ii+1}`} className="rounded-xl w-full aspect-video object-cover" />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <Palette className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground mb-4">لا توجد لوحات إلهام بعد</p>
                  <Button onClick={handleGenerateMoodboard} disabled={isGeneratingMoodboard} className="btn-gold">
                    {isGeneratingMoodboard ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Palette className="w-4 h-4 ml-2" />}
                    توليد لوحة الإلهام الأولى
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* التكاليف */}
          <TabsContent value="costs">
            <div className="space-y-4">
              {/* ملخص التكاليف */}
              <Card className="bg-gradient-to-r from-gold/10 to-beige/20 border-gold/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-gold">
                        {totalCostMin.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">الحد الأدنى (ر.س)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gold">
                        {Math.round((totalCostMin + totalCostMax) / 2).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">المتوسط التقديري (ر.س)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gold">
                        {totalCostMax.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">الحد الأقصى (ر.س)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* تفاصيل التكاليف */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="w-4 h-4 text-gold" />
                    تفاصيل التكاليف حسب العنصر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typedElements?.filter(el => el.costMin || el.costMax).map(el => {
                      const elType = ELEMENT_TYPES[el.elementType];
                      const maxTotal = totalCostMax || 1;
                      const elMax = el.costMax || 0;
                      const barWidth = Math.min((elMax / maxTotal) * 100, 100);
                      return (
                        <div key={el.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{elType?.label || el.elementType} — {el.roomName}</span>
                            <span className="font-medium text-gold">
                              {el.costMin?.toLocaleString()} — {el.costMax?.toLocaleString()} ر.س
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-[#C9A84C] rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* المنتجات المقترحة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-gold" />
                    المنتجات والمواد المقترحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typedElements?.flatMap(el => {
                      const specs = el.specifications as DesignResult | null;
                      return (specs?.products || []).map((p, i) => ({
                        ...p,
                        room: el.roomName,
                        elementType: el.elementType,
                        key: `${el.id}-${i}`,
                      }));
                    }).slice(0, 20).map(p => (
                      <div key={p.key} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.brand && `${p.brand} — `}
                            {p.room} — {ELEMENT_TYPES[p.elementType]?.label}
                          </div>
                        </div>
                        {p.priceMin && p.priceMax && (
                          <div className="text-sm font-medium text-gold text-left">
                            {p.priceMin.toLocaleString()} — {p.priceMax.toLocaleString()} ر.س/{p.unit || "وحدة"}
                          </div>
                        )}
                      </div>
                    ))}
                    {!typedElements?.some(el => (el.specifications as DesignResult | null)?.products?.length) && (
                      <div className="text-center py-8">
                        <Package className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-muted-foreground text-sm">ستظهر المنتجات بعد التصميم</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* التقارير */}
          <TabsContent value="reports">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="hover:border-gold/40 transition-colors cursor-pointer" onClick={handleDownloadPDF}>
                  <CardContent className="pt-6 text-center">
                    {isGeneratingPDF ? <Loader2 className="w-8 h-8 mx-auto text-gold animate-spin mb-3" /> : <FileText className="w-8 h-8 mx-auto text-gold mb-3" />}
                    <h3 className="font-bold mb-1">تقرير PDF الكامل</h3>
                    <p className="text-sm text-muted-foreground mb-3">جميع التفاصيل والمواصفات والألوان والتكاليف</p>
                    <Button className="btn-gold w-full" disabled={isGeneratingPDF}>
                      {isGeneratingPDF ? "جاري التوليد..." : "تنزيل PDF"}
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:border-gold/40 transition-colors cursor-pointer" onClick={handleDownloadExcel}>
                  <CardContent className="pt-6 text-center">
                    {isGeneratingExcel ? <Loader2 className="w-8 h-8 mx-auto text-green-600 animate-spin mb-3" /> : <Table className="w-8 h-8 mx-auto text-green-600 mb-3" />}
                    <h3 className="font-bold mb-1">جدول الكميات BOQ</h3>
                    <p className="text-sm text-muted-foreground mb-3">Excel جاهز للمقاولين والموردين</p>
                    <Button variant="outline" className="w-full border-green-600/30 text-green-600 hover:bg-green-50" disabled={isGeneratingExcel}>
                      {isGeneratingExcel ? "جاري التوليد..." : "تنزيل Excel"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground text-center">يتم توليد التقارير مباشرة من بيانات المشروع المحفوظة في قاعدة البيانات.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
