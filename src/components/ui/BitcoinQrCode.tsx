"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode, ShieldCheck, Loader2, Bitcoin } from "lucide-react";
import { BITCOIN_TREASURY_ADDRESS, getBip21BitcoinUri } from "@/lib/bitcoin";

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
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const bip21Uri = getBip21BitcoinUri({
    address: BITCOIN_TREASURY_ADDRESS,
    amountBtc: btcAmount,
    label,
    message: "Règlement Formation Kuettu",
  });

  useEffect(() => {
    let isMounted = true;
    if (!bip21Uri) return;

    // Generate local high-res QR code with data URL (no external HTTP calls needed)
    QRCode.toDataURL(bip21Uri, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 1,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("[BitcoinQrCode] Failed to generate QR code locally:", err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [bip21Uri]);

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
    <div className="p-4 sm:p-6 rounded-3xl bg-zinc-950 border border-amber-500/30 text-white space-y-5 shadow-2xl relative overflow-hidden w-full max-w-full">
      
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3.5">
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs sm:text-sm">
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
          <span>Paiement Bitcoin On-Chain (BIP21)</span>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider shrink-0">
          <ShieldCheck className="w-3 h-3" /> SegWit Native
        </span>
      </div>

      {/* QR Code Container & Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 min-w-0">
        
        {/* Local Canvas / QR Code Render */}
        <div className="relative flex items-center justify-center bg-white p-3 rounded-2xl border-2 border-amber-500/30 shadow-xl shrink-0 w-44 h-44 sm:w-48 sm:h-48">
          {!dataUrl && !error ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-amber-600">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-[10px] font-bold">Génération QR...</span>
            </div>
          ) : error ? (
            <div className="text-center p-2 text-red-600 text-xs font-semibold">
              Erreur d&apos;affichage QR
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl!}
                alt="Bitcoin Payment QR Code"
                className="w-full h-full object-contain rounded-lg"
              />
              {/* Central BTC Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-zinc-950" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Amount & Treasury Details */}
        <div className="space-y-4 flex-1 min-w-0 w-full text-center sm:text-left">
          
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Montant exact à envoyer (BTC)
            </span>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight break-all">
                {btcAmount.toFixed(8)} BTC
              </span>
              <button
                type="button"
                onClick={copyAmountToClipboard}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors shrink-0 cursor-pointer"
                title="Copier le montant BTC"
              >
                {copiedAmount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium break-words">
              Équivalent : <span className="font-bold text-white">${usdAmount} USD</span> (Taux du marché spot)
            </p>
          </div>

          {/* Treasury Address Box */}
          <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Adresse de Trésorerie Bitcoin
              </span>
              <button
                type="button"
                onClick={copyAddressToClipboard}
                className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-extrabold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copier
                  </>
                )}
              </button>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <code className="text-xs font-mono text-amber-200/90 break-all select-all block leading-relaxed font-semibold">
                {BITCOIN_TREASURY_ADDRESS}
              </code>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Instructions */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-medium">
        ⚡ <strong>Instructions :</strong> Scannez le QR Code avec votre application Bitcoin (Binance, Trust, Electrum, Coinbase...) ou copiez l&apos;adresse ci-dessus. Une fois le transfert envoyé, copiez le <strong>Hash de transaction (TxID)</strong> ci-dessous pour valider immédiatement votre accès.
      </div>

    </div>
  );
}
