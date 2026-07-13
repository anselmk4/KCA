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

      // 1. Fetch courses owned by the instructor
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, description, status, price, level, thumbnail_url")
        .eq("instructor_id", instructorId);

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

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const instructorId = session?.userId || "u3";

    const { error } = await supabase
      .from("courses")
      .insert({
        title: newTitle.trim(),
        slug,
        description: newDescription.trim() || "Nouveau cours en préparation.",
        price: parseFloat(newPrice) || 0,
        instructor_id: instructorId,
        status: "DRAFT"
      });

    if (error) {
      console.error("Error creating course:", error);
      alert("Erreur lors de la création du cours: " + error.message);
    } else {
      await loadDashboardData();
      setNewTitle("");
      setNewDescription("");
      setNewPrice("");
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
              Boostez votre Académie en passant au Plan Supérieur !
            </h2>
            <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
              Votre plan actuel est limité à <span className="font-bold text-zinc-900 dark:text-white">1 cours actif</span>, <span className="font-bold text-zinc-900 dark:text-white">15 apprenants</span> et comporte des frais de transaction de <span className="font-bold text-zinc-900 dark:text-white">50%</span>. 
              Passez au Plan supérieur pour débloquer les <span className="font-semibold text-blue-600 dark:text-blue-400">sessions live</span>, réduire vos frais de transaction à <span className="font-semibold text-teal-600 dark:text-teal-400">10% ou moins</span> et accueillir des élèves en illimité.
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Cours</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {myCourses.length} cours · {myCourses.filter((c) => c.status === "PUBLISHED").length} publiés
          </p>
        </div>
        <button
          onClick={handleNewCourseClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nouveau Cours
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
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
              {s === "ALL" ? "Tous" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Aucun cours trouvé
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {search || statusFilter !== "ALL"
              ? "Essayez de modifier vos filtres."
              : "Créez votre premier cours pour commencer."}
          </p>
          {!search && statusFilter === "ALL" && (
            <button
              onClick={handleNewCourseClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Créer un cours
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-4">Cours</div>
            <div className="col-span-2 text-center">Syllabus</div>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-5 items-center">
                  {/* Course Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    {course.thumbnail_url ? (
                      <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800">
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{course.title}</p>
                      {cleanDesc && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{cleanDesc}</p>
                      )}
                      {course.level && (
                        <span className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded mt-1 inline-block">{course.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Syllabus */}
                  <div className="col-span-2 text-center">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{sectionCount} sect. · {lessonCount} leçons</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Programme</p>
                  </div>

                  {/* Students */}
                  <div className="col-span-1 flex flex-col items-center gap-0.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{enrollCount}</span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><Users className="w-3 h-3" /> inscrits</span>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-1 flex flex-col items-center gap-0.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{revenue.toLocaleString()}$</span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> revenu</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[course.status]}`}>
                      {statusLabels[course.status]}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 flex justify-center">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {course.price > 0 ? `${course.price.toLocaleString()}$` : "Gratuit"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Gérer
                    </Link>
                    <Link
                      href={`/courses/${course.id}/preview`}
                      className="p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Aperçu public"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Supprimer le cours"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nouveau Cours</h2>
              <p className="text-sm text-zinc-500 mt-1">Remplissez les informations de base.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Titre du cours *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Introduction au DeFi"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Prix ($)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0 = Gratuit"
                  min="0"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                {creating ? "Création..." : "Créer le cours"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Alert Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Limite du forfait atteinte</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{limitMessage}</p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/instructor/billing"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Sparkles className="w-4 h-4" /> Voir les abonnements <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
