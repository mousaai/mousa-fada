import { useState, useEffect, useRef, useCallback } from "react";

// ===== Types =====
export type VoiceCommand =
  | "analyze" | "design" | "chat" | "projects"
  | "costs" | "moodboard" | "ar" | "stop" | "help";

export interface VoiceState {
  isListening: boolean;
  transcript: string;
  command: VoiceCommand | null;
  error: string | null;
  supported: boolean;
}

// ===== Arabic Command Map =====
const COMMAND_PATTERNS: { pattern: RegExp; command: VoiceCommand }[] = [
  { pattern: /تحليل|صوّر|صور|الكاميرا|افتح|التقط|تصوير/i, command: "analyze" },
  { pattern: /صمم|استوديو|تصميم|ابدأ|إنشاء/i, command: "design" },
  { pattern: /تحدث|اليازية|محادثة|كلمي|اسألي/i, command: "chat" },
  { pattern: /مشاريعي|مشاريع|أعمالي|ملفاتي/i, command: "projects" },
  { pattern: /تكاليف|ميزانية|سعر|تكلفة|حساب/i, command: "costs" },
  { pattern: /إلهام|لوحة/i, command: "moodboard" },
  { pattern: /مسح|قياس|أبعاد/i, command: "ar" },
  { pattern: /توقف|إيقاف|اسكت|كفى/i, command: "stop" },
  { pattern: /مساعدة|ساعدني|ماذا|كيف/i, command: "help" },
];

function detectCommand(text: string): VoiceCommand | null {
  for (const { pattern, command } of COMMAND_PATTERNS) {
    if (pattern.test(text)) return command;
  }
  return null;
}

// ===== Browser Speech API (loose types) =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getSpeechRecognition(): (new () => AnyRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ===== Hook =====
export function useVoiceCommands(onCommand?: (cmd: VoiceCommand, transcript: string) => void) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: "",
    command: null,
    error: null,
    supported: !!getSpeechRecognition(),
  });

  const recognitionRef = useRef<AnyRecognition>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setState((s) => ({ ...s, error: "المتصفح لا يدعم التعرف على الصوت" }));
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState((s) => ({ ...s, isListening: true, transcript: "", command: null, error: null }));
    };

    recognition.onresult = (event: AnyRecognition) => {
      const results = Array.from(event.results as ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>);
      const transcript = results.map((r) => r[0].transcript).join(" ");
      const isFinal = results[results.length - 1]?.isFinal;

      setState((s) => ({ ...s, transcript }));

      if (isFinal) {
        const command = detectCommand(transcript);
        setState((s) => ({ ...s, command, isListening: false }));
        if (command && onCommand) onCommand(command, transcript);
      }
    };

    recognition.onerror = (event: AnyRecognition) => {
      const msg =
        event.error === "no-speech" ? "لم يُكتشف صوت، حاول مجدداً" :
        event.error === "not-allowed" ? "يرجى السماح بالوصول للميكروفون" :
        "خطأ في التعرف على الصوت";
      setState((s) => ({ ...s, error: msg, isListening: false }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
    timeoutRef.current = setTimeout(() => stopListening(), 8000);
  }, [onCommand, stopListening]);

  const toggleListening = useCallback(() => {
    if (state.isListening) stopListening();
    else startListening();
  }, [state.isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { ...state, startListening, stopListening, toggleListening };
}
