"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle, Clock, BookOpen, Lock, Compass, Bitcoin, TrendingUp, BrainCircuit, Code2 } from "lucide-react";
import { getDB, Course, Enrollment } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

export default function MyCoursesPage() {
  const [activeEnrollments, setActiveEnrollments] = useState<(Enrollment & { course: Course })[]>([]);
  const [lockedCourses, setLockedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const db = getDB();
    const session = getSimulatedSession();

    if (!session) {
      setLoading(false);
      return;
    }

    // 1. Get active enrollments
    const active = (db.enrollments || [])
      .filter(e => e.studentId === session.userId && e.status === "ACTIVE")
      .map(e => {
        const course = db.courses.find(c => c.id === e.courseId);
        return { ...e, course: course! };
      })
      .filter(e => !!e.course); // Remove null mappings

    setActiveEnrollments(active);

    // 2. Get non-active courses as locked
    const activeCourseIds = new Set(active.map(e => e.courseId));
    const locked = (db.courses || []).filter(
      c => c.status === "PUBLISHED" && !activeCourseIds.has(c.id)
    );
    setLockedCourses(locked);

    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listen to database edits from other pages
    const handler = () => loadData();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const getCourseIcon = (courseId: string, colorClass: string) => {
    if (courseId === "blockchain" || courseId.includes("blockchain")) return <Bitcoin className={`w-8 h-8 ${colorClass}`} />;
    if (courseId === "trading" || courseId.includes("trading")) return <TrendingUp className={`w-8 h-8 ${colorClass}`} />;
    if (courseId === "ai" || courseId.includes("ai")) return <BrainCircuit className={`w-8 h-8 ${colorClass}`} />;
    return <Code2 className={`w-8 h-8 ${colorClass}`} />;
  };

  const getCourseStyles = (courseId: string) => {
    if (courseId === "blockchain" || courseId.includes("blockchain")) {
      return { color: "text-blue-600", bgColor: "bg-blue-100", barColor: "bg-blue-600" };
    }
    if (courseId === "trading" || courseId.includes("trading")) {
      return { color: "text-emerald-600", bgColor: "bg-emerald-100", barColor: "bg-emerald-600" };
    }
    if (courseId === "ai" || courseId.includes("ai")) {
      return { color: "text-purple-600", bgColor: "bg-purple-100", barColor: "bg-purple-600" };
    }
    return { color: "text-orange-600", bgColor: "bg-orange-100", barColor: "bg-orange-600" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Mes Formations</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suivez votre progression et accédez à vos cours actuels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active/Purchased Courses Column (Left span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {activeEnrollments.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center py-16 space-y-6">
              <BookOpen className="w-16 h-16 text-zinc-300 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Aucun cours acheté pour le moment</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">Visitez notre catalogue de formations pour acheter et débloquer des cours.</p>
              </div>
              <Link href="/dashboard/discover" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors gap-2 shadow-lg shadow-blue-500/10">
                <Compass className="w-5 h-5" />
                Découvrir le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeEnrollments.map((enrollment) => {
                const course = enrollment.course;
                const styles = getCourseStyles(course.id);
                
                return (
                  <div key={enrollment.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="mb-6 flex justify-between items-start">
                      <div className={`w-14 h-14 ${styles.bgColor} dark:bg-opacity-20 rounded-2xl flex items-center justify-center`}>
                        {getCourseIcon(course.id, styles.color)}
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {enrollment.progressPercent === 100 ? "Terminé" : "En cours"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white line-clamp-2">{course.title}</h2>
                    <p className="text-xs text-zinc-400 mb-6">{course.instructorName || "Prof. Kuettu"}</p>
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-zinc-700 dark:text-zinc-300">Progression</span>
                        <span className={styles.color}>{enrollment.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-2.5 rounded-full ${styles.barColor}`} style={{ width: `${enrollment.progressPercent}%` }}></div>
                      </div>
                      <Link 
                        href={`/dashboard/courses/${course.id}/learn`}
                        className="w-full flex items-center justify-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
                      >
                        <PlayCircle className="w-5 h-5 mr-2" />
                        {enrollment.progressPercent === 0 ? "Commencer" : "Reprendre le cours"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Locked / Available courses column (Right span 1) */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Autres formations disponibles</h3>
          
          {lockedCourses.length === 0 ? (
            <p className="text-xs text-zinc-400">Félicitations, vous avez débloqué toutes les formations disponibles !</p>
          ) : (
            <div className="space-y-4">
              {lockedCourses.map(course => {
                const styles = getCourseStyles(course.id);
                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/discover/${course.id}`}
                    className="block bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 ${styles.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center shrink-0`}>
                        {getCourseIcon(course.id, styles.color)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate leading-tight">{course.title}</h4>
                        <p className="text-xxs text-zinc-400 mt-1">${course.price} • Aperçu</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-zinc-400 shrink-0 ml-3" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
