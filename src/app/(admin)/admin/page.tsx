"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CreditCard, TrendingUp, BookOpen, Clock, Calendar, RefreshCw, BarChart3, PieChart, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Plan configuration for commissions
const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
};

interface OverviewData {
  totalMembers: number;
  activeStudents: number;
  activeInstructors: number;
  mrr: number;
  arr: number;
  churnRate: number;
  commissions: number;
  instructorPayouts: number;
  totalRevenue: number;
  coursesOnline: number;
  coursesInReview: number;
  topCourseTitle: string;
  topCourseStudentCount: number;
  chartData: Array<{ label: string; amount: number; commission: number }>;
  plansRevenue: number;
  planProportions: { BASE: number; PRO: number; MAX: number; total: number };
  mostPurchasedPlan: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [stats, setStats] = useState<OverviewData | null>(null);

  const calculateStats = useCallback(async () => {
    if (!stats) {
      setLoading(true);
    } else {
      // Background loading indicator
      setLoading(true);
    }
    try {
      // 1. Fetch user profiles & roles separately (RLS safe)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, status, created_at");

      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("user_id, roles(name)");

      const roleMap = new Map<string, string>();
      userRolesData?.forEach((ur: any) => {
        const name = ur.roles?.name;
        if (name) {
          roleMap.set(ur.user_id, name);
        }
      });

      const totalMembers = profiles?.length || 0;
      let activeStudents = 0;
      let activeInstructors = 0;
      profiles?.forEach((p) => {
        const roleName = roleMap.get(p.id) || "STUDENT";
        if (roleName === "STUDENT") {
          activeStudents++;
        } else if (roleName === "INSTRUCTOR" || roleName === "SUPER_ADMIN" || roleName === "ADMIN") {
          activeInstructors++;
        }
      });

      // 2. Fetch courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, status, instructor_id");

      const coursesOnline = courses?.filter(c => c.status === "PUBLISHED").length || 0;
      const coursesInReview = courses?.filter(c => c.status === "REVIEW").length || 0;

      // 3. Fetch enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, course_id, status");

      const totalEnrollments = enrollments?.length || 0;
      const suspendedCount = enrollments?.filter(e => e.status === "SUSPENDED" || e.status === "INACTIVE").length || 0;
      const churnRate = totalEnrollments > 0 ? parseFloat(((suspendedCount / totalEnrollments) * 100).toFixed(1)) : 2.4;

      // Find course with the most students
      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(e => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });

      let topCourseId = "";
      let topCourseStudentCount = 0;
      Object.entries(enrollmentCounts).forEach(([cId, count]) => {
        if (count > topCourseStudentCount) {
          topCourseStudentCount = count;
          topCourseId = cId;
        }
      });

      const topCourse = courses?.find(c => c.id === topCourseId);
      const topCourseTitle = topCourse?.title || "Aucun module";

      // 4. Fetch payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, amount, status, paid_at, user_id, order_id")
        .eq("status", "PAID");

      // 5. Get instructor plans to calculate commissions
      const instructorIds = [...new Set(courses?.map(c => c.instructor_id).filter(Boolean))];
      let instructorPlans: Record<string, string> = {};
      if (instructorIds.length > 0) {
        const { data: instProfiles } = await supabase
          .from("profiles")
          .select("id, plan")
          .in("id", instructorIds);
        instProfiles?.forEach(p => {
          instructorPlans[p.id] = p.plan || "FREE";
        });
      }

      // Fetch order items to match payment with course/instructor
      const orderIds = (payments || []).map(p => p.order_id).filter(Boolean);
      let orderItemMap: Record<string, string> = {};
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("order_id, course_id")
          .in("order_id", orderIds);
        orderItems?.forEach(oi => {
          orderItemMap[oi.order_id] = oi.course_id;
        });
      }

      // Date Ranges for filtering
      const now = new Date();
      let filterStart = new Date(0); // Default to beginning of time
      let filterEnd = new Date();

      if (timeFilter === "DAY") {
        filterStart = new Date(now.setHours(0, 0, 0, 0));
      } else if (timeFilter === "WEEK") {
        const first = now.getDate() - now.getDay();
        filterStart = new Date(now.setDate(first));
        filterStart.setHours(0, 0, 0, 0);
      } else if (timeFilter === "MONTH") {
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === "YEAR") {
        filterStart = new Date(now.getFullYear(), 0, 1);
      } else if (timeFilter === "CUSTOM" && startDate) {
        filterStart = new Date(startDate);
        if (endDate) filterEnd = new Date(endDate);
      }

      // Filter payments based on date range
      const filteredPayments = (payments || []).filter(p => {
        if (!p.paid_at) return false;
        const pDate = new Date(p.paid_at);
        return pDate >= filterStart && pDate <= filterEnd;
      });

      // Plan configurations mapping (BASE, PRO, MAX courses act as subscription updates)
      const planUuidMap: Record<string, string> = {
        "99999999-9999-9999-9999-999999990001": "BASE",
        "99999999-9999-9999-9999-999999990002": "PRO",
        "99999999-9999-9999-9999-999999990003": "MAX",
      };

      // Calculate Revenue, Commissions & Instructor shares
      let totalRevenue = 0;
      let commissions = 0;
      let instructorPayouts = 0;
      let plansRevenue = 0;

      // Plan proportions counters
      let planCounts = { BASE: 0, PRO: 0, MAX: 0 };

      filteredPayments.forEach(p => {
        const amount = p.amount || 0;
        totalRevenue += amount;
        
        const courseId = orderItemMap[p.order_id] || "";
        const planName = planUuidMap[courseId];
        if (planName) {
          // It is a plan purchase -> 100% platform revenue, 0 commissions on it
          plansRevenue += amount;
          planCounts[planName as "BASE" | "PRO" | "MAX"] += 1;
        } else {
          // It is a course purchase
          const courseObj = courses?.find(c => c.id === courseId);
          const instructorId = courseObj?.instructor_id || "";
          const instPlan = instructorPlans[instructorId] || "FREE";
          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;

          commissions += amount * commConfig.commissionRate;
          instructorPayouts += amount * commConfig.instructorShare;
        }
      });

      // Find most purchased plan
      let mostPurchasedPlan = "Aucun";
      let maxCount = 0;
      Object.entries(planCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPurchasedPlan = name;
        }
      });

      const totalPlansCount = planCounts.BASE + planCounts.PRO + planCounts.MAX;

      // Extrapolate MRR & ARR
      const mrr = totalRevenue; // Revenue in active filter window
      const arr = mrr * 12;

      // Group payments by date for the chart (daily or monthly depending on time filter)
      const chartMap: Record<string, { label: string; amount: number; commission: number }> = {};
      
      // Initialize recent dates or months
      if (timeFilter === "MONTH" || timeFilter === "WEEK") {
        // Last 7 days or weeks
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
          chartMap[label] = { label, amount: 0, commission: 0 };
        }
      } else if (timeFilter === "YEAR") {
        // 12 months
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const label = d.toLocaleDateString("fr-FR", { month: "short" });
          chartMap[label] = { label, amount: 0, commission: 0 };
        }
      } else {
        // Default last 5 periods
        for (let i = 4; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
          chartMap[label] = { label, amount: 0, commission: 0 };
        }
      }

      filteredPayments.forEach(p => {
        if (!p.paid_at) return;
        const pDate = new Date(p.paid_at);
        const label = timeFilter === "YEAR"
          ? pDate.toLocaleDateString("fr-FR", { month: "short" })
          : pDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

        const courseId = orderItemMap[p.order_id] || "";
        let commAmount = 0;
        // On plan purchases, commission is 0 (since it is platform subscription fee, not course sale commission)
        if (!planUuidMap[courseId]) {
          const courseObj = courses?.find(c => c.id === courseId);
          const instructorId = courseObj?.instructor_id || "";
          const instPlan = instructorPlans[instructorId] || "FREE";
          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
          commAmount = (p.amount || 0) * commConfig.commissionRate;
        }

        if (chartMap[label]) {
          chartMap[label].amount += p.amount || 0;
          chartMap[label].commission += commAmount;
        } else {
          // If label wasn't pre-filled, dynamically add it
          chartMap[label] = {
            label,
            amount: p.amount || 0,
            commission: commAmount
          };
        }
      });

      const chartData = Object.values(chartMap);

      setStats({
        totalMembers,
        activeStudents,
        activeInstructors,
        mrr,
        arr,
        churnRate,
        commissions,
        instructorPayouts,
        totalRevenue,
        coursesOnline,
        coursesInReview,
        topCourseTitle,
        topCourseStudentCount,
        chartData,
        plansRevenue,
        planProportions: {
          BASE: planCounts.BASE,
          PRO: planCounts.PRO,
          MAX: planCounts.MAX,
          total: totalPlansCount
        },
        mostPurchasedPlan
      });
    } catch (err) {
      console.error("Error generating overview stats:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, startDate, endDate, stats]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Set default start/end dates for Custom range
  const initCustomDates = () => {
    if (!startDate) {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - 30); // 30 days ago
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  // Calculate maximum value for SVG scaling
  const maxChartVal = Math.max(...(stats?.chartData?.map(d => d.amount) || []), 50) * 1.15;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Vue d'ensemble Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Suivi analytique complet des performances commerciales, membres et cours.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-sm">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl flex">
            {[
              { id: "DAY", label: "Jour" },
              { id: "WEEK", label: "Semaine" },
              { id: "MONTH", label: "Mois" },
              { id: "YEAR", label: "Année" },
              { id: "CUSTOM", label: "Tranche" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTimeFilter(tab.id as any);
                  if (tab.id === "CUSTOM") initCustomDates();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeFilter === tab.id
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {timeFilter === "CUSTOM" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
              />
              <span className="text-zinc-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
          )}

          <button
            onClick={calculateStats}
            disabled={loading}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
            title="Rafraîchir les statistiques"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "Membres Inscrits",
            value: stats.totalMembers,
            desc: `${stats.activeStudents} apprenants / ${stats.activeInstructors} profs`,
            icon: Users,
            color: "text-blue-500 bg-blue-500/10"
          },
          {
            title: "Revenue Global",
            value: `${stats.totalRevenue.toFixed(2)}$`,
            desc: "Période sélectionnée",
            icon: CreditCard,
            color: "text-emerald-500 bg-emerald-500/10"
          },
          {
            title: "Forfaits Formateurs",
            value: `${stats.plansRevenue.toFixed(2)}$`,
            desc: "Abonnements achetés",
            icon: ShieldCheck,
            color: "text-amber-500 bg-amber-500/10"
          },
          {
            title: "Revenus Récurrents (MRR / ARR)",
            value: `${stats.mrr.toFixed(0)}$ / ${stats.arr.toFixed(0)}$`,
            desc: `ARR extrapolé sur MRR mensuel`,
            icon: TrendingUp,
            color: "text-indigo-500 bg-indigo-500/10"
          },
          {
            title: "Taux d'Attrition (Churn)",
            value: `${stats.churnRate}%`,
            desc: "Abonnements suspendus",
            icon: Clock,
            color: "text-rose-500 bg-rose-500/10"
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white leading-none">{kpi.value}</h3>
                <p className="text-xxs text-zinc-450 dark:text-zinc-500 font-semibold mt-1">{kpi.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finance Grid (Commissions & Instructor shares) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Évolution des Ventes & Commissions</h2>
              <p className="text-xxs text-zinc-500">Flux financiers en dollar ($)</p>
            </div>
            <div className="flex gap-4 text-xxs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                <span className="text-zinc-550 dark:text-zinc-400">Revenus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-amber-500 rounded-full" />
                <span className="text-zinc-550 dark:text-zinc-400">Commission Site</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Bar Chart */}
          <div className="h-60 relative w-full flex items-end pt-4 pb-2">
            {stats.chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-550 text-xs">
                Aucune donnée à afficher.
              </div>
            ) : (
              <div className="w-full h-full flex justify-between items-end gap-2 px-2">
                {stats.chartData.map((d, index) => {
                  const revenueHeight = (d.amount / maxChartVal) * 100;
                  const commissionHeight = (d.commission / maxChartVal) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-zinc-900 text-white text-[9px] font-bold p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md flex flex-col gap-0.5 whitespace-nowrap">
                        <span>Période: {d.label}</span>
                        <span className="text-blue-400">Ventes: {d.amount.toFixed(2)}$</span>
                        <span className="text-amber-400">Comm: {d.commission.toFixed(2)}$</span>
                      </div>

                      {/* Bar tracks */}
                      <div className="w-full flex justify-center items-end h-[90%] gap-1 select-none">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${Math.max(revenueHeight, 3)}%` }}
                          className="w-4 sm:w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300"
                        />
                        {/* Commission Bar */}
                        <div
                          style={{ height: `${Math.max(commissionHeight, 3)}%` }}
                          className="w-4 sm:w-6 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-sm group-hover:shadow-lg group-hover:shadow-amber-500/10 transition-all duration-300"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-2 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Financial Distribution summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Répartition Financière</h2>
            <p className="text-xxs text-zinc-500 dark:text-zinc-400">Détails des frais de commission et part revenant aux formateurs.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Total Ventes</span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-white">{stats.totalRevenue.toFixed(2)}$</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Commissions Cours (Site)
              </span>
              <span className="text-sm font-extrabold text-amber-650 dark:text-amber-500">+{stats.commissions.toFixed(2)}$</span>
            </div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Part Formateurs (Net)
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{stats.instructorPayouts.toFixed(2)}$</span>
            </div>
          </div>

          {/* Inline Graphic: Mini Visual Balance Line */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
              <span>Cours (Commissions)</span>
              <span>Formateurs</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stats.totalRevenue > 0 ? (stats.commissions / stats.totalRevenue) * 100 : 15}%` }}
                className="h-full bg-amber-500"
              />
              <div
                style={{ width: `${stats.totalRevenue > 0 ? (stats.instructorPayouts / stats.totalRevenue) * 100 : 85}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plans Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Pie Chart for Plan Proportions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Proportions des Plans Achetés</h2>
            <p className="text-xxs text-zinc-500">Distribution par type d&apos;abonnement formateur (BASE, PRO, MAX)</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {stats.planProportions.total === 0 ? (
                <div className="text-xxs text-zinc-400 text-center font-semibold">Aucun plan acheté</div>
              ) : (() => {
                const basePct = (stats.planProportions.BASE / stats.planProportions.total) * 100;
                const proPct = (stats.planProportions.PRO / stats.planProportions.total) * 100;
                const maxPct = (stats.planProportions.MAX / stats.planProportions.total) * 100;

                const circ = 251.2;
                
                const baseStroke = (basePct / 100) * circ;
                const proStroke = (proPct / 100) * circ;
                const maxStroke = (maxPct / 100) * circ;

                const baseOffset = circ;
                const proOffset = circ - baseStroke;
                const maxOffset = circ - baseStroke - proStroke;

                return (
                  <>
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-zinc-100 dark:stroke-zinc-800 fill-none" strokeWidth="12" />
                      {baseStroke > 0 && (
                        <circle
                          cx="50" cy="50" r="40"
                          className="stroke-blue-500 fill-none transition-all duration-500"
                          strokeWidth="12"
                          strokeDasharray={`${baseStroke} ${circ}`}
                          strokeDashoffset={baseOffset}
                          strokeLinecap="round"
                        />
                      )}
                      {proStroke > 0 && (
                        <circle
                          cx="50" cy="50" r="40"
                          className="stroke-indigo-500 fill-none transition-all duration-500"
                          strokeWidth="12"
                          strokeDasharray={`${proStroke} ${circ}`}
                          strokeDashoffset={proOffset}
                          strokeLinecap="round"
                        />
                      )}
                      {maxStroke > 0 && (
                        <circle
                          cx="50" cy="50" r="40"
                          className="stroke-amber-500 fill-none transition-all duration-500"
                          strokeWidth="12"
                          strokeDasharray={`${maxStroke} ${circ}`}
                          strokeDashoffset={maxOffset}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center leading-none">
                      <span className="text-xl font-black text-zinc-900 dark:text-white">{stats.planProportions.total}</span>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">Total</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Legend with percentages and counts */}
            <div className="flex flex-col gap-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded-md shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-200 text-xxs">BASE: {stats.planProportions.BASE} ({stats.planProportions.total > 0 ? Math.round((stats.planProportions.BASE / stats.planProportions.total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-indigo-500 rounded-md shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-200 text-xxs">PRO: {stats.planProportions.PRO} ({stats.planProportions.total > 0 ? Math.round((stats.planProportions.PRO / stats.planProportions.total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-amber-500 rounded-md shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-200 text-xxs">MAX: {stats.planProportions.MAX} ({stats.planProportions.total > 0 ? Math.round((stats.planProportions.MAX / stats.planProportions.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Most Purchased Plan Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Plan le plus acheté</h2>
            <p className="text-xxs text-zinc-500">Forfait avec le plus grand volume de ventes</p>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-white">Plan {stats.mostPurchasedPlan}</h4>
              <p className="text-xxs text-zinc-500 font-medium">
                Forfait d&apos;abonnement le plus populaire auprès des formateurs sur la période sélectionnée.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-150 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Total ventes de ce plan</span>
            <span className="text-sm font-extrabold text-indigo-600">
              {stats.mostPurchasedPlan === "BASE" ? stats.planProportions.BASE :
               stats.mostPurchasedPlan === "PRO" ? stats.planProportions.PRO :
               stats.mostPurchasedPlan === "MAX" ? stats.planProportions.MAX : 0} ventes
            </span>
          </div>
        </div>

        {/* Plan Revenue Over Time Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Abonnements selon le temps</h2>
            <p className="text-xxs text-zinc-500">Montant accumulé des abonnements formateurs</p>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex justify-between text-xs font-semibold pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-550">Montant total période</span>
              <span className="text-zinc-900 dark:text-white font-extrabold">{stats.plansRevenue.toFixed(2)}$</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-550">Fréquence moyenne</span>
              <span className="text-zinc-900 dark:text-white">
                {stats.planProportions.total > 0 ? `${(stats.plansRevenue / stats.planProportions.total).toFixed(2)}$ / forfait` : '0.00$'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-150 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Frais de gestion site</span>
            <span className="text-xs bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-lg font-bold uppercase">
              100% au Site (Sans Com.)
            </span>
          </div>
        </div>
      </div>

      {/* Courses Stats & Popular Course Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Status Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Statuts des Cours en Ligne</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xxs text-zinc-500 uppercase font-bold tracking-wider mb-1">Cours En Ligne</p>
                <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450">{stats.coursesOnline}</h4>
              </div>
              <BookOpen className="w-8 h-8 text-emerald-500/20" />
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xxs text-zinc-500 uppercase font-bold tracking-wider mb-1">En Vérification</p>
                <h4 className="text-2xl font-extrabold text-amber-500 dark:text-amber-450">{stats.coursesInReview}</h4>
              </div>
              <Clock className="w-8 h-8 text-amber-500/20" />
            </div>
          </div>
        </div>

        {/* Most Popular Course Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Formation la plus Populaire</h2>
          
          <div className="flex items-center gap-4 py-3">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white truncate max-w-sm">{stats.topCourseTitle}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Cette formation a enregistré le plus grand nombre d&apos;inscriptions d&apos;apprenants.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-150 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Total Inscriptions actives</span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-450">{stats.topCourseStudentCount} apprenants</span>
          </div>
        </div>
      </div>
    </div>
  );
}
