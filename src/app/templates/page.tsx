"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  BookOpen, Users, ArrowRight, Award, Flame, 
  MapPin, Loader2, Sparkles, Compass 
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  short_description: string | null;
  price: number;
  level: string | null;
  thumbnail_url: string | null;
  categories?: { name: string } | null;
}

interface Instructor {
  id: string;
  full_name: string;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  academy_name: string | null;
  nationality: string | null;
}

export default function TemplatesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, short_description, price, level, thumbnail_url, category_id, categories(name)")
          .eq("status", "PUBLISHED")
          .limit(6);

        if (coursesData) {
          setCourses(coursesData as Course[]);
        }

        // 2. Fetch instructors based on INSTRUCTOR role in user_roles
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
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
            .in("id", instructorIds)
            .limit(12);
          profilesData = data;
        }

        // Fallback in case user_roles read is empty/restricted
        if (!profilesData || profilesData.length === 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
            .not("full_name", "is", null)
            .limit(12);
          profilesData = data?.filter(p => p.specialty || p.academy_name) || null;
        }

        if (profilesData) {
          setInstructors(profilesData as Instructor[]);
        }
      } catch (err) {
        console.error("Error loading templates page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const initials = (name?: string | null) =>
    (name || "AN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const getLevelLabel = (lvl: string | null) => {
    const l = (lvl || "").toUpperCase();
    if (l === "BEGINNER") return "Débutant";
    if (l === "INTERMEDIATE") return "Intermédiaire";
    if (l === "ADVANCED") return "Avancé";
    if (l === "EXPERT") return "Expert";
    return "Tous niveaux";
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-24 relative z-10">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Modèles d&apos;Académies
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Éducation active &{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                modèles d&apos;apprentissage.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Explorez nos académies virtuelles propulsées par Supabase. Découvrez des cours certifiants et apprenez des meilleurs experts africains.
            </p>
          </div>

          {/* Courses Section (Supabase data) */}
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="text-left">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-teal-400" /> Formations à la une
                </h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">Découvrez les cours récemment publiés par nos formateurs agréés.</p>
              </div>
              <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-teal-500 dark:text-teal-400 hover:underline">
                Voir tout le catalogue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-xs text-zinc-500">Chargement des cours depuis Supabase...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-500">Aucun cours publié pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all flex flex-col h-full group">
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-teal-950/5 dark:bg-teal-950/10 text-teal-600 dark:text-teal-500 font-bold text-xl">
                          Ansella Education
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-2.5 py-1 rounded-xl text-[10px] font-bold text-teal-650 dark:text-teal-400 border border-zinc-250 dark:border-zinc-800">
                        {course.categories?.name || "Général"}
                      </span>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 text-left space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors line-clamp-1">{course.title}</h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-500 line-clamp-2 leading-relaxed min-h-[36px]">
                          {course.short_description || "Aucune description courte disponible pour ce cours."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 mt-auto flex items-center justify-between text-xs">
                        <span className="text-zinc-550 dark:text-zinc-500">{getLevelLabel(course.level)}</span>
                        <span className="font-black text-teal-500 dark:text-teal-400 text-sm">
                          {course.price > 0 ? `${course.price.toLocaleString()}$` : "Gratuit"}
                        </span>
                      </div>

                      <Link 
                        href={`/courses/${course.id}`}
                        className="w-full py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-white font-bold rounded-xl text-center text-xs transition-colors block border border-zinc-200 dark:border-zinc-805 hover:border-zinc-300 dark:hover:border-zinc-700 mt-2"
                      >
                        En savoir plus
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructors Section */}
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="text-left">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" /> Formateurs Ansella
                </h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">Apprenez auprès des professionnels et experts reconnus mondialement.</p>
              </div>
              <Link href="/instructors" className="inline-flex items-center gap-1.5 text-sm text-teal-500 dark:text-teal-400 hover:underline">
                Voir tous les formateurs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : instructors.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-sm text-zinc-500">
                Aucun formateur disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {instructors.map((inst) => (
                  <div key={inst.id} className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all text-center">
                    {inst.avatar_url ? (
                      <img 
                        src={inst.avatar_url} 
                        alt={inst.full_name} 
                        className="w-20 h-20 rounded-full object-cover border-2 border-teal-500/20 shadow-md mb-4 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-teal-500/10 dark:bg-teal-950/20 flex items-center justify-center text-teal-500 font-bold text-2xl mb-4 shrink-0">
                        {initials(inst.full_name)}
                      </div>
                    )}
                    
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 truncate max-w-full">{inst.full_name}</h3>
                    <p className="text-xxs text-teal-500 dark:text-teal-400 font-medium mb-3">{inst.specialty || "Formateur"}</p>
                    {inst.academy_name && (
                      <p className="text-xxs text-zinc-650 dark:text-zinc-500 mb-4">{inst.academy_name}</p>
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 min-h-[54px] leading-relaxed">
                      {inst.bio || "Aucune biographie disponible pour ce formateur."}
                    </p>
                    
                    <Link 
                      href={`/profile/${inst.id}`}
                      className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors mt-auto block text-center shadow-sm"
                    >
                      Voir le profil public
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
