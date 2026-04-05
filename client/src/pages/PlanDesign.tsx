import { useState, useRef, useCallback, lazy, Suspense } from "react";
const ThreeJSViewer = lazy(() => import("@/components/ThreeJSViewer"));
import { useLocation } from "wouter";
import {
  ChevronLeft, Upload, FileText, Sparkles, CheckCircle, AlertCircle,
  Loader2, Building2, Home, Briefcase, Coins, Image as ImageIcon,
  RefreshCw, Download, Eye, ChevronDown, ChevronUp, Layers,
  DoorOpen, Square, ArrowUp
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// أنواع المشاريع
const PROJECT_TYPES = [
  { id: "residential", icon: Home, label: "سكني", labelEn: "Residential", desc: "فيلا، شقة، دوبلكس" },
  { id: "commercial", icon: Briefcase, label: "تجاري", labelEn: "Commercial", desc: "مكتب، محل، مطعم" },
  { id: "mixed", icon: Building2, label: "مختلط", labelEn: "Mixed Use", desc: "سكني + تجاري" },
];

// أنماط التصميم مع ألوان
const STYLES = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "gulf", label: "خليجي", emoji: "🕌" },
  { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
  { id: "minimal", label: "مينيمال", emoji: "◻️" },
  { id: "luxury", label: "فاخر", emoji: "✨" },
];

// أيقونات أنواع الغرف
const ROOM_ICONS: Record<string, string> = {
  bedroom: "🛏️", living: "🛋️", kitchen: "🍳", bathroom: "🚿",
  dining: "🍽️", office: "💼", corridor: "🚪", entrance: "🏠",
  storage: "📦", balcony: "🌿", majlis: "🪑", prayer: "🕌",
  elevator: "🛗", staircase: "🪜", laundry: "🫧", garage: "🚗",
  outdoor: "🌳", hall: "🏛️", closet: "👗", room: "🏠",
};

const CREDITS_PER_ROOM = 50;

interface RoomDoor {
  wall?: string;
  openDirection?: string;
  hingesSide?: string;
  width?: number;
  type?: string;
}

interface RoomWindow {
  wall?: string;
  width?: number;
  height?: number;
  type?: string;
}

interface RoomResult {
  name: string;
  type: string;
  area: number;
  dimensions: string;
  floor?: string;
  ceilingHeight?: number;
  doors?: RoomDoor[];
  windows?: RoomWindow[];
  wallsDescription?: string;
  staircaseShape?: string | null;
  staircaseDirection?: string | null;
  elevatorOpeningDirection?: string | null;
  balconyOrientation?: string | null;
  balconyCovered?: boolean | null;
}

interface PlanAnalysisResult {
  projectType: string;
  totalArea: number;
  rooms: RoomResult[];
  floors: number;
  summary: string;
  recommendations: string[];
}

interface RoomDesignResult {
  roomName: string;
  roomType: string;
  imageUrl: string;
  creditsCost: number;
  style: string;
}

// مكوّن بطاقة الغرفة مع التفاصيل المعمارية
function RoomCard({
  room,
  isSelected,
  onToggle,
  onDesign,
  isDesigning,
}: {
  room: RoomResult;
  isSelected: boolean;
  onToggle: () => void;
  onDesign: () => void;
  isDesigning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const icon = ROOM_ICONS[room.type] || "🏠";
  const floorLabel: Record<string, string> = { ground: "الأرضي", first: "الأول", second: "الثاني", third: "الثالث" };

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${isSelected ? "border-[#C9A84C]" : "border-[#e8d9c0]"}`}>
      {/* الصف الرئيسي */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? "border-[#C9A84C] bg-[#C9A84C]" : "border-[#e8d9c0]"}`}
        >
          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
        </button>

        <span className="text-xl">{icon}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#5C3D11] truncate">{room.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-[#8B6914]/70">{room.dimensions || "—"}</p>
            {room.area > 0 && <span className="text-xs text-[#8B6914]/70">• {room.area} م²</span>}
            {room.floor && <span className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-1.5 py-0.5 rounded-full">{floorLabel[room.floor] || room.floor}</span>}
            {room.ceilingHeight && room.ceilingHeight > 0 && (
              <span className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-1.5 py-0.5 rounded-full">↕ {room.ceilingHeight}م</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* زر التوسيع */}
          {(room.doors?.length || room.windows?.length || room.wallsDescription) ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-[#f0e8d8] text-[#8B6914]"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : null}
          <button
            onClick={onDesign}
            disabled={isDesigning}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {isDesigning ? <Loader2 className="w-3 h-3 animate-spin" /> : "صمّم"}
          </button>
        </div>
      </div>

      {/* التفاصيل المعمارية */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#f0e8d8] pt-3">
          {room.doors && room.doors.length > 0 && (
            <div className="flex items-start gap-2">
              <DoorOpen className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#5C3D11] mb-0.5">الأبواب</p>
                {room.doors.map((d, i) => (
                  <p key={i} className="text-[10px] text-[#8B6914]/70">
                    باب {i + 1}: جدار {d.wall || "—"} — عرض {d.width || "—"}م — {d.openDirection === "sliding" ? "منزلق" : d.openDirection === "inward" ? "يفتح للداخل" : "يفتح للخارج"}
                  </p>
                ))}
              </div>
            </div>
          )}
          {room.windows && room.windows.length > 0 && (
            <div className="flex items-start gap-2">
              <Square className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#5C3D11] mb-0.5">النوافذ</p>
                {room.windows.map((w, i) => (
                  <p key={i} className="text-[10px] text-[#8B6914]/70">
                    نافذة {i + 1}: جدار {w.wall || "—"} — {w.width || "—"}م × {w.height || "—"}م — {w.type === "panoramic" || w.type === "floor_to_ceiling" ? "بانورامية" : "عادية"}
                  </p>
                ))}
              </div>
            </div>
          )}
          {room.staircaseShape && (
            <div className="flex items-start gap-2">
              <ArrowUp className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#8B6914]/70">شكل الدرج: {room.staircaseShape} — {room.staircaseDirection || ""}</p>
            </div>
          )}
          {room.balconyOrientation && (
            <div className="flex items-start gap-2">
              <Layers className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#8B6914]/70">
                شرفة {room.balconyOrientation} — {room.balconyCovered ? "مغطاة" : "مكشوفة"}
              </p>
            </div>
          )}
          {room.wallsDescription && (
            <p className="text-[10px] text-[#8B6914]/60 leading-relaxed border-t border-[#f0e8d8] pt-2">{room.wallsDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlanDesign() {
  const [, navigate] = useLocation();
  const { dir } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "config" | "analyzing" | "results" | "designing">("upload");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [projectType, setProjectType] = useState("residential");
  const [designStyle, setDesignStyle] = useState("modern");
  const [analysisResult, setAnalysisResult] = useState<PlanAnalysisResult | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [roomDesigns, setRoomDesigns] = useState<Record<string, RoomDesignResult>>({});
  const [designingRoom, setDesigningRoom] = useState<string | null>(null);
  const [isAllDone, setIsAllDone] = useState(false);
  const [activeTab, setActiveTab] = useState<"rooms" | "recommendations" | "3d">("rooms");
  const [show3D, setShow3D] = useState(false);

  const queueRef = useRef<RoomResult[]>([]);
  const utils = trpc.useUtils();

  const analyzePlanMutation = trpc.analyzePlan.useMutation({
    onSuccess: (data: PlanAnalysisResult) => {
      setAnalysisResult(data);
      setSelectedRooms(data.rooms.map((r: RoomResult) => r.name));
      setStep("results");
    },
    onError: (err: { message?: string }) => {
      toast.error("حدث خطأ في تحليل المخطط: " + (err.message || "يرجى المحاولة مرة أخرى"));
      setStep("config");
    },
  });

  const generateNextRoom = useCallback((room: RoomResult, style: string, pType: string) => {
    setDesigningRoom(room.name);
    utils.client.generatePlanRoomDesign.mutate({
      roomName: room.name || "غرفة",
      roomType: room.type || "room",
      roomArea: typeof room.area === "number" ? room.area : 0,
      roomDimensions: room.dimensions || "غير محدد",
      designStyle: style,
      projectType: pType,
      ceilingHeight: room.ceilingHeight ?? 3,
      wallsDescription: room.wallsDescription ?? "",
      doors: room.doors ?? [],
      windows: room.windows ?? [],
      staircaseShape: room.staircaseShape ?? null,
      staircaseDirection: room.staircaseDirection ?? null,
      elevatorOpeningDirection: room.elevatorOpeningDirection ?? null,
      balconyOrientation: room.balconyOrientation ?? null,
      balconyCovered: room.balconyCovered ?? null,
    }).then((data: RoomDesignResult) => {
      setRoomDesigns(prev => ({ ...prev, [data.roomName]: data }));
      queueRef.current = queueRef.current.slice(1);
      if (queueRef.current.length > 0) {
        generateNextRoom(queueRef.current[0], style, pType);
      } else {
        setDesigningRoom(null);
        setIsAllDone(true);
        toast.success("اكتملت جميع التصاميم! 🎉");
      }
    }).catch((err: { message?: string }) => {
      toast.error("خطأ في تصميم الغرفة: " + (err?.message || ""));
      setDesigningRoom(null);
      queueRef.current = [];
    });
  }, [utils.client]);

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

  const startDesigning = (rooms: RoomResult[]) => {
    if (rooms.length === 0) { toast.error("اختر غرفة واحدة على الأقل"); return; }
    setIsAllDone(false);
    queueRef.current = rooms;
    setStep("designing");
    generateNextRoom(rooms[0], designStyle, projectType);
  };

  const handleDesignAll = () => {
    if (!analysisResult) return;
    const roomsToDesign = analysisResult.rooms.filter(r => selectedRooms.includes(r.name));
    startDesigning(roomsToDesign);
  };

  const handleDesignSingle = (room: RoomResult) => startDesigning([room]);

  const handleRedesign = (room: RoomResult) => {
    setIsAllDone(false);
    queueRef.current = [room];
    setDesigningRoom(room.name);
    utils.client.generatePlanRoomDesign.mutate({
      roomName: room.name || "غرفة",
      roomType: room.type || "room",
      roomArea: typeof room.area === "number" ? room.area : 0,
      roomDimensions: room.dimensions || "غير محدد",
      designStyle,
      projectType,
      ceilingHeight: room.ceilingHeight ?? 3,
      wallsDescription: room.wallsDescription ?? "",
      doors: room.doors ?? [],
      windows: room.windows ?? [],
      staircaseShape: room.staircaseShape ?? null,
      staircaseDirection: room.staircaseDirection ?? null,
      elevatorOpeningDirection: room.elevatorOpeningDirection ?? null,
      balconyOrientation: room.balconyOrientation ?? null,
      balconyCovered: room.balconyCovered ?? null,
    }).then((data: RoomDesignResult) => {
      setRoomDesigns(prev => ({ ...prev, [data.roomName]: data }));
      setDesigningRoom(null);
      queueRef.current = [];
      toast.success(`تم إعادة تصميم ${room.name} ✨`);
    }).catch((err: { message?: string }) => {
      toast.error("خطأ في إعادة التصميم: " + (err?.message || ""));
      setDesigningRoom(null);
      queueRef.current = [];
    });
  };

  const handleDownloadImage = (imageUrl: string, roomName: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `تصميم-${roomName}.jpg`;
    link.target = "_blank";
    link.click();
  };

  const totalSelectedCost = selectedRooms.length * CREDITS_PER_ROOM;
  const completedCount = Object.keys(roomDesigns).length;

  // الخطوات
  const steps = ["رفع المخطط", "الإعدادات", "التحليل", "التصاميم"];
  const currentStepIndex = step === "upload" ? 0 : step === "config" ? 1 : step === "analyzing" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-white/90 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-10">
        <button
          onClick={() => {
            if (step === "designing") { setStep("results"); return; }
            if (step === "results") { setStep("config"); return; }
            if (step === "config") { setStep("upload"); return; }
            navigate("/");
          }}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="text-center">
          <p className="text-base font-black text-[#5C3D11]">صمّم من المخطط</p>
          <p className="text-xs text-[#8B6914]/70">تحليل معماري + تصاميم بالذكاء الاصطناعي</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress Bar */}
      <div className="px-5 pt-4 pb-2 bg-white/50">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStepIndex ? "bg-[#C9A84C] text-white" :
                i === currentStepIndex ? "bg-gradient-to-br from-[#C9A84C] to-[#8B6914] text-white shadow-md" :
                "bg-[#e8d9c0] text-[#8B6914]/50"
              }`}>
                {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${i < currentStepIndex ? "bg-[#C9A84C]" : "bg-[#e8d9c0]"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((s, i) => (
            <p key={s} className={`text-[9px] font-bold ${i === currentStepIndex ? "text-[#C9A84C]" : "text-[#8B6914]/40"}`}>{s}</p>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* ── الخطوة 1: رفع المخطط ── */}
        {step === "upload" && (
          <div className="space-y-5">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[#C9A84C]/50 bg-white p-10 cursor-pointer active:scale-95 transition-transform hover:border-[#C9A84C] hover:bg-[#fdf9f3]"
              style={{ minHeight: 260 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center shadow-xl">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#5C3D11]">ارفع مخطط المشروع</p>
                <p className="text-sm text-[#8B6914]/70 mt-1">صورة أو PDF للمخطط المعماري</p>
                <p className="text-xs text-[#8B6914]/50 mt-1">اسحب وأفلت أو انقر للاختيار</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
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

            {/* بطاقات المزايا */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🏠", title: "استخراج الغرف", desc: "تحليل تلقائي لجميع الفضاءات" },
                { icon: "📐", title: "الأبعاد الدقيقة", desc: "أبعاد ومساحات وارتفاعات" },
                { icon: "🚪", title: "الأبواب والنوافذ", desc: "مواقع وأنواع الفتحات" },
                { icon: "🎨", title: "تصاميم فوتوريالستية", desc: "Imagen 4 + Gemini 2.5 Pro" },
              ].map(card => (
                <div key={card.title} className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-xs font-bold text-[#5C3D11] mt-2">{card.title}</p>
                  <p className="text-[10px] text-[#8B6914]/70 mt-0.5">{card.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#8B6914]/10 rounded-2xl p-4 border border-[#C9A84C]/30">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-[#C9A84C]" />
                <p className="text-sm font-bold text-[#5C3D11]">تكلفة النقاط</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-[#8B6914]/70">تحليل المخطط</span><span className="font-bold text-green-600">مجاني ✓</span></div>
                <div className="flex justify-between"><span className="text-[#8B6914]/70">تصميم كل غرفة</span><span className="font-bold text-[#C9A84C]">{CREDITS_PER_ROOM} نقطة</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── الخطوة 2: الإعدادات ── */}
        {step === "config" && (
          <div className="space-y-5">
            {filePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[#e8d9c0] bg-white shadow-sm">
                {filePreview.startsWith("data:image") ? (
                  <img src={filePreview} alt="مخطط" className="w-full max-h-52 object-contain" />
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
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
                >✕</button>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نوع المشروع</p>
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_TYPES.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => setProjectType(pt.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${projectType === pt.id ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-sm" : "border-[#e8d9c0] bg-white"}`}
                    >
                      <Icon className={`w-6 h-6 ${projectType === pt.id ? "text-[#C9A84C]" : "text-[#8B6914]/60"}`} />
                      <p className="text-xs font-bold text-[#5C3D11]">{pt.label}</p>
                      <p className="text-[9px] text-[#8B6914]/60 text-center">{pt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[#5C3D11] mb-3">نمط التصميم المطلوب</p>
              <div className="flex gap-2 flex-wrap">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDesignStyle(s.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${designStyle === s.id ? "bg-[#C9A84C] text-white shadow-md" : "bg-white border border-[#e8d9c0] text-[#8B6914]"}`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-3 border border-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">تحليل المخطط مجاني — النقاط تُستهلك فقط عند توليد التصاميم</p>
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                ابدأ تحليل المخطط (مجاني)
              </span>
            </button>
          </div>
        )}

        {/* ── الخطوة 3: التحليل ── */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] animate-pulse opacity-30" />
              <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C]/30 animate-spin" style={{ borderTopColor: "#C9A84C" }} />
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-[#5C3D11]">م. سارة تحلل مخططك</p>
              <p className="text-sm text-[#8B6914]/70">Gemini 2.5 Pro يستخرج التفاصيل المعمارية...</p>
            </div>
            <div className="w-full max-w-xs space-y-3">
              {[
                { label: "قراءة المخطط المعماري", delay: "0s" },
                { label: "استخراج الغرف والفضاءات", delay: "0.3s" },
                { label: "تحليل الأبواب والنوافذ", delay: "0.6s" },
                { label: "حساب المساحات والارتفاعات", delay: "0.9s" },
                { label: "تحضير توصيات التصميم", delay: "1.2s" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-3 h-3 text-[#C9A84C] animate-spin" style={{ animationDelay: s.delay }} />
                  </div>
                  <p className="text-sm text-[#8B6914]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الخطوة 4: النتائج ── */}
        {step === "results" && analysisResult && (
          <div className="space-y-4">
            {/* بطاقة الملخص */}
            <div className="bg-gradient-to-br from-[#C9A84C] to-[#8B6914] rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold text-base">تم تحليل المخطط بنجاح ✓</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center bg-white/20 rounded-2xl p-2">
                  <p className="text-2xl font-black">{analysisResult.totalArea}</p>
                  <p className="text-xs opacity-80">م² إجمالي</p>
                </div>
                <div className="text-center bg-white/20 rounded-2xl p-2">
                  <p className="text-2xl font-black">{analysisResult.rooms.length}</p>
                  <p className="text-xs opacity-80">فضاء</p>
                </div>
                <div className="text-center bg-white/20 rounded-2xl p-2">
                  <p className="text-2xl font-black">{analysisResult.floors}</p>
                  <p className="text-xs opacity-80">طابق</p>
                </div>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">{analysisResult.summary}</p>
            </div>

            {/* تغيير نمط التصميم */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <p className="text-xs font-bold text-[#5C3D11] mb-2">نمط التصميم</p>
              <div className="flex gap-2 flex-wrap">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDesignStyle(s.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${designStyle === s.id ? "bg-[#C9A84C] text-white" : "bg-[#f0e8d8] text-[#8B6914]"}`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* تبويبات */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("rooms")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "rooms" ? "bg-[#C9A84C] text-white" : "bg-white border border-[#e8d9c0] text-[#8B6914]"}`}
              >
                الغرف ({analysisResult.rooms.length})
              </button>
              <button
                onClick={() => setActiveTab("3d")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "3d" ? "bg-[#C9A84C] text-white" : "bg-white border border-[#e8d9c0] text-[#8B6914]"}`}
              >
                🏠 3D
              </button>
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "recommendations" ? "bg-[#C9A84C] text-white" : "bg-white border border-[#e8d9c0] text-[#8B6914]"}`}
              >
                توصيات
              </button>
            </div>

            {/* قائمة الغرف */}
            {activeTab === "rooms" && (
              <div className="space-y-3">
                {/* تحديد الكل */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#8B6914]/70">{selectedRooms.length} من {analysisResult.rooms.length} محددة</p>
                  <button
                    onClick={() => setSelectedRooms(
                      selectedRooms.length === analysisResult.rooms.length ? [] : analysisResult.rooms.map(r => r.name)
                    )}
                    className="text-xs font-bold text-[#C9A84C]"
                  >
                    {selectedRooms.length === analysisResult.rooms.length ? "إلغاء الكل" : "تحديد الكل"}
                  </button>
                </div>

                {analysisResult.rooms.map((room: RoomResult) => (
                  <RoomCard
                    key={room.name}
                    room={room}
                    isSelected={selectedRooms.includes(room.name)}
                    onToggle={() => toggleRoom(room.name)}
                    onDesign={() => handleDesignSingle(room)}
                    isDesigning={false}
                  />
                ))}
              </div>
            )}

            {/* التوصيات */}
            {/* عرض 3D */}
            {activeTab === "3d" && (
              <div className="rounded-2xl overflow-hidden">
                <Suspense fallback={
                  <div className="h-64 bg-[#F5F0E8] rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">جاري تحميل العارض ثلاثي الأبعاد...</p>
                    </div>
                  </div>
                }>
                  <ThreeJSViewer
                    rooms={analysisResult.rooms.map(r => ({ ...r, floor: r.floor || "ground" }))}
                    totalArea={analysisResult.totalArea}
                    floors={analysisResult.floors}
                  />
                </Suspense>
                <p className="text-xs text-center text-[#8B6914]/60 mt-2">اسحب للتدوير • عجلة الماوس للتكبير</p>
              </div>
            )}
            {activeTab === "recommendations" && (
              <div className="space-y-3">
                {(analysisResult.recommendations || []).map((rec: string, i: number) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-[#e8d9c0] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#C9A84C]" />
                    </div>
                    <p className="text-sm text-[#5C3D11] leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}

            {/* تكلفة وزر التصميم */}
            <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#8B6914]/10 rounded-2xl p-4 border border-[#C9A84C]/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#C9A84C]" />
                  <p className="text-sm font-bold text-[#5C3D11]">التكلفة الإجمالية</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-[#C9A84C]">{totalSelectedCost} نقطة</p>
                  <p className="text-[10px] text-[#8B6914]/70">{selectedRooms.length} غرفة × {CREDITS_PER_ROOM} نقطة</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDesignAll}
              disabled={selectedRooms.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                صمّم الغرف المحددة ({selectedRooms.length}) — {totalSelectedCost} نقطة
              </span>
            </button>
          </div>
        )}

        {/* ── الخطوة 5: التصاميم ── */}
        {step === "designing" && (
          <div className="space-y-4">
            {/* رأس التصاميم */}
            <div className="bg-gradient-to-br from-[#C9A84C] to-[#8B6914] rounded-3xl p-5 text-white">
              <p className="font-bold text-lg mb-1">تصاميم مخططك</p>
              {isAllDone ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <p className="text-sm">اكتملت جميع التصاميم! ({completedCount} غرفة)</p>
                </div>
              ) : (
                <p className="text-sm opacity-80">
                  {designingRoom ? `جاري تصميم: ${designingRoom}...` : "جاري التحضير..."}
                </p>
              )}
              {designingRoom && !isAllDone && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs opacity-80 mb-1">
                    <span>{completedCount} مكتملة</span>
                    <span>{completedCount + queueRef.current.length} إجمالي</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div
                      className="bg-white rounded-full h-1.5 transition-all"
                      style={{ width: `${(completedCount / (completedCount + queueRef.current.length)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* بطاقات التصاميم */}
            <div className="space-y-4">
              {analysisResult?.rooms
                .filter(r => selectedRooms.includes(r.name) || roomDesigns[r.name])
                .map((room: RoomResult) => {
                  const design = roomDesigns[room.name];
                  const isGenerating = designingRoom === room.name;
                  const isPending = !design && !isGenerating && queueRef.current.some(q => q.name === room.name);
                  const icon = ROOM_ICONS[room.type] || "🏠";

                  return (
                    <div key={room.name} className="bg-white rounded-2xl overflow-hidden border border-[#e8d9c0] shadow-sm">
                      {/* رأس البطاقة */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0e8d8]">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <div>
                            <p className="text-sm font-bold text-[#5C3D11]">{room.name}</p>
                            <p className="text-xs text-[#8B6914]/70">{room.dimensions || "—"} • {room.area || "—"} م²</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {design && (
                            <span className="text-[10px] text-[#C9A84C] font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3" />{design.creditsCost}
                            </span>
                          )}
                          {design && !designingRoom && (
                            <>
                              <button
                                onClick={() => handleDownloadImage(design.imageUrl, room.name)}
                                className="p-1.5 rounded-lg bg-[#f0e8d8] text-[#8B6914] hover:bg-[#e8d9c0] transition-colors"
                                title="تحميل الصورة"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRedesign(room)}
                                className="p-1.5 rounded-lg bg-[#f0e8d8] text-[#8B6914] hover:bg-[#e8d9c0] transition-colors"
                                title="إعادة التصميم"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* منطقة الصورة */}
                      {design ? (
                        <div className="relative">
                          <img
                            src={design.imageUrl}
                            alt={`تصميم ${room.name}`}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {STYLES.find(s => s.id === design.style)?.label || design.style}
                          </div>
                        </div>
                      ) : isGenerating ? (
                        <div className="w-full aspect-video bg-gradient-to-br from-[#f0e8d8] to-[#e8d9c0] flex flex-col items-center justify-center gap-3">
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C]/20 animate-spin" style={{ borderTopColor: "#C9A84C" }} />
                            <div className="absolute inset-3 flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-[#C9A84C] animate-pulse" />
                            </div>
                          </div>
                          <p className="text-sm text-[#8B6914] font-bold">جاري التصميم...</p>
                          <p className="text-xs text-[#8B6914]/60">قد يستغرق 15-30 ثانية</p>
                        </div>
                      ) : isPending ? (
                        <div className="w-full aspect-video bg-[#f0e8d8] flex flex-col items-center justify-center gap-2">
                          <ImageIcon className="w-8 h-8 text-[#C9A84C]/40" />
                          <p className="text-xs text-[#8B6914]/50">في الانتظار...</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>

            {/* أزرار الإجراءات */}
            <div className="space-y-3 pb-6">
              {isAllDone && (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-200 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">اكتملت جميع التصاميم! 🎉</p>
                    <p className="text-xs text-green-700">تم تصميم {completedCount} غرفة بنجاح</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setStep("results")}
                className="w-full py-3 rounded-2xl border-2 border-[#C9A84C] text-[#C9A84C] font-bold text-sm active:scale-95 transition-transform"
              >
                العودة لقائمة الغرف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
