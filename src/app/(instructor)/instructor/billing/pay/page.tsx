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
  const [method, setMethod] = useState<PaymentMethod>("mastercard");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPendingState, setShowPendingState] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  // Form Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [phone, setPhone] = useState("");
  const [carrier, setCarrier] = useState("mpesa");

  const [cryptoCoin, setCryptoCoin] = useState("usdt");
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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
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

  const checkPaymentStatus = async () => {
    if (!paymentId) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("status, failure_reason")
        .eq("id", paymentId)
        .maybeSingle();

      if (error) throw error;
      if (data?.status === "PAID") {
        setShowPendingState(false);
        handlePaymentSuccess();
      } else if (data?.status === "FAILED") {
        alert(`Le paiement a échoué : ${data.failure_reason || "Transaction refusée par l'opérateur."}`);
        setShowPendingState(false);
      } else {
        alert("Paiement toujours en attente. Assurez-vous d'avoir validé la notification sur votre téléphone mobile.");
      }
    } catch (err: any) {
      console.error("[instructor-pay] Status check error:", err);
      alert("Erreur lors de la vérification : " + (err.message || err));
    } finally {
      setVerifying(false);
    }
  };

  const simulateSuccess = async () => {
    if (!paymentId) return;
    setSimulating(true);
    try {
      const response = await fetch("/api/webhooks/mobile-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: `ins_plan_${paymentId}`,
          status: "Successful",
        }),
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
        const response = await fetch("/api/payments/moko-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: currentPlanDetails.price,
            phoneNumber: phone,
            carrier: carrier,
            type: "INSTRUCTOR_PLAN",
            itemId: plan,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Une erreur est survenue lors de l'initiation du paiement.");
        }

        setPaymentId(resData.paymentId);
        setShowPendingState(true);
      } catch (err: any) {
        alert(err.message || "Une erreur est survenue lors de l'appel de la passerelle.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Simulate other payment methods (mastercard, stripe, crypto) — update Supabase directly
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
            <p><strong>Téléphone :</strong> +243 {phone}</p>
            <p><strong>ID Transaction :</strong> {paymentId}</p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto pt-2">
            <button
              onClick={checkPaymentStatus}
              disabled={verifying}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-400 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification du paiement...</span>
                </>
              ) : (
                <span>J'ai saisi mon code PIN</span>
              )}
            </button>

            {/* Sandbox Simulation Button */}
            {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true") && (
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
                  <span>[Mode Test] Simuler validation Moko</span>
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
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: "mastercard", label: "Carte bancaire", icon: <CreditCard className="w-5 h-5" /> },
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
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Informations de Carte Bancaire</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">Nom du titulaire</label>
                      <input 
                        required
                        type="text" 
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        placeholder="Jean Dupont"
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">Numéro de carte</label>
                      <input 
                        required
                        type="text" 
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        placeholder="5412 7500 1234 5678"
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">Date d'expiration</label>
                        <input 
                          required
                          type="text" 
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">CVC / CVV</label>
                        <input 
                          required
                          type="password" 
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white text-center"
                        />
                      </div>
                    </div>
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
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Paiement en Cryptomonnaie (Stablecoin)</h4>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { id: "usdt", name: "Tether (USDT - TRC20)" },
                      { id: "usdc", name: "USD Coin (USDC - ERC20)" }
                    ].map((coin) => (
                      <div 
                        key={coin.id}
                        onClick={() => setCryptoCoin(coin.id)}
                        className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer text-center transition-all ${
                          cryptoCoin === coin.id 
                            ? "border-amber-500 bg-amber-50/10 text-amber-500" 
                            : "border-zinc-150 dark:border-zinc-800 hover:border-amber-300 text-zinc-500"
                        }`}
                      >
                        {coin.name}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-3 border border-zinc-150 dark:border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Adresse de dépôt officielle</p>
                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono break-all text-zinc-900 dark:text-zinc-200 select-all">
                      {cryptoCoin === "usdt" 
                        ? "TXz4P1Zk7R3xZc7tM9yK8wQvPqGfE1a9sD" 
                        : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                      }
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">Envoyez exactement le montant équivalent de <span className="font-bold">{currentPlanDetails.price} USDT/USDC</span> à cette adresse, puis collez l'ID de transaction (TXID) ci-dessous.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase mb-1">ID de transaction (TXID / Hash)</label>
                    <input 
                      required
                      type="text" 
                      value={cryptoTxId}
                      onChange={e => setCryptoTxId(e.target.value)}
                      placeholder="Collez le hash de votre transaction ici"
                      className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-transparent text-sm focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* 5. Mobile Money Form */}
              {method === "mobile_money" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Paiement Mobile Money local</h4>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { id: "mpesa", name: "M-Pesa", color: "border-red-500 bg-red-50/10 text-red-500" },
                      { id: "orange", name: "Orange Money", color: "border-orange-500 bg-orange-50/10 text-orange-500" },
                      { id: "airtel", name: "Airtel Money", color: "border-rose-500 bg-rose-50/10 text-rose-500" }
                    ].map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setCarrier(item.id)}
                        className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer text-center transition-all ${
                          carrier === item.id 
                            ? item.color 
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
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2.5 rounded-lg text-sm text-zinc-500 font-semibold flex items-center justify-center">+243</span>
                      <input 
                        required
                        type="tel" 
                        value={phone}
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
