"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlayCircle,
  Clock,
  BookOpen,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Bitcoin,
  Code2,
  Sparkles,
  Award,
  Compass,
  CreditCard,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface CourseData {
  id: string;
  title: string;
  category: string;
  level: string;
  price: number;
  status: string;
  description: string;
}

interface EnrollmentData {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string;
  courses?: CourseData;
}

interface CertificateData {
  id: string;
  student_id: string;
  course_id: string;
  issued_at: string;
}

function getCourseStyles(category: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("blockchain") || c.includes("web3") || c.includes("nft"))
    return { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", barColor: "bg-blue-500", icon: <Bitcoin className="w-8 h-8 text-blue-600" /> };
  if (c.includes("trading") || c.includes("defi") || c.includes("finance"))
    return { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", barColor: "bg-emerald-500", icon: <TrendingUp className="w-8 h-8 text-emerald-600" /> };
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai"))
    return { color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", barColor: "bg-purple-500", icon: <BrainCircuit className="w-8 h-8 text-purple-600" /> };
  return { color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30", barColor: "bg-teal-500", icon: <Code2 className="w-8 h-8 text-teal-600" /> };
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeEnrollments, setActiveEnrollments] = useState<EnrollmentData[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<EnrollmentData[]>([]);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(profileData as Profile);

      // Enrollments with course data
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);

      const all = (enrollData || []) as EnrollmentData[];
      const active = all.filter((e) => e.status === "ACTIVE" && e.progress_percent < 100);
      const completed = all.filter((e) => e.progress_percent >= 100 || e.status === "COMPLETED");
      setActiveEnrollments(active);
      setCompletedEnrollments(completed);

      // Certificates
      const { data: certData } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", user.id);
      setCertificates((certData || []) as CertificateData[]);

      // Available published courses not yet enrolled
      const enrolledIds = new Set(all.map((e) => e.course_id));
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "PUBLISHED");
      const available = ((coursesData || []) as CourseData[]).filter((c) => !enrolledIds.has(c.id)).slice(0, 3);
      setAvailableCourses(available);
    } catch (err) {
      console.error("[DashboardPage] loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Most advanced active course (best for "Reprendre")
  const currentCourse = activeEnrollments.length > 0
    ? activeEnrollments.reduce((best, e) => {
        if (e.progress_percent > best.progress_percent) return e;
        return best;
      }, activeEnrollments[0])
    : null;

  // Overall stats
  const totalHours = activeEnrollments.reduce((sum, e) => sum + (e.courses ? 0 : 0), 0); // Will update once lessons loaded
  const avgProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((s, e) => s + e.progress_percent, 0) / activeEnrollments.length)
    : 0;

  const firstName = (profile?.full_name || "Apprenant").split(" ")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Welcome Hero */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-5">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Tableau de bord</p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Bon retour, {firstName} ! 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {activeEnrollments.length > 0
              ? `Vous suivez ${activeEnrollments.length} formation${activeEnrollments.length > 1 ? "s" : ""}. Continuez sur votre lancée !`
              : "Explorez notre catalogue et commencez votre apprentissage dès maintenant."
            }
          </p>
        </div>
        {currentCourse ? (
          <Link
            href={`/dashboard/courses/${currentCourse.course_id}/learn`}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md shadow-teal-500/20 whitespace-nowrap"
          >
            <PlayCircle className="w-5 h-5" /> Reprendre le cours
          </Link>
        ) : (
          <Link
            href="/dashboard/discover"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md shadow-teal-500/20"
          >
            <Compass className="w-5 h-5" /> Découvrir le catalogue
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Cours actifs</p>
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{activeEnrollments.length}</h4>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Certificats</p>
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{certificates.length}</h4>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Terminées</p>
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{completedEnrollments.length}</h4>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Progression moy.</p>
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{avgProgress}%</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Active courses + Completed */}
        <div className="lg:col-span-2 space-y-8">

          {/* Active courses with progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Formations en cours</h2>
              <Link href="/dashboard/courses" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Tout voir <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeEnrollments.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4">
                <BookOpen className="w-14 h-14 text-zinc-300 mx-auto" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Aucune formation en cours</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">Inscrivez-vous à une formation pour commencer votre apprentissage.</p>
                <Link href="/dashboard/discover" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors">
                  <Compass className="w-4 h-4" /> Découvrir le catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeEnrollments.slice(0, 3).map((enr) => {
                  const course = enr.courses;
                  if (!course) return null;
                  const styles = getCourseStyles(course.category);
                  const isCurrent = currentCourse?.id === enr.id;
                  return (
                    <div
                      key={enr.id}
                      className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all ${
                        isCurrent ? "border-teal-400 dark:border-teal-700 ring-1 ring-teal-500/20" : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${styles.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{course.title}</h3>
                            {isCurrent && (
                              <span className="shrink-0 text-[10px] bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-900/40">
                                Actif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-3">{course.category} · {course.level}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${styles.barColor} transition-all duration-700`} style={{ width: `${enr.progress_percent}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${styles.color} shrink-0 w-10 text-right`}>{enr.progress_percent}%</span>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/courses/${course.id}/learn`}
                          className="shrink-0 flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {activeEnrollments.length > 3 && (
                  <Link href="/dashboard/courses" className="block w-full py-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-xs font-semibold text-zinc-500 hover:text-teal-600 hover:border-teal-400 transition-all">
                    Voir {activeEnrollments.length - 3} autres formations <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Completed courses */}
          {completedEnrollments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" /> Formations terminées
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {completedEnrollments.slice(0, 2).map((enr) => {
                  const course = enr.courses;
                  if (!course) return null;
                  const styles = getCourseStyles(course.category);
                  return (
                    <div key={enr.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 ${styles.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{course.title}</h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{course.category} · 100%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dashboard/courses/${course.id}/learn`} className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          Revoir
                        </Link>
                        <Link href="/dashboard/certificates" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                          <Award className="w-3.5 h-3.5 inline mr-1" />Certificat
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Recommendations */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recommandé pour vous</h2>

          {availableCourses.length > 0 ? (
            <div className="space-y-4">
              {availableCourses.map((course) => {
                const styles = getCourseStyles(course.category);
                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/discover/${course.id}`}
                    className={`block bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group ${styles.borderHover}`}
                  >
                    <div className={`h-24 ${styles.bgColor} rounded-xl mb-4 flex items-center justify-center`}>
                      {styles.icon}
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2 text-sm">{course.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {course.price > 0 ? `$${course.price}` : "Gratuit"}
                      </span>
                      <span className={`${styles.color} font-semibold flex items-center text-xs group-hover:translate-x-0.5 transition-transform`}>
                        Découvrir <ChevronRight className="w-4 h-4 ml-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 text-center space-y-3">
              <Award className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Félicitations !</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Vous êtes inscrit à toutes nos formations disponibles.</p>
            </div>
          )}

          <Link
            href="/dashboard/discover"
            className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-500 hover:text-teal-600 hover:border-teal-400 transition-all"
          >
            <Compass className="w-4 h-4" /> Voir tout le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
