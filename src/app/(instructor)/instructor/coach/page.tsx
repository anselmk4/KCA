"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Sparkles,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Video,
} from "lucide-react";
import { CoachAiCopilotTab } from "@/components/instructor/coach/CoachAiCopilotTab";
import { CoachBookingTab } from "@/components/instructor/coach/CoachBookingTab";
import { CoachStudentCardsTab } from "@/components/instructor/coach/CoachStudentCardsTab";
import { CoachRequestsTab } from "@/components/instructor/coach/CoachRequestsTab";

type CoachTabType = "copilot" | "booking" | "students" | "requests";

export default function InstructorCoachPage() {
  const [activeTab, setActiveTab] = useState<CoachTabType>("copilot");

  const tabs = [
    { id: "copilot", label: "Copilote IA Rétention", icon: Sparkles, badge: "3 Alerte(s)" },
    { id: "booking", label: "Sessions 1-on-1 & Visios", icon: Calendar, badge: "2 Confirmée(s)" },
    { id: "students", label: "Fiches & Suivi Individuel", icon: UserCheck },
    { id: "requests", label: "Demandes de Mentorat", icon: MessageSquare, badge: "1 En attente" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      
      {/* Hero KPI Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold">
              <UserCheck className="w-3.5 h-3.5" /> Espace Coach & Mentorat Formateur
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Accompagnement Pédagogique & Suivi des Élèves
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              Combinez l&apos;intelligence artificielle de rétention et vos créneaux de coaching individuel 1-on-1 pour amener vos apprenants au succès.
            </p>
          </div>

          {/* KPI Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-teal-400">18</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Apprenants Suivis</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[100px]">
              <p className="text-xl font-extrabold text-emerald-400">32h</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Visios Livrées</p>
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
