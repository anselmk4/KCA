"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ArrowRight,
  Compass,
  Loader2,
  Users,
  Layers,
  GraduationCap,
  FileText,
  Sparkles,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { ColorfulContentCover } from "@/components/ui/ColorfulContentCover";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";
import { DigitalProductCheckoutModal } from "@/components/digital-products/DigitalProductCheckoutModal";

// ─── Unified Item Type ─────────────────────────────────────────────────────────

type ContentTypeFilter = "all" | "courses" | "digital_products";

export interface DiscoverItem {
  id: string;
  type: "course" | "digital_product";
  title: string;
  slug?: string;
  description: string;
  price: number;
  status: string;
  category: string;
  level?: string;
  coverUrl?: string | null;
  authorName: string;
  authorId?: string;
  createdAt: string;
  rating?: number;
  // Specific to course
  enrolledCount?: number;
  onlineCount?: number;
  // Specific to digital product
  fileName?: string | null;
  fileSizeBytes?: number | null;
  rawProduct?: any;
}

const CATEGORY_UUID_MAP: Record<string, string> = {
  "fb9c0236-be6a-4dca-aeaf-b477c88e00cd": "Blockchain",
  "009ac13c-d11d-4534-ac66-4c2721d2e4b0": "Trading",
  "989d3629-27ea-4f72-8c59-6f0d67e1560b": "Intelligence Artificielle",
  "835d8056-a165-4765-ad81-1269511a9c2e": "Web3",
  "14902f78-5882-4a0a-891a-88744fbdfc52": "DeFi",
  "b6460629-d489-41e2-bd86-cedbb1873f5a": "NFT & Métavers",
  "b5a88db2-1425-47cd-824f-99b909010ae7": "Sécurité",
  "945f9e8a-c181-4bc9-91a6-26188c46232c": "Minage",
};

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

function getCategoryLabel(cat: string | undefined | null): string {
  if (!cat) return "";
  return CATEGORY_UUID_MAP[cat] || cat;
}

function getLevelLabel(level: string | undefined | null): string {
  if (!level) return "Tous niveaux";
  return LEVEL_MAP[level] || level;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export default function DiscoverPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState<ContentTypeFilter>("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Digital product modals state
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [selectedBuy, setSelectedBuy] = useState<any | null>(null);

  // ── Online presence fetch ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchPresenceGlobal() {
      try {
        const res = await fetch("/api/courses/presence");
        if (res.ok) {
          const data = await res.json();
          if (data?.stats) {
            const onMap: Record<string, number> = {};
            Object.keys(data.stats).forEach((cId) => {
              onMap[cId] = data.stats[cId].onlineCount || 0;
            });
            setOnlineCounts(onMap);
          }
        }
      } catch (err) {
        console.warn("[discover] Global presence fetch error:", err);
      }
    }

    fetchPresenceGlobal();
    const interval = setInterval(fetchPresenceGlobal, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch both courses and digital products ─────────────────────────────────
  useEffect(() => {
    async function fetchAllCatalogItems() {
      setLoading(true);
      try {
        // Run both queries in parallel
        const [coursesResult, digitalProductsRes] = await Promise.all([
          // 1. Fetch Courses
          (async () => {
            const { data: sbCourses, error: coursesError } = await supabase
              .from("courses")
              .select(
                "id, title, slug, description, price, status, instructor_id, category_id, level, rating_avg, created_at, thumbnail_url"
              )
              .eq("status", "PUBLISHED")
              .order("created_at", { ascending: false });

            if (coursesError || !sbCourses) {
              console.error("[discover] Courses fetch error:", coursesError?.message);
              return [];
            }

            // Instructor profiles
            const instructorIds = [
              ...new Set(sbCourses.map((c) => c.instructor_id).filter(Boolean)),
            ];
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", instructorIds);
            const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

            // Categories
            const categoryIds = [
              ...new Set(sbCourses.map((c) => c.category_id).filter((id): id is string => !!id)),
            ];
            let categoryNameMap = new Map<string, string>();
            if (categoryIds.length > 0) {
              const { data: categories } = await supabase
                .from("categories")
                .select("id, name")
                .in("id", categoryIds);
              categoryNameMap = new Map(categories?.map((c) => [c.id, c.name]) || []);
            }

            // Enrollments count
            const courseIds = sbCourses.map((c) => c.id);
            const { data: enrollments } = await supabase
              .from("enrollments")
              .select("course_id")
              .in("course_id", courseIds)
              .in("status", ["ACTIVE", "COMPLETED"]);

            const counts: Record<string, number> = {};
            enrollments?.forEach((e) => {
              counts[e.course_id] = (counts[e.course_id] || 0) + 1;
            });

            return sbCourses.map(
              (c): DiscoverItem => ({
                id: c.id,
                type: "course",
                title: c.title,
                slug: c.slug,
                description: c.description || "",
                price: c.price,
                status: c.status,
                category:
                  categoryNameMap.get(c.category_id ?? "") ||
                  getCategoryLabel(c.category_id) ||
                  "Général",
                level: getLevelLabel(c.level),
                coverUrl: c.thumbnail_url || null,
                authorName: profileMap.get(c.instructor_id) || "Formateur",
                authorId: c.instructor_id,
                createdAt: c.created_at,
                rating: c.rating_avg || 0,
                enrolledCount: counts[c.id] || 0,
              })
            );
          })(),

          // 2. Fetch Digital Products
          (async () => {
            try {
              const res = await fetch("/api/digital-products?limit=100");
              if (!res.ok) return [];
              const data = await res.json();
              if (!Array.isArray(data.products)) return [];

              return data.products.map(
                (p: any): DiscoverItem => ({
                  id: p.id,
                  type: "digital_product",
                  title: p.title,
                  description: p.description || "",
                  price: Number(p.price || 0),
                  status: p.status || "published",
                  category: p.category || "E-book & Guide",
                  coverUrl: p.cover_image_url || null,
                  authorName: p.profiles?.full_name || "Créateur",
                  authorId: p.author_id,
                  createdAt: p.created_at || new Date().toISOString(),
                  fileName: p.file_name,
                  fileSizeBytes: p.file_size_bytes,
                  rawProduct: p,
                })
              );
            } catch (err) {
              console.warn("[discover] Error fetching digital products:", err);
              return [];
            }
          })(),
        ]);

        // Combine both into unified catalog and sort newest first
        const combined = [...coursesResult, ...digitalProductsRes].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setItems(combined);
      } catch (err) {
        console.error("[discover] Unexpected catalog error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCatalogItems();
  }, []);

  // ── Count metrics ──────────────────────────────────────────────────────────
  const coursesCount = useMemo(
    () => items.filter((i) => i.type === "course").length,
    [items]
  );
  const digitalCount = useMemo(
    () => items.filter((i) => i.type === "digital_product").length,
    [items]
  );

  // ── Categories aggregation ─────────────────────────────────────────────────
  const dynamicCategories = useMemo(() => {
    const list = [{ label: "Toutes les catégories", value: "all" }];
    const unique = new Set<string>();

    items.forEach((item) => {
      // Respect current content type filter for category pills
      if (contentType === "courses" && item.type !== "course") return;
      if (contentType === "digital_products" && item.type !== "digital_product") return;
      if (item.category && item.category.trim()) {
        unique.add(item.category.trim());
      }
    });

    unique.forEach((cat) => {
      list.push({ label: cat, value: cat });
    });
    return list;
  }, [items, contentType]);

  // ── Filtering Logic ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = items;

    // Filter by type: all, courses, or digital_products
    if (contentType === "courses") {
      result = result.filter((i) => i.type === "course");
    } else if (contentType === "digital_products") {
      result = result.filter((i) => i.type === "digital_product");
    }

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter(
        (i) => i.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.authorName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, contentType, activeCategory, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">
            {t("student.sidebar.catalog", "Catalogue & Découverte")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
          Explorer tous les contenus
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Accédez à l&apos;ensemble des formations certifiantes et produits digitaux (e-books, guides pratiques, templates) conçus par nos formateurs experts.
        </p>
      </div>

      {/* Main Filter Section */}
      <div className="space-y-4">
        {/* Type Filter Tabs (All / Courses / Digital Products) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            type="button"
            onClick={() => {
              setContentType("all");
              setActiveCategory("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              contentType === "all"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-[1.02]"
                : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tous les contenus</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                contentType === "all"
                  ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContentType("courses");
              setActiveCategory("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              contentType === "courses"
                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20 scale-[1.02]"
                : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Formations Vidéo</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                contentType === "courses"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {coursesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContentType("digital_products");
              setActiveCategory("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              contentType === "digital_products"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Produits Digitaux & E-books</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                contentType === "digital_products"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {digitalCount}
            </span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={
                contentType === "courses"
                  ? "Rechercher une formation..."
                  : contentType === "digital_products"
                  ? "Rechercher un e-book, guide, template..."
                  : "Rechercher une formation ou un produit digital..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all shadow-xs"
            />
          </div>

          {/* Categories Pill list */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {dynamicCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat.value
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Grid State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Chargement de tous les contenus...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
          <Layers className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            Aucun contenu ne correspond à vos filtres
          </p>
          <p className="text-xs text-zinc-400">
            Essayez de modifier votre recherche ou réinitialisez les catégories.
          </p>
          <button
            type="button"
            onClick={() => {
              setContentType("all");
              setActiveCategory("all");
              setSearch("");
            }}
            className="mt-4 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((item) => {
            const isCourse = item.type === "course";
            const online = onlineCounts[item.id] || 0;

            if (isCourse) {
              // ─── Formation Vidéo Card ─────────────────────────────────────────
              return (
                <Link
                  key={`course-${item.id}`}
                  href={`/dashboard/discover/${item.id}`}
                  className="group bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-500/40 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Cover with Colorful Typographic Fallback */}
                  <ColorfulContentCover
                    title={item.title}
                    category={item.category}
                    coverUrl={item.coverUrl}
                    type="course"
                    heightClass="h-48"
                  >
                    {/* Badge Formation */}
                    <div className="absolute top-3.5 left-3.5 pointer-events-auto flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-md">
                        Formation
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-zinc-950/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-xs border border-zinc-200/20">
                        {item.category}
                      </span>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-3.5 right-3.5 pointer-events-auto">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-zinc-950/85 text-amber-400 border border-amber-400/30 shadow-lg backdrop-blur-xs">
                        {item.price > 0 ? `$${item.price}` : "Gratuit"}
                      </span>
                    </div>
                  </ColorfulContentCover>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {stripHtml(item.description)}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium pt-1">
                        Par <span className="text-zinc-700 dark:text-zinc-300 font-bold">{item.authorName}</span>
                      </p>
                    </div>

                    {/* Bottom Metadata & Action */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <div className="flex flex-col gap-1 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.level || "Tous niveaux"}</span>
                        </div>
                        {item.enrolledCount !== undefined && (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-zinc-400" />
                              {item.enrolledCount} {item.enrolledCount > 1 ? "inscrits" : "inscrit"}
                            </span>
                            {online > 0 && (
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {online} en ligne
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-500 transition-colors">
                        S&apos;enrôler
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // ─── Produit Digital Card ──────────────────────────────────────────
            return (
              <div
                key={`dp-${item.id}`}
                onClick={() => setSelectedDetail(item.rawProduct || item)}
                className="group bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Cover with Colorful Typographic Fallback */}
                <ColorfulContentCover
                  title={item.title}
                  category={item.category}
                  coverUrl={item.coverUrl}
                  type="digital_product"
                  heightClass="h-48"
                >
                  {/* Badge E-book / PDF */}
                  <div className="absolute top-3.5 left-3.5 pointer-events-auto flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md">
                      E-book / Guide
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-zinc-950/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-xs border border-zinc-200/20">
                      {item.category}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-3.5 right-3.5 pointer-events-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-zinc-950/85 text-amber-400 border border-amber-400/30 shadow-lg backdrop-blur-xs">
                      ${Number(item.price).toFixed(2)} USD
                    </span>
                  </div>
                </ColorfulContentCover>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {stripHtml(item.description)}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium pt-1">
                      Par <span className="text-zinc-700 dark:text-zinc-300 font-bold">{item.authorName}</span>
                    </p>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/40">
                      Téléchargement Immédiat
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBuy(item.rawProduct || item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Obtenir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals for Digital Product Detail & Checkout ────────────────────── */}
      <DigitalProductDetailModal
        product={selectedDetail}
        isOpen={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        onBuy={(prod) => {
          setSelectedDetail(null);
          setSelectedBuy(prod);
        }}
      />

      <DigitalProductCheckoutModal
        product={selectedBuy}
        isOpen={Boolean(selectedBuy)}
        onClose={() => setSelectedBuy(null)}
      />
    </div>
  );
}
