"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Loader2, BookOpen, Clock, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  price: number;
  weeks: number;
  hours: number;
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
          const mapped: Course[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.short_description || item.description || "",
            image: item.thumbnail_url || "/africa-lms-integration.png",
            category: item.categories?.name || "Général",
            price: item.price || 0,
            weeks: 10,
            hours: 120,
          }));
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
      { label: "Toutes", value: "all" },
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };


  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />

      <main className="flex-1 py-28 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[110px] pointer-events-none" />

        {/* ---- Hero / Header Section ---- */}
        <section className="pb-10 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold tracking-[0.25em] uppercase text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full w-fit"
            >
              Formations
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight"
            >
              Nos parcours{" "}
              <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">certifiants</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-zinc-400 max-w-2xl leading-relaxed"
            >
              Des formations sérieuses, pratiques et de haut niveau pour propulser votre carrière professionnelle.
            </motion.p>
          </div>
        </section>

        {/* ---- Search + Category Filters ---- */}
        <section className="pb-12 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Search */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="course-search"
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/40 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                />
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      activeCategory === cat.value
                        ? "bg-teal-500 text-zinc-950 border-teal-500 shadow-md shadow-teal-500/10"
                        : "bg-zinc-900/30 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Course Grid ---- */}
        <section className="pb-24 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <p className="text-xs text-zinc-500">Chargement des formations...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-zinc-950/20 border border-zinc-900 rounded-3xl">
                <p className="text-zinc-500 text-sm">
                  Aucune formation ne correspond à votre recherche.
                </p>
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
// Course Card
// ---------------------------------------------------------------------------
function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group bg-zinc-950/40 backdrop-blur-md rounded-2xl border border-zinc-850 overflow-hidden shadow-sm hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 flex flex-col h-full">
      {/* Image wrapper */}
      <div className="relative h-52 overflow-hidden bg-zinc-900">
        {/* Placeholder gradient color based on course title if actual image is missing */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-indigo-900/20 flex items-center justify-center">
          <span className="text-[10px] text-zinc-600 font-mono">Image Formation</span>
        </div>
        
        {course.image && !course.image.includes("/images/courses/") && (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent z-15" />

        {/* Category badge */}
        <span className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-950/80 text-teal-400 backdrop-blur-sm border border-zinc-850">
          {course.category}
        </span>

        {/* Price badge */}
        <span className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-black bg-teal-500 text-zinc-950 shadow-lg">
          ${course.price}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 space-y-4">
        <h2 className="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-teal-400 transition-colors">
          {course.title}
        </h2>

        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed flex-1">
          {course.description}
        </p>

        {/* Footer: duration + CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {course.weeks} sem. • {course.hours}h
            </span>
          </div>

          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors group/link cursor-pointer"
          >
            Découvrir
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
