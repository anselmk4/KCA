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
  ArrowRight,
  Sparkles,
  CheckCircle2,
  PhoneCall
} from "lucide-react";
import {
  PAWAPAY_COUNTRY_MAPPING,
  getPawaPayConfigForCountry,
  calculatePawaPayAmountWithFee
} from "@/lib/pawapay";
import { PayPalLogo, MPesaLogo, OrangeMoneyLogo, AirtelMoneyLogo, MtnMomoLogo } from "@/components/icons/PaymentLogos";
import { DonationReceipt } from "./DonationReceipt";
import { DonationSuccessSummary } from "../types";

declare global {
  interface Window {
    paypal?: any;
  }
}

const PRESET_AMOUNTS_USD = [5, 10, 25, 50, 100];
const PRESET_AMOUNTS_CDF = [15000, 30000, 75000, 150000, 300000];
const PRESET_AMOUNTS_EUR = [5, 10, 25, 50, 100];
const PRESET_AMOUNTS_XAF = [3000, 6000, 15000, 30000, 60000];

export function DonationForm() {
  // Navigation / État global
  const [method, setMethod] = useState<"pawapay" | "paypal">("pawapay");
  const [currency, setCurrency] = useState<string>("USD");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Infos donateur
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // PawaPay Mobile Money
  const [countryCode, setCountryCode] = useState("CD");
  const [operatorId, setOperatorId] = useState("VODACOM_MPESA_COD");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Processus & États UI
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [isPendingMomo, setIsPendingMomo] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [successSummary, setSuccessSummary] = useState<DonationSuccessSummary | null>(null);

  // PayPal SDK
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalRenderedRef = useRef(false);

  const countryConfig = getPawaPayConfigForCountry(countryCode) || PAWAPAY_COUNTRY_MAPPING[0];
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";

  // Calcul du montant effectif
  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedPreset || 0;

  // Ajuster opérateur par défaut lors du changement de pays
  useEffect(() => {
    if (countryConfig?.operators?.[0]?.id) {
      setOperatorId(countryConfig.operators[0].id);
    }
  }, [countryCode]);

  // Si l'utilisateur choisit CDF, XOF ou XAF, forcer ou recommander Mobile Money
  useEffect(() => {
    if (currency === "CDF" || currency === "XOF" || currency === "XAF") {
      setMethod("pawapay");
    }
  }, [currency]);

  // Réinitialiser les montants prédéfinis lors du changement de devise
  useEffect(() => {
    if (currency === "CDF") {
      setSelectedPreset(75000);
    } else if (currency === "XAF" || currency === "XOF") {
      setSelectedPreset(15000);
    } else {
      setSelectedPreset(25);
    }
    setCustomAmount("");
  }, [currency]);

  // Polling automatique pour la validation Mobile Money
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

  // Compte à rebours du délai Mobile Money (120 secondes)
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

  // Rendu dynamique des boutons PayPal
  useEffect(() => {
    if (method !== "paypal" || !paypalLoaded || successSummary) return;

    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const renderPayPalButtons = () => {
      const container = document.getElementById("paypal-donation-button-container");
      if (!container) return false;

      // Nettoyer le conteneur précédent
      container.innerHTML = "";

      if (window.paypal?.Buttons && effectiveAmount > 0) {
        try {
          window.paypal
            .Buttons({
              style: {
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "donate",
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
                      currency: currency === "EUR" ? "EUR" : "USD",
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
                  setErrorMsg(err.message || "Erreur lors de l'initialisation PayPal.");
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

                  setSuccessSummary({
                    donationId: captureData.donation?.id || data.orderID,
                    provider: "paypal",
                    reference: data.orderID,
                    amount: effectiveAmount,
                    currency: currency === "EUR" ? "EUR" : "USD",
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
                setErrorMsg("La transaction PayPal a échoué ou a été interrompue.");
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
  }, [method, paypalLoaded, effectiveAmount, currency, donorName, donorEmail, message, isAnonymous, successSummary]);

  // Soumission don Mobile Money via PawaPay
  const handleInitiatePawaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (effectiveAmount <= 0) {
      setErrorMsg("Veuillez sélectionner ou entrer un montant valide supérieur à 0.");
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setErrorMsg("Veuillez entrer un numéro de téléphone valide pour Mobile Money.");
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

  // Vérification manuelle ou par polling du statut Mobile Money
  const verifyPawaPayStatus = async (isSilent = false) => {
    if (!depositId) return;
    if (!isSilent) setCheckingStatus(true);

    try {
      const res = await fetch(`/api/donations/pawapay/status?depositId=${depositId}`);
      const data = await res.json();

      if (data.status === "completed") {
        setIsPendingMomo(false);
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

  // Si le don a réussi, afficher le reçu de confirmation
  if (successSummary) {
    return <DonationReceipt summary={successSummary} onReset={handleResetForm} />;
  }

  const presets =
    currency === "CDF"
      ? PRESET_AMOUNTS_CDF
      : currency === "EUR"
      ? PRESET_AMOUNTS_EUR
      : currency === "XAF" || currency === "XOF"
      ? PRESET_AMOUNTS_XAF
      : PRESET_AMOUNTS_USD;

  return (
    <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden p-6 sm:p-8">
      {/* Script PayPal SDK conditionnel */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency === "EUR" ? "EUR" : "USD"}&intent=capture`}
        strategy="lazyOnload"
        onLoad={() => setPaypalLoaded(true)}
      />

      {/* Étape : Attente de validation Mobile Money */}
      {isPendingMomo ? (
        <div className="text-center py-6 space-y-6">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/30 text-teal-400">
            <Smartphone className="w-10 h-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Validation sur votre téléphone requise
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Un message de confirmation a été envoyé sur le numéro{" "}
              <span className="font-semibold text-teal-300">{phoneNumber}</span>. Tapez votre code PIN secret Mobile Money pour valider votre don de{" "}
              <span className="font-semibold text-white">
                {effectiveAmount} {currency}
              </span>.
            </p>
          </div>

          {/* Décompte */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
            <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            <span>
              Attente de la confirmation réseau (délai :{" "}
              <strong className="text-teal-300 font-mono">{countdown}s</strong>)
            </span>
          </div>

          {/* Boutons d'action statut */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => verifyPawaPayStatus(false)}
              disabled={checkingStatus}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold shadow-md transition disabled:opacity-50"
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-medium transition"
            >
              Modifier mes informations
            </button>
          </div>
        </div>
      ) : (
        /* Formulaire Principal de Don */
        <form onSubmit={handleInitiatePawaPay} className="space-y-6">
          {/* Messages d'erreur */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* 1. Choix de la Devise */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1. Choisissez la Devise
              </label>
              <span className="text-[11px] text-teal-400">Mobile Money & PayPal acceptés</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { code: "USD", label: "USD ($)" },
                { code: "CDF", label: "CDF (FC)" },
                { code: "EUR", label: "EUR (€)" },
                { code: "XOF", label: "XOF / XAF" },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    currency === c.code
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10"
                      : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Choix du Montant */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              2. Montant du don
            </label>

            {/* Presets rapides */}
            <div className="grid grid-cols-5 gap-2 mb-3">
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
                    className={`py-2.5 rounded-xl text-sm font-extrabold transition border ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-teal-500/20"
                        : "bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:border-white/25"
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Montant libre */}
            <div className="relative">
              <input
                type="number"
                min="1"
                step={currency === "USD" || currency === "EUR" ? "0.01" : "1"}
                placeholder="Ou saisissez un montant personnalisé libre..."
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400">
                {currency}
              </span>
            </div>
          </div>

          {/* 3. Choix du Moyen de Paiement */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              3. Moyen de paiement
            </label>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Carte PawaPay Mobile Money */}
              <button
                type="button"
                onClick={() => setMethod("pawapay")}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  method === "pawapay"
                    ? "bg-teal-500/10 border-teal-500/50 shadow-md shadow-teal-500/5"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-teal-400" />
                    Mobile Money
                  </span>
                  {method === "pawapay" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  M-Pesa, Orange, Airtel, MTN
                </div>
              </button>

              {/* Carte PayPal */}
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  method === "paypal"
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PayPalLogo className="w-4 h-4" />
                    PayPal & Cartes
                  </span>
                  {method === "paypal" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Visa, Mastercard, Compte PayPal
                </div>
              </button>
            </div>

            {/* Options spécifiques PawaPay Mobile Money */}
            {method === "pawapay" && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Choix Pays */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Pays émetteur</label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-500"
                    >
                      {PAWAPAY_COUNTRY_MAPPING.map((c) => (
                        <option key={c.countryCode} value={c.countryCode}>
                          {c.names[0].toUpperCase()} (+{c.phonePrefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Choix Opérateur */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Opérateur</label>
                    <select
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-500"
                    >
                      {countryConfig?.operators?.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Champ Numéro de Téléphone */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Numéro de compte Mobile Money
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      +{countryConfig.phonePrefix}
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 812345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-14 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saisissez le numéro sans l&apos;indicatif (+{countryConfig.phonePrefix}).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Informations Donateur (Optionnelles) */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                4. Vos Coordonnées (Optionnel)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-white/20 text-teal-500 focus:ring-0 bg-transparent"
                />
                <span>Donner anonymement</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Votre nom ou prénom"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500"
                />
                <input
                  type="email"
                  placeholder="Votre email (pour le reçu)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <textarea
              rows={2}
              maxLength={400}
              placeholder="Un petit mot ou message de soutien pour la communauté Ansella..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* 5. Bouton d'action ou Conteneur PayPal */}
          {method === "pawapay" ? (
            <button
              type="submit"
              disabled={submitting || effectiveAmount <= 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
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
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Chargement sécurisé de PayPal...</span>
                </div>
              )}
            </div>
          )}

          {/* Mentions de sécurité */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Paiement chiffré SSL 256 bits
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Aucune coordonnée bancaire stockée
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

