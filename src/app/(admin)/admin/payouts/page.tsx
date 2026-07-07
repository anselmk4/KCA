"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getDB } from "@/lib/db";
import { 
  Coins, 
  Check, 
  X, 
  DollarSign, 
  Percent, 
  Calendar, 
  User, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

interface AdminPayoutItem {
  id: string;
  instructorId: string;
  instructorName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [platformCommissions, setPlatformCommissions] = useState(0);
  const [instructorShare, setInstructorShare] = useState(0);
  const [commissionRate, setCommissionRate] = useState(20); // Fallback commission rate
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PAID">("PENDING");

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch payouts from Supabase
      const { data: sbPayouts, error: payoutErr } = await supabase
        .from('payouts')
        .select('*');

      if (payoutErr) throw payoutErr;

      // 2. Fetch profiles for names and plans
      const { data: sbProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, plan');

      const profileMap = new Map<string, string>();
      const planMap = new Map<string, string>();
      
      sbProfiles?.forEach(p => {
        profileMap.set(p.id, p.full_name || 'Instructeur');
        planMap.set(p.id, p.plan || 'FREE');
      });

      // 3. Fetch all completed payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, order_id, amount, status, user_id')
        .eq('status', 'PAID');

      const payments = paymentsData || [];
      const orderIds = payments.map(p => p.order_id).filter(Boolean);

      // 4. Fetch order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, course_id')
        .in('order_id', orderIds);

      const orderItemMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);
      const courseIds = [...new Set(orderItems?.map(oi => oi.course_id) || [])];

      // 5. Fetch courses to identify instructor
      const { data: courses } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .in('id', courseIds);

      const courseMap = new Map(courses?.map(c => [c.id, c.instructor_id]) || []);

      // Plan configurations
      const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
        FREE: { commissionRate: 0.20, instructorShare: 0.80 },
        BASE: { commissionRate: 0.10, instructorShare: 0.90 },
        PRO: { commissionRate: 0.05, instructorShare: 0.95 },
        MAX: { commissionRate: 0.00, instructorShare: 1.00 },
      };

      const planUuidMap: Record<string, string> = {
        "99999999-9999-9999-9999-999999990001": "BASE",
        "99999999-9999-9999-9999-999999990002": "PRO",
        "99999999-9999-9999-9999-999999990003": "MAX",
      };

      let computedTotalSales = 0;
      let computedPlatformCommissions = 0;
      let computedInstructorShare = 0;

      payments.forEach(p => {
        const amount = p.amount || 0;
        computedTotalSales += amount;

        const courseId = orderItemMap.get(p.order_id) || "";
        
        // If it is a subscription plan payment, 100% of revenue goes to platform
        if (planUuidMap[courseId]) {
          computedPlatformCommissions += amount;
        } else {
          // It is a course purchase
          const instructorId = courseMap.get(courseId) || "";
          const instPlan = planMap.get(instructorId) || "FREE";
          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;

          computedPlatformCommissions += amount * commConfig.commissionRate;
          computedInstructorShare += amount * commConfig.instructorShare;
        }
      });

      setTotalSales(Math.round(computedTotalSales));
      setPlatformCommissions(Math.round(computedPlatformCommissions));
      setInstructorShare(Math.round(computedInstructorShare));

      const items: AdminPayoutItem[] = (sbPayouts || []).map((p: any) => ({
        id: p.id,
        instructorId: p.instructor_id,
        instructorName: profileMap.get(p.instructor_id) || 'Formateur Kuettu',
        amount: p.amount || 0,
        status: p.status || 'PENDING',
        createdAt: p.created_at || new Date().toISOString(),
      }));

      setPayouts(items);
    } catch (err: any) {
      console.error('[AdminPayouts] Error loading from Supabase:', err);
      // Fallback local db
      const db = getDB();
      const rev = db.transactions.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalSales(rev);
      setPlatformCommissions(Math.round(rev * 0.20));
      setInstructorShare(Math.round(rev * 0.80));
      
      // Fallback fake payouts
      setPayouts([
        {
          id: 'p_1',
          instructorId: 'u3',
          instructorName: 'Prof. Kuettu',
          amount: 150,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        {
          id: 'p_2',
          instructorId: 'u3',
          instructorName: 'Prof. Kuettu',
          amount: 320,
          status: 'PAID',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePayoutStatus = async (payoutId: string, nextStatus: AdminPayoutItem['status']) => {
    try {
      const { error } = await supabase
        .from('payouts')
        .update({ status: nextStatus })
        .eq('id', payoutId);

      if (error) throw error;

      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: nextStatus } : p));
      alert(`Demande de reversement mise à jour avec succès : ${nextStatus === 'PAID' ? 'Validée (Payée)' : 'Rejetée (Annulée)'}`);
    } catch (err: any) {
      console.error('Error updating payout status:', err.message);
      alert('Erreur lors de la validation du reversement : ' + err.message);
    }
  };

  const filtered = payouts.filter(p => {
    if (activeTab === "ALL") return true;
    return p.status === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Commissions & Reversements</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Suivez les commissions prélevées par la plateforme et versez les gains aux formateurs.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Platform Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Ventes globales (LMS)</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSales}$</h3>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
            <Percent className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Commissions de la plateforme</p>
              <span className="text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg font-bold">
                Par Plan
              </span>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{platformCommissions}$</h3>
          </div>
        </div>

        {/* Instructors Share */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Part théorique des Formateurs</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{instructorShare}$</h3>
          </div>
        </div>
      </div>

      {/* Commission Rates Config Card */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white">Configuration des Commissions par Forfait</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Les commissions sont prélevées dynamiquement selon le forfait d'abonnement actif du formateur lors de l'achat.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-150 dark:border-zinc-800 rounded-xl text-center">
            <span className="text-xxs font-bold text-zinc-400 uppercase block">Plan Free</span>
            <span className="text-lg font-extrabold text-zinc-800 dark:text-white">20%</span>
          </div>
          <div className="p-3 bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl text-center">
            <span className="text-xxs font-bold text-blue-500 dark:text-blue-400 uppercase block">Plan Base</span>
            <span className="text-lg font-extrabold text-blue-700 dark:text-blue-400">10%</span>
          </div>
          <div className="p-3 bg-teal-50/40 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/20 rounded-xl text-center">
            <span className="text-xxs font-bold text-teal-500 dark:text-teal-400 uppercase block">Plan Pro</span>
            <span className="text-lg font-extrabold text-teal-700 dark:text-teal-400">5%</span>
          </div>
          <div className="p-3 bg-amber-50/40 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl text-center">
            <span className="text-xxs font-bold text-amber-550 dark:text-amber-400 uppercase block">Plan Max</span>
            <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400">0%</span>
          </div>
        </div>
      </div>

      {/* Payout Requests Title */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Demandes de Reversement</h3>
          <div className="flex gap-2">
            {(["PENDING", "PAID", "ALL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/30"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {tab === "PENDING" ? "En attente ⏳" : tab === "PAID" ? "Payés" : "Tous"}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Chargement des demandes de reversements...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 dark:text-zinc-400">
              Aucune demande de reversement à afficher.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Formateur</th>
                    <th className="px-6 py-4 font-semibold">Date de Demande</th>
                    <th className="px-6 py-4 font-semibold">Montant à reverser</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {filtered.map((p) => (
                    <tr key={p.id} className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                          {p.instructorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{p.instructorName}</span>
                          <p className="text-[10px] text-zinc-400 font-mono">ID: {p.instructorId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        {p.amount}$
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'PAID'
                            ? "bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                            : p.status === 'PENDING'
                            ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                        }`}>
                          {p.status === 'PAID' ? 'Validé' : p.status === 'PENDING' ? 'En attente' : 'Annulé/Réfusé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdatePayoutStatus(p.id, 'PAID')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Valider le reversement"
                            >
                              <Check className="w-3 h-3" /> Payer
                            </button>
                            <button
                              onClick={() => handleUpdatePayoutStatus(p.id, 'CANCELLED')}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Rejeter le reversement"
                            >
                              <X className="w-3 h-3" /> Refuser
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">Aucune action requise</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
