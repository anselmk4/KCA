"use client";

import { useEffect, useState, useMemo } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import {
  BookOpen,
  Users,
  TrendingUp,
  Wallet,
  DollarSign,
  Star,
  Clock,
  ArrowUpRight,
  Loader2,
  BarChart3,
  Calendar,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
} from "lucide-react";
import Link from "next/link";

type TimeRange = "7D" | "30D" | "12M";

interface ChartBucket {
  key: string;
  label: string;
  subLabel?: string;
  amount: number;
  count: number;
  onlineAmount: number;
  manualAmount: number;
}

export default function InstructorDashboardPage() {
  const { t, language } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState("Kuettu Crypto Academy");
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [onlineRevenue, setOnlineRevenue] = useState(0);
  const [manualRevenue, setManualRevenue] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, { enrollCount: number; revenue: number }>>({});
  const [salesTransactions, setSalesTransactions] = useState<any[]>([]);
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange>("30D");

  useEffect(() => {
    const activeSession = getSimulatedSession();
    setSession(activeSession);
    if (!activeSession) {
      setLoading(false);
      return;
    }

    const instructorId = activeSession.userId;

    async function loadDashboardData() {
      setLoading(true);
      try {
        // 0. Fetch academy name from Supabase profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("academy_name, full_name")
          .eq("id", instructorId)
          .single();

        if (profileData?.academy_name) {
          setAcademyName(profileData.academy_name);
        } else if (profileData?.full_name) {
          setAcademyName(`Académie de ${profileData.full_name}`);
        }

        // Fetch co-managed course IDs where this instructor is a collaborator
        const { data: collabData } = await (supabase as any)
          .from("course_collaborators")
          .select("course_id")
          .eq("collaborator_id", instructorId);
        const collabCourseIds = (collabData || []).map((c: any) => c.course_id);

        // Fetch courses owned or co-managed
        let query = supabase
          .from("courses")
          .select("id, title, status, price, level, thumbnail_url, instructor_id");
        
        if (collabCourseIds.length > 0) {
          query = query.or(`instructor_id.eq.${instructorId},id.in.(${collabCourseIds.join(",")})`);
        } else {
          query = query.eq("instructor_id", instructorId);
        }

        const { data: coursesData } = await query;
        const coursesList = coursesData || [];
        setMyCourses(coursesList);

        if (coursesList.length === 0) {
          setLoading(false);
          return;
        }

        const courseIds = coursesList.map((c: any) => c.id);

        // 2. Fetch enrollments for these courses (including manual payments added by instructor)
        const { data: enrollData } = await (supabase as any)
          .from("enrollments")
          .select(`
            id, 
            student_id, 
            course_id, 
            progress_percent, 
            enrolled_at, 
            created_at,
            enrollment_type,
            manual_payment_status,
            manual_amount_paid,
            profiles(id, full_name, email, avatar_url)
          `)
          .in("course_id", courseIds);

        const enrollList = enrollData || [];
        setMyEnrollments(enrollList);

        // Calculate total students (unique student IDs)
        const uniqueStudentIds = new Set(enrollList.map((e: any) => e.student_id));
        setTotalStudents(uniqueStudentIds.size);

        // Calculate average progress
        const totalProgress = enrollList.reduce((sum: number, e: any) => sum + (e.progress_percent || 0), 0);
        const avg = enrollList.length > 0 ? Math.round(totalProgress / enrollList.length) : 0;
        setAvgProgress(avg);

        // 3. Fetch transactions/payments via RLS-bypassing API (includes online + manual cash)
        const earningsRes = await fetch("/api/instructor/earnings");
        let paymentsList: any[] = [];
        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          paymentsList = earningsData.transactions || [];
        }

        setSalesTransactions(paymentsList);

        // 4. Fetch pending payouts
        const { data: payoutsData } = await supabase
          .from("payouts")
          .select("amount")
          .eq("instructor_id", instructorId)
          .eq("status", "PENDING");

        const pendingSum = (payoutsData || []).reduce((sum: number, p: any) => sum + p.amount, 0);
        setPendingPayouts(pendingSum);

        // 5. Calculate per-course enrollments and revenue (Online + Direct/Manual Cash)
        let totalRevenueCalc = 0;
        let onlineSum = 0;
        let manualSum = 0;

        paymentsList.forEach((p: any) => {
          if (p.status === "PAID" || p.status === "COMPLETED") {
            if (p.method === "PAIEMENT_MANUEL_DIRECT" || p.method === "CASH_FORMATEUR") {
              manualSum += (p.amount || 0);
            } else {
              onlineSum += (p.amount || 0);
            }
          }
        });

        const stats: Record<string, { enrollCount: number; revenue: number }> = {};
        coursesList.forEach((c: any) => {
          const courseEnrolls = enrollList.filter((e: any) => e.course_id === c.id);
          
          let courseRevenueSum = paymentsList
            .filter((p: any) => (p.courseId === c.id || (p.notes || "").includes(c.id)) && (p.status === "PAID" || p.status === "COMPLETED"))
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

          // If no payments list entry, compute manual cash from enrollment fields
          if (courseRevenueSum === 0 && courseEnrolls.length > 0) {
            courseEnrolls.forEach((enr: any) => {
              const manualStatus = enr.manual_payment_status;
              const manualAmt = Number(enr.manual_amount_paid) || 0;
              const coursePrice = Number(c.price) || 0;
              if (manualAmt > 0) {
                courseRevenueSum += manualAmt;
                manualSum += manualAmt;
              } else if (manualStatus === "CASH_FULL") {
                courseRevenueSum += coursePrice;
                manualSum += coursePrice;
              }
            });
          }

          totalRevenueCalc += courseRevenueSum;

          stats[c.id] = {
            enrollCount: courseEnrolls.length,
            revenue: courseRevenueSum
          };
        });

        const finalTotal = totalRevenueCalc > 0 ? totalRevenueCalc : (onlineSum + manualSum);
        setTotalRevenue(finalTotal);
        setOnlineRevenue(onlineSum);
        setManualRevenue(manualSum > 0 ? manualSum : (finalTotal - onlineSum));
        setCourseStats(stats);

        // 6. Map recent enrollments
        const sortedEnrolls = [...enrollList]
          .sort((a: any, b: any) => new Date(b.enrolled_at || b.created_at || 0).getTime() - new Date(a.enrolled_at || a.created_at || 0).getTime())
          .slice(0, 5)
          .map((enr: any) => ({
            id: enr.id,
            studentName: enr.profiles?.full_name || "Étudiant",
            studentInit: enr.profiles?.full_name?.charAt(0) || "?",
            courseTitle: coursesList.find((c: any) => c.id === enr.course_id)?.title || "Cours",
            isManualPaid: enr.manual_payment_status === "CASH_FULL" || (Number(enr.manual_amount_paid) || 0) > 0,
            joinedAt: enr.enrolled_at || enr.created_at
          }));
        setRecentEnrollments(sortedEnrolls);

      } catch (err) {
        console.error("Error loading instructor dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Determine if this instructor has paying learners or sales (online or manual)
  const hasPaidSales = useMemo(() => {
    return totalRevenue > 0 || 
           salesTransactions.some(t => t.status === "PAID" || t.status === "COMPLETED") ||
           myEnrollments.some(e => e.manual_payment_status === "CASH_FULL" || (Number(e.manual_amount_paid) || 0) > 0);
  }, [totalRevenue, salesTransactions, myEnrollments]);

  // Compute sales chart data dynamically based on timeRange (Online + Manual payments)
  const chartData = useMemo<ChartBucket[]>(() => {
    if (!hasPaidSales) return [];

    const now = new Date();
    const buckets: ChartBucket[] = [];

    // Synthesize transaction items with timestamps
    const items: Array<{ date: Date; amount: number; isManual: boolean }> = [];

    salesTransactions.forEach((tx: any) => {
      if (tx.status === "PAID" || tx.status === "COMPLETED") {
        const d = new Date(tx.createdAt || tx.date || tx.created_at || Date.now());
        const isManual = tx.method === "PAIEMENT_MANUEL_DIRECT" || tx.method === "CASH_FORMATEUR";
        items.push({ date: d, amount: Number(tx.amount) || 0, isManual });
      }
    });

    // Also include manual enrollments if they weren't in salesTransactions
    if (myEnrollments.length > 0) {
      myEnrollments.forEach((enr: any) => {
        const manualStatus = enr.manual_payment_status;
        const manualAmt = Number(enr.manual_amount_paid) || 0;
        const course = myCourses.find(c => c.id === enr.course_id);
        const coursePrice = Number(course?.price) || 0;

        const isCash = manualStatus === "CASH_FULL" || manualAmt > 0;
        const paidAmount = manualAmt > 0 ? manualAmt : (manualStatus === "CASH_FULL" ? coursePrice : 0);

        if (isCash && paidAmount > 0 && !items.some(it => it.amount === paidAmount && it.date.toISOString() === new Date(enr.enrolled_at || enr.created_at).toISOString())) {
          const d = new Date(enr.enrolled_at || enr.created_at || Date.now());
          items.push({ date: d, amount: paidAmount, isManual: true });
        }
      });
    }

    if (chartTimeRange === "7D") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
        const dayNum = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

        const inBucket = items.filter(item => item.date >= d && item.date < nextD);
        const amount = inBucket.reduce((sum, item) => sum + item.amount, 0);
        const onlineAmount = inBucket.filter(i => !i.isManual).reduce((sum, i) => sum + i.amount, 0);
        const manualAmount = inBucket.filter(i => i.isManual).reduce((sum, i) => sum + i.amount, 0);

        buckets.push({
          key: d.toISOString(),
          label: `${dayName} ${d.getDate()}`,
          subLabel: dayNum,
          amount,
          onlineAmount,
          manualAmount,
          count: inBucket.length,
        });
      }
    } else if (chartTimeRange === "30D") {
      // 6 segments of 5 days
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 5 + 4));
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(now.getDate() - (i * 5));
        end.setHours(23, 59, 59, 999);

        const label = `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString("fr-FR", { month: "short" })}`;

        const inBucket = items.filter(item => item.date >= start && item.date <= end);
        const amount = inBucket.reduce((sum, item) => sum + item.amount, 0);
        const onlineAmount = inBucket.filter(i => !i.isManual).reduce((sum, i) => sum + i.amount, 0);
        const manualAmount = inBucket.filter(i => i.isManual).reduce((sum, i) => sum + i.amount, 0);

        buckets.push({
          key: `${start.toISOString()}_${end.toISOString()}`,
          label,
          amount,
          onlineAmount,
          manualAmount,
          count: inBucket.length,
        });
      }
    } else {
      // 12 Months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextM = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthName = d.toLocaleDateString("fr-FR", { month: "short" });

        const inBucket = items.filter(item => item.date >= d && item.date < nextM);
        const amount = inBucket.reduce((sum, item) => sum + item.amount, 0);
        const onlineAmount = inBucket.filter(i => !i.isManual).reduce((sum, i) => sum + i.amount, 0);
        const manualAmount = inBucket.filter(i => i.isManual).reduce((sum, i) => sum + i.amount, 0);

        buckets.push({
          key: d.toISOString(),
          label: monthName,
          subLabel: d.getFullYear().toString(),
          amount,
          onlineAmount,
          manualAmount,
          count: inBucket.length,
        });
      }
    }

    return buckets;
  }, [hasPaidSales, chartTimeRange, salesTransactions, myEnrollments, myCourses]);

  const maxChartVal = useMemo(() => {
    const maxAmount = Math.max(...chartData.map(d => d.amount), 50);
    return maxAmount * 1.15;
  }, [chartData]);

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.amount, 0);
  }, [chartData]);

  const totalPeriodSales = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.count, 0);
  }, [chartData]);

  if (loading || !session) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const instructorName = session?.name ?? "";
  const publishedCourses = myCourses.filter((c) => c.status === "PUBLISHED");
  const draftCourses = myCourses.filter((c) => c.status === "DRAFT");

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            {language === "en" ? `Hello, ${instructorName} 👋` : `Bonjour, ${instructorName} 👋`}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {language === "en" ? "Here is an overview of your teaching activity." : "Voici un aperçu complet de vos ventes (en ligne et directes) et de vos apprenants."}
          </p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/40 rounded-2xl px-5 py-3 text-left md:text-right">
          <span className="block text-xxs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
            {language === "en" ? "Your Academy" : "Votre Académie"}
          </span>
          <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 block">{academyName}</span>
        </div>
      </div>

      {/* Plan Free Limitations Card / Upgrade Invite Banner */}
      {session?.plan === "FREE" && (
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 border-2 border-dashed border-red-500/30 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md relative overflow-hidden text-left">
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
              Passez au Plan supérieur pour débloquer les <span className="font-semibold text-blue-600 dark:text-blue-400">sessions live</span>, réduire vos frais de transaction à <span className="font-semibold text-teal-600 dark:text-teal-400">10% ou moins</span> et accueillir des élèves en illimité.
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Global */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Revenus Totaux Perçus
            </p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {totalRevenue.toLocaleString()}$
            </h3>
            {manualRevenue > 0 && (
              <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">
                Dont {manualRevenue.toLocaleString()}$ perçus en direct/cash
              </span>
            )}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("instructor.dashboard.statsStudents")}
            </p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalStudents}</h3>
            <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">
              {myEnrollments.length} inscription{myEnrollments.length > 1 ? "s" : ""} au total
            </span>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {language === "en" ? "Published Courses" : "Cours publiés"}
            </p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {publishedCourses.length}
              {draftCourses.length > 0 && (
                <span className="text-sm font-normal text-zinc-400 ml-1">
                  +{draftCourses.length} {language === "en" ? "drafts" : "brouillons"}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {language === "en" ? "Pending Payouts" : "Retraits en attente"}
            </p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {pendingPayouts.toLocaleString()}$
            </h3>
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL SALES & PURCHASES TIMELINE GRAPH ── */}
      {/* Only rendered when the instructor has paying students / sales (online or direct/manual) */}
      {hasPaidSales && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 md:p-8 shadow-sm space-y-6 text-left relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Évolution des Ventes & Achats de Formations
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Suivi chronologique des achats en ligne et des paiements directs/cash perçus.
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              {(["7D", "30D", "12M"] as TimeRange[]).map((range) => {
                const label = range === "7D" ? "7 Jours" : range === "30D" ? "30 Jours" : "12 Mois";
                const active = chartTimeRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setChartTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? "bg-white dark:bg-zinc-700 text-teal-600 dark:text-teal-400 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Bar for Period with Online / Direct Cash indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Total Période
              </span>
              <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                {totalPeriodRevenue.toLocaleString()}$
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Achats enregistrés
              </span>
              <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
                {totalPeriodSales} {totalPeriodSales > 1 ? "ventes" : "vente"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-blue-500" /> En Ligne (Site)
              </span>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {chartData.reduce((sum, d) => sum + d.onlineAmount, 0).toLocaleString()}$
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-500" /> Direct / Cash
              </span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                {chartData.reduce((sum, d) => sum + d.manualAmount, 0).toLocaleString()}$
              </span>
            </div>
          </div>

          {/* Dynamic SVG Bar Chart */}
          <div className="h-64 relative w-full flex items-end pt-6 pb-2 select-none">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                Aucune vente enregistrée sur cette période.
              </div>
            ) : (
              <div className="w-full h-full flex justify-between items-end gap-2 md:gap-4 px-1">
                {chartData.map((d, index) => {
                  const revenueHeight = (d.amount / maxChartVal) * 100;
                  const isPeak = d.amount > 0 && d.amount === Math.max(...chartData.map(x => x.amount));

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Interactive Hover Tooltip */}
                      <div className="absolute bottom-full mb-3 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-medium p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 shadow-xl border border-white/10 flex flex-col gap-1 whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                          <Calendar className="w-3 h-3 text-teal-400" />
                          <span>{d.label}</span>
                        </div>
                        <div className="text-sm font-bold text-teal-400">
                          {d.amount.toFixed(2)}$ total
                        </div>
                        {d.onlineAmount > 0 && (
                          <div className="text-[10px] text-blue-300 flex items-center gap-1">
                            <span>● En ligne : {d.onlineAmount.toFixed(2)}$</span>
                          </div>
                        )}
                        {d.manualAmount > 0 && (
                          <div className="text-[10px] text-amber-300 flex items-center gap-1">
                            <span>● Direct / Cash : {d.manualAmount.toFixed(2)}$</span>
                          </div>
                        )}
                        <div className="text-[11px] text-zinc-300 flex items-center gap-1 pt-0.5 border-t border-white/10 mt-0.5">
                          <ShoppingBag className="w-3 h-3 text-indigo-400" />
                          <span>{d.count} vente{d.count > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      {/* Bar & Peak Indicator */}
                      <div className="w-full flex flex-col items-center justify-end h-[85%]">
                        {isPeak && d.amount > 0 && (
                          <div className="mb-1 text-[10px] font-bold text-amber-500 flex items-center gap-0.5 animate-bounce">
                            <Sparkles className="w-3 h-3" />
                          </div>
                        )}
                        <div
                          style={{ height: `${Math.max(revenueHeight, 4)}%` }}
                          className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                            d.amount > 0
                              ? "bg-gradient-to-t from-teal-600 via-teal-500 to-emerald-400 group-hover:from-teal-500 group-hover:to-emerald-300 shadow-md shadow-teal-500/20 group-hover:scale-105"
                              : "bg-zinc-200/70 dark:bg-zinc-800/70"
                          }`}
                        />
                      </div>

                      {/* Axis Label */}
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-3 truncate w-full text-center group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Ventes Globales ($)</span>
              <span className="flex items-center gap-1 text-blue-500"><CreditCard className="w-3 h-3" /> Paiements Site</span>
              <span className="flex items-center gap-1 text-amber-500"><Banknote className="w-3 h-3" /> Paiements Directs / Cash</span>
            </div>
            <Link
              href="/instructor/students"
              className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1 normal-case text-xs"
            >
              Gérer la liste complète des apprenants →
            </Link>
          </div>
        </div>
      )}

      {/* Invite to create first course banner if they don't have any courses yet */}
      {myCourses.length === 0 && (
        <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-650 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl text-left animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[50px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[40px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
              ✨ Lancez votre activité gratuitement
            </span>
            <h2 className="text-xl md:text-2xl font-black leading-snug">
              Créez et publiez votre premier cours 100% gratuitement !
            </h2>
            <p className="text-sm text-teal-50/90 leading-relaxed font-medium">
              Conformément à notre promesse, votre premier cours sur la plateforme est entièrement gratuit. 
              Partagez votre expertise dans le domaine de votre choix et commencez à enseigner dès aujourd'hui. 
              Vous disposez de tous les outils nécessaires pour structurer vos chapitres, ajouter des leçons, et évaluer vos premiers élèves.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/instructor/courses"
                className="px-6 py-3 bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Créer mon premier cours
                <ArrowUpRight className="w-4 h-4 text-teal-900" />
              </Link>
              <Link
                href="/instructor/community"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Consulter les guides formateurs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses Quick View */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mes Cours</h2>
            <Link
              href="/instructor/courses"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {myCourses.length === 0 && (
              <div className="p-8 text-center text-zinc-500">Aucun cours créé.</div>
            )}
            {myCourses.slice(0, 4).map((course) => {
              const stat = courseStats[course.id] || { enrollCount: 0, revenue: 0 };
              return (
                <div
                  key={course.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    {course.thumbnail_url ? (
                      <div className="shrink-0 w-11 h-7 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800">
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-11 h-7 rounded bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {stat.enrollCount} inscrit{stat.enrollCount > 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {stat.revenue.toLocaleString()}$
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      course.status === "PUBLISHED"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : course.status === "DRAFT"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        : course.status === "REVIEW"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats / Activity */}
        <div className="space-y-6">
          {/* Avg Progress */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
              Progression moyenne
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="fill-none stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="fill-none stroke-teal-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(avgProgress / 100) * 201} 201`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-900 dark:text-white">
                  {avgProgress}%
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  de vos {myEnrollments.length} inscription{myEnrollments.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
              Inscriptions récentes
            </h3>
            {recentEnrollments.length === 0 && (
              <p className="text-sm text-zinc-500">Aucune inscription récente.</p>
            )}
            <div className="space-y-3">
              {recentEnrollments.map((enr) => (
                <div key={enr.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 text-xs font-bold shrink-0">
                    {enr.studentInit}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {enr.studentName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500 truncate">{enr.courseTitle}</p>
                      {enr.isManualPaid && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded">
                          Cash/Direct
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(enr.joinedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
