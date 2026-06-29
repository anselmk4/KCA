"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PlayCircle,
  BookOpen,
  Lock,
  Compass,
  Bitcoin,
  TrendingUp,
  BrainCircuit,
  Code2,
  CheckCircle2,
  Award,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface CourseData {
  id: string;
  title: string;
  category: string;
  level: string;
  price: number;
  status: string;
  instructor_id: string;
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

function getCourseStyles(category: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("blockchain") || c.includes("web3") || c.includes("nft")) return { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", barColor: "bg-blue-600", borderHover: "hover:border-blue-400" };
  if (c.includes("trading") || c.includes("defi") || c.includes("finance")) return { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", barColor: "bg-emerald-600", borderHover: "hover:border-emerald-400" };
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai")) return { color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", barColor: "bg-purple-600", borderHover: "hover:border-purple-400" };
  return { color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30", barColor: "bg-teal-600", borderHover: "hover:border-teal-400" };
}

function CourseIcon({ category, className }: { category: string; className?: string }) {
  const c = (category || "").toLowerCase();
  if (c.includes("blockchain") || c.includes("web3") || c.includes("nft")) return <Bitcoin className={className} />;
  if (c.includes("trading") || c.includes("defi")) return <TrendingUp className={className} />;
  if (c.includes("intelligence") || c.includes("ia") || c.includes("ai")) return <BrainCircuit className={className} />;
  return <Code2 className={className} />;
}

export default function MyCoursesPage() {
  const [activeEnrollments, setActiveEnrollments] = useState<EnrollmentData[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<EnrollmentData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get user plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.plan) {
        setUserPlan(profile.plan);
      }

      // Enrollments with courses
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("id, student_id, course_id, status, progress_percent, created_at, courses(id, title, category, level, price, status)")
        .eq("student_id", user.id);

      const all = (enrollData || []) as unknown as EnrollmentData[];

      const active = all.filter((e) => e.status === "ACTIVE" && e.progress_percent < 100);
      const completed = all.filter((e) => e.progress_percent >= 100 || e.status === "COMPLETED");

      setActiveEnrollments(active);
      setCompletedEnrollments(completed);

      // Available courses not enrolled
      const enrolledIds = new Set(all.map((e) => e.course_id));
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, category, level, price, status")
        .eq("status", "PUBLISHED");

      const available = ((coursesData || []) as unknown as CourseData[]).filter((c) => !enrolledIds.has(c.id));
      setAvailableCourses(available);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Mes Formations</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suivez votre progression et accédez à vos cours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Active + Completed courses */}
        <div className="lg:col-span-2 space-y-8">

          {/* Active courses */}
          <div>
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              En cours ({activeEnrollments.length})
            </h2>

            {activeEnrollments.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center py-16 space-y-5">
                <BookOpen className="w-14 h-14 text-zinc-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Aucune formation en cours</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">Visitez notre catalogue pour découvrir et acheter vos premières formations.</p>
                </div>
                <Link href="/dashboard/discover" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-teal-500/10">
                  <Compass className="w-5 h-5" /> Découvrir le catalogue
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeEnrollments.map((enr) => {
                  const course = enr.courses;
                  if (!course) return null;
                  const styles = getCourseStyles(course.category);
                  return (
                    <div key={enr.id} className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-all ${styles.borderHover}`}>
                      <div className="mb-5 flex justify-between items-start">
                        <div className={`w-13 h-13 ${styles.bgColor} rounded-2xl flex items-center justify-center`}>
                          <CourseIcon category={course.category} className={`w-7 h-7 ${styles.color}`} />
                        </div>
                        <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          En cours
                        </span>
                      </div>

                      <h2 className="text-base font-bold mb-1 text-zinc-900 dark:text-white line-clamp-2">{course.title}</h2>
                      <p className="text-xs text-zinc-400 mb-5">{course.category || "Général"} · {course.level || "Tous niveaux"}</p>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-zinc-700 dark:text-zinc-300">Progression</span>
                          <span className={styles.color}>{enr.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full ${styles.barColor} transition-all duration-700`} style={{ width: `${enr.progress_percent}%` }} />
                        </div>
                        <Link
                          href={`/dashboard/courses/${course.id}/learn`}
                          className="w-full flex items-center justify-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          {enr.progress_percent === 0 ? "Commencer" : "Reprendre"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed courses */}
          {completedEnrollments.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Terminées ({completedEnrollments.length})
              </h2>
              <div className="space-y-3">
                {completedEnrollments.map((enr) => {
                  const course = enr.courses;
                  if (!course) return null;
                  const styles = getCourseStyles(course.category);
                  return (
                    <div key={enr.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 ${styles.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                          <CourseIcon category={course.category} className={`w-5 h-5 ${styles.color}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{course.title}</h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{course.category} · 100%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dashboard/courses/${course.id}/learn`} className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          Revoir
                        </Link>
                        <Link href="/dashboard/certificates" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
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

        {/* Right: Available (locked) courses */}
        <div className="space-y-5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Formations disponibles</h3>

          {availableCourses.length === 0 ? (
            userPlan === "MAX" ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 text-center space-y-3">
                <Award className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Bravo !</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Vous êtes inscrit à toutes les formations disponibles.</p>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-200/50 p-6 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Aucun autre cours disponible pour le moment.</p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {availableCourses.map((course) => {
                const styles = getCourseStyles(course.category);
                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/discover/${course.id}`}
                    className={`block bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all ${styles.borderHover} flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 ${styles.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                        <CourseIcon category={course.category} className={`w-5 h-5 ${styles.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{course.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{course.price > 0 ? `$${course.price}` : "Gratuit"} · {course.category || "Général"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Lock className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                      <ChevronRight className={`w-4 h-4 ${styles.color} group-hover:translate-x-0.5 transition-transform`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <Link href="/dashboard/discover" className="block w-full py-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-xs font-semibold text-zinc-500 hover:text-teal-600 hover:border-teal-400 transition-all">
            <Compass className="w-4 h-4 inline mr-1" /> Explorer tout le catalogue
          </Link>
        </div>

      </div>
    </div>
  );
}
