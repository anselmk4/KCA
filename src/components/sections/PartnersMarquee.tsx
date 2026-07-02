"use client";

import React from "react";
import { 
  MokoLogo, BinanceLogo, OKXLogo, McBuleliLogo, 
  PECBLogo, KivutechLogo, AnadecLogo 
} from "@/components/icons/PartnerLogos";

const partners = [
  { name: "Moko afrika", logo: <MokoLogo className="w-6 h-6 shrink-0" /> },
  { name: "Binance", logo: <BinanceLogo className="w-6 h-6 shrink-0" /> },
  { name: "OKX", logo: <OKXLogo className="w-6 h-6 shrink-0 text-zinc-950 dark:text-white" /> },
  { name: "McBuleli", logo: <McBuleliLogo className="w-6 h-6 shrink-0" /> },
  { name: "PECB", logo: <PECBLogo className="w-6 h-6 shrink-0" /> },
  { name: "Kivutech", logo: <KivutechLogo className="w-6 h-6 shrink-0" /> },
  { name: "Anadec RDC", logo: <AnadecLogo className="w-6 h-6 shrink-0" /> }
];

export function PartnersMarquee() {
  // Double the list to make the loop seamless
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-12 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-white/5 overflow-hidden relative">
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
          animation: marquee 30s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="container mx-auto px-4 md:px-8 mb-6 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
          Partenaires Académiques & Technologiques
        </p>
      </div>

      {/* Marquee track */}
      <div className="relative w-full flex items-center overflow-hidden py-4">
        {/* Left gradient overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-slate-100 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
        
        {/* Right gradient overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-slate-100 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="marquee-inner">
          {duplicatedPartners.map((partner, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 mx-8 md:mx-12 py-2.5 px-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-105">
                {partner.logo}
              </div>
              <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
