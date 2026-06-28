"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { normalizeStatus } from "@/lib/statusHelpers";
import { getSimulatedSession, setSimulatedSession } from "@/lib/rbac";
import {
  Wallet,
  CircleDollarSign,
  Clock,
  Download,
  TrendingUp,
  BadgePercent,
  Crown,
  Users,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Commission rates per instructor plan
const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number; label: string; badgeColor: string }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80, label: "Free (20% commission)", badgeColor: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  BASE: { commissionRate: 0.10, instructorShare: 0.90, label: "Base (10% commission)", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PRO: { commissionRate: 0.05, instructorShare: 0.95, label: "Pro (5% commission)", badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  MAX: { commissionRate: 0.00, instructorShare: 1.00, label: "Max (0% commission)", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

interface LocalTransaction {
  id: string;
  orderId: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  studentName: string;
  amount: number;
  method: string;
  date: string;
  status: string;
}

export default function EarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [instructorPlan, setInstructorPlan] = useState<string>("FREE");
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [uniqueStudentsCount, setUniqueStudentsCount] = useState(0);

  const fetchEarningsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Get profile and plan
      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("id, plan, full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      const profile = rawProfile as any;
      const currentPlan = profile?.plan || "FREE";
      setInstructorPlan(currentPlan);

      // Sync local simulated session
      if (profile) {
        const localSess = getSimulatedSession();
        const updatedSession = {
          userId: profile.id,
          name: profile.full_name || localSess?.name || "Instructeur",
          email: profile.email || localSess?.email || "",
          role: (localSess?.role || "INSTRUCTOR") as any,
          status: (localSess?.status || "ACTIVE") as any,
          plan: currentPlan as any,
        };
        setSimulatedSession(updatedSession);
      }

      // 2. Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, price")
        .eq("instructor_id", user.id);

      if (!courses || courses.length === 0) {
        setTransactions([]);
        setTotalRevenue(0);
        setPendingRevenue(0);
        setUniqueStudentsCount(0);
        setLoading(false);
        return;
      }

      const courseIds = courses.map((c) => c.id);
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      // 3. Get order items for those courses
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, course_id")
        .in("course_id", courseIds);

      if (!orderItems || orderItems.length === 0) {
        setTransactions([]);
        setTotalRevenue(0);
        setPendingRevenue(0);
        setUniqueStudentsCount(0);
        setLoading(false);
        return;
      }

      const orderIds = orderItems.map((oi) => oi.order_id);
      const orderItemMap = new Map(orderItems.map((oi) => [oi.order_id, oi.course_id]));

      // 4. Get payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, order_id, amount, status, paid_at, user_id, provider")
        .in("order_id", orderIds);

      if (!payments || payments.length === 0) {
        setTransactions([]);
        setTotalRevenue(0);
        setPendingRevenue(0);
        setUniqueStudentsCount(0);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(payments.map((p) => p.user_id))];

      // 5. Get student names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      // 6. Map payments to LocalTransactions
      const mappedTransactions: LocalTransaction[] = payments.map((p) => {
        const courseId = orderItemMap.get(p.order_id) || "";
        const course = courseMap.get(courseId);
        const studentName = profileMap.get(p.user_id) || "Étudiant";
        
        let payMethod: string = p.provider || "STRIPE";
        if (payMethod === "MOBILE_MONEY") payMethod = "MoMo";
        
        return {
          id: p.id,
          orderId: p.order_id,
          courseId,
          courseTitle: course?.title || "Formation",
          userId: p.user_id,
          studentName,
          amount: p.amount || 0,
          method: payMethod,
          date: p.paid_at || new Date().toISOString(),
          status: p.status || "PAID",
        };
      });

      // Calculate totals
      const paidTx = mappedTransactions.filter((t) => normalizeStatus(t.status) === "PAID");
      const sumTotal = paidTx.reduce((acc, t) => acc + t.amount, 0);
      const sumPending = mappedTransactions
        .filter((t) => normalizeStatus(t.status) === "PENDING")
        .reduce((acc, t) => acc + t.amount, 0);

      setTransactions(mappedTransactions);
      setTotalRevenue(sumTotal);
      setPendingRevenue(sumPending);

      const uniqueSet = new Set(paidTx.map((t) => t.userId));
      setUniqueStudentsCount(uniqueSet.size);

    } catch (err) {
      console.error("Error fetching instructor earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const planConfig = PLAN_COMMISSION_CONFIG[instructorPlan] || PLAN_COMMISSION_CONFIG.FREE;
  const commissionRate = planConfig.commissionRate;
  const instructorShare = planConfig.instructorShare;

  const platformFee = totalRevenue * commissionRate;
  const netRevenue = totalRevenue * instructorShare;

  // Monthly revenue calculations
  const monthlyRevenue = months.map((_, monthIdx) => {
    return transactions
      .filter((t) => normalizeStatus(t.status) === "PAID" && new Date(t.date).getMonth() === monthIdx)
      .reduce((s, t) => s + (t.amount * instructorShare), 0);
  });
  const maxBar = Math.max(...monthlyRevenue, 1);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Revenus</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap text-sm">
            <span>Votre part instructeur :</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${planConfig.badgeColor}`}>
              <Crown className="w-3 h-3" />
              {instructorPlan} — {Math.round(instructorShare * 100)}% net
            </span>
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm cursor-pointer">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Commission Plan Card */}
      <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 dark:from-teal-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-teal-200/50 dark:border-teal-800/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-teal-200 dark:border-teal-800/30 shadow-sm">
            <BadgePercent className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              Plan {instructorPlan} — Commission plateforme : {Math.round(commissionRate * 100)}%
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Vous recevez <span className="font-bold text-teal-600">{Math.round(instructorShare * 100)}%</span> de chaque vente de vos cours. 
              {instructorPlan !== "MAX" && " Passez au plan supérieur pour réduire la commission."}
            </p>
          </div>
        </div>
        {instructorPlan !== "MAX" && (
          <a
            href="/instructor/billing"
            className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Upgrader mon plan
          </a>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Revenus bruts",
            value: `${totalRevenue.toLocaleString("fr-FR")} $`,
            icon: CircleDollarSign,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-900/20",
          },
          {
            label: `Commission (${Math.round(commissionRate * 100)}%)`,
            value: `−${platformFee.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} $`,
            icon: BadgePercent,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-900/20",
          },
          {
            label: `Revenus nets (${Math.round(instructorShare * 100)}%)`,
            value: `${netRevenue.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} $`,
            icon: Wallet,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "En attente",
            value: `${pendingRevenue.toLocaleString("fr-FR")} $`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
          },
          {
            label: "Apprenants payants",
            value: uniqueStudentsCount,
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
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
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Revenus nets mensuels ({new Date().getFullYear()})</h2>
          </div>
          <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full font-medium">
            {Math.round(instructorShare * 100)}% net
          </span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {months.map((month, i) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hidden sm:block">
                {monthlyRevenue[i] > 0 ? `${monthlyRevenue[i].toFixed(0)}$` : ""}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${
                  monthlyRevenue[i] > 0
                    ? "bg-gradient-to-t from-teal-700 to-teal-400"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
                style={{ height: monthlyRevenue[i] > 0 ? `${Math.max((monthlyRevenue[i] / maxBar) * 128, 4)}px` : "4px" }}
              />
              <span className="text-[10px] text-zinc-400">{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Paiements des apprenants</h2>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-full font-medium">
            {transactions.length} transaction{transactions.length > 1 ? "s" : ""}
          </span>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucune transaction pour l&apos;instant.</p>
            <p className="text-zinc-400 text-xs mt-1">Les paiements de vos apprenants apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Apprenant</th>
                  <th className="px-6 py-3">Cours</th>
                  <th className="px-6 py-3">Moyen</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Montant brut</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Votre part</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentTransactions.map((tx) => {
                  const fee = tx.amount * commissionRate;
                  const net = tx.amount * instructorShare;
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors text-sm text-zinc-900 dark:text-zinc-100">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {tx.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[120px]">{tx.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-650 dark:text-zinc-400 text-xs truncate max-w-[160px]">{tx.courseTitle}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{tx.method}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500 whitespace-nowrap">{new Date(tx.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-semibold text-red-500">
                        −${fee.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +${net.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          normalizeStatus(tx.status) === "PAID"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : normalizeStatus(tx.status) === "PENDING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {tx.status === "PAID" ? "Payé" : tx.status === "PENDING" ? "En attente" : "Échoué"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-950 dark:text-zinc-150">
                <tr className="text-sm font-bold">
                  <td colSpan={4} className="px-6 py-4">TOTAL</td>
                  <td className="px-6 py-4 text-right">${totalRevenue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-red-500">−${platformFee.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">${netRevenue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-zinc-400 font-medium">
                      {transactions.filter((tx) => normalizeStatus(tx.status) === "PAID").length} payé(s)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
