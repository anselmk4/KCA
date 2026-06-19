"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Clock, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Course data
// ---------------------------------------------------------------------------

type CourseCategory = "Blockchain" | "Crypto & Trading" | "Intelligence Artificielle" | "Web3";

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: CourseCategory;
  price: number;
  weeks: number;
  hours: number;
}

const courses: Course[] = [
  {
    id: "blockchain-consulting",
    title: "Consulting Blockchain : analyser, pratiquer, créer",
    description:
      "Formation complète pour conseiller, évaluer et piloter des projets blockchain de bout en bout.",
    image: "/images/courses/blockchain-consulting.png",
    category: "Blockchain",
    price: 1200,
    weeks: 12,
    hours: 144,
  },
  {
    id: "blockchain-dev",
    title: "Développeur Blockchain : concevoir, sécuriser, déployer",
    description:
      "Maîtrisez Solidity, les smart contracts et le déploiement d'applications décentralisées.",
    image: "/images/courses/blockchain-dev.png",
    category: "Blockchain",
    price: 1450,
    weeks: 16,
    hours: 180,
  },
  {
    id: "defi",
    title: "Finance Décentralisée : évaluer, sécuriser, gérer",
    description:
      "Comprenez et maîtrisez les protocoles DeFi, la gestion de risques et la conformité.",
    image: "/images/courses/defi.png",
    category: "Blockchain",
    price: 1100,
    weeks: 10,
    hours: 120,
  },
  {
    id: "trading",
    title: "Crypto Trading : stratégies, analyse, exécution",
    description:
      "Devenez un trader rentable. Apprenez l'analyse technique, fondamentale, la gestion des risques et la psychologie du marché.",
    image: "/images/courses/trading.png",
    category: "Crypto & Trading",
    price: 900,
    weeks: 8,
    hours: 96,
  },
  {
    id: "ai",
    title: "Intelligence Artificielle : comprendre, créer, déployer",
    description:
      "Apprenez à utiliser et à créer des outils d'IA pour automatiser vos tâches, analyser des données et démultiplier votre productivité.",
    image: "/images/courses/ai.png",
    category: "Intelligence Artificielle",
    price: 1000,
    weeks: 10,
    hours: 120,
  },
  {
    id: "web3",
    title: "Développement Web3 : dApps, protocoles, écosystème",
    description:
      "Créez vos propres dApps et protocoles sur Ethereum, Solana et d'autres blockchains de nouvelle génération.",
    image: "/images/courses/web3.png",
    category: "Web3",
    price: 1500,
    weeks: 14,
    hours: 168,
  },
];

// ---------------------------------------------------------------------------
// Category filter config
// ---------------------------------------------------------------------------

const categories: { label: string; value: string }[] = [
  { label: "Toutes", value: "all" },
  { label: "Blockchain", value: "Blockchain" },
  { label: "Crypto & Trading", value: "Crypto & Trading" },
  { label: "Intelligence Artificielle", value: "Intelligence Artificielle" },
  { label: "Web3", value: "Web3" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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
  }, [search, activeCategory]);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />

      <main className="flex-1 bg-white dark:bg-zinc-950">
        {/* ---- Hero / Header Section ---- */}
        <section className="pt-20 pb-10 md:pt-28 md:pb-14">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <p className="text-sm font-bold tracking-[0.25em] uppercase text-blue-600 dark:text-blue-400 mb-4">
              Formations
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-4">
              Nos parcours certifiants
            </h1>
            <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Des formations sérieuses, pratiques et orientées emploi, pour
              bâtir votre carrière dans le Web3 et la crypto.
            </p>
          </div>
        </section>

        {/* ---- Search + Category Filters ---- */}
        <section className="pb-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="course-search"
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                />
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                      activeCategory === cat.value
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
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
        <section className="pb-24">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-400 dark:text-zinc-500 text-lg">
                  Aucune formation ne correspond à votre recherche.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
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
    <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image wrapper */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Category badge */}
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-sm border border-white/20">
          {course.category}
        </span>

        {/* Price badge */}
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg">
          ${course.price}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h2>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-3 flex-1">
          {course.description}
        </p>

        {/* Footer: duration + CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {course.weeks} semaines • {course.hours}h
            </span>
          </div>

          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
          >
            Découvrir
            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
