"use client";

import { useState, useEffect } from "react";
import {
  X,
  GraduationCap,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";

type CourseSession = {
  id: string;
  courseId: string;
  courseTitle?: string;
  name: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | string;
  startDate: string | null;
  endDate: string | null;
  maxCapacity?: number | null;
  studentsCount?: number;
};

type AssignSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  currentSessionId?: string | null;
  currentSessionName?: string | null;
  availableSessions?: CourseSession[];
  onSuccess: () => void;
};

export function AssignSessionModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  courseId,
  courseTitle,
  currentSessionId,
  currentSessionName,
  availableSessions = [],
  onSuccess,
}: AssignSessionModalProps) {
  const [sessions, setSessions] = useState<CourseSession[]>(availableSessions);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSessionId || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If availableSessions was not preloaded or empty, fetch from API
  useEffect(() => {
    if (!isOpen) return;
    setSelectedSessionId(currentSessionId || "");
    setError(null);
    setSuccessMsg(null);

    async function fetchSessions() {
      if (availableSessions.length > 0) {
        setSessions(availableSessions.filter((s) => s.courseId === courseId));
        return;
      }
      setLoadingSessions(true);
      try {
        const res = await fetch(`/api/instructor/courses/${courseId}/sessions`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoadingSessions(false);
      }
    }

    fetchSessions();
  }, [isOpen, courseId, currentSessionId, availableSessions]);

  if (!isOpen) return null;

  async function handleAssign() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/instructor/students/assign-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          courseId,
          sessionId: selectedSessionId ? selectedSessionId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'assigner la classe.");
      }

      setSuccessMsg(data.message || "Classe mise à jour avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En cours
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-2.5 h-2.5" />
            À venir
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Terminée
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Affecter à une Classe / Session
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Cours : <span className="font-semibold text-zinc-700 dark:text-zinc-200">{courseTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student card info */}
        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Apprenant</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{studentName}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Session actuelle</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {currentSessionName ? `🎓 ${currentSessionName}` : "⚠️ Non assigné"}
            </p>
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sessions list selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Sélectionnez la session de rattachement
          </label>

          {loadingSessions ? (
            <div className="py-8 flex items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Chargement des sessions du cours...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {/* Option 0: Non assigné */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedSessionId === ""
                    ? "border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 ring-1 ring-teal-500/50"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="assignedSession"
                    value=""
                    checked={selectedSessionId === ""}
                    onChange={() => setSelectedSessionId("")}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Non assigné à une session
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      L&apos;étudiant restera en attente d&apos;attribution d&apos;une promotion.
                    </p>
                  </div>
                </div>
              </label>

              {/* Sessions list */}
              {sessions.map((sess) => {
                const isSelected = selectedSessionId === sess.id;
                const startDateFormatted = sess.startDate
                  ? new Date(sess.startDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;
                const endDateFormatted = sess.endDate
                  ? new Date(sess.endDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                return (
                  <label
                    key={sess.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-1 ring-teal-500/50"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="assignedSession"
                        value={sess.id}
                        checked={isSelected}
                        onChange={() => setSelectedSessionId(sess.id)}
                        className="mt-0.5 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-white">
                            {sess.name}
                          </p>
                          {getStatusBadge(sess.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                          {startDateFormatted && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Début : {startDateFormatted}
                            </span>
                          )}
                          {endDateFormatted && <span>Fin : {endDateFormatted}</span>}
                          {sess.studentsCount !== undefined && (
                            <span className="flex items-center gap-1 font-medium text-zinc-500">
                              <Users className="w-3 h-3" /> {sess.studentsCount} inscrit(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}

              {sessions.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                  <p className="text-xs font-semibold text-zinc-500">
                    Aucune classe/session n&apos;est encore créée pour ce cours.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Créez une session depuis la page de gestion du cours (&quot;Inscriptions &amp; Cohortes&quot;).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting || loadingSessions}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmer l&apos;affectation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
