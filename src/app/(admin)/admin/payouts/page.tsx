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
  AlertCircle,
  Send,
  Smartphone,
  Globe,
  Phone,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import { PAWAPAY_COUNTRY_MAPPING } from "@/lib/pawapay";

interface AdminPayoutItem {
  id: string;
  instructorId: string;
  instructorName: string;
  amount: number;
  currency?: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  paymentReference?: string;
  createdAt: string;
  notes?: string;
}

interface FundSourceItem {
  id: string;
  date: string;
  type: 'COURSE_SALE' | 'PLAN_SALE' | 'DIGITAL_PRODUCT_SALE';
  itemName: string;
  sourceName: string;
  amount: number;
  siteShare: number;
  instructorShare: number;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [platformCommissions, setPlatformCommissions] = useState(0);
  const [instructorShare, setInstructorShare] = useState(0);
  const [courseCommissions, setCourseCommissions] = useState(0);
  const [planSales, setPlanSales] = useState(0);
  const [fundSources, setFundSources] = useState<FundSourceItem[]>([]);
  const [commissionRate, setCommissionRate] = useState(20); // Fallback commission rate
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PAID" | "FAILED">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Direct PawaPay Withdrawal Form State
  const [instructorsList, setInstructorsList] = useState<{ id: string; name: string }[]>([]);
  const [directMode, setDirectMode] = useState<"API" | "MANUAL">("API");
  const [directEnvironment, setDirectEnvironment] = useState<"production" | "sandbox">("production");
  const [directCountry, setDirectCountry] = useState<string>("SN"); // Default to SN
  const [directCarrier, setDirectCarrier] = useState<string>("ORANGE_SEN");
  const [directCurrency, setDirectCurrency] = useState<"USD" | "CDF">("CDF");
  const [directPhone, setDirectPhone] = useState<string>("");
  const [directAmount, setDirectAmount] = useState<string>("");
  const [directDescription, setDirectDescription] = useState<string>("");
  const [directManualRef, setDirectManualRef] = useState<string>("");
  const [directInstructorId, setDirectInstructorId] = useState<string>("");
  const [submittingDirect, setSubmittingDirect] = useState<boolean>(false);
  const [directMessage, setDirectMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [suggestedCarrier, setSuggestedCarrier] = useState<string | null>(null);
  const [canRecordManually, setCanRecordManually] = useState<boolean>(false);

  // Accounting States
  const [totalPaidPayouts, setTotalPaidPayouts] = useState<number>(0);
  const [remainingInstructorBalance, setRemainingInstructorBalance] = useState<number>(0);

  const selectedCountryConfig = PAWAPAY_COUNTRY_MAPPING.find(c => c.countryCode === directCountry) || PAWAPAY_COUNTRY_MAPPING[0];

  const handleCountryChange = (countryCode: string) => {
    setDirectCountry(countryCode);
    setSuggestedCarrier(null);
    setCanRecordManually(false);
    const cfg = PAWAPAY_COUNTRY_MAPPING.find(c => c.countryCode === countryCode);
    if (cfg && cfg.operators.length > 0) {
      setDirectCarrier(cfg.operators[0].id);
    }
  };

  const handleDirectPayoutSubmit = async (e?: React.FormEvent, forceManual = false, overrideCarrier?: string) => {
    if (e) e.preventDefault();
    setDirectMessage(null);

    const amountNum = parseFloat(directAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setDirectMessage({ type: "error", text: "Veuillez entrer un montant valide supérieur à 0." });
      return;
    }

    const cleanDigits = directPhone.replace(/\D/g, "").replace(/^0+/, "");
    if (!cleanDigits || cleanDigits.length < 6) {
      setDirectMessage({ type: "error", text: "Veuillez entrer un numéro de téléphone Mobile Money valide." });
      return;
    }

    const isManual = forceManual || directMode === "MANUAL";
    const carrierToUse = overrideCarrier || directCarrier;

    setSubmittingDirect(true);
    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isManual ? "direct_manual_payout" : "direct_payout",
          isManual,
          manualRef: directManualRef || undefined,
          country: directCountry,
          carrier: carrierToUse,
          currency: directCountry === "CD" ? directCurrency : selectedCountryConfig.currency,
          phoneNumber: directPhone,
          amount: amountNum,
          statementDescription: directDescription || (isManual ? `Retrait Direct Manuel (${carrierToUse})` : "Retrait Direct Admin PawaPay"),
          instructorId: directInstructorId || undefined,
          environment: directEnvironment
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.suggestedCarrier) {
          setSuggestedCarrier(data.suggestedCarrier);
        }
        if (data.canRecordManually) {
          setCanRecordManually(true);
        }
        throw new Error(data.error || "Échec de l'envoi du versement PawaPay.");
      }

      setDirectMessage({ type: "success", text: data.message || "Versement enregistré avec succès !" });
      setSuggestedCarrier(null);
      setCanRecordManually(false);
      setDirectPhone("");
      setDirectAmount("");
      setDirectDescription("");
      setDirectManualRef("");
      
      // Refresh payouts list & dashboard stats
      loadData();
    } catch (err: any) {
      setDirectMessage({ type: "error", text: err.message || "Une erreur est survenue lors de l'envoi." });
    } finally {
      setSubmittingDirect(false);
    }
  };

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
        .select('id, full_name, plan, email');

      const profileMap = new Map<string, string>();
      const planMap = new Map<string, string>();
      const instList: { id: string; name: string }[] = [];
      
      sbProfiles?.forEach(p => {
        const name = p.full_name || p.email || 'Instructeur';
        profileMap.set(p.id, name);
        planMap.set(p.id, p.plan || 'FREE');
        instList.push({ id: p.id, name });
      });

      setInstructorsList(instList);

      // 3. Fetch all completed payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, order_id, amount, status, user_id, paid_at')
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
        .select('id, title, instructor_id')
        .in('id', courseIds);

      const courseInstructorMap = new Map(courses?.map(c => [c.id, c.instructor_id]) || []);
      const courseTitleMap = new Map(courses?.map(c => [c.id, c.title]) || []);

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
      let computedCourseCommissions = 0;
      let computedPlanSales = 0;
      const computedSources: FundSourceItem[] = [];

      payments.forEach(p => {
        const amount = p.amount || 0;
        computedTotalSales += amount;

        const studentProfile = profileMap.get(p.user_id) || 'Étudiant';
        const courseId = orderItemMap.get(p.order_id) || "";
        
        const planName = planUuidMap[courseId];
        // If it is a subscription plan payment, 100% of revenue goes to platform, commissions 0
        if (planName) {
          computedPlatformCommissions += amount;
          computedPlanSales += amount;

          computedSources.push({
            id: p.id,
            date: p.paid_at || new Date().toISOString(),
            type: 'PLAN_SALE',
            itemName: `Forfait Formateur ${planName}`,
            sourceName: `${studentProfile} (Formateur)`,
            amount,
            siteShare: amount,
            instructorShare: 0
          });
        } else {
          // It is a course purchase
          const instructorId = courseInstructorMap.get(courseId) || "";
          const instPlan = planMap.get(instructorId) || "FREE";
          const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;

          const siteShare = amount * commConfig.commissionRate;
          const instShare = amount * commConfig.instructorShare;

          computedPlatformCommissions += siteShare;
          computedCourseCommissions += siteShare;
          computedInstructorShare += instShare;

          computedSources.push({
            id: p.id,
            date: p.paid_at || new Date().toISOString(),
            type: 'COURSE_SALE',
            itemName: courseTitleMap.get(courseId) || 'Cours inconnu',
            sourceName: `${studentProfile} (Étudiant)`,
            amount,
            siteShare,
            instructorShare: instShare
          });
        }
      });

      // 4b. Fetch and process completed digital product purchases
      try {
        const { data: dpPurchases } = await supabase
          .from('digital_product_purchases')
          .select('id, product_id, user_id, price_paid, created_at, payment_status')
          .eq('payment_status', 'COMPLETED');

        if (dpPurchases && dpPurchases.length > 0) {
          const dpIds: string[] = [
            ...new Set(
              dpPurchases
                .map((dp: any) => dp.product_id)
                .filter((id: any): id is string => Boolean(id))
            ),
          ];
          const { data: dpProducts } = await (supabase as any)
            .from('digital_products')
            .select('id, title, author_id')
            .in('id', dpIds);

          const dpProductMap = new Map<string, any>(
            ((dpProducts as any[]) || []).map((p: any) => [p.id, p])
          );

          dpPurchases.forEach((dp: any) => {
            const amount = Number(dp.price_paid) || 0;
            computedTotalSales += amount;

            const product: any = dpProductMap.get(dp.product_id);
            const authorId: string = product?.author_id || "";
            const instPlan = planMap.get(authorId) || "FREE";
            const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;

            const siteShare = amount * commConfig.commissionRate;
            const instShare = amount * commConfig.instructorShare;

            computedPlatformCommissions += siteShare;
            computedCourseCommissions += siteShare;
            computedInstructorShare += instShare;

            const buyerName = profileMap.get(dp.user_id) || "Client Acheteur";

            computedSources.push({
              id: dp.id,
              date: dp.created_at || new Date().toISOString(),
              type: 'DIGITAL_PRODUCT_SALE',
              itemName: product?.title || 'Produit Digital / E-book',
              sourceName: `${buyerName} (Client)`,
              amount,
              siteShare,
              instructorShare: instShare
            });
          });
        }
      } catch (dpErr) {
        console.warn("[AdminPayouts] digital_product_purchases load note:", dpErr);
      }

      setTotalSales(Math.round(computedTotalSales));
      setPlatformCommissions(Math.round(computedPlatformCommissions));
      setInstructorShare(Math.round(computedInstructorShare));
      setCourseCommissions(Math.round(computedCourseCommissions));
      setPlanSales(Math.round(computedPlanSales));
      setFundSources(computedSources.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const items: AdminPayoutItem[] = (sbPayouts || []).map((p: any) => ({
        id: p.id,
        instructorId: p.instructor_id,
        instructorName: profileMap.get(p.instructor_id) || 'Formateur Kuettu',
        amount: p.amount || 0,
        currency: p.currency || (p.payment_reference?.includes("CDF") || p.notes?.includes("CDF") || p.notes?.includes("Wallet CDF") ? "CDF" : "USD"),
        status: p.status || 'PENDING',
        paymentReference: p.payment_reference || '',
        createdAt: p.created_at || new Date().toISOString(),
        notes: p.notes || '',
      }));

      setPayouts(items);

      // Compute total paid payouts and remaining instructor balance
      const totalPaid = items.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
      setTotalPaidPayouts(Math.round(totalPaid));
      setRemainingInstructorBalance(Math.max(0, Math.round(computedInstructorShare - totalPaid)));
    } catch (err: any) {
      console.error('[AdminPayouts] Error loading from Supabase:', err);
      // Fallback local db
      const db = getDB();
      const rev = db.transactions.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalSales(rev);
      setPlatformCommissions(Math.round(rev * 0.20));
      setInstructorShare(Math.round(rev * 0.80));
      setCourseCommissions(Math.round(rev * 0.20));
      setPlanSales(0);
      setFundSources([]);
      
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

  const handleUpdatePayoutStatus = async (
    payoutId: string, 
    nextStatus: AdminPayoutItem['status'],
    customAction?: 'accept' | 'manual_accept' | 'reject'
  ) => {
    if (processingId) return;

    let reason: string | null = null;
    if (customAction === 'reject' || (nextStatus === 'CANCELLED' && !customAction)) {
      reason = prompt(
        "Veuillez spécifier la raison du rejet (le formateur sera notifié par e-mail et notification in-app) :",
        "Coordonnées Mobile Money non conformes ou erronées"
      );
      if (reason === null) return; // User cancelled prompt
    }

    setProcessingId(payoutId);
    try {
      const action = customAction || (nextStatus === 'PAID' ? 'accept' : 'reject');
      
      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action, reason })
      });

      const data = await response.json();

      // Update state with returned status and notes (e.g. FAILED with PawaPay error message)
      setPayouts(prev => prev.map(p => p.id === payoutId ? { 
        ...p, 
        status: data.status || (response.ok ? nextStatus : 'FAILED'),
        notes: data.notes || p.notes
      } : p));

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors du traitement du reversement.');
      }

      alert(`Demande de reversement traitée avec succès : ${data.status === 'PAID' ? 'Validée (Payée)' : 'Mise à jour'}`);
    } catch (err: any) {
      console.error('Error updating payout status:', err.message);
      alert('Échec de l\'opération : ' + err.message);
    } finally {
      setProcessingId(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Platform Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Ventes globales (LMS)</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSales}$</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">
              {totalSales - planSales}$ cours + {planSales}$ plans
            </p>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
            <Percent className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fonds net du site</p>
              <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-bold">
                Site Share
              </span>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{platformCommissions}$</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">
              {courseCommissions}$ com. + {planSales}$ plans
            </p>
          </div>
        </div>

        {/* Instructors Share */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Gains Formateurs</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{instructorShare}$</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">
              Part totale générée
            </p>
          </div>
        </div>

        {/* Payouts & Balance */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600">
            <Coins className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Versements</p>
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-bold">
                Payés
              </span>
            </div>
            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{totalPaidPayouts}$</h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              {remainingInstructorBalance}$ restant à reverser
            </p>
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
            <span className="text-xxs font-bold text-blue-500 dark:text-blue-450 uppercase block">Plan Base</span>
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

      {/* Provenance des Fonds Table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Provenance et Origine des Fonds</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Détail de l&apos;origine de chaque transaction complétée (cours vendus ou abonnements de formateurs).
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-550 dark:text-zinc-400 text-sm">Chargement du détail de provenance des fonds...</p>
            </div>
          ) : fundSources.length === 0 ? (
            <div className="p-12 text-center text-zinc-550 dark:text-zinc-400 font-semibold">
              Aucune transaction financière enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Article / Description</th>
                    <th className="px-6 py-3 font-semibold">Provenance (Auteur)</th>
                    <th className="px-6 py-3 font-semibold">Montant Total</th>
                    <th className="px-6 py-3 font-semibold text-blue-600 dark:text-blue-400">Part Site</th>
                    <th className="px-6 py-3 font-semibold text-emerald-600 dark:text-emerald-400">Part Formateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {fundSources.map((fs) => (
                    <tr key={fs.id} className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(fs.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                          fs.type === 'PLAN_SALE'
                            ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                            : fs.type === 'DIGITAL_PRODUCT_SALE'
                            ? "bg-teal-100 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
                            : "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                        }`}>
                          {fs.type === 'PLAN_SALE' ? "Abonnement Prof" : fs.type === 'DIGITAL_PRODUCT_SALE' ? "Produit Digital" : "Vente Cours"}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium truncate max-w-[200px]">{fs.itemName}</td>
                      <td className="px-6 py-3 text-xs text-zinc-550 dark:text-zinc-400 whitespace-nowrap">{fs.sourceName}</td>
                      <td className="px-6 py-3 font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">{fs.amount.toFixed(2)}$</td>
                      <td className="px-6 py-3 font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">+{fs.siteShare.toFixed(2)}$</td>
                      <td className="px-6 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {fs.instructorShare > 0 ? `+${fs.instructorShare.toFixed(2)}$` : '0.00$'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payout Requests Title & Option Retrait Direct PawaPay */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Demandes de Reversement</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez les demandes de retrait soumises par les formateurs ou effectuez un virement direct vers n&apos;importe quel réseau Mobile Money.
          </p>
        </div>

        {/* Formulaire de Retrait Direct PawaPay */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-2xl text-teal-400">
                <Send className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white">Retrait Direct (Wave, Orange, Mobile Money)</h4>
                  <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {directMode === "API" ? "API PawaPay" : "Enregistrement Manuel"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Effectuez un transfert immédiat vers Wave ou Orange Sénégal, ou enregistrez un versement effectué manuellement.
                </p>
              </div>
            </div>

            {/* Mode & Gateway Environment Selector Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {directMode === "API" && (
                <div className="flex items-center gap-1.5 bg-zinc-800/90 px-3 py-1.5 rounded-xl border border-zinc-700/60 text-xs">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Passerelle :</span>
                  <select
                    value={directEnvironment}
                    onChange={(e) => setDirectEnvironment(e.target.value as "production" | "sandbox")}
                    className="bg-transparent font-extrabold text-xs text-emerald-400 focus:outline-none cursor-pointer"
                  >
                    <option value="production" className="bg-zinc-800 text-emerald-400 font-bold">🟢 Production (api.pawapay.io)</option>
                    <option value="sandbox" className="bg-zinc-800 text-amber-400 font-bold">🟡 Sandbox Test (api.sandbox.pawapay.io)</option>
                  </select>
                </div>
              )}

              {/* Mode Selector Toggle */}
              <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-2xl border border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => { setDirectMode("API"); setDirectMessage(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    directMode === "API"
                      ? "bg-teal-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  API PawaPay
                </button>
                <button
                  type="button"
                  onClick={() => { setDirectMode("MANUAL"); setDirectMessage(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    directMode === "MANUAL"
                      ? "bg-teal-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Manuel (Wave / Orange)
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => handleDirectPayoutSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* 1. Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" /> Pays de destination
                </label>
                <select
                  value={directCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                  {PAWAPAY_COUNTRY_MAPPING.map((cfg) => {
                    const flag = cfg.countryCode === "CD" ? "🇨🇩" : cfg.countryCode === "CM" ? "🇨🇲" : cfg.countryCode === "CI" ? "🇨🇮" : cfg.countryCode === "SN" ? "🇸🇳" : cfg.countryCode === "RW" ? "🇷🇼" : cfg.countryCode === "UG" ? "🇺🇬" : cfg.countryCode === "ZM" ? "🇿🇲" : "🇧🇯";
                    return (
                      <option key={cfg.countryCode} value={cfg.countryCode}>
                        {flag} {cfg.names[0].toUpperCase()} (+{cfg.phonePrefix})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Currency Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-teal-400" /> Devise de versement
                </label>
                {directCountry === "CD" ? (
                  <select
                    value={directCurrency}
                    onChange={(e) => setDirectCurrency(e.target.value as "USD" | "CDF")}
                    className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-bold text-teal-400 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="CDF">CDF (FC) - Franc Congolais</option>
                    <option value="USD">USD ($) - Dollar Américain</option>
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs font-bold text-teal-400 select-none">
                    {selectedCountryConfig.currency} ({selectedCountryConfig.countryCode})
                  </div>
                )}
              </div>

              {/* 3. Operator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-teal-400" /> Réseau / Opérateur
                  </label>
                  {directCountry === "SN" && (
                    <span className="text-[10px] text-teal-400 font-extrabold">Wave & Orange SN</span>
                  )}
                </div>
                <select
                  value={directCarrier}
                  onChange={(e) => {
                    setDirectCarrier(e.target.value);
                    setSuggestedCarrier(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                  {selectedCountryConfig.operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
                {directCountry === "SN" && directCarrier.includes("WAVE") && directMode === "API" && (
                  <p className="text-[10px] text-amber-400 font-bold leading-tight mt-1">
                    ⚠️ Wave n&apos;est pas activé sur votre compte PawaPay (Orange & Free uniquement). Basculez en haut sur &quot;Manuel&quot; pour Wave, ou choisissez Orange Money.
                  </p>
                )}
              </div>

              {/* 4. Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-400" /> Numéro Mobile Money
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-xl text-xs font-extrabold text-teal-400 select-none">
                    +{selectedCountryConfig.phonePrefix}
                  </span>
                  <input
                    type="text"
                    placeholder="788796398 ou 771234567"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-r-xl text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* 5. Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-400" /> Montant ({directCountry === "CD" && directCurrency === "CDF" ? "Base USD → CDF" : "USD $"})
                  </label>
                  {(parseFloat(directAmount) || 0) > 0 && (
                    <span className="text-[10px] font-extrabold text-teal-400">
                      {directCountry === "CD" && directCurrency === "CDF"
                        ? `→ ${Math.round((parseFloat(directAmount) || 0) * 2800).toLocaleString('fr-FR')} CDF`
                        : directCountry === "CD" && directCurrency === "USD"
                        ? `→ ${(parseFloat(directAmount) || 0).toFixed(2)}$ USD`
                        : `→ ${Math.round((parseFloat(directAmount) || 0) * selectedCountryConfig.exchangeRate).toLocaleString('fr-FR')} ${selectedCountryConfig.currency}`}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  placeholder="Ex: 50"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* 6. Optional Instructor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" /> Formateur Destinataire (Optionnel)
                </label>
                <select
                  value={directInstructorId}
                  onChange={(e) => setDirectInstructorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">-- Retrait Direct Admin (Sans formateur lié) --</option>
                  {instructorsList.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Reason / Description or Manual Ref */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-teal-400" /> {directMode === "MANUAL" ? "Réf transaction Wave / Orange (Optionnelle)" : "Motif / Description du versement"}
                </label>
                {directMode === "MANUAL" ? (
                  <input
                    type="text"
                    placeholder="Ex: WV-2026-98213 ou transaction Orange Money"
                    value={directManualRef}
                    onChange={(e) => setDirectManualRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Ex: Retrait Wave / Orange Sénégal"
                    value={directDescription}
                    onChange={(e) => setDirectDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                )}
              </div>
            </div>

            {/* Feedback alert with intelligent recovery options */}
            {directMessage && (
              <div className={`p-4 rounded-2xl text-xs font-semibold space-y-3 animate-in fade-in ${
                directMessage.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/80 border border-red-500/50 text-red-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  {directMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{directMessage.text}</span>
                </div>

                {/* Intelligent Recovery Actions when API payout corridor is unprovisioned */}
                {directMessage.type === 'error' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/20">
                    {/* Option 1: Switch between Wave and Orange Sénégal */}
                    {directCountry === "SN" && (
                      <button
                        type="button"
                        disabled={submittingDirect}
                        onClick={() => {
                          const targetOp = directCarrier.includes("WAVE") ? "ORANGE_SEN" : "WAVE_SEN";
                          setDirectCarrier(targetOp);
                          handleDirectPayoutSubmit(undefined, false, targetOp);
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>🔁 Réessayer avec {directCarrier.includes("WAVE") ? "Orange Money Sénégal" : "Wave Sénégal"}</span>
                      </button>
                    )}

                    {/* Option 2: Record as direct manual payout */}
                    <button
                      type="button"
                      disabled={submittingDirect}
                      onClick={() => handleDirectPayoutSubmit(undefined, true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider comme versement manuel (Wave / Orange)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end pt-2 gap-2">
              <button
                type="submit"
                disabled={submittingDirect}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {submittingDirect ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-950 border-t-transparent" />
                    Traitement en cours...
                  </>
                ) : directMode === "MANUAL" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Enregistrer le versement manuel ({directCarrier.includes("WAVE") ? "Wave" : "Orange SN"})
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le retrait direct PawaPay ({directCarrier.includes("WAVE") ? "Wave" : "Orange SN"})
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tab Filters for Table */}
        <div className="flex justify-between items-center pt-2">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Historique des demandes & versements</h4>
          <div className="flex gap-2">
            {(["PENDING", "PAID", "FAILED", "ALL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/30"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {tab === "PENDING" ? "En attente ⏳" : tab === "PAID" ? "Payés ✅" : tab === "FAILED" ? "Échoués ❌" : "Tous"}
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
                    <th className="px-6 py-4 font-semibold">Coordonnées & PawaPay</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-teal-600 dark:text-teal-400 text-xs bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 px-2.5 py-1 rounded-lg inline-block">
                            {p.paymentReference || "—"}
                          </span>
                          {p.currency && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              p.currency === "CDF" 
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" 
                                : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                            }`}>
                              {p.currency}
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <div className="mt-1.5 text-[11px] leading-tight text-zinc-600 dark:text-zinc-400 max-w-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 p-2 rounded-lg">
                            <span className="font-bold text-red-600 dark:text-red-400 block mb-0.5">Raison / Notes PawaPay :</span>
                            {p.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("fr-FR")} à {new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-red-600 dark:text-red-400 text-sm">
                          {p.amount}$ USD
                        </div>
                        {p.currency === "CDF" ? (
                          <div className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                            ≈ {Math.round(p.amount * 2800).toLocaleString('fr-FR')} CDF
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400 font-medium">
                            Wallet USD
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'PAID'
                            ? "bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                            : p.status === 'PENDING'
                            ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                            : p.status === 'FAILED'
                            ? "bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
                        }`}>
                          {p.status === 'PAID' ? 'Validé' : p.status === 'PENDING' ? 'En attente' : p.status === 'FAILED' ? 'Échoué PawaPay' : 'Annulé/Refusé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' || p.status === 'FAILED' ? (
                          <div className="flex justify-end gap-1.5 flex-wrap">
                            <button
                              disabled={processingId !== null}
                              onClick={() => handleUpdatePayoutStatus(p.id, 'PAID', 'accept')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                processingId === p.id 
                                  ? "bg-teal-700/50 text-white/50 cursor-not-allowed"
                                  : processingId !== null
                                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                  : "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm"
                              }`}
                              title="Tenter le virement via l'API PawaPay"
                            >
                              {processingId === p.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                  Virement...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" /> PawaPay API
                                </>
                              )}
                            </button>
                            <button
                              disabled={processingId !== null}
                              onClick={() => handleUpdatePayoutStatus(p.id, 'PAID', 'manual_accept')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                processingId !== null
                                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                              }`}
                              title="Valider manuellement après transfert Mobile Money direct"
                            >
                              <Check className="w-3 h-3" /> Manuel
                            </button>
                            {p.status === 'PENDING' && (
                              <button
                                disabled={processingId !== null}
                                onClick={() => handleUpdatePayoutStatus(p.id, 'CANCELLED', 'reject')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                  processingId !== null
                                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                }`}
                                title="Rejeter la demande"
                              >
                                <X className="w-3 h-3" /> Refuser
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">Aucune action requise</span>
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
