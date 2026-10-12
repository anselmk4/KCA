"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Sparkles,
  ArrowRight,
  Eye,
  Star,
  CheckCircle2,
  TrendingUp,
  Tag,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";

interface DigitalProductItem {
  id: string;
  author_id?: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url: string;
  file_name?: string | null;
  category: string;
  tags?: string[];
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    specialty?: string;
    academy_name?: string;
  };
}

// Fallbacks de démonstration de grande qualité mettant en valeur l'écosystème africain
const FEATURED_DIGITAL_PRODUCTS: DigitalProductItem[] = [
  {
    id: "dp-1",
    title: "Guide Ultime : Entreprendre dans la DeFi & Web3 en Afrique",
    description: "Comprendre les protocoles de liquidité, les stablecoins et l'arbitrage pour sécuriser son capital contre l'inflation monétaire locale.",
    price: 15.0,
    category: "Blockchain, Web3 & Crypto",
    cover_image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80",
    file_url: "https://example.com/guide-defi-afrique.pdf",
    file_name: "Guide_DeFi_Afrique_2026.pdf",
    tags: ["DeFi", "Stablecoins", "Afrique"],
    profiles: {
      full_name: "Pr. Dieudonné Mwamba",
      specialty: "Chercheur en Économie Décentralisée",
      academy_name: "Kinshasa Web3 Institute",
    },
  },
  {
    id: "dp-2",
    title: "Prompt Engineering & Automatisation IA pour PME Africaines",
    description: "Plus de 120 prompts testés pour le service client WhatsApp, la comptabilité simplifiée et la génération de contenu marketing bilingue.",
    price: 19.5,
    category: "Intelligence Artificielle & Data",
    cover_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    file_url: "https://example.com/prompts-ia-pme.pdf",
    file_name: "Pack_Prompts_IA_PME.pdf",
    tags: ["IA", "Automatisation", "WhatsApp"],
    profiles: {
      full_name: "Amina Diallo",
      specialty: "Formatrice IA Générative",
      academy_name: "Dakar AI Lab",
    },
  },
  {
    id: "dp-3",
    title: "Manuel Pratique : Intégration Mobile Money & Crypto Gateway",
    description: "Guide d'architecture complet pour développeurs : connecter PawaPay, M-Pesa, Orange Money et Solana Pay à votre boutique e-commerce.",
    price: 24.0,
    category: "Développement Web & Mobile",
    cover_image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    file_url: "https://example.com/guide-momo-crypto.pdf",
    file_name: "Architecture_MoMo_Crypto_Dev.pdf",
    tags: ["Fintech", "Mobile Money", "PawaPay"],
    profiles: {
      full_name: "Koffi Mensah",
      specialty: "Ingénieur Fintech & Cloud",
      academy_name: "Abidjan Tech Hub",
    },
  },
];

export function DigitalProductsSection() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<DigitalProductItem[]>(FEATURED_DIGITAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDetail, setSelectedDetail] = useState<DigitalProductItem | null>(null);
  const [selectedBuy, setSelectedBuy] = useState<DigitalProductItem | null>(null);

  useEffect(() => {
    async function fetchLatestProducts() {
      try {
        const res = await fetch("/api/digital-products?limit=6");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        // Garder les featured products réalistes en fallback
      }
    }
    fetchLatestProducts();
  }, []);

  const categories = [
    { id: "ALL", label: language === "en" ? "All Products" : "Toutes les ressources" },
    { id: "Blockchain, Web3 & Crypto", label: "Web3 & Crypto" },
    { id: "Intelligence Artificielle & Data", label: "IA & Productivité" },
    { id: "Développement Web & Mobile", label: "Code & Fintech" },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory || (p.tags && p.tags.includes(selectedCategory));
  });

  return (
    <section className="py-24 bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-900 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Titre de section */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Digital Storefronts" : "E-books & Ressources Numériques"}</span>
            <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              Max $25
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {language === "en"
              ? "Practical E-books & Guides from African Creators"
              : "Guides Pratiques & E-books des Meilleurs Créateurs"}
          </h2>

          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {language === "en"
              ? "Download high-impact templates, PDF guides, and e-books instantly. Pay easily via Mobile Money or Crypto with no subscription required."
              : "Téléchargez immédiatement des e-books, modèles et guides PDF rédigés par des experts du continent. Paiement fluide en Mobile Money (M-Pesa, Orange, MTN) et Crypto."}
          </p>

          {/* Filtres de catégories */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de Produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const price = Number(product.price);
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl hover:border-teal-500/50 transition-all duration-300 flex flex-col group text-left"
              >
                {/* Couverture */}
                <div className="relative h-52 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.cover_image_url || "/placeholder-course.jpg"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3.5 left-3.5 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-lg uppercase tracking-wider">
                      PDF / Ebook
                    </span>
                  </div>
                  <div className="absolute top-3.5 right-3.5 bg-zinc-950/85 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-400/30 shadow-md">
                    ${price.toFixed(2)} USD
                  </div>
                </div>

                {/* Détails */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-teal-600 transition-colors line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Profil Créateur */}
                  {product.profiles && (
                    <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(product.profiles.full_name || "A").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {product.profiles.full_name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {product.profiles.academy_name || product.profiles.specialty}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDetail(product)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-center"
                    >
                      Aperçu
                    </button>
                    <button
                      onClick={() => setSelectedBuy(product)}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Acheter (${price.toFixed(2)})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bannière d'encouragement créateur */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-zinc-900 to-zinc-900 border border-teal-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Vous êtes auteur, formateur ou créateur de contenu ?
            </h3>
            <p className="text-xs md:text-sm text-zinc-300 max-w-xl">
              Publiez et monétisez vos e-books, guides et modèles auprès de milliers d&apos;apprenants africains. Encaissez vos revenus directement par Mobile Money et Crypto.
            </p>
          </div>
          <Link
            href="/instructor/courses"
            className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-teal-500/30 shrink-0"
          >
            Créer ma Boutique Digitale
          </Link>
        </div>
      </div>

      {/* Modales */}
      <DigitalProductDetailModal
        product={selectedDetail as any}
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onBuy={(prod) => {
          setSelectedDetail(null);
          setSelectedBuy(prod as any);
        }}
      />

      <DigitalProductCheckoutModal
        product={selectedBuy as any}
        isOpen={!!selectedBuy}
        onClose={() => setSelectedBuy(null)}
      />
    </section>
  );
}
