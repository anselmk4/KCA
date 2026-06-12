"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { deleteCourse, addCourse, getDB, Database } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

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

export default function InstructorCoursesPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setDb(getDB());
    setSession(getSimulatedSession());
  }, []);

  const handleDelete = (courseId: string) => {
    if (confirm("Êtes‑vous sûr de vouloir supprimer ce cours ? Cette action est irréversible et supprimera tout son contenu (sections, leçons, quiz).")) {
      deleteCourse(courseId);
      setDb(getDB());
    }
  };

  if (!db || !session) {
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

  const instructorId = session.userId || "u3";
  const myCourses = db.courses.filter((c) => c.instructorId === instructorId);

  const filtered = myCourses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNewCourseClick = () => {
    const planLimits = {
      FREE: 1,
      BASE: 3,
      PRO: 10,
      MAX: Infinity,
    };
    const currentPlan = session.plan || "FREE";
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

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    addCourse({
      title: newTitle.trim(),
      slug,
      description: newDescription.trim() || "Nouveau cours en préparation.",
      price: parseFloat(newPrice) || 0,
      instructorId: instructorId,
      instructorName: session.name || "Prof. Kuettu",
    });
    setDb(getDB());
    setNewTitle("");
    setNewDescription("");
    setNewPrice("");
    setShowCreateModal(false);
    setCreating(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
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

      {/* Course Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const enrollCount = db.enrollments.filter((e) => e.courseId === course.id).length;
            const revenue = db.transactions
              .filter((tx) => tx.courseId === course.id && tx.status === "PAID")
              .reduce((sum, tx) => sum + tx.amount, 0);
            const sectionCount = db.sections.filter((s) => s.courseId === course.id).length;
            const lessonCount = db.sections
              .filter((s) => s.courseId === course.id)
              .flatMap((s) => db.lessons.filter((l) => l.sectionId === s.id)).length;

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Colored top bar */}
                <div className="h-2 bg-gradient-to-r from-teal-400 to-emerald-500" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[course.status]}`}>
                      {statusLabels[course.status]}
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {course.price > 0 ? `${course.price}$` : "Gratuit"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {enrollCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {sectionCount} sect. · {lessonCount} leçons
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {revenue.toLocaleString()}$
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="flex-1 text-center px-3 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-lg text-xs font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                      Gérer le cours
                    </Link>
                    <Link
                      href={`/courses/${course.id}/preview`}
                      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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
