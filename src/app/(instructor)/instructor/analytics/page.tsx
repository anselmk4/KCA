"use client";

import { useEffect, useState } from "react";
import { getDB, initDB, Database } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Star,
  BookOpen,
  Clock,
  CircleDollarSign,
  BadgePercent,
  Wallet,
} from "lucide-react";

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
};

export default function AnalyticsPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    initDB();
    setDb(getDB());
    setSession(getSimulatedSession());
  }, []);

  if (!db || !session) return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const myCourses = db.courses.filter(c => c.instructorId === (session?.userId ?? ""));
  const myCourseIds = myCourses.map(c => c.id);
  const myEnrollments = db.enrollments.filter(e => myCourseIds.includes(e.courseId));
  const totalStudents = new Set(myEnrollments.map(e => e.studentId)).size;
  const completedCount = myEnrollments.filter(e => e.progressPercent === 100).length;
  const avgRating = myCourses.reduce((s, c) => s + (c.rating || 0), 0) / (myCourses.length || 1);
  const avgProgress = myEnrollments.length > 0
    ? Math.round(myEnrollments.reduce((s, e) => s + e.progressPercent, 0) / myEnrollments.length)
    : 0;

  // Financial calculations from synchronized transactions
  const myTransactions = (db.transactions || []).filter(t => t.instructorId === (session?.userId ?? "") && t.status === "PAID");
  const instructorPlan = session?.plan || "FREE";
  const planConfig = PLAN_COMMISSION_CONFIG[instructorPlan] || PLAN_COMMISSION_CONFIG.FREE;
  const totalRevenue = myTransactions.reduce((acc, t) => acc + t.amount, 0);
  const platformCommission = totalRevenue * planConfig.commissionRate;
  const netRevenue = totalRevenue * planConfig.instructorShare;

  const kpis = [
    { label: "Chiffre d'Affaires", value: `${totalRevenue.toFixed(2)}$`, icon: CircleDollarSign, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Commission Site", value: `${platformCommission.toFixed(2)}$`, icon: BadgePercent, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Revenu Net", value: `${netRevenue.toFixed(2)}$`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Apprenants total", value: totalStudents, icon: Users, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
    { label: "Cours publiés", value: myCourses.filter(c => c.status === "PUBLISHED").length, icon: BookOpen, color: "text-zinc-600", bg: "bg-zinc-50 dark:bg-zinc-800/20" },
    { label: "Taux complétion", value: `${myEnrollments.length > 0 ? Math.round((completedCount / myEnrollments.length) * 100) : 0}%`, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
  ];

  // Simulated weekly data
  const weeks = ["S-6", "S-5", "S-4", "S-3", "S-2", "S-1", "Cette semaine"];
  const weeklyEnrollments = [3, 5, 2, 8, 6, 9, 4];
  const maxVal = Math.max(...weeklyEnrollments);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytique</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Performances de vos cours et commissions en temps réel.</p>
          </div>
          <span className="text-xxs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20">
            Forfait : {instructorPlan}
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl ${kpi.bg} shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className={`text-xl sm:text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrollment chart (CSS-based bar chart) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Inscriptions hebdomadaires</h2>
          <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full font-medium">7 semaines</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {weeks.map((week, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{weeklyEnrollments[i]}</span>
              <div
                className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all duration-700"
                style={{ height: `${(weeklyEnrollments[i] / maxVal) * 128}px` }}
              />
              <span className="text-[10px] text-zinc-400 text-center">{week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Course performance table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Performance par cours</h2>
        </div>
        {myCourses.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucun cours disponible. Créez votre premier cours.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {myCourses.map(course => {
              const enrs = myEnrollments.filter(e => e.courseId === course.id);
              const avgProg = enrs.length > 0 ? Math.round(enrs.reduce((s, e) => s + e.progressPercent, 0) / enrs.length) : 0;
              return (
                <div key={course.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{course.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{course.category} · {course.level}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                    <Users className="w-3.5 h-3.5" />
                    {enrs.length}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {course.rating?.toFixed(1) || "—"}
                  </div>
                  <div className="flex items-center gap-2 w-24">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${avgProg}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 w-8 text-right">{avgProg}%</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : course.status === "DRAFT" ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>{course.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
