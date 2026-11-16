"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, Heart, ArrowRight } from "lucide-react";
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
    <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-teal-500/30 shadow-2xl text-center transition-colors">
      {/* Icon badge */}
      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/30 text-teal-600 dark:text-teal-400 mb-6 shadow-inner">
        <CheckCircle2 className="w-10 h-10 animate-bounce" />
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
          <Heart className="w-3.5 h-3.5 fill-rose-500" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        Merci infiniment pour votre don !
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
        Votre générosité soutient directement la formation des futurs talents et l&apos;accès à l&apos;éducation technologique.
      </p>

      {/* Reçu box */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-left space-y-3.5 mb-6 text-sm">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
          <span className="text-slate-500 dark:text-slate-400">Montant versé</span>
          <span className="text-2xl font-black text-teal-600 dark:text-teal-300">
            {summary.amount} {summary.currency}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Moyen de paiement</span>
          <span className="font-semibold text-slate-800 dark:text-white uppercase text-xs px-2.5 py-1 rounded-md bg-slate-200/70 dark:bg-white/10">
            {summary.provider === "pawapay" ? "Mobile Money" : "PayPal / Carte"}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 shrink-0">Référence</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
            <span className="truncate max-w-[190px]">{summary.reference}</span>
            <button
              onClick={handleCopyReference}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
              title="Copier la référence"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {summary.donorName && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Donateur</span>
            <span className="text-slate-900 dark:text-white font-semibold">{summary.donorName}</span>
          </div>
        )}

        {summary.donorEmail && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="text-slate-700 dark:text-slate-300 text-xs">{summary.donorEmail}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400">Date</span>
          <span className="text-slate-700 dark:text-slate-300 text-xs">{formattedDate}</span>
        </div>

        {summary.message && (
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Message d&apos;encouragement :</span>
            <p className="text-xs italic text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/30 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/30">
              « {summary.message} »
            </p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white text-sm font-semibold transition"
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
