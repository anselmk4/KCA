"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number; label: string }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80, label: "Free (20%)" },
  BASE: { commissionRate: 0.10, instructorShare: 0.90, label: "Base (10%)" },
  PRO: { commissionRate: 0.05, instructorShare: 0.95, label: "Pro (5%)" },
  MAX: { commissionRate: 0.00, instructorShare: 1.00, label: "Max (0%)" },
};

interface AdminTransaction {
  id: string;
  orderId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  amount: number;
  method: string;
  date: string;
  status: string;
  instructorName: string;
  instructorPlan: string;
  commissionAmount: number;
  instructorShareAmount: number;
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);

  const fetchAdminTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, order_id, user_id, amount, status, provider, paid_at")
        .order("paid_at", { ascending: false });

      if (!payments || payments.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(payments.map((p) => p.user_id))];
      const orderIds = payments.map((p) => p.order_id);

      // 2. Get student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // 3. Get order items to find courses
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, course_id")
        .in("order_id", orderIds);

      const orderItemMap = new Map(orderItems?.map((oi) => [oi.order_id, oi.course_id]) || []);
      const courseIds = [...new Set(orderItems?.map((oi) => oi.course_id) || [])];

      // 4. Get courses titles and instructor IDs
      let courseMap = new Map<string, { title: string; instructorId: string }>();
      const instructorIds: string[] = [];
      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, instructor_id")
          .in("id", courseIds);
        if (courses) {
          courses.forEach((c) => {
            courseMap.set(c.id, { title: c.title, instructorId: c.instructor_id || "" });
            if (c.instructor_id) instructorIds.push(c.instructor_id);
          });
        }
      }

      // 5. Get instructor profiles to get their plan details
      let instructorMap = new Map<string, { name: string; plan: string }>();
      if (instructorIds.length > 0) {
        const { data: instProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, plan")
          .in("id", [...new Set(instructorIds)]);
        if (instProfiles) {
          instProfiles.forEach((p) => {
            instructorMap.set(p.id, { name: p.full_name || "Formateur", plan: p.plan || "FREE" });
          });
        }
      }

      // 6. Map everything to transaction list
      const mapped: AdminTransaction[] = payments.map((p) => {
        const profile = profileMap.get(p.user_id);
        const courseId = orderItemMap.get(p.order_id) || "";
        const courseInfo = courseMap.get(courseId);
        const courseTitle = courseInfo?.title || "Abonnement ou Autre";
        const instructorId = courseInfo?.instructorId || "";
        const instructorInfo = instructorMap.get(instructorId);

        const instName = instructorInfo?.name || "Formateur";
        const instPlan = instructorInfo?.plan || "FREE";

        const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
        const commissionAmount = (p.amount || 0) * commConfig.commissionRate;
        const instructorShareAmount = (p.amount || 0) * commConfig.instructorShare;

        let payMethod: string = p.provider || "STRIPE";
        if (payMethod === "MOBILE_MONEY") payMethod = "MoMo";

        return {
          id: p.id.substring(0, 8) + "...",
          orderId: p.order_id,
          studentName: profile?.full_name || "Étudiant",
          studentEmail: profile?.email || "Non renseigné",
          courseTitle,
          amount: p.amount || 0,
          method: payMethod,
          date: p.paid_at || new Date().toISOString(),
          status: p.status || "PAID",
          instructorName: instName,
          instructorPlan: instPlan,
          commissionAmount,
          instructorShareAmount,
        };
      });

      setTransactions(mapped);
    } catch (err) {
      console.error("Error fetching admin transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminTransactions();
  }, [fetchAdminTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Suivi des Paiements</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Historique en temps réel des transactions et répartition des commissions.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              Aucune transaction n&apos;a été effectuée pour le moment.
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-550 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Étudiant</th>
                  <th className="px-6 py-4 font-bold">Formateur (Forfait)</th>
                  <th className="px-6 py-4 font-bold">Module / Cours</th>
                  <th className="px-6 py-4 font-bold">Montant</th>
                  <th className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">Com. Site</th>
                  <th className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">Part Prof</th>
                  <th className="px-6 py-4 font-bold">Méthode</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {transactions.map((tx) => (
                  <tr key={tx.orderId} className="text-zinc-900 dark:text-zinc-100 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-450">{tx.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{tx.studentName}</div>
                      <div className="text-xxs text-zinc-400 font-medium">{tx.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{tx.instructorName}</div>
                      <div className="text-xxs font-bold uppercase text-amber-500">{tx.instructorPlan}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{tx.courseTitle}</td>
                    <td className="px-6 py-4 font-extrabold text-teal-600">{tx.amount}$</td>
                    <td className="px-6 py-4 font-extrabold text-amber-650 dark:text-amber-500">
                      {tx.commissionAmount.toFixed(2)}$
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {tx.instructorShareAmount.toFixed(2)}$
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs">{tx.method}</td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(tx.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {tx.status === "PAID" && <CheckCircle2 className="w-4 h-4 text-green-500 animate-pulse" />}
                        {tx.status === "FAILED" && <XCircle className="w-4 h-4 text-red-500" />}
                        {tx.status === "PENDING" && <Clock className="w-4 h-4 text-orange-500" />}
                        <span className={`font-semibold text-xs ${
                          tx.status === 'PAID' ? 'text-green-600 dark:text-green-400' :
                          tx.status === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {tx.status === 'PAID' ? 'Complété' : tx.status === 'FAILED' ? 'Échoué' : 'En attente'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
