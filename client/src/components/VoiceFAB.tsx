import { Mic, MicOff, X } from "lucide-react";
import { useLocation } from "wouter";
import { useVoiceCommands, VoiceCommand } from "@/hooks/useVoiceCommands";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const COMMAND_LABELS: Record<VoiceCommand, string> = {
  analyze: "فتح التحليل...",
  design: "فتح الاستوديو...",
  chat: "فتح م. اليازية...",
  projects: "فتح المشاريع...",
  costs: "فتح التكاليف...",
  moodboard: "فتح لوحة الإلهام...",
  ar: "فتح مسح AR...",
  stop: "إيقاف...",
  help: "عرض المساعدة...",
};

const COMMAND_HINTS = [
  "قل: «تحليل» لرفع صورة",
  "قل: «صمم» للاستوديو",
  "قل: «اليازية» للمحادثة",
  "قل: «مشاريعي» لمشاريعك",
  "قل: «تكاليف» للميزانية",
];

export function VoiceFAB() {
  const [, navigate] = useLocation();
  const { dir } = useLanguage();
  const [showHints, setShowHints] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { isListening, transcript, command, error, supported, toggleListening } = useVoiceCommands(
    (cmd) => {
      setFeedback(COMMAND_LABELS[cmd]);
      setTimeout(() => setFeedback(null), 1500);

      switch (cmd) {
        case "analyze": navigate("/"); setTimeout(() => document.getElementById("quick-analysis-btn")?.click(), 300); break;
        case "design": navigate("/design-studio"); break;
        case "chat": navigate("/sarah-chat"); break;
        case "projects": navigate("/projects"); break;
        case "costs": navigate("/costs"); break;
        case "moodboard": navigate("/mood-board"); break;
        case "ar": navigate("/ar-scan"); break;
        case "help": setShowHints(true); break;
        case "stop": break;
      }
    }
  );

  if (!supported) return null;

  return (
    <>
      {/* Hints Panel */}
      {showHints && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center pb-28"
          onClick={() => setShowHints(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 mx-4 w-full max-w-sm shadow-2xl"
            dir={dir}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[#5C3D11] text-lg">الأوامر الصوتية</span>
              <button onClick={() => setShowHints(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {COMMAND_HINTS.map((hint, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#faf6f0] rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <span className="text-sm text-[#5C3D11]">{hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transcript / Feedback Bubble */}
      {(isListening || feedback || transcript) && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#5C3D11] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg max-w-xs text-center"
          dir="rtl"
        >
          {feedback || (isListening ? (transcript || "أستمع...") : "")}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {error}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={toggleListening}
          className={`fixed bottom-20 left-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
          isListening
            ? "bg-red-500 shadow-red-300"
            : "bg-gradient-to-br from-[#C9A84C] to-[#8B6914] shadow-[#C9A84C]/40"
        }`}
        style={isListening ? { boxShadow: "0 0 0 8px rgba(239,68,68,0.2)" } : {}}
        aria-label={isListening ? "إيقاف الاستماع" : "بدء الأوامر الصوتية"}
        title="اضغط مطولاً لعرض الأوامر"
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
        {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </button>
    </>
  );
}
