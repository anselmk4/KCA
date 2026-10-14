"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import {
  X,
  Smartphone,
  Bitcoin,
  ShieldCheck,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  Check,
  Sparkles,
} from "lucide-react";
import {
  getPawaPayConfigForCountry,
  PAWAPAY_FEE_RATE,
  calculatePawaPayAmountWithFee,
} from "@/lib/pawapay";
import { PayPalLogo } from "@/components/icons/PaymentLogos";
import { SolanaQrCode } from "@/components/ui/SolanaQrCode";
import { SOLANA_TREASURY_ADDRESS, getSolanaPayUri } from "@/lib/crypto";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url?: string;
  file_name?: string | null;
  category?: string;
}

interface DigitalProductCheckoutModalProps {
  product: DigitalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (downloadUrl: string) => void;
}

export function DigitalProductCheckoutModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: DigitalProductCheckoutModalProps) {
  const [method, setMethod] = useState<"momo" | "paypal" | "crypto_sol">("momo");
  const [userCountry, setUserCountry] = useState("CD");
  const [momoProvider, setMomoProvider] = useState("VODACOM_MPESA_COD");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // États spécifiques au workflow PawaPay Mobile Money
  const [depositId, setDepositId] = useState<string | null>(null);
  const [isPendingPawaPay, setIsPendingPawaPay] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [countdown, setCountdown] = useState(120);

  const price = product ? Number(product.price) : 0;
  const { feeAmount, totalAmount: finalAmountWithFee } = calculatePawaPayAmountWithFee(price);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";

  const countryConfig =
    getPawaPayConfigForCountry(userCountry) || getPawaPayConfigForCountry("CD")!;

  // Mettre à jour l'opérateur par défaut lors du changement de pays
  useEffect(() => {
    if (countryConfig?.operators?.[0]?.id) {
      setMomoProvider(countryConfig.operators[0].id);
    }
  }, [userCountry]);

  // Réinitialiser les états lors de l'ouverture/fermeture
  useEffect(() => {
    if (!isOpen) {
      setIsPendingPawaPay(false);
      setDepositId(null);
      setSubmitting(false);
      setErrorMsg("");
      setCompleted(false);
      setDownloadUrl("");
    }
  }, [isOpen]);

  // Rendu dynamique des boutons PayPal officiels
  useEffect(() => {
    if (method !== "paypal" || !isOpen || !product || completed) return;

    let intervalId: any;
    let attempts = 0;

    const tryRender = () => {
      const container = document.getElementById("paypal-digital-button-container");
      if (!container) return false;

      if (window.paypal && window.paypal.Buttons) {
        container.innerHTML = "";

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
                if (!email) {
                  const msg = "Veuillez renseigner votre email ci-dessus avant de payer.";
                  setErrorMsg(msg);
                  throw new Error(msg);
                }

                try {
                  const res = await fetch("/api/payments/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "DIGITAL_PRODUCT",
                      itemId: product.id,
                      userEmail: email,
                      userName: name,
                    }),
                  });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  return data.orderId;
                } catch (err: any) {
                  setErrorMsg(err.message || "Erreur de création de commande PayPal.");
                  throw err;
                }
              },
              onApprove: async (data: any) => {
                setSubmitting(true);
                try {
                  const res = await fetch("/api/payments/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderID }),
                  });
                  const captureData = await res.json();
                  if (captureData.error) {
                    setErrorMsg("Erreur lors de la validation PayPal : " + captureData.error);
                  } else {
                    const url = captureData.downloadUrl;
                    setDownloadUrl(url);
                    setCompleted(true);
                    if (onSuccess) {
                      onSuccess(url);
                    }
                  }
                } catch (err: any) {
                  setErrorMsg("Erreur de capture : " + err.message);
                } finally {
                  setSubmitting(false);
                }
              },
              onError: (err: any) => {
                console.error("[PayPal Digital Checkout Error]", err);
                setErrorMsg("La transaction PayPal a échoué ou a été annulée.");
              },
            })
            .render("#paypal-digital-button-container");
          return true;
        } catch (renderErr) {
          console.warn("[PayPal Button Render Error]", renderErr);
        }
      }
      return false;
    };

    if (!tryRender()) {
      intervalId = setInterval(() => {
        attempts++;
        if (tryRender() || attempts > 20) {
          clearInterval(intervalId);
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [method, isOpen, product, email, name, completed, onSuccess]);

  // Polling automatique pour PawaPay Mobile Money
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPendingPawaPay && depositId && !completed) {
      timer = setInterval(async () => {
        await checkPawaPayStatus(true);
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPendingPawaPay, depositId, completed]);

  // Compte à rebours du délai d'attente Mobile Money
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPendingPawaPay && countdown > 0 && !completed) {
      interval = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPendingPawaPay, countdown, completed]);

  // Vérification manuelle ou automatique du statut PawaPay
  const checkPawaPayStatus = async (isSilent = false) => {
    if (!depositId) return;
    if (!isSilent) setCheckingStatus(true);

    try {
      const res = await fetch(`/api/payments/pawapay-check-status?depositId=${depositId}`);
      const data = await res.json();

      if (data.status === "PAID") {
        setIsPendingPawaPay(false);
        setCompleted(true);
        const url = data.downloadUrl || `/api/digital-products/${product?.id}/download`;
        setDownloadUrl(url);
        if (onSuccess) {
          onSuccess(url);
        }
      } else if (data.status === "FAILED") {
        setIsPendingPawaPay(false);
        setErrorMsg(
          data.failureReason ||
            "Paiement Mobile Money refusé par l'opérateur ou expiré. Veuillez vérifier votre solde."
        );
      }
    } catch (err: any) {
      if (!isSilent) {
        setErrorMsg("Impossible de vérifier le statut : " + (err.message || err));
      }
    } finally {
      if (!isSilent) setCheckingStatus(false);
    }
  };

  if (!isOpen || !product) return null;

  // Lancement du paiement Mobile Money PawaPay
  const handleInitiatePawaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Veuillez renseigner votre adresse email pour la réception du produit.");
      return;
    }

    if (!phoneNumber) {
      setErrorMsg("Veuillez saisir votre numéro Mobile Money pour recevoir la demande de confirmation PIN.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/pawapay-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmountWithFee,
          phoneNumber,
          carrier: momoProvider,
          type: "DIGITAL_PRODUCT",
          itemId: product.id,
          country: userCountry,
          currency: userCountry === "CD" ? "USD" : countryConfig.currency,
          userEmail: email,
          userName: name,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Une erreur est survenue lors de l'initiation du paiement.");
      }

      setDepositId(resData.depositId);
      setIsSandboxMode(!!resData.isSandbox);
      setIsPendingPawaPay(true);
      setCountdown(120);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la communication avec la passerelle Mobile Money.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`}
        strategy="lazyOnload"
        onLoad={() => setPaypalLoaded(true)}
      />

      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Sécurisé */}
          <div className="bg-gradient-to-r from-zinc-950 via-teal-950 to-zinc-950 p-5 text-white flex items-center justify-between border-b border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Achat Sécurisé & Accès Immédiat
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                    Officiel
                  </span>
                </h3>
                <p className="text-xs text-teal-200/70">
                  Paiement certifié PawaPay Mobile Money, PayPal & Crypto
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Récapitulatif produit */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-14 h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.cover_image_url || "/placeholder-course.jpg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {product.category || "E-book & Guide Numérique"}
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {product.title}
              </h4>
              <p className="text-xs text-zinc-500 truncate">
                {product.file_name || "Document complet téléchargeable immédiatement"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">
                ${price.toFixed(2)}
              </span>
              {method === "momo" && feeAmount > 0 && (
                <span className="block text-[10px] text-zinc-400 font-medium">
                  +${feeAmount.toFixed(2)} frais MoMo
                </span>
              )}
            </div>
          </div>

          {/* Corps de la Modale */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {completed ? (
              /* ÉCRAN DE SUCCÈS AVEC BOUTON DE TÉLÉCHARGEMENT SÉCURISÉ */
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    Paiement Validé avec Succès !
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Votre achat a été authentifié. Un reçu avec votre lien d&apos;accès chiffré a été expédié à{" "}
                    <strong>{email || "votre email"}</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-2xl text-left text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    Téléchargement Privé Protégé
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                    Votre lien de téléchargement est cryptographiquement signé et lié à votre transaction.
                    Le fichier sera servi en flux direct sécurisé.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    download
                    className="w-full inline-flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/25 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-5 h-5" /> Télécharger mon Produit Numérique
                  </a>
                </div>
              </div>
            ) : isPendingPawaPay ? (
              /* ÉCRAN D'ATTENTE DE VALIDATION MOBILE MONEY (USSD / PIN) */
              <div className="text-center py-6 space-y-5 animate-in fade-in">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                  <Smartphone className="w-8 h-8 text-teal-600 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Confirmation requise sur votre téléphone
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Une notification de paiement de{" "}
                    <strong className="text-teal-600 dark:text-teal-400">
                      ${finalAmountWithFee.toFixed(2)} USD
                    </strong>{" "}
                    a été envoyée au <strong>{phoneNumber}</strong> ({momoProvider}).
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-left text-xs space-y-2">
                  <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    Action requise :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                    <li>Vérifiez l&apos;écran ou les SMS de votre téléphone.</li>
                    <li>Saisissez votre code PIN secret Mobile Money pour valider.</li>
                    <li>
                      Cette fenêtre se mettra à jour automatiquement dès la confirmation.
                    </li>
                  </ol>
                </div>

                {isSandboxMode && (
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                    Mode Test PawaPay (Sandbox) : Utilisez les numéros de test PawaPay pour simuler la validation.
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <span>Temps restant : {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
                  <button
                    type="button"
                    onClick={() => checkPawaPayStatus(false)}
                    disabled={checkingStatus}
                    className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin" : ""}`} />
                    J&apos;ai validé mon code PIN
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPendingPawaPay(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors pt-2 cursor-pointer"
                >
                  ← Changer de numéro ou de moyen de paiement
                </button>
              </div>
            ) : (
              /* FORMULAIRE DE PAIEMENT NORMAL */
              <form onSubmit={handleInitiatePawaPay} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Choix du moyen de paiement */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Moyen de Paiement
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod("momo")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        method === "momo"
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      <span className="text-[11px]">PawaPay MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("paypal")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        method === "paypal"
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <PayPalLogo className="w-4 h-4 text-[#0070BA]" />
                      <span className="text-[11px]">PayPal / Carte</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("crypto_sol")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        method === "crypto_sol"
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm ring-2 ring-teal-500/20"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <Bitcoin className="w-4 h-4 text-amber-500" />
                      <span className="text-[11px]">Crypto</span>
                    </button>
                  </div>
                </div>

                {/* Coordonnées Client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Votre Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: David Mukendi"
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Adresse Email (Réception fichier)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@domaine.com"
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                {/* Détails PawaPay Mobile Money */}
                {method === "momo" && (
                  <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Pays
                        </label>
                        <select
                          value={userCountry}
                          onChange={(e) => setUserCountry(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                        >
                          <option value="CD">🇨🇩 Congo (RDC)</option>
                          <option value="CG">🇨🇬 Congo (Brazzaville)</option>
                          <option value="CM">🇨🇲 Cameroun</option>
                          <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                          <option value="SN">🇸🇳 Sénégal</option>
                          <option value="BJ">🇧🇯 Bénin</option>
                          <option value="RW">🇷🇼 Rwanda</option>
                          <option value="UG">🇺🇬 Ouganda</option>
                          <option value="ZM">🇿🇲 Zambie</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Opérateur Mobile Money
                        </label>
                        <select
                          value={momoProvider}
                          onChange={(e) => setMomoProvider(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-medium"
                        >
                          {countryConfig?.operators?.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Numéro Mobile Money ({countryConfig.names?.[0] || countryConfig.countryCode})
                      </label>
                      <div className="flex">
                        <span className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-200 dark:border-zinc-700 rounded-l-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center">
                          {countryConfig.phonePrefix}
                        </span>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Ex: 812345678"
                          className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-r-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Détails PayPal */}
                {method === "paypal" && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-zinc-800/80 border border-blue-200 dark:border-blue-900/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <PayPalLogo className="w-5 h-5 text-[#0070BA]" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Paiement Sécurisé via l&apos;API PayPal
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      Payez directement avec votre compte PayPal ou carte bancaire. Dès l&apos;approbation, votre jeton d&apos;accès sécurisé sera débloqué.
                    </p>

                    <div id="paypal-digital-button-container" className="relative z-10 w-full min-h-[48px] mt-2" />
                  </div>
                )}

                {/* Détails Crypto */}
                {method === "crypto_sol" && (
                  <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Scannez ou envoyez l&apos;équivalent de <strong>${price.toFixed(2)} USD</strong> en Solana pour validation instantanée.
                    </p>
                    <div className="flex justify-center py-2">
                      <SolanaQrCode
                        value={
                          getSolanaPayUri({
                            amount: price,
                            label: "Ansella Digital Store",
                            memo: `DP-${product.id.substring(0, 8).toUpperCase()}`,
                          }) || SOLANA_TREASURY_ADDRESS
                        }
                        size={170}
                        showAnsellaLogo={true}
                      />
                    </div>
                  </div>
                )}

                {/* Bouton de confirmation PawaPay */}
                {method === "momo" && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/25 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Initiation PawaPay en cours...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Payer ${finalAmountWithFee.toFixed(2)} via Mobile Money
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Passerelle certifiée SSL · Accès chiffré anti-fuite
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
