"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200/40 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm select-none">
      <button
        onClick={() => setLanguage("fr")}
        className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
          language === "fr"
            ? "bg-white dark:bg-zinc-850 text-teal-600 dark:text-teal-400 shadow-sm border border-zinc-200/30 dark:border-zinc-850"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
          language === "en"
            ? "bg-white dark:bg-zinc-850 text-teal-600 dark:text-teal-400 shadow-sm border border-zinc-200/30 dark:border-zinc-850"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
