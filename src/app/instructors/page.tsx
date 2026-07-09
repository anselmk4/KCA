"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Users, Loader2, MapPin, Globe, Sparkles, GraduationCap, ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface Instructor {
  id: string;
  full_name: string;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  academy_name: string | null;
  nationality: string | null;
  website: string | null;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInstructors() {
      try {
        const { data: roleData } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "INSTRUCTOR")
          .maybeSingle();

        let profilesData: Instructor[] | null = null;

        if (roleData?.id) {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role_id", roleData.id);

          const ids = (userRoles || []).map((ur) => ur.user_id);

          if (ids.length > 0) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
              .in("id", ids)
              .order("full_name", { ascending: true });
            profilesData = data as Instructor[];
          }
        }

        // Fallback: fetch profiles that have academy_name or specialty
        if (!profilesData || profilesData.length === 0) {
          const { data: fallbackA } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
            .not("academy_name", "is", null)
            .order("full_name", { ascending: true });

          const { data: fallbackB } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
            .not("specialty", "is", null)
            .order("full_name", { ascending: true });

          const merged = [...(fallbackA || []), ...(fallbackB || [])];
          const seen = new Set<string>();
          profilesData = merged.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          }) as Instructor[];
        }

        // Last resort: load any profile that has a name
        if (!profilesData || profilesData.length === 0) {
          const { data: anyProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
            .not("full_name", "is", null)
            .limit(10);
          profilesData = (anyProfiles || []) as Instructor[];
        }

        if (profilesData) {
          setInstructors(profilesData);
        }
      } catch (err) {
        console.error("Error loading instructors list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInstructors();
  }, []);

  const initials = (name?: string | null) =>
    (name || "AN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 transition-colors duration-300">
      <Navbar />
      
      <main className="flex-1 py-28 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-16 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              Formateurs certifiés
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
              Apprenez auprès des{" "}
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">
                meilleurs experts.
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Découvrez la liste complète des instructeurs agréés d'ANSELLA. Des professionnels actifs du secteur qui partagent leurs compétences et vous accompagnent pas à pas.
            </p>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              <p className="text-xs text-zinc-500">Chargement des formateurs...</p>
            </div>
          ) : instructors.length === 0 ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-500 bg-white dark:bg-zinc-900/10 max-w-xl mx-auto">
              <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-semibold">Aucun formateur enregistré pour le moment.</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {instructors.map((inst) => (
                <motion.div 
                  key={inst.id}
                  variants={cardVariants}
                  className="group bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-teal-500/30 hover:shadow-[0_10px_30px_rgba(20,184,166,0.03)] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative card glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/[0.01] rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/[0.03] transition-colors" />

                  {/* Profile Photo */}
                  <div className="shrink-0 relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center relative">
                      {inst.avatar_url ? (
                        <img 
                          src={inst.avatar_url} 
                          alt={inst.full_name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-500/10 to-indigo-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-extrabold text-2xl">
                          {initials(inst.full_name)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bio details */}
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {inst.full_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 dark:bg-teal-500/5 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {inst.specialty || "Expert Formateur"}
                        </span>
                        {inst.academy_name && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {inst.academy_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {inst.bio || "Ce formateur d'exception n'a pas encore rédigé de biographie."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                      {inst.nationality && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {inst.nationality}
                        </span>
                      )}
                      {inst.website && (
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-zinc-400" />
                          <a 
                            href={inst.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            Site personnel
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 self-stretch sm:self-auto flex items-end sm:items-center">
                    <Link 
                      href={`/profile/${inst.id}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950/80 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      <span>Profil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
