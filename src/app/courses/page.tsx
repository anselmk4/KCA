"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Loader2, BookOpen, Clock, ArrowRight, Star, Sparkles, GraduationCap } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

/** Strip HTML tags and decode entities for clean text display */
function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  price: number;
  weeks: number;
  hours: number;
  level: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, description, short_description, price, level, thumbnail_url, category_id, categories(name)")
          .eq("status", "PUBLISHED");

        if (error) throw error;

        if (data) {
          const mapped: Course[] = data.map((item: any) => {
            let level = "Débutant";
            if (item.level === "INTERMEDIATE") level = "Intermédiaire";
            else if (item.level === "ADVANCED") level = "Avancé";
            else if (item.level === "EXPERT") level = "Expert";

            return {
              id: item.id,
              title: item.title,
              description: stripHtml(item.short_description || item.description || ""),
              image: item.thumbnail_url || "",
              category: item.categories?.name || "Général",
              price: item.price || 0,
              weeks: 8,
              hours: 45,
              level,
            };
          });
          setCourses(mapped);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(new Set(courses.map((c) => c.category)));
    return [
      { label: "Toutes les catégories", value: "all" },
      ...list.map((c) => ({ label: c, value: c })),
    ];
  }, [courses]);

  const filtered = useMemo(() => {
    let result = courses;
    if (activeCategory !== "all") {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, activeCategory, courses]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-28 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-12 left-10 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-[130px] pointer-events-none" />

        {/* ---- Header Section ---- */}
        <section className="pb-8 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl text-center space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Catalogue E-learning
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight"
            >
              Explorez nos parcours{" "}
              <span className="bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">
                hautement qualifiants
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              Des cursus complets et immersifs sur la blockchain, l'intelligence artificielle, et la finance décentralisée, encadrés par des experts.
            </motion.p>
          </div>
        </section>

        {/* ---- Filter & Search Bar ---- */}
        <section className="pb-12 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/40 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm backdrop-blur-md">
              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="course-search"
                  type="text"
                  placeholder="Rechercher un mot clé, une formation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                />
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === cat.value
                        ? "bg-teal-500 text-zinc-950 font-black shadow-md shadow-teal-500/10"
                        : "bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Courses Grid ---- */}
        <section className="pb-16 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <p className="text-xs text-zinc-500">Chargement de nos formations d'excellence...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8">
                <GraduationCap className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm font-semibold">
                  Aucune formation ne correspond à vos critères de recherche.
                </p>
                <button 
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  className="mt-4 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filtered.map((course) => (
                  <motion.div key={course.id} variants={itemVariants}>
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course Card Component
// ---------------------------------------------------------------------------
function CourseCard({ course }: { course: Course }) {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "débutant":
        return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30";
      case "intermédiaire":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30";
      case "avancé":
        return "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30";
      default:
        return "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30";
    }
  };

  return (
    <div className="group bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:border-teal-500/30 hover:shadow-[0_10px_30px_rgba(20,184,166,0.04)] transition-all duration-300 flex flex-col h-full">
      
      {/* Banner / Image */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden">
        {/* Fallback pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-indigo-500/10 to-blue-500/10 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-800 opacity-60" />
        </div>
        
        {course.image && (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-15" />

        {/* Category badge */}
        <span className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-bold bg-white/95 dark:bg-zinc-950/90 text-teal-600 dark:text-teal-400 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-xs">
          {course.category}
        </span>

        {/* Level badge */}
        <span className={`absolute top-4 right-4 z-20 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getLevelColor(course.level)}`}>
          {course.level}
        </span>
      </div>

      {/* Details content */}
      <div className="p-6 flex flex-col flex-1 space-y-4">
        <div className="space-y-2 flex-1">
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {course.title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-450 line-clamp-3 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Info metrics & price */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>{course.weeks} SEMAINES</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 block leading-none mb-0.5">Tarif</span>
            <span className="text-base font-black text-zinc-900 dark:text-white">
              {course.price > 0 ? `$${course.price}` : "Gratuit"}
            </span>
          </div>
        </div>

        {/* Actions button */}
        <Link
          href={`/courses/${course.id}`}
          className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all group/btn shadow-xs cursor-pointer"
        >
          <span>Consulter le programme</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>

      </div>
    </div>
  );
}
