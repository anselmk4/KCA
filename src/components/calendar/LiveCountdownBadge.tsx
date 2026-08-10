"use client";

import React, { useState, useEffect } from "react";
import { Clock, Video, Radio, Sparkles, ExternalLink, Calendar as CalendarIcon, UserCheck } from "lucide-react";

interface LiveCountdownBadgeProps {
  targetDate: string;
  title: string;
  sessionType?: "LIVE_SESSION" | "COACHING_1ON1";
  meetingUrl?: string;
  instructorName?: string;
  courseTitle?: string | null;
  onJoinClick?: () => void;
}

export function LiveCountdownBadge({
  targetDate,
  title,
  sessionType = "LIVE_SESSION",
  meetingUrl,
  instructorName,
  courseTitle,
  onJoinClick,
}: LiveCountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isPast: false,
  });

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      // Active live session if within target date and 2 hours after
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      if (difference <= 0 && difference >= -twoHoursInMs) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: true,
          isPast: false,
        });
        return;
      }

      if (difference < -twoHoursInMs) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: false,
          isPast: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isLive: false,
        isPast: false,
      });
    }

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isPast) return null;

  const isCoaching = sessionType === "COACHING_1ON1";

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-xl transition-all duration-300 ${
      timeLeft.isLive
        ? "bg-gradient-to-r from-red-950 via-rose-950 to-zinc-900 border-red-500/40 text-white ring-2 ring-red-500/30"
        : isCoaching
        ? "bg-gradient-to-r from-indigo-950 via-blue-950 to-zinc-900 border-indigo-500/30 text-white"
        : "bg-gradient-to-r from-teal-950 via-emerald-950 to-zinc-900 border-teal-500/30 text-white"
    }`}>
      {/* Background ambient light */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
        timeLeft.isLive ? "bg-red-500/20" : isCoaching ? "bg-indigo-500/20" : "bg-teal-500/20"
      }`} />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Session Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {timeLeft.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                EN DIRECT MAINTENANT
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                isCoaching
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  : "bg-teal-500/20 text-teal-300 border-teal-500/30"
              }`}>
                {isCoaching ? <UserCheck className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                {isCoaching ? "Coaching 1-sur-1 Privé" : "Masterclass Live"}
              </span>
            )}

            {courseTitle && (
              <span className="text-[11px] font-semibold text-zinc-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 truncate max-w-xs">
                {courseTitle}
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            {title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-zinc-300 font-medium flex-wrap">
            {instructorName && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Animé par : <strong className="text-white">{instructorName}</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-teal-400" />
              {new Date(targetDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Live Countdown Display or Join Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          {!timeLeft.isLive && (
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-inner">
              {timeLeft.days > 0 && (
                <div className="flex flex-col items-center px-2">
                  <span className="text-2xl font-black text-white leading-none">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Jours</span>
                </div>
              )}

              {timeLeft.days > 0 && <span className="text-xl font-bold text-zinc-500">:</span>}

              <div className="flex flex-col items-center px-2">
                <span className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Heures</span>
              </div>

              <span className="text-xl font-bold text-zinc-500">:</span>

              <div className="flex flex-col items-center px-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-teal-300 leading-none tracking-tight">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Minutes</span>
              </div>

              <span className="text-xl font-bold text-zinc-500">:</span>

              <div className="flex flex-col items-center px-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 leading-none tracking-tight animate-pulse">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Secondes</span>
              </div>
            </div>
          )}

          {/* Join CTA */}
          {meetingUrl && (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onJoinClick}
              className={`px-6 py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                timeLeft.isLive
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 animate-bounce"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-teal-500/30 hover:scale-105"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{timeLeft.isLive ? "Rejoindre le Live Maintenant" : "Accéder à la Salle"}</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
