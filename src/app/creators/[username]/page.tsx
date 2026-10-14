"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  User,
  BookOpen,
  FileText,
  DollarSign,
  Download,
  ExternalLink,
  Globe,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Star,
  GraduationCap,
  Loader2,
  ArrowRight,
  Share2,
} from "lucide-react";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  academy_name: string | null;
  nationality: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  instagram: string | null;
}

interface DigitalProduct {
  id: string;
  author_id: string;
  title: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  price: number;
  category: string;
  tags: string[];
  status: string;
  preview_url?: string | null;
  created_at: string;
  profiles?: CreatorProfile;
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  level: string | null;
  thumbnail_url: string | null;
  type?: string;
}

export default function CreatorStorefrontPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username || "");

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "digital" | "courses">("all");

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<DigitalProduct | null>(null);
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<DigitalProduct | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      setLoading(true);
      try {
        const res = await fetch(`/api/creators/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.creator) {
            setCreator(data.creator);
            setDigitalProducts(data.digitalProducts || []);
            setCourses(data.courses || []);
          }
        } else {
          console.warn("[CreatorStorefront] Storefront response status:", res.status);
        }
      } catch (err) {
        console.error("Error loading storefront:", err);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadStorefront();
    }
  }, [username]);

  const initials = (name?: string | null) =>
    (name || "CR")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const canonicalUrl = creator?.id
        ? `${window.location.origin}/store/${creator.id}`
        : window.location.href.replace(/\/store\/me$/i, "");
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(canonicalUrl);
      } else {
        const input = document.createElement("input");
        input.value = canonicalUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      alert(`Lien de la boutique copié dans le presse-papier :\n${canonicalUrl}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Banner Hero Créateur */}
        <div className="bg-gradient-to-br from-zinc-900 via-teal-950 to-zinc-900 text-white relative overflow-hidden pt-28 pb-16 border-b border-zinc-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-teal-700 flex items-center justify-center text-3xl md:text-4xl font-black text-white">
                  {creator?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatar_url}
                      alt={creator.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials(creator?.full_name)
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-900" title="Créateur Certifié Ansella">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Infos créateur */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                    {creator?.academy_name || "Académie Partenaire Ansella"}
                  </span>
                  {creator?.nationality && (
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-zinc-300">
                      🌍 {creator.nationality}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  {creator?.full_name || "Boutique du Créateur"}
                </h1>

                <p className="text-base text-teal-200/90 font-medium">
                  {creator?.specialty || "Expert Formateur & Éditeur Digital"}
                </p>

                <p className="text-xs md:text-sm text-zinc-300 max-w-2xl leading-relaxed whitespace-pre-line">
                  {creator?.bio || "Bienvenue sur ma boutique officielle. Retrouvez ici l'ensemble de mes cours en ligne, mes e-books spécialisés, mes modèles et mes guides pratiques téléchargeables."}
                </p>

                {/* Liens Réseaux Sociaux & Partage */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  {creator?.website && (
                    <a
                      href={creator.website.startsWith("http") ? creator.website : `https://${creator.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-teal-400" /> Site web
                    </a>
                  )}
                  {creator?.twitter && (
                    <a
                      href={creator.twitter.startsWith("http") ? creator.twitter : `https://x.com/${creator.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors"
                    >
                      <span className="font-bold text-sky-400">𝕏</span> Twitter/X
                    </a>
                  )}
                  {creator?.linkedin && (
                    <a
                      href={creator.linkedin.startsWith("http") ? creator.linkedin : `https://linkedin.com/in/${creator.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors"
                    >
                      <span className="font-bold text-blue-400">in</span> LinkedIn
                    </a>
                  )}
                  {creator?.youtube && (
                    <a
                      href={creator.youtube.startsWith("http") ? creator.youtube : `https://youtube.com/${creator.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors"
                    >
                      <span className="font-bold text-red-500">▶</span> YouTube
                    </a>
                  )}
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Partager la boutique
                  </button>
                </div>
              </div>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mt-8 pt-8 border-t border-white/10 text-center">
              <div>
                <span className="text-xl md:text-2xl font-black text-white">{courses.length}</span>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase">Formations</p>
              </div>
              <div>
                <span className="text-xl md:text-2xl font-black text-teal-400">{digitalProducts.length}</span>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase">E-books & Guides</p>
              </div>
              <div>
                <span className="text-xl md:text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                  5.0 <Star className="w-4 h-4 fill-amber-400" />
                </span>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase">Avis Vérifiés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Catalogue */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl py-12 space-y-8">
          {/* Onglets Filtres */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
                }`}
              >
                Tout le Catalogue ({digitalProducts.length + courses.length})
              </button>

              <button
                onClick={() => setActiveTab("digital")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "digital"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                E-books & Guides ({digitalProducts.length})
              </button>

              <button
                onClick={() => setActiveTab("courses")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "courses"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Cours & Formations ({courses.length})
              </button>
            </div>

            <span className="text-xs text-zinc-400">
              Accès immédiat garanti · Téléchargement sécurisé
            </span>
          </div>

          {/* Grille Produits Digitaux */}
          {(activeTab === "all" || activeTab === "digital") && digitalProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Produits Digitaux & E-books Téléchargeables
                </h2>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  Tous plafonnés à 25 $ max
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {digitalProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col group"
                  >
                    {/* Cover image */}
                    <div className="relative h-52 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.cover_image_url || "/placeholder-course.jpg"}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-lg uppercase tracking-wider">
                          PDF / Ebook
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-400/30">
                        ${Number(prod.price).toFixed(2)} USD
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div>
                        <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                          {prod.category || "Guide & Outil Pratique"}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-teal-600 transition-colors line-clamp-1">
                          {prod.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      {/* Tags */}
                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prod.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProductForDetail({ ...prod, profiles: creator || undefined })}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer text-center"
                        >
                          Aperçu & Détails
                        </button>
                        <button
                          onClick={() => setSelectedProductForBuy(prod)}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Acheter (${Number(prod.price).toFixed(2)})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grille Cours & Formations */}
          {(activeTab === "all" || activeTab === "courses") && courses.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Formations & Cursus Vidéo
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.slug || c.id}`}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col group"
                  >
                    <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.thumbnail_url || "/placeholder-course.jpg"}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-lg uppercase">
                          {c.type === "self_paced" ? "Autonomie (≤ 25$)" : "Formation Complète"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md text-teal-400 px-3 py-1 rounded-full text-xs font-black border border-teal-400/30">
                        ${Number(c.price).toFixed(2)} USD
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          {c.level || "Tous niveaux"}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-teal-600 transition-colors line-clamp-1">
                          {c.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-teal-600">
                        <span>Voir le programme</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* État vide si aucun contenu */}
          {digitalProducts.length === 0 && courses.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-16 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Boutique en cours de préparation
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Ce créateur prépare actuellement ses premières formations et ses guides numériques. Revenez très bientôt !
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modale Détail & Aperçu Produit Digital */}
      <DigitalProductDetailModal
        product={selectedProductForDetail as any}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onBuy={(prod) => {
          setSelectedProductForDetail(null);
          setSelectedProductForBuy(prod as any);
        }}
      />

      {/* Modale Checkout Direct */}
      <DigitalProductCheckoutModal
        product={selectedProductForBuy as any}
        isOpen={!!selectedProductForBuy}
        onClose={() => setSelectedProductForBuy(null)}
      />
    </div>
  );
}
