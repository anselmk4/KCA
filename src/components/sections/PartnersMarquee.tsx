"use client";

import React from "react";
import { 
  AirtelMoneyLogo, MPesaLogo, OrangeMoneyLogo, PayPalLogo, 
  SolanaLogo, EthereumLogo, TetherLogo, MoovLogo, WaveLogo, MtnMomoLogo 
} from "@/components/icons/PaymentLogos";
import { Wallet, Smartphone, ShieldCheck, Sparkles } from "lucide-react";

const payments = [
  { name: "Airtel Money", logo: <AirtelMoneyLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Vodacom M-Pesa", logo: <MPesaLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Orange Money", logo: <OrangeMoneyLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "PayPal", logo: <PayPalLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Solana", logo: <SolanaLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Ethereum", logo: <EthereumLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "USDT Tether", logo: <TetherLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Moov Money", logo: <MoovLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "Wave", logo: <WaveLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
  { name: "MTN MoMo", logo: <MtnMomoLogo className="w-9 h-9 shrink-0 rounded-xl" /> },
];

export function PartnersMarquee() {
  // Double the list to make the loop seamless
  const duplicatedPayments = [...payments, ...payments, ...payments];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50/40 dark:from-zinc-950 dark:to-zinc-900/40 border-b border-zinc-200/80 dark:border-white/5 overflow-hidden relative">
      {/* Inline styles for the marquee keyframes to ensure it runs seamlessly */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33333%);
          }
        }
        .marquee-inner {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="container mx-auto px-6 md:px-12 max-w-7xl mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Captivating Message Section */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>L'avantage concurrentiel d'Ansella</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Démocratisez l'accès à vos formations grâce aux <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">paiements locaux</span>
            </h2>
            
            <p className="text-sm md:text-base text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Contrairement aux LMS traditionnels occidentaux qui imposent l'usage exclusif de cartes bancaires internationales ou de comptes PayPal, Ansella intègre nativement les <strong>Mobile Money</strong> et les <strong>Cryptomonnaies</strong>. 
            </p>
            <p className="text-sm md:text-base text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Permettez à des millions d'apprenants en Afrique et dans le monde de s'inscrire instantanément et de débloquer vos formations avec leurs moyens de paiement quotidiens.
            </p>
          </div>

          {/* Core Feature Value Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Mobile Money Natif</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                M-Pesa, Orange Money, Airtel, MTN MoMo, Wave et Moov. Vos étudiants paient directement avec leur téléphone portable en quelques secondes.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Web3 & Cryptomonnaies</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Ethereum, Solana et USDT. Ouvrez vos cours à une audience technophile internationale sans frais de conversion bancaire abusifs.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Marquee Title */}
      <div className="container mx-auto px-6 md:px-12 max-w-7xl mb-6">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest text-center lg:text-left">
          Méthodes de paiement entièrement intégrées & automatisées
        </p>
      </div>

      {/* Marquee track */}
      <div className="relative w-full flex items-center overflow-hidden py-4 bg-slate-50/50 dark:bg-zinc-900/20 border-y border-zinc-100 dark:border-white/5">
        {/* Left gradient overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
        
        {/* Right gradient overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="marquee-inner">
          {duplicatedPayments.map((payment, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3.5 mx-5 md:mx-7 py-3 px-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all cursor-pointer group shrink-0"
            >
              <div className="transition-transform group-hover:scale-105">
                {payment.logo}
              </div>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {payment.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
