import { useState } from "react";
import { useAuth } from "@/components/AuthGate";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  FolderOpen, Home, Plus, Trash2, Eye, Sparkles, Loader2,
  Calendar, Layers, Ruler, ChevronLeft, X, CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STYLE_LABELS: Record<string, string> = {
  modern: "عصري",
  gulf: "خليجي",
  classic: "كلاسيكي",
  minimal: "مينيمال",
};

const STYLE_ICONS: Record<string, string> = {
  modern: "🏙️",
  gulf: "🕌",
  classic: "🏛️",
  minimal: "◻️",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  analyzed: "تم التحليل",
  completed: "مكتمل",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600 border-stone-200",
  analyzed: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

type Project = {
  id: number;
  name: string;
  description?: string | null;
  designStyle: "modern" | "gulf" | "classic" | "minimal";
  spaceType?: string | null;
  area?: number | null;
  status: "draft" | "analyzed" | "completed";
  createdAt: Date;
};

type Analysis = {
  id: number;
  imageUrl: string;
  designStyle: string;
  spaceType?: string | null;
  area?: number | null;
  analysisResult?: unknown;
  colorPalette?: unknown;
  totalCostMin?: number | null;
  totalCostMax?: number | null;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(num: number) {
  return num.toLocaleString("ar-SA") + " ر.س";
}

export default function ProjectsPage() {
  const { } = useAuth();
  const isAuthenticated = true;
  const loading = false;
  const [, navigate] = useLocation();
  const { t, dir } = useLanguage();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const utils = trpc.useUtils();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: analyses } = trpc.analyses.getByProject.useQuery(
    { projectId: selectedProject?.id ?? 0 },
    { enabled: !!selectedProject }
  );

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setShowCreateModal(false);
      setNewProjectName("");
      toast.success("تم إنشاء المشروع بنجاح");
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      if (selectedProject) setSelectedProject(null);
      toast.success("تم حذف المشروع");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }



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
            <button onClick={() => navigate("/analyze")} className="text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium">
              تحليل جديد
            </button>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <FolderOpen className="w-3 h-3 ml-1" />
              مشاريعي
            </Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedProject ? (
          /* ===== قائمة المشاريع ===== */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-stone-800">مشاريعي</h1>
                <p className="text-stone-500 text-sm mt-1">
                  {projects?.length || 0} مشروع محفوظ
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gold-gradient text-white px-5 py-2 rounded-xl font-bold shadow-md"
              >
                <Plus className="w-4 h-4 ml-1" />
                مشروع جديد
              </Button>
            </div>

            {projectsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="elegant-card p-5 h-40 shimmer" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project: Project) => (
                  <div key={project.id} className="elegant-card p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{STYLE_ICONS[project.designStyle] || "🏠"}</span>
                        <div>
                          <h3 className="font-bold text-stone-800 text-sm leading-tight">{project.name}</h3>
                          {project.spaceType && (
                            <p className="text-xs text-stone-500">{project.spaceType}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {STYLE_LABELS[project.designStyle]}
                      </div>
                      {project.area && (
                        <div className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {project.area} م²
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedProject(project as Project)}
                        className="flex-1 gold-gradient text-white text-xs rounded-lg"
                      >
                        <Eye className="w-3 h-3 ml-1" />
                        عرض التفاصيل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("هل تريد حذف هذا المشروع؟")) {
                            deleteMutation.mutate({ id: project.id });
                          }
                        }}
                        className="border-red-200 text-red-500 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="elegant-card p-12 text-center bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FolderOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">لا توجد مشاريع بعد</h3>
                <p className="text-stone-500 text-sm mb-6">ابدأ بتحليل فضاءك الأول وسيُحفظ هنا تلقائياً</p>
                <Button
                  onClick={() => navigate("/analyze")}
                  className="gold-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  ابدأ التحليل
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ===== تفاصيل المشروع ===== */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-1 text-stone-500 hover:text-amber-700 transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                العودة للمشاريع
              </button>
              <span className="text-stone-300">/</span>
              <h1 className="font-bold text-stone-800">{selectedProject.name}</h1>
              <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[selectedProject.status]}`}>
                {STATUS_LABELS[selectedProject.status]}
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* معلومات المشروع */}
              <div className="space-y-5">
                <div className="elegant-card p-5">
                  <h2 className="font-bold text-stone-800 mb-4">تفاصيل المشروع</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">نمط التصميم</span>
                      <span className="font-semibold text-stone-800">
                        {STYLE_ICONS[selectedProject.designStyle]} {STYLE_LABELS[selectedProject.designStyle]}
                      </span>
                    </div>
                    {selectedProject.spaceType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">نوع الفضاء</span>
                        <span className="font-semibold text-stone-800">{selectedProject.spaceType}</span>
                      </div>
                    )}
                    {selectedProject.area && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">المساحة</span>
                        <span className="font-semibold text-stone-800">{selectedProject.area} م²</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">تاريخ الإنشاء</span>
                      <span className="font-semibold text-stone-800">{formatDate(selectedProject.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/analyze")}
                  className="w-full gold-gradient text-white py-3 rounded-xl font-bold"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة تحليل جديد
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("هل تريد حذف هذا المشروع؟")) {
                      deleteMutation.mutate({ id: selectedProject.id });
                    }
                  }}
                  className="w-full border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف المشروع
                </Button>
              </div>

              {/* التحليلات */}
              <div className="lg:col-span-2">
                <h2 className="font-bold text-stone-800 mb-4">
                  التحليلات ({analyses?.length || 0})
                </h2>

                {!analyses ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="elegant-card p-5 h-32 shimmer" />
                    ))}
                  </div>
                ) : analyses.length > 0 ? (
                  <div className="space-y-4">
                    {analyses.map((analysis: typeof analyses[number]) => {
                      const result = analysis.analysisResult as Record<string, unknown> | null;
                      const colors = analysis.colorPalette as Array<{ hex: string; name: string }> | null;
                      return (
                        <div key={analysis.id} className="elegant-card p-5">
                          <div className="flex gap-4">
                            {analysis.imageUrl && (
                              <img
                                src={analysis.imageUrl}
                                alt="صورة التحليل"
                                className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                  {STYLE_ICONS[analysis.designStyle]} {STYLE_LABELS[analysis.designStyle]}
                                </Badge>
                                {analysis.spaceType && (
                                  <span className="text-xs text-stone-500">{analysis.spaceType}</span>
                                )}
                                {analysis.area && (
                                  <span className="text-xs text-stone-500">{analysis.area} م²</span>
                                )}
                              </div>

                              {result?.overview != null && (
                                <p className="text-sm text-stone-600 line-clamp-2 mb-3">
                                  {(result.overview as string)}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex gap-1.5">
                                  {colors?.slice(0, 5).map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-6 h-6 rounded-md border border-white shadow-sm"
                                      style={{ backgroundColor: color.hex }}
                                      title={color.name}
                                    />
                                  ))}
                                </div>
                                {(analysis.totalCostMin && analysis.totalCostMax) && (
                                  <span className="text-xs font-bold text-amber-700">
                                    {formatCurrency(analysis.totalCostMin)} - {formatCurrency(analysis.totalCostMax)}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-stone-400 mt-2">{formatDate(analysis.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="elegant-card p-8 text-center bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <p className="text-stone-600 text-sm mb-4">لا توجد تحليلات لهذا المشروع بعد</p>
                    <Button
                      onClick={() => navigate("/analyze")}
                      className="gold-gradient text-white px-6 py-2 rounded-xl font-bold"
                    >
                      <Sparkles className="w-4 h-4 ml-2" />
                      ابدأ التحليل
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* مودال إنشاء مشروع */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={dir}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-stone-800 text-lg">إنشاء مشروع جديد</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-2">اسم المشروع</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="مثال: غرفة معيشة منزل الرياض"
                  className="w-full border border-amber-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => createMutation.mutate({ name: newProjectName || "مشروع جديد" })}
                  disabled={createMutation.isPending}
                  className="flex-1 gold-gradient text-white rounded-xl font-bold"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-stone-200 text-stone-600"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
