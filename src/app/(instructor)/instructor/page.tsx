"use client";

import { useEffect, useState } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import {
  BookOpen,
  Users,
  TrendingUp,
  Wallet,
  DollarSign,
  Star,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function InstructorDashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState("Kuettu Crypto Academy");
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, { enrollCount: number; revenue: number }>>({});

  useEffect(() => {
    const activeSession = getSimulatedSession();
    setSession(activeSession);
    if (!activeSession) {
      setLoading(false);
      return;
    }

    const instructorId = activeSession.userId;

    async function loadDashboardData() {
      setLoading(true);
      try {

        // 0. Fetch academy name from Supabase profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("academy_name, full_name")
          .eq("id", instructorId)
          .single();

        if (profileData?.academy_name) {
          setAcademyName(profileData.academy_name);
        } else if (profileData?.full_name) {
          setAcademyName(`Académie de ${profileData.full_name}`);
        }

        // Fetch co-managed course IDs where this instructor is a collaborator
        const { data: collabData } = await (supabase as any)
          .from("course_collaborators")
          .select("course_id")
          .eq("collaborator_id", instructorId);
        const collabCourseIds = (collabData || []).map((c: any) => c.course_id);

        // Fetch courses owned or co-managed
        let query = supabase
          .from("courses")
          .select("id, title, status, price, level, thumbnail_url, instructor_id");
        
        if (collabCourseIds.length > 0) {
          query = query.or(`instructor_id.eq.${instructorId},id.in.(${collabCourseIds.join(",")})`);
        } else {
          query = query.eq("instructor_id", instructorId);
        }

        const { data: coursesData } = await query;

        const coursesList = coursesData || [];
        setMyCourses(coursesList);

        if (coursesList.length === 0) {
          setLoading(false);
          return;
        }

        const courseIds = coursesList.map((c: any) => c.id);

        // 2. Fetch enrollments for these courses, including student profiles
        const { data: enrollData } = await (supabase as any)
          .from("enrollments")
          .select(`
            id, 
            student_id, 
            course_id, 
            progress_percent, 
            enrolled_at, 
            profiles(id, full_name, email, avatar_url)
          `)
          .in("course_id", courseIds);

        const enrollList = enrollData || [];
        setMyEnrollments(enrollList);

        // Calculate total students (unique student IDs)
        const uniqueStudentIds = new Set(enrollList.map((e: any) => e.student_id));
        setTotalStudents(uniqueStudentIds.size);

        // Calculate average progress
        const totalProgress = enrollList.reduce((sum: number, e: any) => sum + (e.progress_percent || 0), 0);
        const avg = enrollList.length > 0 ? Math.round(totalProgress / enrollList.length) : 0;
        setAvgProgress(avg);

        // 3. Fetch transactions/payments via RLS-bypassing API
        const earningsRes = await fetch("/api/instructor/earnings");
        if (!earningsRes.ok) {
          throw new Error("Erreur de chargement des transactions");
        }
        const earningsData = await earningsRes.json();
        const paymentsList = earningsData.transactions || [];

        const revenueSum = paymentsList
          .filter((p: any) => p.status === "PAID")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        setTotalRevenue(revenueSum);

        // 4. Fetch pending payouts
        const { data: payoutsData } = await supabase
          .from("payouts")
          .select("amount")
          .eq("instructor_id", instructorId)
          .eq("status", "PENDING");

        const pendingSum = (payoutsData || []).reduce((sum: number, p: any) => sum + p.amount, 0);
        setPendingPayouts(pendingSum);

        // 5. Calculate per-course enrollments and revenue
        const stats: Record<string, { enrollCount: number; revenue: number }> = {};
        coursesList.forEach((c: any) => {
          const courseEnrolls = enrollList.filter((e: any) => e.course_id === c.id);
          const courseRevenueSum = paymentsList
            .filter((p: any) => p.courseId === c.id && p.status === "PAID")
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

          stats[c.id] = {
            enrollCount: courseEnrolls.length,
            revenue: courseRevenueSum
          };
        });
        setCourseStats(stats);

        // 6. Map recent enrollments
        const sortedEnrolls = [...enrollList]
          .sort((a: any, b: any) => new Date(b.enrolled_at || b.created_at || 0).getTime() - new Date(a.enrolled_at || a.created_at || 0).getTime())
          .slice(0, 5)
          .map((enr: any) => ({
            id: enr.id,
            studentName: enr.profiles?.full_name || "Étudiant",
            studentInit: enr.profiles?.full_name?.charAt(0) || "?",
            courseTitle: coursesList.find((c: any) => c.id === enr.course_id)?.title || "Cours",
            joinedAt: enr.enrolled_at || enr.created_at
          }));
        setRecentEnrollments(sortedEnrolls);

      } catch (err) {
        console.error("Error loading instructor dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading || !session) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const instructorName = session?.name ?? "";
  const publishedCourses = myCourses.filter((c) => c.status === "PUBLISHED");
  const draftCourses = myCourses.filter((c) => c.status === "DRAFT");

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Bonjour, {instructorName} 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Voici un aperçu de votre activité d'enseignement.
          </p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/40 rounded-2xl px-5 py-3 text-right">
          <span className="block text-xxs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Votre Académie</span>
          <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 block">{academyName}</span>
        </div>
      </div>

      {/* Plan Free Limitations Card / Upgrade Invite Banner */}
      {session?.plan === "FREE" && (
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 border-2 border-dashed border-red-500/30 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/5 rounded-full blur-[40px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[40px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="space-y-3 z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              ⚠️ Plan d&apos;essai gratuit actif
            </span>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-snug">
              Boostez votre Académie en passant au Plan Supérieur !
            </h2>
            <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
              Votre plan actuel est limité à <span className="font-bold text-zinc-900 dark:text-white">1 cours actif</span>, <span className="font-bold text-zinc-900 dark:text-white">15 apprenants</span> et comporte des frais de transaction de <span className="font-bold text-zinc-900 dark:text-white">20%</span>. 
              Passez au Plan supérieur pour débloquer les <span className="font-semibold text-blue-600 dark:text-blue-400">sessions live</span>, réduire vos frais de transaction à <span className="font-semibold text-teal-600 dark:text-teal-400">10% ou moins</span> et accueillir des élèves en illimité.
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Passer à l&apos;offre supérieure
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              href="/instructor/billing"
              className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
            >
              Voir tous les tarifs & avantages
            </Link>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Revenus totaux</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {totalRevenue.toLocaleString()}$
            </h3>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Étudiants inscrits</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalStudents}</h3>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cours publiés</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {publishedCourses.length}
              {draftCourses.length > 0 && (
                <span className="text-sm font-normal text-zinc-400 ml-1">
                  +{draftCourses.length} brouillons
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Paiements en attente</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {pendingPayouts.toLocaleString()}$
            </h3>
          </div>
        </div>
      </div>

      {/* Invite to create first course banner if they don't have any courses yet */}
      {myCourses.length === 0 && (
        <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-650 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl text-left animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[50px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[40px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
              ✨ Lancez votre activité gratuitement
            </span>
            <h2 className="text-xl md:text-2xl font-black leading-snug">
              Créez et publiez votre premier cours 100% gratuitement !
            </h2>
            <p className="text-sm text-teal-50/90 leading-relaxed font-medium">
              Conformément à notre promesse, votre premier cours sur la plateforme est entièrement gratuit. 
              Partagez votre expertise dans le domaine de votre choix et commencez à enseigner dès aujourd'hui. 
              Vous disposez de tous les outils nécessaires pour structurer vos chapitres, ajouter des leçons, et évaluer vos premiers élèves.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/instructor/courses"
                className="px-6 py-3 bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Créer mon premier cours
                <ArrowUpRight className="w-4 h-4 text-teal-900" />
              </Link>
              <Link
                href="/instructor/community"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Consulter les guides formateurs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses Quick View */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mes Cours</h2>
            <Link
              href="/instructor/courses"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {myCourses.length === 0 && (
              <div className="p-8 text-center text-zinc-500">Aucun cours créé.</div>
            )}
            {myCourses.slice(0, 4).map((course) => {
              const stat = courseStats[course.id] || { enrollCount: 0, revenue: 0 };
              return (
                <div
                  key={course.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    {course.thumbnail_url ? (
                      <div className="shrink-0 w-11 h-7 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800">
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-11 h-7 rounded bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {stat.enrollCount} inscrit{stat.enrollCount > 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {stat.revenue.toLocaleString()}$
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      course.status === "PUBLISHED"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : course.status === "DRAFT"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        : course.status === "REVIEW"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats / Activity */}
        <div className="space-y-6">
          {/* Avg Progress */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
              Progression moyenne
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="fill-none stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="fill-none stroke-teal-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(avgProgress / 100) * 201} 201`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-900 dark:text-white">
                  {avgProgress}%
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  de vos {myEnrollments.length} inscription{myEnrollments.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
              Inscriptions récentes
            </h3>
            {recentEnrollments.length === 0 && (
              <p className="text-sm text-zinc-500">Aucune inscription récente.</p>
            )}
            <div className="space-y-3">
              {recentEnrollments.map((enr) => (
                <div key={enr.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 text-xs font-bold shrink-0">
                    {enr.studentInit}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {enr.studentName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{enr.courseTitle}</p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(enr.joinedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
