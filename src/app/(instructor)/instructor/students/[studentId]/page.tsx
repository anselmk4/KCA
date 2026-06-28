"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, TrendingUp, DollarSign, Award, Clock,
  CheckCircle2, Circle, PlayCircle, AlertTriangle, Mail,
  Calendar, BarChart3, ExternalLink, Loader2, User
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";

type CourseDetail = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  coursePrice: number;
  enrollmentStatus: string;
  enrolledAt: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  paymentStatus: string;
  paymentAmount: number;
  paymentDate: string | null;
  hasCertificate: boolean;
  certificateDate: string | null;
};

type StudentDetail = {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedAt: string;
  courses: CourseDetail[];
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Actif", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  COMPLETED: { label: "Terminé", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  AT_RISK: { label: "En difficulté", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  INACTIVE: { label: "Inactif", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

const PAY_MAP: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Payé ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PENDING: { label: "En attente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAILED: { label: "Échec", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  none: { label: "Gratuit", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const color = percent >= 80 ? "bg-emerald-500" : percent >= 40 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        {label && <span className="text-zinc-500 dark:text-zinc-400">{label}</span>}
        <span className="font-bold text-zinc-700 dark:text-zinc-300 ml-auto">{percent}%</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSimulatedSession();
    if (!session?.userId) { router.replace("/login"); return; }
    fetchStudentDetail(session.userId, studentId);
  }, [studentId, router]);

  async function fetchStudentDetail(instructorId: string, sId: string) {
    setLoading(true);
    try {
      // 1. Get instructor courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, slug, price")
        .eq("instructor_id", instructorId);

      if (!courses || courses.length === 0) { setLoading(false); return; }
      const courseIds = courses.map(c => c.id);
      const courseMap = new Map(courses.map(c => [c.id, c]));

      // 2. Get student profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, plan, created_at")
        .eq("id", sId)
        .single();

      if (!profile) { setError("Étudiant introuvable."); setLoading(false); return; }

      // 3. Get enrollments for this student in instructor's courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, course_id, progress_percent, status, enrolled_at")
        .eq("student_id", sId)
        .in("course_id", courseIds);

      if (!enrollments || enrollments.length === 0) {
        setStudent({ id: sId, name: profile.full_name, email: profile.email, plan: profile.plan || "FREE", joinedAt: profile.created_at, courses: [] });
        setLoading(false);
        return;
      }

      const enrolledCourseIds = enrollments.map(e => e.course_id);

      // 4. Get lessons per section per course
      const { data: sections } = await supabase
        .from("course_sections")
        .select("id, course_id")
        .in("course_id", enrolledCourseIds);
      const sectionIds = sections?.map(s => s.id) || [];
      const sectionCourseMap = new Map(sections?.map(s => [s.id, s.course_id]) || []);

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, section_id")
        .in("section_id", sectionIds);

      // Lesson count per course
      const lessonCountByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        const cId = sectionCourseMap.get(l.section_id);
        if (cId) lessonCountByCourse.set(cId, (lessonCountByCourse.get(cId) || 0) + 1);
      });

      // 5. Get lesson progress for this student via enrollment IDs
      const enrollmentIds = enrollments?.map(e => e.id) || [];
      const completedLessonIds = new Set<string>();

      if (enrollmentIds.length > 0) {
        const { data: lessonProgress } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed, enrollment_id")
          .in("enrollment_id", enrollmentIds)
          .eq("completed", true);
        lessonProgress?.forEach(lp => { if (lp.lesson_id) completedLessonIds.add(lp.lesson_id); });
      }

      // Count completed lessons per course
      const completedByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        if (completedLessonIds.has(l.id)) {
          const cId = sectionCourseMap.get(l.section_id);
          if (cId) completedByCourse.set(cId, (completedByCourse.get(cId) || 0) + 1);
        }
      });

      // 6. Get payments
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, course_id")
        .in("course_id", enrolledCourseIds);
      const orderItemCourseMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);
      const orderIds = orderItems?.map(oi => oi.order_id) || [];

      const payDataByCourse = new Map<string, { status: string; amount: number; date: string | null }>();
      if (orderIds.length > 0) {
        const { data: payments } = await supabase
          .from("payments")
          .select("order_id, status, amount, paid_at, created_at")
          .eq("user_id", sId)
          .in("order_id", orderIds);
        payments?.forEach(p => {
          const cId = orderItemCourseMap.get(p.order_id);
          if (cId) payDataByCourse.set(cId, { status: p.status, amount: p.amount, date: p.paid_at || p.created_at });
        });
      }

      // 7. Get certificates
      const { data: certs } = await supabase
        .from("certificates")
        .select("course_id, issued_at")
        .eq("student_id", sId)
        .in("course_id", enrolledCourseIds);
      const certMap = new Map(certs?.map(c => [c.course_id, c.issued_at]) || []);

      // 8. Assemble
      const courseDetails: CourseDetail[] = enrollments.map(e => {
        const course = courseMap.get(e.course_id);
        const pay = payDataByCourse.get(e.course_id);
        const certDate = certMap.get(e.course_id) || null;
        return {
          courseId: e.course_id,
          courseTitle: course?.title || "Cours",
          courseSlug: course?.slug || "",
          coursePrice: course?.price || 0,
          enrollmentStatus: e.status || "ACTIVE",
          enrolledAt: e.enrolled_at,
          progressPercent: e.progress_percent || 0,
          totalLessons: lessonCountByCourse.get(e.course_id) || 0,
          completedLessons: completedByCourse.get(e.course_id) || 0,
          paymentStatus: pay?.status || "none",
          paymentAmount: pay?.amount || 0,
          paymentDate: pay?.date || null,
          hasCertificate: certMap.has(e.course_id),
          certificateDate: certDate,
        };
      });

      setStudent({
        id: sId,
        name: profile.full_name,
        email: profile.email,
        plan: profile.plan || "FREE",
        joinedAt: profile.created_at,
        courses: courseDetails,
      });
    } catch (err) {
      console.error("[student-detail] error:", err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (error || !student) return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-zinc-700 dark:text-zinc-300 font-medium">{error || "Étudiant introuvable"}</p>
        <Link href="/instructor/students" className="mt-4 inline-flex items-center gap-2 text-teal-600 text-sm font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour aux étudiants
        </Link>
      </div>
    </div>
  );

  const totalPaid = student.courses.reduce((s, c) => s + (c.paymentStatus === "PAID" ? c.paymentAmount : 0), 0);
  const avgProgress = student.courses.length > 0
    ? Math.round(student.courses.reduce((s, c) => s + c.progressPercent, 0) / student.courses.length)
    : 0;
  const initials = student.name.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-400">

      {/* Back */}
      <Link href="/instructor/students" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        Retour aux étudiants
      </Link>

      {/* Student Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Decorative gradient header */}
        <div className="h-24 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-8 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-zinc-900 bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center font-extrabold text-xl text-teal-600 dark:text-teal-400 shadow-lg">
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{student.name}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {student.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                Plan {student.plan}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Depuis {new Date(student.joinedAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: "Cours suivis", value: student.courses.length, color: "text-teal-600" },
              { icon: TrendingUp, label: "Progression moy.", value: `${avgProgress}%`, color: avgProgress >= 60 ? "text-emerald-600" : "text-amber-500" },
              { icon: DollarSign, label: "Total payé", value: `${totalPaid.toLocaleString()} $`, color: "text-emerald-600" },
              { icon: Award, label: "Certificats", value: student.courses.filter(c => c.hasCertificate).length, color: "text-purple-600" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
                  <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Détail par cours
        </h2>

        {student.courses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cet étudiant n&apos;est inscrit à aucun de vos cours.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {student.courses.map(course => {
              const statusInfo = STATUS_MAP[course.enrollmentStatus] || STATUS_MAP.INACTIVE;
              const payInfo = PAY_MAP[course.paymentStatus] || PAY_MAP.none;
              const lessonsText = course.totalLessons > 0
                ? `${course.completedLessons} / ${course.totalLessons} leçons`
                : "Progression suivie";

              return (
                <div key={course.courseId} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Course header */}
                  <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white">{course.courseTitle}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Inscrit le {new Date(course.enrolledAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTA: go to student progress for this course */}
                    <Link
                      href={`/dashboard/courses/${course.courseId}/learn`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Voir la progression
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </Link>
                  </div>

                  {/* Body: Progress + Payment + Certificate */}
                  <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Progress */}
                    <div className="sm:col-span-1 space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Progression</p>
                      <ProgressBar percent={course.progressPercent} />
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {lessonsText}
                      </p>
                    </div>

                    {/* Payment */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paiement</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${payInfo.cls}`}>
                            {payInfo.label}
                          </span>
                          {course.paymentAmount > 0 && (
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{course.paymentAmount.toLocaleString()} $</span>
                          )}
                        </div>
                        {course.paymentDate && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(course.paymentDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {course.coursePrice > 0 && course.paymentStatus !== "PAID" && (
                          <p className="text-xs text-zinc-400">
                            Prix du cours : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{course.coursePrice} $</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Certificate */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Certification</p>
                      {course.hasCertificate ? (
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">Certifié !</p>
                            {course.certificateDate && (
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {new Date(course.certificateDate).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Circle className="w-4 h-4" />
                          <span className="text-xs">
                            {course.progressPercent >= 100 ? "Éligible — en attente d'émission" : `${Math.max(0, 100 - course.progressPercent)}% restant`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
