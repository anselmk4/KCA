"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, Heart, ArrowRight, Share2, Sparkles, Download } from "lucide-react";
import { DonationSuccessSummary } from "../types";

interface DonationReceiptProps {
  summary: DonationSuccessSummary;
  onReset: () => void;
}

export function DonationReceipt({ summary, onReset }: DonationReceiptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    if (summary.reference) {
      navigator.clipboard.writeText(summary.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedDate = new Date(summary.createdAt || Date.now()).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-teal-500/30 shadow-2xl backdrop-blur-xl text-center">
      {/* Icon badge */}
      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-6 shadow-inner">
        <CheckCircle2 className="w-10 h-10 animate-bounce" />
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <Heart className="w-3.5 h-3.5 fill-rose-400" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
        Merci infiniment pour votre don !
      </h2>
      <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
        Votre générosité soutient directement la formation des futurs développeurs, créateurs et ingénieurs africains.
      </p>

      {/* Reçu box */}
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-3.5 mb-6 text-sm">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <span className="text-slate-400">Montant donné</span>
          <span className="text-xl font-bold text-teal-300">
            {summary.amount} {summary.currency}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Passerelle de paiement</span>
          <span className="font-medium text-white uppercase text-xs px-2.5 py-1 rounded-md bg-white/10">
            {summary.provider === "pawapay" ? "Mobile Money (PawaPay)" : "PayPal / Carte"}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="text-slate-400 shrink-0">Référence</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200 truncate">
            <span className="truncate max-w-[190px]">{summary.reference}</span>
            <button
              onClick={handleCopyReference}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Copier la référence"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {summary.donorName && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Donateur</span>
            <span className="text-white font-medium">{summary.donorName}</span>
          </div>
        )}

        {summary.donorEmail && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-300 text-xs">{summary.donorEmail}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Date & Heure</span>
          <span className="text-slate-300 text-xs">{formattedDate}</span>
        </div>

        {summary.message && (
          <div className="pt-2 border-t border-white/10">
            <span className="text-xs text-slate-400 block mb-1">Votre mot d&apos;encouragement :</span>
            <p className="text-xs italic text-teal-200/90 bg-teal-950/30 p-2.5 rounded-lg border border-teal-800/30">
              « {summary.message} »
            </p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition"
          type="button"
        >
          Faire un autre don
        </button>

        <Link
          href="/courses"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/20 transition"
        >
          <span>Découvrir l&apos;académie</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
