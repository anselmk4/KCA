"use client";

import { useEffect, useState } from "react";
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
  Lock,
  Play,
  ClipboardCheck,
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  BookOpen,
  Award,
  HelpCircle,
  Menu
} from "lucide-react";
import {
  getDB,
  saveDB,
  addTransaction,
  addQuizAttempt,
  Database,
  Course,
  CourseSection,
  Lesson,
  Quiz,
  Question,
  QuizAttempt,
  Enrollment
} from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type ContentType = {
  type: "lesson" | "quiz";
  id: string;
};

export default function CoursePreviewPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layout & Navigation States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeContent, setActiveContent] = useState<ContentType | null>(null);

  // Payment states
  const [totalPaid, setTotalPaid] = useState(0);

  // Quiz Player States
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    total: number;
    validated: boolean;
  } | null>(null);

  const reloadData = () => {
    const database = getDB();
    const currentSession = getSimulatedSession();
    setDb(database);
    setSession(currentSession);

    if (database && currentSession) {
      // Calculate total paid for this course
      const paid = database.transactions
        .filter(t => t.userId === currentSession.userId && t.courseId === courseId && t.status === "PAID")
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalPaid(paid);

      // Auto-expand all sections
      const sections = database.sections.filter(s => s.courseId === courseId);
      setExpandedSections(new Set(sections.map(s => s.id)));

      // Auto-select first lesson or content if not set
      if (sections.length > 0) {
        const firstSection = sections.sort((a, b) => a.order - b.order)[0];
        const lessons = database.lessons
          .filter(l => l.sectionId === firstSection.id)
          .sort((a, b) => a.order - b.order);
        if (lessons.length > 0 && !activeContent) {
          setActiveContent({ type: "lesson", id: lessons[0].id });
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, [courseId]);

  if (loading || !db || !session) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Cours introuvable</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 text-center max-w-sm">Cette formation n'existe pas ou a été retirée du catalogue public.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl text-sm transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // Access validation logic
  const isInstructor = session.role === "INSTRUCTOR" && course.instructorId === session.userId;
  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const hasFullBypass = isInstructor || isAdmin;

  const enrollment = db.enrollments.find(e => e.studentId === session.userId && e.courseId === courseId);
  
  // Financial restriction calculation
  const isFree = course.price === 0;
  const isPaidTranche = course.allowInstallments && course.installmentsCount && course.installmentsCount > 1;
  const trancheAmount = isPaidTranche ? (course.price / (course.installmentsCount || 2)) : course.price;
  const requiredAmount = isPaidTranche ? trancheAmount : course.price;
  const hasPaidEnough = isFree || hasFullBypass || (totalPaid >= requiredAmount);

  // Content accessibility flags
  let accessErrorTitle = "";
  let accessErrorMessage = "";
  let showPaymentPrompt = false;

  if (!hasFullBypass) {
    if (!enrollment) {
      accessErrorTitle = "Non inscrit";
      accessErrorMessage = "Vous devez être inscrit à ce cours pour accéder à son contenu pédagogique.";
    } else if (enrollment.status === "INACTIVE") {
      accessErrorTitle = "Invitation en attente";
      accessErrorMessage = "Vous avez été invité à ce cours. Veuillez valider et accepter l'invitation sur votre tableau de bord.";
    } else if (enrollment.status === "SUSPENDED") {
      accessErrorTitle = "Accès suspendu";
      accessErrorMessage = "Votre accès à cette formation a été momentanément suspendu par l'instructeur.";
    } else if (!hasPaidEnough) {
      showPaymentPrompt = true;
    }
  }

  const sections = db.sections
    .filter(s => s.courseId === courseId)
    .sort((a, b) => a.order - b.order);

  const getLessonsForSection = (sectionId: string) =>
    db.lessons.filter(l => l.sectionId === sectionId).sort((a, b) => a.order - b.order);

  const getQuizzesForSection = (sectionId: string) =>
    db.quizzes.filter(q => q.sectionId === sectionId);

  // Payment Simulators
  const handleSimulatePayment = (amountToPay: number) => {
    addTransaction({
      userId: session.userId,
      userName: session.name,
      amount: amountToPay,
      courseId: courseId,
      status: "PAID",
      method: "Carte"
    });
    alert(`Paiement de ${amountToPay}$ simulé avec succès !`);
    reloadData();
  };

  // Lesson/Quiz selectors
  const handleSelectContent = (item: ContentType) => {
    setActiveContent(item);
    setSelectedChoices({});
    setQuizResult(null);
  };

  const activeLesson = activeContent?.type === "lesson"
    ? db.lessons.find(l => l.id === activeContent.id)
    : null;

  const activeQuiz = activeContent?.type === "quiz"
    ? db.quizzes.find(q => q.id === activeContent.id)
    : null;

  const quizQuestions = activeQuiz
    ? db.questions.filter(qn => qn.quizId === activeQuiz.id)
    : [];

  const handleSelectChoice = (questionId: string, choiceIndex: number) => {
    if (quizResult?.validated) return;
    setSelectedChoices(prev => ({
      ...prev,
      [questionId]: choiceIndex
    }));
  };

  const handleValidateQuiz = () => {
    if (!activeQuiz) return;
    if (quizQuestions.length === 0) return;

    // Check if all questions are answered
    const answeredCount = Object.keys(selectedChoices).length;
    if (answeredCount < quizQuestions.length) {
      alert("Veuillez répondre à toutes les questions avant de valider.");
      return;
    }

    let correctAnswers = 0;
    quizQuestions.forEach(qn => {
      if (selectedChoices[qn.id] === qn.correctIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quizQuestions.length) * 100);
    const passed = score >= activeQuiz.passPercentage;

    addQuizAttempt({
      studentId: session.userId,
      quizId: activeQuiz.id,
      score,
      passed
    });

    setQuizResult({
      score,
      passed,
      correctAnswers,
      total: quizQuestions.length,
      validated: true
    });
  };

  const handleResetQuiz = () => {
    setSelectedChoices({});
    setQuizResult(null);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-850 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={isInstructor ? "/instructor/courses" : "/dashboard"}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all hover:-translate-x-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold truncate text-zinc-900 dark:text-white">{course.title}</h1>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
              Player Classroom &amp; Mode Apprenant
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
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-zinc-500 dark:text-zinc-400">Rôle :</span>
            <span className="font-extrabold text-teal-600 dark:text-teal-450 uppercase">{session.role}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Sidebar (Classroom Accordion Tree) */}
        <aside className={`w-80 border-r border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-900/20 shrink-0 flex flex-col min-h-0 transition-transform lg:translate-x-0 z-20 absolute lg:relative inset-y-0 left-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Programme pédagogique</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 rounded-full">{sections.length} Chapitres</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {sections.map((section, sectIdx) => {
              const lessons = getLessonsForSection(section.id);
              const quizzes = getQuizzesForSection(section.id);
              const isExpanded = expandedSections.has(section.id);

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
                      {lessons.map((lesson) => {
                        const active = activeContent?.type === "lesson" && activeContent.id === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => handleSelectContent({ type: "lesson", id: lesson.id })}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 cursor-pointer text-xs transition-all ${
                              active
                                ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500 font-bold"
                                : "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            {lesson.videoUrl ? <Video className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />}
                            <span className="truncate flex-1">{lesson.title}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {lesson.durationMin}m
                            </span>
                          </div>
                        );
                      })}

                      {quizzes.map((quiz) => {
                        const active = activeContent?.type === "quiz" && activeContent.id === quiz.id;
                        return (
                          <div
                            key={quiz.id}
                            onClick={() => handleSelectContent({ type: "quiz", id: quiz.id })}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 cursor-pointer text-xs transition-all ${
                              active
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500 font-bold"
                                : "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500"
                            }`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                            <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300 font-medium">Quiz : {quiz.title}</span>
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

        {/* Backdrop for mobile menu */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Right Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col min-h-0">
          {/* ACCESS PANELS */}

          {accessErrorTitle ? (
            <div className="my-auto max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-200 dark:border-red-500/20">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">{accessErrorTitle}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{accessErrorMessage}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Retourner sur le dashboard
              </button>
            </div>
          ) : showPaymentPrompt ? (
            <div className="my-auto max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-850 shadow-2xl space-y-6 animate-in zoom-in-95">
              <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Accès Restreint - Paiement Requis</h3>
                  <p className="text-xs text-zinc-500 mt-1">Vous devez régler les frais de scolarité pour continuer.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="leading-relaxed">
                  Cette formation coûte <span className="font-bold text-zinc-900 dark:text-white">{course.price}$</span>.
                  {isPaidTranche && (
                    <span> Vous avez activé l'option de règlement en <span className="font-bold text-zinc-900 dark:text-white">{course.installmentsCount} tranches</span>. Le montant minimum requis pour débloquer l'accès pédagogique immédiat est d'une première tranche soit <span className="font-bold text-teal-600 dark:text-teal-400">{trancheAmount.toFixed(2)}$</span>.</span>
                  )}
                </p>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Montant total réglé jusqu'à présent :</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{totalPaid}$</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tranche minimale requise :</span>
                    <span className="font-bold text-teal-600 dark:text-teal-450">{trancheAmount.toFixed(2)}$</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {isPaidTranche && (
                  <button
                    onClick={() => handleSimulatePayment(trancheAmount)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    <Sparkles className="w-4 h-4" /> Régler la tranche ({trancheAmount.toFixed(2)}$)
                  </button>
                )}
                <button
                  onClick={() => handleSimulatePayment(course.price - totalPaid)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Check className="w-4 h-4" /> Payer le solde complet ({(course.price - totalPaid).toFixed(2)}$)
                </button>
              </div>
            </div>
          ) : activeContent ? (
            /* Main Pedagogic Panel (Visible if fully authorized) */
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              
              {/* LESSON PLAYER */}
              {activeLesson && (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                  {/* Video player card */}
                  {activeLesson.videoUrl && (
                    <div className="aspect-video bg-black rounded-3xl border border-zinc-200 dark:border-zinc-850 overflow-hidden relative shadow-lg shrink-0">
                      <video
                        src={activeLesson.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                        poster="/images/video_poster.png"
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

                  {/* HTML Content wysiwyg rendering */}
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
                        {quizQuestions.length} questions · Seuil d'admission {activeQuiz.passPercentage}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                  </div>

                  {quizQuestions.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-12 text-center text-zinc-400 dark:text-zinc-500">
                      <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold">Aucune question n'a encore été insérée dans ce quiz.</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-650 mt-1">Veuillez repasser sur l'éditeur instructeur.</p>
                    </div>
                  ) : !quizResult?.validated ? (
                    /* Attempt View */
                    <div className="space-y-5">
                      <div className="space-y-4">
                        {quizQuestions.map((qn, qIdx) => (
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
                                        : "border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
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
                        Valider mes réponses
                      </button>
                    </div>
                  ) : (
                    /* Result View */
                    <div className="space-y-6">
                      <div className={`p-8 border rounded-3xl text-center space-y-4 shadow-xl ${
                        quizResult.passed
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400"
                      }`}>
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2 shrink-0 animate-in zoom-in-95 duration-500">
                          {quizResult.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
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
                        {quizQuestions.map((qn, qIdx) => {
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
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Question {qIdx + 1}</span>
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
                                    choiceStyle = "border-emerald-300 dark:border-emerald-500/35 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-bold";
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
                        className="w-full py-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
              <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Aucun contenu sélectionné</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-450">
                Veuillez choisir un chapitre et une leçon dans l'arborescence à gauche pour démarrer la formation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
