"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Users,
  Loader2,
  MapPin,
  Globe,
  Sparkles,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Search,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface Instructor {
  id: string;
  full_name: string;
  email?: string;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  academy_name: string | null;
  nationality: string | null;
  website: string | null;
  courseCount?: number;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const { language } = useLanguage();

  useEffect(() => {
    async function loadInstructors() {
      try {
        setLoading(true);
        // Call the server API which uses supabaseAdmin to safely retrieve all real instructors without RLS filtering
        const res = await fetch("/api/instructors");
        if (res.ok) {
          const data = await res.json();
          setInstructors(data.instructors || []);
        } else {
          setInstructors([]);
        }
      } catch (err) {
        console.error("Error loading instructors list:", err);
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    }
    loadInstructors();
  }, []);

  const initials = (name?: string | null) =>
    (name || "AN")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const specialties = [
    { id: "ALL", label: language === "en" ? "All Specialties" : "Toutes les spécialités" },
    { id: "BLOCKCHAIN", label: "Blockchain & Web3" },
    { id: "AI", label: "Intelligence Artificielle" },
    { id: "FINTECH", label: "Fintech & Mobile Money" },
    { id: "DEV", label: "Dev Fullstack & Cloud" },
    { id: "CYBER", label: "Cyber-Sécurité" },
  ];

  const filteredInstructors = useMemo(() => {
    return instructors.filter((inst) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inst.full_name.toLowerCase().includes(q) ||
        (inst.specialty && inst.specialty.toLowerCase().includes(q)) ||
        (inst.academy_name && inst.academy_name.toLowerCase().includes(q)) ||
        (inst.nationality && inst.nationality.toLowerCase().includes(q)) ||
        (inst.bio && inst.bio.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedSpecialty === "ALL") return true;
      const text = `${inst.specialty || ""} ${inst.bio || ""} ${inst.academy_name || ""}`.toLowerCase();
      if (selectedSpecialty === "BLOCKCHAIN")
        return text.includes("blockchain") || text.includes("crypto") || text.includes("web3") || text.includes("smart contract");
      if (selectedSpecialty === "AI")
        return text.includes("ia") || text.includes("intelligence") || text.includes("machine learning") || text.includes("deep learning");
      if (selectedSpecialty === "FINTECH")
        return text.includes("fintech") || text.includes("money") || text.includes("finance") || text.includes("paiement");
      if (selectedSpecialty === "DEV")
        return text.includes("dev") || text.includes("next.js") || text.includes("code") || text.includes("cloud") || text.includes("logiciel");
      if (selectedSpecialty === "CYBER")
        return text.includes("cyber") || text.includes("sécurité") || text.includes("security") || text.includes("iso");
      return true;
    });
  }, [instructors, searchQuery, selectedSpecialty]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-12 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              {language === "en" ? "Faculty & Instructors" : "Corps Professoral & Formateurs"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
              {language === "en" ? "Learn from" : "Apprenez auprès des"}{" "}
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">
                {language === "en" ? "our platform instructors." : "formateurs de la plateforme."}
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {language === "en"
                ? "Discover all certified educators and creators teaching on ANSELLA."
                : "Découvrez l'ensemble des formateurs, directeurs d'académie et enseignants enregistrés sur la plateforme ANSELLA."}
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Search instructor by name, specialty, country, academy..."
                    : "Rechercher un formateur par nom, spécialité, pays, académie..."
                }
                className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            {/* Specialty Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-zinc-400 text-xs font-semibold flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3 h-3" />
                Filtre :
              </span>
              {specialties.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(spec.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSpecialty === spec.id
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {spec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructor Directory Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              <p className="text-xs text-zinc-500">Chargement des formateurs de la plateforme...</p>
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-500 bg-white dark:bg-zinc-900/10 max-w-xl mx-auto space-y-3">
              <Users className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Aucun formateur trouvé</h3>
              <p className="text-xs text-zinc-500">
                {instructors.length === 0
                  ? "Aucun compte formateur n'est encore enregistré sur la plateforme."
                  : "Aucun formateur ne correspond à vos critères de recherche."}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInstructors.map((inst) => (
                <motion.div
                  key={inst.id}
                  variants={cardVariants}
                  className="group bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/40 hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(20,184,166,0.04)] transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/[0.02] rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/[0.05] transition-colors" />

                  <div className="space-y-4">
                    {/* Top: Avatar & Meta Badges */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shrink-0 relative shadow-xs">
                        {inst.avatar_url ? (
                          <img
                            src={inst.avatar_url}
                            alt={inst.full_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal-500/10 to-indigo-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-extrabold text-xl">
                            {initials(inst.full_name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                            {inst.full_name}
                          </h3>
                          <span title="Formateur Vérifié" className="inline-flex">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 line-clamp-1">
                          {inst.specialty || "Formateur ANSELLA"}
                        </p>

                        {inst.academy_name && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            <GraduationCap className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{inst.academy_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {inst.bio && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {inst.bio}
                      </p>
                    )}

                    {/* Meta stats & country */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <div className="flex items-center gap-3">
                        {inst.nationality && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            {inst.nationality}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                          <BookOpen className="w-3 h-3 text-teal-500" />
                          {inst.courseCount || 0} {inst.courseCount && inst.courseCount > 1 ? "cours" : "cours"}
                        </span>
                      </div>

                      {inst.website && (
                        <a
                          href={inst.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        >
                          <Globe className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Profile Action CTA */}
                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Link
                      href={`/profile/${inst.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-teal-50 dark:bg-zinc-850 dark:hover:bg-teal-950/30 text-zinc-900 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 font-bold text-xs transition-all cursor-pointer group/btn"
                    >
                      <span>{language === "en" ? "View Profile & Courses" : "Consulter le profil"}</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
