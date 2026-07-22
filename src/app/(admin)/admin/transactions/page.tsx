"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number; label: string }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80, label: "Free (20%)" },
  BASE: { commissionRate: 0.10, instructorShare: 0.90, label: "Base (10%)" },
  PRO: { commissionRate: 0.05, instructorShare: 0.95, label: "Pro (5%)" },
  MAX: { commissionRate: 0.00, instructorShare: 1.00, label: "Max (0%)" },
};

const planUuidMap: Record<string, string> = {
  "99999999-9999-9999-9999-999999990001": "Forfait Formateur BASE",
  "99999999-9999-9999-9999-999999990002": "Forfait Formateur PRO",
  "99999999-9999-9999-9999-999999990003": "Forfait Formateur MAX",
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
  siteAmount: number;
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("PAID"); // PAID by default
  const [pageSize, setPageSize] = useState<number>(25); // 25 by default
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchAdminTransactions = useCallback(async () => {
    if (transactions.length === 0) {
      setLoading(true);
    }
    try {
      // 1. Get all successful payments (filtering out FAILED and CANCELLED for clean accounting)
      const { data: payments } = await supabase
        .from("payments")
        .select("id, order_id, user_id, amount, status, provider, paid_at")
        .eq("status", "PAID")
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
        
        const planName = planUuidMap[courseId];
        
        let courseTitle = "";
        let commissionAmount = 0;
        let instructorShareAmount = 0;
        let siteAmount = 0;
        let instName = "N/A";
        let instPlan = "N/A";

        if (planName) {
          // It is a plan purchase -> 100% goes to site, commission is 0
          courseTitle = planName;
          commissionAmount = 0;
          instructorShareAmount = 0;
          siteAmount = p.amount || 0;
          
          instName = profile?.full_name || "Formateur";
          instPlan = planName.replace("Forfait Formateur ", "");
        } else {
          // It is a course purchase
          const courseInfo = courseMap.get(courseId);
          courseTitle = courseInfo?.title || "Abonnement ou Autre";
          const instructorId = courseInfo?.instructorId || "";
          const instructorInfo = instructorMap.get(instructorId);

          instName = instructorInfo?.name || "Formateur";
          instPlan = instructorInfo?.plan || "FREE";

          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
          commissionAmount = (p.amount || 0) * commConfig.commissionRate;
          instructorShareAmount = (p.amount || 0) * commConfig.instructorShare;
          siteAmount = commissionAmount; // Site share is just the commission
        }

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
          siteAmount,
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

  // Filtering Logic
  const filtered = transactions.filter((tx) => {
    // Status Filter
    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
    
    // Search Term Filter (Student Name/Email or Course Title)
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      tx.studentName.toLowerCase().includes(normalizedSearch) ||
      tx.studentEmail.toLowerCase().includes(normalizedSearch) ||
      tx.courseTitle.toLowerCase().includes(normalizedSearch) ||
      tx.instructorName.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTransactions = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Totals calculations
  const totalAmount = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const totalCommission = filtered.reduce((sum, tx) => sum + tx.commissionAmount, 0);
  const totalInstructorShare = filtered.reduce((sum, tx) => sum + tx.instructorShareAmount, 0);
  const totalSiteAmount = filtered.reduce((sum, tx) => sum + tx.siteAmount, 0);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize, searchTerm]);

  if (transactions.length === 0 && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            Suivi des Paiements
            {loading && <Loader2 className="w-5 h-5 text-teal-600 animate-spin shrink-0" />}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Historique en temps réel des transactions et répartition des commissions.
          </p>
        </div>
      </div>

      {/* Control Panel (Filters & Limits) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher étudiant, cours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-zinc-900 dark:text-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter tabs */}
          <div className="bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl flex">
            {[
              { id: "PAID", label: "Complétés" },
              { id: "PENDING", label: "En attente" },
              { id: "FAILED", label: "Échoués" },
              { id: "ALL", label: "Tous" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

          {/* Page size limit */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Afficher:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
            >
              <option value={25}>25 lignes</option>
              <option value={50}>50 lignes</option>
              <option value={100}>100 lignes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {paginatedTransactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              Aucune transaction trouvée avec les critères sélectionnés.
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-550 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Étudiant / Formateur</th>
                  <th className="px-6 py-4 font-bold">Formateur (Forfait)</th>
                  <th className="px-6 py-4 font-bold">Module / Cours</th>
                  <th className="px-6 py-4 font-bold">Montant</th>
                  <th className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">Com. Site</th>
                  <th className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">Montant Site</th>
                  <th className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">Part Prof</th>
                  <th className="px-6 py-4 font-bold">Méthode</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.orderId} className="text-zinc-900 dark:text-zinc-100 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-450">{tx.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{tx.studentName}</div>
                      <div className="text-xxs text-zinc-450 dark:text-zinc-400 font-medium">{tx.studentEmail}</div>
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
                    <td className="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-450">
                      {tx.siteAmount.toFixed(2)}$
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {tx.instructorShareAmount.toFixed(2)}$
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs">{tx.method}</td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(tx.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {tx.status === "PAID" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
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
              <tfoot>
                <tr className="bg-zinc-100/60 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-extrabold text-sm border-t-2 border-zinc-200 dark:border-zinc-800">
                  <td colSpan={4} className="px-6 py-4 text-right">TOTAL :</td>
                  <td className="px-6 py-4 text-teal-600">{totalAmount.toFixed(2)}$</td>
                  <td className="px-6 py-4 text-amber-650 dark:text-amber-500">{totalCommission.toFixed(2)}$</td>
                  <td className="px-6 py-4 text-blue-600 dark:text-blue-450">{totalSiteAmount.toFixed(2)}$</td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-450">{totalInstructorShare.toFixed(2)}$</td>
                  <td colSpan={3} className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-medium">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalItems)} sur {totalItems} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-800 dark:text-zinc-200 font-bold px-2">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
