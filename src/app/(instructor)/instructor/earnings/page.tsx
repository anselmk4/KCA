"use client";

import { useEffect, useState } from "react";
import { getDB, initDB, Database } from "@/lib/db";
import { normalizeStatus } from "@/lib/statusHelpers";
import { getSimulatedSession } from "@/lib/rbac";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const mockMonthlyRevenue = [320, 480, 290, 670, 540, 820, 760, 930, 450, 610, 880, 1050];

export default function EarningsPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    initDB();
    setDb(getDB());
    setSession(getSimulatedSession());
  }, []);

  if (!db || !session) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const myCourseIds = db.courses.filter(c => c.instructorId === (session?.userId ?? "")).map(c => c.id);
  // Use transactions (the actual DB field) filtered to instructor's courses
  const myTransactions = db.transactions.filter(tx => myCourseIds.includes(tx.courseId));


  const totalRevenue = myTransactions
    .filter(tx => normalizeStatus(tx.status) === "PAID")
    .reduce((s, tx) => s + tx.amount, 0);
  const pendingRevenue = myTransactions
    .filter(tx => normalizeStatus(tx.status) === "PENDING")
    .reduce((s, tx) => s + tx.amount, 0);
  const commissionRate = 0.7; // 70% instructor share
  const netRevenue = totalRevenue * commissionRate;

  const maxBar = Math.max(...mockMonthlyRevenue);

  const recentTransactions = myTransactions.slice(0, 8).map(tx => {
    const course = db.courses.find(c => c.id === tx.courseId);
    const student = db.users.find(u => u.id === tx.userId);
    return { ...tx, courseTitle: course?.title || "Cours", studentName: student?.name || tx.userName };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Revenus</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Commission instructeur : 70% du prix de vente.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Revenus bruts",
            value: `${totalRevenue.toLocaleString("fr-FR")} €`,
            icon: CircleDollarSign,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-900/20",
            trend: "+12%",
          },
          {
            label: "Revenus nets (70%)",
            value: `${netRevenue.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`,
            icon: Wallet,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            trend: "+12%",
          },
          {
            label: "En attente",
            value: `${pendingRevenue.toLocaleString("fr-FR")} €`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            trend: "",
          },
          {
            label: "Paiements reçus",
            value: myTransactions.filter(tx => normalizeStatus(tx.status) === "PAID").length,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            trend: "",
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.trend && (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue bar chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Revenus mensuels (2024)</h2>
          <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full font-medium">
            12 mois
          </span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {months.map((month, i) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hidden sm:block">
                {mockMonthlyRevenue[i] > 500 ? `${mockMonthlyRevenue[i]}` : ""}
              </span>
              <div
                className="w-full bg-gradient-to-t from-teal-700 to-teal-400 rounded-t-lg transition-all duration-700"
                style={{ height: `${(mockMonthlyRevenue[i] / maxBar) * 128}px` }}
              />
              <span className="text-[10px] text-zinc-400">{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Transactions récentes</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucune transaction pour l'instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  normalizeStatus(tx.status) === "PAID"
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : "bg-amber-50 dark:bg-amber-900/20"
                }`}>
                  {normalizeStatus(tx.status) === "PAID"
                    ? <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    : <Clock className="w-4 h-4 text-amber-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{tx.courseTitle}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">par {tx.studentName} · {tx.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${normalizeStatus(tx.status) === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                    +{(tx.amount * commissionRate).toFixed(2)} €
                  </p>
                  <p className="text-[10px] text-zinc-400">{new Date(tx.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  normalizeStatus(tx.status) === "PAID"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : normalizeStatus(tx.status) === "PENDING"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
