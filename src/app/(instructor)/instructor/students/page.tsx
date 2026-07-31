"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Search, TrendingUp, BookOpen, Award, DollarSign,
  ArrowRight, Filter, ChevronDown, Loader2, UserCheck,
  AlertCircle, Clock, CheckCircle2, Circle, Sparkles, Lock, Unlock
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { useLanguage } from "@/context/LanguageContext";

type StudentEnrollment = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  totalPaid: number;
  remainingAmount: number;
  isInstallmentCourse: boolean;
  totalInstallments: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  progressPercent: number;
  enrollmentStatus: string;
  enrolledAt: string;
  paymentStatus: "PAID" | "PARTIAL" | "PENDING" | "FAILED" | "MANUAL_CASH_FULL" | "MANUAL_CASH_PARTIAL" | "FREE_SCHOLARSHIP" | "none";
  paymentAmount: number;
  paymentOrigin?: "ONLINE" | "MANUAL";
  manualPaymentStatus?: string;
  manualAmountPaid?: number;
  hasCertificate: boolean;
};

type GroupedStudent = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollments: StudentEnrollment[];
  totalPaid: number;
  avgProgress: number;
  hasCertificate: boolean;
  lastActivity: string;
};

export default function StudentsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // AI Retention Guard state
  const [retentionStudent, setRetentionStudent] = useState<any | null>(null);
  const [analyzingRetention, setAnalyzingRetention] = useState<boolean>(false);
  const [retentionData, setRetentionData] = useState<any | null>(null);
  const [sendingRetentionMsg, setSendingRetentionMsg] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  async function fetchStudents(instructorId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/instructor/students");
      if (!res.ok) {
        throw new Error("Erreur de récupération des données");
      }
      const data = await res.json();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error("[students] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const s = getSimulatedSession();
    setSession(s);
    if (!s?.userId) { router.replace("/login"); return; }
    fetchStudents(s.userId);
  }, [router]);

  async function handleBlockAccess(studentId: string, courseId: string, currentStatus: string, studentName: string) {
    const isBlocking = currentStatus !== "SUSPENDED";
    const confirmMsg = isBlocking
      ? `Souhaitez-vous bloquer temporairement l'accès de ${studentName} à ce cours (pour tranche impayée) ?`
      : `Souhaitez-vous réactiver l'accès au cours pour ${studentName} ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/instructor/students/block-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          courseId,
          action: isBlocking ? "BLOCK" : "UNBLOCK",
          reason: isBlocking ? "Accès suspendu par le formateur en raison d'une tranche de paiement requise." : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour.");

      alert(data.message || `L'accès a été ${isBlocking ? "suspendu" : "réactivé"} avec succès.`);
      if (session?.userId) {
        fetchStudents(session.userId);
      }
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  }

  async function handleRevokeStudent(studentId: string, courseId: string, courseTitle: string, studentName: string) {
    const confirm = window.confirm(`Êtes-vous sûr de vouloir révoquer ${studentName} du cours "${courseTitle}" ? Son accès sera immédiatement supprimé.`);
    if (!confirm) return;

    try {
      const res = await fetch("/api/instructor/students/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de révocation.");

      alert(data.message || `L'apprenant ${studentName} a été révoqué du cours "${courseTitle}" avec succès.`);
      if (session?.userId) {
        fetchStudents(session.userId);
      }
    } catch (err: any) {
      console.error("[students] revoke error:", err.message);
      alert("Erreur lors de la révocation : " + err.message);
    }
  }

  // Group by student
  const grouped = useMemo<GroupedStudent[]>(() => {
    const map = new Map<string, GroupedStudent>();
    enrollments.forEach(e => {
      if (!map.has(e.studentId)) {
        map.set(e.studentId, {
          studentId: e.studentId,
          studentName: e.studentName,
          studentEmail: e.studentEmail,
          enrollments: [],
          totalPaid: 0,
          avgProgress: 0,
          hasCertificate: false,
          lastActivity: e.enrolledAt,
        });
      }
      const g = map.get(e.studentId)!;
      g.enrollments.push(e);
      g.totalPaid += (e.totalPaid || e.paymentAmount || 0);
      if (e.hasCertificate) g.hasCertificate = true;
      if (new Date(e.enrolledAt) > new Date(g.lastActivity)) g.lastActivity = e.enrolledAt;
    });
    map.forEach(g => {
      g.avgProgress = g.enrollments.length > 0
        ? Math.round(g.enrollments.reduce((s, e) => s + e.progressPercent, 0) / g.enrollments.length)
        : 0;
    });
    return Array.from(map.values());
  }, [enrollments]);

  // KPIs
  const totalRevenue = grouped.reduce((s, g) => s + g.totalPaid, 0);
  const avgProgress = grouped.length > 0 ? Math.round(grouped.reduce((s, g) => s + g.avgProgress, 0) / grouped.length) : 0;
  const certifiedCount = grouped.filter(g => g.hasCertificate).length;

  // Filtering
  const filtered = useMemo(() => {
    return grouped.filter(g => {
      const q = search.toLowerCase();
      const matchSearch = !q || g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || g.enrollments.some(e => e.enrollmentStatus === filterStatus);
      const matchPayment = filterPayment === "all" || g.enrollments.some(e => e.paymentStatus === filterPayment);
      return matchSearch && matchStatus && matchPayment;
    });
  }, [grouped, search, filterStatus, filterPayment]);

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Suivi &amp; Accès Étudiants</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Étudiants</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            {grouped.length} apprenant{grouped.length !== 1 ? "s" : ""} inscrit{grouped.length !== 1 ? "s" : ""} · Suivi des tranches et gestion des accès
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total apprenants", value: grouped.length, icon: Users, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
          { label: "Revenus générés", value: `${totalRevenue.toLocaleString()} $`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Progression moy.", value: `${avgProgress}%`, icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Certifiés", value: certifiedCount, icon: Award, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex items-start gap-4">
              <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email d'étudiant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </div>
      </div>

      {/* Students List Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Users className="w-12 h-12 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Aucun étudiant trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const firstEnr = student.enrollments[0];
            const isBlocked = student.enrollments.some(e => e.enrollmentStatus === "SUSPENDED");
            const hasRemainingBalance = student.enrollments.some(e => (e.remainingAmount || 0) > 0);

            return (
              <div
                key={student.studentId}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all p-5 shadow-xs ${
                  isBlocked
                    ? "border-red-300 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-teal-500/30"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Student Info */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{student.studentName}</h3>
                      <p className="text-xs text-zinc-400 truncate">{student.studentEmail}</p>
                    </div>
                  </div>

                  {/* Courses & Installments breakdown */}
                  <div className="md:col-span-4 space-y-1.5">
                    {student.enrollments.map((e) => {
                      const isOnline = e.paymentOrigin === "ONLINE";
                      const manualStatus = e.manualPaymentStatus || "FREE_SCHOLARSHIP";
                      
                      let badgeLabel = "";
                      let badgeStyle = "";

                      if (isOnline) {
                        if (e.remainingAmount > 0 && e.totalPaid > 0) {
                          badgeLabel = `Payé en ligne : $${e.totalPaid} / $${e.coursePrice} (Reste $${e.remainingAmount}$)`;
                          badgeStyle = "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40";
                        } else {
                          badgeLabel = `Réglé en ligne ($${e.coursePrice}$)`;
                          badgeStyle = "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40";
                        }
                      } else {
                        if (manualStatus === "CASH_FULL") {
                          badgeLabel = `Manuel - Cash ($${e.coursePrice}$)`;
                          badgeStyle = "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40";
                        } else if (manualStatus === "CASH_INSTALLMENT") {
                          badgeLabel = `Manuel - Cash ($${e.totalPaid} / $${e.coursePrice}$)`;
                          badgeStyle = "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40";
                        } else {
                          badgeLabel = `Accès Offert / Bourse ($0$)`;
                          badgeStyle = "bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40";
                        }
                      }

                      return (
                        <div key={e.courseId} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 gap-2">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]" title={e.courseTitle}>
                            {e.courseTitle}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status & Actions */}
                  <div className="md:col-span-4 flex items-center justify-end gap-2">
                    
                    {/* Status Badge */}
                    {isBlocked ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Accès Bloqué
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                        Accès Actif
                      </span>
                    )}

                    {/* Block/Unblock toggle */}
                    {firstEnr && (
                      <button
                        onClick={() => handleBlockAccess(student.studentId, firstEnr.courseId, firstEnr.enrollmentStatus, student.studentName)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isBlocked
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                        title={isBlocked ? "Débloquer l'accès" : "Bloquer l'accès pour tranche d'échéance"}
                      >
                        {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{isBlocked ? "Débloquer" : "Bloquer"}</span>
                      </button>
                    )}

                    {/* View Details */}
                    <Link
                      href={`/instructor/students/${student.studentId}`}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      Détails <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
