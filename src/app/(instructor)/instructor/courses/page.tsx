"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Users,
  DollarSign,
  Edit3,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { CourseCreationWizardModal } from "@/components/courses/CourseCreationWizardModal";

type StatusFilter = "ALL" | "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  DRAFT: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
  REVIEW: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  ARCHIVED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  PUBLISHED: "Publié",
  DRAFT: "Brouillon",
  REVIEW: "En révision",
  ARCHIVED: "Archivé",
};

/** Strip HTML tags and decode entities for clean text display */
function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  return text.trim();
}

export default function InstructorCoursesPage() {
  const { t } = useLanguage();
  const getStatusLabel = (status: string) => {
    const isEn = !t("instructor.sidebar.courses", "Mes Cours").includes("Cours");
    if (status === "PUBLISHED") return isEn ? "Published" : "Publié";
    if (status === "DRAFT") return isEn ? "Draft" : "Brouillon";
    if (status === "REVIEW") return isEn ? "In Review" : "En révision";
    if (status === "ARCHIVED") return isEn ? "Archived" : "Archivé";
    return status;
  };
  const [session, setSession] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);

  // Stats / counts
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [revenueStats, setRevenueStats] = useState<Record<string, number>>({});
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});

  const loadDashboardData = useCallback(async () => {
    const activeSession = getSimulatedSession();
    if (!activeSession) return;

    try {
      const instructorId = activeSession.userId;
      
      // Fetch co-managed course IDs where this instructor is a collaborator
      const { data: collabData } = await (supabase as any)
        .from("course_collaborators")
        .select("course_id")
        .eq("collaborator_id", instructorId);
      const collabCourseIds = (collabData || []).map((c: any) => c.course_id);

      // Fetch courses owned or co-managed
      let query = supabase
        .from("courses")
        .select("id, title, description, status, price, level, thumbnail_url, instructor_id");
      
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

      // 2. Fetch enrollments
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("id, course_id")
        .in("course_id", courseIds);
      const enrollList = enrollData || [];

      // 3. Fetch order items & payments
      const { data: orderItems } = await (supabase as any)
        .from("order_items")
        .select("order_id, course_id")
        .in("course_id", courseIds);
      const orderItemList = orderItems || [];
      const orderIds = orderItemList.map((oi: any) => oi.order_id);

      let paymentsList: any[] = [];
      if (orderIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("amount, order_id")
          .eq("status", "PAID")
          .in("order_id", orderIds);
        paymentsList = paymentsData || [];
      }

      // 4. Fetch sections & lessons
      const { data: sectionsData } = await supabase
        .from("course_sections")
        .select("id, course_id")
        .in("course_id", courseIds);
      const sectionsList = sectionsData || [];

      const sectionIds = sectionsList.map((s: any) => s.id);
      let lessonsList: any[] = [];
      if (sectionIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, section_id")
          .in("section_id", sectionIds);
        lessonsList = lessonsData || [];
      }

      // Calculate stats for each course
      const ec: Record<string, number> = {};
      const rev: Record<string, number> = {};
      const sc: Record<string, number> = {};
      const lc: Record<string, number> = {};

      coursesList.forEach((c: any) => {
        ec[c.id] = enrollList.filter((e: any) => e.course_id === c.id).length;
        
        const courseOrderIds = orderItemList
          .filter((oi: any) => oi.course_id === c.id)
          .map((oi: any) => oi.order_id);
        rev[c.id] = paymentsList
          .filter((p: any) => courseOrderIds.includes(p.order_id))
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        const courseSecs = sectionsList.filter((s: any) => s.course_id === c.id);
        sc[c.id] = courseSecs.length;

        const courseSecIds = courseSecs.map((s: any) => s.id);
        lc[c.id] = lessonsList.filter((l: any) => courseSecIds.includes(l.section_id)).length;
      });

      setEnrollCounts(ec);
      setRevenueStats(rev);
      setSectionCounts(sc);
      setLessonCounts(lc);

    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeSession = getSimulatedSession();
    setSession(activeSession);
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDelete = async (courseId: string) => {
    if (confirm("Êtes‑vous sûr de vouloir supprimer ce cours ? Cette action est irréversible et supprimera tout son contenu (sections, leçons, quiz).")) {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) {
        console.error("Error deleting course:", error);
        alert("Erreur lors de la suppression: " + error.message);
      } else {
        await loadDashboardData();
      }
    }
  };

  const handleNewCourseClick = () => {
    const planLimits = {
      FREE: 1,
      BASE: 3,
      PRO: 10,
      MAX: Infinity,
    };
    const currentPlan = session?.plan || "FREE";
    const limit = planLimits[currentPlan as keyof typeof planLimits] || 1;

    if (myCourses.length >= limit) {
      setLimitMessage(
        `Votre abonnement actuel (${currentPlan}) vous limite à un maximum de ${limit} cours actif(s). Vous possédez déjà ${myCourses.length} cours.`
      );
      setShowLimitModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleWizardSubmit = async (courseData: {
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    price: number;
    isPaid: boolean;
    installmentsEnabled: boolean;
    installmentCount: number;
    level: string;
    thumbnailUrl: string;
    prerequisites: string;
  }) => {
    setCreating(true);
    const slug = courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 1000);

    const instructorId = session?.userId || "u3";

    const mapLevel = (lvl: string): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" => {
      if (lvl.includes("Débutant")) return "BEGINNER";
      if (lvl.includes("Intermédiaire")) return "INTERMEDIATE";
      if (lvl.includes("Avancé") || lvl.includes("Expert")) return "ADVANCED";
      return "BEGINNER";
    };

    const { error } = await supabase
      .from("courses")
      .insert({
        title: courseData.title,
        slug,
        description: courseData.description,
        price: courseData.price,
        level: mapLevel(courseData.level),
        thumbnail_url: courseData.thumbnailUrl,
        instructor_id: instructorId,
        status: "DRAFT"
      });

    if (error) {
      console.error("Error creating course:", error);
      alert("Erreur lors de la création du cours: " + error.message);
    } else {
      await loadDashboardData();
      setShowCreateModal(false);
    }
    setCreating(false);
  };

  if (loading || !session) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-56 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const filtered = myCourses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
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
              {t("student.payment.applyCoupon", "Boostez").toLowerCase().includes("appliqu") ? "Boost your Academy by upgrading to the Premium Plan!" : "Boostez votre Académie en passant au Plan Supérieur !"}
            </h2>
            <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
              {t("student.payment.applyCoupon", "Votre plan").toLowerCase().includes("appliqu")
                ? "Your current plan is limited to 1 active course, 15 students, and incurs a 20% transaction fee. Upgrade your Plan to unlock live sessions, reduce your transaction fees to 10% or less, and welcome unlimited students."
                : "Votre plan actuel est limité à 1 cours actif, 15 apprenants et comporte des frais de transaction de 20%. Passez au Plan supérieur pour débloquer les sessions live, réduire vos frais de transaction à 10% ou moins et accueillir des élèves en illimité."}
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              {t("student.payment.applyCoupon", "Passer").toLowerCase().includes("appliqu") ? "Upgrade Plan" : "Passer à l'offre supérieure"}
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              href="/instructor/billing"
              className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
            >
              {t("student.payment.applyCoupon", "Voir").toLowerCase().includes("appliqu") ? "View all pricing & benefits" : "Voir tous les tarifs & avantages"}
            </Link>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("instructor.sidebar.courses", "Mes Cours")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {t("student.payment.applyCoupon", "publiés").toLowerCase().includes("appliqu")
              ? `${myCourses.length} courses · ${myCourses.filter((c) => c.status === "PUBLISHED").length} published`
              : `${myCourses.length} cours · ${myCourses.filter((c) => c.status === "PUBLISHED").length} publiés`}
          </p>
        </div>
        <button
          onClick={handleNewCourseClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t("student.payment.applyCoupon", "Nouveau Cours").toLowerCase().includes("appliqu") ? "New Course" : "Nouveau Cours"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("student.payment.applyCoupon", "Rechercher").toLowerCase().includes("appliqu") ? "Search courses..." : "Rechercher un cours..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "PUBLISHED", "DRAFT", "REVIEW", "ARCHIVED"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === s
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 border border-teal-200 dark:border-teal-800"
                  : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {s === "ALL" ? (t("student.payment.applyCoupon", "Tous").toLowerCase().includes("appliqu") ? "All" : "Tous") : getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {t("student.payment.applyCoupon", "Aucun cours").toLowerCase().includes("appliqu") ? "No courses found" : "Aucun cours trouvé"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {search || statusFilter !== "ALL"
              ? (t("student.payment.applyCoupon", "Essayez").toLowerCase().includes("appliqu") ? "Try changing your filters." : "Essayez de modifier vos filtres.")
              : (t("student.payment.applyCoupon", "Créez").toLowerCase().includes("appliqu") ? "Create your first course to get started." : "Créez votre premier cours pour commencer.")}
          </p>
          {!search && statusFilter === "ALL" && (
            <button
              onClick={handleNewCourseClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {t("student.payment.applyCoupon", "Créer un cours").toLowerCase().includes("appliqu") ? "Create a Course" : "Créer un cours"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-4">{t("student.payment.applyCoupon", "Cours").toLowerCase().includes("appliqu") ? "Course" : "Cours"}</div>
            <div className="col-span-2 text-center">{t("student.payment.applyCoupon", "Syllabus").toLowerCase().includes("appliqu") ? "Syllabus" : "Syllabus"}</div>
            <div className="col-span-1 text-center">Étudiants</div>
            <div className="col-span-1 text-center">Revenu</div>
            <div className="col-span-1 text-center">Statut</div>
            <div className="col-span-1 text-center">Prix</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filtered.map((course) => {
            const enrollCount = enrollCounts[course.id] || 0;
            const revenue = revenueStats[course.id] || 0;
            const sectionCount = sectionCounts[course.id] || 0;
            const lessonCount = lessonCounts[course.id] || 0;
            const cleanDesc = stripHtml(course.description);

            return (
              <div
                key={course.id}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 px-6 py-5 items-center">
                  {/* Course Info */}
                  <div className="lg:col-span-4 w-full flex items-center gap-3">
                    {course.thumbnail_url ? (
                      <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800">
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{course.title}</p>
                      {cleanDesc && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{cleanDesc}</p>
                      )}
                      {course.level && (
                        <span className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded mt-1 inline-block">{course.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Grid layout wrapper for stats on mobile/tablet */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:contents gap-4 w-full lg:w-auto border-t border-b lg:border-none border-zinc-100 dark:border-zinc-800/60 py-4 lg:py-0 my-1 lg:my-0">
                    {/* Syllabus */}
                    <div className="lg:col-span-2 text-center">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {t("student.payment.applyCoupon", "sect.").toLowerCase().includes("appliqu") ? `${sectionCount} sect. · ${lessonCount} lessons` : `${sectionCount} sect. · ${lessonCount} leçons`}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{t("student.payment.applyCoupon", "Programme").toLowerCase().includes("appliqu") ? "Curriculum" : "Programme"}</p>
                    </div>

                    {/* Students */}
                    <div className="lg:col-span-1 flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{enrollCount}</span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><Users className="w-3 h-3" /> {t("student.payment.applyCoupon", "inscrits").toLowerCase().includes("appliqu") ? "enrolled" : "inscrits"}</span>
                    </div>

                    {/* Revenue */}
                    <div className="lg:col-span-1 flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{revenue.toLocaleString()}$</span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> {t("student.payment.applyCoupon", "revenu").toLowerCase().includes("appliqu") ? "revenue" : "revenu"}</span>
                    </div>

                    {/* Price */}
                    <div className="lg:col-span-1 flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {course.price > 0 ? `${course.price.toLocaleString()}$` : t("student.discover.free", "Gratuit")}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 lg:hidden">{t("student.payment.applyCoupon", "Prix").toLowerCase().includes("appliqu") ? "Price" : "Prix"}</span>
                    </div>
                  </div>

                  {/* Status & Actions container on mobile */}
                  <div className="flex flex-row lg:contents items-center justify-between lg:justify-end gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                    {/* Status */}
                    <div className="lg:col-span-1 flex justify-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[course.status]}`}>
                        {getStatusLabel(course.status)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-2 flex items-center justify-end gap-2 shrink-0">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {t("student.payment.applyCoupon", "Gérer").toLowerCase().includes("appliqu") ? "Manage" : "Gérer"}
                      </Link>
                      <Link
                        href={`/courses/${course.id}/preview`}
                        className="p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title={t("student.payment.applyCoupon", "Aperçu public").toLowerCase().includes("appliqu") ? "Public Preview" : "Aperçu public"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title={t("student.payment.applyCoupon", "Supprimer le cours").toLowerCase().includes("appliqu") ? "Delete Course" : "Supprimer le cours"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-step Course Creation Onboarding Wizard Modal */}
      <CourseCreationWizardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleWizardSubmit}
        creating={creating}
      />

      {/* Limit Alert Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t("student.payment.applyCoupon", "Limite").toLowerCase().includes("appliqu") ? "Plan limit reached" : "Limite du forfait atteinte"}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{limitMessage}</p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/instructor/billing"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Sparkles className="w-4 h-4" /> {t("student.payment.applyCoupon", "Voir les abonnements").toLowerCase().includes("appliqu") ? "View Subscriptions" : "Voir les abonnements"} <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {t("student.payment.applyCoupon", "Fermer").toLowerCase().includes("appliqu") ? "Close" : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
