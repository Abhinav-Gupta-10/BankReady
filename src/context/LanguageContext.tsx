"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, LanguageInfo, LANGUAGES, TRANSLATIONS } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  currentLanguage: LanguageInfo;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "bankready_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang && LANGUAGES.some((l) => l.code === savedLang)) {
        setLanguageState(savedLang);
        applyDocumentAttributes(savedLang);
      } else {
        applyDocumentAttributes("en");
      }
    } catch {
      // Storage access may fail in private mode
      applyDocumentAttributes("en");
    }
    setMounted(true);
  }, []);

  const applyDocumentAttributes = (lang: Language) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    applyDocumentAttributes(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `bankready_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = TRANSLATIONS[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRTL = language === "ur";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        currentLanguage,
        languages: LANGUAGES,
      }}
    >
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-urdu" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
