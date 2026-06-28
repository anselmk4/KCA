"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Play,
  FileText,
  CheckCircle,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────
// Types locaux (sync avec sync.ts)
// ─────────────────────────────────────────────────────────
type Course = { id: string; title: string; description: string; instructorName: string };
type Section = { id: string; courseId: string; title: string; order: number };
type Lesson = {
  id: string; sectionId: string; title: string;
  description: string; content: string; videoUrl: string; durationMin: number; order: number;
};
type Quiz = { id: string; courseId: string; title: string; passPercentage: number; sectionId?: string };
type Question = { id: string; quizId: string; text: string; choices: string[]; correctIndex: number };
type QuizAttempt = { id: string; quiz_id: string; score: number; passed: boolean; created_at: string };
type LessonProgress = { lesson_id: string; completed: boolean; completed_at: string | null };

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [hasCertificate, setHasCertificate] = useState(false);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Quiz taking state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Progress toggle state
  const [togglingLesson, setTogglingLesson] = useState<string | null>(null);
  const [checkingCert, setCheckingCert] = useState(false);

  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Chargement des données depuis Supabase ───────────────
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Vérifier session auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    // 2. Vérifier enrollment actif
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, progress_percent")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    // Aussi vérifier si COMPLETED
    const { data: completedEnrollment } = !enrollment
      ? await supabase
          .from("enrollments")
          .select("id, progress_percent")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .eq("status", "COMPLETED")
          .maybeSingle()
      : { data: null };

    const activeEnrollment = enrollment || completedEnrollment;

    if (!activeEnrollment) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }

    // 3. Charger le cours
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, description, instructor_id, profiles!instructor_id(full_name)")
      .eq("id", courseId)
      .maybeSingle();

    if (!courseData) {
      setLoading(false);
      return;
    }

    setCourse({
      id: courseData.id,
      title: courseData.title,
      description: courseData.description || "",
      instructorName: (courseData as any).profiles?.full_name || "Instructeur",
    });

    // 4. Sections
    const { data: sectionsData } = await supabase
      .from("course_sections")
      .select("id, course_id, title, sort_order")
      .eq("course_id", courseId)
      .order("sort_order");

    const localSections: Section[] = (sectionsData || []).map(s => ({
      id: s.id, courseId: s.course_id, title: s.title, order: s.sort_order,
    }));
    setSections(localSections);

    // 5. Leçons
    const sectionIds = localSections.map(s => s.id);
    const { data: lessonsData } = sectionIds.length > 0
      ? await supabase
          .from("lessons")
          .select("id, section_id, title, description, content, video_url, duration_minutes, sort_order")
          .in("section_id", sectionIds)
          .order("sort_order")
      : { data: [] };

    const localLessons: Lesson[] = (lessonsData || []).map(l => ({
      id: l.id, sectionId: l.section_id, title: l.title,
      description: l.description || "", content: l.content || "",
      videoUrl: l.video_url || "", durationMin: l.duration_minutes || 0, order: l.sort_order,
    }));
    setLessons(localLessons);

    if (localLessons.length > 0) {
      setActiveLesson(localLessons[0]);
      setExpandedSections({ [localLessons[0].sectionId]: true });
    }

    // 6. Quiz + Questions
    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("id, course_id, title, pass_percentage, section_id")
      .eq("course_id", courseId);

    const localQuizzes: Quiz[] = (quizzesData || []).map(q => ({
      id: q.id, courseId: q.course_id, title: q.title,
      passPercentage: q.pass_percentage || 80, sectionId: q.section_id || undefined,
    }));
    setQuizzes(localQuizzes);

    const quizIds = localQuizzes.map(q => q.id);
    if (quizIds.length > 0) {
      const { data: questionsData } = await supabase
        .from("questions")
        .select("id, quiz_id, text, choices, correct_index")
        .in("quiz_id", quizIds);

      setQuestions(
        (questionsData || []).map(q => ({
          id: q.id, quizId: q.quiz_id, text: q.text,
          choices: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices as string),
          correctIndex: q.correct_index,
        }))
      );
    }

    // 7. Progression des leçons
    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed, completed_at")
      .eq("enrollment_id", activeEnrollment.id);

    setLessonProgress(
      (progressData || []).map(p => ({
        lesson_id: p.lesson_id,
        completed: p.completed ?? false,
        completed_at: p.completed_at,
      }))
    );

    const completedCount = (progressData || []).filter(p => p.completed).length;
    const pct = localLessons.length > 0 ? Math.round((completedCount / localLessons.length) * 100) : 0;
    setProgressPercent(pct);

    // 8. Tentatives de quiz
    if (quizIds.length > 0) {
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id, score, passed, created_at")
        .eq("student_id", user.id)
        .in("quiz_id", quizIds);
      setQuizAttempts(attemptsData || []);
    }

    // 9. Certificat
    const { data: cert } = await supabase
      .from("certificates")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    setHasCertificate(!!cert);

    setLoading(false);
  }, [courseId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activeLesson) {
      setExpandedSections(prev => ({ ...prev, [activeLesson.sectionId]: true }));
    }
  }, [activeLesson]);

  // ─── Completed lessons set (calculé depuis lessonProgress) ───
  const completedLessons = useMemo(
    () => new Set(lessonProgress.filter(p => p.completed).map(p => p.lesson_id)),
    [lessonProgress]
  );

  // ─── Vérifier éligibilité certificat via API serveur ────────
  const checkCertificate = useCallback(async () => {
    if (hasCertificate || checkingCert) return;
    setCheckingCert(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok && data.eligible) {
        setHasCertificate(true);
        if (!data.alreadyIssued) {
          alert("🎉 Félicitations ! Votre certificat de réussite est maintenant disponible !");
        }
      }
    } catch (err) {
      console.error("[CourseLearnPage] Certificate check error:", err);
    } finally {
      setCheckingCert(false);
    }
  }, [courseId, hasCertificate, checkingCert]);

  // ─── Toggle complétion d'une leçon → API Supabase ───────────
  const handleToggleComplete = async (lessonId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!userId || togglingLesson === lessonId) return;

    const currentlyCompleted = completedLessons.has(lessonId);
    const newCompleted = !currentlyCompleted;

    setTogglingLesson(lessonId);

    // Mise à jour optimiste locale
    setLessonProgress(prev => {
      const existing = prev.find(p => p.lesson_id === lessonId);
      if (existing) {
        return prev.map(p =>
          p.lesson_id === lessonId
            ? { ...p, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
            : p
        );
      }
      return [...prev, { lesson_id: lessonId, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }];
    });

    // Recalcul progression
    const nextCount = newCompleted ? completedLessons.size + 1 : completedLessons.size - 1;
    const pct = lessons.length > 0 ? Math.round((nextCount / lessons.length) * 100) : 0;
    setProgressPercent(pct);

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId, completed: newCompleted }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("[handleToggleComplete] API error:", err);
        // Rollback optimiste
        setLessonProgress(prev =>
          prev.map(p =>
            p.lesson_id === lessonId
              ? { ...p, completed: currentlyCompleted, completed_at: currentlyCompleted ? new Date().toISOString() : null }
              : p
          )
        );
        setProgressPercent(
          lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0
        );
      } else {
        const data = await res.json();
        if (data.progressPercent !== undefined) setProgressPercent(data.progressPercent);
        // Tenter de déclencher le certificat si 100%
        if (newCompleted && data.progressPercent === 100) {
          await checkCertificate();
        }
      }
    } catch (err) {
      console.error("[handleToggleComplete] Network error:", err);
    } finally {
      setTogglingLesson(null);
    }
  };

  // ─── Soumettre un quiz → API serveur ────────────────────────
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz || !userId || quizSubmitting) return;
    setQuizSubmitting(true);

    try {
      const res = await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: activeQuiz.id, courseId, answers: selectedAnswers }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[handleQuizSubmit] API error:", data);
        alert(data.error || "Erreur lors de la soumission du quiz.");
        return;
      }

      setScorePercent(data.score);
      setQuizPassed(data.passed);
      setQuizSubmitted(true);

      // Ajouter la tentative au state local
      setQuizAttempts(prev => [
        ...prev,
        {
          id: data.attempt.id,
          quiz_id: data.attempt.quiz_id,
          score: data.attempt.score,
          passed: data.attempt.passed,
          created_at: data.attempt.created_at,
        },
      ]);

      // Si quiz passé → vérifier éligibilité certificat
      if (data.passed) {
        await checkCertificate();
      }
    } catch (err) {
      console.error("[handleQuizSubmit] Network error:", err);
      alert("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const generalQuizzes = useMemo(() => quizzes.filter(q => !q.sectionId), [quizzes]);

  // Flat ordered list of all lessons for prev/next navigation
  const orderedLessons = useMemo(() => {
    return sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((s) => lessons.filter((l) => l.sectionId === s.id).sort((a, b) => a.order - b.order));
  }, [sections, lessons]);

  const activeLessonIndex = useMemo(
    () => (activeLesson ? orderedLessons.findIndex((l) => l.id === activeLesson.id) : -1),
    [activeLesson, orderedLessons]
  );

  const prevLesson = activeLessonIndex > 0 ? orderedLessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex >= 0 && activeLessonIndex < orderedLessons.length - 1
    ? orderedLessons[activeLessonIndex + 1]
    : null;

  const goToLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveQuiz(null);
    setExpandedSections((prev) => ({ ...prev, [lesson.sectionId]: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeQuizQuestions = useMemo(() => {
    if (!activeQuiz) return [];
    return questions.filter(q => q.quizId === activeQuiz.id);
  }, [activeQuiz, questions]);

  const getEmbedVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  const videoSrc = activeLesson ? getEmbedVideoUrl(activeLesson.videoUrl) : "";

  // ─── Loading / Auth states ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 p-8 space-y-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
        <h2 className="text-xl font-bold">Accès Verrouillé</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Vous n&apos;êtes pas inscrit à cette formation ou votre paiement n&apos;est pas validé.
        </p>
        <Link
          href={`/courses/${courseId}`}
          className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl"
        >
          Découvrir et s&apos;inscrire
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">

      {/* Back + Certificate banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Mes formations
        </Link>
        {hasCertificate ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Award className="w-4 h-4 animate-bounce" />
            <span>Cours validé ! Certificat débloqué.</span>
            <Link href="/dashboard/certificates" className="underline ml-2 hover:text-emerald-700">
              Voir le certificat
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Progression: {progressPercent}% · Quiz requis: score ≥ 80%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Pane: Sidebar sections/lessons */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[75vh]">
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{course?.title}</h3>
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span>LEÇONS</span>
              <span>{progressPercent}% ({completedLessons.size}/{lessons.length})</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {sections.map((section, sIdx) => {
              const sectionLessons = lessons.filter(l => l.sectionId === section.id);
              const sectionQuizzes = quizzes.filter(q => q.sectionId === section.id);
              const isSectionOpen = !!expandedSections[section.id];

              return (
                <div key={section.id}>
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                    className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider line-clamp-1">
                      M{sIdx + 1} : {section.title}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSectionOpen && (
                    <div className="bg-zinc-50/30 dark:bg-zinc-900/40 p-2 space-y-1 border-t border-zinc-100 dark:border-zinc-800">
                      {sectionLessons.length === 0 && sectionQuizzes.length === 0 && (
                        <p className="text-[10px] text-zinc-400 p-2 italic text-center">Aucun contenu</p>
                      )}

                      {sectionLessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id && !activeQuiz;
                        const isDone = completedLessons.has(lesson.id);
                        const isToggling = togglingLesson === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-semibold"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                onClick={(e) => handleToggleComplete(lesson.id, e)}
                                className="mt-0.5 shrink-0 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                ) : isDone ? (
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                              <span className="text-xs truncate leading-snug">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 shrink-0 font-mono ml-2">{lesson.durationMin}m</span>
                          </button>
                        );
                      })}

                      {sectionQuizzes.map((quiz) => {
                        const isActive = activeQuiz?.id === quiz.id;
                        const attempts = quizAttempts.filter(a => a.quiz_id === quiz.id);
                        const isQuizPassed = attempts.some(a => a.passed);
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => {
                              setActiveQuiz(quiz); setActiveLesson(null);
                              setQuizSubmitted(false); setSelectedAnswers({});
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-semibold"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className={`w-4 h-4 shrink-0 ${isQuizPassed ? "text-green-500" : "text-amber-500"}`} />
                              <span className="text-xs truncate font-medium">QCM : {quiz.title}</span>
                            </div>
                            {isQuizPassed && (
                              <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Validé</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Évaluations finales (quiz sans section) */}
            {generalQuizzes.length > 0 && (
              <div className="border-t border-zinc-150 dark:border-zinc-800">
                <div className="py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800/10 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Évaluations Finales</span>
                </div>
                <div className="p-2 space-y-1">
                  {generalQuizzes.map((quiz) => {
                    const isActive = activeQuiz?.id === quiz.id;
                    const attempts = quizAttempts.filter(a => a.quiz_id === quiz.id);
                    const isQuizPassed = attempts.some(a => a.passed);
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => {
                          setActiveQuiz(quiz); setActiveLesson(null);
                          setQuizSubmitted(false); setSelectedAnswers({});
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-semibold"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${isQuizPassed ? "text-green-500" : "text-amber-500"}`} />
                          <span className="text-xs truncate font-medium">{quiz.title}</span>
                        </div>
                        {isQuizPassed && (
                          <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Validé</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Content viewer */}
        <div className="lg:col-span-3 space-y-6">

          {/* CASE A: Quiz actif */}
          {activeQuiz ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6 animate-in slide-in-from-right-3 duration-300">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md mb-2">
                    <FileText className="w-3.5 h-3.5" /> Évaluation QCM
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{activeQuiz.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Score requis : <span className="font-bold text-blue-600">{activeQuiz.passPercentage}%</span>
                  </p>
                </div>
                {(() => {
                  const attempts = quizAttempts.filter(a => a.quiz_id === activeQuiz.id);
                  if (attempts.length === 0) return null;
                  const best = Math.max(...attempts.map(a => a.score));
                  return (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Meilleur score</p>
                      <p className={`text-2xl font-black ${best >= activeQuiz.passPercentage ? "text-green-500" : "text-amber-500"}`}>{best}%</p>
                    </div>
                  );
                })()}
              </div>

              {!quizSubmitted ? (
                <form onSubmit={handleQuizSubmit} className="space-y-8">
                  {activeQuizQuestions.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic py-6">Aucune question configurée pour ce QCM.</p>
                  ) : (
                    <div className="space-y-6">
                      {activeQuizQuestions.map((q, idx) => (
                        <div key={q.id} className="p-5 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white flex gap-2">
                            <span className="text-blue-600 font-bold">Q{idx + 1}.</span>
                            <span>{q.text}</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {q.choices.map((choice, cIdx) => {
                              const isChecked = selectedAnswers[q.id] === cIdx;
                              return (
                                <label
                                  key={cIdx}
                                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer text-xs font-medium transition-all ${
                                    isChecked
                                      ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                                      : "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 hover:border-zinc-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    required
                                    name={`q_${q.id}`}
                                    checked={isChecked}
                                    onChange={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: cIdx }))}
                                    className="accent-blue-600"
                                  />
                                  <span>{choice}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeQuizQuestions.length > 0 && (
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                      <button
                        type="submit"
                        disabled={quizSubmitting}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-70"
                      >
                        {quizSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Soumission...</>
                        ) : (
                          <><ShieldCheck className="w-4 h-4" /> Soumettre mes réponses</>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="inline-flex p-4 rounded-full bg-zinc-50 dark:bg-zinc-800">
                    <Award className={`w-16 h-16 ${quizPassed ? "text-green-500 animate-bounce" : "text-amber-500 animate-pulse"}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Score : {scorePercent}%</h3>
                    <p className={`text-sm font-bold ${quizPassed ? "text-green-500" : "text-red-500"}`}>
                      {quizPassed
                        ? "✓ Félicitations ! Vous avez validé ce test avec succès."
                        : `✗ Score insuffisant. Minimum requis : ${activeQuiz.passPercentage}%.`}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {quizPassed
                      ? "Ce test est validé et comptabilisé dans les critères de déblocage de votre certificat final."
                      : "Révisez les leçons de ce module et retentez votre chance."}
                  </p>
                  <div className="flex justify-center gap-4 pt-4">
                    <button
                      onClick={() => { setQuizSubmitted(false); setSelectedAnswers({}); }}
                      className="px-5 py-2.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Recommencer
                    </button>
                    <button
                      onClick={() => { setActiveQuiz(null); if (lessons.length > 0) setActiveLesson(lessons[0]); }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      Retourner aux leçons
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeLesson ? (
            /* CASE B: Leçon active */
            <div className="space-y-6">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-lg">
                {activeLesson.videoUrl ? (
                  <iframe
                    src={videoSrc}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950">
                    <Play className="w-12 h-12 text-zinc-600 animate-pulse" />
                    <p className="text-xs font-semibold text-zinc-400">Aucune vidéo associée à cette leçon</p>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {activeLessonIndex >= 0 && (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {activeLessonIndex + 1} / {orderedLessons.length}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{activeLesson.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeLesson.durationMin} minutes</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Leçon d&apos;apprentissage</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleComplete(activeLesson.id, e)}
                    disabled={togglingLesson === activeLesson.id}
                    className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer border transition-all disabled:opacity-70 ${
                      completedLessons.has(activeLesson.id)
                        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {togglingLesson === activeLesson.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className={`w-4 h-4 ${completedLessons.has(activeLesson.id) ? "fill-green-500 text-white" : ""}`} />
                    )}
                    {completedLessons.has(activeLesson.id) ? "Complété" : "Marquer comme terminé"}
                  </button>
                </div>

                <div className="space-y-4">
                  {activeLesson.description && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-200/50">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Résumé de la leçon :</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{activeLesson.description}</p>
                    </div>
                  )}
                  <div className="prose dark:prose-invert max-w-none text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-2">
                    {activeLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                    ) : (
                      <p>Aucun contenu écrit pour cette leçon. Regardez la vidéo ci-dessus pour comprendre les concepts clés.</p>
                    )}
                  </div>
                </div>

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800 gap-4">
                  <button
                    onClick={() => prevLesson && goToLesson(prevLesson)}
                    disabled={!prevLesson}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Leçon précédente</span>
                    <span className="sm:hidden">Préc.</span>
                  </button>

                  <div className="text-center text-xs text-zinc-400 font-medium hidden sm:block">
                    {prevLesson && <p className="truncate max-w-[140px] text-zinc-400">← {prevLesson.title}</p>}
                  </div>

                  {nextLesson ? (
                    <button
                      onClick={() => goToLesson(nextLesson)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10"
                    >
                      <span className="hidden sm:inline">Leçon suivante</span>
                      <span className="sm:hidden">Suiv.</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : generalQuizzes.length > 0 ? (
                    <button
                      onClick={() => { setActiveQuiz(generalQuizzes[0]); setActiveLesson(null); setQuizSubmitted(false); setSelectedAnswers({}); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      Passer le Quiz final
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => checkCertificate()}
                      disabled={checkingCert}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-60"
                    >
                      {checkingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Obtenir le Certificat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold">Bienvenue dans votre espace d&apos;apprentissage</h2>
              <p className="text-zinc-500 max-w-md mx-auto mt-2">
                Sélectionnez une leçon dans le panneau de gauche pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
