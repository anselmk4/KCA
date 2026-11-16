"use client";

import React from "react";
import { Heart, Sparkles, GraduationCap, Globe2, ShieldCheck, Users } from "lucide-react";

export function DonationHero() {
  return (
    <div className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12 text-center">
      {/* Glow background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-teal-500/15 via-emerald-500/10 to-indigo-500/15 blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-3xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs sm:text-sm font-medium mb-6 shadow-sm">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 animate-pulse" />
          <span>Soutenez l'Éducation Technologique & l'Avenir d'Ansella</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
          Investissez dans les talents de demain,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
            un don à la fois
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Votre don permet de financer des bourses d&apos;apprentissage, d&apos;héberger du contenu éducatif en libre accès et de démocratiser les compétences de pointe en IA, développement et blockchain pour des milliers d&apos;étudiants.
        </p>

        {/* Pillars / Trust cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Bourses & Accès libre</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Offrez des formations diplômantes aux jeunes talents méritants.</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Impact Panafricain & Global</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Soutenez une infrastructure éducative locale accessible partout.</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">100% Sécurisé & Transparent</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Paiements cryptés via Mobile Money certifié ou PayPal.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

