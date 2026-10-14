"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, GraduationCap, Sparkles, FileText } from "lucide-react";

interface ColorfulContentCoverProps {
  title: string;
  category?: string | null;
  coverUrl?: string | null;
  type?: "course" | "digital_product";
  variant?: "card" | "hero" | "thumbnail";
  className?: string;
  heightClass?: string;
  children?: React.ReactNode;
}

// 6 Modern, vibrant palettes tailored for high-end SaaS covers
const COLOR_THEMES = [
  {
    bg: "from-indigo-950 via-slate-900 to-blue-950",
    border: "border-indigo-500/20",
    glow1: "bg-indigo-500/25",
    glow2: "bg-blue-500/20",
    accentText: "text-indigo-400",
    bar: "from-indigo-400 via-cyan-400 to-blue-500",
    badgeBg: "bg-indigo-950/80 border-indigo-700/60 text-indigo-300",
    iconColor: "text-indigo-400/40",
  },
  {
    bg: "from-emerald-950 via-teal-950 to-zinc-950",
    border: "border-teal-500/20",
    glow1: "bg-emerald-500/25",
    glow2: "bg-teal-500/20",
    accentText: "text-teal-400",
    bar: "from-emerald-400 via-teal-300 to-cyan-500",
    badgeBg: "bg-teal-950/80 border-teal-700/60 text-teal-300",
    iconColor: "text-teal-400/40",
  },
  {
    bg: "from-purple-950 via-violet-950 to-slate-950",
    border: "border-purple-500/20",
    glow1: "bg-purple-500/25",
    glow2: "bg-fuchsia-500/20",
    accentText: "text-purple-300",
    bar: "from-purple-400 via-fuchsia-400 to-pink-500",
    badgeBg: "bg-purple-950/80 border-purple-700/60 text-purple-300",
    iconColor: "text-purple-400/40",
  },
  {
    bg: "from-cyan-950 via-sky-950 to-zinc-950",
    border: "border-cyan-500/20",
    glow1: "bg-cyan-500/25",
    glow2: "bg-sky-500/20",
    accentText: "text-cyan-300",
    bar: "from-cyan-400 via-sky-300 to-blue-500",
    badgeBg: "bg-cyan-950/80 border-cyan-700/60 text-cyan-300",
    iconColor: "text-cyan-400/40",
  },
  {
    bg: "from-amber-950 via-orange-950 to-zinc-950",
    border: "border-amber-500/20",
    glow1: "bg-amber-500/25",
    glow2: "bg-rose-500/20",
    accentText: "text-amber-400",
    bar: "from-amber-400 via-orange-400 to-rose-500",
    badgeBg: "bg-amber-950/80 border-amber-700/60 text-amber-300",
    iconColor: "text-amber-400/40",
  },
  {
    bg: "from-rose-950 via-pink-950 to-slate-950",
    border: "border-rose-500/20",
    glow1: "bg-rose-500/25",
    glow2: "bg-red-500/20",
    accentText: "text-rose-300",
    bar: "from-rose-400 via-pink-400 to-amber-500",
    badgeBg: "bg-rose-950/80 border-rose-700/60 text-rose-300",
    iconColor: "text-rose-400/40",
  },
];

function getThemeForTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_THEMES.length;
  return COLOR_THEMES[index];
}

export function ColorfulContentCover({
  title,
  category,
  coverUrl,
  type = "course",
  variant = "card",
  className = "",
  heightClass,
  children,
}: ColorfulContentCoverProps) {
  const [hasError, setHasError] = useState(false);

  const isValidUrl =
    coverUrl &&
    typeof coverUrl === "string" &&
    coverUrl.trim().length > 4 &&
    !coverUrl.includes("placeholder-course.jpg") &&
    !hasError;

  const theme = getThemeForTitle(title || "Content");
  const Icon =
    type === "digital_product" ? FileText : GraduationCap;

  const defaultHeightClass =
    heightClass !== undefined
      ? heightClass
      : variant === "hero"
      ? "h-full min-h-[280px] sm:min-h-[360px]"
      : variant === "thumbnail"
      ? "h-full w-full"
      : "h-48 sm:h-52";

  return (
    <div
      className={`relative w-full ${defaultHeightClass} overflow-hidden select-none ${className}`}
    >
      {isValidUrl ? (
        <div className="relative w-full h-full bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={title}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle bottom gradient to ensure text/badges contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </div>
      ) : variant === "hero" ? (
        /* Grand Hero Banner Typographic Fallback */
        <div
          className={`relative w-full h-full bg-gradient-to-br ${theme.bg} p-6 sm:p-10 flex flex-col justify-between overflow-hidden border ${theme.border}`}
        >
          {/* Glowing Ambient Blobs */}
          <div
            className={`absolute -top-20 -right-20 w-80 h-80 ${theme.glow1} rounded-full blur-3xl pointer-events-none`}
          />
          <div
            className={`absolute -bottom-20 -left-20 w-80 h-80 ${theme.glow2} rounded-full blur-3xl pointer-events-none`}
          />

          {/* Left accent bar */}
          <div
            className={`absolute inset-y-0 left-0 w-3 bg-gradient-to-r ${theme.bar} opacity-80 pointer-events-none`}
          />

          {/* Watermark Icon in background */}
          <div className="absolute right-6 bottom-4 pointer-events-none opacity-15">
            <Icon className={`w-56 h-56 ${theme.iconColor}`} />
          </div>

          {/* Top Brand & Category Tag */}
          <div className="relative z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                ANSELLA
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                • {type === "digital_product" ? "RESSOURCE DIGITALE" : "FORMATION CERTIFIANTE"}
              </span>
            </div>
            {category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                {category}
              </span>
            )}
          </div>

          {/* Center Prominent Title */}
          <div className="relative z-10 my-auto text-center px-4 py-3 flex flex-col items-center">
            <div
              className={`w-16 h-1.5 rounded-full bg-gradient-to-r ${theme.bar} mb-4 shadow-lg`}
            />
            <h2
              className="text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight sm:leading-snug max-w-3xl drop-shadow-xl tracking-tight"
              title={title}
            >
              {title}
            </h2>
            {category && (
              <p
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-widest ${theme.accentText} mt-3 opacity-90`}
              >
                Parcours certifiant et pratique
              </p>
            )}
          </div>

          {/* Bottom subtle bar */}
          <div className="relative z-10 flex justify-between items-center opacity-40">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
              Ansella Learning Platform
            </span>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/70" />
              <span className="w-2 h-2 rounded-full bg-white/50" />
              <span className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      ) : variant === "thumbnail" ? (
        /* Compact Luxury Thumbnail Avatar Fallback */
        <div
          className={`relative w-full h-full bg-gradient-to-br ${theme.bg} p-2 flex flex-col items-center justify-center text-center overflow-hidden border ${theme.border}`}
        >
          {/* Glowing Ambient Blob */}
          <div
            className={`absolute inset-0 ${theme.glow1} rounded-full blur-xl pointer-events-none`}
          />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Icon className={`w-8 h-8 ${theme.accentText} drop-shadow-md`} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white/90 mt-1 line-clamp-1 max-w-full px-1">
              {category || "ANSELLA"}
            </span>
          </div>
        </div>
      ) : (
        /* Standard Typographic Card Fallback */
        <div
          className={`relative w-full h-full bg-gradient-to-br ${theme.bg} p-5 flex flex-col justify-between overflow-hidden border-b ${theme.border}`}
        >
          {/* Glowing Ambient Blobs */}
          <div
            className={`absolute -top-12 -right-12 w-44 h-44 ${theme.glow1} rounded-full blur-3xl pointer-events-none`}
          />
          <div
            className={`absolute -bottom-12 -left-12 w-40 h-40 ${theme.glow2} rounded-full blur-3xl pointer-events-none`}
          />

          {/* Spine indicator on left edge */}
          <div
            className={`absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r ${theme.bar} opacity-70 pointer-events-none`}
          />

          {/* Watermark Icon in background */}
          <div className="absolute right-3 bottom-2 pointer-events-none opacity-20">
            <Icon className={`w-28 h-28 ${theme.iconColor}`} />
          </div>

          {/* Top Brand Watermark (Subtle) */}
          <div className="relative z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                ANSELLA
              </span>
              <span className="text-[9px] font-semibold text-zinc-400">
                • {type === "digital_product" ? "RESSOURCE" : "FORMATION"}
              </span>
            </div>
          </div>

          {/* Center / Bottom: Prominent Title with vibrant styling */}
          <div className="relative z-10 my-auto text-center px-2 py-1">
            <div
              className={`inline-block w-8 h-1 rounded-full bg-gradient-to-r ${theme.bar} mb-2 shadow-sm`}
            />
            <h3
              className="text-white font-extrabold text-sm sm:text-base leading-snug line-clamp-3 drop-shadow-md tracking-tight group-hover:scale-[1.02] transition-transform"
              title={title}
            >
              {title}
            </h3>
            {category && (
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${theme.accentText} mt-1.5 opacity-90 line-clamp-1`}
              >
                {category}
              </p>
            )}
          </div>

          {/* Bottom subtle bar */}
          <div className="relative z-10 flex justify-end">
            <div className="flex gap-1 opacity-40">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      )}

      {/* Floating badges & slot elements passed by caller */}
      {children && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {children}
        </div>
      )}
    </div>
  );
}
