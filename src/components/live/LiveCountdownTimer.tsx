"use client";

import React, { useState, useEffect } from "react";
import { Clock, Video, ExternalLink, Sparkles } from "lucide-react";

interface LiveCountdownTimerProps {
  targetDate: string;
  title: string;
  meetingUrl?: string | null;
  onTimerExpire?: () => void;
}

export function LiveCountdownTimer({ targetDate, title, meetingUrl, onTimerExpire }: LiveCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    isExpired: boolean;
  }>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    isExpired: false
  });

  useEffect(() => {
    function calculateTime() {
      const targetTime = new Date(targetDate).getTime();
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
          isExpired: true
        });
        if (onTimerExpire) onTimerExpire();
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: d.toString().padStart(2, "0"),
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
        isExpired: false
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onTimerExpire]);

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 border border-teal-500/30 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {timeLeft.isExpired ? "🔴 Live en cours" : "⏳ Prochain Live Programmé"}
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">{title}</h2>
        </div>

        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
            className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2 shrink-0 ${
              timeLeft.isExpired
                ? "bg-teal-500 hover:bg-teal-400 text-zinc-950 animate-pulse hover:scale-105"
                : "bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/30"
            }`}
          >
            <Video className="w-4 h-4" />
            {timeLeft.isExpired ? "Rejoindre le Live Maintenant" : "Accéder à la salle visio"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Countdown Grid */}
      <div className="space-y-2 relative z-10">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-400" />
          {timeLeft.isExpired ? "Session démarrée" : "Compte à Rebours avant le Début"}
        </span>

        <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 md:p-4 shadow-inner">
            <span className="text-2xl md:text-4xl font-black text-teal-400 font-mono tracking-tight">{timeLeft.days}</span>
            <span className="block text-[10px] md:text-xs uppercase font-extrabold text-zinc-400 mt-1">Jours</span>
          </div>
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 md:p-4 shadow-inner">
            <span className="text-2xl md:text-4xl font-black text-teal-400 font-mono tracking-tight">{timeLeft.hours}</span>
            <span className="block text-[10px] md:text-xs uppercase font-extrabold text-zinc-400 mt-1">Heures</span>
          </div>
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 md:p-4 shadow-inner">
            <span className="text-2xl md:text-4xl font-black text-teal-400 font-mono tracking-tight">{timeLeft.minutes}</span>
            <span className="block text-[10px] md:text-xs uppercase font-extrabold text-zinc-400 mt-1">Minutes</span>
          </div>
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 md:p-4 shadow-inner">
            <span className="text-2xl md:text-4xl font-black text-teal-400 font-mono tracking-tight">{timeLeft.seconds}</span>
            <span className="block text-[10px] md:text-xs uppercase font-extrabold text-zinc-400 mt-1">Secondes</span>
          </div>
        </div>
      </div>

    </div>
  );
}
