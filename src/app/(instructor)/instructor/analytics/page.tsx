"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  BookOpen,
  CircleDollarSign,
  BadgePercent,
  Wallet,
  Loader2,
  Calendar,
  Award,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface CourseStat {
  id: string;
  title: string;
  status: string;
  price: number;
  category: string;
  level: string;
  rating: number | null;
}

interface AnalyticsData {
  plan: string;
  courses: CourseStat[];
  enrollmentsCount: number;
  totalStudents: number;
  completedCount: number;
  avgProgress: number;
  avgRating: number;
  weeklyLabels: string[];
  weeklyEnrollments: number[];
  totalRevenue: number;
  platformCommission: number;
  netRevenue: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [hasServiceRole, setHasServiceRole] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/instructor/analytics");
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Impossible de charger les statistiques.");
      }

      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (rawProfile) {
        setSession({
          name: rawProfile.full_name || "Instructeur",
          email: rawProfile.email || user.email || ""
        });
      } else {
        setSession({
          name: user.email?.split("@")[0] || "Instructeur",
          email: user.email || ""
        });
      }

      setData(resData);
      setHasServiceRole(resData.hasServiceRole !== false);
    } catch (err) {
      console.error("Error loading instructor analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Aucune donnée disponible</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Nous n&apos;avons pas pu charger vos statistiques.</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Chiffre d'Affaires",
      value: `${data.totalRevenue.toLocaleString("fr-FR")} $`,
      icon: CircleDollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Commission Plateforme",
      value: `${data.platformCommission.toLocaleString("fr-FR")} $`,
      icon: BadgePercent,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Revenu Net",
      value: `${data.netRevenue.toLocaleString("fr-FR")} $`,
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Apprenants total",
      value: data.totalStudents,
      icon: Users,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      label: "Cours créés",
      value: data.courses.length,
      icon: BookOpen,
      color: "text-indigo-650 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      label: "Certifications",
      value: data.completedCount,
      icon: Award,
      color: "text-rose-650 dark:text-rose-450",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  const maxVal = Math.max(...data.weeklyEnrollments, 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytique</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Compte : <span className="font-bold text-zinc-900 dark:text-zinc-200">{session?.name}</span> ({session?.email})
          </p>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5">Suivez les performances de vos formations et vos revenus en temps réel.</p>
        </div>
        <span className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-850">
          Forfait actuel : {data.plan}
        </span>
      </div>

      {/* Warning Alert if SUPABASE_SERVICE_ROLE_KEY is missing on production */}
      {!hasServiceRole && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Clé de service Supabase manquante (Vercel)</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
              La variable d&apos;environnement <code className="bg-amber-100 dark:bg-amber-955 px-1 py-0.5 rounded font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> n&apos;est pas configurée dans les paramètres de votre projet Vercel. 
              Par conséquent, les statistiques d&apos;achat des étudiants sont limitées par la sécurité RLS et retournent 0. 
              Veuillez ajouter cette clé dans votre console Vercel pour que le tableau de bord puisse charger toutes les transactions réelles.
            </p>
          </div>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-250 dark:border-zinc-800 shadow-sm p-5 flex items-start gap-4 hover:border-zinc-350 dark:hover:border-zinc-750 transition-all duration-300">
              <div className={`p-3 rounded-xl ${kpi.bg} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xl sm:text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrollment chart (CSS-based bar chart) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-250 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-650" />
            <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Inscriptions par semaine</h2>
          </div>
          <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full font-medium">
            Dernières 7 semaines
          </span>
        </div>
        
        {data.enrollmentsCount === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            Aucune inscription enregistrée sur cette période.
          </div>
        ) : (
          <div className="flex items-end gap-3 h-40 pt-4">
            {data.weeklyLabels.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.weeklyEnrollments[i]}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-teal-750 to-teal-500 hover:from-teal-650 hover:to-teal-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(data.weeklyEnrollments[i] / maxVal) * 110 + 4}px` }}
                />
                <span className="text-[10px] text-zinc-400 text-center font-medium truncate max-w-[80px]">{week}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course performance table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-250 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Performance par cours</h2>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            {data.courses.length} cours
          </span>
        </div>
        
        {data.courses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucun cours créé pour le moment.</p>
            <p className="text-zinc-400 text-xs mt-1">Créez votre première formation pour voir ses statistiques.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
            {data.courses.map((course) => (
              <div key={course.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{course.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {course.category || "Général"} · {course.level || "Tous niveaux"}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 self-start sm:self-auto flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-450">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span>Inscrits</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-450">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{course.rating ? course.rating.toFixed(1) : "—"}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    course.status === "PUBLISHED" 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : course.status === "DRAFT" 
                      ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-450"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {course.status === "PUBLISHED" ? "Publié" : course.status === "DRAFT" ? "Brouillon" : "Revue"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
