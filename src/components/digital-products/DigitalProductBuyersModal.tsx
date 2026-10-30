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
  Clock,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
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
      fetchBuyers();
    } else {
      setBuyers([]);
      setError(null);
    }
  }, [isOpen, productId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-850/40">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-sm">
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
              <h2 className="text-lg font-black text-zinc-900 dark:text-white truncate mt-1">
                {displayTitle}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Historique des clients ayant acheté et payé ce produit numérique.
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

        {/* Stats bar & Search */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <strong className="text-purple-700 dark:text-purple-300 font-black">
                  {buyers.length}
                </strong>{" "}
                acheteur{buyers.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <strong className="text-emerald-700 dark:text-emerald-300 font-black">
                  {totalCollected.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $
                </strong>{" "}
                encaissés
              </span>
            </div>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou ID..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

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
                  : "Dès qu'un apprenant ou visiteur effectue un paiement, ses détails apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3.5">Client / Acheteur</th>
                    <th className="px-4 py-3.5">Date & Heure du paiement</th>
                    <th className="px-4 py-3.5">Mode & ID de paiement</th>
                    <th className="px-4 py-3.5 text-right">Montant & Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {filteredBuyers.map((b) => {
                    const isCompleted = b.paymentStatus === "COMPLETED" || b.paymentStatus === "PAID";
                    return (
                      <tr
                        key={b.id || b.transactionId}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Buyer Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                              {b.buyerName ? b.buyerName.charAt(0) : "C"}
                            </div>
                            <div className="min-w-0 max-w-[200px] sm:max-w-[240px]">
                              <p className="font-bold text-zinc-900 dark:text-white truncate">
                                {b.buyerName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
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
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{formatDate(b.createdAt)}</span>
                          </div>
                        </td>

                        {/* Payment Method & Transaction ID */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              <CreditCard className="w-3 h-3" />
                              {b.paymentMethod}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                              <span className="truncate max-w-[140px] sm:max-w-[190px]" title={b.transactionId}>
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
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
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
                            {isCompleted ? "Payé" : b.paymentStatus}
                          </span>
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
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {filteredBuyers.length} transaction{filteredBuyers.length > 1 ? "s" : ""} affichée{filteredBuyers.length > 1 ? "s" : ""}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
