// src/components/reviews/CourseReviewsSummary.tsx
"use client";

import React from "react";
import { RatingStars } from "./RatingStars";
import { ReviewStats } from "@/types/review";
import { Award, Users, Filter } from "lucide-react";

interface CourseReviewsSummaryProps {
  stats: ReviewStats;
  selectedStarFilter?: number;
  onSelectStarFilter?: (star?: number) => void;
  className?: string;
}

export const CourseReviewsSummary: React.FC<CourseReviewsSummaryProps> = ({
  stats,
  selectedStarFilter,
  onSelectStarFilter,
  className = "",
}) => {
  const { averageRating, totalReviews, distribution, percentages } = stats;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Global score showcase */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-150 dark:border-zinc-800">
          <div className="text-5xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {totalReviews > 0 ? averageRating.toFixed(1) : "—"}
          </div>

          <div className="mt-3">
            <RatingStars rating={averageRating} size="lg" />
          </div>

          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              {totalReviews === 0
                ? "Aucun avis pour le moment"
                : `${totalReviews} avis d'apprenant${totalReviews > 1 ? "s" : ""}`}
            </span>
          </p>

          {totalReviews > 0 && averageRating >= 4.5 && (
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-250 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
              <Award className="w-3.5 h-3.5" />
              Formation hautement recommandée
            </span>
          )}
        </div>

        {/* Right: Star breakdown progress bars */}
        <div className="md:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            <span>Ventilation des notes</span>
            {selectedStarFilter && onSelectStarFilter && (
              <button
                type="button"
                onClick={() => onSelectStarFilter(undefined)}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 normal-case font-semibold cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                Afficher tous les avis ({totalReviews})
              </button>
            )}
          </div>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = percentages[star as 1 | 2 | 3 | 4 | 5] || 0;
            const isSelected = selectedStarFilter === star;

            return (
              <button
                key={star}
                type="button"
                disabled={!onSelectStarFilter || count === 0}
                onClick={() => {
                  if (!onSelectStarFilter) return;
                  onSelectStarFilter(isSelected ? undefined : star);
                }}
                className={`w-full group flex items-center gap-3 text-xs text-left p-1.5 rounded-xl transition-all ${
                  count > 0 && onSelectStarFilter
                    ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    : "cursor-default opacity-85"
                } ${
                  isSelected
                    ? "bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-400/50"
                    : ""
                }`}
                title={count > 0 ? `Filtrer par les avis ${star} étoiles` : undefined}
              >
                <span className="w-14 shrink-0 font-bold flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <span>{star}</span>
                  <span className="text-amber-400">★</span>
                </span>

                {/* Progress bar track */}
                <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected
                        ? "bg-amber-500"
                        : "bg-amber-400 group-hover:bg-amber-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Percentage & count */}
                <span className="w-16 shrink-0 text-right font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {pct}% <span className="text-[11px] text-zinc-400">({count})</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
