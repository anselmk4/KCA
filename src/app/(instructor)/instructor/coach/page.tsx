"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Sparkles,
  Calendar,
  MessageSquare,
  Lock,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { CoachAiCopilotTab } from "@/components/instructor/coach/CoachAiCopilotTab";
import { CoachBookingTab } from "@/components/instructor/coach/CoachBookingTab";
import { CoachStudentCardsTab } from "@/components/instructor/coach/CoachStudentCardsTab";
import { CoachRequestsTab } from "@/components/instructor/coach/CoachRequestsTab";

type CoachTabType = "copilot" | "booking" | "students" | "requests";

export default function InstructorCoachPage() {
  const [activeTab, setActiveTab] = useState<CoachTabType>("copilot");
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [realStudentsCount, setRealStudentsCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeSession = getSimulatedSession();
        const instructorId = user?.id || activeSession?.userId;

        if (instructorId) {
          // 1. Fetch user's subscription plan from database
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", instructorId)
            .maybeSingle();

          const planName = profile?.plan || (activeSession as any)?.plan || (activeSession as any)?.user?.plan || "FREE";
          setUserPlan(planName);

          // 2. Fetch real courses & enrollments count from database
          const { data: courses } = await supabase
            .from("courses")
            .select("id")
            .eq("instructor_id", instructorId);

          if (courses && courses.length > 0) {
            const courseIds = courses.map((c) => c.id);
            const { count } = await supabase
              .from("enrollments")
              .select("id", { count: "exact", head: true })
              .in("course_id", courseIds);

            setRealStudentsCount(count || 0);
          }
        }
      } catch (err) {
        console.error("Error loading coach plan & db data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const tabs = [
    { id: "copilot", label: "Copilote IA Rétention", icon: Sparkles, badge: "3 Alerte(s)" },
    { id: "booking", label: "Sessions 1-on-1 & Visios", icon: Calendar, badge: "Ansella Live" },
    { id: "students", label: "Fiches & Suivi Individuel", icon: UserCheck },
    { id: "requests", label: "Demandes de Mentorat", icon: MessageSquare, badge: "1 En attente" },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-500">Chargement de votre Espace Coach...</p>
      </div>
    );
  }

  // 🔒 PLAN GATING: Lock Coach feature for FREE Plan (Base Plan Required)
  const isFreePlan = userPlan.toUpperCase() === "FREE";

  if (isFreePlan) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in">
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950 rounded-3xl p-8 sm:p-12 text-white border border-teal-500/30 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <span className="inline-block text-xs font-extrabold px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full uppercase tracking-wider">
              Fonctionnalité Verrouillée — Plan BASE Requis
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Débloquez l&apos;Espace Coach & Mentorat 1-on-1
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              L&apos;Espace Coach, le Copilote IA de Rétention et le système de visio 1-on-1 **Ansella Live** sont réservés aux formateurs titulaires du **Plan BASE** et supérieur.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto text-xs bg-white/5 border border-white/10 p-5 rounded-2xl">
            <div className="space-y-1">
              <span className="font-extrabold text-teal-400 block">🤖 Copilote IA</span>
              <span className="text-zinc-400 text-[11px]">Détection automatique des élèves bloqués.</span>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-400 block">🎥 Ansella Live</span>
              <span className="text-zinc-400 text-[11px]">Créneaux de visioconférence 1-on-1 intégrés.</span>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-amber-400 block">📊 Matrice & Suivi</span>
              <span className="text-zinc-400 text-[11px]">Carnet de notes privé & Skill Radar.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/instructor/billing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-teal-500/30 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-white" /> Passer au Plan BASE (29$/mois) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      
      {/* Hero KPI Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold">
              <UserCheck className="w-3.5 h-3.5" /> Espace Coach & Mentorat Formateur ({userPlan})
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Accompagnement Pédagogique & Suivi des Élèves
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              Combinez l&apos;intelligence artificielle de rétention et vos créneaux de visioconférence **Ansella Live (Jitsi)** 1-on-1 pour guider vos apprenants.
            </p>
          </div>

          {/* KPI Stat Chips from Real Database */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-teal-400">{realStudentsCount}</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Élèves en BDD</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-emerald-400">Ansella Live</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Visio Inclus</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-amber-400">+42%</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Rétention IA</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-white">15:00</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Prochain Rdv</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CoachTabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Body */}
      <div className="mt-4">
        {activeTab === "copilot" && <CoachAiCopilotTab />}
        {activeTab === "booking" && <CoachBookingTab />}
        {activeTab === "students" && <CoachStudentCardsTab />}
        {activeTab === "requests" && <CoachRequestsTab />}
      </div>

    </div>
  );
}
