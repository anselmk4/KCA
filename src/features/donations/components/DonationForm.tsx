"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import {
  Smartphone,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Heart,
  RefreshCw,
  Lock,
  Globe,
  CreditCard,
  Check
} from "lucide-react";
import {
  PAWAPAY_COUNTRY_MAPPING,
  getPawaPayConfigForCountry
} from "@/lib/pawapay";
import { PayPalLogo } from "@/components/icons/PaymentLogos";
import { DonationReceipt } from "./DonationReceipt";
import { DonationSuccessSummary } from "../types";

declare global {
  interface Window {
    paypal?: any;
  }
}

// Montants prédéfinis commençant par 1$ et intégrant 200$ et 500$
const PRESET_AMOUNTS_USD = [1, 5, 10, 25, 50, 100, 200, 500];
const PRESET_AMOUNTS_CDF = [2800, 15000, 30000, 75000, 150000, 300000, 600000, 1500000];
const PRESET_AMOUNTS_XAF = [600, 3000, 6000, 15000, 30000, 60000, 120000, 300000];
const PRESET_AMOUNTS_RWF = [1300, 6500, 13000, 32500, 65000, 130000, 260000, 650000];
const PRESET_AMOUNTS_UGX = [3700, 18500, 37000, 92500, 185000, 370000, 740000, 1850000];

// Fonction pour déterminer les devises disponibles selon le pays sélectionné
function getAvailableCurrenciesForCountry(countryCode: string): { code: string; label: string }[] {
  const code = countryCode.toUpperCase();
  if (code === "CD") {
    // La RDC prend en charge le Franc Congolais (CDF) et le Dollar américain (USD)
    return [
      { code: "USD", label: "USD ($) - Dollar US" },
      { code: "CDF", label: "CDF (FC) - Franc Congolais" },
    ];
  }
  if (["SN", "CI", "BJ", "BF", "ML", "TG", "NE"].includes(code)) {
    return [{ code: "XOF", label: "XOF (FCFA)" }];
  }
  if (["CG", "CM", "GA", "TD", "CF", "GQ"].includes(code)) {
    return [{ code: "XAF", label: "XAF (FCFA)" }];
  }
  if (code === "RW") {
    return [{ code: "RWF", label: "RWF (Franc Rwandais)" }];
  }
  if (code === "UG") {
    return [{ code: "UGX", label: "UGX (Shilling Ougandais)" }];
  }
  if (code === "ZM") {
    return [{ code: "ZMW", label: "ZMW (Kwacha Zambien)" }];
  }
  return [{ code: "USD", label: "USD ($)" }];
}

export function DonationForm() {
  // 1. Choix du mode de paiement (Mobile Money par défaut)
  const [method, setMethod] = useState<"pawapay" | "paypal">("pawapay");

  // Mobile Money : Pays d'abord, puis devise liée au pays
  const [countryCode, setCountryCode] = useState<string>("CD");
  const [currency, setCurrency] = useState<string>("USD");
  const [operatorId, setOperatorId] = useState<string>("VODACOM_MPESA_COD");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Montant du don
  const [selectedPreset, setSelectedPreset] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Donateur
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // États du flux & chargement
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [isPendingMomo, setIsPendingMomo] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [successSummary, setSuccessSummary] = useState<DonationSuccessSummary | null>(null);

  // PayPal SDK
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";
  // Ref pour éviter que onError écrase le vrai message d'erreur de createOrder
  const createOrderErrorRef = useRef(false);

  const countryConfig = getPawaPayConfigForCountry(countryCode) || PAWAPAY_COUNTRY_MAPPING[0];
  const availableCurrencies = getAvailableCurrenciesForCountry(countryCode);

  // Quand le pays change : actualiser la devise par défaut du pays et l'opérateur
  useEffect(() => {
    if (method === "pawapay") {
      const currencies = getAvailableCurrenciesForCountry(countryCode);
      if (currencies.length > 0) {
        if (!currencies.some((c) => c.code === currency)) {
          setCurrency(currencies[0].code);
        }
      }

      const cfg = getPawaPayConfigForCountry(countryCode);
      if (cfg?.operators?.[0]?.id) {
        setOperatorId(cfg.operators[0].id);
      }
    }
  }, [countryCode, method]);

  // Si on passe à PayPal : devise fixée en USD (standard Ansella facturation & produits)
  useEffect(() => {
    if (method === "paypal") {
      setCurrency("USD");
      setSelectedPreset(25);
      setCustomAmount("");
    }
  }, [method]);

  // Adapter les montants prédéfinis selon la devise
  useEffect(() => {
    if (currency === "CDF") {
      setSelectedPreset(75000);
    } else if (currency === "XAF" || currency === "XOF") {
      setSelectedPreset(15000);
    } else if (currency === "RWF") {
      setSelectedPreset(32500);
    } else if (currency === "UGX") {
      setSelectedPreset(92500);
    } else {
      setSelectedPreset(25);
    }
    setCustomAmount("");
  }, [currency]);

  // Calcul du montant effectif
  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedPreset || 0;

  // Polling automatique pour Mobile Money
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPendingMomo && depositId && !successSummary) {
      timer = setInterval(async () => {
        await verifyPawaPayStatus(true);
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPendingMomo, depositId, successSummary]);

  // Décompte de 120s pour Mobile Money
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPendingMomo && countdown > 0 && !successSummary) {
      interval = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPendingMomo, countdown, successSummary]);

  // Rendu PayPal Buttons (aligné sur DigitalProductCheckoutModal et Dashboard Payment)
  useEffect(() => {
    if (method !== "paypal" || !paypalLoaded || successSummary) return;

    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const renderPayPalButtons = () => {
      const container = document.getElementById("paypal-donation-button-container");
      if (!container) return false;
      container.innerHTML = "";

      if (window.paypal?.Buttons && effectiveAmount > 0) {
        try {
          window.paypal
            .Buttons({
              style: {
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "paypal",
                height: 44,
              },
              createOrder: async () => {
                setErrorMsg("");
                setSubmitting(true);
                try {
                  const res = await fetch("/api/donations/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: effectiveAmount,
                      currency: "USD",
                      donorName: isAnonymous ? "Donateur anonyme" : donorName || undefined,
                      donorEmail: donorEmail || undefined,
                      message: message || undefined,
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok || !data.orderId) {
                    throw new Error(data.error || "Impossible d'initier la commande PayPal.");
                  }
                  return data.orderId;
                } catch (err: any) {
                  const msg = err.message || "Erreur lors de l'initialisation PayPal.";
                  setErrorMsg(msg);
                  createOrderErrorRef.current = true;
                  throw err;
                } finally {
                  setSubmitting(false);
                }
              },
              onApprove: async (data: any) => {
                setSubmitting(true);
                setErrorMsg("");
                try {
                  const res = await fetch("/api/donations/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderID }),
                  });

                  const captureData = await res.json();
                  if (!res.ok || !captureData.success) {
                    throw new Error(captureData.error || "La capture du don a échoué.");
                  }

                  // Notification en direct pour incrémenter immédiatement la jauge de progression
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("donation-completed"));
                  }

                  setSuccessSummary({
                    donationId: captureData.donation?.id || data.orderID,
                    provider: "paypal",
                    reference: data.orderID,
                    amount: effectiveAmount,
                    currency: "USD",
                    donorName: isAnonymous ? "Donateur anonyme" : donorName || undefined,
                    donorEmail: donorEmail || undefined,
                    message: message || undefined,
                    createdAt: new Date().toISOString(),
                  });
                } catch (err: any) {
                  setErrorMsg(err.message || "Erreur lors de la capture du don.");
                } finally {
                  setSubmitting(false);
                }
              },
              onError: (err: any) => {
                console.error("[PayPal Donation Error]", err);
                if (!createOrderErrorRef.current) {
                  setErrorMsg("La transaction PayPal a été interrompue ou n'a pas pu aboutir.");
                }
                createOrderErrorRef.current = false;
              },
              onCancel: () => {
                setErrorMsg("Paiement PayPal annulé.");
              },
            })
            .render("#paypal-donation-button-container");
          return true;
        } catch (e) {
          console.warn("[PayPal Donation Render Error]", e);
        }
      }
      return false;
    };

    if (!renderPayPalButtons()) {
      intervalId = setInterval(() => {
        attempts++;
        if (renderPayPalButtons() || attempts > 20) {
          clearInterval(intervalId);
        }
      }, 400);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [method, paypalLoaded, effectiveAmount, donorName, donorEmail, message, isAnonymous, successSummary]);

  // Soumission Mobile Money
  const handleInitiatePawaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (effectiveAmount <= 0) {
      setErrorMsg("Veuillez sélectionner ou entrer un montant valide supérieur à 0.");
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setErrorMsg("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donations/pawapay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          currency,
          phoneNumber: phoneNumber.trim(),
          operatorId,
          countryCode,
          donorName: isAnonymous ? "Donateur anonyme" : donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'initiation Mobile Money");
      }

      setDepositId(data.depositId);
      setIsPendingMomo(true);
      setCountdown(120);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion à la passerelle Mobile Money.");
    } finally {
      setSubmitting(false);
    }
  };

  // Vérification de statut PawaPay
  const verifyPawaPayStatus = async (isSilent = false) => {
    if (!depositId) return;
    if (!isSilent) setCheckingStatus(true);

    try {
      const res = await fetch(`/api/donations/pawapay/status?depositId=${depositId}`);
      const data = await res.json();

      if (data.status === "completed") {
        setIsPendingMomo(false);

        // Déclencher l'événement pour incrémenter la jauge de progression
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("donation-completed"));
        }

        setSuccessSummary({
          donationId: data.donation?.id || depositId,
          provider: "pawapay",
          reference: depositId,
          amount: effectiveAmount,
          currency,
          donorName: isAnonymous ? "Donateur anonyme" : donorName || undefined,
          donorEmail: donorEmail || undefined,
          message: message || undefined,
          createdAt: data.donation?.created_at || new Date().toISOString(),
        });
      } else if (data.status === "failed") {
        setIsPendingMomo(false);
        setErrorMsg(
          data.donation?.metadata?.failureReason ||
            "La transaction a été refusée ou a expiré sur votre téléphone. Veuillez réessayer."
        );
      }
    } catch (err) {
      console.warn("[PawaPay Check Status Error]", err);
    } finally {
      if (!isSilent) setCheckingStatus(false);
    }
  };

  const handleResetForm = () => {
    setSuccessSummary(null);
    setIsPendingMomo(false);
    setDepositId(null);
    setCountdown(120);
    setErrorMsg("");
  };

  if (successSummary) {
    return <DonationReceipt summary={successSummary} onReset={handleResetForm} />;
  }

  const presets =
    currency === "CDF"
      ? PRESET_AMOUNTS_CDF
      : currency === "XAF" || currency === "XOF"
      ? PRESET_AMOUNTS_XAF
      : currency === "RWF"
      ? PRESET_AMOUNTS_RWF
      : currency === "UGX"
      ? PRESET_AMOUNTS_UGX
      : PRESET_AMOUNTS_USD;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden p-6 sm:p-8 transition-colors">
      {/* Script PayPal SDK officiel (aligné sur l'ensemble de la plateforme) */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`}
        strategy="lazyOnload"
        onLoad={() => setPaypalLoaded(true)}
      />

      {/* Étape : Attente de validation Mobile Money */}
      {isPendingMomo ? (
        <div className="text-center py-6 space-y-6">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/30 text-teal-600 dark:text-teal-400">
            <Smartphone className="w-10 h-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Validation requise sur votre téléphone
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Un prompt de confirmation a été envoyé au{" "}
              <span className="font-bold text-teal-600 dark:text-teal-300">{phoneNumber}</span>. Tapez votre code secret PIN pour confirmer votre don de{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {effectiveAmount.toLocaleString()} {currency}
              </span>.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
            <Loader2 className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin" />
            <span>
              Attente de validation réseau (délai :{" "}
              <strong className="text-teal-600 dark:text-teal-300 font-mono">{countdown}s</strong>)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => verifyPawaPayStatus(false)}
              disabled={checkingStatus}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>J&apos;ai validé sur mon téléphone</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsPendingMomo(false);
                setDepositId(null);
              }}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Modifier mes informations
            </button>
          </div>
        </div>
      ) : (
        /* Formulaire Principal */
        <form onSubmit={handleInitiatePawaPay} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* 1. Choix du moyen de paiement */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2.5">
              1. Choisissez votre moyen de paiement
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Carte Mobile Money */}
              <button
                type="button"
                onClick={() => setMethod("pawapay")}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                  method === "pawapay"
                    ? "bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/20"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Mobile Money
                  </span>
                  {method === "pawapay" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  M-Pesa, Orange, Airtel, MTN
                </div>
              </button>

              {/* Carte PayPal & Cartes */}
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                  method === "paypal"
                    ? "bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <PayPalLogo className="w-4 h-4" />
                    PayPal & Cartes
                  </span>
                  {method === "paypal" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visa, Mastercard, Compte PayPal
                </div>
              </button>
            </div>
          </div>

          {/* 2. Configuration : Mobile Money ou PayPal */}
          {method === "pawapay" ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Étape A : Sélection du Pays */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Pays Mobile Money
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {PAWAPAY_COUNTRY_MAPPING.map((c) => (
                      <option key={c.countryCode} value={c.countryCode}>
                        {c.names[0].toUpperCase()} (+{c.phonePrefix})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Étape B : Sélection de la Devise disponible pour ce pays */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Devise de paiement
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Étape C : Opérateur */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Opérateur Mobile
                  </label>
                  <select
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {countryConfig?.operators?.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Étape D : Numéro de téléphone */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      +{countryConfig.phonePrefix}
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 812345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-14 pr-3 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Carte descriptive PayPal (USD) */
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Paiement International PayPal & Cartes Bancaires
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Facturé en USD ($). Carte bancaire internationale ou compte PayPal acceptés.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                USD ($)
              </span>
            </div>
          )}

          {/* 3. Choix du Montant (Commence par 1, inclut 200 et 500) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Montant du don ({currency})
              </label>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                Dès 1 {currency === "USD" ? "$" : currency}
              </span>
            </div>

            {/* Presets rapides : 1, 5, 10, 25, 50, 100, 200, 500 */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
              {presets.map((amt) => {
                const isSelected = selectedPreset === amt && !customAmount;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(amt);
                      setCustomAmount("");
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-transparent shadow-md shadow-teal-500/20"
                        : "bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Montant libre personnalisé */}
            <div className="relative">
              <input
                type="number"
                min="1"
                step={currency === "USD" ? "0.01" : "1"}
                placeholder="Ou saisissez un montant personnalisé libre..."
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-teal-500 pr-16 transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-600 dark:text-teal-400">
                {currency}
              </span>
            </div>
          </div>

          {/* 4. Coordonnées donateur */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Informations donateur (Optionnel)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/20 text-teal-500 focus:ring-0 bg-transparent"
                />
                <span>Donner anonymement</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Votre nom ou pseudo"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-teal-500"
                />
                <input
                  type="email"
                  placeholder="Votre email (pour le reçu)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <textarea
              rows={2}
              maxLength={300}
              placeholder="Un petit mot d'encouragement pour les apprenants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* 5. Bouton d'action ou Boutons officiels PayPal */}
          {method === "pawapay" ? (
            <button
              type="submit"
              disabled={submitting || effectiveAmount <= 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 fill-slate-950" />
                  <span>
                    Faire un don de {effectiveAmount.toLocaleString()} {currency}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div>
              <div id="paypal-donation-button-container" className="min-h-[50px] relative z-10" />
              {!paypalLoaded && (
                <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                  <span>Chargement sécurisé de PayPal...</span>
                </div>
              )}
            </div>
          )}

          {/* Mentions de sécurité */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Paiement chiffré SSL 256 bits
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Sans stockage de coordonnées bancaires
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
