"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Key,
  Check,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface CopilotEvaluationData {
  isAiGenerated?: boolean;
  fallbackReason?: string | null;
  suggestedGrade: number;
  summaryFeedback: string;
  strengths?: string[];
  improvements?: string[];
  rubricBreakdown?: Array<{
    criterion: string;
    score: number;
    comment: string;
  }>;
}

interface CopilotHomeworkCardProps {
  evaluation: CopilotEvaluationData;
  onApply: (suggestedGrade: string, summaryFeedback: string) => void;
}

export function CopilotHomeworkCard({ evaluation, onApply }: CopilotHomeworkCardProps) {
  const [copied, setCopied] = useState(false);
  const isAi = evaluation.isAiGenerated === true;
  const grade = Number(evaluation.suggestedGrade) || 0;

  // Grade color theme
  const gradeBadgeBg =
    grade >= 80
      ? "bg-emerald-600 text-white"
      : grade >= 60
      ? "bg-amber-600 text-white"
      : "bg-rose-600 text-white";

  const handleApply = () => {
    onApply(grade.toString(), evaluation.summaryFeedback || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-teal-200/90 dark:border-teal-800/80 bg-white dark:bg-zinc-900 shadow-md overflow-hidden text-xs transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-50/90 via-slate-50 to-indigo-50/70 dark:from-zinc-800/90 dark:via-zinc-800/70 dark:to-zinc-800/90 border-b border-teal-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl shadow-xs ${
              isAi
                ? "bg-teal-500 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-zinc-900 dark:text-white text-xs tracking-tight">
                Copilot IA d'Évaluation
              </span>
              {isAi ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Analysé par Gemini IA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Estimation locale (Clé Gemini requise)
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAi
                ? "Correction automatisée basée sur le contenu du devoir et les critères académiques."
                : "Résultat généré selon le barème standard en attente de la clé Gemini."}
            </p>
          </div>
        </div>

        {/* Suggested Grade Pill */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Note suggérée</span>
            <span className={`text-xs font-black px-3 py-1 rounded-xl shadow-xs ${gradeBadgeBg}`}>
              {grade} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3.5">
        {/* Notice if Gemini Key is missing */}
        {!isAi && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-950 dark:text-amber-100">
                Pourquoi cette même estimation par défaut s'affiche ?
              </p>
              <p className="text-amber-900/90 dark:text-amber-300/90 text-[10px]">
                La variable d'environnement <code className="font-mono font-bold bg-amber-100/80 dark:bg-amber-900/60 px-1 py-0.5 rounded">GEMINI_API_KEY</code> n'est pas encore configurée avec votre clé API Gemini active. L'auto-correction s'exécute donc en mode secours standardisé.
              </p>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 pt-1 font-medium">
                💡 En renseignant votre clé payante Gemini, l'IA lira directement le document PDF et adaptera note, forces et faiblesses en temps réel à chaque étudiant.
              </p>
            </div>
          </div>
        )}

        {/* Global Summary Feedback */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Synthèse &amp; Commentaire d'appréciation
          </span>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-100 text-xs leading-relaxed font-medium">
            {evaluation.summaryFeedback}
          </div>
        </div>

        {/* Strengths & Improvements */}
        {((evaluation.strengths && evaluation.strengths.length > 0) ||
          (evaluation.improvements && evaluation.improvements.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Strengths */}
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Points forts ({evaluation.strengths.length})
                </p>
                <ul className="space-y-1 mt-1">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx} className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {evaluation.improvements && evaluation.improvements.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-1.5">
                <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Axes de progression ({evaluation.improvements.length})
                </p>
                <ul className="space-y-1 mt-1">
                  {evaluation.improvements.map((imp, idx) => (
                    <li key={idx} className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Rubric Breakdown Grid */}
        {evaluation.rubricBreakdown && evaluation.rubricBreakdown.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Grille d'évaluation détaillée
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {evaluation.rubricBreakdown.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate text-[11px]" title={r.criterion}>
                      {r.criterion}
                    </span>
                    <span className="font-black text-teal-700 dark:text-teal-400 shrink-0 text-xs">
                      {r.score}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }}
                    />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[10px] leading-tight">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            L'évaluation par IA est consultative : vous conservez l'entière autorité pédagogique.
          </span>
          <button
            type="button"
            onClick={handleApply}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{copied ? "Appliqué avec succès !" : "Appliquer au formulaire"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
