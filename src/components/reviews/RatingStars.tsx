// src/components/reviews/RatingStars.tsx
"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export interface RatingStarsProps {
  rating: number; // 0 to 5 (e.g. 4.5 or 5)
  maxRating?: number;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-9 h-9",
};

const RATING_LABELS: Record<number, string> = {
  1: "Médiocre",
  2: "Passable",
  3: "Bien",
  4: "Très bien",
  5: "Excellent !",
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  interactive = false,
  onRatingChange,
  size = "md",
  showValue = false,
  showLabel = false,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const currentRating = hoverRating !== null ? hoverRating : rating;
  const starSizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (!interactive || !onRatingChange) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRatingChange(starIndex);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(maxRating, starIndex + 1);
      onRatingChange(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = Math.max(1, starIndex - 1);
      onRatingChange(prev);
    } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
      e.preventDefault();
      onRatingChange(parseInt(e.key, 10));
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div
        className="flex items-center gap-1"
        role={interactive ? "radiogroup" : "img"}
        aria-label={
          interactive
            ? "Attribuer une note de 1 à 5 étoiles"
            : `Note de ${rating.toFixed(1)} sur ${maxRating} étoiles`
        }
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {Array.from({ length: maxRating }, (_, idx) => {
          const starIndex = idx + 1;
          const isFilled = currentRating >= starIndex;
          const isHalf = !isFilled && currentRating >= starIndex - 0.5 && !interactive;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              aria-label={`${starIndex} étoile${starIndex > 1 ? "s" : ""} - ${RATING_LABELS[starIndex] || ""}`}
              aria-checked={interactive ? rating === starIndex : undefined}
              role={interactive ? "radio" : undefined}
              tabIndex={interactive ? (rating === starIndex || (rating === 0 && starIndex === 1) ? 0 : -1) : -1}
              onClick={() => interactive && onRatingChange?.(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onFocus={() => interactive && setHoverRating(starIndex)}
              onBlur={() => interactive && setHoverRating(null)}
              onKeyDown={(e) => handleKeyDown(e, starIndex)}
              className={`relative transition-transform ${
                interactive
                  ? "cursor-pointer hover:scale-115 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-0.5"
                  : "cursor-default"
              }`}
            >
              {isHalf ? (
                <div className="relative">
                  {/* Empty base star */}
                  <Star className={`${starSizeClass} text-zinc-200 dark:text-zinc-700`} fill="currentColor" />
                  {/* Half filled overlay */}
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className={`${starSizeClass} text-amber-400 fill-amber-400`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${starSizeClass} transition-colors ${
                    isFilled
                      ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                      : "text-zinc-200 dark:text-zinc-700"
                  }`}
                  fill={isFilled ? "currentColor" : "none"}
                  strokeWidth={isFilled ? 0 : 1.5}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-bold text-sm text-zinc-900 dark:text-white tabular-nums">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
        </span>
      )}

      {showLabel && currentRating > 0 && RATING_LABELS[Math.round(currentRating)] && (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-1 animate-in fade-in duration-150">
          {RATING_LABELS[Math.round(currentRating)]}
        </span>
      )}
    </div>
  );
};
