"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Heart } from "lucide-react";

export function DonateHeader() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-3">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
        <span>{isEn ? "Crowdfunding Campaign" : "Campagne de Financement Participatif"}</span>
      </div>
      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {isEn ? "Support Education & Talent at Ansella" : "Soutenez l'Éducation & les Talents d'Ansella"}
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-2">
        {isEn
          ? "Every contribution funds scholarships and provides open access to world-class future-tech education."
          : "Chaque contribution permet de financer des bourses d'études et d'offrir un accès libre aux formations d'avenir."}
      </p>
    </div>
  );
}
