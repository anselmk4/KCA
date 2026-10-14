"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Search,
  Download,
  Sparkles,
  FileText,
  FileCode,
  Archive,
  BookOpen,
  Filter,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";

interface DigitalProduct {
  id: string;
  author_id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  file_url: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  category: string;
  tags?: string[];
  status: "draft" | "published";
  created_at: string;
  profiles?: {
    id?: string;
    full_name?: string;
    avatar_url?: string;
    specialty?: string;
    academy_name?: string;
    slug?: string;
    username?: string;
  };
}

const CATEGORY_FILTERS = [
  { id: "ALL", label: "Toutes les ressources", icon: Layers },
  { id: "E-books & Guides PDF", label: "E-books & Guides PDF", icon: BookOpen },
  { id: "Logiciels & Scripts (ZIP / Code)", label: "Logiciels & Scripts ZIP", icon: FileCode },
  { id: "Modèles & Templates (Notion, Figma, Canva, Excel)", label: "Modèles & Templates", icon: Layers },
  { id: "Prompts & Datasets IA", label: "Prompts & IA", icon: Sparkles },
  { id: "Blockchain, Web3 & Crypto", label: "Web3 & Crypto", icon: Zap },
  { id: "Développement Web & Mobile", label: "Code & Développement", icon: FileCode },
  { id: "Fintech, Trading & Économie", label: "Fintech & Trading", icon: DollarSign },
];

function getFileBadge(product: DigitalProduct) {
  const fileName = (product.file_name || product.file_url || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  
  if (fileName.endsWith(".zip") || fileName.endsWith(".rar") || fileName.endsWith(".7z") || category.includes("logiciel") || category.includes("script")) {
    return { label: "ZIP / LOGICIEL", color: "bg-indigo-600", icon: Archive };
  }
  if (category.includes("modèle") || category.includes("template") || fileName.endsWith(".fig") || fileName.endsWith(".xlsx")) {
    return { label: "TEMPLATE", color: "bg-purple-600", icon: Layers };
  }
  if (category.includes("prompt") || category.includes("ia")) {
    return { label: "PACK IA", color: "bg-amber-600", icon: Sparkles };
  }
  return { label: "PDF / EBOOK", color: "bg-teal-600", icon: BookOpen };
}

function ProductCardCover({ product }: { product: DigitalProduct }) {
  const [imgError, setImgError] = useState(false);
  const badge = getFileBadge(product);
  const BadgeIcon = badge.icon;

  if (product.cover_image_url && !imgError) {
    return (
      <div className="relative h-52 w-full bg-zinc-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.cover_image_url}
          alt={product.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg ${badge.color}`}>
            <BadgeIcon className="w-3 h-3" />
            {badge.label}
          </span>
        </div>
      </div>
    );
  }

  // Fallback couverture numérique stylisée
  return (
    <div className="relative h-52 w-full bg-gradient-to-br from-slate-900 via-teal-950 to-zinc-950 p-5 flex flex-col justify-between overflow-hidden border-b border-teal-500/20 select-none">
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-teal-500/40 via-teal-500/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg ${badge.color}`}>
          <BadgeIcon className="w-3 h-3" />
          {badge.label}
        </span>
        <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 uppercase tracking-widest">
          Ressource Pro
        </span>
      </div>

      <div className="relative z-10 space-y-1 pl-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-teal-400 line-clamp-1">
          {product.category}
        </p>
        <p className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-teal-200 transition-colors">
          {product.title}
        </p>
      </div>
    </div>
  );
}

export default function StoreCatalogPage() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc">("recent");

  const [selectedDetail, setSelectedDetail] = useState<DigitalProduct | null>(null);
  const [selectedBuy, setSelectedBuy] = useState<DigitalProduct | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/digital-products?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products)) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error("[Store] Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Auto-open product detail when opened via a shared link (?product=... or ?id=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("product") || params.get("id");
      if (targetId) {
        fetch(`/api/digital-products/${targetId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.product) {
              setSelectedDetail(data.product);
            }
          })
          .catch((err) => console.warn("[Store] Error loading direct product:", err));
      }
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Recherche
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchAuthor = p.profiles?.full_name?.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchAuthor && !matchTags) return false;
        }

        // Catégorie
        if (selectedCategory !== "ALL") {
          const catLower = p.category.toLowerCase();
          const targetLower = selectedCategory.toLowerCase();
          if (!catLower.includes(targetLower) && !targetLower.includes(catLower)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO BANNER */}
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 text-white border-b border-zinc-800">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>Boutique Digitale & Ressources Créateurs</span>
                <span className="bg-amber-400 text-zinc-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                  E-books ≤ 25 $ · Logiciels & Templates Prix Libres
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                E-books, Logiciels & Outils Numériques à Fort Impact
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                Téléchargez instantanément des guides PDF, scripts et logiciels ZIP, modèles Notion/Figma et packs de prompts créés par des experts. Paiement fluide en <strong className="text-teal-300">Mobile Money</strong> (RDC, Congo-Brazzaville, Cameroun, Côte d&apos;Ivoire, Sénégal...) et <strong className="text-emerald-300">Crypto</strong>.
              </p>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un e-book, un logiciel ZIP, un template, un auteur..."
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xl backdrop-blur-md"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FILTRES & CATALOGUE */}
        <section className="py-10 container mx-auto px-4 md:px-8 max-w-6xl">
          {/* Barres d'onglets de catégories */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORY_FILTERS.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="recent">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {/* ÉTAT CHARGEMENT */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-4 space-y-4 animate-pulse"
                >
                  <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* ÉTAT VIDE */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20 px-4 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                Aucun produit trouvé pour le moment
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                {search
                  ? "Aucune ressource ne correspond à votre recherche. Essayez un autre mot-clé ou réinitialisez les filtres."
                  : "Les premiers créateurs sont en train de téléverser leurs e-books, guides et logiciels ZIP."}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("ALL");
                    }}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
                <Link
                  href="/instructor/courses"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all"
                >
                  Publier une ressource en tant que Créateur
                </Link>
              </div>
            </div>
          )}

          {/* GRILLE DES PRODUITS DIGITAUX */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const price = Number(product.price);
                const authorUsername =
                  product.profiles?.username ||
                  product.profiles?.slug ||
                  (product.profiles?.full_name ? product.profiles.full_name.toLowerCase().replace(/\s+/g, "-") : "");

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl hover:border-teal-500/50 transition-all duration-300 flex flex-col group text-left"
                  >
                    {/* Couverture avec fallback */}
                    <div className="relative">
                      <ProductCardCover product={product} />

                      {/* Badge Prix strict <= 25$ */}
                      <div className="absolute top-3 right-3 z-10 bg-zinc-950/90 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-400/30 shadow-md">
                        ${price.toFixed(2)} USD
                      </div>
                    </div>

                    {/* Contenu de la Carte */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider truncate">
                            {product.category}
                          </span>
                          {product.file_name && (
                            <span className="text-[9px] text-zinc-400 truncate max-w-[120px]">
                              {product.file_name}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-2 leading-snug">
                          {product.title}
                        </h3>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Auteur & Vitrine */}
                      {product.profiles && (
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(product.profiles.full_name || "A").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                {product.profiles.full_name}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {product.profiles.academy_name || product.profiles.specialty || "Créateur certifié"}
                              </p>
                            </div>
                          </div>

                          {authorUsername && (
                            <Link
                              href={`/store/${authorUsername}`}
                              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 shrink-0 ml-2"
                              title="Voir la boutique complète du créateur"
                            >
                              <span>Boutique</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Actions */}
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
          )}

          {/* BANNIÈRE APPEL AUX CRÉATEURS */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-zinc-900 to-zinc-900 border border-teal-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Monétisation Sans Abonnement</span>
              </div>
              <h3 className="text-xl font-black">
                Vous avez un e-book, un template Notion ou un script à vendre ?
              </h3>
              <p className="text-xs md:text-sm text-zinc-300 max-w-xl leading-relaxed">
                Créez votre boutique digitale personnalisée sur ANSELLA en 2 minutes. Fixez votre prix (E-books ≤ 25 $, logiciels et templates au tarif de votre choix) et recevez vos gains directement par Mobile Money et Crypto sans tracas bancaire.
              </p>
            </div>
            <Link
              href="/instructor/courses"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-teal-500/30 shrink-0 flex items-center gap-2"
            >
              <span>Ouvrir ma Boutique</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modales Interactives */}
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
    </div>
  );
}
