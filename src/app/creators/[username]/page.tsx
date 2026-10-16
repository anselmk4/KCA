"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  Search,
  Check,
  ShieldCheck,
  Zap,
  Info,
  X,
  Award,
  Layers,
} from "lucide-react";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";
import { ColorfulContentCover } from "@/components/ui/ColorfulContentCover";

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
  status?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);

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
            setDigitalProducts(
              (data.digitalProducts || []).filter(
                (p: any) => String(p.status || "").toLowerCase().trim() === "published"
              )
            );
            setCourses(
              (data.courses || []).filter(
                (c: any) => String(c.status || "").toUpperCase().trim() === "PUBLISHED"
              )
            );
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Filtered courses and digital products (strictly PUBLISHED)
  const filteredCourses = useMemo(() => {
    const list = courses.filter((c) => String(c.status || "").toUpperCase().trim() === "PUBLISHED");
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.level && c.level.toLowerCase().includes(q))
    );
  }, [courses, searchQuery]);

  const filteredProducts = useMemo(() => {
    const list = digitalProducts.filter((p) => String(p.status || "").toLowerCase().trim() === "published");
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [digitalProducts, searchQuery]);

  const totalCatalogCount = courses.length + digitalProducts.length;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col font-sans bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Chargement de la boutique officielle...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ======================================================== */}
        {/* HEADER BOUTIQUE ÉLÉGANT (STYLE SHOPIFY / STORE FRONT)     */}
        {/* ======================================================== */}
        <section className="relative bg-zinc-950 text-white overflow-hidden border-b border-zinc-800/80">
          {/* Subtle mesh lights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-teal-500/15 via-emerald-500/5 to-transparent blur-[120px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Banner cover pattern */}
          <div className="h-32 md:h-44 w-full bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 relative border-b border-white/5">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10 -mt-16 md:-mt-20 pb-10">
            {/* Store Profile Card */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-zinc-800/60">
              {/* Avatar + Main Info */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-gradient-to-tr from-teal-800 to-zinc-900 flex items-center justify-center text-3xl md:text-4xl font-black text-white ring-2 ring-teal-500/40">
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
                  <div
                    className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg ring-2 ring-zinc-950 flex items-center justify-center"
                    title="Boutique Officielle Certifiée"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Brand & Specialty */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {creator?.academy_name || "Académie Partenaire Ansella"}
                    </span>
                    {creator?.nationality && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                        🌍 {creator.nationality}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Boutique Officielle
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                    {creator?.full_name || "Boutique du Créateur"}
                  </h1>

                  <p className="text-sm md:text-base text-teal-300/90 font-medium">
                    {creator?.specialty || "Blockchain, IA & Technologies Émergentes"}
                  </p>

                  {/* Clean 1-line store tagline (replaces the long 3 paragraphs) */}
                  <p className="text-xs text-zinc-400 max-w-xl line-clamp-1 pt-0.5">
                    Boutique officielle · Formations certifiantes, masterclasses & ressources numériques exclusives.
                  </p>
                </div>
              </div>

              {/* Action buttons (Share & Bio modal & Socials) */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
                {creator?.bio && (
                  <button
                    onClick={() => setShowBioModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-semibold text-zinc-200 transition-all cursor-pointer shadow-sm hover:border-teal-500/50"
                  >
                    <Info className="w-3.5 h-3.5 text-teal-400" />
                    À propos de l'auteur
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-xs font-extrabold text-white transition-all cursor-pointer shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" /> Lien copié !
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" /> Partager la boutique
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social pills row */}
            <div className="flex flex-wrap items-center justify-center md:justify-between gap-3 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {creator?.website && (
                  <a
                    href={creator.website.startsWith("http") ? creator.website : `https://${creator.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3 text-teal-400" /> Site web
                  </a>
                )}
                {creator?.twitter && (
                  <a
                    href={creator.twitter.startsWith("http") ? creator.twitter : `https://x.com/${creator.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="font-bold text-sky-400">𝕏</span> Twitter/X
                  </a>
                )}
                {creator?.linkedin && (
                  <a
                    href={creator.linkedin.startsWith("http") ? creator.linkedin : `https://linkedin.com/in/${creator.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="font-bold text-blue-400">in</span> LinkedIn
                  </a>
                )}
                {creator?.youtube && (
                  <a
                    href={creator.youtube.startsWith("http") ? creator.youtube : `https://youtube.com/${creator.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="font-bold text-red-500">▶</span> YouTube
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paiements sécurisés · Accès immédiat 24/7</span>
              </div>
            </div>

            {/* Shopify-style KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
              <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white leading-none">
                    {courses.length}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                    Formations
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-teal-400 leading-none">
                    {digitalProducts.length}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                    E-books & Guides
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white leading-none flex items-center gap-1">
                    5.0 <span className="text-xs text-amber-400">★</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                    Avis Vérifiés
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white leading-none">
                    100% Digital
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                    Téléchargement instantané
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* CATALOGUE STOREFRONT & SEARCH / FILTERS                   */}
        {/* ======================================================== */}
        <section className="container mx-auto px-4 md:px-8 max-w-6xl py-10 space-y-8">
          {/* Controls Bar: Search & Category tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "all"
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Tout ({courses.length + digitalProducts.length})
              </button>

              <button
                onClick={() => setActiveTab("courses")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  activeTab === "courses"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Formations ({courses.length})
              </button>

              <button
                onClick={() => setActiveTab("digital")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  activeTab === "digital"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                E-books & Guides ({digitalProducts.length})
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher dans la boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: FORMATIONS / COURS                           */}
          {/* ======================================================== */}
          {(activeTab === "all" || activeTab === "courses") && filteredCourses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    Formations & Cursus Vidéo
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Accédez aux programmes complets, sessions et certifications de l'auteur.
                  </p>
                </div>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {filteredCourses.length} {filteredCourses.length > 1 ? "formations" : "formation"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.slug || c.id}`}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col group"
                  >
                    <ColorfulContentCover
                      title={c.title}
                      category="Formation Vidéo"
                      coverUrl={c.thumbnail_url}
                      type="course"
                      heightClass="h-48"
                    >
                      <div className="absolute top-3 left-3 pointer-events-auto">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-lg uppercase tracking-wider">
                          Formation Vidéo
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 pointer-events-auto bg-zinc-950/85 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-400/30">
                        ${Number(c.price).toFixed(2)} USD
                      </div>
                    </ColorfulContentCover>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold mb-1">
                          <span className="uppercase text-teal-600 dark:text-teal-400 font-bold">
                            {c.level || "Tous niveaux"}
                          </span>
                          <span className="flex items-center gap-1 text-amber-400">
                            ★ 5.0
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-2">
                          {c.title}
                        </h3>

                        {c.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                        <span>Voir le programme</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: PRODUITS DIGITAUX / E-BOOKS                  */}
          {/* ======================================================== */}
          {(activeTab === "all" || activeTab === "digital") && filteredProducts.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    E-books, Modèles & Guides Téléchargeables
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Outils pratiques au format PDF avec accès immédiat garanti (≤ 25 $ max).
                  </p>
                </div>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {filteredProducts.length} {filteredProducts.length > 1 ? "produits" : "produit"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col group"
                  >
                    <ColorfulContentCover
                      title={prod.title}
                      category={prod.category || "E-book PDF"}
                      coverUrl={prod.cover_image_url}
                      type="digital_product"
                      heightClass="h-52"
                    >
                      <div className="absolute top-3 left-3 pointer-events-auto">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-lg uppercase tracking-wider">
                          E-book PDF
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 pointer-events-auto bg-zinc-950/85 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-400/30">
                        ${Number(prod.price).toFixed(2)} USD
                      </div>
                    </ColorfulContentCover>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div>
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-extrabold mb-1">
                          <span>{prod.category || "Guide & Outil Pratique"}</span>
                          <span className="text-emerald-500 font-bold lowercase">immédiat</span>
                        </div>

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
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProductForDetail({ ...prod, profiles: creator || undefined })}
                          className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer text-center"
                        >
                          Aperçu
                        </button>
                        <button
                          onClick={() => setSelectedProductForBuy(prod)}
                          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
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

          {/* Search empty state */}
          {searchQuery && filteredCourses.length === 0 && filteredProducts.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Aucun résultat pour &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Essayez un autre mot-clé ou réinitialisez la recherche pour voir tous les cours et e-books disponibles.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-colors"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}

          {/* Boutique vide si aucun produit ni formation */}
          {totalCatalogCount === 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-16 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Boutique en cours d'alimentation
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Ce créateur prépare actuellement ses premières formations et ses guides numériques. Revenez très bientôt !
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* ======================================================== */}
      {/* MODALE ÉLÉGANTE: À PROPOS DU CRÉATEUR                    */}
      {/* ======================================================== */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-teal-500/30 bg-teal-800 flex items-center justify-center text-lg font-bold text-white shrink-0">
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
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    {creator?.full_name}
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h3>
                  <p className="text-xs text-teal-400">
                    {creator?.specialty || "Formateur & Créateur Certifié"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBioModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body: Bio paragraphs */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0 text-teal-400" />
                <span>
                  Membre certifié de l'académie : <strong>{creator?.academy_name || "Kuettu Crypto Academy"}</strong>
                </span>
              </div>

              <div className="space-y-3 whitespace-pre-line text-xs sm:text-sm text-zinc-300">
                {creator?.bio}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
              <button
                onClick={() => setShowBioModal(false)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
