"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { normalizeStatus } from "@/lib/statusHelpers";
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
  Calendar,
  ArrowUpRight,
  X,
  Phone,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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

interface LocalPayout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  payment_reference: string;
  notes: string | null;
}

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number; label: string; badgeColor: string }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80, label: "Gratuit (20% commission)", badgeColor: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-405" },
  BASE: { commissionRate: 0.10, instructorShare: 0.90, label: "Basique (10% commission)", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PRO: { commissionRate: 0.05, instructorShare: 0.95, label: "Pro (5% commission)", badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  MAX: { commissionRate: 0.00, instructorShare: 1.00, label: "Maximum (0% commission)", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function EarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [instructorPlan, setInstructorPlan] = useState<string>("FREE");
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [payouts, setPayouts] = useState<LocalPayout[]>([]);
  const [session, setSession] = useState<{ name: string; email: string; supabaseUrl?: string } | null>(null);
  const [hasServiceRole, setHasServiceRole] = useState(true);
  
  // Date filtering state
  const [filterType, setFilterType] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawCarrier, setWithdrawCarrier] = useState<string>("MPESA");
  const [withdrawPhone, setWithdrawPhone] = useState<string>("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit payout modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPayoutId, setEditPayoutId] = useState<string>("");
  const [editCarrier, setEditCarrier] = useState<string>("MPESA");
  const [editPhone, setEditPhone] = useState<string>("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEarningsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/instructor/earnings");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (rawProfile) {
        setSession({
          name: rawProfile.full_name || "Instructeur",
          email: rawProfile.email || user.email || "",
          supabaseUrl: data.supabaseUrl
        });
      } else {
        setSession({
          name: user.email?.split("@")[0] || "Instructeur",
          email: user.email || "",
          supabaseUrl: data.supabaseUrl
        });
      }

      setInstructorPlan(data.plan || "FREE");
      setTransactions(data.transactions || []);
      setPayouts(data.payouts || []);
      setHasServiceRole(data.hasServiceRole !== false);
    } catch (err) {
      console.error("Error fetching instructor earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const planConfig = PLAN_COMMISSION_CONFIG[instructorPlan] || PLAN_COMMISSION_CONFIG.FREE;
  const commissionRate = planConfig.commissionRate;
  const instructorShare = planConfig.instructorShare;

  // Filtered transactions for calculation
  const paidTransactions = useMemo(() => {
    return transactions.filter(t => normalizeStatus(t.status) === "PAID");
  }, [transactions]);

  // Total gross revenue
  const totalRevenue = useMemo(() => {
    return paidTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [paidTransactions]);

  const platformFee = totalRevenue * commissionRate;
  const netRevenue = totalRevenue * instructorShare;

  // Calculate pending revenue from orders that are still pending
  const pendingRevenue = useMemo(() => {
    return transactions
      .filter((t) => normalizeStatus(t.status) === "PENDING")
      .reduce((acc, t) => acc + t.amount, 0) * instructorShare;
  }, [transactions, instructorShare]);

  // Unique students count
  const uniqueStudentsCount = useMemo(() => {
    return new Set(paidTransactions.map((t) => t.userId)).size;
  }, [paidTransactions]);

  // Calculate total already paid or pending payouts
  const totalWithdrawnOrPending = useMemo(() => {
    return payouts
      .filter((p) => p.status === "PAID" || p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payouts]);

  // Available balance for withdrawal
  const availableBalance = useMemo(() => {
    return Math.max(netRevenue - totalWithdrawnOrPending, 0);
  }, [netRevenue, totalWithdrawnOrPending]);

  // Chart data aggregation based on selected filter
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();

    // Initialize labels
    if (filterType === "monthly") {
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      months.forEach(m => dataMap.set(m, 0));
      
      paidTransactions.forEach(t => {
        const d = new Date(t.date);
        const m = months[d.getMonth()];
        const net = t.amount * instructorShare;
        dataMap.set(m, (dataMap.get(m) || 0) + net);
      });
    } else if (filterType === "weekly") {
      // Last 8 weeks
      const now = new Date();
      const labels: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const label = `Sem -${i}`;
        labels.push(label);
        dataMap.set(label, 0);
      }
      
      paidTransactions.forEach(t => {
        const d = new Date(t.date);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = 7 - Math.floor(diffDays / 7);
        if (weekIndex >= 0 && weekIndex <= 7) {
          const label = `Sem -${7 - weekIndex}`;
          const net = t.amount * instructorShare;
          dataMap.set(label, (dataMap.get(label) || 0) + net);
        }
      });
    } else if (filterType === "daily") {
      // Last 7 days
      const labels: string[] = [];
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = `${days[d.getDay()]} ${d.getDate()}`;
        labels.push(label);
        dataMap.set(label, 0);
      }
      
      paidTransactions.forEach(t => {
        const d = new Date(t.date);
        const diffDays = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const label = `${days[d.getDay()]} ${d.getDate()}`;
          const net = t.amount * instructorShare;
          dataMap.set(label, (dataMap.get(label) || 0) + net);
        }
      });
    } else if (filterType === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Group by day for the selected range
      paidTransactions.forEach(t => {
        const d = new Date(t.date);
        if (d >= start && d <= end) {
          const label = `${d.getDate()}/${d.getMonth() + 1}`;
          const net = t.amount * instructorShare;
          dataMap.set(label, (dataMap.get(label) || 0) + net);
        }
      });
    }

    return Array.from(dataMap.entries()).map(([label, value]) => ({ label, value }));
  }, [paidTransactions, filterType, startDate, endDate, instructorShare]);

  const maxChartValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = "ID Transaction,Apprenant,Cours,Moyen de Paiement,Date,Montant Brut,Part Instructeur\n";
    const rows = transactions.map(t => {
      const fee = t.amount * commissionRate;
      const net = t.amount * instructorShare;
      return `"${t.id}","${t.studentName}","${t.courseTitle}","${t.method}","${new Date(t.date).toLocaleDateString("fr-FR")}","${t.amount.toFixed(2)}","${net.toFixed(2)}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenus_instructeur_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit withdrawal request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMessage(null);

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawMessage({ type: "error", text: "Veuillez entrer un montant valide supérieur à 0." });
      return;
    }

    if (amountNum > availableBalance) {
      setWithdrawMessage({ type: "error", text: `Le montant demandé dépasse votre solde disponible de ${availableBalance.toFixed(2)} $.` });
      return;
    }

    if (!withdrawPhone || withdrawPhone.length < 9) {
      setWithdrawMessage({ type: "error", text: "Veuillez entrer un numéro de téléphone valide." });
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const response = await fetch("/api/instructor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod: "MOBILE_MONEY",
          carrier: withdrawCarrier,
          phoneNumber: withdrawPhone
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Échec de l'enregistrement de la demande.");
      }

      setWithdrawMessage({ type: "success", text: "Votre demande de retrait a été enregistrée avec succès !" });
      setWithdrawAmount("");
      setWithdrawPhone("");
      
      // Reload earnings data to update the payouts list and balance
      fetchEarningsData();
      
      // Close modal after delay
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawMessage(null);
      }, 3000);

    } catch (err: any) {
      setWithdrawMessage({ type: "error", text: err.message || "Une erreur inattendue est survenue." });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Cancel withdrawal request
  const handleCancelPayout = async (payoutId: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette demande de retrait ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/instructor/payouts?id=${payoutId}`, {
        method: "DELETE",
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Échec de l'annulation.");
      }

      alert("Demande de retrait annulée avec succès !");
      fetchEarningsData();
    } catch (err: any) {
      alert(err.message || "Une erreur inattendue est survenue.");
    }
  };

  // Open edit modal
  const handleOpenEditModal = (payout: LocalPayout) => {
    setEditPayoutId(payout.id);
    const parts = payout.payment_reference.split(":");
    const carrier = parts[0]?.trim() || "MPESA";
    const phone = parts[1]?.trim() || "";
    setEditCarrier(carrier);
    setEditPhone(phone);
    setEditMessage(null);
    setIsEditModalOpen(true);
  };

  // Save modified withdrawal request
  const handleSaveEditPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMessage(null);

    if (!editPhone || editPhone.length < 9) {
      setEditMessage({ type: "error", text: "Veuillez entrer un numéro de téléphone valide." });
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await fetch("/api/instructor/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editPayoutId,
          carrier: editCarrier,
          phoneNumber: editPhone,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Échec de la modification.");
      }

      setEditMessage({ type: "success", text: "Vos coordonnées de retrait ont été modifiées avec succès !" });
      fetchEarningsData();
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditMessage(null);
      }, 2000);
    } catch (err: any) {
      setEditMessage({ type: "error", text: err.message || "Une erreur inattendue est survenue." });
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Revenus</h1>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Compte : <span className="font-bold text-zinc-900 dark:text-zinc-200">{session?.name}</span> ({session?.email})
            </p>
            {session?.supabaseUrl && (
              <p className="text-[10px] text-zinc-400 font-mono">
                DB: {session.supabaseUrl}
              </p>
            )}
            <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap text-sm">
              <span>Part instructeur :</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${planConfig.badgeColor}`}>
                <Crown className="w-3 h-3" />
                {instructorPlan} — {Math.round(instructorShare * 100)}% net
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={availableBalance <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-650 hover:bg-teal-500 disabled:bg-zinc-150 disabled:text-zinc-450 dark:disabled:bg-zinc-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-4 h-4" />
            Demander un retrait
          </button>
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Warning Alert if SUPABASE_SERVICE_ROLE_KEY is missing on production */}
      {!hasServiceRole && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Clé de service Supabase manquante (Vercel)</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
              La variable d&apos;environnement <code className="bg-amber-100 dark:bg-amber-955 px-1 py-0.5 rounded font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> n&apos;est pas configurée dans les paramètres de votre projet Vercel. 
              Par conséquent, les requêtes sur les achats des étudiants sont limitées par la sécurité RLS et retournent 0. 
              Veuillez ajouter cette clé dans votre console Vercel pour que le tableau de bord puisse charger toutes les transactions réelles.
            </p>
          </div>
        </div>
      )}

      {/* Commission Plan Card */}
      <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 dark:from-teal-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-teal-200/50 dark:border-teal-800/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-teal-200 dark:border-teal-800/30 shadow-sm">
            <BadgePercent className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white animate-pulse">
              Solde disponible pour retrait : <span className="text-teal-650 dark:text-teal-400 font-extrabold text-base">{availableBalance.toLocaleString("fr-FR")} $</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Revenus nets cumulés : {netRevenue.toFixed(2)}$ · Retraits effectués ou demandés : {totalWithdrawnOrPending.toFixed(2)}$
            </p>
          </div>
        </div>
        {instructorPlan !== "MAX" && (
          <a
            href="/instructor/billing"
            className="shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Réduire la commission
          </a>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Revenus bruts",
            value: `${totalRevenue.toLocaleString("fr-FR")} $`,
            icon: CircleDollarSign,
            color: "text-teal-650 dark:text-teal-400",
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
            label: `Revenus nets`,
            value: `${netRevenue.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} $`,
            icon: Wallet,
            color: "text-blue-650 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "En attente (Net)",
            value: `${pendingRevenue.toLocaleString("fr-FR")} $`,
            icon: Clock,
            color: "text-amber-650 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
          },
          {
            label: "Inscriptions payantes",
            value: uniqueStudentsCount,
            icon: Users,
            color: "text-emerald-600 dark:text-emerald-450",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart with controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-650" />
            <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Historique des gains nets</h2>
          </div>
          
          {/* Filter options */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["daily", "weekly", "monthly", "custom"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === type
                    ? "bg-zinc-900 text-white dark:bg-zinc-850"
                    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {type === "daily" ? "Journalier" : type === "weekly" ? "Hebdomadaire" : type === "monthly" ? "Mensuel" : "Tranche de dates"}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs */}
        {filterType === "custom" && (
          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Du</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Au</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* CSS Chart */}
        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-zinc-400 text-sm">
            Aucun gain net enregistré sur la période sélectionnée.
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40 pt-4">
            {chartData.map((dataPoint) => (
              <div key={dataPoint.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-bold text-teal-650 opacity-0 group-hover:opacity-100 transition-opacity">
                  {dataPoint.value.toFixed(0)}$
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    dataPoint.value > 0
                      ? "bg-gradient-to-t from-teal-700 to-teal-400 hover:from-teal-600 hover:to-teal-300"
                      : "bg-zinc-100 dark:bg-zinc-850"
                  }`}
                  style={{ height: dataPoint.value > 0 ? `${(dataPoint.value / maxChartValue) * 110 + 4}px` : "4px" }}
                />
                <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[50px]">{dataPoint.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout requests list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-855 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Historique des retraits</h2>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            {payouts.length} demande{payouts.length > 1 ? "s" : ""}
          </span>
        </div>
        
        {payouts.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-sm">
            Aucune demande de retrait effectuée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Méthode / Référence</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3 text-right">Montant</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")} à {new Date(p.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-950 dark:text-white text-sm">{p.payment_method}</div>
                      <div className="text-xs text-zinc-400 font-bold">{p.payment_reference}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{p.notes || "—"}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-zinc-900 dark:text-white">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : p.status === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : p.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {p.status === "PAID" ? "Validé" : p.status === "PENDING" ? "En attente" : p.status === "PROCESSING" ? "En cours" : p.status === "CANCELLED" ? "Annulé" : "Annulé / Échoué"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1 text-blue-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors cursor-pointer"
                            title="Modifier les coordonnées"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelPayout(p.id)}
                            className="p-1 text-red-655 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                            title="Annuler la demande"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-white text-base">Historique des ventes</h2>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            {transactions.length} transaction{transactions.length > 1 ? "s" : ""}
          </span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            Aucun paiement enregistré pour l&apos;instant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[750px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Apprenant</th>
                  <th className="px-6 py-3">Cours</th>
                  <th className="px-6 py-3">Méthode</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Montant brut</th>
                  <th className="px-6 py-3 text-right">Votre part ({Math.round(instructorShare * 100)}%)</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((tx) => {
                  const fee = tx.amount * commissionRate;
                  const net = tx.amount * instructorShare;
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">{tx.studentName}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500 truncate max-w-[200px]">{tx.courseTitle}</td>
                      <td className="px-6 py-4 text-xs text-zinc-550 font-bold">{tx.method}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-6 py-4 text-right">${tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-450 font-bold">+${net.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal CSS Overlay Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-650" />
                <h3 className="font-bold text-zinc-950 dark:text-white text-lg">Demande de Retrait</h3>
              </div>
              <button 
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setWithdrawMessage(null);
                }}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-655 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs text-zinc-655 dark:text-zinc-400 font-semibold">Disponible pour retrait</span>
                <span className="font-extrabold text-teal-655 dark:text-teal-400 text-lg">${availableBalance.toFixed(2)}</span>
              </div>

              {/* Status alerts */}
              {withdrawMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                  withdrawMessage.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250" 
                    : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-250"
                }`}>
                  {withdrawMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{withdrawMessage.text}</span>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Montant à retirer ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableBalance}
                  required
                  placeholder="Ex: 50"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-transparent transition-all"
                />
              </div>

              {/* Carrier selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Opérateur Mobile Money</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "MPESA", label: "M-Pesa" },
                    { id: "ORANGE", label: "Orange" },
                    { id: "AIRTEL", label: "Airtel" }
                  ].map((carrier) => (
                    <button
                      key={carrier.id}
                      type="button"
                      onClick={() => setWithdrawCarrier(carrier.id)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        withdrawCarrier === carrier.id
                          ? "border-teal-650 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-655 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {carrier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Numéro de téléphone du compte</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-zinc-400"><Phone className="w-4 h-4" /></span>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0820000000"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-655 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Le retrait sera envoyé directement vers ce numéro Mobile Money.</p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submittingWithdraw || availableBalance <= 0}
                className="w-full py-3.5 mt-4 bg-teal-655 hover:bg-teal-555 disabled:bg-zinc-150 disabled:text-zinc-455 dark:disabled:bg-zinc-800 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingWithdraw ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer le retrait
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payout CSS Overlay Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-650" />
                <h3 className="font-bold text-zinc-955 dark:text-white text-lg">Modifier les coordonnées</h3>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditMessage(null);
                }}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-655 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEditPayout} className="space-y-4">
              {/* Status alerts */}
              {editMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                  editMessage.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250" 
                    : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-250"
                }`}>
                  {editMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{editMessage.text}</span>
                </div>
              )}

              {/* Carrier selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Opérateur Mobile Money</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "MPESA", label: "M-Pesa" },
                    { id: "ORANGE", label: "Orange" },
                    { id: "AIRTEL", label: "Airtel" }
                  ].map((carrier) => (
                    <button
                      key={carrier.id}
                      type="button"
                      onClick={() => setEditCarrier(carrier.id)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        editCarrier === carrier.id
                          ? "border-teal-655 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-655 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {carrier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Numéro de téléphone du compte</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-zinc-400"><Phone className="w-4 h-4" /></span>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0820000000"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-655 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submittingEdit}
                className="w-full py-3.5 mt-4 bg-teal-655 hover:bg-teal-555 disabled:bg-zinc-150 disabled:text-zinc-455 dark:disabled:bg-zinc-800 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
