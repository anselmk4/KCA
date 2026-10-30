"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Filter,
  Compass,
  ShoppingCart,
  CreditCard,
  UserCheck,
  UserX,
  Sparkles,
  Clock,
  Activity,
  FileWarning,
  Layers,
  Smartphone,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Search,
  HelpCircle,
} from "lucide-react";

interface FunnelStep {
  stepNumber: number;
  key: string;
  label: string;
  routePattern: string;
  visitors: number;
  conversionFromPrev: number;
  conversionFromTop: number;
  dropOffCount: number;
  dropOffRate: number;
  avgTimeSec: number;
  primaryFrictionReason: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "HEALTHY";
}

interface ConvertingPage {
  path: string;
  title: string;
  category: string;
  visitors: number;
  ctaClicks: number;
  conversions: number;
  conversionRate: number;
  revenueUsd: number;
  avgTimeSec: number;
  conversionDriver: string;
}

interface DropOffPage {
  path: string;
  pageTitle: string;
  funnelStage: string;
  visitors: number;
  exitsBeforePay: number;
  abandonmentRate: number;
  avgTimeBeforeExitSec: number;
  lostRevenueUsd: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  whyUsersAbandon: string[];
  actionableFix: string;
}

interface OnboardingStepItem {
  step: string;
  entered: number;
  completed: number;
  completionRate: number;
  dropOffRate: number;
  status: "OPTIMAL" | "BON" | "FRICTION" | "CRITIQUE";
  diagnosis: string;
}

interface StuckUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  createdAt: string;
  blockingStage: string;
  reason: string;
  recommendedAction: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
}

interface PaymentMethodStat {
  method: string;
  code: string;
  attempts: number;
  paid: number;
  pending: number;
  failed: number;
  revenueUsd: number;
  conversionRate: number;
  abandonmentRate: number;
  failureDiagnosis: string;
}

interface AnalystDiagnostic {
  id: string;
  priority: string;
  title: string;
  impactMetric: string;
  evidence: string;
  rootCause: string;
  recommendation: string;
  estimatedLift: string;
  actionHref: string;
  actionLabel: string;
}

interface DailyTrendPoint {
  date: string;
  label: string;
  visitors: number;
  signups: number;
  checkouts: number;
  paid: number;
  abandoned: number;
}

interface AnalyticsPayload {
  generatedAt: string;
  period: string;
  kpis: {
    uniqueVisitors: number;
    totalSessions: number;
    totalPageViews: number;
    onboardingCompletedCount: number;
    checkoutReachedVisitors: number;
    totalPaymentAttempts: number;
    successfulPaymentsCount: number;
    uniqueBuyersCount: number;
    visitorToSignupRate: number;
    signupToBuyerRate: number;
    overallConversionRate: number;
    checkoutAbandonmentRate: number;
    totalRevenueUsd: number;
    abandonedRevenueUsd: number;
    onboardingHealthScore: number;
    liveBufferedEvents: number;
  };
  funnelSteps: FunnelStep[];
  topConvertingPages: ConvertingPage[];
  dropOffPages: DropOffPage[];
  onboardingAudit: {
    healthScore: number;
    profileCompleteness: {
      totalProfilesAudited: number;
      fullNamePct: number;
      phonePct: number;
      countryPct: number;
      genderPct: number;
      bioOrAvatarPct: number;
      activatedCoursePct: number;
      convertedPaidPct: number;
    };
    stepsBreakdown: OnboardingStepItem[];
    stuckUsers: StuckUser[];
  };
  paymentMethodAnalysis: PaymentMethodStat[];
  analystDiagnostics: AnalystDiagnostic[];
  dailyTrend: DailyTrendPoint[];
}

type ActiveTab = "FUNNEL" | "PAGES" | "ONBOARDING" | "DIAGNOSTICS";

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "ALL">("30D");
  const [activeTab, setActiveTab] = useState<ActiveTab>("FUNNEL");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stuckFilter, setStuckFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [stuckSearch, setStuckSearch] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Impossible de charger les données analytiques.");
      }
      const json: AnalyticsPayload = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">
          Analyse de l&apos;entonnoir de conversion, des pages d&apos;abandon et de l&apos;onboarding…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Erreur lors du chargement des analytiques</span>
        </div>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const {
    kpis,
    funnelSteps,
    topConvertingPages,
    dropOffPages,
    onboardingAudit,
    paymentMethodAnalysis,
    analystDiagnostics,
    dailyTrend,
  } = data;

  const filteredStuckUsers = onboardingAudit.stuckUsers.filter((u) => {
    if (stuckFilter !== "ALL" && u.urgency !== stuckFilter) return false;
    if (stuckSearch.trim()) {
      const q = stuckSearch.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.blockingStage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const maxDailyVisitors = Math.max(...dailyTrend.map((d) => d.visitors), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Analytics, Funnel de Conversion & Diagnostic d&apos;Abandon
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Analyse comportementale des visiteurs, efficacité des pages, audit de l&apos;onboarding et causes de non-paiement
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Télémétrie Active</span>
          </div>

          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            {(
              [
                { key: "7D", label: "7 Jours" },
                { key: "30D", label: "30 Jours" },
                { key: "90D", label: "90 Jours" },
                { key: "ALL", label: "Tout" },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.key
                    ? "bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ── 6 Executive KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {/* KPI 1: Visitors */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Visiteurs Uniques
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            {kpis.uniqueVisitors.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {kpis.totalSessions.toLocaleString("fr-FR")} sessions · {kpis.totalPageViews.toLocaleString("fr-FR")} pages vues
          </p>
        </div>

        {/* KPI 2: Visitor -> Signup */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Visiteur → Inscrit
            </span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            {kpis.visitorToSignupRate}%
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {kpis.onboardingCompletedCount} comptes créés sur la période
          </p>
        </div>

        {/* KPI 3: Signup -> Buyer */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Inscrit → Acheteur
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {kpis.signupToBuyerRate}%
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {kpis.uniqueBuyersCount} acheteurs ({kpis.overallConversionRate}% du trafic total)
          </p>
        </div>

        {/* KPI 4: Checkout Abandonment */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-500">
              Abandon Checkout
            </span>
            <ShoppingCart className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">
            {kpis.checkoutAbandonmentRate}%
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {kpis.checkoutReachedVisitors - kpis.successfulPaymentsCount} départs sur {kpis.checkoutReachedVisitors} checkouts
          </p>
        </div>

        {/* KPI 5: Lost / Pending Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              CA Bloqué / Abandonné
            </span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            ${kpis.abandonedRevenueUsd.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Contre ${kpis.totalRevenueUsd.toLocaleString("fr-FR")} encaissés (PAID)
          </p>
        </div>

        {/* KPI 6: Onboarding Health Score */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Santé Onboarding
            </span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {kpis.onboardingHealthScore}
            </p>
            <span className="text-xs font-semibold text-zinc-400">/ 100</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
             Téléphone renseigné : {onboardingAudit.profileCompleteness.phonePct}%
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {(
          [
            {
              id: "FUNNEL",
              label: "1. Entonnoir de Conversion (7 Étapes)",
              icon: <Layers className="w-4 h-4" />,
            },
            {
              id: "PAGES",
              label: "2. Pages qui Convertissent vs Pages d'Abandon",
              icon: <Compass className="w-4 h-4" />,
            },
            {
              id: "ONBOARDING",
              label: "3. Audit Onboarding & Utilisateurs Bloqués",
              icon: <UserCheck className="w-4 h-4" />,
            },
            {
              id: "DIAGNOSTICS",
              label: "4. Pourquoi ils ne paient pas (Diagnostic Data Analyst)",
              icon: <Sparkles className="w-4 h-4" />,
            },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: FULL CONVERSION FUNNEL & TRAFFIC EVOLUTION
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "FUNNEL" && (
        <div className="space-y-6">
          {/* Funnel Breakdown Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Entonnoir Complet : Du Premier Clic jusqu&apos;au Paiement Validé
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Visualisez à quelle étape précise vos visiteurs décrochent et pourquoi ils n&apos;arrivent pas à finaliser le paiement.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Point critique : Étapes 5 → 7 (Checkout & Push Mobile Money)
              </span>
            </div>

            <div className="space-y-4">
              {funnelSteps.map((step) => {
                const barWidth = Math.max(step.conversionFromTop, 6);
                const severityBadge =
                  step.severity === "CRITICAL"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800/50"
                    : step.severity === "HIGH"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";

                return (
                  <div
                    key={step.key}
                    className="p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900 dark:text-white">
                              {step.label}
                            </span>
                            <code className="text-[11px] px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {step.routePattern}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-900 dark:text-white">
                          {step.visitors.toLocaleString("fr-FR")} utilisateurs ({step.conversionFromTop}%)
                        </div>

                        {step.stepNumber > 1 && (
                          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                            Passage : {step.conversionFromPrev}%
                          </div>
                        )}

                        {step.dropOffCount > 0 && (
                          <div className={`px-2.5 py-1 rounded-lg border font-semibold ${severityBadge}`}>
                            Perte : -{step.dropOffCount.toLocaleString("fr-FR")} (-{step.dropOffRate}%)
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{step.avgTimeSec}s moy.</span>
                        </div>
                      </div>
                    </div>

                    {/* Funnel Bar */}
                    <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          step.severity === "CRITICAL"
                            ? "bg-gradient-to-r from-red-600 to-amber-500"
                            : step.severity === "HIGH"
                            ? "bg-gradient-to-r from-amber-500 to-blue-600"
                            : "bg-gradient-to-r from-blue-600 to-indigo-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Analyst Friction Note */}
                    <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                      <HelpCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          Cause principale de décrochage :{" "}
                        </span>
                        {step.primaryFrictionReason}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 14-Day Traffic vs Checkouts vs Paid Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Évolution sur 14 Jours : Trafic Visiteurs vs Tentatives Checkout vs Paiements Validés
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Comparaison quotidienne entre le flux entrant, les intentions de paiement et les transactions finalisées
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Visiteurs
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Checkouts abandonnés
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Paiements validés
                </span>
              </div>
            </div>

            <div className="grid grid-cols-14 gap-1.5 sm:gap-2 items-end h-48 pt-4 px-2 border-b border-zinc-200 dark:border-zinc-800">
              {dailyTrend.map((pt) => {
                const vHeight = Math.max(Math.round((pt.visitors / maxDailyVisitors) * 140), 14);
                const cHeight = Math.max(Math.round((pt.abandoned / maxDailyVisitors) * 260), 6);
                const pHeight = Math.max(Math.round((pt.paid / maxDailyVisitors) * 260), 4);
                return (
                  <div
                    key={pt.date}
                    className="flex flex-col items-center justify-end gap-1 group relative"
                  >
                    <div className="flex items-end gap-0.5 h-36">
                      <div
                        style={{ height: `${vHeight}px` }}
                        className="w-2 sm:w-3 rounded-t bg-blue-500/85 group-hover:bg-blue-600 transition-all"
                        title={`${pt.visitors} visiteurs`}
                      />
                      <div
                        style={{ height: `${cHeight}px` }}
                        className="w-2 sm:w-3 rounded-t bg-amber-500/90 group-hover:bg-amber-600 transition-all"
                        title={`${pt.abandoned} abandons checkout`}
                      />
                      <div
                        style={{ height: `${pHeight}px` }}
                        className="w-2 sm:w-3 rounded-t bg-emerald-500 group-hover:bg-emerald-600 transition-all"
                        title={`${pt.paid} paiements validés`}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium truncate max-w-full">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: TOP CONVERTING PAGES vs HIGH DROP-OFF / EXIT PAGES
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "PAGES" && (
        <div className="space-y-6">
          {/* Section A: High Abandonment Pages (Where users quit before paying) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Pages où les Utilisateurs Abandonnent Avant d&apos;Arriver au Paiement
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Identification exacte des URLs de sortie, du manque à gagner financier et des raisons techniques/UX de l&apos;abandon
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dropOffPages.map((page) => (
                <div
                  key={page.path}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                        {page.funnelStage}
                      </span>
                      <span className="text-xs font-extrabold text-red-600 dark:text-red-400">
                        {page.abandonmentRate}% d&apos;abandon ({page.exitsBeforePay} sorties)
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-0.5">
                      {page.pageTitle}
                    </h3>
                    <code className="text-xs text-zinc-500 dark:text-zinc-400 block mb-3">
                      {page.path}
                    </code>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-center mb-3">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">Visiteurs</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{page.visitors}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">Temps avant départ</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{page.avgTimeBeforeExitSec}s</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">CA Perdu Estimé</p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">${page.lostRevenueUsd}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Pourquoi ils abandonnent sur cette page :
                      </p>
                      <ul className="space-y-1">
                        {page.whyUsersAbandon.map((reason, i) => (
                          <li key={i} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                            <span className="text-red-500 font-bold mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold block mb-0.5">💡 Recommandation Data Analyst :</span>
                    {page.actionableFix}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Top Converting Pages */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Pages qui Convertissent le Plus (Meilleurs Taux de Passage à l&apos;Achat)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Classement des pages et formations qui transforment le mieux les visiteurs en acheteurs payants
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                    <th className="py-3 px-3">Page / URL</th>
                    <th className="py-3 px-3">Visiteurs</th>
                    <th className="py-3 px-3">Clics Checkout</th>
                    <th className="py-3 px-3">Ventes (PAID)</th>
                    <th className="py-3 px-3">Taux Conv.</th>
                    <th className="py-3 px-3">Revenu Généré</th>
                    <th className="py-3 px-3">Facteur Clé de Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
                  {topConvertingPages.map((p) => (
                    <tr key={p.path} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-3">
                        <p className="font-bold text-zinc-900 dark:text-white">{p.title}</p>
                        <code className="text-[11px] text-zinc-400">{p.path}</code>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">
                        {p.visitors.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        {p.ctaClicks.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                        {p.conversions}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          {p.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        ${p.revenueUsd.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300 max-w-xs">
                        {p.conversionDriver}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: ONBOARDING AUDIT & USERS STUCK BEFORE PAYMENT
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ONBOARDING" && (
        <div className="space-y-6">
          {/* Completeness Gauges + Step-by-Step Register Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Real Database Profile Completeness */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Qualité de l&apos;Onboarding (Base de données)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Audit sur {onboardingAudit.profileCompleteness.totalProfilesAudited} profils réels
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-extrabold">
                  Score : {onboardingAudit.healthScore}/100
                </span>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    label: "Nom complet renseigné",
                    pct: onboardingAudit.profileCompleteness.fullNamePct,
                    color: "bg-emerald-500",
                    note: "Collecté à l'étape 1",
                  },
                  {
                    label: "Pays / Nationalité (Routing MoMo)",
                    pct: onboardingAudit.profileCompleteness.countryPct,
                    color: "bg-blue-500",
                    note: "Détermine l'opérateur PawaPay",
                  },
                  {
                    label: "Téléphone Mobile Money valide",
                    pct: onboardingAudit.profileCompleteness.phonePct,
                    color: onboardingAudit.profileCompleteness.phonePct < 75 ? "bg-amber-500" : "bg-emerald-500",
                    note: "Indispensable pour le Push USSD",
                  },
                  {
                    label: "Genre renseigné",
                    pct: onboardingAudit.profileCompleteness.genderPct,
                    color: "bg-indigo-500",
                    note: "Collecté à l'étape 2",
                  },
                  {
                    label: "Activation : ≥ 1 cours rejoint",
                    pct: onboardingAudit.profileCompleteness.activatedCoursePct,
                    color: onboardingAudit.profileCompleteness.activatedCoursePct < 50 ? "bg-red-500" : "bg-amber-500",
                    note: "Passage du compte créé au 1er cours",
                  },
                  {
                    label: "Conversion : ≥ 1 achat payé (PAID)",
                    pct: onboardingAudit.profileCompleteness.convertedPaidPct,
                    color: "bg-emerald-600",
                    note: "Utilisateurs ayant finalisé un paiement",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.label}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right (2 cols): Step-by-step /register funnel */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                Diagnostic Étape par Étape du Tunnel d&apos;Onboarding (<code>/register</code>)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Vérification de chaque écran d&apos;inscription pour détecter où les futurs acheteurs bloquent
              </p>

              <div className="space-y-3">
                {onboardingAudit.stepsBreakdown.map((st) => {
                  const badgeStyle =
                    st.status === "OPTIMAL"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : st.status === "BON"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : st.status === "FRICTION"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";

                  return (
                    <div
                      key={st.step}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          {st.step}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-500">
                            {st.completed} / {st.entered} ({st.completionRate}%)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                            {st.status} (Perte {st.dropOffRate}%)
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">{st.diagnosis}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table of Real Users Stuck Before Paying */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Utilisateurs Inscrits Bloqués Avant le Paiement (Relance Ciblée)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Comptes réels n&apos;ayant pas encore validé d&apos;achat payant, classés selon leur point exact de blocage
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stuckSearch}
                    onChange={(e) => setStuckSearch(e.target.value)}
                    placeholder="Rechercher nom, email..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-red-500 outline-none"
                  />
                </div>

                {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((urg) => (
                  <button
                    key={urg}
                    onClick={() => setStuckFilter(urg)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      stuckFilter === urg
                        ? "bg-red-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {urg === "ALL" ? "Tous" : urg === "HIGH" ? "Urgence Haute" : urg === "MEDIUM" ? "Moyenne" : "Faible"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                    <th className="py-3 px-3">Utilisateur</th>
                    <th className="py-3 px-3">Téléphone / Pays</th>
                    <th className="py-3 px-3">Étape de Blocage</th>
                    <th className="py-3 px-3">Diagnostic précis</th>
                    <th className="py-3 px-3">Action Recommandée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
                  {filteredStuckUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        Aucun utilisateur bloqué ne correspond à ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredStuckUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3 px-3">
                          <p className="font-bold text-zinc-900 dark:text-white">{u.fullName}</p>
                          <p className="text-[11px] text-zinc-400">{u.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">{u.phone}</p>
                          <p className="text-[10px] text-zinc-400">Pays : {u.country}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.urgency === "HIGH"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : u.urgency === "MEDIUM"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {u.blockingStage}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300 max-w-xs">
                          {u.reason}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-zinc-700 dark:text-zinc-200 font-medium mb-1">
                            {u.recommendedAction}
                          </p>
                          <Link
                            href={`/admin/emails`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline"
                          >
                            <span>Relancer par e-mail</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 4: DATA ANALYST DIAGNOSTICS & PAYMENT METHOD FAILURE MATRIX
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "DIAGNOSTICS" && (
        <div className="space-y-6">
          {/* Payment Method Matrix */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Performance & Taux d&apos;Échec par Moyen de Paiement
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Comparaison du taux d&apos;aboutissement entre Mobile Money, PayPal/Carte, Solana USDC et Bitcoin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethodAnalysis.map((pm) => (
                <div
                  key={pm.code}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{pm.method}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        pm.conversionRate >= 55
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                      }`}
                    >
                      Succès : {pm.conversionRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 mb-3">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase">Tentatives</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{pm.attempts}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-500 uppercase">Payés (PAID)</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pm.paid}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-500 uppercase">En attente</p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{pm.pending}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-red-500 uppercase">Échoués</p>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">{pm.failed}</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="font-bold text-zinc-900 dark:text-white">Diagnostic : </span>
                    {pm.failureDiagnosis}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritized Data Analyst Root-Cause Cards */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Synthèse Expert Data Analyst : Pourquoi vos utilisateurs n&apos;arrivent pas jusqu&apos;au paiement
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  4 causes racines classées par impact financier avec plan d&apos;action immédiat
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {analystDiagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          diag.priority.includes("P1")
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {diag.priority}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        {diag.title}
                      </h3>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      Gain estimé : {diag.estimatedLift}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-3">
                    Impact mesuré : {diag.impactMetric} — {diag.evidence}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                      <p className="text-[11px] font-bold uppercase text-zinc-400 mb-1">
                        Cause Racine (Root Cause)
                      </p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {diag.rootCause}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <p className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                        Plan d&apos;Action Recommandé
                      </p>
                      <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                        {diag.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={diag.actionHref}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition"
                    >
                      <span>{diag.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

