"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Smartphone,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_PILLARS = [
  {
    id: "ebooks",
    icon: BookOpen,
    badge: "PDF / E-books",
    color: "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800/60",
    glow: "group-hover:border-teal-500/40",
    titleFr: "E-books & Guides Pratiques",
    titleEn: "E-books & Practical Guides",
    descFr: "Synthèses condensées, manuels de trading, feuilles de route Web3 et guides pas-à-pas à emporter partout.",
    descEn: "Concise summaries, trading manuals, Web3 roadmaps, and step-by-step guides you can take anywhere.",
    pointsFr: ["Téléchargement immédiat en PDF", "Accessible sans abonnement", "Consultable sur mobile & PC"],
    pointsEn: ["Instant PDF download", "No subscription required", "Readable on mobile & desktop"],
  },
  {
    id: "templates",
    icon: Layers,
    badge: "Templates",
    color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/60",
    glow: "group-hover:border-purple-500/40",
    titleFr: "Modèles & Tableaux de Bord",
    titleEn: "Templates & Dashboards",
    descFr: "Espaces Notion complets, maquettes Figma UI, feuilles de calcul Excel pour gérer vos finances et projets.",
    descEn: "Ready-to-use Notion workspaces, Figma UI kits, and Excel models to track finances and projects.",
    pointsFr: ["Templates Notion prêts à dupliquer", "Tableurs de gestion de portefeuille", "Kits graphiques & wireframes"],
    pointsEn: ["Ready-to-duplicate Notion hubs", "Portfolio tracking spreadsheets", "Graphic kits & UI wireframes"],
  },
  {
    id: "prompts",
    icon: Sparkles,
    badge: "Packs IA",
    color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
    glow: "group-hover:border-amber-500/40",
    titleFr: "Prompts & Datasets IA",
    titleEn: "AI Prompts & Datasets",
    descFr: "Bibliothèques de prompts calibrés pour ChatGPT, Claude et Midjourney afin de démultiplier vos résultats.",
    descEn: "Calibrated prompt libraries for ChatGPT, Claude, and Midjourney to multiply your daily output.",
    pointsFr: ["Prompts avancés business & dev", "Formules de copywriting & analyse", "Mises à jour régulières"],
    pointsEn: ["Advanced business & dev prompts", "Copywriting & research formulas", "Regularly updated packs"],
  },
  {
    id: "scripts",
    icon: FileCode,
    badge: "Code / ZIP",
    color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
    glow: "group-hover:border-blue-500/40",
    titleFr: "Scripts, Outils & Code (ZIP)",
    titleEn: "Scripts, Code & Tools (ZIP)",
    descFr: "Smart contracts Solidity audités, snippets Python et micro-logiciels prêts à déployer immédiatement.",
    descEn: "Audited Solidity smart contracts, Python snippets, and ready-to-deploy utility micro-tools.",
    pointsFr: ["Archives ZIP complètes", "Code documenté & prêt à l'emploi", "Boilerplates et micro-bots"],
    pointsEn: ["Complete ZIP archives", "Documented & clean codebases", "Boilerplates and micro-bots"],
  },
];

export function DigitalProductsSpotlight() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <section className="relative py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20">
      {/* Conteneur Clair, Élégant et Lumineux (Style UI/UX Premium) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden border border-teal-500/25 bg-white/80 dark:bg-zinc-900/70 shadow-xl shadow-teal-500/5 backdrop-blur-xl text-zinc-900 dark:text-white"
      >
        {/* Lueurs douces et claires en arrière-plan */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/10 dark:bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d94880a_1px,transparent_1px),linear-gradient(to_bottom,#0d94880a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-60" />

        <div className="relative z-10 space-y-10 sm:space-y-12">
          {/* ── EN-TÊTE PRINCIPAL (LUMINEUX & IMPACTANT) ── */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Badge pill raffiné */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-700/60 bg-teal-50/80 dark:bg-teal-950/60 px-4 py-1.5 text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="uppercase tracking-wider">
                {isEn ? "Digital Store • Zero Waiting Time" : "Boutique Digitale • Téléchargement Immédiat"}
              </span>
              <span className="hidden sm:inline-block bg-teal-600/10 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                {isEn ? "Instant Delivery" : "Accès 24/7"}
              </span>
            </div>

            {/* Titre Principal */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-zinc-900 dark:text-white">
              {isEn ? "Practical Knowledge You Can Use " : "Des Ressources Pratiques à Utiliser "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 dark:from-teal-400 dark:via-emerald-300 dark:to-cyan-400 bg-clip-text text-transparent">
                {isEn ? "Right Now" : "Dès Aujourd'hui"}
              </span>
            </h2>

            {/* Sous-titre aéré et lisible */}
            <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "No need to wait for a scheduled cohort to level up! Download battle-tested e-books, Notion templates, AI prompt packs, and code scripts created by vetted experts. Buy in seconds via Mobile Money or Crypto and take action today."
                : "Pas besoin d'attendre une session en direct pour progresser ! Téléchargez dès maintenant des e-books spécialisés, des templates Notion, des packs de prompts IA et des scripts de code conçus par des experts certifiés. Réglez simplement par Mobile Money ou Crypto."}
            </p>
          </div>

          {/* ── LES 4 PILIERS DE PRODUITS DIGITAUX (CARTES CLAIRES ET MODERNES) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {CATEGORY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className={`p-6 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group ${pillar.glow}`}
                >
                  <div className="space-y-4">
                    {/* Icône + Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-sm ${pillar.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                        {pillar.badge}
                      </span>
                    </div>

                    {/* Titre & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {isEn ? pillar.titleEn : pillar.titleFr}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                        {isEn ? pillar.descEn : pillar.descFr}
                      </p>
                    </div>

                    {/* Points clés UI/UX */}
                    <ul className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {(isEn ? pillar.pointsEn : pillar.pointsFr).map((pt, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BARRE DE RÉASSURANCE & BÉNÉFICES (STYLE MODERNE & AIRY) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-zinc-900/50 border border-teal-100 dark:border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Instant Download 24/7" : "Téléchargement Immédiat 24/7"}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isEn ? "Access files right after purchase" : "Accès direct au PDF ou ZIP sans attente"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-zinc-900/50 border border-emerald-100 dark:border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isEn ? "PayPal, Mobile Money & Crypto" : "PayPal, Mobile Money & Crypto"}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isEn ? "PayPal, M-Pesa, Orange, MTN, USDT, BTC" : "PayPal, M-Pesa, Orange, Airtel, MTN, USDT, BTC"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-zinc-900/50 border border-amber-100 dark:border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Affordable & Fair Pricing" : "Tarifs Clairs & Accessibles"}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isEn ? "High-value resources for every budget" : "Des ressources de valeur adaptées à tous les budgets"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-zinc-900/50 border border-indigo-100 dark:border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Expert-Crafted" : "Qualité Vérifiée"}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isEn ? "100% vetted by certified trainers" : "Conçu par des praticiens du terrain"}
                </p>
              </div>
            </div>
          </div>

          {/* ── BANNIÈRE D'APPEL À L'ACTION : VISITER LA BOUTIQUE OU VENDRE (DESIGN CLAIR) ── */}
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-teal-50 via-white to-emerald-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-teal-950/40 border border-teal-500/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isEn ? "Ready to explore or sell?" : "Explorer la boutique ou publier vos ressources"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {isEn
                  ? "Access the Digital Store or Monetize Your Expertise"
                  : "Accédez à la Boutique Digitale ou Monétisez Vos Connaissances"}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-xl">
                {isEn
                  ? "Find practical guides to download in one click, or join our instructor marketplace to sell your templates and receive automated payouts."
                  : "Trouvez des ressources téléchargeables en un clic, ou rejoignez notre espace formateurs pour publier vos e-books et percevoir vos revenus automatiquement."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/store"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm transition-all shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isEn ? "Explore Digital Store" : "Explorer la Boutique Digitale"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/instructor/courses"
                className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isEn ? "Sell My Products" : "Vendre mes Produits"}</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
