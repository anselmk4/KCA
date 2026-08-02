"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Copy, Check, QrCode, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import {
  BITCOIN_TREASURY_ADDRESS,
  getBip21BitcoinUri,
  getBitcoinQrCodeUrl,
} from "@/lib/bitcoin";

interface BitcoinQrCodeProps {
  usdAmount: number;
  btcAmount: number;
  label?: string;
}

export function BitcoinQrCode({
  usdAmount,
  btcAmount,
  label = "Kuettu Crypto Academy",
}: BitcoinQrCodeProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const bip21Uri = getBip21BitcoinUri({
    address: BITCOIN_TREASURY_ADDRESS,
    amountBtc: btcAmount,
    label,
    message: "Règlement Formation Kuettu",
  });

  const qrImageUrl = getBitcoinQrCodeUrl(bip21Uri, 280);

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(BITCOIN_TREASURY_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyAmountToClipboard = () => {
    navigator.clipboard.writeText(btcAmount.toFixed(8));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-950 border border-amber-500/30 text-white space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
          <QrCode className="w-5 h-5 text-amber-400" />
          <span>Paiement Bitcoin On-Chain (BIP21)</span>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" /> SegWit Native
        </span>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="bg-white p-3.5 rounded-2xl shadow-xl border-4 border-amber-500/20 shrink-0 relative group">
          <Image
            src={qrImageUrl}
            alt="Bitcoin Payment QR Code"
            width={200}
            height={200}
            className="rounded-lg object-contain"
            unoptimized
          />
        </div>

        <div className="space-y-4 flex-1 text-center sm:text-left">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Montant exact à envoyer (BTC)
            </span>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {btcAmount.toFixed(8)} BTC
              </span>
              <button
                type="button"
                onClick={copyAmountToClipboard}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Copier le montant BTC"
              >
                {copiedAmount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Équivalent : <span className="font-bold text-white">${usdAmount} USD</span> (Taux du marché spot)
            </p>
          </div>

          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Adresse de Trésorerie Bitcoin
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-zinc-200 truncate select-all">
                {BITCOIN_TREASURY_ADDRESS}
              </code>
              <button
                type="button"
                onClick={copyAddressToClipboard}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-extrabold transition-colors shrink-0 flex items-center gap-1"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-medium">
        ⚡ <strong>Instructions :</strong> Scannez le QR Code avec votre application Bitcoin (Binance, Trust, Electrum, Coinbase...) ou copiez l&apos;adresse ci-dessus. Une fois le transfert envoyé, copiez le <strong>Hash de transaction (TxID)</strong> ci-dessous pour valider immédiatement votre accès.
      </div>

    </div>
  );
}
