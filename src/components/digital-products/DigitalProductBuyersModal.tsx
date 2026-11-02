"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Users,
  Search,
  DollarSign,
  Copy,
  Check,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Loader2,
  FileText,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  ExternalLink,
  Send,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export interface DigitalProductBuyer {
  id: string;
  purchaseId: string;
  transactionId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  avatarUrl?: string | null;
  pricePaid: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface DigitalProductBuyersModalProps {
  productId: string | null;
  productTitle?: string;
  productPrice?: number;
  productCoverUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DigitalProductBuyersModal({
  productId,
  productTitle,
  productPrice,
  productCoverUrl,
  isOpen,
  onClose,
}: DigitalProductBuyersModalProps) {
  const [buyers, setBuyers] = useState<DigitalProductBuyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [productMeta, setProductMeta] = useState<{
    title: string;
    price: number;
    cover_image_url: string;
  } | null>(null);

  // État du formulaire d'ajout / régularisation manuelle
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualMethod, setManualMethod] = useState("PAWAPAY");
  const [manualTxId, setManualTxId] = useState("");
  const [manualPrice, setManualPrice] = useState<number | string>("");
  const [manualSendEmail, setManualSendEmail] = useState(true);
  const [existingPaymentId, setExistingPaymentId] = useState<string | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBuyers = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/digital-products/${productId}/buyers`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de récupérer la liste des acheteurs.");
      }
      setBuyers(data.buyers || []);
      if (data.product) {
        setProductMeta(data.product);
        if (manualPrice === "") {
          setManualPrice(data.product.price);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      setSearch("");
      setCopiedId(null);
      setShowAddForm(false);
      setManualSuccessMsg(null);
      setGeneratedLink(null);
      setExistingPaymentId(null);
      fetchBuyers();
    } else {
      setBuyers([]);
      setError(null);
    }
  }, [isOpen, productId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenAddForm = (prefill?: {
    email?: string;
    name?: string;
    txId?: string;
    method?: string;
    price?: number;
    paymentId?: string;
  }) => {
    setManualSuccessMsg(null);
    setGeneratedLink(null);
    if (prefill) {
      setManualEmail(prefill.email && prefill.email !== "Email non renseigné" ? prefill.email : "");
      setManualName(prefill.name && prefill.name !== "Client Inconnu" ? prefill.name : "");
      setManualTxId(prefill.txId || "");
      setManualMethod(prefill.method?.toUpperCase() || "PAWAPAY");
      setManualPrice(prefill.price ?? productMeta?.price ?? productPrice ?? 9.99);
      setExistingPaymentId(prefill.paymentId || null);
    } else {
      setManualEmail("");
      setManualName("");
      setManualPhone("");
      setManualTxId("");
      setManualMethod("PAWAPAY");
      setManualPrice(productMeta?.price ?? productPrice ?? 9.99);
      setExistingPaymentId(null);
    }
    setShowAddForm(true);
  };

  const handleSubmitManualBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !manualEmail.trim() || !manualEmail.includes("@")) {
      alert("Veuillez renseigner une adresse email valide.");
      return;
    }

    setSubmittingManual(true);
    setManualSuccessMsg(null);
    setGeneratedLink(null);

    try {
      const res = await fetch(`/api/admin/digital-products/${productId}/buyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual_add",
          email: manualEmail.trim(),
          name: manualName.trim(),
          phone: manualPhone.trim(),
          paymentMethod: manualMethod,
          transactionId: manualTxId.trim(),
          pricePaid: Number(manualPrice) || productMeta?.price || productPrice || 9.99,
          sendEmail: manualSendEmail,
          existingPaymentId: existingPaymentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter cet acheteur.");
      }

      setManualSuccessMsg(data.message || "Acheteur ajouté et accès accordé avec succès !");
      if (data.downloadUrl) {
        setGeneratedLink(data.downloadUrl);
      }

      // Rafraîchir immédiatement la liste des acheteurs
      await fetchBuyers();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Vérifier en direct auprès de PawaPay
  const handleVerifyPawaPay = async (depositId: string, currentEmail?: string) => {
    if (!productId || !depositId) return;
    setActionLoadingId(depositId);
    try {
      const res = await fetch(`/api/admin/digital-products/${productId}/buyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_pawapay",
          depositId,
          buyerEmail: currentEmail && currentEmail !== "Email non renseigné" ? currentEmail : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.status === "COMPLETED") {
        alert("Succès ! PawaPay a confirmé le paiement. La transaction est maintenant PAYÉE et le client a reçu son lien.");
        await fetchBuyers();
      } else {
        alert(data.message || "Statut PawaPay : en attente ou non complété.");
      }
    } catch (err: any) {
      alert(`Erreur lors de la vérification PawaPay : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Copier le lien de téléchargement direct pour un client
  const handleGetDownloadLink = async (b: DigitalProductBuyer) => {
    if (!productId) return;
    const email = b.buyerEmail;
    if (!email || !email.includes("@")) {
      handleOpenAddForm({
        email: "",
        name: b.buyerName,
        txId: b.transactionId,
        method: b.paymentMethod,
        price: b.pricePaid,
        paymentId: b.id,
      });
      return;
    }

    setActionLoadingId(`link-${b.id}`);
    try {
      const res = await fetch(`/api/admin/digital-products/${productId}/buyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_download_link",
          email: email.trim(),
          purchaseId: b.purchaseId || b.id,
        }),
      });
      const data = await res.json();
      if (data.downloadUrl) {
        handleCopy(data.downloadUrl, `link-${b.id}`);
      } else {
        alert("Impossible de générer le lien.");
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBuyers = useMemo(() => {
    if (!search.trim()) return buyers;
    const q = search.toLowerCase();
    return buyers.filter(
      (b) =>
        b.buyerName.toLowerCase().includes(q) ||
        b.buyerEmail.toLowerCase().includes(q) ||
        b.transactionId.toLowerCase().includes(q) ||
        (b.buyerPhone && b.buyerPhone.toLowerCase().includes(q))
    );
  }, [buyers, search]);

  const totalCollected = useMemo(() => {
    return buyers
      .filter((b) => b.paymentStatus === "COMPLETED" || b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + (Number(b.pricePaid) || 0), 0);
  }, [buyers]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  const displayTitle = productMeta?.title || productTitle || "Détails du produit";
  const displayPrice = productMeta?.price ?? productPrice ?? 0;
  const displayCover = productMeta?.cover_image_url || productCoverUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-850/40">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative w-12 sm:w-14 h-14 sm:h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-sm">
              {displayCover ? (
                <Image
                  src={displayCover}
                  alt={displayTitle}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <FileText className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Users className="w-3 h-3" /> Acheteurs & Paiements
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Tarif : {displayPrice.toFixed(2)} $
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white truncate mt-1">
                {displayTitle}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Historique des clients et attribution manuelle d&apos;accès suite à paiement PawaPay / PayPal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchBuyers}
              disabled={loading}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats bar, Search & Action "Ajouter un acheteur" */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl">
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <strong className="text-purple-700 dark:text-purple-300 font-black">
                  {buyers.length}
                </strong>{" "}
                client{buyers.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <strong className="text-emerald-700 dark:text-emerald-300 font-black">
                  {totalCollected.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $
                </strong>{" "}
                encaissés
              </span>
            </div>

            <button
              onClick={() => handleOpenAddForm()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition hover:shadow cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Ajouter un acheteur manuel
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou ID..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Formulaire d'ajout / régularisation manuelle */}
        {showAddForm && (
          <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/20 dark:via-zinc-850 dark:to-zinc-900 border-b border-purple-200/60 dark:border-purple-900/40 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                    {existingPaymentId ? "Régulariser un paiement existant (PENDING)" : "Ajouter manuellement un acheteur"}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Attribue immédiatement l&apos;accès au produit digital, génère le lien de téléchargement sécurisé et envoie l&apos;e-mail de confirmation au client.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setManualSuccessMsg(null);
                  setGeneratedLink(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manualSuccessMsg && (
              <div className="p-4 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{manualSuccessMsg}</span>
                </div>
                {generatedLink && (
                  <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono truncate text-zinc-700 dark:text-zinc-300 select-all">
                      {generatedLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedLink, "manual-link")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition"
                    >
                      {copiedId === "manual-link" ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copier pour WhatsApp/SMS
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitManualBuyer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Email client */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email du client <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Nom du client */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nom complet (optionnel)
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="ex: Michel Kubali"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Téléphone Mobile Money (optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="+243 999 123 456"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="PAWAPAY">PawaPay (Mobile Money RDC)</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="M-PESA">M-Pesa (Vodacom)</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="AFRIMONEY">Afrimoney</option>
                    <option value="CARTE_BANCAIRE">Carte bancaire (Stripe/Visa)</option>
                    <option value="VIREMENT_CASH">Virement bancaire / Cash</option>
                    <option value="AUTRE">Autre mode manuel</option>
                  </select>
                </div>

                {/* ID de transaction */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ID / Réf transaction (PawaPay ou PayPal)
                  </label>
                  <input
                    type="text"
                    value={manualTxId}
                    onChange={(e) => setManualTxId(e.target.value)}
                    placeholder="ex: 8658eeec... ou 00713883RV..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Montant payé */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Montant payé ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Checkbox envoi email */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <input
                    type="checkbox"
                    checked={manualSendEmail}
                    onChange={(e) => setManualSendEmail(e.target.checked)}
                    className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Envoyer immédiatement l&apos;e-mail de livraison avec le lien de téléchargement direct</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingManual ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Valider et accorder l&apos;accès
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Content list / table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[250px]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-xs text-zinc-500 font-medium">Chargement des acheteurs...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchBuyers}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
              >
                Réessayer
              </button>
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {search ? "Aucun acheteur ne correspond à votre recherche." : "Aucun achat enregistré pour ce produit."}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                {search
                  ? "Vérifiez l'orthographe du nom, de l'email ou de l'identifiant."
                  : "Vous pouvez ajouter manuellement un acheteur qui a payé par Mobile Money ou PayPal via le bouton ci-dessus."}
              </p>
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3.5 py-3.5">Client / Acheteur</th>
                    <th className="px-3.5 py-3.5">Date & Heure</th>
                    <th className="px-3.5 py-3.5">Mode & ID de paiement</th>
                    <th className="px-3.5 py-3.5">Montant & Statut</th>
                    <th className="px-3.5 py-3.5 text-right">Actions rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {filteredBuyers.map((b) => {
                    const isCompleted = b.paymentStatus === "COMPLETED" || b.paymentStatus === "PAID";
                    const isPawaPay = b.paymentMethod.toLowerCase().includes("pawapay") || b.paymentMethod.toLowerCase().includes("mobile_money");

                    return (
                      <tr
                        key={b.id || b.transactionId}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Buyer Info */}
                        <td className="px-3.5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                              {b.buyerName && b.buyerName !== "Client Inconnu" ? b.buyerName.charAt(0) : (b.buyerEmail && b.buyerEmail.includes("@") ? b.buyerEmail.charAt(0).toUpperCase() : "C")}
                            </div>
                            <div className="min-w-0 max-w-[190px] sm:max-w-[220px]">
                              <p className="font-bold text-zinc-900 dark:text-white truncate">
                                {b.buyerName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className={`text-[11px] truncate ${b.buyerEmail === "Email non renseigné" ? "text-amber-600 dark:text-amber-400 font-semibold italic" : "text-zinc-500 dark:text-zinc-400"}`}>
                                  {b.buyerEmail}
                                </span>
                              </div>
                              {b.buyerPhone && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span className="text-[11px] text-zinc-400 truncate">
                                    {b.buyerPhone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-3.5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{formatDate(b.createdAt)}</span>
                          </div>
                        </td>

                        {/* Payment Method & Transaction ID */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              <CreditCard className="w-3 h-3" />
                              {b.paymentMethod}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                              <span className="truncate max-w-[120px] sm:max-w-[160px]" title={b.transactionId}>
                                {b.transactionId}
                              </span>
                              <button
                                onClick={() => handleCopy(b.transactionId, b.id)}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                                title="Copier l'identifiant de transaction"
                              >
                                {copiedId === b.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Amount & Status */}
                        <td className="px-3.5 py-3.5 whitespace-nowrap">
                          <p className="font-extrabold text-sm text-zinc-900 dark:text-white">
                            {Number(b.pricePaid).toFixed(2)} $
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mt-1 ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {isCompleted ? "PAYÉ" : b.paymentStatus}
                          </span>
                        </td>

                        {/* Actions rapides */}
                        <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCompleted ? (
                              <>
                                {/* Bouton régulariser manuellement */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenAddForm({
                                      email: b.buyerEmail,
                                      name: b.buyerName,
                                      txId: b.transactionId,
                                      method: b.paymentMethod,
                                      price: b.pricePaid,
                                      paymentId: b.id,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition"
                                  title="Valider manuellement ce paiement et délivrer l'accès"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Valider
                                </button>

                                {/* Bouton interroger PawaPay */}
                                {isPawaPay && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPawaPay(b.transactionId, b.buyerEmail)}
                                    disabled={actionLoadingId === b.transactionId}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] transition"
                                    title="Interroger les serveurs PawaPay en temps réel"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${actionLoadingId === b.transactionId ? "animate-spin text-purple-600" : ""}`} />
                                    Vérifier PawaPay
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Copier le lien de téléchargement direct pour WhatsApp/SMS */}
                                <button
                                  type="button"
                                  onClick={() => handleGetDownloadLink(b)}
                                  disabled={actionLoadingId === `link-${b.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                                  title="Générer et copier le lien direct de téléchargement du livre"
                                >
                                  {copiedId === `link-${b.id}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      Lien copié !
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Copier lien d&apos;accès
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/40 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filteredBuyers.length} transaction{filteredBuyers.length > 1 ? "s" : ""} affichée{filteredBuyers.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddForm()}
              className="px-3.5 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition cursor-pointer"
            >
              + Ajouter un acheteur
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
