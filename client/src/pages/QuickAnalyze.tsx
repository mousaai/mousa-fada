/**
 * QuickAnalyze — تحليل سريع متقدم
 * كاميرا مباشرة + صور متعددة + بانوراما + فيديو
 * الإخراج بنفس صيغة الإدخال
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Camera, ImagePlus, ChevronRight, Sparkles, Download, Share2,
  RotateCcw, Palette, Wand2, DollarSign, Sliders, Check,
  RefreshCw, ChevronDown, ChevronUp, Edit3, X, Video, Images,
  Plus, Play, ZoomIn, ScanLine
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type DesignStyle = "modern" | "gulf" | "classic" | "minimal" | "japanese" | "scandinavian" | "moroccan" | "luxury";
type CaptureMode = "single" | "multi" | "panorama" | "video";

const STYLES: { id: DesignStyle; label: string; emoji: string }[] = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "gulf", label: "خليجي", emoji: "🕌" },
  { id: "classic", label: "كلاسيكي", emoji: "🏛️" },
  { id: "minimal", label: "مينيمال", emoji: "⬜" },
  { id: "japanese", label: "ياباني", emoji: "⛩️" },
  { id: "scandinavian", label: "سكندنافي", emoji: "🌿" },
  { id: "moroccan", label: "مغربي", emoji: "🌙" },
  { id: "luxury", label: "فاخر", emoji: "💎" },
];

const BUDGET_PRESETS = [
  { label: "اقتصادي", range: { min: 5000, max: 20000 } },
  { label: "متوسط", range: { min: 20000, max: 60000 } },
  { label: "فاخر", range: { min: 60000, max: 150000 } },
  { label: "بريميوم", range: { min: 150000, max: 500000 } },
];

const CAPTURE_MODES: { id: CaptureMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "single", label: "صورة واحدة", desc: "صوّر الغرفة من زاوية واحدة", icon: <Camera className="w-6 h-6" /> },
  { id: "multi", label: "صور متعددة", desc: "صوّر كل زوايا الغرفة (حتى 6 صور)", icon: <Images className="w-6 h-6" /> },
  { id: "panorama", label: "بانوراما", desc: "صورة بانوراما للغرفة كاملة", icon: <ScanLine className="w-6 h-6" /> },
  { id: "video", label: "فيديو", desc: "صوّر فيديو للغرفة (حتى 30 ثانية)", icon: <Video className="w-6 h-6" /> },
];

interface QuickResult {
  overview: string;
  palette: { name: string; hex: string }[];
  topSuggestions: string[];
  estimatedCost: string;
  costBreakdown?: Record<string, string>;
  materials?: string[];
}

// Color Picker Component
function ColorSwatch({
  color,
  onEdit,
}: {
  color: { name: string; hex: string };
  onEdit: (newHex: string, newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tempHex, setTempHex] = useState(color.hex);
  const [tempName, setTempName] = useState(color.name);

  const save = () => {
    onEdit(tempHex, tempName);
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 flex-1 relative">
      <div
        className="w-full h-12 rounded-xl border-2 border-white shadow-md cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        style={{ backgroundColor: color.hex }}
        onClick={() => setEditing(!editing)}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity">
          <Edit3 className="w-3 h-3 text-white" />
        </div>
      </div>
      <span className="text-[10px] text-[#8B6914] text-center leading-tight">{color.name}</span>

      {editing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-[#e8d9c0] p-3 w-52">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C3D11]">تعديل اللون</span>
            <button onClick={() => setEditing(false)}><X className="w-4 h-4 text-[#8B6914]" /></button>
          </div>
          <input
            type="color"
            value={tempHex}
            onChange={(e) => setTempHex(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border border-[#e8d9c0] mb-2"
          />
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="اسم اللون"
            className="w-full text-xs border border-[#e8d9c0] rounded-lg px-2 py-1.5 text-[#5C3D11] mb-2 text-right"
          />
          <div className="flex gap-1">
            <button onClick={save} className="flex-1 py-1.5 bg-[#C9A84C] text-white text-xs font-bold rounded-lg">حفظ</button>
            <button onClick={() => setEditing(false)} className="flex-1 py-1.5 border border-[#e8d9c0] text-[#8B6914] text-xs rounded-lg">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Camera Component =====
function CameraCapture({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const { dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch {
        setError("لا يمكن الوصول للكاميرا. تأكد من منح الإذن.");
      }
    };
    startCamera();
    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stream?.getTracks().forEach(t => t.stop());
    onCapture(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir={dir}>
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-sm">التقط صورة</span>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <Camera className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold text-sm">
            استخدم المعرض بدلاً
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="flex-1 w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C] rounded-br-xl" />
            </div>
          </div>

          {/* Capture button */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8">
            <button
              onClick={capture}
              disabled={!isReady}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Video Capture Component =====
function VideoCapture({ onCapture, onClose }: { onCapture: (dataUrl: string, videoUrl: string) => void; onClose: () => void }) {
  const { dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      } catch {
        setError("لا يمكن الوصول للكاميرا.");
      }
    };
    startCamera();
    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);
      // Extract first frame as thumbnail
      const video = document.createElement("video");
      video.src = videoUrl;
      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        const thumb = canvas.toDataURL("image/jpeg", 0.85);
        stream?.getTracks().forEach(t => t.stop());
        onCapture(thumb, videoUrl);
      };
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s >= 29) { stopRecording(); return 30; }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir={dir}>
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-sm">
          {recording ? `🔴 ${seconds}s / 30s` : "تسجيل فيديو"}
        </span>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold text-sm">رجوع</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />
          {recording && (
            <div className="absolute top-20 left-0 right-0 flex justify-center">
              <div className="bg-black/60 rounded-full px-4 py-1">
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                  <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${(seconds / 30) * 100}%` }} />
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8">
            {recording ? (
              <button onClick={stopRecording}
                className="w-20 h-20 rounded-full border-4 border-white bg-red-500/80 flex items-center justify-center active:scale-90 transition-transform">
                <div className="w-8 h-8 rounded-sm bg-white" />
              </button>
            ) : (
              <button onClick={startRecording}
                className="w-20 h-20 rounded-full border-4 border-white bg-red-500/80 flex items-center justify-center active:scale-90 transition-transform">
                <div className="w-14 h-14 rounded-full bg-red-500" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuickAnalyze() {
  const { t, dir } = useLanguage();
  const [, navigate] = useLocation();

  // Capture mode
  const [captureMode, setCaptureMode] = useState<CaptureMode>("single");
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCamera, setShowVideoCamera] = useState(false);

  // Media state
  const [images, setImages] = useState<string[]>([]); // base64 images
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Design state
  const [style, setStyle] = useState<DesignStyle>("modern");
  const [result, setResult] = useState<QuickResult | null>(null);
  const [step, setStep] = useState<"mode" | "capture" | "style" | "analyzing" | "result">("mode");
  const [vizImage, setVizImage] = useState<string | null>(null);
  const [isGeneratingViz, setIsGeneratingViz] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [editedPalette, setEditedPalette] = useState<{ name: string; hex: string }[]>([]);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number } | null>(null);
  const [customBudgetMin, setCustomBudgetMin] = useState("");
  const [customBudgetMax, setCustomBudgetMax] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [showRequirementsInput, setShowRequirementsInput] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Primary image for analysis (first image or video thumbnail)
  const primaryImage = images[0] || videoThumb;

  const saveImageForIdeas = (imageData: string) => {
    try { sessionStorage.setItem("quickAnalyzeImage", imageData); } catch {}
  };

  const analyzeMutation = trpc.quickAnalyze.useMutation({
    onSuccess: (data: Partial<QuickResult>) => {
      const palette = data.palette?.slice(0, 5) || [];
      setResult({
        overview: data.overview || "تحليل مكتمل",
        palette,
        topSuggestions: data.topSuggestions?.slice(0, 4) || [],
        estimatedCost: data.estimatedCost || "",
        costBreakdown: (data as QuickResult).costBreakdown,
        materials: (data as QuickResult).materials,
      });
      setEditedPalette(palette);
      setStep("result");
    },
    onError: () => {
      toast.error("حدث خطأ، حاول مجدداً");
      setStep("style");
    },
  });

  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data) => {
      if (data.imageUrl) {
        setVizImage(data.imageUrl);
        toast.success("تم توليد الصورة التصورية!");
      } else {
        toast.error("فشل توليد الصورة، حاول مجدداً");
      }
      setIsGeneratingViz(false);
    },
    onError: () => {
      toast.error("فشل توليد الصورة");
      setIsGeneratingViz(false);
    },
  });

  const reAnalyzeMutation = trpc.reAnalyzeWithChanges.useMutation({
    onSuccess: (data: Partial<QuickResult & { costBreakdown?: Record<string, string>; materials?: string[] }>) => {
      const palette = data.palette?.slice(0, 5) || editedPalette;
      setResult({
        overview: data.overview || result?.overview || "",
        palette,
        topSuggestions: data.topSuggestions?.slice(0, 4) || result?.topSuggestions || [],
        estimatedCost: data.estimatedCost || result?.estimatedCost || "",
        costBreakdown: data.costBreakdown,
        materials: data.materials,
      });
      setEditedPalette(palette);
      setIsReanalyzing(false);
      toast.success("تم تحديث التحليل!");
    },
    onError: () => {
      toast.error("فشل التحديث");
      setIsReanalyzing(false);
    },
  });

  // Handle file selection
  const handleSingleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImages([dataUrl]);
      setVideoUrl(null);
      setVideoThumb(null);
      setStep("style");
    };
    reader.readAsDataURL(file);
  };

  const handleMultiFiles = (files: FileList) => {
    const newImages: string[] = [];
    let loaded = 0;
    const total = Math.min(files.length, 6);
    for (let i = 0; i < total; i++) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(e.target?.result as string);
        loaded++;
        if (loaded === total) {
          setImages(prev => [...prev, ...newImages].slice(0, 6));
          if (step === "capture") setStep("style");
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const handleVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const thumb = canvas.toDataURL("image/jpeg", 0.85);
      setVideoUrl(url);
      setVideoThumb(thumb);
      setImages([]);
      setStep("style");
    };
  };

  const startAnalysis = () => {
    if (!primaryImage) return;
    setStep("analyzing");
    analyzeMutation.mutate({
      imageUrl: primaryImage,
      imageUrls: images.length > 1 ? images : undefined,
      captureMode: captureMode,
      designStyle: style,
    });
  };

  const handleGenerateViz = useCallback(() => {
    if (!primaryImage) return;
    setIsGeneratingViz(true);
    setVizImage(null);
    generateVizMutation.mutate({
      imageUrl: primaryImage,
      designStyle: style,
      palette: editedPalette.length > 0 ? editedPalette : result?.palette,
      materials: result?.materials?.join(", "),
    });
  }, [primaryImage, style, editedPalette, result]);

  const handleReanalyze = useCallback(() => {
    if (!primaryImage) return;
    setIsReanalyzing(true);
    const budgetRange = selectedBudget || (customBudgetMin && customBudgetMax
      ? { min: parseInt(customBudgetMin), max: parseInt(customBudgetMax) }
      : undefined);
    reAnalyzeMutation.mutate({
      imageUrl: primaryImage,
      designStyle: style,
      customPalette: editedPalette.length > 0 ? editedPalette : undefined,
      budgetRange,
      customRequirements: customRequirements || undefined,
    });
  }, [primaryImage, style, editedPalette, selectedBudget, customBudgetMin, customBudgetMax, customRequirements]);

  const updateColor = (index: number, newHex: string, newName: string) => {
    setEditedPalette(prev => prev.map((c, i) => i === index ? { name: newName, hex: newHex } : c));
  };

  const reset = () => {
    setImages([]);
    setVideoUrl(null);
    setVideoThumb(null);
    setResult(null);
    setVizImage(null);
    setEditedPalette([]);
    setSelectedBudget(null);
    setCustomBudgetMin("");
    setCustomBudgetMax("");
    setCustomRequirements("");
    setStep("mode");
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImageIndex >= index && selectedImageIndex > 0) setSelectedImageIndex(prev => prev - 1);
  };

  const currentBudgetLabel = selectedBudget
    ? `${selectedBudget.min.toLocaleString()} - ${selectedBudget.max.toLocaleString()} ر.س`
    : customBudgetMin && customBudgetMax
    ? `${parseInt(customBudgetMin).toLocaleString()} - ${parseInt(customBudgetMax).toLocaleString()} ر.س`
    : null;

  // Proceed from capture step
  const proceedToStyle = () => {
    if (captureMode === "video" && !videoThumb) { toast.error("سجّل فيديو أولاً"); return; }
    if (captureMode !== "video" && images.length === 0) { toast.error("أضف صورة واحدة على الأقل"); return; }
    setStep("style");
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir={dir}>
      {/* Camera overlays */}
      {showCamera && (
        <CameraCapture
          onCapture={(dataUrl) => {
            if (captureMode === "single") {
              setImages([dataUrl]);
              setStep("style");
            } else {
              setImages(prev => [...prev, dataUrl].slice(0, 6));
            }
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
      {showVideoCamera && (
        <VideoCapture
          onCapture={(thumb, url) => {
            setVideoThumb(thumb);
            setVideoUrl(url);
            setImages([]);
            setShowVideoCamera(false);
            setStep("style");
          }}
          onClose={() => setShowVideoCamera(false)}
        />
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-xl" alt="preview" />
          <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/80 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-40">
        <button onClick={() => step === "mode" ? navigate("/") : (step === "capture" ? setStep("mode") : step === "style" ? setStep("capture") : reset())}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronRight className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div>
          <p className="font-bold text-[#5C3D11]">تحليل سريع</p>
          <p className="text-xs text-[#8B6914]/70">
            {step === "mode" ? "اختر طريقة التصوير" :
             step === "capture" ? "التقط صور الفضاء" :
             step === "style" ? "اختر نمط التصميم" :
             step === "analyzing" ? "م. سارة تحلل..." : "نتيجة التحليل"}
          </p>
        </div>
        {step !== "mode" && (
          <button onClick={reset} className="mr-auto p-2 rounded-full hover:bg-[#f0e8d8]">
            <RotateCcw className="w-5 h-5 text-[#8B6914]" />
          </button>
        )}
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-[#e8d9c0]">
        <div className="h-full bg-gradient-to-r from-[#C9A84C] to-[#8B6914] transition-all duration-500"
          style={{ width: step === "mode" ? "20%" : step === "capture" ? "40%" : step === "style" ? "60%" : step === "analyzing" ? "80%" : "100%" }} />
      </div>

      <main className="flex-1 flex flex-col px-5 py-6 pb-24">

        {/* ===== STEP 1: Choose Capture Mode ===== */}
        {step === "mode" && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-black text-[#5C3D11]">كيف تريد التصوير؟</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">اختر طريقة التقاط الفضاء</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CAPTURE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => { setCaptureMode(mode.id); setStep("capture"); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-all hover:border-[#C9A84C] hover:bg-[#C9A84C]/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#8B6914]/10 flex items-center justify-center text-[#C9A84C]">
                    {mode.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#5C3D11] text-sm">{mode.label}</p>
                    <p className="text-[10px] text-[#8B6914]/70 mt-0.5 leading-tight">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#C9A84C]/10 rounded-2xl p-4 border border-[#C9A84C]/20">
              <p className="text-xs text-[#8B6914] text-center leading-relaxed">
                💡 <strong>نصيحة م. سارة:</strong> كلما زادت الصور، كان التحليل أدق. صوّر الجدران والأرضية والسقف من زوايا مختلفة.
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Capture ===== */}
        {step === "capture" && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-xl font-black text-[#5C3D11]">
                {captureMode === "single" ? "التقط صورة الغرفة" :
                 captureMode === "multi" ? "صوّر كل زوايا الغرفة" :
                 captureMode === "panorama" ? "التقط صورة بانوراما" : "سجّل فيديو للغرفة"}
              </h2>
              <p className="text-xs text-[#8B6914]/70 mt-1">
                {captureMode === "multi" ? `${images.length}/6 صور` :
                 captureMode === "video" ? "حتى 30 ثانية" : ""}
              </p>
            </div>

            {/* Video mode */}
            {captureMode === "video" && (
              <div className="flex flex-col gap-4">
                {videoThumb ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={videoThumb} className="w-full h-52 object-cover" alt="video thumb" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#5C3D11] mr-[-2px]" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      🎥 فيديو
                    </div>
                    <button onClick={() => { setVideoThumb(null); setVideoUrl(null); }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="h-52 rounded-2xl bg-[#1a1a2e] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#C9A84C]/30">
                    <Video className="w-12 h-12 text-[#C9A84C]/50" />
                    <p className="text-sm text-white/50">لم يتم تسجيل فيديو بعد</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowVideoCamera(true)}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] text-white active:scale-95 transition-transform">
                    <Video className="w-6 h-6" />
                    <span className="text-sm font-bold">تسجيل فيديو</span>
                  </button>
                  <button onClick={() => videoFileRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] active:scale-95 transition-transform">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-sm font-bold">رفع فيديو</span>
                  </button>
                </div>
                <input ref={videoFileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />
              </div>
            )}

            {/* Single / Panorama mode */}
            {(captureMode === "single" || captureMode === "panorama") && (
              <div className="flex flex-col gap-4">
                {images[0] ? (
                  <div className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLightboxImage(images[0])}>
                    <img src={images[0]} className={`w-full object-cover ${captureMode === "panorama" ? "h-36" : "h-52"}`} alt="preview" />
                    <div className="absolute top-2 right-2 bg-[#C9A84C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ZoomIn className="w-3 h-3" /> عرض
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setImages([]); }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-2xl bg-[#f0e8d8] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#C9A84C]/40 ${captureMode === "panorama" ? "h-36" : "h-52"}`}>
                    {captureMode === "panorama" ? <ScanLine className="w-10 h-10 text-[#C9A84C]/50" /> : <Camera className="w-10 h-10 text-[#C9A84C]/50" />}
                    <p className="text-sm text-[#8B6914]/60">
                      {captureMode === "panorama" ? "صورة بانوراما واسعة" : "لم تُضف صورة بعد"}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowCamera(true)}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] text-white active:scale-95 transition-transform">
                    <Camera className="w-6 h-6" />
                    <span className="text-sm font-bold">فتح الكاميرا</span>
                  </button>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] active:scale-95 transition-transform">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-sm font-bold">من المعرض</span>
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSingleFile(e.target.files[0])} />
              </div>
            )}

            {/* Multi mode */}
            {captureMode === "multi" && (
              <div className="flex flex-col gap-4">
                {/* Images grid */}
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => setLightboxImage(img)}>
                      <img src={img} className="w-full h-full object-cover" alt={`زاوية ${i + 1}`} />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] text-center py-0.5">
                        زاوية {i + 1}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-[#f0e8d8] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="w-6 h-6 text-[#C9A84C]" />
                      <span className="text-[10px] text-[#8B6914]">إضافة</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowCamera(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] text-white active:scale-95 transition-transform">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm font-bold">تصوير</span>
                  </button>
                  <button onClick={() => multiFileRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#C9A84C] text-[#8B6914] active:scale-95 transition-transform">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-sm font-bold">من المعرض</span>
                  </button>
                </div>
                <input ref={multiFileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => e.target.files && handleMultiFiles(e.target.files)} />

                {images.length > 0 && (
                  <div className="bg-[#C9A84C]/10 rounded-xl p-3 border border-[#C9A84C]/20">
                    <p className="text-xs text-[#8B6914] text-center">
                      ✅ {images.length} صورة جاهزة للتحليل
                      {images.length < 3 && " · يُنصح بإضافة المزيد للدقة"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Proceed button */}
            {(images.length > 0 || videoThumb) && (
              <button onClick={proceedToStyle}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-base shadow-lg active:scale-95 transition-transform mt-auto"
                style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
                <span className="flex items-center justify-center gap-2">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  التالي — اختر النمط
                </span>
              </button>
            )}
          </div>
        )}

        {/* ===== STEP 3: Choose Style ===== */}
        {step === "style" && (
          <div className="flex-1 flex flex-col gap-5">
            {/* Preview strip */}
            {captureMode === "multi" && images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <img key={i} src={img} onClick={() => setSelectedImageIndex(i)}
                    className={`h-20 w-28 flex-shrink-0 rounded-xl object-cover cursor-pointer border-2 transition-all ${selectedImageIndex === i ? "border-[#C9A84C]" : "border-transparent"}`}
                    alt={`زاوية ${i + 1}`} />
                ))}
              </div>
            ) : primaryImage ? (
              <img src={primaryImage} className="w-full h-44 object-cover rounded-2xl" alt="preview" />
            ) : null}

            {captureMode === "video" && videoThumb && (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={videoThumb} className="w-full h-44 object-cover" alt="video" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                    <Play className="w-5 h-5 text-[#5C3D11] mr-[-1px]" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🎥 فيديو</div>
              </div>
            )}

            <div>
              <p className="font-bold text-[#5C3D11] mb-3">اختر نمط التصميم</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${style === s.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-white"}`}>
                    <span className="text-2xl">{s.emoji}</span>
                    <span className={`text-xs font-bold ${style === s.id ? "text-[#8B6914]" : "text-[#5C3D11]"}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startAnalysis}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-lg shadow-lg active:scale-95 transition-transform mt-auto"
              style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                تحليل الآن
              </span>
            </button>
          </div>
        )}

        {/* ===== STEP 4: Analyzing ===== */}
        {step === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {primaryImage && (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden">
                <img src={primaryImage} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-[#5C3D11]/40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-[#C9A84C] animate-pulse" />
                    </div>
                    <p className="font-bold text-lg">م. سارة تحلل...</p>
                    {captureMode === "multi" && images.length > 1 && (
                      <p className="text-sm opacity-80">{images.length} صور</p>
                    )}
                    {captureMode === "video" && <p className="text-sm opacity-80">🎥 فيديو</p>}
                  </div>
                </div>
              </div>
            )}
            <div className="w-full space-y-3">
              {["تحليل الفضاء والأبعاد", "اقتراح الألوان والمواد", "حساب التكاليف التقديرية"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Result ===== */}
        {step === "result" && result && (
          <div className="flex-1 flex flex-col gap-4">

            {/* Multi-image strip */}
            {captureMode === "multi" && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} onClick={() => setLightboxImage(img)}
                      className="h-16 w-24 rounded-xl object-cover cursor-pointer border-2 border-[#C9A84C]/30" alt={`زاوية ${i + 1}`} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] text-center py-0.5 rounded-b-xl">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Visualization */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">الصورة التصورية</span>
                  {captureMode === "video" && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🎥</span>}
                </div>
                <button onClick={handleGenerateViz} disabled={isGeneratingViz}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold active:scale-95 transition-transform disabled:opacity-60">
                  {isGeneratingViz ? <><RefreshCw className="w-3 h-3 animate-spin" /> جاري التوليد...</> : <><Sparkles className="w-3 h-3" /> {vizImage ? "إعادة توليد" : "توليد صورة"}</>}
                </button>
              </div>

              {vizImage ? (
                <div className="relative cursor-pointer" onClick={() => setLightboxImage(vizImage)}>
                  <img src={vizImage} className="w-full h-56 object-cover" alt="visualization" />
                  <div className="absolute top-2 right-2 bg-[#C9A84C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✨ م. سارة</div>
                  <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> تكبير
                  </div>
                </div>
              ) : isGeneratingViz ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 bg-[#faf6f0]">
                  <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-sm text-[#8B6914]">م. سارة تولّد الصورة التصورية...</p>
                  <p className="text-xs text-[#8B6914]/60">15-30 ثانية</p>
                </div>
              ) : (
                <div className="relative">
                  {primaryImage && <img src={primaryImage} className="w-full h-44 object-cover opacity-60" alt="preview" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#5C3D11]/20">
                    <Wand2 className="w-8 h-8 text-[#C9A84C]" />
                    <p className="text-sm font-bold text-[#5C3D11]">اضغط "توليد صورة" لرؤية تصورك</p>
                  </div>
                </div>
              )}
            </div>

            {/* تقييم م. سارة */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-bold text-[#5C3D11] text-sm">تقييم م. سارة</span>
              </div>
              <p className="text-sm text-[#6B4C1E] leading-relaxed">{result.overview}</p>
            </div>

            {/* لوحة الألوان */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">لوحة الألوان</span>
                </div>
                <span className="text-[10px] text-[#8B6914]/60 bg-[#f0e8d8] px-2 py-0.5 rounded-full">اضغط لتعديل</span>
              </div>
              <div className="flex gap-2 relative">
                {(editedPalette.length > 0 ? editedPalette : result.palette).map((c, i) => (
                  <ColorSwatch key={i} color={c} onEdit={(hex, name) => updateColor(i, hex, name)} />
                ))}
              </div>
              {editedPalette.some((c, i) => c.hex !== result.palette[i]?.hex) && (
                <div className="mt-3">
                  <button onClick={handleReanalyze} disabled={isReanalyzing}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#C9A84C]/20 text-[#8B6914] text-xs font-bold rounded-xl border border-[#C9A84C]/30 active:scale-95 transition-transform">
                    <RefreshCw className={`w-3 h-3 ${isReanalyzing ? "animate-spin" : ""}`} />
                    تحديث التحليل بالألوان الجديدة
                  </button>
                </div>
              )}
            </div>

            {/* تعديل النمط */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button onClick={() => setShowStyleEditor(!showStyleEditor)}
                className="w-full flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">تعديل النمط</span>
                  <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">
                    {STYLES.find(s => s.id === style)?.emoji} {STYLES.find(s => s.id === style)?.label}
                  </span>
                </div>
                {showStyleEditor ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showStyleEditor && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2">
                    {STYLES.map((s) => (
                      <button key={s.id} onClick={() => setStyle(s.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${style === s.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-[#faf6f0]"}`}>
                        <span className="text-xl">{s.emoji}</span>
                        <span className={`text-[10px] font-bold ${style === s.id ? "text-[#8B6914]" : "text-[#5C3D11]"}`}>{s.label}</span>
                        {style === s.id && <Check className="w-3 h-3 text-[#C9A84C]" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setShowStyleEditor(false); handleReanalyze(); }} disabled={isReanalyzing}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60">
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق النمط الجديد"}
                  </button>
                </div>
              )}
            </div>

            {/* تعديل الميزانية */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button onClick={() => setShowBudgetEditor(!showBudgetEditor)}
                className="w-full flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">تعديل الميزانية</span>
                  {currentBudgetLabel && <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">{currentBudgetLabel}</span>}
                </div>
                {showBudgetEditor ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showBudgetEditor && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_PRESETS.map((preset) => (
                      <button key={preset.label}
                        onClick={() => { setSelectedBudget(preset.range); setCustomBudgetMin(""); setCustomBudgetMax(""); }}
                        className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${selectedBudget?.min === preset.range.min ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#e8d9c0] bg-[#faf6f0]"}`}>
                        <span className="text-xs font-bold text-[#5C3D11]">{preset.label}</span>
                        <span className="text-[10px] text-[#8B6914]">{preset.range.min.toLocaleString()} - {preset.range.max.toLocaleString()} ر.س</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-[#8B6914] flex-shrink-0">أو:</span>
                    <input type="number" placeholder="من" value={customBudgetMin}
                      onChange={(e) => { setCustomBudgetMin(e.target.value); setSelectedBudget(null); }}
                      className="flex-1 text-xs border border-[#e8d9c0] rounded-xl px-3 py-2 text-[#5C3D11] text-right" />
                    <span className="text-xs text-[#8B6914]">-</span>
                    <input type="number" placeholder="إلى" value={customBudgetMax}
                      onChange={(e) => { setCustomBudgetMax(e.target.value); setSelectedBudget(null); }}
                      className="flex-1 text-xs border border-[#e8d9c0] rounded-xl px-3 py-2 text-[#5C3D11] text-right" />
                    <span className="text-xs text-[#8B6914] flex-shrink-0">ر.س</span>
                  </div>
                  <button onClick={() => { setShowBudgetEditor(false); handleReanalyze(); }} disabled={isReanalyzing}
                    className="w-full py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60">
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق الميزانية"}
                  </button>
                </div>
              )}
            </div>

            {/* التكلفة */}
            <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-4 text-white cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 mb-1">التكلفة التقديرية</p>
                  <p className="text-xl font-black">{result.estimatedCost}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <DollarSign className="w-6 h-6 opacity-70" />
                  {showCostBreakdown ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
                </div>
              </div>
              {showCostBreakdown && result.costBreakdown && (
                <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2">
                  {Object.entries(result.costBreakdown).map(([key, value]) => {
                    const labels: Record<string, string> = { furniture: "الأثاث", flooring: "الأرضيات", walls: "الجدران", lighting: "الإضاءة", accessories: "الإكسسوارات" };
                    return (
                      <div key={key} className="bg-white/10 rounded-xl p-2">
                        <p className="text-[10px] opacity-70">{labels[key] || key}</p>
                        <p className="text-xs font-bold">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* التوصيات */}
            {result.topSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="font-bold text-[#5C3D11] text-sm mb-3">توصيات م. سارة</p>
                <div className="space-y-2">
                  {result.topSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C9A84C]/20 text-[#8B6914] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-[#6B4C1E] leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المواد */}
            {result.materials && result.materials.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="font-bold text-[#5C3D11] text-sm mb-3">المواد المقترحة</p>
                <div className="flex flex-wrap gap-2">
                  {result.materials.map((m, i) => (
                    <span key={i} className="text-xs bg-[#f0e8d8] text-[#8B6914] px-3 py-1.5 rounded-full font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* متطلبات مخصصة */}
            <div className="bg-white rounded-2xl border border-[#e8d9c0] shadow-sm overflow-hidden">
              <button onClick={() => setShowRequirementsInput(!showRequirementsInput)}
                className="w-full flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold text-[#5C3D11] text-sm">متطلبات مخصصة</span>
                </div>
                {showRequirementsInput ? <ChevronUp className="w-4 h-4 text-[#8B6914]" /> : <ChevronDown className="w-4 h-4 text-[#8B6914]" />}
              </button>
              {showRequirementsInput && (
                <div className="px-4 pb-4">
                  <textarea value={customRequirements} onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="مثال: أريد أرضية خشبية، وألوان هادئة، وإضاءة دافئة..."
                    className="w-full text-sm border border-[#e8d9c0] rounded-xl px-3 py-2.5 text-[#5C3D11] text-right resize-none h-24" />
                  <button onClick={() => { setShowRequirementsInput(false); handleReanalyze(); }}
                    disabled={isReanalyzing || !customRequirements.trim()}
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-60">
                    {isReanalyzing ? "جاري التحديث..." : "تطبيق المتطلبات"}
                  </button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={reset}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-transform">
                <RotateCcw className="w-4 h-4 text-[#8B6914]" />
                <span className="text-xs text-[#5C3D11] font-medium">تحليل آخر</span>
              </button>
              <button onClick={() => toast.success("تم الحفظ في مشاريعك")}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-transform">
                <Download className="w-4 h-4 text-[#8B6914]" />
                <span className="text-xs text-[#5C3D11] font-medium">حفظ</span>
              </button>
              <button onClick={() => {
                if (navigator.share) navigator.share({ title: "تحليل م. سارة", text: result.overview });
                else { toast.success("تم النسخ"); navigator.clipboard.writeText(result.overview); }
              }} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] active:scale-95 transition-transform">
                <Share2 className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">مشاركة</span>
              </button>
            </div>

            <button onClick={() => navigate("/design-studio")}
              className="w-full py-4 rounded-2xl bg-[#5C3D11] text-white font-bold active:scale-95 transition-transform">
              تصميم كامل في الاستوديو ←
            </button>

            <button onClick={() => { if (primaryImage) saveImageForIdeas(primaryImage); navigate("/design-ideas"); }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-base shadow-lg active:scale-95 transition-transform mb-6"
              style={{ boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                استعرض أفكاراً تصميمية متعددة ✨
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
