"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  Phone, 
  DollarSign, 
  Loader2 
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase/client";
import { getPawaPayConfigForCountry } from "@/lib/pawapay";

declare global {
  interface Window {
    paypal?: any;
  }
}

type PaymentMethod = "mastercard" | "stripe" | "paypal" | "crypto" | "mobile_money";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<"BASE" | "PRO" | "MAX">("PRO");
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPendingState, setShowPendingState] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Form Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [userCountry, setUserCountry] = useState("CD");
  const [phone, setPhone] = useState("");
  const [carrier, setCarrier] = useState("VODACOM_MPESA_COD");
  const [momoCurrency, setMomoCurrency] = useState<"USD" | "CDF">("USD");

  const countryConfig = getPawaPayConfigForCountry(userCountry) || getPawaPayConfigForCountry("CD")!;

  useEffect(() => {
    if (countryConfig?.operators?.length > 0) {
      const isValid = countryConfig.operators.some(op => op.id === carrier);
      if (!isValid) {
        setCarrier(countryConfig.operators[0].id);
      }
    }
  }, [userCountry, countryConfig]);

  const [cryptoCoin, setCryptoCoin] = useState("usdc");
  const [cryptoTxId, setCryptoTxId] = useState("");

  useEffect(() => {
    const queryPlan = searchParams.get("plan")?.toUpperCase();
    if (queryPlan === "MAX") {
      setPlan("MAX");
    } else if (queryPlan === "BASE") {
      setPlan("BASE");
    } else {
      setPlan("PRO");
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        
        // Fetch profile to get country, phone & payment preferences
        const { data: profile } = await (supabase
          .from("profiles")
          .select("country, phone_number, nationality, phone, payment_methods, preferred_payment_method") as any)
          .eq("id", user.id)
          .maybeSingle();

        const resolvedCountry = profile?.nationality || profile?.country;
        const resolvedPhone = profile?.phone || profile?.phone_number;

        // Check if user has a preferred payment method
        const preferredId = profile?.preferred_payment_method;
        const methods = profile?.payment_methods;
        let preferredApplied = false;

        if (preferredId && Array.isArray(methods)) {
          const preferred = methods.find((m: any) => m.id === preferredId);
          if (preferred) {
            if (preferred.type === "mobile_money") {
              setMethod("mobile_money");
              if (preferred.phone) setPhone(preferred.phone);
              if (preferred.country) setUserCountry(preferred.country);
              
              const cleanLabel = (preferred.label || "").toLowerCase();
              const targetCountry = preferred.country || resolvedCountry || "CD";
              const targetConfig = getPawaPayConfigForCountry(targetCountry);
              if (targetConfig) {
                const matchedOp = targetConfig.operators.find(op => 
                  cleanLabel.includes(op.name.toLowerCase()) || 
                  op.name.toLowerCase().includes(cleanLabel)
                );
                if (matchedOp) {
                  setCarrier(matchedOp.id);
                } else if (targetConfig.operators.length > 0) {
                  setCarrier(targetConfig.operators[0].id);
                }
              }
            } else if (preferred.type === "paypal") {
              setMethod("paypal");
            }
            preferredApplied = true;
          }
        }

        if (!preferredApplied) {
          if (resolvedCountry) {
            setUserCountry(resolvedCountry);
          }
          if (resolvedPhone) {
            setPhone(resolvedPhone);
          }
        }
      }
    });
  }, [searchParams]);

  const planDetails = {
    BASE: { name: "Plan Base", price: 19, desc: "Jusqu'à 3 cours actifs et 50 apprenants. Commission 10%." },
    PRO: { name: "Plan Pro", price: 49, desc: "Jusqu'à 10 cours actifs et 200 apprenants." },
    MAX: { name: "Plan Max", price: 200, desc: "Cours et apprenants illimités, 0% commission." }
  };

  const currentPlanDetails = planDetails[plan];

  /**
   * Called after any successful payment to show success state and redirect.
   * The plan update in Supabase is handled server-side by the capture handler
   * (PayPal) or directly in handlePaymentSubmit (other methods).
   */
  const handlePaymentSuccess = () => {
    setSuccess(true);
    router.refresh();
    // Redirect after showing success screen
    setTimeout(() => {
      router.push("/instructor/billing");
    }, 3000);
  };

  const checkPaymentStatus = async (isSilent = false) => {
    if (!paymentId) return;
    if (!isSilent) setVerifying(true);
    try {
      const res = await fetch(`/api/payments/pawapay-check-status?depositId=${paymentId}`);
      const data = await res.json();

      if (data.status === "PAID") {
        setShowPendingState(false);
        handlePaymentSuccess();
        return true;
      } else if (data.status === "FAILED") {
        setShowPendingState(false);
        if (!isSilent) {
          alert(`Le paiement a échoué : ${data.failureReason || "Transaction refusée par l'opérateur."}`);
        }
        return false;
      } else {
        if (!isSilent) {
          alert("Paiement toujours en attente. Assurez-vous d'avoir validé la notification sur votre téléphone mobile.");
        }
        return false;
      }
    } catch (err: any) {
      console.error("[instructor-pay] Status check error:", err);
      if (!isSilent) alert("Erreur lors de la vérification : " + (err.message || err));
      return false;
    } finally {
      if (!isSilent) setVerifying(false);
    }
  };

  // Auto-polling PawaPay payment status every 5 seconds when pending
  useEffect(() => {
    if (showPendingState && paymentId && method === "mobile_money") {
      const interval = setInterval(() => {
        checkPaymentStatus(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showPendingState, paymentId, method]);

  const simulateSuccess = async () => {
    if (!paymentId) return;
    setSimulating(true);
    try {
      const response = await fetch("/api/webhooks/pawapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          depositId: paymentId,
          status: "COMPLETED",
          amount: currentPlanDetails.price.toString(),
          currency: countryConfig.currency,
          payer: {
            type: "MSISDN",
            address: {
              value: phone
            }
          }
        }]),
      });

      if (!response.ok) {
        throw new Error("Erreur de simulation");
      }

      // Check status immediately
      await checkPaymentStatus();

    } catch (err: any) {
      console.error("[Simulate Success Error]", err);
      alert("Erreur lors de la simulation : " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Sandbox auto-simulation helper for Mobile Money - only auto-simulate on localhost
  useEffect(() => {
    if (showPendingState && paymentId && method === "mobile_money") {
      const isLocalhost = typeof window !== "undefined" && (
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" || 
        window.location.hostname.startsWith("192.168.")
      );

      if (isSandboxMode && isLocalhost) {
        const timer = setTimeout(() => {
          simulateSuccess();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [showPendingState, paymentId, method, isSandboxMode]);

  // Note: PayPal SDK script is loaded dynamically in the JSX using next/script component

  // Render PayPal buttons once script is loaded
  useEffect(() => {
    if (method !== "paypal" || !plan) return;

    let intervalId: any;
    let attempts = 0;

    const tryRender = () => {
      const container = document.getElementById("paypal-button-container");
      if (!container) return false;

      if (window.paypal) {
        // Clear previous button elements to prevent duplicates
        container.innerHTML = "";

        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color:  'blue',
            shape:  'rect',
            label:  'paypal'
          },
          createOrder: async () => {
            try {
              const res = await fetch("/api/payments/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  type: "INSTRUCTOR_PLAN", 
                  itemId: plan
                }),
              });
              const data = await res.json();
              if (data.error) throw new Error(data.error);
              return data.orderId;
            } catch (err: any) {
              alert("Erreur lors de la création de la commande PayPal : " + err.message);
              throw err;
            }
          },
          onApprove: async (data: any) => {
            setLoading(true);
            try {
              const res = await fetch("/api/payments/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const captureData = await res.json();
              if (captureData.error) {
                alert("Erreur lors de la capture : " + captureData.error);
              } else {
                // Plan already updated in Supabase by the server-side capture handler
                handlePaymentSuccess();
              }
            } catch (err: any) {
              alert("Erreur de capture du paiement : " + err.message);
            } finally {
              setLoading(false);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Error:", err);
            alert("La transaction PayPal a échoué ou a été annulée.");
          }
        }).render("#paypal-button-container");
        return true;
      }
      return false;
    };

    const rendered = tryRender();
    if (rendered) {
      setPaypalError(null);
    } else {
      intervalId = setInterval(() => {
        attempts++;
        const success = tryRender();
        if (success) {
          clearInterval(intervalId);
          setPaypalError(null);
        } else if (attempts > 50) {
          clearInterval(intervalId);
          const rawId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "VIDE";
          const maskedId = rawId.length > 10 ? `${rawId.substring(0, 8)}...${rawId.substring(rawId.length - 8)}` : rawId;
          setPaypalError(`Impossible de charger le script PayPal. (Client ID: ${maskedId}, Longueur: ${rawId.length}). L'identifiant est probablement incorrect, ou bloqué par un bloqueur de pub.`);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [method, plan, router]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Session introuvable. Veuillez vous connecter.");
      return;
    }
    if (method === "paypal") return;

    setLoading(true);

    if (method === "mobile_money") {
      try {
        const response = await fetch("/api/payments/pawapay-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: currentPlanDetails.price,
            phoneNumber: phone,
            carrier: carrier,
            type: "INSTRUCTOR_PLAN",
            itemId: plan,
            country: userCountry,
            currency: userCountry === "CD" ? momoCurrency : countryConfig.currency,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Une erreur est survenue lors de l'initiation du paiement.");
        }

        setPaymentId(resData.depositId);
        setIsSandboxMode(!!resData.isSandbox);
        setShowPendingState(true);
      } catch (err: any) {
        alert(err.message || "Une erreur est survenue lors de l'appel de la passerelle.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (method === "mastercard") {
      try {
        const response = await fetch("/api/payments/moko-initiate-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: currentPlanDetails.price,
            type: "INSTRUCTOR_PLAN",
            itemId: plan,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Une erreur est survenue lors de l'initiation du paiement par carte.");
        }

        if (resData.redirectUrl) {
          window.location.href = resData.redirectUrl;
        } else {
          throw new Error("URL de redirection introuvable.");
        }
      } catch (err: any) {
        alert(err.message || "Une erreur est survenue lors de l'appel de la passerelle.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Simulate other payment methods (stripe, crypto) — update Supabase directly
    setTimeout(async () => {
      try {
        // Update plan in Supabase
        await supabase.from("profiles").update({ plan }).eq("id", userId);
      } catch (err) {
        console.error("[instructor-pay] Error updating plan for simulated method:", err);
      }
      setLoading(false);
      handlePaymentSuccess();
    }, 2000);
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Back Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/instructor/billing"
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Sélection du mode de paiement</h1>
            <p className="text-xs text-zinc-500">Choisissez votre méthode de facturation préférée.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total à payer</span>
          <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{currentPlanDetails.price}$ / mois</span>
        </div>
      </div>

      {success ? (
        /* Success Screen */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto scale-110 transition-transform">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Paiement validé !</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Votre abonnement au <span className="font-bold text-teal-600">{currentPlanDetails.name}</span> a été activé avec succès.
            </p>
          </div>
          <p className="text-xs text-zinc-400 animate-pulse">Redirection vers votre espace de facturation...</p>
        </div>
      ) : showPendingState ? (
        /* Pending Mobile Money Screen */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded-full flex items-center justify-center mx-auto scale-110 transition-transform flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Validation Mobile Money...</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Une notification de validation PIN a été envoyée sur votre téléphone. Veuillez saisir votre code secret pour confirmer le paiement de <span className="font-bold text-teal-600">{currentPlanDetails.price}$</span> pour le plan <span className="font-bold">{plan}</span>.
            </p>
          </div>
          
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-150 dark:border-zinc-800 text-left text-xs space-y-1.5 text-zinc-500 max-w-sm mx-auto">
            <p><strong>Opérateur :</strong> {carrier.toUpperCase()}</p>
            <p><strong>Téléphone :</strong> +{countryConfig.phonePrefix} {phone}</p>
            <p><strong>ID Transaction :</strong> {paymentId}</p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto pt-2">
            <div className="w-full py-3.5 px-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 text-teal-700 dark:text-teal-300 font-bold rounded-xl flex items-center justify-center gap-2.5 text-xs shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span>Détection automatique dès la saisie de votre PIN...</span>
            </div>

            {/* Sandbox Simulation Button */}
            {isSandboxMode && (
              <button
                type="button"
                onClick={simulateSuccess}
                disabled={simulating}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer border border-amber-600"
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Simulation en cours...</span>
                  </>
                ) : (
                  <span>[Mode Test] Simuler validation PawaPay</span>
                )}
              </button>
            )}
            
            <button
              onClick={() => setShowPendingState(false)}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              Annuler et changer de mode
            </button>
          </div>
        </div>
      ) : (
        /* Payment Selection & Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Plan Recap & Options */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white">Récapitulatif de la commande</h3>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{currentPlanDetails.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{currentPlanDetails.desc}</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                <span className="text-zinc-500">Sous-total</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentPlanDetails.price},00 $</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800 text-sm font-bold">
                <span className="text-zinc-900 dark:text-white">Total récurrent</span>
                <span className="text-teal-600 dark:text-teal-400">{currentPlanDetails.price},00 $ / mois</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Vos transactions sont chiffrées et sécurisées. Vous disposez d'un contrôle complet pour annuler ou modifier votre forfait.
              </p>
            </div>
          </div>

          {/* Payment Methods & Dynamic Forms */}
          <form onSubmit={handlePaymentSubmit} className="lg:col-span-2 space-y-6">
            
            {/* Options Selection Grid */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Moyens de paiement</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "stripe", label: "Stripe", icon: <ShieldCheck className="w-5 h-5 text-indigo-500" /> },
                  { id: "paypal", label: "PayPal", icon: <DollarSign className="w-5 h-5 text-blue-500" /> },
                  { id: "crypto", label: "Crypto", icon: <Coins className="w-5 h-5 text-amber-500" /> },
                  { id: "mobile_money", label: "Mobile Money", icon: <Phone className="w-5 h-5 text-green-500" /> }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setMethod(item.id as PaymentMethod)}
                    className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                      method === item.id 
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-600 font-bold shadow-sm" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-teal-300 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] mt-1.5 leading-none">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Form details container */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              
              {/* 1. Mastercard Card Form */}
              {method === "mastercard" && (
                <div className="space-y-4 animate-in fade-in duration-200 py-4 text-center">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Paiement sécurisé par Carte Bancaire</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Vous allez être redirigé vers l'interface de paiement sécurisée de Moko Afrika pour saisir les coordonnées de votre carte Visa ou Mastercard et valider le paiement de <span className="font-bold text-teal-600 dark:text-teal-400">{currentPlanDetails.price}$</span> pour le plan <span className="font-bold">{plan}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Stripe direct mock */}
              {method === "stripe" && (
                <div className="space-y-4 animate-in fade-in duration-200 py-4 text-center">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Paiement instantané Stripe</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">Vous allez être redirigé vers l'interface de paiement sécurisée Stripe Checkout pour terminer la transaction en toute sécurité.</p>
                  <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-150 px-4 py-2 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> Transactions 100% sécurisées par Stripe
                  </div>
                </div>
              )}

              {/* 3. PayPal direct Integration */}
              {method === "paypal" && (
                <div className="space-y-4 animate-in fade-in duration-200 py-4 text-center">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Paiement sécurisé par PayPal</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">Cliquez sur le bouton PayPal ci-dessous pour finaliser votre abonnement.</p>
                  
                  {paypalError && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 text-xs text-center font-bold">
                      {paypalError}
                    </div>
                  )}

                  {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                    <>
                      <div id="paypal-button-container" className="relative z-10 w-full min-h-[150px] mt-4" />
                      <Script
                        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
                        strategy="lazyOnload"
                        onLoad={() => setPaypalLoaded(true)}
                        onError={() => setPaypalError("Impossible de charger le script de paiement PayPal. Veuillez vérifier votre clé client ou désactiver votre bloqueur de publicité.")}
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 rounded-xl border border-yellow-250 dark:border-yellow-900/30 text-xs text-center font-bold">
                      Identifiant client PayPal non configuré dans .env.local
                    </div>
                  )}
                </div>
              )}

              {/* 4. Crypto Gateway Form */}
              {method === "crypto" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Paiement en Cryptomonnaie (Solana Pay)</h4>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-lg border border-teal-500 bg-teal-50/10 text-teal-500 text-xs font-semibold text-center cursor-default">
                      USD Coin (USDC - Solana)
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-6 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                    <div className="relative p-4 bg-white rounded-xl border border-zinc-150 flex items-center justify-center shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=09090b&data=${encodeURIComponent(`solana:AnsLA11111111111111111111111111111111111111?amount=${currentPlanDetails.price}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&label=Ansella%20Academy&memo=KCA-PLAN-${plan.toUpperCase()}`)}`}
                        alt="Solana Pay QR Code"
                        width={180}
                        height={180}
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Solana Pay</p>
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-150">
                        Montant : <span className="text-emerald-600 dark:text-emerald-450 font-black">${currentPlanDetails.price} USDC</span>
                      </p>
                      <p className="text-[10px] text-zinc-555 dark:text-zinc-400 max-w-[260px] leading-relaxed font-semibold">
                        Scannez ce QR Code avec votre portefeuille Solana pour payer les frais d'abonnement.
                      </p>
                    </div>
                    
                    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-center select-all font-mono text-[9px] text-zinc-650 dark:text-zinc-450 break-all leading-normal">
                      {`solana:AnsLA11111111111111111111111111111111111111?amount=${currentPlanDetails.price}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&label=Ansella%20Academy&memo=KCA-PLAN-${plan.toUpperCase()}`}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">ID de transaction (Signature / TXID)</label>
                    <input 
                      required
                      type="text" 
                      value={cryptoTxId}
                      onChange={e => setCryptoTxId(e.target.value)}
                      placeholder="Collez la signature de votre transfert Solana ici"
                      className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* 5. Mobile Money Form */}
              {method === "mobile_money" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">Pays de paiement</label>
                    <select
                      value={userCountry}
                      onChange={(e) => setUserCountry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 transition-all mb-3"
                    >
                      <option value="CD">🇨🇩 Congo (RDC)</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                      <option value="SN">🇸🇳 Sénégal</option>
                      <option value="RW">🇷🇼 Rwanda</option>
                      <option value="UG">🇺🇬 Ouganda</option>
                    </select>
                  </div>

                  {/* Currency Selector for DRC */}
                  {userCountry === "CD" && (
                    <div className="mb-3">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                        Devise du compte Mobile Money (RDC)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setMomoCurrency("USD")}
                          className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer text-center transition-all flex items-center justify-center gap-2 ${
                            momoCurrency === "USD"
                              ? "border-teal-500 bg-teal-50/15 text-teal-650 font-bold shadow-sm"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          <span>💵 USD ($)</span>
                        </div>
                        <div
                          onClick={() => setMomoCurrency("CDF")}
                          className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer text-center transition-all flex items-center justify-center gap-2 ${
                            momoCurrency === "CDF"
                              ? "border-teal-500 bg-teal-50/15 text-teal-650 font-bold shadow-sm"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          <span>🇨🇩 CDF (FC)</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Montant à régler : {momoCurrency === "USD" ? `$${currentPlanDetails.price} USD` : `FC ${(currentPlanDetails.price * countryConfig.exchangeRate).toLocaleString()} CDF`}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Opérateur Mobile Money</h4>
                    <span className="text-[10px] font-bold bg-zinc-150 dark:bg-zinc-800 text-zinc-600 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                      Devise : {userCountry === "CD" ? momoCurrency : countryConfig.currency}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {countryConfig.operators.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setCarrier(item.id)}
                        className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer text-center transition-all ${
                          carrier === item.id 
                            ? "border-teal-500 bg-teal-50/15 text-teal-650 font-bold" 
                            : "border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500"
                        }`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">Numéro de téléphone associé</label>
                    <div className="flex gap-2">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2.5 rounded-lg text-sm text-zinc-500 font-semibold flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                        +{countryConfig.phonePrefix}
                      </span>
                      <input 
                        required
                        type="tel" 
                        value={phone.startsWith(countryConfig.phonePrefix) ? phone.substring(countryConfig.phonePrefix.length) : phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="812345678"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">Une demande d'approbation push PIN sera envoyée sur votre téléphone mobile.</p>
                  </div>
                </div>
              )}

              {/* Submit Payment action button */}
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <Link 
                  href="/instructor/billing"
                  className="px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-bold text-xs transition-colors"
                >
                  Annuler
                </Link>
                {method !== "paypal" && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      "Confirmer et Payer"
                    )}
                  </button>
                )}
              </div>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-teal-600 animate-spin" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
