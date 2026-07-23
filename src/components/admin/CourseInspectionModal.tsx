"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X, Check, AlertTriangle, Play, FileText, BookOpen, Clock, DollarSign,
  User, Edit3, Save, ExternalLink, ChevronRight, ChevronDown, HelpCircle,
  Loader2, RefreshCw, Send, CheckCircle2, ShieldAlert, Sparkles, Video,
  Layers, ArrowLeft
} from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface CourseInspectionModalProps {
  courseId: string | null;
  onClose: () => void;
  onStatusChanged: (courseId: string, newStatus: string) => void;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration_min?: number;
  order: number;
}

const REJECTION_TEMPLATES = [
  "Certaines leçons manquent de vidéos explicatives ou les liens sont inaccessibles.",
  "La description générale et le programme du cours nécessitent plus de précisions.",
  "La tarification proposée doit être ajustée selon nos standards académiques.",
  "Le contenu comporte des coquilles d'orthographe et de mise en forme à corriger.",
  "Veuillez ajouter des quiz ou évaluations pour valider la progression des apprenants."
];

export function CourseInspectionModal({ courseId, onClose, onStatusChanged }: CourseInspectionModalProps) {
  const [activeTab, setActiveTab] = useState<"meta" | "curriculum" | "viewer" | "editor">("curriculum");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Selection for viewer & editor
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Course Meta Form
  const [metaForm, setMetaForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    level: "BEGINNER",
  });

  // Lesson Edit Form
  const [lessonForm, setLessonForm] = useState({
    id: "",
    title: "",
    description: "",
    content: "",
    video_url: "",
    duration_min: 0,
  });

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");

      setCourse(data.course);
      setSections(data.sections || []);
      setStats(data.stats);

      setMetaForm({
        title: data.course.title || "",
        slug: data.course.slug || "",
        description: data.course.description || "",
        price: data.course.price || 0,
        level: data.course.level || "BEGINNER",
      });

      // Expand all sections by default
      const expanded: Record<string, boolean> = {};
      (data.sections || []).forEach((sec: Section) => { expanded[sec.id] = true; });
      setExpandedSections(expanded);

      // Select first lesson if available
      if (data.sections?.[0]?.lessons?.[0]) {
        setSelectedLesson(data.sections[0].lessons[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  if (!courseId) return null;

  // Toggle section accordion
  const toggleSection = (secId: string) => {
    setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Save Course Meta
  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "course", courseData: metaForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");
      setCourse(data.course);
      alert("Métadonnées du cours mises à jour avec succès !");
    } catch (e: any) {
      alert("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lesson", lessonData: lessonForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour de la leçon");

      // Refresh local state
      await fetchCourseDetails();
      setActiveTab("curriculum");
      alert("Leçon mise à jour avec succès !");
    } catch (e: any) {
      alert("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Approve / Publish
  const handleApprove = async () => {
    if (!confirm(`Approuver et publier le cours "${course.title}" immédiatement ?`)) return;
    setSubmittingStatus(true);
    try {
      const res = await fetch("/api/admin/courses/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, nextStatus: "PUBLISHED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de publication");

      onStatusChanged(courseId, "PUBLISHED");
      onClose();
    } catch (e: any) {
      alert("Erreur : " + e.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Submit Rejection / Return to Draft with Reason
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("Veuillez indiquer le motif des modifications requises.");
      return;
    }
    setSubmittingStatus(true);
    try {
      const res = await fetch("/api/admin/courses/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          nextStatus: "DRAFT",
          feedbackReason: rejectReason.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      onStatusChanged(courseId, "DRAFT");
      setShowRejectModal(false);
      onClose();
    } catch (e: any) {
      alert("Erreur : " + e.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const openLessonEditor = (l: Lesson) => {
    setSelectedLesson(l);
    setLessonForm({
      id: l.id,
      title: l.title || "",
      description: l.description || "",
      content: l.content || "",
      video_url: l.video_url || "",
      duration_min: l.duration_min || 0,
    });
    setActiveTab("editor");
  };

  const openLessonViewer = (l: Lesson) => {
    setSelectedLesson(l);
    setActiveTab("viewer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                  {loading ? "Chargement du cours..." : course?.title}
                </h2>
                {course && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    course.status === "REVIEW" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {course.status === "PUBLISHED" ? "Publié" : course.status === "REVIEW" ? "En révision" : "Brouillon"}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Formateur : {course?.profiles?.full_name || "N/A"} • ID: {courseId.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {course && (
              <a
                href={`/courses/${course.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Aperçu Apprenant
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("curriculum")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "curriculum"
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              Programme & Leçons ({stats?.totalLessons || 0})
            </button>

            <button
              onClick={() => setActiveTab("meta")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "meta"
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Éditer Métadonnées
            </button>

            {selectedLesson && (
              <button
                onClick={() => setActiveTab("viewer")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "viewer"
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <Play className="w-4 h-4 text-emerald-500" />
                Visionner Leçon : {selectedLesson.title.slice(0, 20)}...
              </button>
            )}

            {activeTab === "editor" && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400"
              >
                <Edit3 className="w-4 h-4" />
                Éditeur de Leçon
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-zinc-500">
            <span>{stats?.totalSections || 0} sections</span> •
            <span>{stats?.totalDurationMin || 0} min au total</span> •
            <span>{stats?.hasQuiz ? "Quiz présent ✓" : "Sans quiz"}</span>
          </div>
        </div>

        {/* ── Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-sm font-medium">Chargement complet de la formation...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: CURRICULUM */}
              {activeTab === "curriculum" && (
                <div className="space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white block">Description de la formation :</span>
                      <p className="text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">{stripHtml(course.description)}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 font-bold text-zinc-900 dark:text-white">
                      <span>Prix : {course.price}$</span>
                      <span>•</span>
                      <span>Catégorie : {course.categories?.name || "Général"}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-red-500" />
                      Sections et Leçons de la Formation
                    </h3>

                    {sections.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-2xl text-zinc-400 text-sm">
                        Aucune section créée pour ce cours.
                      </div>
                    ) : (
                      sections.map((sec, idx) => (
                        <div key={sec.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
                          {/* Section Header */}
                          <div
                            onClick={() => toggleSection(sec.id)}
                            className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
                              {expandedSections[sec.id] ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                              <span>Section {idx + 1} : {sec.title}</span>
                              <span className="text-xs font-normal text-zinc-400">({sec.lessons.length} leçons)</span>
                            </div>
                          </div>

                          {/* Lessons list */}
                          {expandedSections[sec.id] && (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {sec.lessons.length === 0 ? (
                                <div className="p-3 text-xs text-zinc-400 italic text-center">Aucune leçon dans cette section</div>
                              ) : (
                                sec.lessons.map((les, lIdx) => (
                                  <div key={les.id} className="px-4 py-3 flex items-center justify-between hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
                                        {lIdx + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{les.title}</p>
                                        <p className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                          {les.video_url ? (
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                              <Video className="w-3 h-3" /> Vidéo jointe
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1 text-zinc-400">
                                              <FileText className="w-3 h-3" /> Texte seul
                                            </span>
                                          )}
                                          {les.duration_min ? `• ${les.duration_min} min` : ""}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => openLessonViewer(les)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                      >
                                        <Play className="w-3 h-3" /> Tester
                                      </button>
                                      <button
                                        onClick={() => openLessonEditor(les)}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                      >
                                        <Edit3 className="w-3 h-3" /> Éditer
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT METADATA */}
              {activeTab === "meta" && (
                <form onSubmit={handleSaveMeta} className="space-y-5 max-w-2xl mx-auto">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-red-500" />
                    Modifier les Métadonnées Générales (Admin Override)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Titre de la formation</label>
                      <input
                        type="text"
                        required
                        value={metaForm.title}
                        onChange={e => setMetaForm({ ...metaForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Prix ($)</label>
                        <input
                          type="number"
                          min={0}
                          value={metaForm.price}
                          onChange={e => setMetaForm({ ...metaForm, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Niveau</label>
                        <select
                          value={metaForm.level}
                          onChange={e => setMetaForm({ ...metaForm, level: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                        >
                          <option value="BEGINNER">Débutant</option>
                          <option value="INTERMEDIATE">Intermédiaire</option>
                          <option value="ADVANCED">Avancé</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Description globale</label>
                      <textarea
                        rows={5}
                        value={metaForm.description}
                        onChange={e => setMetaForm({ ...metaForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Enregistrer les métadonnées
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: LESSON VIEWER */}
              {activeTab === "viewer" && selectedLesson && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab("curriculum")}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Retour au programme
                    </button>
                    <button
                      onClick={() => openLessonEditor(selectedLesson)}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Éditer cette leçon
                    </button>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{selectedLesson.title}</h3>
                    
                    {/* Video Player Box */}
                    {selectedLesson.video_url ? (
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-lg">
                        {selectedLesson.video_url.includes("youtube") || selectedLesson.video_url.includes("vimeo") ? (
                          <iframe
                            src={selectedLesson.video_url.replace("watch?v=", "embed/")}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={selectedLesson.video_url}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Cette leçon ne contient pas de vidéo enregistrée. Seul le contenu écrit ci-dessous sera affiché à l'étudiant.
                      </div>
                    )}

                    {/* Description */}
                    {selectedLesson.description && (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="font-bold block text-zinc-900 dark:text-white mb-1">Résumé de la leçon :</span>
                        {selectedLesson.description}
                      </div>
                    )}

                    {/* Content Markdown Body */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">Contenu Pédagogique (Markdown/Texte)</span>
                      <div className="prose dark:prose-invert max-w-none text-sm bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                        {selectedLesson.content ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                        ) : (
                          <p className="text-zinc-400 italic">Aucun texte pédagogique rédigé pour cette leçon.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LESSON EDITOR */}
              {activeTab === "editor" && (
                <form onSubmit={handleSaveLesson} className="space-y-5 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab("curriculum")}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Annuler et retour au programme
                    </button>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full">
                      Éditeur rapide Admin
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Titre de la leçon *</label>
                      <input
                        type="text"
                        required
                        value={lessonForm.title}
                        onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">URL Vidéo (mp4, youtube, vimeo)</label>
                        <input
                          type="text"
                          value={lessonForm.video_url}
                          onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Durée estimée (minutes)</label>
                        <input
                          type="number"
                          min={0}
                          value={lessonForm.duration_min}
                          onChange={e => setLessonForm({ ...lessonForm, duration_min: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Brève description</label>
                      <input
                        type="text"
                        value={lessonForm.description}
                        onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Contenu textuel (Markdown/HTML)</label>
                      <textarea
                        rows={8}
                        value={lessonForm.content}
                        onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("curriculum")}
                      className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sauvegarder la leçon
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* ── Sticky Action Footer ── */}
        {course && !loading && (
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Décision de modération pour : <strong>{course.title}</strong></span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submittingStatus}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Demander des modifications (Rejeter)
              </button>

              <button
                onClick={handleApprove}
                disabled={submittingStatus}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approuver & Publier
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Rejection Feedback Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Motif des modifications requises
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Précisez au formateur les corrections à apporter. Ces remarques lui seront envoyées par <strong>notification in-app</strong> et <strong>email</strong>.
            </p>

            {/* Templates Quick Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-zinc-400 block">Exemples fréquents :</span>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_TEMPLATES.map((tmpl, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setRejectReason(tmpl)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-zinc-600 dark:text-zinc-300 text-left transition-colors"
                  >
                    + {tmpl.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Indiquez ici les détails des modifications à apporter par le formateur..."
              className="w-full p-3.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submittingStatus || !rejectReason.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer le motif & Rejeter en Brouillon
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
