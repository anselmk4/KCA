"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  PawaPayLogo, SolanaLogo, BinanceLogo, OKXLogo, McBuleliLogo, 
  PECBLogo, KivutechLogo, AnadecLogo 
} from "@/components/icons/PartnerLogos";
import { Handshake, ArrowRight, ShieldCheck, Cpu, Target } from "lucide-react";
import Link from "next/link";

const partnersList = [
  {
    name: "pawaPay",
    role: "Mobile Money Payment Infrastructure",
    desc: "pawaPay provides the global technical infrastructure for integrating mobile payments (Orange Money, Airtel Money, Vodacom M-Pesa, MTN MoMo, Wave), enabling secure course fee collection and automated instructor commission payouts.",
    logo: <PawaPayLogo className="w-14 h-14" />,
    color: "from-purple-500/10 to-indigo-500/5",
    border: "hover:border-purple-500/40"
  },
  {
    name: "Solana",
    role: "Blockchain Infrastructure & Web3 Ecosystem",
    desc: "The high-performance Solana blockchain powers our decentralized certificate anchoring infrastructure and enables instant crypto-asset settlements (SOL and SPL tokens) with minimal transaction fees.",
    logo: <SolanaLogo className="w-14 h-14" />,
    color: "from-emerald-500/10 to-cyan-500/5",
    border: "hover:border-emerald-500/40"
  },
  {
    name: "Binance",
    role: "Blockchain Educational Partner",
    desc: "The world leader in digital assets collaborates with us to spread Web3 education across the continent. We implement certified learning paths on blockchain and cryptocurrencies.",
    logo: <BinanceLogo className="w-12 h-12" />,
    color: "from-yellow-500/10 to-amber-500/5",
    border: "hover:border-yellow-500/40"
  },
  {
    name: "OKX",
    role: "DeFi & Web3 Infrastructure",
    desc: "OKX supports financial and technological literacy initiatives across Africa. Our training courses integrate practical use cases built on OKX&apos;s network and decentralized solutions.",
    logo: <OKXLogo className="w-12 h-12 text-zinc-950 dark:text-white" />,
    color: "from-zinc-500/10 to-zinc-800/5",
    border: "hover:border-zinc-500/40"
  },
  {
    name: "McBuleli",
    role: "Accreditation & Educational Engineering",
    desc: "McBuleli assists us in structuring school programs and professional assessment to ensure that each curriculum meets labor market standards.",
    logo: <McBuleliLogo className="w-12 h-12" />,
    color: "from-yellow-600/10 to-yellow-800/5",
    border: "hover:border-yellow-600/40"
  },
  {
    name: "PECB",
    role: "Global Certification Body",
    desc: "PECB collaborates with Ansella to offer internationally recognized certifications. The training delivered provides access to official exams validating skills in information security and management.",
    logo: <PECBLogo className="w-12 h-12" />,
    color: "from-blue-500/10 to-cyan-500/5",
    border: "hover:border-blue-500/40"
  },
  {
    name: "Kivutech",
    role: "Incubator & Technological Innovation",
    desc: "Kivutech supports local digital innovation at a regional and international scale. This partnership enables sourcing tech talent and providing them with high-level training in artificial intelligence and application development.",
    logo: <KivutechLogo className="w-12 h-12" />,
    color: "from-teal-600/10 to-emerald-500/5",
    border: "hover:border-teal-600/40"
  },
  {
    name: "Anadec",
    role: "Institutional Entrepreneurship Support",
    desc: "The National Agency for Entrepreneurship Development supports our youth empowerment initiatives by facilitating access to government-backed support programs.",
    logo: <AnadecLogo className="w-12 h-12" />,
    color: "from-sky-500/10 to-blue-600/5",
    border: "hover:border-sky-500/40"
  }
];

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-16 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Ansella Ecosystem
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Building the future with our{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                trusted partners.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              We work closely with leaders in Web3, mobile payments, and entrepreneurial development to offer real learning and growth opportunities.
            </p>
          </div>

          {/* Key pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <ShieldCheck className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Security &amp; Reliability</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">World-class certifications and regulated Mobile Money transactions.</p>
            </div>
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <Cpu className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Technology &amp; Web3</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">Advanced integration of artificial intelligence and smart-contract architectures.</p>
            </div>
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <Target className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Global Impact</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">Concrete opportunities adapted to the economic realities of each market.</p>
            </div>
          </div>

          {/* Partners Directory Grid */}
          <div className="space-y-8 pt-8">
            <div className="text-left border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Handshake className="w-5 h-5 text-teal-400" /> Partner Directory
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">Discover how each of our partners contributes to the success of Ansella creators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {partnersList.map((partner, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-br ${partner.color} bg-white/40 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-700/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 hover:shadow-lg transition-all ${partner.border} duration-300 text-left group`}
                >
                  <div className="shrink-0 w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {partner.logo}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-teal-450 dark:group-hover:text-teal-400 transition-colors leading-snug">{partner.name}</h3>
                      <p className="text-xs text-teal-650 dark:text-teal-500 font-semibold">{partner.role}</p>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {partner.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-br from-teal-900 to-indigo-950 dark:from-zinc-950 dark:to-zinc-900 border border-teal-850 dark:border-zinc-800 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden text-white shadow-2xl">
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-black">Become an Ansella Partner</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Would you like to collaborate with us to empower digital entrepreneurs worldwide? Write to us to initiate a partnership.
              </p>
            </div>
            <a 
              href="mailto:partners@ansella.app" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-950 font-bold text-xs transition-colors"
            >
              Contact us by email <ArrowRight className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
