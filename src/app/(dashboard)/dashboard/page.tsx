"use client";

import { useState, useEffect } from "react";
import { PlayCircle, Clock, BookOpen, ChevronRight, TrendingUp, BrainCircuit, Bitcoin, Code2, Sparkles, Award, Compass, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getDB, updateEnrollmentStatus, Database, Enrollment, Course, Certificate } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Apprenant");
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [inactiveEnrollments, setInactiveEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [activeEnrollments, setActiveEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [certificates, setCertificates] = useState<(Certificate & { course?: Course })[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);

  const loadDashboardData = () => {
    const database = getDB();
    const currentSession = getSimulatedSession();
    setDb(database);
    setSession(currentSession);

    if (currentSession && database) {
      // Inactive enrollments (invitations)
      const inactive = database.enrollments
        .filter(e => e.studentId === currentSession.userId && e.status === "INACTIVE")
        .map(e => {
          const course = database.courses.find(c => c.id === e.courseId);
          return { ...e, course };
        });
      setInactiveEnrollments(inactive);

      // Active enrollments (real data, filtering out completed ones)
      const active = database.enrollments
        .filter(e => e.studentId === currentSession.userId && e.status === "ACTIVE" && e.progressPercent < 100)
        .map(e => {
          const course = database.courses.find(c => c.id === e.courseId);
          return { ...e, course };
        })
        .filter(e => !!e.course);
      setActiveEnrollments(active);

      // Completed enrollments
      const completed = database.enrollments
        .filter(e => e.studentId === currentSession.userId && (e.progressPercent === 100 || e.status === "COMPLETED"))
        .map(e => {
          const course = database.courses.find(c => c.id === e.courseId);
          return { ...e, course };
        })
        .filter(e => !!e.course);
      setCompletedEnrollments(completed);

      // Total amount invested
      const invested = (database.transactions || [])
        .filter(t => t.userId === currentSession.userId && t.status === "PAID")
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalInvested(invested);

      // Certificates (real data)
      const certs = (database.certificates || [])
        .filter(c => c.studentId === currentSession.userId)
        .map(c => {
          const course = database.courses.find(co => co.id === c.courseId);
          return { ...c, course };
        });
      setCertificates(certs);

      // Calculate total learning hours from lesson progress
      // include both active and completed course progress
      const allUserEnrollmentIds = new Set(
        database.enrollments
          .filter(e => e.studentId === currentSession.userId)
          .map(e => e.id)
      );
      const completedProgress = database.lessonProgress.filter(
        p => allUserEnrollmentIds.has(p.enrollmentId) && p.completed
      );
      const completedLessonIds = completedProgress.map(p => p.lessonId);
      const completedLessons = database.lessons.filter(l => completedLessonIds.includes(l.id));
      const totalMin = completedLessons.reduce((sum, l) => sum + (l.durationMin || 0), 0);
      setTotalHours(Math.round(totalMin / 6) / 10); // Round to 1 decimal

      // Available courses not enrolled in
      const enrolledCourseIds = new Set(
        database.enrollments
          .filter(e => e.studentId === currentSession.userId)
          .map(e => e.courseId)
      );
      const available = database.courses
        .filter(c => c.status === "PUBLISHED" && !enrolledCourseIds.has(c.id))
        .slice(0, 3);
      setAvailableCourses(available);
    }
  };

  const handleAcceptInvitation = (courseId: string) => {
    if (!session) return;
    updateEnrollmentStatus(session.userId, courseId, "ACTIVE");
    alert("Invitation acceptée avec succès !");
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
    const savedName = localStorage.getItem("kuettu_user_name");
    if (savedName) setUserName(savedName);

    const handler = () => loadDashboardData();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const getCourseIcon = (courseId: string) => {
    if (courseId.includes("blockchain")) return <Bitcoin className="w-10 h-10 text-blue-600" />;
    if (courseId.includes("trading")) return <TrendingUp className="w-10 h-10 text-emerald-600" />;
    if (courseId.includes("ai")) return <BrainCircuit className="w-10 h-10 text-purple-600" />;
    return <Code2 className="w-10 h-10 text-orange-600" />;
  };

  const getCourseStyles = (courseId: string) => {
    if (courseId.includes("blockchain")) return { color: "text-blue-600", bgColor: "bg-blue-100", barColor: "bg-blue-600", borderHover: "hover:border-blue-500" };
    if (courseId.includes("trading")) return { color: "text-emerald-600", bgColor: "bg-emerald-100", barColor: "bg-emerald-600", borderHover: "hover:border-emerald-500" };
    if (courseId.includes("ai")) return { color: "text-purple-600", bgColor: "bg-purple-100", barColor: "bg-purple-600", borderHover: "hover:border-purple-500" };
    return { color: "text-orange-600", bgColor: "bg-orange-100", barColor: "bg-orange-600", borderHover: "hover:border-orange-500" };
  };

  // Get the most recently active course or the one with highest progress
  const currentCourseEnrollment = activeEnrollments.length > 0
    ? activeEnrollments.reduce((best, e) => {
        if (e.progressPercent > 0 && e.progressPercent < 100 && e.progressPercent > best.progressPercent) return e;
        if (best.progressPercent === 0 && e.progressPercent === 0) return e;
        return best;
      }, activeEnrollments[0])
    : null;

  // Calculate remaining time for the active course
  const getCourseLessonStats = (courseId: string) => {
    if (!db) return { total: 0, completed: 0, remaining: "0h" };
    const sectionIds = db.sections.filter(s => s.courseId === courseId).map(s => s.id);
    const courseLessons = db.lessons.filter(l => sectionIds.includes(l.sectionId));
    const enrollment = activeEnrollments.find(e => e.courseId === courseId);
    const completedCount = enrollment
      ? db.lessonProgress.filter(p => p.enrollmentId === enrollment.id && p.completed).length
      : 0;
    const totalMin = courseLessons.reduce((sum, l) => sum + (l.durationMin || 0), 0);
    const completedLessonIds = enrollment
      ? new Set(db.lessonProgress.filter(p => p.enrollmentId === enrollment.id && p.completed).map(p => p.lessonId))
      : new Set<string>();
    const remainingMin = courseLessons.filter(l => !completedLessonIds.has(l.id)).reduce((sum, l) => sum + (l.durationMin || 0), 0);
    const hours = Math.floor(remainingMin / 60);
    const mins = remainingMin % 60;
    const remaining = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { total: courseLessons.length, completed: completedCount, remaining };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Bon retour, {userName} !</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {activeEnrollments.length > 0
              ? `Vous suivez ${activeEnrollments.length} formation${activeEnrollments.length > 1 ? "s" : ""}. Prêt à continuer ?`
              : "Explorez notre catalogue et commencez votre apprentissage dès maintenant."
            }
          </p>
        </div>
        {currentCourseEnrollment ? (
          <Link
            href={`/dashboard/courses/${currentCourseEnrollment.courseId}/learn`}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 text-center"
          >
            Reprendre le cours
          </Link>
        ) : (
          <Link
            href="/dashboard/discover"
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 text-center flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            Découvrir le catalogue
          </Link>
        )}
      </div>

      {/* Active Invitations */}
      {inactiveEnrollments.length > 0 && (
        <div className="space-y-4">
          {inactiveEnrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                    Invitation à rejoindre un cours
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Un instructeur vous a invité à rejoindre la formation :{" "}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {enrollment.course?.title || "Cours"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => handleAcceptInvitation(enrollment.courseId)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  Accepter l&apos;invitation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress & Active Course */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Course Card - from real data */}
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Formation en cours</h2>
            {currentCourseEnrollment && currentCourseEnrollment.course ? (() => {
              const course = currentCourseEnrollment.course!;
              const styles = getCourseStyles(course.id);
              const stats = getCourseLessonStats(course.id);
              return (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    {course.category ? (
                      <div className="w-full sm:w-32 h-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-zinc-100 dark:bg-zinc-800">
                        <div className={`absolute inset-0 ${styles.bgColor} dark:bg-opacity-20 flex items-center justify-center`}>
                          {getCourseIcon(course.id)}
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full sm:w-32 h-32 sm:h-24 ${styles.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {getCourseIcon(course.id)}
                      </div>
                    )}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-2 inline-block">
                            {currentCourseEnrollment.progressPercent === 100 ? "Terminé ✓" : "En cours"}
                          </span>
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{course.title}</h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {stats.remaining} restantes</span>
                        <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> Leçon {stats.completed}/{stats.total}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div className={`${styles.barColor} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${currentCourseEnrollment.progressPercent}%` }}></div>
                      </div>
                      <p className={`text-xs font-bold mt-1.5 text-right ${styles.color}`}>{currentCourseEnrollment.progressPercent}%</p>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4">
                <BookOpen className="w-14 h-14 text-zinc-300 mx-auto" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Aucune formation en cours</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                  Inscrivez-vous à une formation pour commencer votre apprentissage.
                </p>
                <Link
                  href="/dashboard/discover"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  <Compass className="w-5 h-5" />
                  Découvrir le catalogue
                </Link>
              </div>
            )}
          </div>

          {/* Completed Courses Section */}
          {completedEnrollments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Formations terminées</h2>
              <div className="grid grid-cols-1 gap-4">
                {completedEnrollments.map((enrollment) => {
                  const course = enrollment.course!;
                  const styles = getCourseStyles(course.id);
                  return (
                    <div key={enrollment.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${styles.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center shrink-0`}>
                          {getCourseIcon(course.id)}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug">{course.title}</h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{course.category || "Général"} · {course.level || "Tous niveaux"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                          href={`/dashboard/courses/${course.id}/learn`}
                          className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-center flex-1 sm:flex-initial"
                        >
                          Revoir le cours
                        </Link>
                        <Link
                          href="/dashboard/certificates"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex-1 sm:flex-initial"
                        >
                          Certificat ✓
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats Grid - Real data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Apprentissage</p>
              </div>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalHours}h</h4>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Certificats</p>
              </div>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{certificates.length}</h4>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Cours actifs</p>
              </div>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{activeEnrollments.length}</h4>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Total payé</p>
              </div>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">${totalInvested}</h4>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations from catalog */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recommandé pour vous</h2>
          
          {availableCourses.length > 0 ? (
            availableCourses.map(course => {
              const styles = getCourseStyles(course.id);
              return (
                <Link
                  key={course.id}
                  href={`/dashboard/discover/${course.id}`}
                  className={`block bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm group ${styles.borderHover} transition-colors`}
                >
                  <div className={`h-28 ${styles.bgColor} dark:bg-opacity-20 rounded-xl mb-4 flex items-center justify-center`}>
                    {getCourseIcon(course.id)}
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2 text-sm">{course.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-white">${course.price}</span>
                    <span className={`${styles.color} font-medium flex items-center text-xs`}>Découvrir <ChevronRight className="w-4 h-4 ml-1" /></span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 text-center space-y-3">
              <Award className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Félicitations !</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Vous êtes inscrit à toutes les formations disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
