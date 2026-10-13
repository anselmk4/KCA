"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Download,
  BookOpen,
  FileCode,
  Layers,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Smartphone,
  FileText,
  Clock,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";

interface DigitalProductItem {
  id: string;
  author_id?: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  category: string;
  tags?: string[];
  profiles?: {
    id?: string;
    full_name?: string;
    avatar_url?: string;
    specialty?: string;
    academy_name?: string;
  };
}

// Produits vedettes modèles / démonstration si la base de données est vide
const CURATED_SHOWCASE_PRODUCTS: DigitalProductItem[] = [
  {
    id: "sample-1",
    title: "Guide Ultime : Développeur Smart Contracts & Sécurité Web3",
    description: "Guide exhaustif pas-à-pas avec architectures Solidity, patterns de sécurité et checklists d'audit professionnelles.",
    price: 19.99,
    cover_image_url: "",
    file_url: "/samples/sample-smart-contracts.pdf",
    category: "Blockchain, Web3 & Crypto",
    tags: ["Solidity", "Smart Contracts", "Audit"],
    profiles: {
      full_name: "Dr. K. Anselme",
      academy_name: "Ansella Crypto Lab",
      specialty: "Architecte Web3",
    },
  },
  {
    id: "sample-2",
    title: "Pack Master 500+ Prompts IA Productivité & Business",
    description: "Prompts avancés testés pour ChatGPT, Claude et Midjourney. Automatisez vos analyses de marché, rédaction et synthèses.",
    price: 12.5,
    cover_image_url: "",
    file_url: "/samples/sample-prompts-ia.pdf",
    category: "Prompts & Datasets IA",
    tags: ["ChatGPT", "Claude", "Productivité"],
    profiles: {
      full_name: "Sarah M.",
      academy_name: "AI Solutions",
      specialty: "Prompt Engineer",
    },
  },
  {
    id: "sample-3",
    title: "Template Notion & Dashboard Suivi de Portefeuille Crypto",
    description: "Système clé en main pour gérer ses investissements, suivre ses gains/pertes et journaliser ses transactions de trading.",
    price: 9.99,
    cover_image_url: "",
    file_url: "/samples/sample-template-notion.pdf",
    category: "Modèles & Templates (Notion, Figma, Canva, Excel)",
    tags: ["Notion", "Trading", "Portfolio"],
    profiles: {
      full_name: "Marc Kabamba",
      academy_name: "KCA Traders",
      specialty: "Analyste Financier",
    },
  },
  {
    id: "sample-4",
    title: "Scripts Python & Micro-Bots d'Automatisation Trading",
    description: "Archive ZIP de scripts Python prêts à exécuter pour surveiller les prix, alertes Telegram et calcul d'indicateurs techniques.",
    price: 24.0,
    cover_image_url: "",
    file_url: "/samples/sample-trading-bots.zip",
    file_name: "trading-scripts-v2.zip",
    category: "Logiciels & Scripts (ZIP / Code)",
    tags: ["Python", "Trading Bot", "ZIP"],
    profiles: {
      full_name: "Dev Squad KCA",
      academy_name: "KCA Tech",
      specialty: "Ingénieur Logiciel",
    },
  },
];

const CATEGORY_PILLARS = [
  {
    id: "ebooks",
    icon: BookOpen,
    color: "from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30",
    badge: "PDF / E-books",
    titleFr: "E-books & Guides Pratiques",
    titleEn: "E-books & Practical Guides",
    descFr: "Synthèses condensées, manuels de trading, feuilles de route Web3 et guides pas-à-pas à emporter partout.",
    descEn: "Concise summaries, trading manuals, Web3 roadmaps, and step-by-step guides you can take anywhere.",
  },
  {
    id: "templates",
    icon: Layers,
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    badge: "Templates",
    titleFr: "Modèles & Tableaux de Bord",
    titleEn: "Templates & Dashboards",
    descFr: "Espaces Notion complets, maquettes Figma UI, feuilles de calcul Excel pour gérer vos finances et projets.",
    descEn: "Ready-to-use Notion workspaces, Figma UI kits, and Excel models to track finances and projects.",
  },
  {
    id: "prompts",
    icon: Sparkles,
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    badge: "Packs IA",
    titleFr: "Prompts & Datasets IA",
    titleEn: "AI Prompts & Datasets",
    descFr: "Bibliothèques de prompts calibrés pour ChatGPT, Claude et Midjourney afin de démultiplier vos résultats.",
    descEn: "Calibrated prompt libraries for ChatGPT, Claude, and Midjourney to multiply your daily output.",
  },
  {
    id: "scripts",
    icon: FileCode,
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    badge: "Code / ZIP",
    titleFr: "Scripts, Outils & Code (ZIP)",
    titleEn: "Scripts, Code & Tools (ZIP)",
    descFr: "Smart contracts Solidity audités, snippets Python et micro-logiciels prêts à déployer immédiatement.",
    descEn: "Audited Solidity smart contracts, Python snippets, and ready-to-deploy utility micro-tools.",
  },
];

export function DigitalProductsSpotlight() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [dbProducts, setDbProducts] = useState<DigitalProductItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<DigitalProductItem | null>(null);
  const [selectedBuy, setSelectedBuy] = useState<DigitalProductItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch("/api/digital-products?limit=4");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.products) && data.products.length > 0) {
            setDbProducts(data.products);
          }
        }
      } catch (err) {
        console.warn("[DigitalProductsSpotlight] Using fallback showcase items:", err);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Afficher les vrais produits de la base de données s'ils existent, sinon les produits de démonstration sélectionnés
  const displayProducts = dbProducts.length > 0 ? dbProducts : CURATED_SHOWCASE_PRODUCTS;

  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20">
      {/* Container d'ensemble avec lueurs et contours néon */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden border border-teal-500/30 bg-gradient-to-br from-slate-950 via-zinc-900 to-teal-950/40 shadow-[0_0_50px_rgba(20,184,166,0.12)] text-white backdrop-blur-2xl"
      >
        {/* Cercles de lueur d'ambiance */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a608_1px,transparent_1px),linear-gradient(to_bottom,#14b8a608_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-50" />

        <div className="relative z-10 space-y-12">
          {/* ── EN-TÊTE DE LA SECTION ── */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/40 bg-teal-950/80 px-4 py-1.5 text-xs sm:text-sm font-bold text-teal-300 shadow-inner backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
              <span className="uppercase tracking-wider">
                {isEn ? "Digital Store • Zero Waiting Time" : "Boutique Digitale • Téléchargement Immédiat"}
              </span>
              <span className="hidden sm:inline-block bg-teal-500/20 text-teal-200 border border-teal-500/40 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                {isEn ? "Instant Delivery" : "Accès 24/7"}
              </span>
            </div>

            {/* Titre Principal */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
              {isEn ? "Practical Knowledge You Can Use " : "Des Ressources Pratiques à Utiliser "}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                {isEn ? "Right Now" : "Dès Aujourd'hui"}
              </span>
            </h2>

            {/* Description fluide */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "No need to wait for a scheduled course to level up! Download battle-tested e-books, Notion templates, AI prompt packs, and code scripts created by vetted experts. Buy easily with Mobile Money or Crypto and start immediately."
                : "Pas besoin d'attendre une session en direct pour progresser ! Téléchargez dès maintenant des e-books spécialisés, des templates Notion, des packs de prompts IA et des scripts de code conçus par nos meilleurs experts. Réglez en Mobile Money ou Crypto et commencez instantanément."}
            </p>
          </div>

          {/* ── LES 4 PILIERS DE PRODUITS DIGITAUX ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillar.color} border flex items-center justify-center shadow-inner`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                      {isEn ? pillar.titleEn : pillar.titleFr}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isEn ? pillar.descEn : pillar.descFr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── APERÇU DES PRODUITS DIGITAUX EN VEDETTE ── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {isEn ? "Popular in Store" : "Sélection du Moment"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  {isEn ? "Top Digital Products Available Today" : "Produits Numériques Disponibles Immédiatement"}
                </h3>
              </div>

              <Link
                href="/store"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors group self-start sm:self-auto"
              >
                <span>{isEn ? "Browse Full Store" : "Voir Tous les Produits"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Grille de 4 cartes produits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayProducts.map((product) => {
                const price = Number(product.price);
                const isZip =
                  (product.file_name || product.file_url || "").toLowerCase().endsWith(".zip") ||
                  product.category.toLowerCase().includes("script") ||
                  product.category.toLowerCase().includes("logiciel");
                const isTemplate = product.category.toLowerCase().includes("modèle") || product.category.toLowerCase().includes("template");
                const isIA = product.category.toLowerCase().includes("prompt") || product.category.toLowerCase().includes("ia");

                const BadgeIcon = isZip ? FileCode : isTemplate ? Layers : isIA ? Sparkles : BookOpen;
                const badgeLabel = isZip ? "Code / ZIP" : isTemplate ? "Template" : isIA ? "Pack IA" : "E-book PDF";

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-teal-500/50 shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group text-left"
                  >
                    {/* Header visuel de la carte */}
                    <div className="p-4 bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-950/80 text-teal-300 border border-teal-800/60">
                          <BadgeIcon className="w-3 h-3 text-teal-400" />
                          {badgeLabel}
                        </span>
                        <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm">
                          ${price.toFixed(2)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-3 line-clamp-2 group-hover:text-teal-300 transition-colors leading-snug">
                        {product.title}
                      </h4>
                    </div>

                    {/* Contenu & Description */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Info Créateur */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                        <div className="w-6 h-6 rounded-full bg-teal-900/60 border border-teal-500/30 flex items-center justify-center font-bold text-[10px] text-teal-200">
                          {(product.profiles?.full_name || "A").slice(0, 1)}
                        </div>
                        <span className="truncate font-semibold text-zinc-300">
                          {product.profiles?.full_name || "Formateur ANSELLA"}
                        </span>
                      </div>

                      {/* Boutons d'action */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (product.id.startsWith("sample-")) {
                              window.location.href = "/store";
                            } else {
                              setSelectedDetail(product);
                            }
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isEn ? "Preview" : "Aperçu"}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (product.id.startsWith("sample-")) {
                              window.location.href = "/store";
                            } else {
                              setSelectedBuy(product);
                            }
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-black text-[11px] transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.02]"
                        >
                          <Download className="w-3 h-3" />
                          <span>{isEn ? "Get Now" : "Acheter"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BÉNÉFICES CLÉS & PAIEMENT ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {isEn ? "Instant Download 24/7" : "Téléchargement Instantané 24/7"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isEn ? "Access files right after purchase" : "Accès direct au PDF ou ZIP sans attente"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {isEn ? "Mobile Money & Crypto" : "Mobile Money & Crypto"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isEn ? "M-Pesa, Orange, MTN, USDT, Solana" : "M-Pesa, Orange, Airtel, MTN, USDT, BTC"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {isEn ? "Fair Price Cap (Max $25)" : "Plafond Équitable (Max 25$)"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isEn ? "Affordable pricing for every student" : "Des prix justes et accessibles à tous"}
                </p>
              </div>
            </div>
          </div>

          {/* ── BANNIÈRE D'APPEL À L'ACTION : VISITER OU VENDRE ── */}
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-teal-950 via-zinc-900 to-slate-900 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-teal-400 tracking-wider">
                <FileText className="w-4 h-4" />
                <span>{isEn ? "Are You a Creator or Instructor?" : "Vous êtes Formateur ou Créateur ?"}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {isEn
                  ? "Publish & Monetize Your Own Digital Resources"
                  : "Publiez & Monétisez Vos Propres Ressources Numériques"}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                {isEn
                  ? "Join our creator marketplace: upload your guides, Notion templates, or code packages and receive automated payouts via Mobile Money and Crypto."
                  : "Rejoignez notre réseau de créateurs : publiez vos guides PDF, templates Notion ou codes sources et encaissez vos revenus automatiquement par Mobile Money et Crypto."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/store"
                className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isEn ? "Explore Digital Store" : "Explorer la Boutique"}</span>
              </Link>
              <Link
                href="/instructor/courses"
                className="w-full sm:w-auto text-center px-5 py-3 rounded-xl border border-zinc-700 hover:border-teal-500 hover:bg-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? "Sell My Products" : "Vendre mes Produits"}</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modale d'aperçu de produit */}
      <DigitalProductDetailModal
        product={selectedDetail as any}
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onBuy={(prod) => {
          setSelectedDetail(null);
          setSelectedBuy(prod as any);
        }}
      />

      {/* Modale d'achat direct de produit */}
      <DigitalProductCheckoutModal
        product={selectedBuy as any}
        isOpen={!!selectedBuy}
        onClose={() => setSelectedBuy(null)}
      />
    </section>
  );
}
