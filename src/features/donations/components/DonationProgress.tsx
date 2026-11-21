"use client";

import React, { useEffect, useState } from "react";
import { Users, Heart } from "lucide-react";

interface ProgressStats {
  goal: number;
  totalCollected: number;
  totalDonors: number;
  percentage: number;
  remaining: number;
}

export function DonationProgress() {
  // Le compteur débute à zéro et s'incrémente au fur et à mesure des dons
  const [stats, setStats] = useState<ProgressStats>({
    goal: 60000,
    totalCollected: 0,
    totalDonors: 0,
    percentage: 0,
    remaining: 60000,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/donations/stats", { cache: "no-store" });
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

  useEffect(() => {
    fetchStats();

    // Rafraîchir instantanément dès qu'un don est validé sur la page
    const handleDonationCompleted = () => {
      fetchStats();
    };

    window.addEventListener("donation-completed", handleDonationCompleted);
    return () => {
      window.removeEventListener("donation-completed", handleDonationCompleted);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl transition-colors">
      {/* En-tête avec titre et objectif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Heart className="w-5 h-5 fill-teal-500/20" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Campagne Bourses & Éducation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Objectif global : <strong className="text-slate-700 dark:text-slate-200">60 000 $</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 font-medium">
            <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span><strong>{stats.totalDonors}</strong> {stats.totalDonors > 1 ? "donateurs" : "donateur"}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold">
            {stats.percentage}% atteint
          </div>
        </div>
      </div>

      {/* Barre de progression dynamique */}
      <div className="space-y-2">
        <div className="relative w-full h-4 sm:h-4.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${Math.max(stats.totalCollected > 0 ? 3 : 0, stats.percentage)}%` }}
          >
            {/* Effet shimmer lumineux */}
            {stats.totalCollected > 0 && (
              <div className="absolute inset-0 bg-white/20 -skew-x-12 animate-[shimmer_2s_infinite]" />
            )}
          </div>
        </div>

        {/* Détails chiffrés sous la barre */}
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-teal-600 dark:text-teal-400">
            {stats.totalCollected.toLocaleString()} $ <span className="text-slate-500 dark:text-slate-400 font-normal">collectés</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Reste <strong className="text-slate-700 dark:text-slate-200">{stats.remaining.toLocaleString()} $</strong> sur 60k $
          </span>
        </div>
      </div>
    </div>
  );
}
