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
  Lock,
  Check,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────
// Types locaux (sync avec sync.ts)
// ─────────────────────────────────────────────────────────
type Course = { id: string; title: string; description: string; instructorName: string; thumbnailUrl?: string | null };
type Section = { id: string; courseId: string; title: string; order: number };
type Lesson = {
  id: string; sectionId: string; title: string;
  description: string; content: string; videoUrl: string; durationMin: number; order: number;
};
type Quiz = { id: string; courseId: string; title: string; passPercentage: number; sectionId?: string };
type Question = { id: string; quizId: string; text: string; choices: string[]; correctIndex: number };
type QuizAttempt = { id: string; quiz_id: string; score: number; passed: boolean; created_at: string };
type LessonProgress = { lesson_id: string; completed: boolean; completed_at: string | null };

function getVideoEmbedInfo(url: string) {
  if (!url) return null;

  // YouTube regex
  const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`,
    };
  }

  // Vimeo regex
  const vimeoRegex = /^(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
    };
  }

  // Dailymotion regex
  const dmRegex = /^(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
  const dmMatch = url.match(dmRegex);
  if (dmMatch && dmMatch[1]) {
    return {
      type: "dailymotion",
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?ui-logo=0&ui-start-screen-info=0`,
    };
  }

  // Fallback to direct video file
  return {
    type: "direct",
    embedUrl: url,
  };
}

function getVideoThumbnail(url: string, fallback: string) {
  if (!url) return fallback;

  // YouTube
  const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // Dailymotion
  const dmRegex = /^(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/;
  const dmMatch = url.match(dmRegex);
  if (dmMatch && dmMatch[1]) {
    return `https://www.dailymotion.com/thumbnail/video/${dmMatch[1]}`;
  }

  return fallback;
}

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
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeHomework, setActiveHomework] = useState<any | null>(null);
  const [lockedReason, setLockedReason] = useState<string | null>(null);

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
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    setVideoPlaying(false);
  }, [activeLesson]);
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
      .select("id, title, description, instructor_id, thumbnail_url, profiles!instructor_id(full_name)")
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
      thumbnailUrl: courseData.thumbnail_url || null,
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

    // 10. Devoirs
    const { data: homeworksData } = await (supabase as any)
      .from("homeworks")
      .select("*")
      .eq("course_id", courseId);
    setHomeworks(homeworksData || []);

    // 11. Soumissions
    const { data: subsData } = await (supabase as any)
      .from("homework_submissions")
      .select("*")
      .eq("student_id", user.id);
    setSubmissions(subsData || []);

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

  // ─── Vérifier si une section est déverrouillée ──────────────
  const isSectionUnlocked = useCallback((sectionId: string) => {
    const sIdx = sections.findIndex(s => s.id === sectionId);
    if (sIdx <= 0) return true; // Première section toujours accessible

    for (let i = 0; i < sIdx; i++) {
      const prevSect = sections[i];
      const prevSectQuizzes = quizzes.filter(q => q.sectionId === prevSect.id);
      if (prevSectQuizzes.length > 0) {
        // L'étudiant doit avoir validé au moins un quiz de cette section avec succès
        const passedQuiz = prevSectQuizzes.some(q => {
          const attempts = quizAttempts.filter(a => a.quiz_id === q.id);
          return attempts.some(a => a.passed);
        });
        if (!passedQuiz) return false;
      }
    }
    return true;
  }, [sections, quizzes, quizAttempts]);

  // ─── Gérer le clic sur un élément du programme (cours, quiz, devoir) ──
  const handleItemClick = (type: "lesson" | "quiz" | "homework", item: any, section: Section) => {
    const unlocked = isSectionUnlocked(section.id);
    if (!unlocked) {
      const sIdx = sections.findIndex(s => s.id === section.id);
      const prevSectionWithQuiz = sections
        .slice(0, sIdx)
        .reverse()
        .find(s => quizzes.some(q => q.sectionId === s.id));
      setLockedReason(prevSectionWithQuiz ? prevSectionWithQuiz.title : "le chapitre précédent");
      setActiveLesson(null);
      setActiveQuiz(null);
      setActiveHomework(null);
      return;
    }

    setLockedReason(null);
    if (type === "lesson") {
      setActiveLesson(item);
      setActiveQuiz(null);
      setActiveHomework(null);
    } else if (type === "quiz") {
      setActiveQuiz(item);
      setActiveLesson(null);
      setActiveHomework(null);
      setQuizSubmitted(false);
      setSelectedAnswers({});
    } else if (type === "homework") {
      setActiveHomework(item);
      setActiveLesson(null);
      setActiveQuiz(null);
    }
  };

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

  useEffect(() => {
    if (progressPercent === 100 && !hasCertificate && !loading && userId) {
      checkCertificate();
    }
  }, [progressPercent, hasCertificate, loading, userId, checkCertificate]);

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
              const sectionHomeworks = homeworks.filter(h => h.section_id === section.id || h.sectionId === section.id);
              const isSectionOpen = !!expandedSections[section.id];
              const isUnlocked = isSectionUnlocked(section.id);

              return (
                <div key={section.id}>
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                    className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider line-clamp-1 flex items-center gap-1.5">
                      {!isUnlocked && <Lock className="w-3 h-3 text-zinc-400" />}
                      M{sIdx + 1} : {section.title}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSectionOpen && (
                    <div className="bg-zinc-50/30 dark:bg-zinc-900/40 p-2 space-y-1 border-t border-zinc-100 dark:border-zinc-800">
                      {sectionLessons.length === 0 && sectionQuizzes.length === 0 && sectionHomeworks.length === 0 && (
                        <p className="text-[10px] text-zinc-400 p-2 italic text-center">Aucun contenu</p>
                      )}

                      {sectionLessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id && !activeQuiz && !activeHomework;
                        const isDone = completedLessons.has(lesson.id);
                        const isToggling = togglingLesson === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleItemClick("lesson", lesson, section)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-semibold"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                onClick={(e) => {
                                  if (!isUnlocked) return;
                                  handleToggleComplete(lesson.id, e);
                                }}
                                className="mt-0.5 shrink-0 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              >
                                {!isUnlocked ? (
                                  <Lock className="w-3.5 h-3.5 text-zinc-400 mt-0.5" />
                                ) : isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                ) : isDone ? (
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                              <span className="text-xs truncate leading-snug">{lesson.title}</span>
                            </div>
                            {isUnlocked && (
                              <span className="text-[10px] text-zinc-400 shrink-0 font-mono ml-2">{lesson.durationMin}m</span>
                            )}
                          </button>
                        );
                      })}

                      {sectionQuizzes.map((quiz) => {
                        const isActive = activeQuiz?.id === quiz.id && !activeLesson && !activeHomework;
                        const attempts = quizAttempts.filter(a => a.quiz_id === quiz.id);
                        const isQuizPassed = attempts.some(a => a.passed);
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => handleItemClick("quiz", quiz, section)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-semibold"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {!isUnlocked ? (
                                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              ) : (
                                <FileText className={`w-4 h-4 shrink-0 ${isQuizPassed ? "text-green-500" : "text-amber-500"}`} />
                              )}
                              <span className="text-xs truncate font-medium">QCM : {quiz.title}</span>
                            </div>
                            {isUnlocked && isQuizPassed && (
                              <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Validé</span>
                            )}
                          </button>
                        );
                      })}

                      {sectionHomeworks.map((hw) => {
                        const isActive = activeHomework?.id === hw.id && !activeLesson && !activeQuiz;
                        const sub = submissions.find(s => s.homework_id === hw.id);
                        const isGraded = sub?.status === "GRADED";
                        const isSubmitted = sub?.status === "SUBMITTED" || isGraded;
                        return (
                          <button
                            key={hw.id}
                            onClick={() => handleItemClick("homework", hw, section)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {!isUnlocked ? (
                                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              ) : (
                                <FileText className={`w-4 h-4 shrink-0 ${isGraded ? "text-green-500" : isSubmitted ? "text-blue-500" : "text-indigo-500"}`} />
                              )}
                              <span className="text-xs truncate font-medium">Devoir : {hw.title}</span>
                            </div>
                            {isUnlocked && (isGraded ? (
                              <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                {sub.grade}/100
                              </span>
                            ) : isSubmitted ? (
                              <span className="text-[10px] font-bold text-blue-500 shrink-0 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                Remis
                              </span>
                            ) : null)}
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

          {/* CASE C: Chapitre verrouillé */}
          {lockedReason ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center py-20 animate-in slide-in-from-right-3 duration-300 space-y-6">
              <div className="inline-flex p-4 rounded-full bg-zinc-50/50 dark:bg-zinc-800/50">
                <Lock className="w-16 h-16 text-zinc-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">🔒 Chapitre Verrouillé</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Pour débloquer ce chapitre et accéder à son contenu, vous devez d'abord réussir le quiz du chapitre précédent.
                </p>
                <p className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg w-fit mx-auto mt-3 border border-amber-200 dark:border-amber-900/30">
                  Requis : Réussir le Quiz de "{lockedReason}"
                </p>
              </div>
            </div>
          ) : activeQuiz ? (
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
                <div className="space-y-6 animate-in zoom-in-95 duration-200">
                  {/* Summary Banner */}
                  <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-900 shadow-md">
                      <Award className={`w-16 h-16 ${quizPassed ? "text-green-500 animate-bounce" : "text-amber-500 animate-pulse"}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Score obtenu : {scorePercent}%</h3>
                      <p className={`text-sm font-bold ${quizPassed ? "text-green-500" : "text-red-500"}`}>
                        {quizPassed
                          ? "✓ Félicitations ! Vous avez validé ce test avec succès."
                          : `✗ Score insuffisant. Minimum requis : ${activeQuiz.passPercentage}%.`}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                      {quizPassed
                        ? "Ce test est validé et comptabilisé dans les critères de déblocage de votre certificat final."
                        : "Révisez les leçons de ce module et consultez la correction ci-dessous avant de retenter votre chance."}
                    </p>
                    <div className="flex justify-center gap-3 pt-2 flex-wrap">
                      <button
                        onClick={() => { setQuizSubmitted(false); setSelectedAnswers({}); }}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Recommencer le test
                      </button>
                      <button
                        onClick={() => { setActiveQuiz(null); if (lessons.length > 0) setActiveLesson(lessons[0]); }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Retourner aux leçons
                      </button>
                      {quizPassed && hasCertificate && (
                        <Link
                          href="/dashboard/certificates"
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 animate-pulse"
                        >
                          <Award className="w-3.5 h-3.5" /> Voir mon Certificat
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Detailed Correction & Results for each Question */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      Détail des résultats & correction question par question :
                    </h4>
                    {activeQuizQuestions.map((q, idx) => {
                      const userChoice = selectedAnswers[q.id];
                      const isCorrect = userChoice === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          className={`p-5 rounded-2xl border transition-all space-y-3 ${
                            isCorrect
                              ? "bg-green-50/40 dark:bg-green-950/10 border-green-200 dark:border-green-900/30"
                              : "bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/30"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white flex gap-2">
                              <span className={isCorrect ? "text-green-600 font-black" : "text-red-600 font-black"}>Q{idx + 1}.</span>
                              <span>{q.text}</span>
                            </p>
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                              isCorrect ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            }`}>
                              {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {q.choices.map((choice, cIdx) => {
                              const isSelectedByUser = userChoice === cIdx;
                              const isActualCorrect = q.correctIndex === cIdx;

                              let choiceStyle = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400";
                              if (isActualCorrect) {
                                choiceStyle = "bg-green-100/80 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-200 font-bold shadow-sm";
                              } else if (isSelectedByUser && !isCorrect) {
                                choiceStyle = "bg-red-100/80 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-200 font-bold line-through";
                              }

                              return (
                                <div
                                  key={cIdx}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${choiceStyle}`}
                                >
                                  <span>{choice}</span>
                                  {isActualCorrect && (
                                    <span className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 bg-green-200/60 dark:bg-green-900/40 px-2 py-0.5 rounded-md">
                                      ✓ Bonne réponse
                                    </span>
                                  )}
                                  {isSelectedByUser && !isActualCorrect && (
                                    <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 bg-red-200/60 dark:bg-red-900/40 px-2 py-0.5 rounded-md">
                                      Votre choix
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeLesson ? (
            /* CASE B: Leçon active */
            <div className="space-y-6">
              {activeLesson.videoUrl && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-lg group">
                  {(() => {
                    const embedInfo = getVideoEmbedInfo(activeLesson.videoUrl);
                    if (!embedInfo) return null;

                    const thumbnail = getVideoThumbnail(activeLesson.videoUrl, course?.thumbnailUrl || "/images/courses/web3.png");

                    return !videoPlaying && embedInfo.type !== "direct" ? (
                      <div 
                        onClick={() => setVideoPlaying(true)}
                        className="absolute inset-0 w-full h-full cursor-pointer select-none"
                      >
                        <img 
                          src={thumbnail} 
                          alt={activeLesson.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-zinc-900/95 flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 group-hover:text-white text-zinc-900 dark:text-white border border-white/20">
                            <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const finalUrl = embedInfo.type !== "direct" 
                            ? `${embedInfo.embedUrl}${embedInfo.embedUrl.includes('?') ? '&' : '?'}autoplay=1` 
                            : embedInfo.embedUrl;

                          return embedInfo.type === "direct" ? (
                            <video
                              src={finalUrl}
                              controls
                              autoPlay
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          ) : (
                            <iframe
                              src={finalUrl}
                              className="absolute inset-0 w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={activeLesson.title}
                            />
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>
              )}

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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stripHtml(activeLesson.description)}</p>
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
                  ) : hasCertificate ? (
                    <Link
                      href="/dashboard/certificates"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <Award className="w-4 h-4 animate-pulse" />
                      Voir le Certificat
                    </Link>
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
          ) : activeHomework ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6 animate-in slide-in-from-right-3 duration-300">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-md mb-2">
                    <FileText className="w-3.5 h-3.5" /> Devoir à soumettre
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{activeHomework.title}</h2>
                  {activeHomework.deadline && (
                    <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Date limite : {new Date(activeHomework.deadline).toLocaleString("fr-FR")}
                    </p>
                  )}
                </div>
                {(() => {
                  const sub = submissions.find(s => s.homework_id === activeHomework.id);
                  if (!sub) return null;
                  return (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Statut</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === "GRADED" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>
                        {sub.status === "GRADED" ? `Corrigé : ${sub.grade}/100` : "Remis"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-zinc-50 dark:bg-zinc-800/25 border border-zinc-150 dark:border-zinc-800 rounded-xl">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Consignes et instructions :</p>
                  <p className="text-xs text-zinc-650 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{activeHomework.description || "Aucune consigne spécifique rédigée."}</p>
                </div>

                {activeHomework.file_url && (
                  <div className="flex items-center justify-between p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Ressource / Sujet du devoir</p>
                        <p className="text-[10px] text-zinc-400">Cliquez pour télécharger le document d'instructions.</p>
                      </div>
                    </div>
                    <a
                      href={activeHomework.file_url}
                      download={`sujet-${activeHomework.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Télécharger
                    </a>
                  </div>
                )}

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Votre travail</h3>
                  
                  {(() => {
                    const sub = submissions.find(s => s.homework_id === activeHomework.id);
                    return (
                      <div className="space-y-4">
                        {sub?.feedback && (
                          <div className="p-4 bg-emerald-50/10 dark:bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-1">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">Commentaire du formateur :</p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">"{sub.feedback}"</p>
                          </div>
                        )}

                        <div className="p-5 bg-zinc-50/50 dark:bg-zinc-800/10 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center py-8">
                          {sub ? (
                            <div className="space-y-3 w-full">
                              <FileText className="w-10 h-10 text-green-500 mx-auto" />
                              <div>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">Fichier soumis avec succès</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Soumis le {new Date(sub.submitted_at || sub.created_at).toLocaleString("fr-FR")}</p>
                              </div>
                              {sub.status !== "GRADED" ? (
                                <div className="pt-2 flex justify-center gap-3">
                                  <a
                                    href={sub.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-855 dark:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Visualiser ma soumission
                                  </a>
                                  <button
                                    onClick={() => {
                                      if (confirm("Voulez-vous remplacer votre soumission actuelle ?")) {
                                        document.getElementById("student-homework-upload")?.click();
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Remplacer le fichier
                                  </button>
                                </div>
                              ) : (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-855 dark:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Visualiser ma soumission corrigée
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
                              <div>
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Aucun travail soumis pour le moment</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Chargez un document PDF, Word ou archive ZIP contenant votre travail.</p>
                              </div>
                              <button
                                onClick={() => document.getElementById("student-homework-upload")?.click()}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 cursor-pointer transition-all flex items-center gap-1.5 mx-auto"
                              >
                                Déposer mon devoir
                              </button>
                            </div>
                          )}

                          <input
                            type="file"
                            id="student-homework-upload"
                            accept=".pdf,.doc,.docx,.zip,.txt"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                alert("Le document est trop volumineux (Max 5 Mo).");
                                return;
                              }
                              setTogglingLesson("uploading");
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  const res = await fetch("/api/homework-submissions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      homeworkId: activeHomework.id,
                                      fileUrl: reader.result as string
                                    })
                                  });
                                  if (res.ok) {
                                    alert("Devoir soumis avec succès !");
                                    await loadData();
                                  } else {
                                    const err = await res.json();
                                    alert("Erreur : " + err.error);
                                  }
                                } catch (err) {
                                  alert("Erreur de connexion.");
                                } finally {
                                  setTogglingLesson(null);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold">Bienvenue dans votre espace d&apos;apprentissage</h2>
              <p className="text-zinc-500 max-w-md mx-auto mt-2">
                Sélectionnez un élément dans le menu de gauche pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
