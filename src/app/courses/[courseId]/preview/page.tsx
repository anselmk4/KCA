"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Play,
  ClipboardCheck,
  ArrowLeft,
  Check,
  RotateCcw,
  BookOpen,
  Award,
  HelpCircle,
  Menu,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Types locaux ─────────────────────────────────────────
type Course = {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  instructorId: string;
};

type Section = {
  id: string;
  courseId: string;
  title: string;
  order: number;
};

type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  durationMin: number;
  order: number;
};

type Quiz = {
  id: string;
  courseId: string;
  title: string;
  passPercentage: number;
  sectionId?: string;
};

type Question = {
  id: string;
  quizId: string;
  text: string;
  choices: string[];
  correctIndex: number;
};

type ContentType = {
  type: "lesson" | "quiz";
  id: string;
};

export default function CoursePreviewPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout & Navigation States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeContent, setActiveContent] = useState<ContentType | null>(null);

  // Quiz Player States
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    total: number;
    validated: boolean;
  } | null>(null);

  const loadPreviewData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Charger les données du cours
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, instructor_id, profiles!instructor_id(full_name)")
        .eq("id", courseId)
        .maybeSingle();

      if (courseError || !courseData) {
        console.error("[PreviewPlayer] Error loading course:", courseError?.message);
        setLoading(false);
        return;
      }

      setCourse({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || "",
        instructorId: courseData.instructor_id,
        instructorName: (courseData as any).profiles?.full_name || "Instructeur",
      });

      // 2. Charger les sections
      const { data: sectionsData } = await supabase
        .from("course_sections")
        .select("id, course_id, title, sort_order")
        .eq("course_id", courseId)
        .order("sort_order");

      const localSections: Section[] = (sectionsData || []).map((s) => ({
        id: s.id,
        courseId: s.course_id,
        title: s.title,
        order: s.sort_order,
      }));
      setSections(localSections);

      // Auto-expand all loaded sections by default
      const defaultExpanded: Record<string, boolean> = {};
      localSections.forEach((s) => {
        defaultExpanded[s.id] = true;
      });
      setExpandedSections(defaultExpanded);

      // 3. Charger les leçons
      const sectionIds = localSections.map((s) => s.id);
      if (sectionIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, section_id, title, description, content, video_url, duration_minutes, sort_order")
          .in("section_id", sectionIds)
          .order("sort_order");

        const localLessons: Lesson[] = (lessonsData || []).map((l) => ({
          id: l.id,
          sectionId: l.section_id,
          title: l.title,
          description: l.description || "",
          content: l.content || "",
          videoUrl: l.video_url || "",
          durationMin: l.duration_minutes || 0,
          order: l.sort_order,
        }));
        setLessons(localLessons);

        if (localLessons.length > 0) {
          setActiveContent({ type: "lesson", id: localLessons[0].id });
        }
      }

      // 4. Charger les quiz
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, course_id, title, pass_percentage, section_id")
        .eq("course_id", courseId);

      const localQuizzes: Quiz[] = (quizzesData || []).map((q) => ({
        id: q.id,
        courseId: q.course_id,
        title: q.title,
        passPercentage: q.pass_percentage || 80,
        sectionId: q.section_id || undefined,
      }));
      setQuizzes(localQuizzes);

      const quizIds = localQuizzes.map((q) => q.id);
      if (quizIds.length > 0) {
        const { data: questionsData } = await supabase
          .from("questions")
          .select("id, quiz_id, text, choices, correct_index")
          .in("quiz_id", quizIds);

        setQuestions(
          (questionsData || []).map((q) => ({
            id: q.id,
            quizId: q.quiz_id,
            text: q.text,
            choices: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices as string),
            correctIndex: q.correct_index,
          }))
        );
      }
    } catch (err) {
      console.error("[PreviewPlayer] Unexpected load error:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadPreviewData();
  }, [loadPreviewData]);

  // Selected content helpers
  const activeLesson = useMemo(() => {
    if (activeContent?.type !== "lesson") return null;
    return lessons.find((l) => l.id === activeContent.id) || null;
  }, [activeContent, lessons]);

  const activeQuiz = useMemo(() => {
    if (activeContent?.type !== "quiz") return null;
    return quizzes.find((q) => q.id === activeContent.id) || null;
  }, [activeContent, quizzes]);

  const activeQuestions = useMemo(() => {
    if (!activeQuiz) return [];
    return questions.filter((q) => q.quizId === activeQuiz.id);
  }, [activeQuiz, questions]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSelectContent = (item: ContentType) => {
    setActiveContent(item);
    setSelectedChoices({});
    setQuizResult(null);
  };

  const handleSelectChoice = (questionId: string, choiceIndex: number) => {
    if (quizResult?.validated) return;
    setSelectedChoices((prev) => ({
      ...prev,
      [questionId]: choiceIndex,
    }));
  };

  const handleValidateQuiz = () => {
    if (!activeQuiz || activeQuestions.length === 0) return;

    const answeredCount = Object.keys(selectedChoices).length;
    if (answeredCount < activeQuestions.length) {
      alert("Veuillez répondre à toutes les questions avant de valider.");
      return;
    }

    let correctAnswers = 0;
    activeQuestions.forEach((qn) => {
      if (selectedChoices[qn.id] === qn.correctIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / activeQuestions.length) * 100);
    const passed = score >= activeQuiz.passPercentage;

    setQuizResult({
      score,
      passed,
      correctAnswers,
      total: activeQuestions.length,
      validated: true,
    });
  };

  const handleResetQuiz = () => {
    setSelectedChoices({});
    setQuizResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">Chargement de la prévisualisation...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Cours introuvable</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 text-center max-w-sm">Cette formation n&apos;existe pas ou a été retirée de la base de données.</p>
        <button
          onClick={() => router.push("/instructor/courses")}
          className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Retour aux formations
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-850 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push(`/instructor/courses/${course.id}`)}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold truncate text-zinc-900 dark:text-white">{course.title}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              Mode Prévisualisation Instructeur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase">Aperçu interactif</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`w-80 border-r border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-900/20 shrink-0 flex flex-col min-h-0 transition-transform lg:translate-x-0 z-20 absolute lg:relative inset-y-0 left-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Programme du cours</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-full">
              {sections.length} Chapitres
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {sections.map((section, sectIdx) => {
              const sectionLessons = lessons.filter((l) => l.sectionId === section.id);
              const sectionQuizzes = quizzes.filter((q) => q.sectionId === section.id);
              const isExpanded = !!expandedSections[section.id];

              return (
                <div key={section.id} className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-900/10 overflow-hidden">
                  <div
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between px-3.5 py-3 bg-zinc-100/50 dark:bg-zinc-900/40 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />}
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {sectIdx + 1}. {section.title}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-850 divide-y divide-zinc-100 dark:divide-zinc-900">
                      {sectionLessons.map((lesson) => {
                        const active = activeContent?.type === "lesson" && activeContent.id === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => handleSelectContent({ type: "lesson", id: lesson.id })}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 cursor-pointer text-xs transition-all ${
                              active
                                ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500 font-bold"
                                : "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {lesson.videoUrl ? <Video className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />}
                            <span className="truncate flex-1">{lesson.title}</span>
                            <span className="text-[10px] text-zinc-450 shrink-0 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {lesson.durationMin}m
                            </span>
                          </div>
                        );
                      })}

                      {sectionQuizzes.map((quiz) => {
                        const active = activeContent?.type === "quiz" && activeContent.id === quiz.id;
                        return (
                          <div
                            key={quiz.id}
                            onClick={() => handleSelectContent({ type: "quiz", id: quiz.id })}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 cursor-pointer text-xs transition-all ${
                              active
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500 font-bold"
                                : "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 text-zinc-650 dark:text-zinc-400"
                            }`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-amber-550 shrink-0" />
                            <span className="truncate flex-1 font-medium">Quiz : {quiz.title}</span>
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">QCM</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Right Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col min-h-0">
          {activeContent ? (
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              {/* LESSON PLAYER */}
              {activeLesson && (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                  {/* Video player card */}
                  {activeLesson.videoUrl && (
                    <div className="aspect-video bg-black rounded-3xl border border-zinc-200 dark:border-zinc-850 overflow-hidden relative shadow-lg shrink-0 max-w-4xl mx-auto w-full">
                      <video
                        src={activeLesson.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Title & metadata bar */}
                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 p-6 rounded-3xl space-y-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-extrabold uppercase">
                        Leçon
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {activeLesson.durationMin} minutes
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>

                  {/* HTML Content rendering */}
                  <div className="flex-1 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 md:p-8 overflow-y-auto space-y-4">
                    {activeLesson.content ? (
                      <article
                        className="prose prose-zinc dark:prose-invert prose-teal max-w-none text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                      />
                    ) : (
                      <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                        Aucun contenu textuel interactif rédigé pour cette leçon.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QUIZ PLAYER */}
              {activeQuiz && (
                <div className="max-w-2xl mx-auto w-full space-y-6 py-4">
                  {/* Quiz Details Panel */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase">
                        Quiz Interactif
                      </span>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-2 leading-tight">{activeQuiz.title}</h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        {activeQuestions.length} questions · Seuil d&apos;admission {activeQuiz.passPercentage}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                  </div>

                  {activeQuestions.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-12 text-center text-zinc-400 dark:text-zinc-500">
                      <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold">Aucune question n&apos;a encore été insérée dans ce quiz.</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-650 mt-1">Veuillez repasser sur l&apos;éditeur instructeur.</p>
                    </div>
                  ) : !quizResult?.validated ? (
                    /* Attempt View */
                    <div className="space-y-5">
                      <div className="space-y-4">
                        {activeQuestions.map((qn, qIdx) => (
                          <div
                            key={qn.id}
                            className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 p-6 rounded-3xl space-y-4 shadow-sm"
                          >
                            <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 leading-snug">
                              Question {qIdx + 1}. {qn.text}
                            </p>
                            <div className="grid grid-cols-1 gap-2.5">
                              {qn.choices.map((choice, cIdx) => {
                                const selected = selectedChoices[qn.id] === cIdx;
                                return (
                                  <div
                                    key={cIdx}
                                    onClick={() => handleSelectChoice(qn.id, cIdx)}
                                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all hover:pl-5 ${
                                      selected
                                        ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold"
                                        : "border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-405"
                                    }`}
                                  >
                                    <span>{choice}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      selected ? "border-teal-500 bg-teal-500" : "border-zinc-300 dark:border-zinc-700"
                                    }`}>
                                      {selected && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-950 font-bold" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleValidateQuiz}
                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                      >
                        Valider mes réponses (Simulation)
                      </button>
                    </div>
                  ) : (
                    /* Result View */
                    <div className="space-y-6">
                      <div className={`p-8 border rounded-3xl text-center space-y-4 shadow-xl ${
                        quizResult.passed
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-450"
                          : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400"
                      }`}>
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2 shrink-0 animate-in zoom-in-95 duration-500">
                          {quizResult.passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                            {quizResult.passed ? "Examen Réussi !" : "Examen Échoué"}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {quizResult.passed
                              ? `Félicitations ! Vous avez validé ce quiz avec succès.`
                              : `Seuil requis de réussite : ${activeQuiz.passPercentage}%. Veuillez réviser et réessayer.`
                            }
                          </p>
                        </div>
                        <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                          {quizResult.score}%
                        </div>
                        <div className="text-xs text-zinc-500">
                          {quizResult.correctAnswers} / {quizResult.total} questions correctes
                        </div>
                      </div>

                      {/* Question correction detail */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white px-1">Correction Détaillée</h4>
                        {activeQuestions.map((qn, qIdx) => {
                          const chosen = selectedChoices[qn.id];
                          const isCorrect = chosen === qn.correctIndex;

                          return (
                            <div
                              key={qn.id}
                              className={`p-5 rounded-3xl border ${
                                isCorrect
                                  ? "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-850"
                                  : "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-950/20"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3 gap-2">
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-450">Question {qIdx + 1}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  isCorrect ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                }`}>
                                  {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 leading-snug mb-3">{qn.text}</p>
                              
                              <div className="space-y-2">
                                {qn.choices.map((choice, cIdx) => {
                                  const wasChosen = chosen === cIdx;
                                  const isRightAnswer = cIdx === qn.correctIndex;

                                  let choiceStyle = "border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/20 text-zinc-500";
                                  if (isRightAnswer) {
                                    choiceStyle = "border-emerald-300 dark:border-emerald-500/35 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 font-bold";
                                  } else if (wasChosen && !isCorrect) {
                                    choiceStyle = "border-red-300 dark:border-red-500/35 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold";
                                  }

                                  return (
                                    <div
                                      key={cIdx}
                                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${choiceStyle}`}
                                    >
                                      <span>{choice}</span>
                                      {isRightAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                      {wasChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleResetQuiz}
                        className="w-full py-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" /> Recommencer le quiz
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto max-w-sm mx-auto text-center py-12 text-zinc-500 space-y-4">
              <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Aucun contenu sélectionné</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-450">
                Veuillez choisir un chapitre et une leçon dans l&apos;arborescence à gauche pour démarrer la prévisualisation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
