"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Search, TrendingUp, BookOpen, Award, DollarSign,
  ArrowRight, Filter, ChevronDown, Loader2, UserCheck,
  AlertCircle, Clock, CheckCircle2, Circle, Sparkles, Lock, Unlock,
  Coins, GraduationCap, Zap, RefreshCw, X
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { useLanguage } from "@/context/LanguageContext";
import { AddInstallmentModal } from "@/components/instructor/AddInstallmentModal";
import { AssignSessionModal } from "@/components/instructor/AssignSessionModal";

type StudentEnrollment = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  courseType?: "academic" | "self_paced";
  sessionId?: string | null;
  sessionName?: string | null;
  sessionStatus?: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | string | null;
  sessionStartDate?: string | null;
  sessionEndDate?: string | null;
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

type CourseItem = {
  id: string;
  title: string;
  type: string;
};

type SessionItem = {
  id: string;
  courseId: string;
  courseTitle?: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export default function StudentsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Assign Session Modal state
  const [assignSessionTarget, setAssignSessionTarget] = useState<{
    studentId: string;
    studentName: string;
    courseId: string;
    courseTitle: string;
    currentSessionId?: string | null;
    currentSessionName?: string | null;
  } | null>(null);

  // Installment Modal state
  const [installmentTarget, setInstallmentTarget] = useState<{
    studentId: string;
    studentName: string;
    studentEmail?: string;
    courseId: string;
    courseTitle: string;
    coursePrice: number;
    totalPaid: number;
    remainingAmount: number;
    isSuspended?: boolean;
  } | null>(null);

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
      setCourses(data.courses || []);
      setSessions(data.sessions || []);
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

  // Filtering with Course and Session / Cohort differentiation
  const filtered = useMemo(() => {
    return grouped.filter(g => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || g.enrollments.some(e => e.enrollmentStatus === filterStatus);
      const matchPayment = filterPayment === "all" || g.enrollments.some(e => e.paymentStatus === filterPayment);
      const matchCourse = filterCourse === "all" || g.enrollments.some(e => e.courseId === filterCourse);

      let matchSession = true;
      if (filterSession !== "all") {
        if (filterSession === "IN_PROGRESS") {
          matchSession = g.enrollments.some(e => e.courseType !== "self_paced" && e.sessionStatus === "IN_PROGRESS");
        } else if (filterSession === "UPCOMING") {
          matchSession = g.enrollments.some(e => e.courseType !== "self_paced" && e.sessionStatus === "UPCOMING");
        } else if (filterSession === "COMPLETED") {
          matchSession = g.enrollments.some(e => e.courseType !== "self_paced" && e.sessionStatus === "COMPLETED");
        } else if (filterSession === "UNASSIGNED") {
          matchSession = g.enrollments.some(e => e.courseType !== "self_paced" && !e.sessionId);
        } else {
          matchSession = g.enrollments.some(e => e.sessionId === filterSession);
        }
      }

      return matchSearch && matchStatus && matchPayment && matchCourse && matchSession;
    });
  }, [grouped, search, filterStatus, filterPayment, filterCourse, filterSession]);

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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email d'étudiant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-8 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Course */}
          <div className="w-full md:w-56">
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setFilterSession("all");
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
            >
              <option value="all">📚 Tous les cours ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === "self_paced" ? "⚡ " : "🎓 "}
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Session / Cohort */}
          <div className="w-full md:w-64">
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-xl px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
            >
              <option value="all">🎓 Toutes les classes / sessions</option>
              <option value="IN_PROGRESS">🟢 En cours (Session active)</option>
              <option value="UPCOMING">🟡 À venir (Inscriptions ouvertes)</option>
              <option value="COMPLETED">⚪ Sessions terminées</option>
              <option value="UNASSIGNED">⚠️ Non assigné à une classe</option>
              {sessions
                .filter((s) => filterCourse === "all" || s.courseId === filterCourse)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    • {s.name} ({s.status === "IN_PROGRESS" ? "En cours" : s.status === "UPCOMING" ? "À venir" : "Terminée"})
                  </option>
                ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(search || filterCourse !== "all" || filterSession !== "all" || filterPayment !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterCourse("all");
                setFilterSession("all");
                setFilterPayment("all");
              }}
              className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Réinitialiser tous les filtres"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {/* Quick active filter info */}
        {filterSession !== "all" && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-teal-600 dark:text-teal-400">Filtre actif :</span>
            <span>
              {filterSession === "IN_PROGRESS" && "Apprenants actuellement en session d'apprentissage (En cours)."}
              {filterSession === "UPCOMING" && "Apprenants inscrits pour les prochaines rentrées / sessions (À venir)."}
              {filterSession === "COMPLETED" && "Apprenants des promotions terminées / archivées."}
              {filterSession === "UNASSIGNED" && "Apprenants inscrits aux cours encadrés sans classe attribuée."}
              {!["IN_PROGRESS", "UPCOMING", "COMPLETED", "UNASSIGNED"].includes(filterSession) &&
                "Affichage filtré par promotion spécifique."}
            </span>
            <span className="ml-auto font-bold text-zinc-900 dark:text-white">
              {filtered.length} apprenant{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Students List Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Users className="w-12 h-12 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Aucun étudiant trouvé pour ces critères.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const firstEnr = student.enrollments[0];
            const isBlocked = student.enrollments.some(e => e.enrollmentStatus === "SUSPENDED");

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

                  {/* Courses, Sessions & Installments breakdown */}
                  <div className="md:col-span-4 space-y-2">
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

                      const canAddInstallment = e.remainingAmount > 0 || manualStatus === "CASH_INSTALLMENT" || manualStatus === "FREE_SCHOLARSHIP";
                      const isAcademic = e.courseType !== "self_paced";

                      return (
                        <div
                          key={e.courseId}
                          className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1.5"
                        >
                          {/* Top: Course Title & Payment Badge */}
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]" title={e.courseTitle}>
                              {e.courseTitle}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                                {badgeLabel}
                              </span>
                              {canAddInstallment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInstallmentTarget({
                                      studentId: student.studentId,
                                      studentName: student.studentName,
                                      studentEmail: student.studentEmail,
                                      courseId: e.courseId,
                                      courseTitle: e.courseTitle,
                                      coursePrice: e.coursePrice,
                                      totalPaid: e.totalPaid || e.manualAmountPaid || 0,
                                      remainingAmount: e.remainingAmount,
                                      isSuspended: e.enrollmentStatus === "SUSPENDED",
                                    })
                                  }
                                  className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Enregistrer une tranche de paiement pour cet apprenant"
                                >
                                  <Coins className="w-3 h-3" />
                                  <span>+ Tranche</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bottom: Session / Cohort status (for academic courses) or Self-paced notice */}
                          {isAcademic ? (
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50 text-[10px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GraduationCap className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                {e.sessionId ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold truncate max-w-[170px] ${
                                      e.sessionStatus === "IN_PROGRESS"
                                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                                        : e.sessionStatus === "UPCOMING"
                                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                    }`}
                                    title={`Session : ${e.sessionName} (${
                                      e.sessionStatus === "IN_PROGRESS"
                                        ? "En cours"
                                        : e.sessionStatus === "UPCOMING"
                                        ? "À venir"
                                        : "Terminée"
                                    })`}
                                  >
                                    {e.sessionStatus === "IN_PROGRESS" && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    )}
                                    {e.sessionStatus === "UPCOMING" && (
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                    )}
                                    <span className="truncate">{e.sessionName}</span>
                                    <span className="text-[9px] opacity-75 shrink-0">
                                      •{" "}
                                      {e.sessionStatus === "IN_PROGRESS"
                                        ? "En cours"
                                        : e.sessionStatus === "UPCOMING"
                                        ? "À venir"
                                        : "Terminée"}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                    Non assigné à une classe
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setAssignSessionTarget({
                                    studentId: student.studentId,
                                    studentName: student.studentName,
                                    courseId: e.courseId,
                                    courseTitle: e.courseTitle,
                                    currentSessionId: e.sessionId,
                                    currentSessionName: e.sessionName,
                                  })
                                }
                                className="text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-extrabold text-[10px] underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
                                title="Affecter ou changer de promotion"
                              >
                                {e.sessionId ? "Changer" : "+ Affecter"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50 text-[10px] text-zinc-400">
                              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Cours autonome (Accès libre continu)</span>
                            </div>
                          )}
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
                        type="button"
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

      {/* Add Installment Modal */}
      {installmentTarget && (
        <AddInstallmentModal
          isOpen={!!installmentTarget}
          onClose={() => setInstallmentTarget(null)}
          studentId={installmentTarget.studentId}
          studentName={installmentTarget.studentName}
          studentEmail={installmentTarget.studentEmail}
          courseId={installmentTarget.courseId}
          courseTitle={installmentTarget.courseTitle}
          coursePrice={installmentTarget.coursePrice}
          totalPaid={installmentTarget.totalPaid}
          remainingAmount={installmentTarget.remainingAmount}
          isSuspended={installmentTarget.isSuspended}
          onSuccess={() => {
            if (session?.userId) fetchStudents(session.userId);
          }}
        />
      )}

      {/* Assign Session Modal */}
      {assignSessionTarget && (
        <AssignSessionModal
          isOpen={!!assignSessionTarget}
          onClose={() => setAssignSessionTarget(null)}
          studentId={assignSessionTarget.studentId}
          studentName={assignSessionTarget.studentName}
          courseId={assignSessionTarget.courseId}
          courseTitle={assignSessionTarget.courseTitle}
          currentSessionId={assignSessionTarget.currentSessionId}
          currentSessionName={assignSessionTarget.currentSessionName}
          availableSessions={sessions}
          onSuccess={() => {
            if (session?.userId) fetchStudents(session.userId);
          }}
        />
      )}

    </div>
  );
}
