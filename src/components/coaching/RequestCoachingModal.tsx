"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  Calendar,
  MessageSquare,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface RequestCoachingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseId?: string;
  defaultCourseTitle?: string;
  onRequestSubmitted?: () => void;
}

interface EnrolledCourse {
  id: string;
  title: string;
  instructor_id?: string;
}

export function RequestCoachingModal({
  isOpen,
  onClose,
  defaultCourseId,
  defaultCourseTitle,
  onRequestSubmitted,
}: RequestCoachingModalProps) {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourseId || "");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>(defaultCourseTitle || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("Semaine prochaine - Après-midi");
  
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserCourses();
      setSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultCourseId) setSelectedCourseId(defaultCourseId);
    if (defaultCourseTitle) setSelectedCourseTitle(defaultCourseTitle);
  }, [defaultCourseId, defaultCourseTitle]);

  const fetchUserCourses = async () => {
    setLoadingCourses(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingCourses(false);
        return;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(id, title, instructor_id)")
        .eq("student_id", user.id);

      if (enrollments && enrollments.length > 0) {
        const list: EnrolledCourse[] = enrollments
          .map((e: any) => e.courses)
          .filter(Boolean);
        setCourses(list);
        if (!selectedCourseId && list.length > 0) {
          setSelectedCourseId(list[0].id);
          setSelectedCourseTitle(list[0].title);
        }
      }
    } catch (err) {
      console.error("Error fetching courses for coaching modal:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Veuillez renseigner le sujet et les détails de votre besoin.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const res = await fetch("/api/coaching/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId || null,
          courseTitle: selectedCourse?.title || selectedCourseTitle || "Mentorat Général",
          instructorId: selectedCourse?.instructor_id || null,
          subject: subject.trim(),
          message: message.trim(),
          preferredTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'envoi de la demande");
      }

      setSuccess(true);
      if (onRequestSubmitted) onRequestSubmitted();
      setTimeout(() => {
        setSuccess(false);
        setSubject("");
        setMessage("");
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error("Coaching request submit error:", err);
      setErrorMsg(err.message || "Une erreur s'est produite lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 via-zinc-900 to-indigo-950 text-white relative flex items-center justify-between border-b border-teal-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                Demander un Coaching 1-sur-1
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-teal-200/80 mt-0.5">
                Session visio individuelle et personnalisée avec votre formateur.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {success ? (
            <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                Demande transmise avec succès !
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Votre formateur a été notifié. Vous recevrez une confirmation avec l&apos;heure précise et le lien visio dès qu&apos;il aura validé le créneau.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Course Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" /> Cours Concerné
                </label>

                {loadingCourses ? (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Chargement de vos cours...
                  </div>
                ) : courses.length > 0 ? (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      const c = courses.find((x) => x.id === e.target.value);
                      if (c) setSelectedCourseTitle(c.title);
                    }}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedCourseTitle || "Mentorat & Suivi Général"}
                    onChange={(e) => setSelectedCourseTitle(e.target.value)}
                    placeholder="Titre de la formation ou sujet"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" /> Sujet du Coaching <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Déblocage exercice Trading / Correction code Smart Contract"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Détails de votre besoin <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez ce que vous souhaitez débloquer ou réviser durant cette séance de coaching individuel..."
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-medium"
                />
              </div>

              {/* Preferred Availability */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Préférences de Créneau
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="Dès que possible">Dès que possible</option>
                  <option value="Semaine prochaine - Matin (9h - 12h)">Semaine prochaine - Matin (9h - 12h)</option>
                  <option value="Semaine prochaine - Après-midi (14h - 18h)">Semaine prochaine - Après-midi (14h - 18h)</option>
                  <option value="Semaine prochaine - Soirée (18h - 20h)">Semaine prochaine - Soirée (18h - 20h)</option>
                  <option value="Week-end">Week-end</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Envoyer la Demande
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
