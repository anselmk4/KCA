"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, ArrowRight, Compass } from "lucide-react";
import { getDB, Course } from "@/lib/db";

const categories = [
  { label: "Toutes", value: "all" },
  { label: "Blockchain", value: "Blockchain" },
  { label: "Crypto & Trading", value: "Trading" },
  { label: "Intelligence Artificielle", value: "Intelligence Artificielle" },
  { label: "Web3", value: "Web3" }
];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const db = getDB();
    // Only show published courses
    const publishedCourses = (db.courses || []).filter(c => c.status === "PUBLISHED");
    setCourses(publishedCourses);
    setEnrollments(db.enrollments || []);
  }, []);

  const getCategoryLabel = (cat: string | undefined) => {
    if (!cat) return "";
    const map: Record<string, string> = {
      'fb9c0236-be6a-4dca-aeaf-b477c88e00cd': 'Blockchain',
      '009ac13c-d11d-4534-ac66-4c2721d2e4b0': 'Trading',
      '989d3629-27ea-4f72-8c59-6f0d67e1560b': 'Intelligence Artificielle',
      '835d8056-a165-4765-ad81-1269511a9c2e': 'Web3',
      '14902f78-5882-4a0a-891a-88744fbdfc52': 'DeFi',
      'b6460629-d489-41e2-bd86-cedbb1873f5a': 'NFT & Métavers',
      'b5a88db2-1425-47cd-824f-99b909010ae7': 'Sécurité',
      '945f9e8a-c181-4bc9-91a6-26188c46232c': 'Minage'
    };
    return map[cat] || cat;
  };

  const categories = useMemo(() => {
    const list = [{ label: "Toutes", value: "all" }];
    const uniqueCategories = new Set<string>();
    courses.forEach(c => {
      if (c.category) {
        uniqueCategories.add(c.category);
      }
    });
    uniqueCategories.forEach(cat => {
      list.push({ label: getCategoryLabel(cat), value: cat });
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
        <p className="text-zinc-500 dark:text-zinc-400">Parcourez les formations créées par nos experts et rejoignez de nouveaux parcours d'apprentissage.</p>
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
          {categories.map((cat) => (
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-400 dark:text-zinc-500 text-lg">
            Aucune formation ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course) => {
            // Map course ID to specific image asset if exists, otherwise placeholder
            let courseImg = `/images/courses/web3.png`;
            if (course.id === "blockchain") courseImg = `/images/courses/blockchain-dev.png`;
            else if (course.id === "trading") courseImg = `/images/courses/trading.png`;
            else if (course.id === "ai") courseImg = `/images/courses/ai.png`;
            else if (course.id === "web3") courseImg = `/images/courses/web3.png`;
            else if (course.id === "blockchain-consulting") courseImg = `/images/courses/blockchain-consulting.png`;
            else if (course.id === "blockchain-dev") courseImg = `/images/courses/blockchain-dev.png`;
            else if (course.id === "defi") courseImg = `/images/courses/defi.png`;

            const enrolledCount = enrollments.filter(e => e.courseId === course.id).length;

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
                    {getCategoryLabel(course.category) || "Formation"}
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
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-3 flex-grow">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{course.level || "Tous niveaux"}</span>
                      </div>
                      <div className="text-xxs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
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
