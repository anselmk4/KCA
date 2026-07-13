"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Search, TrendingUp, BookOpen, Award, DollarSign,
  ArrowRight, Filter, ChevronDown, Loader2, UserCheck,
  AlertCircle, Clock, CheckCircle2, Circle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";

type StudentEnrollment = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  progressPercent: number;
  enrollmentStatus: string;
  enrolledAt: string;
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "none";
  paymentAmount: number;
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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AT_RISK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  INACTIVE: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Payé", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PENDING: { label: "En attente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAILED: { label: "Échoué", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  none: { label: "Gratuit", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

function ProgressRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? "#10b981" : percent >= 40 ? "#3b82f6" : "#f59e0b";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-zinc-100 dark:text-zinc-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

export default function StudentsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const s = getSimulatedSession();
    setSession(s);
    if (!s?.userId) { router.replace("/login"); return; }
    fetchStudents(s.userId);
  }, [router]);
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
      if (e.paymentStatus === "PAID") g.totalPaid += e.paymentAmount;
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
  const atRiskCount = grouped.filter(g => g.avgProgress < 20 && g.enrollments.length > 0).length;

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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Plan Free Limitations Card / Upgrade Invite Banner */}
      {session?.plan === "FREE" && (
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 border-2 border-dashed border-red-500/30 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md relative overflow-hidden text-left mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/5 rounded-full blur-[40px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[40px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="space-y-3 z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              ⚠️ Plan d&apos;essai gratuit actif
            </span>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-snug">
              Boostez votre Académie en passant au Plan Supérieur !
            </h2>
            <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
              Votre plan actuel est limité à <span className="font-bold text-zinc-900 dark:text-white">1 cours actif</span>, <span className="font-bold text-zinc-900 dark:text-white">15 apprenants</span> et comporte des frais de transaction de <span className="font-bold text-zinc-900 dark:text-white">20%</span>. 
              Passez au Plan supérieur pour débloquer les <span className="font-semibold text-blue-600 dark:text-blue-400">sessions live</span>, réduire vos frais de transaction à <span className="font-semibold text-teal-650 dark:text-teal-400">10% ou moins</span> et accueillir des élèves en illimité.
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Passer à l&apos;offre supérieure
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              href="/instructor/billing"
              className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
            >
              Voir tous les tarifs & avantages
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Gestion</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Étudiants</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            {grouped.length} apprenant{grouped.length !== 1 ? "s" : ""} inscrits sur {[...new Set(enrollments.map(e => e.courseId))].length} cours
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total apprenants",
            value: grouped.length,
            icon: Users,
            color: "text-teal-600 dark:text-teal-400",
            bg: "bg-teal-50 dark:bg-teal-900/20",
            border: "border-teal-100 dark:border-teal-900/30",
          },
          {
            label: "Revenus générés",
            value: `${totalRevenue.toLocaleString()} $`,
            icon: DollarSign,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            border: "border-emerald-100 dark:border-emerald-900/30",
          },
          {
            label: "Progression moy.",
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-100 dark:border-blue-900/30",
          },
          {
            label: "Certifiés",
            value: certifiedCount,
            icon: Award,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "border-purple-100 dark:border-purple-900/30",
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white dark:bg-zinc-900 rounded-2xl border ${kpi.border} p-5 shadow-sm flex items-start gap-4`}>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert bar */}
      {atRiskCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            <span className="font-bold">{atRiskCount} apprenant{atRiskCount > 1 ? "s" : ""}</span> n&apos;ont pas encore dépassé 20% de progression. Pensez à les relancer.
          </p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un apprenant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-shadow"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Statut</label>
            <div className="flex flex-wrap gap-2">
              {["all", "ACTIVE", "COMPLETED", "AT_RISK", "INACTIVE"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? "bg-teal-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                >
                  {s === "all" ? "Tous" : s === "ACTIVE" ? "Actif" : s === "COMPLETED" ? "Complété" : s === "AT_RISK" ? "En difficulté" : "Inactif"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Paiement</label>
            <div className="flex flex-wrap gap-2">
              {["all", "PAID", "PENDING", "FAILED"].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPayment(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterPayment === p ? "bg-teal-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                >
                  {p === "all" ? "Tous" : p === "PAID" ? "Payé" : p === "PENDING" ? "En attente" : "Échoué"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Aucun étudiant trouvé</p>
          <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Publiez vos cours pour attirer vos premiers apprenants.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-3">Apprenant</div>
            <div className="col-span-3">Cours inscrits</div>
            <div className="col-span-2 text-center">Progression</div>
            <div className="col-span-2 text-center">Paiement</div>
            <div className="col-span-1 text-center">Certif.</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {filtered.map(student => {
            const initials = student.studentName.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase();
            const primaryEnrollment = student.enrollments[0];
            const payBadge = PAYMENT_BADGE[primaryEnrollment?.paymentStatus || "none"];
            const isAtRisk = student.avgProgress < 20;

            return (
              <div
                key={student.studentId}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg transition-all duration-200"
              >
                {/* Main row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-5 items-center">
                  {/* Student info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${isAtRisk ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"}`}>
                        {initials}
                      </div>
                      {student.hasCertificate && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Award className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{student.studentName}</p>
                      <p className="text-xs text-zinc-400 truncate">{student.studentEmail}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Inscrit {new Date(student.lastActivity).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="col-span-3">
                    <div className="space-y-1.5">
                      {student.enrollments.slice(0, 2).map(e => (
                        <div key={e.courseId} className="flex items-center gap-2">
                          <BookOpen className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{e.courseTitle}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[e.enrollmentStatus] || STATUS_COLORS.INACTIVE}`}>
                            {e.enrollmentStatus === "ACTIVE" ? "Actif" : e.enrollmentStatus === "COMPLETED" ? "Terminé" : e.enrollmentStatus}
                          </span>
                        </div>
                      ))}
                      {student.enrollments.length > 2 && (
                        <p className="text-[10px] text-zinc-400">+ {student.enrollments.length - 2} autre{student.enrollments.length - 2 > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2 flex flex-col items-center gap-1">
                    <div className="relative flex items-center justify-center">
                      <ProgressRing percent={student.avgProgress} size={48} />
                      <span className="absolute text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {student.avgProgress}%
                      </span>
                    </div>
                    {isAtRisk && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        En retard
                      </span>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="col-span-2 flex flex-col items-center gap-1.5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${payBadge.cls}`}>
                      {payBadge.label}
                    </span>
                    {student.totalPaid > 0 && (
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {student.totalPaid.toLocaleString()} $
                      </p>
                    )}
                  </div>

                  {/* Certificate */}
                  <div className="col-span-1 flex justify-center">
                    {student.hasCertificate ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <Link
                      href={`/instructor/students/${student.studentId}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-teal-500/20 group-hover:shadow-teal-500/30"
                    >
                      Détails
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Progress bars per course (expanded view) */}
                {student.enrollments.length > 0 && (
                  <div className="px-6 pb-4 pt-0">
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {student.enrollments.map(e => (
                        <div key={e.courseId} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{e.courseTitle}</span>
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{e.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${e.progressPercent >= 80 ? "bg-emerald-500" : e.progressPercent >= 40 ? "bg-blue-500" : "bg-amber-400"}`}
                              style={{ width: `${e.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
