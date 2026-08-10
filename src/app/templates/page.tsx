"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  BookOpen, Users, ArrowRight, Award, Flame,
  MapPin, Loader2, Sparkles, Star, GraduationCap, Globe
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
        // 1. Fetch published courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, short_description, price, level, thumbnail_url, category_id, categories(name)")
          .eq("status", "PUBLISHED")
          .limit(6);

        if (coursesData) setCourses(coursesData as Course[]);

        // 2. Primary: fetch IDs of users with INSTRUCTOR role
        const { data: roleData } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "INSTRUCTOR")
          .maybeSingle();

        let instructorProfiles: Instructor[] | null = null;

        if (roleData?.id) {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role_id", roleData.id)
            .limit(20);

          const ids = (userRoles || []).map((ur) => ur.user_id);

          if (ids.length > 0) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
              .in("id", ids)
              .limit(12);
            instructorProfiles = data as Instructor[];
          }
        }

        // 3. Fallback: fetch any profile that has a specialty or academy_name
        //    (accounts for RLS blocking user_roles read by anon users)
        if (!instructorProfiles || instructorProfiles.length === 0) {
          const { data: fallbackA } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
            .not("academy_name", "is", null)
            .limit(12);

          const { data: fallbackB } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
            .not("specialty", "is", null)
            .limit(12);

          const merged = [...(fallbackA || []), ...(fallbackB || [])];
          // deduplicate by id
          const seen = new Set<string>();
          instructorProfiles = merged.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          }) as Instructor[];
        }

        // 4. Last-resort: if still empty, pull any profiles (better than empty state)
        if (!instructorProfiles || instructorProfiles.length === 0) {
          const { data: anyProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, bio, specialty, avatar_url, academy_name, nationality")
            .not("full_name", "is", null)
            .limit(8);
          instructorProfiles = (anyProfiles || []) as Instructor[];
        }

        setInstructors(instructorProfiles);
      } catch (err) {
        console.error("Error loading templates page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const initials = (name?: string | null) =>
    (name || "AN").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const getLevelLabel = (lvl: string | null) => {
    const l = (lvl || "").toUpperCase();
    if (l === "BEGINNER") return "Débutant";
    if (l === "INTERMEDIATE") return "Intermédiaire";
    if (l === "ADVANCED") return "Avancé";
    if (l === "EXPERT") return "Expert";
    return "Tous niveaux";
  };

  const getLevelColor = (lvl: string | null) => {
    const l = (lvl || "").toUpperCase();
    if (l === "BEGINNER") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (l === "INTERMEDIATE") return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (l === "ADVANCED") return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    if (l === "EXPERT") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-zinc-500/10 text-zinc-500";
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/8 via-transparent to-indigo-600/8 dark:from-teal-500/10 dark:via-transparent dark:to-indigo-500/10 pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative container mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Modèles d&apos;Académies
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
              Éducation active &amp;{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
                modèles d&apos;apprentissage.
              </span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Explorez nos académies virtuelles. Découvrez des cours certifiants
              et apprenez des meilleurs experts mondiaux en blockchain, crypto, et IA.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-20 relative z-10">

          {/* ─── Courses Section ─── */}
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Formations à la une
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                  Cours récemment publiés par nos formateurs agréés.
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors"
              >
                Voir tout le catalogue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-xs text-zinc-500">Chargement des cours...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-sm text-zinc-400">Aucun cours publié pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-900/20 to-indigo-900/20">
                          <BookOpen className="w-10 h-10 text-teal-600/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-zinc-200/50 dark:border-zinc-700/50">
                          {course.categories?.name || "Général"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getLevelColor(course.level)} backdrop-blur`}>
                          {getLevelLabel(course.level)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1 min-h-[36px]">
                        {course.short_description || "Formation certifiante de haut niveau."}
                      </p>

                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Certifiant</span>
                        </div>
                        <span className="font-black text-teal-600 dark:text-teal-400 text-sm">
                          {course.price > 0 ? `${course.price.toLocaleString()} $` : "Gratuit"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ─── Instructors Section ─── */}
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-500" />
                  Formateurs Ansella
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                  Apprenez auprès des experts reconnus mondialement.
                </p>
              </div>
              <Link
                href="/instructors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors"
              >
                Voir tous les formateurs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              </div>
            ) : instructors.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center space-y-3">
                <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-sm text-zinc-400">Aucun formateur disponible pour le moment.</p>
                <p className="text-xs text-zinc-500">Les formateurs apparaîtront ici une fois leurs profils configurés.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {instructors.map((inst) => (
                  <div
                    key={inst.id}
                    className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Subtle top gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-teal-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Avatar */}
                    <div className="relative mb-4">
                      {inst.avatar_url ? (
                        <img
                          src={inst.avatar_url}
                          alt={inst.full_name}
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
                          {initials(inst.full_name)}
                        </div>
                      )}
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Name & specialty */}
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 line-clamp-1 w-full">
                      {inst.full_name}
                    </h3>
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1.5">
                      {inst.specialty || "Formateur Expert"}
                    </p>

                    {/* Academy name */}
                    {inst.academy_name && (
                      <div className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full mb-3 max-w-full">
                        <GraduationCap className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{inst.academy_name}</span>
                      </div>
                    )}

                    {/* Nationality */}
                    {inst.nationality && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-2">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{inst.nationality}</span>
                      </div>
                    )}

                    {/* Bio */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed flex-1 mb-5 min-h-[48px]">
                      {inst.bio || "Expert passionné par la transmission du savoir dans le domaine des technologies décentralisées."}
                    </p>

                    {/* CTA */}
                    <Link
                      href={`/profile/${inst.id}`}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition-all duration-200 block text-center shadow-sm shadow-teal-500/20 group-hover:shadow-teal-500/30"
                    >
                      Voir le profil
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── CTA Banner ─── */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-800 p-10 md:p-14 text-center text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white,_transparent)]" />
            <div className="relative max-w-2xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" />
                Rejoignez la communauté mondiale
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Prêt à transformer vos connaissances en expertise ?
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                Rejoignez des milliers d&apos;apprenants et formateurs sur Ansella. Commencez gratuitement, progressez à votre rythme.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-teal-700 font-bold rounded-2xl hover:bg-zinc-100 transition-colors shadow-lg text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Créer mon compte gratuitement
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors text-sm"
                >
                  Explorer le catalogue
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
