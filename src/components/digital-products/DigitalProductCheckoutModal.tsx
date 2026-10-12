"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  CreditCard,
  Bitcoin,
  ShieldCheck,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Lock,
} from "lucide-react";
import { getPawaPayConfigForCountry, PAWAPAY_FEE_RATE } from "@/lib/pawapay";
import { OperatorLogo } from "@/components/icons/PaymentLogos";
import { SolanaQrCode } from "@/components/ui/SolanaQrCode";
import { BitcoinQrCode } from "@/components/ui/BitcoinQrCode";
import { SOLANA_TREASURY_ADDRESS, getSolanaPayUri } from "@/lib/crypto";

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url: string;
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
  const [method, setMethod] = useState<"momo" | "card" | "crypto_sol" | "crypto_btc">("momo");
  const [userCountry, setUserCountry] = useState("CD");
  const [momoProvider, setMomoProvider] = useState("VODACOM_MPESA_COD");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !product) return null;

  const countryConfig =
    getPawaPayConfigForCountry(userCountry) || getPawaPayConfigForCountry("CD")!;
  const price = Number(product.price);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Veuillez renseigner votre adresse email pour recevoir votre accès.");
      return;
    }

    if (method === "momo" && !phoneNumber) {
      setErrorMsg("Veuillez saisir votre numéro Mobile Money pour la validation du paiement.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/digital-products/${product.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: method === "momo" ? "momo" : method.startsWith("crypto") ? "crypto" : "card",
          phoneNumber,
          operator: momoProvider,
          userEmail: email,
          userName: name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du paiement.");
      }

      setCompleted(true);
      const url = data.downloadUrl || `/api/digital-products/${product.id}/download`;
      setDownloadUrl(url);
      if (onSuccess) {
        onSuccess(url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Achat Sécurisé Immédiat</h3>
              <p className="text-xs text-teal-200/70">Paiement fluide en Mobile Money, Carte ou Crypto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Recap */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="w-14 h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-zinc-300 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.cover_image_url || "/placeholder-course.jpg"}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
              {product.category || "Produit Digital (PDF/Ebook)"}
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {product.title}
            </h4>
            <p className="text-xs text-zinc-500 truncate">{product.file_name || "Document numérique téléchargeable"}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-zinc-400 block line-through">$25.00</span>
            <span className="text-lg font-black text-teal-600 dark:text-teal-400">
              ${price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {completed ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  Paiement Validé avec Succès !
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Votre achat a été enregistré. Un email de confirmation a été envoyé à <strong>{email}</strong>.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={downloadUrl}
                  download
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/20 text-sm transition-all"
                >
                  <Download className="w-5 h-5" /> Télécharger mon Produit Numérique
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Méthodes de paiement */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Moyen de Paiement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("momo")}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === "momo"
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px]">Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === "card"
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px]">Carte Bancaire</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("crypto_sol")}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method.startsWith("crypto")
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 font-bold text-teal-700 dark:text-teal-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Bitcoin className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px]">Crypto</span>
                  </button>
                </div>
              </div>

              {/* Champs Coordonnées */}
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

              {/* Détails Spécifiques MOMO */}
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
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                      >
                        <option value="CD">🇨🇩 RDC (Congo Kinshasa)</option>
                        <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                        <option value="SN">🇸🇳 Sénégal</option>
                        <option value="CM">🇨🇲 Cameroun</option>
                        <option value="BJ">🇧🇯 Bénin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Opérateur Mobile Money
                      </label>
                      <select
                        value={momoProvider}
                        onChange={(e) => setMomoProvider(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-medium"
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
                      Numéro de Téléphone {countryConfig.names?.[0] || countryConfig.countryCode}
                    </label>
                    <div className="flex">
                      <span className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-200 dark:border-zinc-700 rounded-l-xl text-xs font-bold text-zinc-500 flex items-center">
                        {countryConfig.phonePrefix}
                      </span>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 812345678"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-r-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Détails Crypto */}
              {method.startsWith("crypto") && (
                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Scannez ou envoyez l&apos;équivalent de <strong>${price.toFixed(2)} USD</strong> en crypto pour validation instantanée.
                  </p>
                  <div className="flex justify-center py-2">
                    <SolanaQrCode
                      value={getSolanaPayUri({
                        amount: price,
                        label: "Ansella Digital Store",
                        memo: `DP-${product.id.substring(0, 8).toUpperCase()}`,
                      }) || SOLANA_TREASURY_ADDRESS}
                      size={180}
                      showAnsellaLogo={true}
                    />
                  </div>
                </div>
              )}

              {/* Bouton de paiement */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/25 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement de la commande...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Payer ${price.toFixed(2)} & Télécharger
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Paiement crypté SSL 256-bit · Accès immédiat garanti
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
