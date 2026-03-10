/**
 * SmartCapture — التصوير الذكي
 * لمسة واحدة → اختيار وضع التصوير → تصوير → 3-6 أفكار تصميمية فورية
 * كل شيء في شاشة واحدة بدون تنقل
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Camera, ChevronRight, Sparkles, RefreshCw, X, Wand2,
  DollarSign, Palette, ChevronDown, ChevronUp, Heart,
  Share2, ZoomIn, Video, ScanLine, Box, ImageIcon,
  Plus, Minus, Check, RotateCcw, Layers
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ===== Types =====
type CaptureMode = "single" | "panorama" | "animation3d" | "video360";

interface ReplacementCost {
  item: string;
  currentEstimate: string;
  replacementCost: string;
  notes: string;
}

interface DesignIdea {
  id: string;
  title: string;
  style: string;
  styleLabel: string;
  description: string;
  palette: { name: string; hex: string }[];
  materials: string[];
  highlights: string[];
  estimatedCost: string;
  costMin: number;
  costMax: number;
  replacementCosts: ReplacementCost[];
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

// ===== Capture Mode Selector =====
const CAPTURE_MODES: {
  id: CaptureMode;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}[] = [
  {
    id: "single",
    label: "صورة واحدة",
    sublabel: "اتجاه واحد",
    icon: <Camera className="w-7 h-7" />,
    color: "#C9A84C",
    desc: "التقط صورة واحدة للغرفة من أي زاوية",
  },
  {
    id: "panorama",
    label: "بانوراما",
    sublabel: "زاوية 180°",
    icon: <ScanLine className="w-7 h-7" />,
    color: "#4CAF50",
    desc: "صورة بانوراما عريضة للغرفة كاملة",
  },
  {
    id: "animation3d",
    label: "3D Animation",
    sublabel: "جولة كاملة",
    icon: <Box className="w-7 h-7" />,
    color: "#9C27B0",
    desc: "صوّر 4 زوايا للحصول على تصميم ثلاثي الأبعاد",
  },
  {
    id: "video360",
    label: "فيديو 360°",
    sublabel: "جولة فيديو",
    icon: <Video className="w-7 h-7" />,
    color: "#F44336",
    desc: "سجّل فيديو يدور حول الغرفة",
  },
];

// ===== Image compression helper =====
function compressImage(dataUrl: string, maxWidth = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

// ===== Camera Component =====
function LiveCamera({
  onCapture,
  onClose,
  mode,
  capturedCount,
  targetCount,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  mode: CaptureMode;
  capturedCount: number;
  targetCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const touchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    let s: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        s = stream;
        setStream(stream);
        // Check zoom capability
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as { zoom?: { max?: number } } | undefined;
        if (caps?.zoom?.max) setMaxZoom(Math.min(caps.zoom.max, 8));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => setError("لا يمكن الوصول للكاميرا. تأكد من منح الإذن."));
    return () => { s?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Apply zoom to camera track
  const applyZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(1, Math.min(newZoom, maxZoom));
    setZoom(clamped);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as { zoom?: { max?: number } } | undefined;
      if (caps?.zoom) {
        track.applyConstraints({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet] }).catch(() => {});
      }
    }
  }, [stream, maxZoom]);

  // Pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = { dist: Math.hypot(dx, dy), zoom };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scale = newDist / touchStartRef.current.dist;
      applyZoom(touchStartRef.current.zoom * scale);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !ready) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const raw = c.toDataURL("image/jpeg", 0.95);
    // Compress before sending
    const compressed = await compressImage(raw, 1280, 0.85);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    onCapture(compressed);
    if (capturedCount + 1 >= targetCount) {
      stream?.getTracks().forEach((t) => t.stop());
    }
  };

  const angleLabels = ["أمام", "يمين", "خلف", "يسار"];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping opacity-60" />}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={() => { stream?.getTracks().forEach((t) => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">
            {mode === "animation3d" ? `زاوية ${capturedCount + 1} من ${targetCount}: ${angleLabels[capturedCount] || ""}` :
             mode === "panorama" ? "صورة بانوراما" : "التقط الصورة"}
          </p>
          {mode === "animation3d" && (
            <div className="flex gap-1 justify-center mt-1">
              {Array.from({ length: targetCount }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < capturedCount ? "bg-[#C9A84C]" : i === capturedCount ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          )}
        </div>
        {/* Zoom indicator */}
        <div className="bg-black/40 px-2 py-1 rounded-lg">
          <span className="text-white text-xs font-bold">{zoom.toFixed(1)}×</span>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Camera className="w-12 h-12 text-white/40" />
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold">رجوع</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border border-white/20 rounded-2xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C9A84C] rounded-br-xl" />
            </div>
            {mode === "panorama" && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px bg-[#C9A84C]/50" />
            )}
          </div>

          {/* Zoom controls - right side */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            <button
              onClick={() => applyZoom(zoom + 0.5)}
              disabled={zoom >= maxZoom}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-30"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            {/* Zoom level pills */}
            {[1, 2, 3].filter(z => z <= maxZoom).map(z => (
              <button key={z} onClick={() => applyZoom(z)}
                className={`w-10 h-10 rounded-full backdrop-blur border flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                  Math.abs(zoom - z) < 0.3
                    ? "bg-[#C9A84C] border-[#C9A84C] text-white"
                    : "bg-black/50 border-white/20 text-white"
                }`}>
                {z}×
              </button>
            ))}
            <button
              onClick={() => applyZoom(zoom - 0.5)}
              disabled={zoom <= 1}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-30"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          {/* Capture button */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/70 to-transparent pt-8">
            {mode === "animation3d" && capturedCount < targetCount && (
              <p className="text-white/70 text-xs">وجّه الكاميرا نحو: {angleLabels[capturedCount]}</p>
            )}
            <button
              onClick={capture}
              disabled={!ready}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Panorama Capture (DeviceOrientation-based) =====
function PanoramaCapture({ onCapture, onClose }: { onCapture: (images: string[]) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [capturedAngles, setCapturedAngles] = useState<number[]>([]);
  const [capturedImages, setCapturedImagesLocal] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const headingRef = useRef<number>(0);
  const baseHeadingRef = useRef<number | null>(null);

  // Target angles: 0°, 90°, 180°, 270°
  const TARGET_ANGLES = [0, 90, 180, 270];
  const TOLERANCE = 15; // degrees

  useEffect(() => {
    let s: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } }, audio: false })
      .then((stream) => {
        s = stream;
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setReady(true); };
        }
      })
      .catch(() => setError("لا يمكن الوصول للكاميرا."));
    return () => { s?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const requestOrientationPermission = async () => {
    // iOS 13+ requires explicit permission
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (perm === "granted") startOrientation();
        else setError("يجب السماح باستخدام الجيروسكوب.");
      } catch { setError("خطأ في طلب إذن الجيروسكوب."); }
    } else {
      startOrientation();
    }
    setPermissionGranted(true);
  };

  const startOrientation = () => {
    const handler = (e: DeviceOrientationEvent) => {
      const alpha = e.alpha ?? 0; // compass heading 0-360
      headingRef.current = alpha;
      if (baseHeadingRef.current === null) baseHeadingRef.current = alpha;
      // Relative heading from start
      let rel = alpha - baseHeadingRef.current;
      if (rel < 0) rel += 360;
      setHeading(Math.round(rel));
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !ready) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.85);
  };

  // Auto-capture when near a target angle
  useEffect(() => {
    if (heading === null || !permissionGranted) return;
    const nextTarget = TARGET_ANGLES[capturedAngles.length];
    if (nextTarget === undefined) return;
    const diff = Math.abs(heading - nextTarget);
    const withinTolerance = diff <= TOLERANCE || diff >= (360 - TOLERANCE);
    if (withinTolerance) {
      const img = captureFrame();
      if (img) {
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        const newAngles = [...capturedAngles, nextTarget];
        const newImages = [...capturedImages, img];
        setCapturedAngles(newAngles);
        setCapturedImagesLocal(newImages);
        if (newAngles.length >= 4) {
          stream?.getTracks().forEach((t) => t.stop());
          setTimeout(() => onCapture(newImages), 500);
        }
      }
    }
  }, [heading]);

  const currentTarget = TARGET_ANGLES[capturedAngles.length];
  const relHeading = heading ?? 0;
  const diff = currentTarget !== undefined ? Math.abs(relHeading - currentTarget) : 0;
  const isAligned = diff <= TOLERANCE;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl">
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-70" />}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => { stream?.getTracks().forEach((t) => t.stop()); onClose(); }}
          className="p-2 rounded-full bg-white/20 text-white"><X className="w-5 h-5" /></button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">بانوراما تلقائية</p>
          <p className="text-white/60 text-xs">{capturedAngles.length} / 4 زاوية</p>
        </div>
        {/* Compass heading */}
        <div className="bg-black/50 px-2 py-1 rounded-lg">
          <span className="text-white text-xs font-bold">{relHeading}°</span>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold">رجوع</button>
        </div>
      ) : !permissionGranted ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
            <ScanLine className="w-10 h-10 text-[#C9A84C]" />
          </div>
          <p className="text-white font-bold text-lg">بانوراما ذكية</p>
          <p className="text-white/70 text-sm leading-relaxed">
            ستستخدم الجيروسكوب لتتبع اتجاهك تلقائياً.<br/>
            دوّر الهاتف 360° وستلتقط 4 صور تلقائياً عند 0° • 90° • 180° • 270°
          </p>
          <button onClick={requestOrientationPermission}
            className="px-8 py-3 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-bold rounded-2xl active:scale-95 transition-transform">
            ابدأ البانوراما
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />

          {/* Panorama guide overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Horizontal guide line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-[#C9A84C]/60" />
            {/* Center crosshair */}
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
              isAligned ? "border-green-400 bg-green-400/20" : "border-[#C9A84C] bg-[#C9A84C]/10"
            }`}>
              {isAligned && <div className="w-4 h-4 rounded-full bg-green-400 animate-ping" />}
            </div>
          </div>

          {/* Progress dots */}
          <div className="absolute top-20 left-0 right-0 flex justify-center gap-3">
            {TARGET_ANGLES.map((angle, i) => (
              <div key={i} className={`flex flex-col items-center gap-1`}>
                <div className={`w-3 h-3 rounded-full transition-all ${
                  i < capturedAngles.length ? "bg-[#C9A84C] scale-125" :
                  i === capturedAngles.length ? "bg-white animate-pulse" : "bg-white/30"
                }`} />
                <span className="text-white/60 text-[9px]">{angle}°</span>
              </div>
            ))}
          </div>

          {/* Instruction */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent pt-8 px-6">
            {currentTarget !== undefined ? (
              <>
                <p className="text-white/70 text-xs">وجّه الكاميرا نحو زاوية</p>
                <p className={`text-3xl font-black transition-colors ${
                  isAligned ? "text-green-400" : "text-white"
                }`}>{currentTarget}°</p>
                <p className="text-white/50 text-xs">
                  {isAligned ? "✅ جاري التقاط الصورة تلقائياً..." : `الاتجاه الحالي: ${relHeading}° • المطلوب: ${currentTarget}°`}
                </p>
              </>
            ) : (
              <p className="text-green-400 font-bold text-lg">✅ تم التقاط جميع الزوايا!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Video Recorder =====
function VideoRecorder({ onCapture, onClose }: { onCapture: (thumb: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let s: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        s = stream;
        setStream(stream);
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      })
      .catch(() => setError("لا يمكن الوصول للكاميرا."));
    return () => { s?.getTracks().forEach((t) => t.stop()); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const start = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const v = document.createElement("video");
      v.src = url;
      v.onloadeddata = () => {
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d")?.drawImage(v, 0, 0);
        stream?.getTracks().forEach((t) => t.stop());
        onCapture(c.toDataURL("image/jpeg", 0.85));
      };
    };
    mr.start();
    mrRef.current = mr;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => { if (s >= 29) { stop(); return 30; } return s + 1; });
    }, 1000);
  };

  const stop = () => {
    mrRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => { stream?.getTracks().forEach((t) => t.stop()); onClose(); }} className="p-2 rounded-full bg-white/20 text-white"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          {recording && <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-white font-bold text-sm">{recording ? "جاري التسجيل" : "سجّل جولة الغرفة"}</span>
        </div>
        <div className="w-9" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-[#5C3D11] rounded-xl font-bold">رجوع</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 w-full object-cover" playsInline muted autoPlay />

          {/* Recording indicator overlay */}
          {recording && (
            <>
              {/* REC badge top-right */}
              <div className="absolute top-16 right-4 z-20 flex items-center gap-1.5 bg-red-600 px-3 py-1.5 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-white text-xs font-black tracking-widest">REC</span>
              </div>
              {/* Timer center-top */}
              <div className="absolute top-16 left-0 right-0 flex justify-center z-20">
                <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full">
                  <span className="text-white font-black text-2xl tabular-nums">
                    {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                  </span>
                  <span className="text-white/50 text-sm ml-1">/ 0:30</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="absolute top-28 left-6 right-6 z-20">
                <div className="bg-white/20 rounded-full h-1">
                  <div className="bg-red-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(seconds / 30) * 100}%` }} />
                </div>
              </div>
            </>
          )}

          {/* Instructions when not recording */}
          {!recording && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
              <div className="bg-black/50 backdrop-blur px-5 py-3 rounded-2xl">
                <p className="text-white/80 text-sm text-center">دوّر ببطء حول الغرفة أثناء التسجيل</p>
                <p className="text-white/50 text-xs text-center mt-1">حد أقصى 30 ثانية</p>
              </div>
            </div>
          )}

          {/* Capture button */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe pb-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent pt-8">
            {recording ? (
              <>
                <p className="text-white/70 text-xs">اضغط لإيقاف التسجيل</p>
                <button onClick={stop} className="w-20 h-20 rounded-full border-4 border-red-400 bg-red-500/80 backdrop-blur flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-red-500/40">
                  <div className="w-8 h-8 rounded-sm bg-white" />
                </button>
              </>
            ) : (
              <>
                <p className="text-white/70 text-xs">اضغط لبدء التسجيل</p>
                <button onClick={start} className="w-20 h-20 rounded-full border-4 border-white bg-red-500 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-red-500/50">
                  <div className="w-10 h-10 rounded-full bg-white" />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Idea Card =====
function IdeaCard({
  idea,
  onGenerateImage,
  onFavorite,
  isFavorited,
}: {
  idea: DesignIdea;
  onGenerateImage: (id: string) => void;
  onFavorite: (id: string) => void;
  isFavorited: boolean;
}) {
  const [showReplacement, setShowReplacement] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-[#e8d9c0] shadow-sm overflow-hidden mb-4">
      {/* Image area */}
      <div className="relative">
        {idea.imageUrl ? (
          <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
            <img src={idea.imageUrl} className="w-full h-52 object-cover" alt={idea.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-full">{idea.styleLabel}</span>
                <p className="text-white font-black text-lg mt-0.5 leading-tight">{idea.title}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={(e) => { e.stopPropagation(); onFavorite(idea.id); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isFavorited ? "bg-red-500 text-white" : "bg-white/20 text-white"}`}>
                  <Heart className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} />
                </button>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ) : idea.isGeneratingImage ? (
          <div className="h-52 bg-gradient-to-br from-[#1a1a2e] to-[#2d1b69] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-[#C9A84C] animate-pulse" />
            </div>
            <p className="text-white/70 text-sm">م. سارة تولّد الصورة...</p>
            <p className="text-white/40 text-xs">15-30 ثانية</p>
          </div>
        ) : (
          <div className="h-52 bg-gradient-to-br from-[#f0e8d8] to-[#e8d9c0] flex flex-col items-center justify-center gap-3">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] text-[#8B6914] bg-[#C9A84C]/20 px-2 py-0.5 rounded-full">{idea.styleLabel}</span>
            </div>
            <Wand2 className="w-10 h-10 text-[#C9A84C]/50" />
            <p className="text-sm text-[#8B6914] font-bold">{idea.title}</p>
            <button
              onClick={() => onGenerateImage(idea.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
            >
              <Sparkles className="w-3 h-3" />
              توليد الصورة التصورية
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <p className="text-sm text-[#6B4C1E] leading-relaxed mb-3">{idea.description}</p>

        {/* Color palette */}
        <div className="flex gap-1.5 mb-3">
          {idea.palette.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="w-full h-8 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
              <span className="text-[9px] text-[#8B6914] text-center leading-tight">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Materials */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.materials.map((m, i) => (
            <span key={i} className="text-[10px] bg-[#f0e8d8] text-[#8B6914] px-2 py-1 rounded-full">{m}</span>
          ))}
        </div>

        {/* Cost summary */}
        <div className="bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-2xl p-3 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setShowReplacement(!showReplacement)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/70 mb-0.5">التكلفة التقديرية</p>
              <p className="text-base font-black text-white">{idea.estimatedCost}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <DollarSign className="w-5 h-5 text-white/70" />
              {showReplacement ? <ChevronUp className="w-3 h-3 text-white/70" /> : <ChevronDown className="w-3 h-3 text-white/70" />}
            </div>
          </div>
        </div>

        {/* Replacement costs */}
        {showReplacement && idea.replacementCosts.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-xs font-bold text-[#5C3D11] mb-2">تكاليف الاستبدال التفصيلية:</p>
            {idea.replacementCosts.map((r, i) => (
              <div key={i} className="bg-[#faf6f0] rounded-xl p-3 border border-[#e8d9c0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#5C3D11]">{r.item}</span>
                  <span className="text-[10px] text-[#C9A84C] font-bold bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">{r.replacementCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8B6914]/60">التقدير الحالي: {r.currentEstimate}</span>
                </div>
                {r.notes && <p className="text-[10px] text-[#8B6914]/70 mt-1 leading-tight">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Highlights toggle */}
        <button onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between py-2 border-t border-[#f0e8d8]">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#5C3D11]">مزايا التصميم ({idea.highlights.length})</span>
          </div>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-[#8B6914]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B6914]" />}
        </button>
        {showDetails && (
          <div className="mt-2 space-y-1.5">
            {idea.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B4C1E] leading-relaxed">{h}</p>
              </div>
            ))}
          </div>
        )}

        {/* Generate image button if not generated */}
        {!idea.imageUrl && !idea.isGeneratingImage && (
          <button onClick={() => onGenerateImage(idea.id)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-[#C9A84C]/10 text-[#8B6914] text-xs font-bold rounded-xl border border-[#C9A84C]/30 active:scale-95 transition-transform">
            <Wand2 className="w-3.5 h-3.5" />
            توليد الصورة التصورية الواقعية
          </button>
        )}

        {/* Lightbox */}
        {lightbox && idea.imageUrl && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <img src={idea.imageUrl} className="max-w-full max-h-full object-contain rounded-xl" alt={idea.title} />
            <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"><X className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function SmartCapture() {
  const [, navigate] = useLocation();

  // UI state
  const [step, setStep] = useState<"select" | "capture" | "analyzing" | "results">("select");
  const [selectedMode, setSelectedMode] = useState<CaptureMode | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Captured images
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);

  // Results
  const [ideas, setIdeas] = useState<DesignIdea[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [ideasCount, setIdeasCount] = useState(3);
  const [budgetLevel, setBudgetLevel] = useState<"economy" | "mid" | "luxury" | "premium">("mid");
  const [showFilters, setShowFilters] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const BUDGET_MAP = {
    economy: { min: 5000, max: 20000, label: "اقتصادي", range: "5k-20k" },
    mid: { min: 20000, max: 60000, label: "متوسط", range: "20k-60k" },
    luxury: { min: 60000, max: 150000, label: "فاخر", range: "60k-150k" },
    premium: { min: 150000, max: 500000, label: "بريميوم", range: "150k+" },
  };

  // Target count for 3D animation mode
  const targetCount = selectedMode === "animation3d" ? 4 : 1;

  const analyzeAndGenerateMutation = trpc.analyzeAndGenerateIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas.map((idea: Partial<DesignIdea> & { id?: string }) => ({
          id: idea.id || Math.random().toString(36).slice(2),
          title: idea.title || "فكرة تصميمية",
          style: idea.style || "modern",
          styleLabel: idea.styleLabel || "عصري",
          description: idea.description || "",
          palette: idea.palette || [],
          materials: idea.materials || [],
          highlights: idea.highlights || [],
          estimatedCost: idea.estimatedCost || "",
          costMin: idea.costMin || 0,
          costMax: idea.costMax || 0,
          replacementCosts: idea.replacementCosts || [],
          imagePrompt: idea.imagePrompt || "",
          imageUrl: undefined,
          isGeneratingImage: false,
        })));
      }
      setStep("results");
    },
    onError: () => {
      toast.error("فشل التحليل، حاول مجدداً");
      setStep("capture");
    },
  });

  const generateVizMutation = trpc.generateVisualization.useMutation({
    onSuccess: (data, variables) => {
      const vars = variables as typeof variables & { ideaId?: string };
      if (data.imageUrl && vars.ideaId) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === vars.ideaId
              ? { ...idea, imageUrl: data.imageUrl!, isGeneratingImage: false }
              : idea
          )
        );
        toast.success("تم توليد الصورة التصورية!");
      } else {
        setIdeas((prev) => prev.map((idea) => ({ ...idea, isGeneratingImage: false })));
        toast.error("فشل توليد الصورة");
      }
    },
    onError: () => {
      setIdeas((prev) => prev.map((idea) => ({ ...idea, isGeneratingImage: false })));
      toast.error("فشل توليد الصورة");
    },
  });

  const handleModeSelect = (mode: CaptureMode) => {
    setSelectedMode(mode);
    if (mode === "video360") {
      setShowVideo(true);
    } else {
      setShowCamera(true);
    }
    setStep("capture");
  };

  const handleCapture = (dataUrl: string) => {
    const newImages = [...capturedImages, dataUrl];
    setCapturedImages(newImages);
    if (newImages.length === 1) setPrimaryImage(dataUrl);

    // For 3D animation, need 4 shots
    if (selectedMode === "animation3d" && newImages.length < 4) {
      // Keep camera open for more shots
      return;
    }

    // Done capturing
    setShowCamera(false);
    startAnalysis(newImages);
  };

  const handleVideoCapture = (thumb: string) => {
    setShowVideo(false);
    setPrimaryImage(thumb);
    setCapturedImages([thumb]);
    startAnalysis([thumb]);
  };

  const startAnalysis = (images: string[]) => {
    setStep("analyzing");
    const budget = BUDGET_MAP[budgetLevel];
    analyzeAndGenerateMutation.mutate({
      imageUrl: images[0],
      imageUrls: images.length > 1 ? images : undefined,
      captureMode: selectedMode || "single",
      count: ideasCount,
      budgetMin: budget.min,
      budgetMax: budget.max,
    });
  };

  const handleGenerateImage = useCallback((ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || !primaryImage) return;
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, isGeneratingImage: true } : i));
    // Build a highly specific prompt that matches the original photo's perspective
    const colorList = idea.palette.map(c => c.name).join(", ");
    const matList = idea.materials.slice(0, 4).join(", ");
    const enhancedPrompt = idea.imagePrompt
      ? `Interior design render of the EXACT SAME room from the EXACT SAME camera angle and perspective as the reference photo. ` +
        `Style: ${idea.styleLabel}. Colors: ${colorList}. Materials: ${matList}. ` +
        `${idea.imagePrompt}. ` +
        `Keep the same room dimensions, same wall positions, same windows/doors layout. ` +
        `Replace only furniture, decor, colors and finishes. ` +
        `Photorealistic architectural visualization, cinematic lighting, 8K quality, no people, no text.`
      : `Interior design render of the EXACT SAME room from the EXACT SAME camera angle. ` +
        `Style: ${idea.styleLabel}. Colors: ${colorList}. Materials: ${matList}. ` +
        `Keep same room structure, replace only furniture and finishes. ` +
        `Photorealistic, cinematic lighting, 8K, no people.`;
    (generateVizMutation.mutate as (input: Parameters<typeof generateVizMutation.mutate>[0] & { ideaId: string }) => void)({
      imageUrl: primaryImage,
      designStyle: idea.style,
      palette: idea.palette,
      materials: enhancedPrompt,
      ideaId,
    });
  }, [ideas, primaryImage]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      // Compress before analysis
      const dataUrl = await compressImage(raw, 1280, 0.85);
      setPrimaryImage(dataUrl);
      setCapturedImages([dataUrl]);
      startAnalysis([dataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStep("select");
    setSelectedMode(null);
    setCapturedImages([]);
    setPrimaryImage(null);
    setIdeas([]);
    setFavorites(new Set());
  };

  const budget = BUDGET_MAP[budgetLevel];

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Camera overlays */}
      {showCamera && selectedMode && selectedMode !== "panorama" && (
        <LiveCamera
          mode={selectedMode}
          capturedCount={capturedImages.length}
          targetCount={targetCount}
          onCapture={handleCapture}
          onClose={() => { setShowCamera(false); setStep("select"); setCapturedImages([]); }}
        />
      )}
      {showCamera && selectedMode === "panorama" && (
        <PanoramaCapture
          onCapture={(images) => {
            setShowCamera(false);
            setPrimaryImage(images[0]);
            setCapturedImages(images);
            startAnalysis(images);
          }}
          onClose={() => { setShowCamera(false); setStep("select"); setCapturedImages([]); }}
        />
      )}
      {showVideo && (
        <VideoRecorder
          onCapture={handleVideoCapture}
          onClose={() => { setShowVideo(false); setStep("select"); }}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 bg-white/90 backdrop-blur border-b border-[#e8d9c0] sticky top-0 z-40">
        <button onClick={() => step === "select" ? navigate("/") : reset()}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronRight className="w-6 h-6 text-[#8B6914]" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-[#5C3D11]">
            {step === "select" ? "كيف تريد التصوير؟" :
             step === "capture" ? "التقط الفضاء" :
             step === "analyzing" ? "م. سارة تحلل..." : "أفكار م. سارة"}
          </p>
          {step === "results" && (
            <p className="text-xs text-[#8B6914]/70">{ideas.length} أفكار • {budget.label} • اضغط لتوليد الصور</p>
          )}
        </div>
        {step === "results" && (
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border-2 transition-all ${showFilters ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
              <Palette className="w-4 h-4" />
            </button>
            <button onClick={reset} className="p-2 rounded-xl border-2 border-[#e8d9c0] text-[#5C3D11]">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 pb-24">

        {/* ===== STEP 1: Select Mode ===== */}
        {step === "select" && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-[#5C3D11]">صمّم فضاءك</h2>
              <p className="text-sm text-[#8B6914]/70 mt-1">اختر طريقة التصوير وسأقدم لك أفكاراً فورية</p>
            </div>

            {/* Mode cards */}
            <div className="grid grid-cols-2 gap-3">
              {CAPTURE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className="flex flex-col items-center gap-3 p-5 rounded-3xl border-2 border-[#e8d9c0] bg-white active:scale-95 transition-all hover:border-[#C9A84C]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: mode.color + "22", color: mode.color }}>
                    {mode.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-black text-[#5C3D11] text-sm">{mode.label}</p>
                    <p className="text-[10px] text-[#8B6914]/60 mt-0.5">{mode.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Or upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e8d9c0]" />
              <span className="text-xs text-[#8B6914]/60">أو</span>
              <div className="flex-1 h-px bg-[#e8d9c0]" />
            </div>

            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#C9A84C]/40 bg-[#C9A84C]/5 text-[#8B6914] font-bold text-sm active:scale-95 transition-transform">
              <ImageIcon className="w-5 h-5" />
              رفع صورة من المعرض
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

            {/* Quick filters */}
            <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#5C3D11]">الميزانية</p>
                <span className="text-xs text-[#8B6914] bg-[#f0e8d8] px-2 py-0.5 rounded-full">{budget.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(BUDGET_MAP) as [typeof budgetLevel, typeof BUDGET_MAP[typeof budgetLevel]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setBudgetLevel(key)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${budgetLevel === key ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
                    {val.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-bold text-[#5C3D11]">عدد الأفكار</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIdeasCount((c) => Math.max(2, c - 1))}
                    className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Minus className="w-3 h-3 text-[#8B6914]" />
                  </button>
                  <span className="text-base font-black text-[#5C3D11] w-4 text-center">{ideasCount}</span>
                  <button onClick={() => setIdeasCount((c) => Math.min(6, c + 1))}
                    className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center active:scale-90 transition-transform">
                    <Plus className="w-3 h-3 text-[#8B6914]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#C9A84C]/10 rounded-2xl p-3 border border-[#C9A84C]/20">
              <p className="text-xs text-[#8B6914] text-center leading-relaxed">
                ✨ <strong>م. سارة</strong> ستحلل الصورة وتقدم {ideasCount} أفكار تصميمية فورية مع تكاليف الاستبدال
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Analyzing ===== */}
        {step === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {primaryImage && (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden">
                <img src={primaryImage} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-[#5C3D11]/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#C9A84C] animate-pulse" />
                  </div>
                  <p className="text-white font-black text-lg">م. سارة تحلل الفضاء</p>
                  <p className="text-white/70 text-sm">تولّد {ideasCount} أفكار تصميمية...</p>
                </div>
              </div>
            )}
            <div className="w-full space-y-2.5">
              {[
                "تحليل الفضاء والأبعاد والإضاءة",
                `توليد ${ideasCount} أفكار تصميمية متنوعة`,
                "حساب تكاليف الاستبدال التفصيلية",
                "اقتراح الألوان والمواد المثالية",
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#e8d9c0]">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 3: Results ===== */}
        {step === "results" && (
          <div className="flex-1 flex flex-col gap-4">

            {/* Original image + quick filters */}
            {primaryImage && (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={primaryImage} className="w-full h-36 object-cover" alt="original" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-white/70">الصورة الأصلية</span>
                    <p className="text-white font-bold text-sm">{CAPTURE_MODES.find(m => m.id === selectedMode)?.label}</p>
                  </div>
                  <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 backdrop-blur rounded-xl text-white text-[10px] font-bold">
                    <RotateCcw className="w-3 h-3" /> تصوير جديد
                  </button>
                </div>
              </div>
            )}

            {/* Filters panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl p-4 border border-[#e8d9c0] shadow-sm">
                <p className="text-sm font-bold text-[#5C3D11] mb-3">تعديل الفلاتر</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {(Object.entries(BUDGET_MAP) as [typeof budgetLevel, typeof BUDGET_MAP[typeof budgetLevel]][]).map(([key, val]) => (
                    <button key={key} onClick={() => setBudgetLevel(key)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${budgetLevel === key ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5C3D11]">عدد الأفكار</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIdeasCount((c) => Math.max(2, c - 1))}
                      className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center"><Minus className="w-3 h-3 text-[#8B6914]" /></button>
                    <span className="font-black text-[#5C3D11]">{ideasCount}</span>
                    <button onClick={() => setIdeasCount((c) => Math.min(6, c + 1))}
                      className="w-7 h-7 rounded-full border-2 border-[#e8d9c0] flex items-center justify-center"><Plus className="w-3 h-3 text-[#8B6914]" /></button>
                  </div>
                </div>
                <button onClick={() => { setShowFilters(false); startAnalysis(capturedImages); }}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform">
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> تحديث الأفكار
                  </span>
                </button>
              </div>
            )}

            {/* Ideas */}
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-[#5C3D11]">{ideas.length} أفكار تصميمية</p>
              <button onClick={() => startAnalysis(capturedImages)}
                className="flex items-center gap-1.5 text-xs text-[#8B6914] font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> تجديد
              </button>
            </div>

            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onGenerateImage={handleGenerateImage}
                onFavorite={toggleFavorite}
                isFavorited={favorites.has(idea.id)}
              />
            ))}

            {/* Share / Save */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => toast.success("تم الحفظ في مشاريعك")}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#e8d9c0] bg-white text-[#5C3D11] text-sm font-bold active:scale-95 transition-transform">
                حفظ في المشاريع
              </button>
              <button onClick={() => {
                if (navigator.share) navigator.share({ title: "أفكار م. سارة", text: `${ideas.length} أفكار تصميمية` });
                else toast.success("تم النسخ");
              }} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-sm font-bold active:scale-95 transition-transform">
                <Share2 className="w-4 h-4" /> مشاركة
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
