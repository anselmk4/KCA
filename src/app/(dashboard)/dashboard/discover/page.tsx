"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, ArrowRight, Compass, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type DiscoverCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  rating: number;
  category: string;
  level: string;
  thumbnailUrl?: string | null;
};

const CATEGORY_UUID_MAP: Record<string, string> = {
  'fb9c0236-be6a-4dca-aeaf-b477c88e00cd': 'Blockchain',
  '009ac13c-d11d-4534-ac66-4c2721d2e4b0': 'Trading',
  '989d3629-27ea-4f72-8c59-6f0d67e1560b': 'Intelligence Artificielle',
  '835d8056-a165-4765-ad81-1269511a9c2e': 'Web3',
  '14902f78-5882-4a0a-891a-88744fbdfc52': 'DeFi',
  'b6460629-d489-41e2-bd86-cedbb1873f5a': 'NFT & Métavers',
  'b5a88db2-1425-47cd-824f-99b909010ae7': 'Sécurité',
  '945f9e8a-c181-4bc9-91a6-26188c46232c': 'Minage',
};

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [courses, setCourses] = useState<DiscoverCourse[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        // Fetch published courses directly from Supabase — bypasses localStorage
        const { data: sbCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, slug, description, price, status, instructor_id, category_id, level, rating_avg, created_at, thumbnail_url')
          .eq('status', 'PUBLISHED')
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('[discover] Error fetching courses:', coursesError.message);
          setCourses([]);
          setLoading(false);
          return;
        }

        if (!sbCourses || sbCourses.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Fetch instructor names
        const instructorIds = [...new Set(sbCourses.map(c => c.instructor_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', instructorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        // Fetch category names
        const categoryIds = [...new Set(sbCourses.map(c => c.category_id).filter((id): id is string => !!id))];
        let categoryNameMap = new Map<string, string>();
        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);
          categoryNameMap = new Map(categories?.map(c => [c.id, c.name]) || []);
        }

        // Fetch active/completed enrollment counts per course
        const courseIds = sbCourses.map(c => c.id);
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .in('course_id', courseIds)
          .in('status', ['ACTIVE', 'COMPLETED']);

        const counts: Record<string, number> = {};
        enrollments?.forEach(e => {
          counts[e.course_id] = (counts[e.course_id] || 0) + 1;
        });
        setEnrollmentCounts(counts);

        // Map to local format
        const mapped: DiscoverCourse[] = sbCourses.map(c => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description || '',
          price: c.price,
          status: c.status,
          instructorId: c.instructor_id,
          instructorName: profileMap.get(c.instructor_id) || 'Formateur',
          createdAt: c.created_at,
          rating: c.rating_avg || 0,
          category: categoryNameMap.get(c.category_id ?? '') || getCategoryLabel(c.category_id) || '',
          level: getLevelLabel(c.level),
          thumbnailUrl: c.thumbnail_url || null,
        }));

        setCourses(mapped);
      } catch (err) {
        console.error('[discover] Unexpected error:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const dynamicCategories = useMemo(() => {
    const list = [{ label: "Toutes", value: "all" }];
    const uniqueCategories = new Set<string>();
    courses.forEach(c => {
      if (c.category) {
        uniqueCategories.add(c.category);
      }
    });
    uniqueCategories.forEach(cat => {
      list.push({ label: cat, value: cat });
    });
    return list;
  }, [courses]);

  const filtered = useMemo(() => {
    let result = courses;
    if (activeCategory !== "all") {
      result = result.filter(c => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory, courses]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Catalogue</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Découvrir des Formations</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Parcourez les formations créées par nos experts et rejoignez de nouveaux parcours d&apos;apprentissage.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
                activeCategory === cat.value
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-zinc-500 dark:text-zinc-400">Chargement des formations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-400 dark:text-zinc-500 text-lg">
            Aucune formation ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course) => {
            // Map course ID to specific image asset if exists, otherwise placeholder
            let courseImg = course.thumbnailUrl || `/images/courses/web3.png`;
            if (!course.thumbnailUrl) {
              if (course.id === "blockchain" || course.slug?.includes("blockchain")) courseImg = `/images/courses/blockchain-dev.png`;
              else if (course.id === "trading" || course.slug?.includes("trading")) courseImg = `/images/courses/trading.png`;
              else if (course.id === "ai" || course.slug?.includes("artificielle") || course.slug?.includes("ai")) courseImg = `/images/courses/ai.png`;
              else if (course.id === "web3" || course.slug?.includes("web3")) courseImg = `/images/courses/web3.png`;
              else if (course.slug?.includes("defi")) courseImg = `/images/courses/defi.png`;
            }

            const enrolledCount = enrollmentCounts[course.id] || 0;

            return (
              <div key={course.id} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={courseImg}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-sm border border-zinc-200/20">
                    {course.category || "Formation"}
                  </span>
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg">
                    ${course.price}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-3 flex-grow">
                    {stripHtml(course.description)}
                  </p>
                  
                  {/* Instructor name */}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 font-medium">
                    Par <span className="text-zinc-700 dark:text-zinc-300">{course.instructorName}</span>
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{course.level || "Tous niveaux"}</span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {enrolledCount} {enrolledCount > 1 ? "apprenants" : "apprenant"}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/discover/${course.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
                    >
                      Aperçu
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
