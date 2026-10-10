"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Check, 
  X, 
  Copy, 
  CheckCheck,
  AlertTriangle,
  Smartphone,
  CreditCard,
  DollarSign,
  Coins,
  ShieldCheck,
  PhoneCall
} from "lucide-react";

interface AdminPayment {
  id: string;
  orderId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  provider: string;
  rawMethod: string;
  formattedMethod: string;
  paymentType: "MANUAL_MOMO" | "PAWAPAY_AUTO" | "PAYPAL" | "CRYPTO" | "CARD" | "OTHER";
  isManual: boolean;
  manualReference: string;
  failureReason: string | null;
  instructorName: string;
  instructorPlan: string;
  commissionAmount: number;
  instructorShareAmount: number;
  siteAmount: number;
  paidAt: string | null;
  createdAt: string;
  date: string;
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, paid: 0, failed: 0 });
  const [totals, setTotals] = useState({ pendingTotalAmount: 0, paidTotalAmount: 0 });

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Action Modals State
  const [actionPayment, setActionPayment] = useState<AdminPayment | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [actionNotes, setActionNotes] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Copied Reference State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const url = `/api/admin/payments?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de chargement des paiements");
      }

      setPayments(data.payments || []);
      if (data.counts) setCounts(data.counts);
      if (data.totals) setTotals(data.totals);
    } catch (err: any) {
      console.error("[AdminTransactions] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Auto-polling every 15 seconds to catch new manual payments
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPayments(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchPayments]);

  // Handle Approve or Reject
  const handleExecuteAction = async () => {
    if (!actionPayment || !actionType) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: actionPayment.id,
          action: actionType,
          notes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'opération");

      setActionMessage({
        type: "success",
        text: actionType === "APPROVE" 
          ? `Paiement #${actionPayment.id.slice(0, 8)} validé ! L'accès de l'apprenant a été activé.` 
          : `Paiement #${actionPayment.id.slice(0, 8)} rejeté.`,
      });

      // Close modal after brief delay and refresh table
      setTimeout(() => {
        setActionPayment(null);
        setActionType(null);
        setActionNotes("");
        setActionMessage(null);
      }, 1500);

      await fetchPayments(true);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Erreur lors de l'opération" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pagination Logic
  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPayments = payments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            Paiements & Transactions
            {refreshing && <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Gestion centralisée de tous les paiements automatiques (PawaPay, PayPal, Crypto) et manuels (Virements Mobile Money).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Paiements Validés</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totals.paidTotalAmount.toFixed(2)}
          </div>
          <span className="text-xxs text-zinc-500 font-medium">{counts.paid} transaction(s) complétée(s)</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
          counts.pending > 0 
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">En Attente de Validation</span>
            {counts.pending > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ${totals.pendingTotalAmount.toFixed(2)}
          </div>
          <span className="text-xxs font-bold text-amber-700 dark:text-amber-400">
            {counts.pending} virement(s) à approuver
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Rejetés / Échoués</span>
          <div className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">
            {counts.failed}
          </div>
          <span className="text-xxs text-zinc-500 font-medium">Transactions annulées</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Enregistré</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {counts.all}
          </div>
          <span className="text-xxs text-zinc-500 font-medium">Toutes méthodes confondues</span>
        </div>
      </div>

      {/* Control Panel: Filter Tabs & Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Tous ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "PENDING"
                  ? "bg-amber-500 text-white shadow-xs"
                  : counts.pending > 0
                  ? "text-amber-600 dark:text-amber-400 font-extrabold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <span>À Valider</span>
              {counts.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-black">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter("PAID"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Validés ({counts.paid})
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter("FAILED"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "FAILED"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Rejetés ({counts.failed})
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher étudiant, réf virement, cours..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-zinc-900 dark:text-white transition-all font-medium"
              />
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
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
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <span className="text-xs font-medium">Chargement des paiements...</span>
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Aucun paiement trouvé</p>
              <p className="text-xs text-zinc-400">
                {statusFilter === "PENDING"
                  ? "Aucun virement manuel en attente de validation pour le moment."
                  : "Aucune transaction ne correspond à vos filtres actuels."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Paiement / Réf. Virement</th>
                  <th className="px-5 py-3.5 font-bold">Apprenant / Contact</th>
                  <th className="px-5 py-3.5 font-bold">Formation / Forfait</th>
                  <th className="px-5 py-3.5 font-bold">Montant</th>
                  <th className="px-5 py-3.5 font-bold">Méthode</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 font-bold">Statut</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {paginatedPayments.map((tx) => {
                  const isPending = tx.status === "PENDING";
                  const isPaid = tx.status === "PAID";
                  const isFailed = tx.status === "FAILED" || tx.status === "CANCELLED";

                  return (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors ${
                        isPending 
                          ? "bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/70 dark:hover:bg-amber-950/20" 
                          : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      {/* ID & Reference */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-zinc-500 dark:text-zinc-400 text-xxs">
                          #{tx.id.slice(0, 8)}
                        </div>
                        {tx.manualReference ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <span>Réf:</span>
                              <span>{tx.manualReference}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tx.manualReference, tx.id)}
                              title="Copier la référence de virement"
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-sm"
                            >
                              {copiedId === tx.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xxs text-zinc-400 font-mono mt-0.5">
                            Ordre: #{tx.orderId?.slice(0, 8) || "N/A"}
                          </div>
                        )}
                      </td>

                      {/* Student info */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-white">{tx.studentName}</div>
                        <div className="text-zinc-400 text-xxs truncate max-w-[180px]">{tx.studentEmail}</div>
                        {tx.studentPhone && (
                          <div className="text-zinc-500 dark:text-zinc-400 text-xxs flex items-center gap-1 mt-0.5 font-mono">
                            <PhoneCall className="w-2.5 h-2.5 text-zinc-400" />
                            <span>{tx.studentPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Item */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 max-w-[200px] truncate" title={tx.courseTitle}>
                          {tx.courseTitle}
                        </div>
                        <div className="text-xxs text-zinc-400 mt-0.5">
                          Formateur : <span className="font-semibold text-zinc-600 dark:text-zinc-300">{tx.instructorName}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5">
                        <div className="font-black text-sm text-zinc-900 dark:text-white">
                          ${tx.amount.toFixed(2)}
                        </div>
                        <div className="text-xxs text-zinc-400 mt-0.5">
                          Com. site : <span className="font-semibold text-amber-600 dark:text-amber-400">${tx.commissionAmount.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {tx.paymentType === "MANUAL_MOMO" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                              <Smartphone className="w-3 h-3 text-blue-600" />
                              MoMo Manuel
                            </span>
                          ) : tx.paymentType === "PAWAPAY_AUTO" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-900/40">
                              <Smartphone className="w-3 h-3 text-teal-600" />
                              PawaPay Auto
                            </span>
                          ) : tx.paymentType === "PAYPAL" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40">
                              <DollarSign className="w-3 h-3 text-sky-600" />
                              PayPal
                            </span>
                          ) : tx.paymentType === "CRYPTO" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
                              <Coins className="w-3 h-3 text-purple-600" />
                              Crypto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              <CreditCard className="w-3 h-3" />
                              {tx.formattedMethod}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap text-xxs">
                        {new Date(tx.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Validé
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse">
                            <Clock className="w-3 h-3" />
                            En attente
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
                            <XCircle className="w-3 h-3" />
                            Rejeté
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActionPayment(tx);
                                setActionType("APPROVE");
                                setActionNotes("");
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xxs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3 h-3" />
                              <span>Valider</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActionPayment(tx);
                                setActionType("REJECT");
                                setActionNotes("");
                              }}
                              className="px-2 py-1.5 bg-zinc-200 hover:bg-red-600 hover:text-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-lg text-xxs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            >
                              <X className="w-3 h-3" />
                              <span>Rejeter</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xxs text-zinc-400 italic">Terminé</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-medium">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalItems)} sur {totalItems} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-800 dark:text-zinc-200 font-bold px-2">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for APPROVE / REJECT */}
      {actionPayment && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                actionType === "APPROVE" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              }`}>
                {actionType === "APPROVE" ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white">
                  {actionType === "APPROVE" ? "Valider le paiement manuel" : "Rejeter le paiement"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {actionType === "APPROVE" ? "Confirmation du virement et déblocage immédiat de l'accès" : "Annulation de la commande et notification à l'apprenant"}
                </p>
              </div>
            </div>

            {/* Recap Box */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Apprenant :</span>
                <span className="font-bold text-zinc-900 dark:text-white">{actionPayment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cours / Module :</span>
                <span className="font-bold text-zinc-900 dark:text-white max-w-[200px] truncate">{actionPayment.courseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Montant :</span>
                <span className="font-extrabold text-teal-600 dark:text-teal-400">${actionPayment.amount.toFixed(2)} USD</span>
              </div>
              {actionPayment.manualReference && (
                <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500">Référence Virement :</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">{actionPayment.manualReference}</span>
                </div>
              )}
              {actionPayment.studentPhone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Téléphone MoMo :</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{actionPayment.studentPhone}</span>
                </div>
              )}
            </div>

            {actionType === "REJECT" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-750 dark:text-zinc-300">
                  Motif du rejet (notifié à l'apprenant) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Référence introuvable sur le compte marchand"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            )}

            {actionMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                actionMessage.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}>
                {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setActionPayment(null);
                  setActionType(null);
                  setActionNotes("");
                  setActionMessage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  actionType === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                    : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                }`}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionType === "APPROVE" ? "Confirmer la validation" : "Confirmer le rejet"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
