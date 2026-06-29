"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft,
  ChevronDown,
  PlayCircle,
  BookOpen,
  Clock,
  Users,
  Award,
  Bitcoin,
  TrendingUp,
  BrainCircuit,
  Code2,
  CheckCircle2,
  Lock,
  Star,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────
interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  level: string | null;
  rating_avg: number | null;
  estimated_duration_hours: number | null;
  enrollment_count: number | null;
  instructor_id: string;
  instructorName: string;
  categoryName: string;
}

interface Section {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number;
}

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

function CourseHeroIcon({ category }: { category: string }) {
  const c = category.toLowerCase();
  const cls = "w-20 h-20 opacity-80";
  if (c.includes("blockchain") || c.includes("web3")) return <Bitcoin className={cls} />;
  if (c.includes("trading") || c.includes("defi")) return <TrendingUp className={cls} />;
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai")) return <BrainCircuit className={cls} />;
  return <Code2 className={cls} />;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try by slug first, then by id
      let { data: courseData } = await supabase
        .from("courses")
        .select("id, title, slug, description, price, status, level, rating_avg, estimated_duration_hours, enrollment_count, instructor_id, category_id")
        .eq("slug", courseId)
        .maybeSingle();

      if (!courseData) {
        const res = await supabase
          .from("courses")
          .select("id, title, slug, description, price, status, level, rating_avg, estimated_duration_hours, enrollment_count, instructor_id, category_id")
          .eq("id", courseId)
          .maybeSingle();
        courseData = res.data;
      }

      if (!courseData) { setLoading(false); return; }

      // Instructor name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", courseData.instructor_id)
        .maybeSingle();

      // Category name
      let categoryName = "";
      if (courseData.category_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("name")
          .eq("id", courseData.category_id)
          .maybeSingle();
        categoryName = cat?.name || "";
      }

      setCourse({
        id: courseData.id,
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description || "",
        price: courseData.price || 0,
        status: courseData.status,
        level: courseData.level,
        rating_avg: courseData.rating_avg,
        estimated_duration_hours: courseData.estimated_duration_hours,
        enrollment_count: courseData.enrollment_count,
        instructor_id: courseData.instructor_id,
        instructorName: profile?.full_name || "Formateur",
        categoryName,
      });

      // Sections + lessons
      const { data: sectionsData } = await supabase
        .from("course_sections")
        .select("id, title, sort_order")
        .eq("course_id", courseData.id)
        .order("sort_order");

      if (sectionsData && sectionsData.length > 0) {
        setOpenSection(sectionsData[0].id);
        const sectionIds = sectionsData.map((s) => s.id);
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, title, duration_minutes, sort_order, section_id")
          .in("section_id", sectionIds)
          .order("sort_order");

        const built: Section[] = sectionsData.map((s) => ({
          id: s.id,
          title: s.title,
          sort_order: s.sort_order,
          lessons: (lessonsData || [])
            .filter((l) => l.section_id === s.id)
            .map((l) => ({ id: l.id, title: l.title, duration_minutes: l.duration_minutes || 0 })),
        }));
        setSections(built);
      }

      // Check auth + enrollment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseData.id)
          .maybeSingle();
        setIsEnrolled(!!enrollment);

        // Check if certificate is unlocked
        const { data: cert } = await supabase
          .from("certificates")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseData.id)
          .maybeSingle();
        setHasCertificate(!!cert);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const totalMinutes = sections.reduce(
    (s, sec) => s + sec.lessons.reduce((ls, l) => ls + l.duration_minutes, 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="w-16 h-16 text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Cours introuvable</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Ce cours n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link href="/courses" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors">
            Voir le catalogue
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950 text-white pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <Link href="/courses" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Retour au catalogue
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left: info */}
            <div className="lg:col-span-2">
              {course.categoryName && (
                <span className="inline-block text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-3 py-1 rounded-full mb-4">
                  {course.categoryName}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">{course.title}</h1>
              <p className="text-zinc-300 text-base leading-relaxed mb-6">{course.description}</p>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                {course.level && (
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-400" />
                    {LEVEL_MAP[course.level] || course.level}
                  </span>
                )}
                {totalLessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    {totalLessons} leçon{totalLessons > 1 ? "s" : ""}
                  </span>
                )}
                {totalMinutes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : ""}
                  </span>
                )}
                {course.enrollment_count !== null && course.enrollment_count > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {course.enrollment_count} apprenants
                  </span>
                )}
                {course.rating_avg !== null && course.rating_avg > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {course.rating_avg.toFixed(1)}/5
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Par <span className="text-white font-semibold">{course.instructorName}</span>
              </p>
            </div>

            {/* Right: CTA card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center space-y-4 sticky top-24">
              <div className="flex justify-center">
                <CourseHeroIcon category={course.categoryName || course.title} />
              </div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Prix de la formation</p>
              <p className="text-4xl font-black">
                {course.price === 0 ? "Gratuit" : `$${course.price}`}
              </p>

              {hasCertificate ? (
                <Link
                  href="/dashboard/certificates"
                  className="block w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm animate-pulse"
                >
                  <Award className="w-5 h-5 inline mr-2 animate-spin-slow" />
                  Afficher certificat
                </Link>
              ) : isEnrolled ? (
                <Link
                  href={`/dashboard/courses/${course.id}/learn`}
                  className="block w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  <PlayCircle className="w-5 h-5 inline mr-2" />
                  Continuer le cours
                </Link>
              ) : isLoggedIn ? (
                <Link
                  href={`/dashboard/payment?courseId=${course.id}`}
                  className="block w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  S&apos;inscrire maintenant
                </Link>
              ) : (
                <Link
                  href={`/register?next=/dashboard/payment?courseId=${course.id}`}
                  className="block w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  Commencer maintenant
                </Link>
              )}

              {!isLoggedIn && (
                <p className="text-xs text-zinc-400">
                  Déjà un compte ?{" "}
                  <Link href={`/login?next=/courses/${courseId}`} className="text-teal-400 hover:text-teal-300 font-semibold">
                    Se connecter
                  </Link>
                </p>
              )}

              <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-white/10">
                <p>✓ Accès à vie au contenu</p>
                <p>✓ Certificat de réussite</p>
                <p>✓ Support par l&apos;instructeur</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus */}
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Programme du cours</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
            {sections.length} module{sections.length > 1 ? "s" : ""} · {totalLessons} leçon{totalLessons > 1 ? "s" : ""}
            {totalMinutes > 0 && ` · ${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}m` : ""} de contenu`}
          </p>

          {sections.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <p>Le programme de ce cours sera bientôt disponible.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => {
                const isOpen = openSection === section.id;
                const sectionMinutes = section.lessons.reduce((s, l) => s + l.duration_minutes, 0);
                const sH = Math.floor(sectionMinutes / 60);
                const sM = sectionMinutes % 60;
                return (
                  <div key={section.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenSection(isOpen ? null : section.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${isOpen ? "bg-teal-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {idx + 1}
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">{section.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-400">
                          <BookOpen className="w-3.5 h-3.5" /> {section.lessons.length} leçon{section.lessons.length > 1 ? "s" : ""}
                        </span>
                        {sectionMinutes > 0 && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5" /> {sH > 0 ? `${sH}h ` : ""}{sM > 0 ? `${sM}m` : ""}
                          </span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in slide-in-from-top-2 duration-200">
                        {section.lessons.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic p-5 text-center">Aucune leçon dans ce module pour l&apos;instant.</p>
                        ) : (
                          section.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <div className="flex items-center gap-3 min-w-0">
                                {isEnrolled ? (
                                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </div>
                              {lesson.duration_minutes > 0 && (
                                <span className="text-xs text-zinc-400 shrink-0 ml-4 font-mono">
                                  {lesson.duration_minutes}m
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white text-center space-y-4">
            <h3 className="text-2xl font-bold">Prêt à commencer ?</h3>
            <p className="text-teal-100">Rejoignez les apprenants qui maîtrisent déjà cette formation.</p>
            {isEnrolled ? (
              <Link href={`/dashboard/courses/${course.id}/learn`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-700 hover:bg-teal-50 font-bold rounded-xl transition-all shadow-md">
                <PlayCircle className="w-5 h-5" /> Reprendre le cours
              </Link>
            ) : (
              <Link href={isLoggedIn ? `/dashboard/payment?courseId=${course.id}` : `/register?next=/courses/${courseId}`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-700 hover:bg-teal-50 font-bold rounded-xl transition-all shadow-md">
                S&apos;inscrire · {course.price === 0 ? "Gratuit" : `$${course.price}`}
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
