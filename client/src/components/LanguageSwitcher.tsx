import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language, LANGUAGE_NAMES, LANGUAGE_FLAGS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LANGUAGES: Language[] = ["ar", "en", "ur", "fr"];

interface LanguageSwitcherProps {
  variant?: "icon" | "full";
  className?: string;
}

export default function LanguageSwitcher({
  variant = "icon",
  className = "",
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 text-sm font-medium ${className}`}
          aria-label="Change language"
        >
          {variant === "full" ? (
            <>
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_NAMES[lang]}</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{LANGUAGE_NAMES[lang]}</span>
              <span className="sm:hidden">{LANGUAGE_FLAGS[lang]}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={`flex items-center gap-2 cursor-pointer ${
              lang === l ? "font-bold bg-accent" : ""
            }`}
          >
            <span className="text-base">{LANGUAGE_FLAGS[l]}</span>
            <span>{LANGUAGE_NAMES[l]}</span>
            {lang === l && <span className="ml-auto text-xs text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
