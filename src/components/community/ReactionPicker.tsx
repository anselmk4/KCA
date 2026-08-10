"use client";

import React from "react";
import { Sparkles, ThumbsUp, Flame, Lightbulb, Heart, Rocket } from "lucide-react";

export type ReactionType = "LIKE" | "BRAVO" | "INTERESTING" | "GENIUS" | "LOVE";

export interface ReactionConfig {
  type: ReactionType;
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const font_REACTIONS: Record<ReactionType, ReactionConfig> = {
  LIKE: {
    type: "LIKE",
    label: "J'aime",
    emoji: "🚀",
    icon: Rocket,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
  },
  BRAVO: {
    type: "BRAVO",
    label: "Bravo",
    emoji: "👏",
    icon: ThumbsUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  INTERESTING: {
    type: "INTERESTING",
    label: "Intéressant",
    emoji: "💡",
    icon: Lightbulb,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  GENIUS: {
    type: "GENIUS",
    label: "Idée Géniale",
    emoji: "🔥",
    icon: Flame,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
  },
  LOVE: {
    type: "LOVE",
    label: "J'adore",
    emoji: "❤️",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  },
};

export const REACTION_LIST: ReactionConfig[] = [
  font_REACTIONS.LIKE,
  font_REACTIONS.BRAVO,
  font_REACTIONS.INTERESTING,
  font_REACTIONS.GENIUS,
  font_REACTIONS.LOVE,
];

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactionPicker({ onSelect, isOpen, onClose }: ReactionPickerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-full mb-2 left-0 z-30 flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-full shadow-2xl animate-in zoom-in-95 fade-in duration-200"
      onMouseLeave={onClose}
    >
      {REACTION_LIST.map((r) => {
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => {
              onSelect(r.type);
              onClose();
            }}
            className="group relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-125 cursor-pointer"
            title={r.label}
          >
            <span className="text-xl leading-none select-none">{r.emoji}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none shadow-md">
              {r.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
