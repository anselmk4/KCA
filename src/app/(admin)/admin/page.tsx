"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CreditCard, TrendingUp, BookOpen, Clock, Calendar, RefreshCw, BarChart3, PieChart, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// Plan configuration for commissions
const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
};

export interface ChartPoint {
  key: string;
  label: string;
  fullDate: string;
  amount: number;
  commission: number;
  instructorShare: number;
  salesCount: number;
}

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
  chartData: ChartPoint[];
  plansRevenue: number;
  planProportions: { BASE: number; PRO: number; MAX: number; total: number };
  mostPurchasedPlan: string;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  totalSalesCount: number;
  bestDayLabel: string;
  bestDayAmount: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [stats, setStats] = useState<OverviewData | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

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
      const rolesObj: Record<string, string> = {};
      userRolesData?.forEach((ur: any) => {
        const name = ur.roles?.name;
        if (name) {
          roleMap.set(ur.user_id, name);
          rolesObj[ur.user_id] = name;
        }
      });
      setRolesMap(rolesObj);

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

      // 4. Fetch 5 most recent registrations
      const { data: recentRegs } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentRegistrations(recentRegs || []);

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

      // 5. Fetch all payments via admin API (bypasses RLS to include all student/instructor payments, manual and auto)
      let payments: any[] = [];
      let pendingPaymentsCount = 0;
      let pendingPaymentsAmount = 0;

      try {
        const pRes = await fetch("/api/admin/payments?status=ALL");
        if (pRes.ok) {
          const pData = await pRes.json();
          payments = pData.payments || [];
          pendingPaymentsCount = pData.counts?.pending || 0;
          pendingPaymentsAmount = pData.totals?.pendingTotalAmount || 0;
        } else {
          // Fallback to client query if endpoint is not reachable
          const { data: fallbackPayments } = await supabase
            .from("payments")
            .select("id, amount, status, paid_at, user_id, order_id, method");
          payments = fallbackPayments || [];
          pendingPaymentsCount = payments.filter((p: any) => p.status === "PENDING").length;
          pendingPaymentsAmount = payments.filter((p: any) => p.status === "PENDING").reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        }
      } catch (e) {
        console.error("Failed to load payments from admin API:", e);
      }

      // 6. Get instructor plans to calculate commissions
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

      // Date Ranges for filtering
      const now = new Date();
      let filterStart = new Date(0);
      let filterEnd = new Date();

      if (timeFilter === "DAY") {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        filterStart = d;
      } else if (timeFilter === "WEEK") {
        const d = new Date();
        const first = d.getDate() - d.getDay();
        d.setDate(first);
        d.setHours(0, 0, 0, 0);
        filterStart = d;
      } else if (timeFilter === "MONTH") {
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === "YEAR") {
        filterStart = new Date(now.getFullYear(), 0, 1);
      } else if (timeFilter === "CUSTOM" && startDate) {
        filterStart = new Date(startDate);
        if (endDate) {
          const endD = new Date(endDate);
          endD.setHours(23, 59, 59, 999);
          filterEnd = endD;
        }
      }

      // Filter PAID payments based on date range for revenue, commissions, & charts
      const paidPayments = (payments || []).filter(p => (p.status || "").toUpperCase() === "PAID");
      const filteredPayments = paidPayments.filter(p => {
        const dateVal = p.paid_at || p.paidAt || p.date || p.created_at || p.createdAt;
        if (!dateVal) return true;
        const pDate = new Date(dateVal);
        const endWithGrace = new Date(filterEnd.getTime() + 86400000);
        return pDate >= filterStart && pDate <= endWithGrace;
      });

      // Calculate Revenue, Commissions & Instructor shares
      // Parse method field: CARRIER::TYPE::ITEM_ID
      let totalRevenue = 0;
      let commissions = 0;
      let instructorPayouts = 0;
      let plansRevenue = 0;
      let planCounts = { BASE: 0, PRO: 0, MAX: 0 };

      filteredPayments.forEach(p => {
        const amount = Number(p.amount) || 0;
        totalRevenue += amount;

        // Decode method field: CARRIER::TYPE::ITEM_ID
        const rawMethod = p.rawMethod || p.method || "";
        const methodParts = rawMethod.split("::");
        const paymentType = methodParts[1] || p.paymentType || "";
        const itemId = methodParts[2] || p.courseId || p.course_id || "";

        const isPlan = paymentType === "INSTRUCTOR_PLAN" ||
          rawMethod.includes("INSTRUCTOR_PLAN") ||
          (p.courseTitle || "").includes("Abonnement Formateur") ||
          (p.courseTitle || "").includes("Forfait Formateur");

        if (isPlan) {
          // Plan purchase → 100% platform revenue
          plansRevenue += amount;
          const planKey = (itemId || "PRO").toUpperCase() as "BASE" | "PRO" | "MAX";
          if (planKey in planCounts) planCounts[planKey] += 1;
        } else {
          // Course purchase → split by instructor plan commission rate
          const courseId = itemId || "";
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

      // Group payments by date for the chart with strict chronological ordering
      const pointsMap = new Map<string, ChartPoint>();

      if (timeFilter === "DAY") {
        // 6 slots of 4 hours for today
        const slots = [
          { label: "00h-04h", hStart: 0, hEnd: 4 },
          { label: "04h-08h", hStart: 4, hEnd: 8 },
          { label: "08h-12h", hStart: 8, hEnd: 12 },
          { label: "12h-16h", hStart: 12, hEnd: 16 },
          { label: "16h-20h", hStart: 16, hEnd: 20 },
          { label: "20h-24h", hStart: 20, hEnd: 24 },
        ];
        slots.forEach((s, idx) => {
          const key = `slot_${idx}`;
          pointsMap.set(key, {
            key,
            label: s.label,
            fullDate: `Aujourd'hui (${s.label})`,
            amount: 0,
            commission: 0,
            instructorShare: 0,
            salesCount: 0,
          });
        });
      } else if (timeFilter === "WEEK") {
        // 7 days of current week from Monday to Sunday in strict order
        const d = new Date();
        const dayOfWeek = d.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - distanceToMonday);
        monday.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
          const cur = new Date(monday);
          cur.setDate(monday.getDate() + i);
          const key = cur.toISOString().split("T")[0];
          const label = cur.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });
          const fullDate = cur.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          pointsMap.set(key, {
            key,
            label,
            fullDate,
            amount: 0,
            commission: 0,
            instructorShare: 0,
            salesCount: 0,
          });
        }
      } else if (timeFilter === "MONTH") {
        // All days of the current month from day 1 to today in strict chronological order
        const year = now.getFullYear();
        const month = now.getMonth();
        const maxDay = Math.max(now.getDate(), 1);

        for (let day = 1; day <= maxDay; day++) {
          const cur = new Date(year, month, day);
          const key = cur.toISOString().split("T")[0];
          const label = cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
          const fullDate = cur.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          pointsMap.set(key, {
            key,
            label,
            fullDate,
            amount: 0,
            commission: 0,
            instructorShare: 0,
            salesCount: 0,
          });
        }
      } else if (timeFilter === "YEAR") {
        // 12 months in strict order from Jan to Dec
        const year = now.getFullYear();
        for (let m = 0; m < 12; m++) {
          const cur = new Date(year, m, 1);
          const key = `${year}-${String(m + 1).padStart(2, "0")}`;
          const label = cur.toLocaleDateString("fr-FR", { month: "short" });
          const fullDate = cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          pointsMap.set(key, {
            key,
            label,
            fullDate,
            amount: 0,
            commission: 0,
            instructorShare: 0,
            salesCount: 0,
          });
        }
      } else if (timeFilter === "CUSTOM" && startDate && endDate) {
        // Custom dates in strict chronological order
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));

        if (diffDays <= 45) {
          for (let i = 0; i <= diffDays; i++) {
            const cur = new Date(s);
            cur.setDate(s.getDate() + i);
            const key = cur.toISOString().split("T")[0];
            const label = cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
            const fullDate = cur.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            pointsMap.set(key, {
              key,
              label,
              fullDate,
              amount: 0,
              commission: 0,
              instructorShare: 0,
              salesCount: 0,
            });
          }
        } else {
          const cur = new Date(s);
          while (cur <= e) {
            const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
            const label = cur.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
            const fullDate = cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            if (!pointsMap.has(key)) {
              pointsMap.set(key, {
                key,
                label,
                fullDate,
                amount: 0,
                commission: 0,
                instructorShare: 0,
                salesCount: 0,
              });
            }
            cur.setMonth(cur.getMonth() + 1);
          }
        }
      }

      let totalSalesCount = 0;

      filteredPayments.forEach((p) => {
        const amount = Number(p.amount) || 0;
        if (amount <= 0) return;

        totalSalesCount++;

        const dateVal = p.paid_at || p.paidAt || p.date || p.created_at || p.createdAt;
        const pDate = dateVal ? new Date(dateVal) : new Date();

        let targetKey = "";
        if (timeFilter === "DAY") {
          const slotIdx = Math.min(5, Math.floor(pDate.getHours() / 4));
          targetKey = `slot_${slotIdx}`;
        } else if (timeFilter === "YEAR") {
          targetKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
        } else if (timeFilter === "CUSTOM" && pointsMap.size > 0 && !pointsMap.has(pDate.toISOString().split("T")[0])) {
          targetKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
        } else {
          targetKey = pDate.toISOString().split("T")[0];
        }

        // Decode method or pre-calculated commissions from /api/admin/payments
        const rawMethod = p.rawMethod || p.method || "";
        const methodParts = rawMethod.split("::");
        const paymentType = methodParts[1] || p.paymentType || "";
        const itemId = methodParts[2] || p.courseId || p.course_id || "";
        const isPlan = paymentType === "INSTRUCTOR_PLAN" ||
          rawMethod.includes("INSTRUCTOR_PLAN") ||
          (p.courseTitle || "").includes("Abonnement Formateur") ||
          (p.courseTitle || "").includes("Forfait Formateur");

        let comm = p.commissionAmount != null ? Number(p.commissionAmount) : 0;
        let inst = p.instructorShareAmount != null ? Number(p.instructorShareAmount) : 0;

        if (comm === 0 && !isPlan) {
          const courseObj = courses?.find((c) => c.id === itemId);
          const instructorId = courseObj?.instructor_id || "";
          const instPlan = instructorPlans[instructorId] || "FREE";
          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
          comm = amount * commConfig.commissionRate;
          inst = amount * commConfig.instructorShare;
        } else if (isPlan) {
          comm = amount;
          inst = 0;
        }

        const point = pointsMap.get(targetKey);
        if (point) {
          point.amount += amount;
          point.commission += comm;
          point.instructorShare += inst;
          point.salesCount += 1;
        } else {
          const label = pDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
          const fullDate = pDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          pointsMap.set(targetKey, {
            key: targetKey,
            label,
            fullDate,
            amount,
            commission: comm,
            instructorShare: inst,
            salesCount: 1,
          });
        }
      });

      // Sort strictly chronologically by key
      const chartData = Array.from(pointsMap.values()).sort((a, b) => a.key.localeCompare(b.key));

      let bestDayLabel = "N/A";
      let bestDayAmount = 0;
      chartData.forEach((d) => {
        if (d.amount > bestDayAmount) {
          bestDayAmount = d.amount;
          bestDayLabel = d.label;
        }
      });

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
          total: totalPlansCount,
        },
        mostPurchasedPlan,
        pendingPaymentsCount,
        pendingPaymentsAmount,
        totalSalesCount,
        bestDayLabel,
        bestDayAmount,
      });

      // Default active point to the best day or the last active point with sales
      const activeDefault = chartData.filter((d) => d.amount > 0).pop() || chartData[chartData.length - 1] || null;
      setActivePoint(activeDefault);
    } catch (err) {
      console.error("Error generating overview stats:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, startDate, endDate]);

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
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-6 animate-in fade-in">
      {/* Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Vue d'ensemble Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Suivi analytique complet des performances commerciales, membres et cours.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-sm max-w-full overflow-x-auto min-w-0">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl flex overflow-x-auto max-w-full shrink-0">
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

      {/* Pending Manual/Auto Payments Alert Banner */}
      {stats.pendingPaymentsCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{stats.pendingPaymentsCount} paiement{stats.pendingPaymentsCount > 1 ? "s" : ""} en attente de validation</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-semibold">
                  {stats.pendingPaymentsAmount.toFixed(2)}$
                </span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Des virements Mobile Money manuels ou transactions en attente nécessitent votre approbation pour débloquer l'accès aux cours des apprenants.
              </p>
            </div>
          </div>
          <Link
            href="/admin/transactions?status=PENDING"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors shrink-0"
          >
            Traiter les paiements
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Dynamic & Interactive Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Évolution des Ventes & Commissions</h2>
              </div>
              <p className="text-xxs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ventes réelles en dollar ($) • Survolez ou cliquez sur une barre pour inspecter les détails
              </p>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-3 text-xxs font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-3 py-1.5 rounded-xl shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
                <span className="text-zinc-700 dark:text-zinc-300">Revenus Ventes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50" />
                <span className="text-zinc-700 dark:text-zinc-300">Commission Site</span>
              </div>
            </div>
          </div>

          {/* Dynamic Inspector Banner (shows exact details of hovered or clicked date) */}
          {activePoint ? (
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-amber-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 transition-all animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">
                  {activePoint.fullDate}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {activePoint.salesCount} transaction{activePoint.salesCount > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mr-1.5">Ventes :</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">{activePoint.amount.toFixed(2)}$</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mr-1.5">Commission :</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">+{activePoint.commission.toFixed(2)}$</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mr-1.5">Part Prof :</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{activePoint.instructorShare.toFixed(2)}$</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-500">
              <span>Sélectionnez ou survolez une date sur le graphique ci-dessous.</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Total : {stats.totalRevenue.toFixed(2)}$</span>
            </div>
          )}

          {/* Interactive Chart Canvas */}
          <div className="relative pt-6 pb-2 select-none">
            {stats.chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-450 dark:text-zinc-500 text-xs">
                <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
                Aucune vente enregistrée sur cette période.
              </div>
            ) : (
              <div className="relative h-64 w-full flex flex-col justify-end">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-15">
                  <div className="border-b border-zinc-500 border-dashed w-full" />
                  <div className="border-b border-zinc-500 border-dashed w-full" />
                  <div className="border-b border-zinc-500 border-dashed w-full" />
                  <div className="border-b border-zinc-400 w-full" />
                </div>

                {/* Bars track */}
                <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-2 px-1 relative z-10">
                  {stats.chartData.map((d, index) => {
                    const revenueHeight = Math.min(100, (d.amount / maxChartVal) * 100);
                    const commissionHeight = Math.min(100, (d.commission / maxChartVal) * 100);
                    const isActive = activePoint?.key === d.key;
                    const hasSales = d.amount > 0;

                    return (
                      <div
                        key={d.key || index}
                        onClick={() => setActivePoint(d)}
                        onMouseEnter={() => setActivePoint(d)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                      >
                        {/* Floating exact amount tag */}
                        {hasSales && (
                          <div className={`mb-1 transition-all duration-200 text-center ${
                            isActive ? "opacity-100 scale-105" : "opacity-0 group-hover:opacity-100"
                          }`}>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm whitespace-nowrap">
                              {Math.round(d.amount)}$
                            </span>
                          </div>
                        )}

                        {/* Bar columns */}
                        <div className="w-full flex justify-center items-end gap-0.5 sm:gap-1 h-[80%] pb-1">
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${hasSales ? Math.max(revenueHeight, 8) : 3}%` }}
                            className={`w-full max-w-[18px] sm:max-w-[24px] rounded-t-md transition-all duration-300 ${
                              hasSales
                                ? isActive
                                  ? "bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-300 shadow-md shadow-blue-500/50 scale-y-105"
                                  : "bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-cyan-400"
                                : "bg-zinc-200 dark:bg-zinc-800 opacity-60"
                            }`}
                          />
                          {/* Commission Bar (if sales present) */}
                          {hasSales && (
                            <div
                              style={{ height: `${Math.max(commissionHeight, 5)}%` }}
                              className={`w-full max-w-[12px] sm:max-w-[16px] rounded-t-md transition-all duration-300 ${
                                isActive
                                  ? "bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300 shadow-md shadow-amber-500/50 scale-y-105"
                                  : "bg-gradient-to-t from-amber-500 to-amber-300 group-hover:from-amber-400 group-hover:to-yellow-300"
                              }`}
                            />
                          )}
                        </div>

                        {/* Date label */}
                        <span className={`text-[9px] sm:text-[10px] font-semibold mt-1 truncate w-full text-center transition-colors ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : hasSales
                            ? "text-zinc-800 dark:text-zinc-200 font-semibold"
                            : "text-zinc-400 dark:text-zinc-600"
                        }`}>
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Insights Footer */}
          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">🏆 Meilleur jour :</span>
              <strong className="text-zinc-900 dark:text-white font-bold">
                {stats.bestDayLabel} ({stats.bestDayAmount.toFixed(2)}$)
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">📊 Transactions :</span>
              <strong className="text-blue-600 dark:text-blue-400 font-bold">
                {stats.totalSalesCount} ventes validées
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">💰 Moyenne / jour :</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {(stats.totalRevenue / Math.max(1, stats.chartData.length)).toFixed(2)}$/j
              </strong>
            </div>
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

      {/* Latest Registrations */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Dernières Inscriptions</h2>
          <p className="text-xxs text-zinc-500">Les 5 derniers apprenants ou formateurs inscrits sur la plateforme</p>
        </div>

        {recentRegistrations.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">Aucune inscription récente.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {recentRegistrations.map((user) => {
              const roleName = rolesMap[user.id] || "STUDENT";
              const initials = user.full_name?.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2).toUpperCase() || "US";
              return (
                <div key={user.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.full_name || "Utilisateur anonyme"}</p>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      roleName === "SUPER_ADMIN" || roleName === "ADMIN"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                        : roleName === "INSTRUCTOR"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                        : "bg-teal-100 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400"
                    }`}>
                      {roleName === "SUPER_ADMIN" ? "Admin" : roleName === "ADMIN" ? "Admin" : roleName === "INSTRUCTOR" ? "Formateur" : "Apprenant"}
                    </span>
                    <p className="text-[9px] text-zinc-455 dark:text-zinc-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
