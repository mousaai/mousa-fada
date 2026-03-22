import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Language,
  TranslationKey,
  t as translate,
  isRTL,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/i18n";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getStoredLanguage);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    setStoredLanguage(newLang);
  }, []);

  const isRtl = isRTL(lang);
  const dir = isRtl ? "rtl" : "ltr";

  // Apply dir and lang to document
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    // Update font for Urdu
    if (lang === "ur") {
      document.documentElement.style.fontFamily = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";
    } else if (lang === "ar") {
      document.documentElement.style.fontFamily = "'Cairo', 'Noto Naskh Arabic', sans-serif";
    } else {
      document.documentElement.style.fontFamily = "";
    }
  }, [lang, dir]);

  const t = useCallback(
    (key: TranslationKey) => translate(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
