"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fr } from "@/locales/fr";
import { en } from "@/locales/en";
import { LocaleType } from "@/locales/fr";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [dict, setDict] = useState<LocaleType>(fr);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("kuettu_lang") as Language | null;
      if (savedLang === "en" || savedLang === "fr") {
        setLanguageState(savedLang);
        setDict(savedLang === "en" ? en : fr);
      } else {
        const browserLang = navigator.language.substring(0, 2).toLowerCase();
        const detected = browserLang === "en" ? "en" : "fr";
        setLanguageState(detected);
        setDict(detected === "en" ? en : fr);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setDict(lang === "en" ? en : fr);
    if (typeof window !== "undefined") {
      localStorage.setItem("kuettu_lang", lang);
      document.cookie = `kuettu_lang=${lang}; path=/; max-age=31536000`;
    }
  };

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return fallback || keyPath;
      }
    }
    return typeof current === "string" ? current : fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
