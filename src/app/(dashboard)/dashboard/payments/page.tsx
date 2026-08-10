"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  CreditCard, Download, ArrowRight, Calendar, Receipt, User, Loader2,
  CheckCircle2, AlertCircle, Clock, ShieldCheck, DollarSign, Smartphone, Wallet
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface DisplayTransaction {
  id: string;
  orderId: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  amount: number;
  totalCoursePrice: number;
  totalPaidForCourse: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  isInstallmentCourse: boolean;
  totalInstallments: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  method: string;
  rawProvider: string;
  rawMethod: string;
  date: string;
}

export default function StudentPaymentsPage() {
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [userName, setUserName] = useState<string>("Apprenant");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadPaymentsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      const res = await fetch("/api/payments");
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("[StudentPaymentsPage] Error loading data from API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  // Overall calculations
  const cumulativePaid = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // Group by course to calculate distinct remaining balances
  const courseSummaryMap = useMemo(() => {
    const map = new Map<string, { title: string; coursePrice: number; totalPaid: number; remaining: number; isInstallment: boolean; totalTranches: number; paidTranches: number }>();
    transactions.forEach((tx) => {
      if (tx.courseId && !map.has(tx.courseId)) {
        map.set(tx.courseId, {
          title: tx.courseTitle,
          coursePrice: tx.totalCoursePrice,
          totalPaid: tx.totalPaidForCourse,
          remaining: tx.remainingAmount,
          isInstallment: tx.isInstallmentCourse,
          totalTranches: tx.totalInstallments,
          paidTranches: tx.paidInstallmentsCount,
        });
      }
    });
    return map;
  }, [transactions]);

  const totalRemainingBalance = useMemo(() => {
    let sum = 0;
    courseSummaryMap.forEach((c) => {
      sum += c.remaining;
    });
    return sum;
  }, [courseSummaryMap]);

  const activeInstallmentCoursesCount = useMemo(() => {
    let count = 0;
    courseSummaryMap.forEach((c) => {
      if (c.remaining > 0) count++;
    });
    return count;
  }, [courseSummaryMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-xs font-semibold text-zinc-500">Chargement de votre historique de paiement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Historique & Suivi des Paiements</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Consultez le détail de vos règlements, le solde des tranches restantes et téléchargez vos factures.
          </p>
        </div>
      </div>

      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Paid KPI */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Réglé</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">${cumulativePaid} <span className="text-xs font-normal text-zinc-400">USD</span></p>
          <p className="text-xxs text-zinc-400 font-medium">Cumul de l&apos;ensemble de vos versements validés</p>
        </div>

        {/* Remaining Balance KPI */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-2 transition-all ${
          totalRemainingBalance > 0 
            ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40" 
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Solde Restant à Payer</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">${totalRemainingBalance} <span className="text-xs font-normal text-amber-500/80">USD</span></p>
          <p className="text-xxs text-amber-700/80 dark:text-amber-400/80 font-medium">
            {totalRemainingBalance > 0 
              ? `${activeInstallmentCoursesCount} cours avec tranches en attente` 
              : "Tous vos cours sont intégralement réglés !"}
          </p>
        </div>

        {/* Active Installments Count KPI */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Plan Tranches Actifs</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{activeInstallmentCoursesCount}</p>
          <p className="text-xxs text-zinc-400 font-medium">Formations payées en plusieurs tranches</p>
        </div>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Detailed Transactions Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10 flex items-center justify-between">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-white">Historique détaillé des transactions</h2>
              <span className="text-xs font-medium text-zinc-400">{transactions.length} paiement(s)</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 space-y-3">
                <Receipt className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium">Aucun paiement trouvé dans votre historique.</p>
                <Link href="/dashboard/discover" className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-bold hover:underline">
                  Acheter une formation <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Formation</th>
                      <th className="px-5 py-3.5">Moyen de Paiement</th>
                      <th className="px-5 py-3.5">Statut Tranche</th>
                      <th className="px-5 py-3.5 text-right">Montant Versé</th>
                      <th className="px-5 py-3.5 text-center">Facture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        
                        {/* Course & Instructor */}
                        <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white max-w-[220px]">
                          <p className="truncate text-xs font-bold" title={tx.courseTitle}>{tx.courseTitle}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <User className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate" title={tx.instructorName}>
                              {tx.instructorName}
                            </span>
                          </div>
                        </td>

                        {/* Payment Method Details */}
                        <td className="px-5 py-4 text-xs text-zinc-500">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{tx.method}</span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              {new Date(tx.date).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </td>

                        {/* Installments & Remaining status */}
                        <td className="px-5 py-4">
                          {tx.isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                              <CheckCircle2 className="w-3 h-3" /> Payé intégralement
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                Tranche payée (${tx.amount})
                              </span>
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Reste : <strong className="font-bold">${tx.remainingAmount} USD</strong>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Amount paid in this transaction */}
                        <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">
                          ${tx.amount} <span className="text-[10px] font-normal text-zinc-400">USD</span>
                        </td>

                        {/* Download Invoice */}
                        <td className="px-5 py-4 text-center">
                          <a
                            href={`/api/payments/invoice/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Télécharger la facture"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Banner: Explore catalog */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Découvrez nos parcours certifiants</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Élargissez vos compétences en Blockchain, IA et Finance Décentralisée.</p>
            </div>
            <Link href="/dashboard/discover" className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 shrink-0">
              Catalogue de formations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Installments Balance Summary & Quick Action Card */}
        <div className="space-y-6">
          
          {/* Courses with Pending Balance */}
          {Array.from(courseSummaryMap.values()).some(c => c.remaining > 0) && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 rounded-2xl border border-amber-300 dark:border-amber-900/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Tranches à Régler</h3>
              </div>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                Réglez vos tranches suivantes pour maintenir un accès ininterrompu à vos modules de cours.
              </p>
              
              <div className="space-y-3 pt-2">
                {Array.from(courseSummaryMap.entries())
                  .filter(([_, c]) => c.remaining > 0)
                  .map(([cId, c]) => (
                    <div key={cId} className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[170px]" title={c.title}>{c.title}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">${c.remaining} USD</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Progression paiement :</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">${c.totalPaid} / ${c.coursePrice}</span>
                      </div>
                      <Link 
                        href={`/dashboard/payment/${cId}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs mt-1"
                      >
                        Payer la tranche suivante <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Account Summary & Verification */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-6 space-y-5">
            <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">Résumé de votre compte</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Apprenant :</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{userName}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Réglement(s) en ligne :</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{transactions.length}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Total investi :</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${cumulativePaid} USD</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-150 dark:border-zinc-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xxs text-zinc-400 leading-normal">
                Vos reçus et factures sont téléchargeables au format officiel conforme aux normes fiscales.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
