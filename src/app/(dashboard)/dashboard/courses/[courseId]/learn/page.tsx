"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronDown, CheckSquare, Square, Play, FileText, CheckCircle, Award, BookOpen, Clock, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { getDB, saveDB, Course, CourseSection, Lesson, Progress, Certificate, Quiz, Question, QuizAttempt } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  
  // Active learning view
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Quiz taking state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);

  // Collapsible accordion chapters state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Load course details, check enrollment and load lessons
  const loadData = () => {
    const db = getDB();
    const currentSession = getSimulatedSession();
    setSession(currentSession);

    if (!currentSession) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }

    // 1. Check enrollment
    const enrollment = db.enrollments.find(
      e => e.studentId === currentSession.userId && e.courseId === courseId && e.status === "ACTIVE"
    );

    if (!enrollment) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }

    // 2. Load course, sections, lessons, quizzes
    const currentCourse = db.courses.find(c => c.id === courseId);
    if (!currentCourse) {
      setLoading(false);
      return;
    }
    setCourse(currentCourse);

    const courseSections = db.sections.filter(s => s.courseId === courseId);
    courseSections.sort((a, b) => a.order - b.order);
    setSections(courseSections);

    const sectionIds = courseSections.map(s => s.id);
    const courseLessons = db.lessons.filter(l => sectionIds.includes(l.sectionId));
    courseLessons.sort((a, b) => a.order - b.order);
    setLessons(courseLessons);

    const courseQuizzes = db.quizzes.filter(q => q.courseId === courseId);
    setQuizzes(courseQuizzes);

    const attempts = db.quizAttempts.filter(a => a.studentId === currentSession.userId);
    setQuizAttempts(attempts);

    if (courseLessons.length > 0 && !activeLesson && !activeQuiz) {
      setActiveLesson(courseLessons[0]);
      // Open the section of the first lesson
      setExpandedSections({ [courseLessons[0].sectionId]: true });
    }

    // 3. Load lesson completion progress
    const userProgress = db.lessonProgress.filter(
      p => p.enrollmentId === enrollment.id && p.completed
    );
    const completedSet = new Set(userProgress.map(p => p.lessonId));
    setCompletedLessons(completedSet);

    // Calculate progression
    if (courseLessons.length > 0) {
      const pct = Math.round((completedSet.size / courseLessons.length) * 100);
      setProgressPercent(pct);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  // Keep section open when lesson changes
  useEffect(() => {
    if (activeLesson) {
      setExpandedSections(prev => ({
        ...prev,
        [activeLesson.sectionId]: true
      }));
    }
  }, [activeLesson]);

  // Check if student qualifies for certificate and issue/revoke accordingly
  const checkAndAwardCertificate = (db: any, studentId: string, cId: string, completedSet: Set<string>) => {
    // 1. Check 100% lessons completed
    const totalLessonsCount = lessons.length;
    const lessonsCompleted = totalLessonsCount > 0 && completedSet.size === totalLessonsCount;

    // 2. Check all course quizzes passed with >= 80%
    const courseQuizzes = db.quizzes.filter((q: any) => q.courseId === cId);
    let quizzesPassed = true;

    if (courseQuizzes.length > 0) {
      for (const quiz of courseQuizzes) {
        const passedAttempts = db.quizAttempts.filter(
          (a: any) => a.studentId === studentId && a.quizId === quiz.id && a.score >= 80
        );
        if (passedAttempts.length === 0) {
          quizzesPassed = false;
          break;
        }
      }
    }

    const eligible = lessonsCompleted && quizzesPassed;
    const certIdx = db.certificates.findIndex(
      (c: any) => c.studentId === studentId && c.courseId === cId
    );

    if (eligible) {
      if (certIdx === -1) {
        const certCode = `CERT-${cId.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCert: Certificate = {
          id: `cert_${Date.now()}`,
          studentId: studentId,
          courseId: cId,
          code: certCode,
          issuedAt: new Date().toISOString()
        };
        db.certificates.push(newCert);
        alert("Félicitations ! Vous avez validé 100% des leçons et réussi tous les quiz (score ≥ 80%). Votre certificat de réussite est débloqué !");
      }
    } else {
      if (certIdx !== -1) {
        // Revoke certificate if no longer eligible (e.g. unchecked a lesson)
        db.certificates = db.certificates.filter(
          (c: any) => !(c.studentId === studentId && c.courseId === cId)
        );
      }
    }

    saveDB(db);
    // Reload state local and trigger event
    const attempts = db.quizAttempts.filter((a: any) => a.studentId === studentId);
    setQuizAttempts(attempts);
    window.dispatchEvent(new Event("storage"));
  };

  // Toggle completion of a lesson
  const handleToggleComplete = (lessonId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const db = getDB();
    const session = getSimulatedSession();
    if (!session || !course) return;

    const enrollment = db.enrollments.find(
      e => e.studentId === session.userId && e.courseId === courseId && e.status === "ACTIVE"
    );
    if (!enrollment) return;

    // Find progress entry
    let progressIdx = db.lessonProgress.findIndex(
      p => p.enrollmentId === enrollment.id && p.lessonId === lessonId
    );

    let nextCompleted = false;

    if (progressIdx !== -1) {
      nextCompleted = !db.lessonProgress[progressIdx].completed;
      db.lessonProgress[progressIdx].completed = nextCompleted;
      db.lessonProgress[progressIdx].completedAt = nextCompleted ? new Date().toISOString() : null;
    } else {
      nextCompleted = true;
      const newProgress: Progress = {
        id: `p_${Date.now()}`,
        enrollmentId: enrollment.id,
        lessonId: lessonId,
        completed: true,
        completedAt: new Date().toISOString()
      };
      db.lessonProgress.push(newProgress);
    }

    // Update completed lessons locally on screen
    const updatedCompleted = new Set(completedLessons);
    if (nextCompleted) {
      updatedCompleted.add(lessonId);
    } else {
      updatedCompleted.delete(lessonId);
    }
    setCompletedLessons(updatedCompleted);

    // Re-calculate progression
    const totalLessons = lessons.length;
    const pct = totalLessons > 0 ? Math.round((updatedCompleted.size / totalLessons) * 100) : 0;
    setProgressPercent(pct);

    // Update enrollment progress
    const enrollIdx = db.enrollments.findIndex(e => e.id === enrollment.id);
    if (enrollIdx !== -1) {
      db.enrollments[enrollIdx].progressPercent = pct;
    }

    checkAndAwardCertificate(db, session.userId, courseId, updatedCompleted);
  };

  // Submit Quiz replies
  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz || !session) return;

    const db = getDB();
    const questionsList = db.questions.filter(q => q.quizId === activeQuiz.id);
    if (questionsList.length === 0) return;

    // Compute score
    let correct = 0;
    questionsList.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    const percent = Math.round((correct / questionsList.length) * 100);
    const passed = percent >= 80;

    setScorePercent(percent);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    // Save attempt
    const newAttempt: QuizAttempt = {
      id: `qa_${Date.now()}`,
      studentId: session.userId,
      quizId: activeQuiz.id,
      score: percent,
      passed,
      createdAt: new Date().toISOString()
    };

    db.quizAttempts.push(newAttempt);
    saveDB(db);

    checkAndAwardCertificate(db, session.userId, courseId, completedLessons);
  };

  // Dynamic lists
  const generalQuizzes = useMemo(() => {
    return quizzes.filter(q => !q.sectionId);
  }, [quizzes]);

  const activeQuizQuestions = useMemo(() => {
    if (!activeQuiz) return [];
    const db = getDB();
    return db.questions.filter(q => q.quizId === activeQuiz.id);
  }, [activeQuiz]);

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
        <p className="text-zinc-500 dark:text-zinc-400">Vous n&apos;êtes pas inscrit à cette formation ou votre paiement n&apos;est pas validé.</p>
        <Link href={`/dashboard/discover/${courseId}`} className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
          Découvrir et s&apos;inscrire
        </Link>
      </div>
    );
  }

  // Find if user has unlocked the certificate for this course
  const hasCertificate = getDB().certificates?.some(c => c.studentId === session?.userId && c.courseId === courseId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Back to courses banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Mes formations
        </Link>
        {hasCertificate ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Award className="w-4 h-4 animate-bounce" />
            <span>Cours validé ! Certificat débloqué.</span>
            <Link href="/dashboard/certificates" className="underline ml-2 hover:text-emerald-700">Voir le certificat</Link>
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Progression: {progressPercent}% · Quiz requis: score ≥ 80%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Pane: Sidebar list Sections and Lessons inside Accordion (span 1) */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[75vh]">
          {/* Progress bar */}
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{course?.title}</h3>
            <div className="flex justify-between text-xxs font-bold text-zinc-500">
              <span>LEÇONS</span>
              <span>{progressPercent}% ({completedLessons.size}/{lessons.length})</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Scrolling Accordion sections list */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {sections.map((section, sIdx) => {
              const sectionLessons = lessons.filter(l => l.sectionId === section.id);
              const sectionQuizzes = quizzes.filter(q => q.sectionId === section.id);
              const isSectionOpen = !!expandedSections[section.id];

              return (
                <div key={section.id} className="space-y-0">
                  {/* Collapsible Header */}
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                    className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider line-clamp-1">
                      M{sIdx + 1} : {section.title}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Lessons list inside opened section */}
                  {isSectionOpen && (
                    <div className="bg-zinc-50/30 dark:bg-zinc-900/40 p-2 space-y-1 border-t border-zinc-100 dark:border-zinc-800">
                      {sectionLessons.length === 0 && sectionQuizzes.length === 0 && (
                        <p className="text-xxs text-zinc-400 p-2 italic text-center">Aucun contenu</p>
                      )}
                      {sectionLessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id && !activeQuiz;
                        const isDone = completedLessons.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setActiveLesson(lesson);
                              setActiveQuiz(null);
                            }}
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
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                              <span className="text-xs truncate leading-snug">{lesson.title}</span>
                            </div>
                            <span className="text-xxs text-zinc-400 shrink-0 font-mono ml-2">
                              {lesson.durationMin}m
                            </span>
                          </button>
                        );
                      })}

                      {/* Display quizzes inside section */}
                      {sectionQuizzes.map((quiz) => {
                        const isActive = activeQuiz?.id === quiz.id;
                        const attempts = quizAttempts.filter(a => a.quizId === quiz.id);
                        const isQuizPassed = attempts.some(a => a.passed);
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setActiveLesson(null);
                              setQuizSubmitted(false);
                              setSelectedAnswers({});
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-semibold animate-pulse"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className={`w-4 h-4 shrink-0 ${isQuizPassed ? "text-green-500" : "text-amber-500"}`} />
                              <span className="text-xs truncate font-medium">QCM : {quiz.title}</span>
                            </div>
                            {isQuizPassed && (
                              <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                Validé
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Course level General Quizzes (with no section ID) */}
            {generalQuizzes.length > 0 && (
              <div className="border-t border-zinc-150 dark:border-zinc-800">
                <div className="py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800/10 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-xxs font-extrabold text-zinc-400 uppercase tracking-widest">
                    Évaluations Finales
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {generalQuizzes.map((quiz) => {
                    const isActive = activeQuiz?.id === quiz.id;
                    const attempts = quizAttempts.filter(a => a.quizId === quiz.id);
                    const isQuizPassed = attempts.some(a => a.passed);
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => {
                          setActiveQuiz(quiz);
                          setActiveLesson(null);
                          setQuizSubmitted(false);
                          setSelectedAnswers({});
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
                          <span className="text-[10px] font-bold text-green-500 shrink-0 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                            Validé
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Main player and Lesson text, or Quiz taker (span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* CASE A: Active Quiz taker is selected */}
          {activeQuiz ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6 animate-in slide-in-from-right-3 duration-300">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 text-xxs font-bold uppercase rounded-md mb-2">
                    <FileText className="w-3.5 h-3.5" /> Évaluation QCM
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{activeQuiz.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">Vous devez obtenir un score d&apos;au moins <span className="font-bold text-blue-600">80%</span> pour valider ce test.</p>
                </div>
                
                {/* Score record badge */}
                {(() => {
                  const attempts = quizAttempts.filter(a => a.quizId === activeQuiz.id);
                  if (attempts.length === 0) return null;
                  const best = Math.max(...attempts.map(a => a.score));
                  return (
                    <div className="text-right shrink-0">
                      <p className="text-xxs text-zinc-400 font-bold uppercase">Meilleur score</p>
                      <p className={`text-2xl font-black ${best >= 80 ? "text-green-500" : "text-amber-500"}`}>{best}%</p>
                    </div>
                  );
                })()}
              </div>

              {/* Submitting form */}
              {!quizSubmitted ? (
                <form onSubmit={handleQuizSubmit} className="space-y-8">
                  {activeQuizQuestions.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic py-6">Aucune question n&apos;a été configurée pour ce QCM.</p>
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
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Soumettre mes réponses
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                /* Results Screen overlay */
                <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="inline-flex p-4 rounded-full bg-zinc-50 dark:bg-zinc-800">
                    <Award className={`w-16 h-16 ${quizPassed ? "text-green-500 animate-bounce" : "text-amber-500 animate-pulse"}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Score de l&apos;évaluation : {scorePercent}%</h3>
                    <p className={`text-sm font-bold ${quizPassed ? "text-green-500" : "text-red-500"}`}>
                      {quizPassed
                        ? "✓ Félicitations ! Vous avez validé ce test avec succès."
                        : "✗ Score insuffisant. Vous devez avoir au moins 80% de bonnes réponses."}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {quizPassed 
                      ? "Ce test est validé et est comptabilisé dans les critères de déblocage de votre certificat final."
                      : "Ne vous découragez pas ! Révisez les leçons de ce module et retentez votre chance."}
                  </p>

                  <div className="flex justify-center gap-4 pt-4">
                    <button
                      onClick={() => setQuizSubmitted(false)}
                      className="px-5 py-2.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Recommencer
                    </button>
                    <button
                      onClick={() => {
                        setActiveQuiz(null);
                        // Jump back to the first lesson of this module if possible
                        if (lessons.length > 0) setActiveLesson(lessons[0]);
                      }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      Retourner aux leçons
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CASE B: Active Lesson is selected */
            activeLesson ? (
              <div className="space-y-6">
                {/* Video Player */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-lg">
                  {activeLesson.videoUrl ? (
                    <iframe
                      src={videoSrc}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={activeLesson.title}
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950">
                      <Play className="w-12 h-12 text-zinc-600 animate-pulse" />
                      <p className="text-xs font-semibold text-zinc-400">Aucune vidéo associée à cette leçon</p>
                    </div>
                  )}
                </div>

                {/* Title & Stats */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{activeLesson.title}</h2>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeLesson.durationMin} minutes</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Leçon d&apos;apprentissage</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleComplete(activeLesson.id, e)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer border transition-all ${
                        completedLessons.has(activeLesson.id)
                          ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${completedLessons.has(activeLesson.id) ? "fill-green-500 text-white" : ""}`} />
                      {completedLessons.has(activeLesson.id) ? "Complété" : "Marquer comme terminé"}
                    </button>
                  </div>

                  {/* Lesson text content / desc */}
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
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Bienvenue dans votre espace d&apos;apprentissage</h2>
                <p className="text-zinc-500 max-w-md mx-auto mt-2">Sélectionnez une leçon dans le panneau de gauche pour commencer à regarder la vidéo et apprendre.</p>
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}
