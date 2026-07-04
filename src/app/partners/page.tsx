"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  MokoLogo, BinanceLogo, OKXLogo, McBuleliLogo, 
  PECBLogo, KivutechLogo, AnadecLogo 
} from "@/components/icons/PartnerLogos";
import { Handshake, ArrowRight, ShieldCheck, Cpu, Target } from "lucide-react";
import Link from "next/link";

const partnersList = [
  {
    name: "Moko afrika (Freshpay)",
    role: "Partenaire d'intégration de Paiement",
    desc: "Freshpay fournit l'infrastructure technique essentielle permettant aux formateurs de la plateforme Ansella d'encaisser les ventes de cours via Mobile Money (M-Pesa, Airtel Money, Orange Money) et de retirer leurs commissions instantanément.",
    logo: <MokoLogo className="w-12 h-12" />,
    color: "from-teal-500/10 to-indigo-500/5",
    border: "hover:border-teal-500/40"
  },
  {
    name: "Binance",
    role: "Partenaire Éducatif Blockchain",
    desc: "Le leader mondial des actifs numériques collabore avec nous pour propager l'éducation Web3 sur le continent. Nous mettons en œuvre des parcours d'apprentissage certifiants sur la blockchain et les crypto-monnaies.",
    logo: <BinanceLogo className="w-12 h-12" />,
    color: "from-yellow-500/10 to-amber-500/5",
    border: "hover:border-yellow-500/40"
  },
  {
    name: "OKX",
    role: "Infrastructure DeFi & Web3",
    desc: "OKX soutient les initiatives d'alphabétisation financière et technologique à travers l'Afrique. Nos formations intègrent des cas d'utilisation pratiques reposant sur le réseau et les solutions décentralisées d'OKX.",
    logo: <OKXLogo className="w-12 h-12 text-zinc-950 dark:text-white" />,
    color: "from-zinc-500/10 to-zinc-800/5",
    border: "hover:border-zinc-500/40"
  },
  {
    name: "McBuleli",
    role: "Accréditation & Ingénierie Pédagogique",
    desc: "McBuleli nous accompagne dans la structuration des programmes scolaires et l'évaluation professionnelle pour garantir que chaque cursus réponde aux standards du marché du travail.",
    logo: <McBuleliLogo className="w-12 h-12" />,
    color: "from-yellow-600/10 to-yellow-800/5",
    border: "hover:border-yellow-600/40"
  },
  {
    name: "PECB",
    role: "Organisme de Certification Globale",
    desc: "PECB collabore avec Ansella pour offrir des certifications internationales reconnues. Les formations dispensées donnent accès à des examens officiels validant les compétences en sécurité de l'information et management.",
    logo: <PECBLogo className="w-12 h-12" />,
    color: "from-blue-500/10 to-cyan-500/5",
    border: "hover:border-blue-500/40"
  },
  {
    name: "Kivutech",
    role: "Incubateur & Innovation technologique",
    desc: "Kivutech soutient l'innovation numérique locale à l'échelle régionale et internationale. Ce partenariat permet de sourcer les talents tech et de leur offrir des formations de haut niveau en intelligence artificielle et développement d'applications.",
    logo: <KivutechLogo className="w-12 h-12" />,
    color: "from-teal-600/10 to-emerald-500/5",
    border: "hover:border-teal-600/40"
  },
  {
    name: "Anadec",
    role: "Appui Institutionnel à l'Entrepreneuriat",
    desc: "L'Agence Nationale pour le Développement de l'Entrepreneuriat soutient nos initiatives d'autonomisation des jeunes créateurs en facilitant l'accès aux dispositifs d'accompagnement de l'État.",
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
              Écosystème Ansella
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Bâtir l&apos;avenir avec nos{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                partenaires de confiance.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Nous collaborons étroitement avec les leaders du Web3, des paiements mobiles et du développement entrepreneurial pour offrir des opportunités réelles d&apos;apprentissage et de croissance.
            </p>
          </div>

          {/* Key pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <ShieldCheck className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Sécurité & Fiabilité</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">Des certifications de classe mondiale et des transactions Mobile Money réglementées.</p>
            </div>
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <Cpu className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Technologie & Web3</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">Intégration poussée de l&apos;intelligence artificielle et des architectures de smart-contracts.</p>
            </div>
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 text-left space-y-3">
              <Target className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Impact Global</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">Des opportunités concrètes et adaptées aux réalités économiques de chaque marché.</p>
            </div>
          </div>

          {/* Partners Directory Grid */}
          <div className="space-y-8 pt-8">
            <div className="text-left border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Handshake className="w-5 h-5 text-teal-400" /> Répertoire des Partenaires
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">Découvrez comment chacun de nos partenaires contribue à la réussite des créateurs Ansella.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {partnersList.map((partner, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-br ${partner.color} bg-white/40 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-700/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 hover:shadow-lg transition-all ${partner.border} duration-300 text-left group`}
                >
                  {/* Logo block */}
                  <div className="shrink-0 w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {partner.logo}
                  </div>
                  
                  {/* Partner Information */}
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
              <h2 className="text-2xl md:text-3xl font-black">Devenir partenaire Ansella</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Vous souhaitez collaborer avec nous pour autonomiser les entrepreneurs numériques dans le monde ? Écrivez-nous pour initier un partenariat.
              </p>
            </div>
            <a 
              href="mailto:partners@ansella.app" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-950 font-bold text-xs transition-colors"
            >
              Nous contacter par email <ArrowRight className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
