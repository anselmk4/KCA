"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  UserCheck,
  X,
  Check,
  Search,
  Sparkles,
  Loader2,
  BookOpen,
  Link2,
  Users,
  Globe,
  Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
  type?: "student" | "instructor";
}

interface CourseOption {
  id: string;
  title: string;
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  onSuccess,
}: ScheduleSessionModalProps) {
  const [sessionType, setSessionType] = useState<"LIVE_SESSION" | "COACHING_1ON1">("LIVE_SESSION");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [duration, setDuration] = useState("60");
  const [meetingProvider, setMeetingProvider] = useState("ANSELLA_LIVE");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Options & Selections
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch instructor courses
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", user.id);

        setCourses(courseData || []);

        // Build list of students & fellow instructors for invitation
        const inviteList: StudentOption[] = [];
        const courseIds = (courseData || []).map((c) => c.id);

        if (courseIds.length > 0) {
          const { data: enrollData } = await supabase
            .from("enrollments")
            .select("student_id")
            .in("course_id", courseIds);

          const studentIds = Array.from(new Set(enrollData?.map((e: any) => e.student_id).filter(Boolean)));

          if (studentIds.length > 0) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", studentIds);

            (profileData || []).forEach((p) => {
              inviteList.push({
                id: p.id,
                full_name: p.full_name || "Apprenant",
                email: p.email || "",
                type: "student",
              });
            });
          }
        }

        // Also fetch all student profiles as fallback
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .limit(50);

        (allProfiles || []).forEach((p) => {
          if (!inviteList.some((x) => x.id === p.id) && p.id !== user.id) {
            inviteList.push({
              id: p.id,
              full_name: p.full_name || "Utilisateur",
              email: p.email || "",
              type: "student",
            });
          }
        });

        setStudents(inviteList);
      } catch (err) {
        console.error("Error loading options:", err);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    if (sessionType === "COACHING_1ON1") {
      // Coaching 1-on-1: single student selection
      setSelectedUserIds([userId]);
    } else {
      // Private Live Masterclass: multi-selection
      if (selectedUserIds.includes(userId)) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      } else {
        setSelectedUserIds([...selectedUserIds, userId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Veuillez saisir un titre pour la séance.");
      return;
    }
    if (!date || !time) {
      setErrorMsg("Veuillez choisir la date et l'heure de début.");
      return;
    }

    // Validation for external meeting URLs
    if (meetingProvider !== "ANSELLA_LIVE" && !meetingUrl.trim()) {
      setErrorMsg(`Veuillez saisir le lien de réunion pour ${meetingProvider}.`);
      return;
    }

    // Validation for private / coaching target users
    const requiresUserSelection = sessionType === "COACHING_1ON1" || !isPublic;
    if (requiresUserSelection && selectedUserIds.length === 0) {
      setErrorMsg(
        sessionType === "COACHING_1ON1"
          ? "Veuillez sélectionner l'apprenant pour ce coaching 1-sur-1."
          : "Veuillez sélectionner au moins un participant pour cette séance privée."
      );
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = `${date}T${time}:00`;

      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scheduledAt,
          durationMinutes: Number(duration) || 60,
          sessionType,
          courseId: selectedCourseId || null,
          allowedUserIds: sessionType === "COACHING_1ON1" || !isPublic ? selectedUserIds : [],
          meetingProvider,
          meetingUrl: meetingUrl.trim(),
          isPublic: sessionType === "COACHING_1ON1" ? false : isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de création");

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la programmation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-inner">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Planifier une Séance sur le Calendrier</h2>
              <p className="text-xs text-teal-200/70">Masterclass Live ou Coaching individuel 1-sur-1</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-900 dark:text-white">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Session Type Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Type de Séance <span className="text-teal-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSessionType("LIVE_SESSION");
                  setIsPublic(true);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  sessionType === "LIVE_SESSION"
                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-extrabold text-sm">Masterclass Live</span>
                  </div>
                  {sessionType === "LIVE_SESSION" && <Check className="w-4 h-4 text-teal-500" />}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Session de groupe en direct pour une promotion complète.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSessionType("COACHING_1ON1");
                  setIsPublic(false);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  sessionType === "COACHING_1ON1"
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-sm">Coaching 1-sur-1</span>
                  </div>
                  {sessionType === "COACHING_1ON1" && <Check className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Accompagnement privé sur-mesure pour un étudiant sélectionné.</p>
              </button>
            </div>
          </div>

          {/* Visibility Option for Live Session */}
          {sessionType === "LIVE_SESSION" && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Visibilité de la Masterclass
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isPublic
                      ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Publique (Tous les inscrits)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !isPublic
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Privée / Restreinte</span>
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Titre de la Séance <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={sessionType === "COACHING_1ON1" ? "Ex: Mentorat personnalisé - Stratégie Trading" : "Ex: Live Q&A : Maîtriser l'Analyse On-Chain"}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Course Association */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Cours Associé (Optionnel)
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="">-- Aucun (Formation Générale) --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Target Student / User Selection (for Coaching or Private Live) */}
          {(sessionType === "COACHING_1ON1" || !isPublic) && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  {sessionType === "COACHING_1ON1" ? "Sélectionnez l'Apprenant (1-sur-1)" : "Sélectionnez les Participants Autorisés"} <span className="text-indigo-600">*</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {selectedUserIds.length} sélectionné(s)
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">Aucun utilisateur trouvé.</p>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedUserIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleUserSelection(s.id)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold shadow-md"
                            : "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800"
                        }`}
                      >
                        <div>
                          <p className="font-extrabold">{s.full_name}</p>
                          <p className="text-[10px] opacity-80">{s.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                          isSelected ? "bg-white text-indigo-600 border-white font-black" : "border-zinc-300 dark:border-zinc-700"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Date <span className="text-teal-600">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Heure de Début <span className="text-teal-600">*</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Durée (Minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure (60 min)</option>
                <option value="90">1h30 (90 min)</option>
                <option value="120">2 heures (120 min)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Description & Ordre du Jour
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez le programme, les sujets abordés et les prérequis..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-medium focus:outline-none"
            />
          </div>

          {/* Meeting Provider & Automatic Link Logic */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Plateforme de Visioconférence
            </label>

            <select
              value={meetingProvider}
              onChange={(e) => setMeetingProvider(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-medium focus:outline-none"
            >
              <option value="ANSELLA_LIVE">🟣 Ansella Visio Live (Généré automatiquement)</option>
              <option value="ZOOM">🔷 Zoom Meetings</option>
              <option value="GOOGLE_MEET">🟢 Google Meet</option>
              <option value="TEAMS">🟪 Microsoft Teams</option>
              <option value="OTHER">🌐 Autre service externe</option>
            </select>

            {meetingProvider === "ANSELLA_LIVE" ? (
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-700 dark:text-teal-300 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-teal-500" />
                <span>Le salon vidéo interactif sécurisé Ansella Live sera automatiquement généré dès la création de la séance.</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Lien de la Réunion ({meetingProvider}) <span className="text-teal-600">*</span>
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="url"
                    required
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder={`Saisissez le lien de réunion ${meetingProvider}...`}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
              <span>Planifier la Séance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
