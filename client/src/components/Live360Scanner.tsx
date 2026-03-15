/**
 * Live360Scanner — مسح 360° لايف تفاعلي
 * يفتح الكاميرا مباشرة ويوجّه المستخدم خطوة بخطوة لتصوير كل جدار/سقف/أرضية
 * بعد اكتمال المسح يُرسل الصور مباشرة للتحليل
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, RefreshCw, ChevronRight, X, Zap, RotateCcw } from "lucide-react";

export interface ScanStep {
  id: number;
  title: string;
  titleEn: string;
  desc: string;
  icon: string;
  direction: string; // اتجاه السهم التوجيهي
}

export const SCAN_STEPS: ScanStep[] = [
  { id: 1, title: "الجدار الأمامي", titleEn: "front_wall", desc: "وجّه الكاميرا للجدار أمامك مباشرة", icon: "⬆️", direction: "up" },
  { id: 2, title: "الجدار الأيمن", titleEn: "right_wall", desc: "استدر يميناً 90° وصوّر الجدار كاملاً", icon: "➡️", direction: "right" },
  { id: 3, title: "الجدار الخلفي", titleEn: "back_wall", desc: "استدر 180° وصوّر الجدار خلفك", icon: "⬇️", direction: "down" },
  { id: 4, title: "الجدار الأيسر", titleEn: "left_wall", desc: "استدر يساراً وصوّر الجدار كاملاً", icon: "⬅️", direction: "left" },
  { id: 5, title: "السقف", titleEn: "ceiling", desc: "وجّه الكاميرا للأعلى وصوّر السقف", icon: "🔝", direction: "up-tilt" },
  { id: 6, title: "الأرضية", titleEn: "floor", desc: "وجّه الكاميرا للأسفل وصوّر الأرضية", icon: "⬇️", direction: "down-tilt" },
  { id: 7, title: "زوايا الغرفة", titleEn: "corners", desc: "صوّر زاوية واحدة تظهر فيها جدارين", icon: "📐", direction: "corner" },
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

export default function Live360Scanner({ onComplete, onClose, onUploadPhoto }: Live360ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const currentStep = SCAN_STEPS[currentStepIdx];
  const isLastStep = currentStepIdx === SCAN_STEPS.length - 1;
  const progress = (capturedPhotos.length / SCAN_STEPS.length) * 100;

  // فتح الكاميرا
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      // محاولة الكاميرا الخلفية أولاً بأعلى جودة
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      // fallback: أي كاميرا متاحة
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

  // إيقاف الكاميرا
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // التقاط الصورة
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    setIsCapturing(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setPreviewPhoto(dataUrl);
    setIsCapturing(false);
  }, [cameraReady]);

  // تأكيد الصورة ورفعها
  const confirmPhoto = useCallback(async () => {
    if (!previewPhoto) return;
    setIsUploading(true);

    try {
      const base64 = previewPhoto.split(",")[1];
      const uploadedUrl = await onUploadPhoto(base64, "image/jpeg");

      const newPhoto: CapturedPhoto = {
        step: currentStep,
        dataUrl: previewPhoto,
        uploadedUrl,
      };

      const updatedPhotos = [...capturedPhotos, newPhoto];
      setCapturedPhotos(updatedPhotos);
      setPreviewPhoto(null);

      if (isLastStep) {
        // اكتمل المسح — أرسل الصور للتحليل
        stopCamera();
        onComplete(updatedPhotos);
      } else {
        setCurrentStepIdx(prev => prev + 1);
      }
    } catch {
      // في حالة فشل الرفع، احتفظ بالصورة محلياً
      const newPhoto: CapturedPhoto = {
        step: currentStep,
        dataUrl: previewPhoto,
      };
      const updatedPhotos = [...capturedPhotos, newPhoto];
      setCapturedPhotos(updatedPhotos);
      setPreviewPhoto(null);
      if (isLastStep) {
        stopCamera();
        onComplete(updatedPhotos);
      } else {
        setCurrentStepIdx(prev => prev + 1);
      }
    } finally {
      setIsUploading(false);
    }
  }, [previewPhoto, currentStep, capturedPhotos, isLastStep, onComplete, onUploadPhoto, stopCamera]);

  // إعادة تصوير الخطوة الحالية
  const retakePhoto = useCallback(() => {
    setPreviewPhoto(null);
  }, []);

  // التقاط بعد عد تنازلي
  const startCountdown = useCallback(() => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto]);

  // سهم التوجيه حسب الاتجاه
  const DirectionArrow = ({ direction }: { direction: string }) => {
    const arrows: Record<string, string> = {
      up: "↑",
      right: "→",
      down: "↓",
      left: "←",
      "up-tilt": "↑↑",
      "down-tilt": "↓↓",
      corner: "↗",
    };
    return (
      <div className="text-4xl font-black text-white drop-shadow-lg animate-bounce">
        {arrows[direction] || "↑"}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" dir="rtl">
      {/* شريط العنوان */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 pt-safe-top pb-6">
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">مسح 360° لايف</p>
            <p className="text-white/70 text-xs">{capturedPhotos.length} / {SCAN_STEPS.length} خطوات</p>
          </div>
          <div className="w-10" />
        </div>

        {/* شريط التقدم */}
        <div className="mt-3 flex gap-1">
          {SCAN_STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                i < capturedPhotos.length
                  ? "bg-green-400"
                  : i === currentStepIdx
                  ? "bg-amber-400 animate-pulse"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* عرض الكاميرا */}
      <div className="flex-1 relative overflow-hidden">
        {/* فيديو الكاميرا */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* فلاش التقاط */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-20 opacity-80 transition-opacity duration-200" />
        )}

        {/* خطأ الكاميرا */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <Camera className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white text-center px-8 mb-6">{cameraError}</p>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold"
            >
              <RefreshCw className="w-4 h-4" /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* معاينة الصورة الملتقطة */}
        {previewPhoto && (
          <div className="absolute inset-0 z-20 flex flex-col">
            <img src={previewPhoto} alt="معاينة" className="flex-1 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white text-center font-bold mb-4 text-lg">{currentStep.title}</p>
              <div className="flex gap-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-bold text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> إعادة التصوير
                </button>
                <button
                  onClick={confirmPhoto}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-70"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isUploading ? "جاري الرفع..." : isLastStep ? "إنهاء المسح ✓" : "التالي →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay التوجيه (يظهر فقط عند الكاميرا الحية) */}
        {!previewPhoto && cameraReady && (
          <>
            {/* إطار التوجيه */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* خطوط التوجيه */}
              <div className="w-3/4 h-3/4 border-2 border-white/40 rounded-2xl relative">
                {/* زوايا الإطار */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
              </div>
            </div>

            {/* سهم التوجيه */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <DirectionArrow direction={currentStep.direction} />
            </div>

            {/* عداد تنازلي */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-24 h-24 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="text-6xl font-black text-white">{countdown}</span>
                </div>
              </div>
            )}

            {/* الصور المكتملة (مصغّرة في الأعلى) */}
            {capturedPhotos.length > 0 && (
              <div className="absolute top-24 right-4 flex flex-col gap-1 pointer-events-none">
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
          </>
        )}
      </div>

      {/* شريط الخطوة الحالية والزر */}
      {!previewPhoto && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-safe-bottom pt-16">
          {/* معلومات الخطوة */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">{currentStep.icon}</span>
              <h3 className="text-white font-black text-xl">{currentStep.title}</h3>
              <span className="text-white/50 text-sm">({currentStep.id}/{SCAN_STEPS.length})</span>
            </div>
            <p className="text-white/70 text-sm">{currentStep.desc}</p>
          </div>

          {/* أزرار التقاط */}
          <div className="flex items-center justify-center gap-6 pb-8">
            {/* زر التقاط بعد عد تنازلي */}
            <button
              onClick={startCountdown}
              disabled={!cameraReady || countdown !== null || isCapturing}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-40"
            >
              <Zap className="w-6 h-6 text-white" />
            </button>

            {/* زر التقاط الرئيسي */}
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || countdown !== null || isCapturing}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 bg-white rounded-full" />
            </button>

            {/* تخطي هذه الخطوة */}
            {!isLastStep && (
              <button
                onClick={() => setCurrentStepIdx(prev => prev + 1)}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
