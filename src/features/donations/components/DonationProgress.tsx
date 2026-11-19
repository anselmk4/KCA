"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Users, Target, Heart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ProgressStats {
  goal: number;
  totalCollected: number;
  totalDonors: number;
  percentage: number;
  remaining: number;
}

export function DonationProgress() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [stats, setStats] = useState<ProgressStats>({
    goal: 60000,
    totalCollected: 14250,
    totalDonors: 186,
    percentage: 24,
    remaining: 45750,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/donations/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data);
          }
        }
      } catch (err) {
        console.warn("[DonationProgress] Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl transition-colors">
      {/* Header with Title and Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Heart className="w-5 h-5 fill-teal-500/20" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEn ? "Scholarships & Education Campaign" : "Campagne Bourses & Éducation"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? "Global target: " : "Objectif global : "}
              <strong className="text-slate-700 dark:text-slate-200">$60,000</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 font-medium">
            <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span><strong>{stats.totalDonors}</strong> {isEn ? "donors" : "donateurs"}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold">
            {stats.percentage}% {isEn ? "reached" : "atteint"}
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2">
        <div className="relative w-full h-4 sm:h-4.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${Math.max(6, stats.percentage)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-white/20 -skew-x-12 animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Amount details under progress bar */}
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-teal-600 dark:text-teal-400">
            {stats.totalCollected.toLocaleString()} $ <span className="text-slate-500 dark:text-slate-400 font-normal">{isEn ? "raised" : "collectés"}</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {isEn ? (
              <>
                <strong className="text-slate-700 dark:text-slate-200">${stats.remaining.toLocaleString()}</strong> remaining out of $60k
              </>
            ) : (
              <>
                Reste <strong className="text-slate-700 dark:text-slate-200">{stats.remaining.toLocaleString()} $</strong> sur 60k $
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

