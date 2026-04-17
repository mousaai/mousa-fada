/**
 * Live360Scanner v2 — مسح تلقائي كامل
 * بمجرد فتح الكاميرا يبدأ المسح التلقائي:
 * - 4 جدران أفقياً (كل 3 ثوانٍ)
 * - سقف (رأسياً للأعلى)
 * - أرضية (رأسياً للأسفل)
 * - زاوية جامعة
 * لا يحتاج أي ضغط من المستخدم — فقط يحرك الكاميرا حسب التوجيه
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, RefreshCw, RotateCcw } from "lucide-react";

export interface ScanStep {
  id: number;
  title: string;
  titleEn: string;
  desc: string;
  emoji: string;
  arrowStyle: "up" | "right" | "down" | "left" | "ceiling" | "floor" | "corner";
  autoCaptureSec: number; // ثوانٍ قبل الالتقاط التلقائي
}

export const SCAN_STEPS: ScanStep[] = [
  { id: 1, title: "الجدار الأمامي", titleEn: "front_wall", desc: "وجّه الكاميرا للأمام", emoji: "⬆️", arrowStyle: "up", autoCaptureSec: 4 },
  { id: 2, title: "الجدار الأيمن", titleEn: "right_wall", desc: "استدر يميناً 90°", emoji: "➡️", arrowStyle: "right", autoCaptureSec: 4 },
  { id: 3, title: "الجدار الخلفي", titleEn: "back_wall", desc: "استدر للخلف 180°", emoji: "⬇️", arrowStyle: "down", autoCaptureSec: 4 },
  { id: 4, title: "الجدار الأيسر", titleEn: "left_wall", desc: "استدر يساراً 90°", emoji: "⬅️", arrowStyle: "left", autoCaptureSec: 4 },
  { id: 5, title: "السقف", titleEn: "ceiling", desc: "وجّه الكاميرا للأعلى", emoji: "🔝", arrowStyle: "ceiling", autoCaptureSec: 4 },
  { id: 6, title: "الأرضية", titleEn: "floor", desc: "وجّه الكاميرا للأسفل", emoji: "⬇️", arrowStyle: "floor", autoCaptureSec: 4 },
  { id: 7, title: "زاوية الغرفة", titleEn: "corners", desc: "صوّر زاوية تجمع جدارين", emoji: "📐", arrowStyle: "corner", autoCaptureSec: 4 },
];

export interface CapturedPhoto {
  step: ScanStep;
  dataUrl: string;
  uploadedUrl?: string;
}

interface Live360ScannerProps {
  onComplete: (photos: CapturedPhoto[]) => void;
  onClose: () => void;
  onUploadPhoto: (base64: string, mimeType: string) => Promise<string>;
}

// مكون سهم التوجيه المتحرك
function DirectionGuide({ style }: { style: ScanStep["arrowStyle"] }) {
  const configs: Record<ScanStep["arrowStyle"], { rotate: string; label: string; color: string }> = {
    up:      { rotate: "rotate-0",    label: "↑ أمامك",    color: "text-amber-400" },
    right:   { rotate: "rotate-90",   label: "→ يمينك",    color: "text-blue-400" },
    down:    { rotate: "rotate-180",  label: "↓ خلفك",     color: "text-green-400" },
    left:    { rotate: "-rotate-90",  label: "← يسارك",    color: "text-purple-400" },
    ceiling: { rotate: "rotate-0",    label: "↑↑ للأعلى",  color: "text-cyan-400" },
    floor:   { rotate: "rotate-180",  label: "↓↓ للأسفل",  color: "text-orange-400" },
    corner:  { rotate: "rotate-45",   label: "↗ زاوية",    color: "text-pink-400" },
  };
  const c = configs[style];
  return (
    <div className={`flex flex-col items-center gap-1 ${c.color}`}>
      <div className={`text-6xl font-black ${c.rotate} transition-transform duration-500 drop-shadow-lg`}>
        ↑
      </div>
      <span className="text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
        {c.label}
      </span>
    </div>
  );
}

// شريط العد التنازلي الدائري
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = ((total - seconds) / total) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke="#F59E0B" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="text-3xl font-black text-white z-10">{seconds}</span>
    </div>
  );
}

export default function Live360Scanner({ onComplete, onClose, onUploadPhoto }: Live360ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [countdown, setCountdown] = useState<number>(SCAN_STEPS[0].autoCaptureSec);
  const [scanStarted, setScanStarted] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentStep = SCAN_STEPS[currentStepIdx];
  const progress = (capturedPhotos.length / SCAN_STEPS.length) * 100;

  // فتح الكاميرا
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch {
        setCameraError("لا يمكن الوصول للكاميرا. تأكد من منح الإذن.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // التقاط الصورة
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // رفع ومعالجة الصورة
  const processCapture = useCallback(async (dataUrl: string, stepIdx: number, existingPhotos: CapturedPhoto[]) => {
    setIsProcessing(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    let uploadedUrl: string | undefined;
    try {
      const base64 = dataUrl.split(",")[1];
      uploadedUrl = await onUploadPhoto(base64, "image/jpeg");
    } catch {
      // الاحتفاظ بالصورة محلياً إذا فشل الرفع
    }

    const newPhoto: CapturedPhoto = {
      step: SCAN_STEPS[stepIdx],
      dataUrl,
      uploadedUrl,
    };

    const updatedPhotos = [...existingPhotos, newPhoto];
    setCapturedPhotos(updatedPhotos);
    setIsProcessing(false);

    const nextIdx = stepIdx + 1;
    if (nextIdx >= SCAN_STEPS.length) {
      // اكتمل المسح
      setScanComplete(true);
      stopCamera();
      setTimeout(() => {
        onComplete(updatedPhotos);
      }, 1500);
    } else {
      setCurrentStepIdx(nextIdx);
      setCountdown(SCAN_STEPS[nextIdx].autoCaptureSec);
    }
  }, [onUploadPhoto, onComplete, stopCamera]);

  // بدء المسح التلقائي
  const startAutoScan = useCallback(() => {
    if (!cameraReady || scanStarted) return;
    setScanStarted(true);

    let stepIdx = 0;
    let photos: CapturedPhoto[] = [];
    let secondsLeft = SCAN_STEPS[0].autoCaptureSec;

    setCountdown(secondsLeft);

    countdownRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        // التقاط الصورة
        const dataUrl = captureFrame();
        if (dataUrl) {
          const capturedIdx = stepIdx;
          const capturedPhotos = photos;

          // رفع وانتقال للخطوة التالية
          setFlashActive(true);
          setTimeout(() => setFlashActive(false), 150);

          setIsProcessing(true);
          const base64 = dataUrl.split(",")[1];
          onUploadPhoto(base64, "image/jpeg")
            .then(uploadedUrl => {
              const newPhoto: CapturedPhoto = { step: SCAN_STEPS[capturedIdx], dataUrl, uploadedUrl };
              photos = [...capturedPhotos, newPhoto];
              setCapturedPhotos([...photos]);
              setIsProcessing(false);

              const nextIdx = capturedIdx + 1;
              if (nextIdx >= SCAN_STEPS.length) {
                // اكتمل المسح
                if (countdownRef.current) clearInterval(countdownRef.current);
                setScanComplete(true);
                stopCamera();
                setTimeout(() => onComplete([...photos]), 1500);
              } else {
                stepIdx = nextIdx;
                setCurrentStepIdx(nextIdx);
                secondsLeft = SCAN_STEPS[nextIdx].autoCaptureSec;
                setCountdown(secondsLeft);
              }
            })
            .catch(() => {
              // fallback بدون رفع
              const newPhoto: CapturedPhoto = { step: SCAN_STEPS[capturedIdx], dataUrl };
              photos = [...capturedPhotos, newPhoto];
              setCapturedPhotos([...photos]);
              setIsProcessing(false);

              const nextIdx = capturedIdx + 1;
              if (nextIdx >= SCAN_STEPS.length) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setScanComplete(true);
                stopCamera();
                setTimeout(() => onComplete([...photos]), 1500);
              } else {
                stepIdx = nextIdx;
                setCurrentStepIdx(nextIdx);
                secondsLeft = SCAN_STEPS[nextIdx].autoCaptureSec;
                setCountdown(secondsLeft);
              }
            });
        }
      }
    }, 1000);
  }, [cameraReady, scanStarted, captureFrame, onUploadPhoto, onComplete, stopCamera]);

  // بدء المسح تلقائياً بمجرد جاهزية الكاميرا
  useEffect(() => {
    if (cameraReady && !scanStarted) {
      // تأخير قصير لإعطاء المستخدم وقتاً لرؤية الشاشة
      const timer = setTimeout(() => {
        startAutoScan();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [cameraReady, scanStarted, startAutoScan]);

  // إعادة المسح من البداية
  const restartScan = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCapturedPhotos([]);
    setCurrentStepIdx(0);
    setScanStarted(false);
    setScanComplete(false);
    setCountdown(SCAN_STEPS[0].autoCaptureSec);
    setIsProcessing(false);
    startCamera();
  }, [startCamera]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" dir="rtl">
      {/* فيديو الكاميرا */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* فلاش التقاط */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-20 pointer-events-none transition-opacity duration-150" />
      )}

      {/* خطأ الكاميرا */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white text-center text-lg font-bold mb-2">تعذّر الوصول للكاميرا</p>
          <p className="text-white/60 text-center text-sm mb-6">{cameraError}</p>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold"
          >
            <RefreshCw className="w-4 h-4" /> إعادة المحاولة
          </button>
          <button onClick={onClose} className="mt-3 text-white/50 text-sm">إغلاق</button>
        </div>
      )}

      {/* شاشة الاكتمال */}
      {scanComplete && (
        <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-white text-2xl font-black mb-2">اكتمل المسح!</h2>
          <p className="text-white/70 text-sm mb-1">{capturedPhotos.length} صورة تم التقاطها</p>
          <p className="text-amber-400 text-sm">جاري إرسال الصور لم. اليازية...</p>
          <div className="flex gap-1 mt-4">
            {capturedPhotos.map((p, i) => (
              <img key={i} src={p.dataUrl} alt="" className="w-10 h-8 object-cover rounded-lg border border-green-400/50" />
            ))}
          </div>
        </div>
      )}

      {/* الـ Overlay الرئيسي */}
      {!scanComplete && !cameraError && (
        <>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 pt-10 pb-8">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-white font-black text-sm">مسح تلقائي 360°</p>
                </div>
                <p className="text-white/60 text-xs">{capturedPhotos.length}/{SCAN_STEPS.length} مكتملة</p>
              </div>
              <button
                onClick={restartScan}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* شريط التقدم */}
            <div className="flex gap-1">
              {SCAN_STEPS.map((step, i) => (
                <div key={step.id} className="flex-1 relative">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${
                    i < capturedPhotos.length
                      ? "bg-green-400"
                      : i === currentStepIdx
                      ? "bg-amber-400"
                      : "bg-white/20"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* إطار التوجيه */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-3/5 relative">
              {/* زوايا الإطار */}
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
            </div>
          </div>

          {/* سهم التوجيه — وسط الشاشة */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <DirectionGuide style={currentStep.arrowStyle} />
          </div>

          {/* الصور المكتملة (مصغّرة على الجانب) */}
          {capturedPhotos.length > 0 && (
            <div className="absolute top-28 right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              {capturedPhotos.map((photo, i) => (
                <div key={i} className="relative">
                  <img
                    src={photo.dataUrl}
                    alt={photo.step.title}
                    className="w-12 h-9 object-cover rounded-lg border-2 border-green-400"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer — معلومات الخطوة والعد التنازلي */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-10 pt-16 z-10">
            {/* معلومات الخطوة */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{currentStep.emoji}</span>
                <h3 className="text-white font-black text-xl">{currentStep.title}</h3>
              </div>
              <p className="text-white/70 text-sm">{currentStep.desc}</p>
            </div>

            {/* العد التنازلي */}
            <div className="flex items-center justify-center gap-4">
              {scanStarted ? (
                <>
                  <CountdownRing seconds={countdown} total={currentStep.autoCaptureSec} />
                  <div className="text-center">
                    <p className="text-amber-400 font-bold text-sm">التقاط تلقائي</p>
                    <p className="text-white/50 text-xs">ثبّت الكاميرا</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {cameraReady ? (
                    <>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                      <p className="text-amber-400 text-sm font-bold">جاري التحضير...</p>
                    </>
                  ) : (
                    <p className="text-white/50 text-sm">جاري تشغيل الكاميرا...</p>
                  )}
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-xs">جاري الرفع...</span>
                </div>
              )}
            </div>

            {/* نصيحة */}
            <p className="text-center text-white/40 text-xs mt-3">
              المسح تلقائي — فقط وجّه الكاميرا حسب السهم وثبّتها
            </p>
          </div>
        </>
      )}
    </div>
  );
}
