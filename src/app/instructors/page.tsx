"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Users, Loader2, MapPin, Globe, Sparkles, GraduationCap } from "lucide-react";

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

        let instructorIds: string[] = [];
        if (roleData) {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role_id", roleData.id);
          if (userRoles) {
            instructorIds = userRoles.map(ur => ur.user_id);
          }
        }

        let profilesData = null;
        if (instructorIds.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
            .in("id", instructorIds)
            .order("full_name", { ascending: true });
          profilesData = data;
        }

        if (!profilesData || profilesData.length === 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality, website")
            .not("full_name", "is", null)
            .order("full_name", { ascending: true });
          profilesData = data?.filter(p => p.specialty || p.academy_name) || null;
        }

        if (profilesData) {
          setInstructors(profilesData as Instructor[]);
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

  return (
    <div className="flex min-h-screen flex-col font-sans bg-[#030712] text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-16 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Formateurs agréés
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Apprenez des experts du{" "}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                continent africain.
              </span>
            </h1>
            <p className="text-lg text-zinc-400">
              Découvrez la liste complète des instructeurs qui partagent leur savoir et propulsent l&apos;entrepreneuriat numérique en Afrique.
            </p>
          </div>

          {/* Instructors Directory */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs text-zinc-500">Chargement de la liste des experts...</p>
            </div>
          ) : instructors.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-3xl p-16 text-center text-zinc-500">
              Aucun formateur enregistré pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructors.map((inst) => (
                <div 
                  key={inst.id} 
                  className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-zinc-700/80 transition-all text-left"
                >
                  {/* Avatar */}
                  <div className="shrink-0 mx-auto md:mx-0">
                    {inst.avatar_url ? (
                      <img 
                        src={inst.avatar_url} 
                        alt={inst.full_name} 
                        className="w-24 h-24 rounded-2xl object-cover border border-zinc-800 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-teal-950/20 flex items-center justify-center text-teal-500 font-bold text-3xl">
                        {initials(inst.full_name)}
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-0.5">{inst.full_name}</h3>
                      <p className="text-xs text-teal-400 font-semibold">{inst.specialty || "Expert Formateur"}</p>
                      {inst.academy_name && (
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {inst.academy_name}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                      {inst.bio || "Ce formateur n'a pas encore rédigé de biographie."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xxs text-zinc-500">
                      {inst.nationality && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {inst.nationality}
                        </span>
                      )}
                      {inst.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-zinc-400" />
                          <a href={inst.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-teal-400">
                            Site Web
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Link Button */}
                  <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <Link 
                      href={`/profile/${inst.id}`}
                      className="w-full md:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs transition-colors text-center"
                    >
                      Profil Public
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
