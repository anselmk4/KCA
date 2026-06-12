"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  Save,
  HelpCircle,
  UserPlus,
  Play,
  ClipboardCheck,
  Tag,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ChevronUp,
  AlertTriangle,
  X
} from "lucide-react";
import {
  getDB,
  updateCourseDetails,
  addSection,
  updateSection,
  deleteSection,
  addLesson,
  updateLesson,
  deleteLesson,
  addQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addEnrollment,
  deleteCourse,
  Database,
  Course,
  CourseSection,
  Lesson,
  Quiz,
  Question
} from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";
import RichEditor from "@/components/editor/RichEditor";

type TabType = "programme" | "description" | "quizzes" | "students" | "price" | "settings";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("programme");

  // Tab: Programme States
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  // Section Editing States
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  
  // Lesson Inline Add States
  const [addingLessonToSection, setAddingLessonToSection] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("15");

  // Quiz Inline Add States
  const [addingQuizToSection, setAddingQuizToSection] = useState<string | null>(null);
  const [newQuizTitleInline, setNewQuizTitleInline] = useState("");

  // Context Menu state
  const [activeMenuSectionId, setActiveMenuSectionId] = useState<string | null>(null);

  // Active Lesson Form (Right Panel)
  const [lessonForm, setLessonForm] = useState({
    title: "",
    durationMin: 15,
    videoUrl: "",
    content: "",
    description: "",
  });

  // Tab: Description States
  const [descForm, setDescForm] = useState({
    title: "",
    slug: "",
    category: "",
    level: "Débutant",
    description: "",
  });
  const [descSavedMessage, setDescSavedMessage] = useState(false);

  // Tab: Quiz States
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizPassPercent, setNewQuizPassPercent] = useState("70");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQText, setNewQText] = useState("");
  const [newQChoices, setNewQChoices] = useState(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState("0");

  // Tab: Students Invite States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Tab: Price States
  const [coursePrice, setCoursePrice] = useState("0");
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [priceSavedMessage, setPriceSavedMessage] = useState(false);

  // Tab: Settings States
  const [courseStatus, setCourseStatus] = useState<Course["status"]>("DRAFT");
  const [statusSavedMessage, setStatusSavedMessage] = useState(false);

  // Load Database and Session
  const reloadData = () => {
    const freshDb = getDB();
    setDb(freshDb);
    setSession(getSimulatedSession());

    // Auto-expand sections on load
    const sectionIds = freshDb.sections.filter((s) => s.courseId === courseId).map((s) => s.id);
    setExpandedSections(new Set(sectionIds));

    // Load Course Data for tabs
    const course = freshDb.courses.find((c) => c.id === courseId);
    if (course) {
      setDescForm({
        title: course.title,
        slug: course.slug,
        category: course.category || "",
        level: course.level || "Débutant",
        description: course.description || "",
      });
      setCoursePrice(course.price.toString());
      setAllowInstallments(course.allowInstallments || false);
      setInstallmentsCount(course.installmentsCount || 2);
      setCourseStatus(course.status);
    }
  };

  useEffect(() => {
    reloadData();
  }, [courseId]);

  // Load selected lesson into form
  useEffect(() => {
    if (db && selectedLessonId) {
      const lesson = db.lessons.find((l) => l.id === selectedLessonId);
      if (lesson) {
        setLessonForm({
          title: lesson.title,
          durationMin: lesson.durationMin,
          videoUrl: lesson.videoUrl || "",
          content: lesson.content || "",
          description: lesson.description || "",
        });
      }
    }
  }, [selectedLessonId, db]);

  if (!db || !session) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-white dark:bg-zinc-900 rounded-2xl h-80 animate-pulse border border-zinc-200 dark:border-zinc-800" />
          <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-2xl h-80 animate-pulse border border-zinc-200 dark:border-zinc-800" />
        </div>
      </div>
    );
  }

  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <BookOpen className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Cours introuvable</h2>
        <p className="text-sm text-zinc-500 mb-6">Ce cours n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
        <Link href="/instructor/courses" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Retour aux cours
        </Link>
      </div>
    );
  }

  const sections = db.sections
    .filter((s) => s.courseId === courseId)
    .sort((a, b) => a.order - b.order);

  const getLessons = (sectionId: string) =>
    db.lessons.filter((l) => l.sectionId === sectionId).sort((a, b) => a.order - b.order);

  // Lesson Operations
  const handleSaveActiveLesson = () => {
    if (!selectedLessonId) return;
    updateLesson(selectedLessonId, {
      title: lessonForm.title,
      durationMin: Number(lessonForm.durationMin) || 0,
      videoUrl: lessonForm.videoUrl,
      content: lessonForm.content,
      description: lessonForm.description,
    });
    alert("Leçon mise à jour avec succès !");
    reloadData();
  };

  const handleDeleteLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Supprimer cette leçon ? Cette action est définitive.")) {
      deleteLesson(lessonId);
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
      }
      reloadData();
    }
  };

  const handleAddLessonInline = (sectionId: string) => {
    if (!newLessonTitle.trim()) return;
    const lessonsList = getLessons(sectionId);
    addLesson(sectionId, {
      title: newLessonTitle.trim(),
      description: "",
      content: "",
      videoUrl: "",
      durationMin: Number(newLessonDuration) || 15,
      order: lessonsList.length + 1,
    });
    setNewLessonTitle("");
    setNewLessonDuration("15");
    setAddingLessonToSection(null);
    reloadData();
  };

  const handleAddQuizInline = (sectionId: string) => {
    if (!newQuizTitleInline.trim()) return;
    addQuiz({
      courseId,
      sectionId,
      title: newQuizTitleInline.trim(),
      passPercentage: 70
    });
    setNewQuizTitleInline("");
    setAddingQuizToSection(null);
    reloadData();
  };

  const moveLessonOrder = (lessonId: string, direction: "up" | "down", sectionId: string) => {
    const list = getLessons(sectionId);
    const idx = list.findIndex(l => l.id === lessonId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === list.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = list[idx];
    const target = list[targetIdx];

    // Swap orders
    updateLesson(current.id, { order: target.order });
    updateLesson(target.id, { order: current.order });
    reloadData();
  };

  // Section Operations
  const handleAddSectionAction = () => {
    if (!newSectionTitle.trim()) return;
    const nextSection = addSection(courseId, newSectionTitle.trim(), sections.length + 1);
    setNewSectionTitle("");
    setShowNewSection(false);
    setExpandedSections(prev => new Set(prev).add(nextSection.id));
    reloadData();
  };

  const handleRenameSection = (sectId: string) => {
    if (!editingSectionTitle.trim()) return;
    updateSection(sectId, { title: editingSectionTitle.trim() });
    setEditingSectionId(null);
    setEditingSectionTitle("");
    reloadData();
  };

  const handleDeleteSectionAction = (sectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Supprimer cette section ainsi que toutes ses leçons ? Cette action est irréversible.")) {
      deleteSection(sectId);
      reloadData();
    }
  };

  const moveSectionOrder = (sectId: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = sections.findIndex(s => s.id === sectId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = sections[idx];
    const target = sections[targetIdx];

    updateSection(current.id, { order: target.order });
    updateSection(target.id, { order: current.order });
    reloadData();
  };

  // Tab: Description Save
  const handleSaveDescription = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = descForm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    updateCourseDetails(courseId, {
      title: descForm.title,
      slug: cleanSlug,
      category: descForm.category,
      level: descForm.level,
      description: descForm.description,
    });
    setDescSavedMessage(true);
    setTimeout(() => setDescSavedMessage(false), 3000);
    reloadData();
  };

  // Tab: Quiz operations
  const courseQuizzes = db.quizzes.filter((q) => q.courseId === courseId);

  const handleCreateQuiz = () => {
    if (!newQuizTitle.trim()) return;
    addQuiz({
      courseId,
      title: newQuizTitle.trim(),
      passPercentage: Number(newQuizPassPercent) || 70,
    });
    setNewQuizTitle("");
    setNewQuizPassPercent("70");
    setShowCreateQuizModal(false);
    reloadData();
  };

  const handleAddQuestion = () => {
    if (!newQText.trim() || !selectedQuizId) return;
    const cleanChoices = newQChoices.filter(c => c.trim() !== "");
    if (cleanChoices.length < 2) {
      alert("Veuillez saisir au moins 2 options de réponse.");
      return;
    }
    const correctIdx = Number(newQCorrect);
    if (correctIdx >= cleanChoices.length) {
      alert("La bonne réponse sélectionnée est invalide par rapport au nombre d'options renseignées.");
      return;
    }

    addQuestion({
      quizId: selectedQuizId,
      text: newQText.trim(),
      choices: cleanChoices,
      correctIndex: correctIdx,
    });

    setNewQText("");
    setNewQChoices(["", "", "", ""]);
    setNewQCorrect("0");
    setShowAddQuestionModal(false);
    reloadData();
  };

  const handleDeleteQuizAction = (qId: string) => {
    if (confirm("Supprimer ce quiz et toutes ses questions ?")) {
      deleteQuiz(qId);
      if (selectedQuizId === qId) setSelectedQuizId(null);
      reloadData();
    }
  };

  const handleDeleteQuestionAction = (qnId: string) => {
    if (confirm("Supprimer cette question ?")) {
      deleteQuestion(qnId);
      reloadData();
    }
  };

  // Tab: Students Invite
  const courseEnrollments = db.enrollments.filter(e => e.courseId === courseId);
  const enrolledStudentIds = courseEnrollments.map(e => e.studentId);
  const courseStudents = db.users.filter(u => enrolledStudentIds.includes(u.id) && u.role === "STUDENT");

  const handleSearchStudent = () => {
    setSearchError("");
    setSearchedStudent(null);
    if (!inviteStudentId.trim()) return;

    const student = db.users.find(u => u.id === inviteStudentId.trim() && u.role === "STUDENT");
    if (student) {
      setSearchedStudent(student);
    } else {
      setSearchError("Aucun compte étudiant trouvé avec cet identifiant UUID.");
    }
  };

  const handleInviteStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedStudent) return;

    const alreadyEnrolled = db.enrollments.some(e => e.studentId === searchedStudent.id && e.courseId === courseId);
    if (alreadyEnrolled) {
      setSearchError("Cet étudiant est déjà inscrit ou invité à ce cours.");
      return;
    }

    addEnrollment(searchedStudent.id, courseId, "INACTIVE");
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setShowInviteModal(false);
      setInviteStudentId("");
      setSearchedStudent(null);
      reloadData();
    }, 2000);
  };

  // Tab: Price Save
  const handleSavePrice = () => {
    updateCourseDetails(courseId, {
      price: parseFloat(coursePrice) || 0,
      allowInstallments: allowInstallments,
      installmentsCount: Number(installmentsCount) || 2,
    });
    setPriceSavedMessage(true);
    setTimeout(() => setPriceSavedMessage(false), 3000);
    reloadData();
  };

  // Tab: Settings Save & Delete
  const handleSaveStatus = () => {
    updateCourseDetails(courseId, {
      status: courseStatus,
    });
    setStatusSavedMessage(true);
    setTimeout(() => setStatusSavedMessage(false), 3000);
    reloadData();
  };

  const handleDeleteCourseAction = () => {
    if (confirm("ATTENTION : Voulez-vous vraiment SUPPRIMER ce cours et TOUS ses contenus ? Cette action est irréversible et supprimera toutes les données associées.")) {
      deleteCourse(courseId);
      router.push("/instructor/courses");
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const avgProgress = courseEnrollments.length > 0
    ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progressPercent, 0) / courseEnrollments.length)
    : 0;

  const totalLessons = sections.reduce((sum, s) => sum + getLessons(s.id).length, 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + getLessons(s.id).reduce((ls, l) => ls + l.durationMin, 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/instructor/courses"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50">
          Espace Instructeur
        </span>
      </div>

      {/* Course Title Block */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300">
              {course.category || "Général"}
            </span>
            <span className={`text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
              course.status === "PUBLISHED"
                ? "bg-green-150 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-zinc-150 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400"
            }`}>
              {course.status === "PUBLISHED" ? "En ligne" : course.status === "DRAFT" ? "Brouillon" : course.status === "REVIEW" ? "En révision" : "Archivé"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white mt-3 leading-tight">{course.title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 flex items-center gap-4 flex-wrap">
            <span>{sections.length} Chapitre{sections.length > 1 ? "s" : ""}</span>
            <span>{totalLessons} Leçon{totalLessons > 1 ? "s" : ""}</span>
            <span>{totalDuration} minutes de cours</span>
            <span>{courseEnrollments.length} Étudiant{courseEnrollments.length > 1 ? "s" : ""}</span>
          </p>
        </div>
        
        {/* Quick KPI block */}
        <div className="flex gap-4 self-start md:self-auto">
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-center min-w-[110px]">
            <p className="text-2xl font-extrabold text-teal-600">{avgProgress}%</p>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Prog. Moyenne</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-center min-w-[110px]">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{course.price > 0 ? `${course.price}$` : "Gratuit"}</p>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Tarif unique</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-1">
        {[
          { id: "programme", label: "Programme de cours", icon: BookOpen },
          { id: "description", label: "Description & Catalog", icon: Edit3 },
          { id: "quizzes", label: "Quiz & Examens", icon: ClipboardCheck },
          { id: "students", label: "Étudiants", icon: Users },
          { id: "price", label: "Prix du cours", icon: DollarSign },
          { id: "settings", label: "Paramètres", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="mt-4">
        {/* TABS 1: Programme (Google Classroom Style Builder) */}
        {activeTab === "programme" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Chapters / Lessons hierarchy tree */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-850">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Arborescence Classroom</h3>
                  <span className="text-xs text-zinc-400">{sections.length} Chapitre{sections.length > 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-3">
                  {sections.map((section, idx) => {
                    const lessons = getLessons(section.id);
                    const isExpanded = expandedSections.has(section.id);
                    const isEditing = editingSectionId === section.id;
                    const totalSectDuration = lessons.reduce((sum, l) => sum + l.durationMin, 0);

                    return (
                      <div
                        key={section.id}
                        className="rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 relative"
                      >
                        {/* Section Bar */}
                        <div
                          className={`flex items-center justify-between px-4 py-3 bg-zinc-100/50 dark:bg-zinc-850/60 cursor-pointer hover:bg-zinc-150/50 dark:hover:bg-zinc-800/60 transition-all rounded-t-xl ${!isExpanded ? "rounded-b-xl" : ""}`}
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full mr-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingSectionTitle}
                                  onChange={(e) => setEditingSectionTitle(e.target.value)}
                                  className="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameSection(section.id)}
                                  className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSectionId(null)}
                                  className="p-1 text-zinc-400 hover:bg-zinc-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                {idx + 1}. {section.title}
                              </span>
                            )}
                          </div>

                          {/* Action Items for Section */}
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setEditingSectionTitle(section.title);
                              }}
                              className="p-1 text-zinc-400 hover:text-teal-650 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors"
                              title="Renommer le chapitre"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => moveSectionOrder(section.id, "up", e)}
                              disabled={idx === 0}
                              className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-md disabled:opacity-20"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => moveSectionOrder(section.id, "down", e)}
                              disabled={idx === sections.length - 1}
                              className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-md disabled:opacity-20"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSectionAction(section.id, e)}
                              className="p-1 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-850 rounded-md transition-colors"
                              title="Supprimer le chapitre"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons Tree */}
                        {isExpanded && (
                          <div className="border-t border-zinc-150 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/40">
                            {lessons.map((lesson, lessonIdx) => {
                              const active = selectedLessonId === lesson.id;
                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => setSelectedLessonId(lesson.id)}
                                  className={`flex items-center justify-between px-5 py-2.5 cursor-pointer transition-colors ${
                                    active
                                      ? "bg-teal-50/70 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500"
                                      : "hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 text-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {lesson.videoUrl ? (
                                      <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    )}
                                    <span className="text-xs truncate">{lesson.title}</span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] text-zinc-400 mr-2 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> {lesson.durationMin}m
                                    </span>
                                    <button
                                      onClick={() => moveLessonOrder(lesson.id, "up", section.id)}
                                      disabled={lessonIdx === 0}
                                      className="p-0.5 text-zinc-450 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => moveLessonOrder(lesson.id, "down", section.id)}
                                      disabled={lessonIdx === lessons.length - 1}
                                      className="p-0.5 text-zinc-450 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteLesson(lesson.id, e)}
                                      className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Section Quizzes */}
                            {(db.quizzes || []).filter(q => q.sectionId === section.id).map((quiz) => (
                              <div
                                key={quiz.id}
                                onClick={() => {
                                  setSelectedQuizId(quiz.id);
                                  setActiveTab("quizzes");
                                }}
                                className="flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                                title="Modifier ce quiz dans l'onglet Quiz"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="text-xs font-semibold truncate text-zinc-650 dark:text-zinc-350">Quiz : {quiz.title}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">QCM</span>
                                </div>
                              </div>
                            ))}

                            {/* Inline Quiz Add Form */}
                            {addingQuizToSection === section.id ? (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={newQuizTitleInline}
                                  onChange={e => setNewQuizTitleInline(e.target.value)}
                                  placeholder="Nom du nouveau Quiz"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddQuizInline(section.id)}
                                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Créer le Quiz
                                  </button>
                                  <button
                                    onClick={() => setAddingQuizToSection(null)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-650 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : addingLessonToSection === section.id ? (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={newLessonTitle}
                                  onChange={e => setNewLessonTitle(e.target.value)}
                                  placeholder="Titre de la leçon"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={newLessonDuration}
                                    onChange={e => setNewLessonDuration(e.target.value)}
                                    placeholder="Durée (min)"
                                    className="w-20 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                                  />
                                  <button
                                    onClick={() => handleAddLessonInline(section.id)}
                                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Ajouter
                                  </button>
                                  <button
                                    onClick={() => setAddingLessonToSection(null)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-650 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMenuSectionId(activeMenuSectionId === section.id ? null : section.id)}
                                  className="w-full px-5 py-2.5 text-left text-xs text-teal-600 hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Ajouter une leçon...
                                </button>
                                
                                {activeMenuSectionId === section.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setActiveMenuSectionId(null)}
                                    />
                                    <div className="absolute left-4 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 font-semibold text-xs text-zinc-750 dark:text-zinc-300">
                                      <button
                                        onClick={() => {
                                          setAddingLessonToSection(section.id);
                                          setAddingQuizToSection(null);
                                          setActiveMenuSectionId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Ajouter une leçon
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAddingQuizToSection(section.id);
                                          setAddingLessonToSection(null);
                                          setActiveMenuSectionId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Ajouter un Quiz
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowNewSection(true);
                                          setActiveMenuSectionId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer border-t border-zinc-100 dark:border-zinc-800"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Nouveau chapitre
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Section trigger */}
                {showNewSection ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-teal-350 dark:border-teal-850 p-4 flex flex-col gap-2 mt-4">
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      placeholder="Nom du nouveau chapitre"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowNewSection(false)}
                        className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddSectionAction}
                        className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-750"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewSection(true)}
                    className="w-full mt-4 bg-zinc-50 dark:bg-zinc-850 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <Plus className="w-4 h-4" /> Ajouter un chapitre
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: WYSIWYG editor panel */}
            <div className="lg:col-span-7">
              {selectedLessonId ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">Édition de la Leçon</h3>
                      <p className="text-zinc-400 text-[11px] mt-0.5">Saisissez les contenus et paramétrez cette leçon.</p>
                    </div>
                    <button
                      onClick={handleSaveActiveLesson}
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10"
                    >
                      <Save className="w-3.5 h-3.5" /> Enregistrer la leçon
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre de la leçon *</label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Durée estimée (minutes) *</label>
                      <input
                        type="number"
                        value={lessonForm.durationMin}
                        onChange={e => setLessonForm(prev => ({ ...prev, durationMin: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Lien Vidéo (MP4, YouTube, Vimeo)</label>
                    <input
                      type="text"
                      value={lessonForm.videoUrl}
                      onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="Ex: https://www.w3schools.com/html/mov_bbb.mp4"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Description courte</label>
                    <textarea
                      value={lessonForm.description}
                      onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Donnez un résumé succinct de ce qui sera appris..."
                      rows={2}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Contenu textuel interactif (WYSIWYG)</label>
                    <RichEditor
                      value={lessonForm.content}
                      onChange={(html) => setLessonForm(prev => ({ ...prev, content: html }))}
                      placeholder="Détaillez le cours, insérez du code, des explications, des images ou des liens..."
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-28 text-center text-zinc-400">
                  <Play className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Sélectionnez une leçon</h4>
                  <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-1 max-w-xs mx-auto">
                    Choisissez une leçon dans l'arborescence à gauche pour pouvoir modifier son titre, sa vidéo, son résumé et son cours textuel WYSIWYG.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABS 2: Description & Catalog */}
        {activeTab === "description" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Présentation publique</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Ces informations seront affichées sur la page publique d'inscription.</p>
              </div>
              {descSavedMessage && (
                <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-250 dark:border-emerald-900/30">
                  <CheckCircle2 className="w-4 h-4" /> Sauvegardé !
                </span>
              )}
            </div>

            <form onSubmit={handleSaveDescription} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre du cours *</label>
                  <input
                    required
                    type="text"
                    value={descForm.title}
                    onChange={e => setDescForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Slug personnalisé (URL publique)</label>
                  <input
                    disabled
                    type="text"
                    value={descForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
                    className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-400 select-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Thématique / Catégorie</label>
                  <input
                    type="text"
                    value={descForm.category}
                    onChange={e => setDescForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Blockchain, DeFi, Trading, IA"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Niveau cible</label>
                  <select
                    value={descForm.level}
                    onChange={e => setDescForm(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white"
                  >
                    <option value="Débutant">Débutant (Aucun prérequis)</option>
                    <option value="Intermédiaire">Intermédiaire (Quelques bases)</option>
                    <option value="Avancé">Avancé (Spécialisation poussée)</option>
                    <option value="Expert">Expert (Niveau professionnel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description complète du cours (WYSIWYG)</label>
                <RichEditor
                  value={descForm.description}
                  onChange={(html) => setDescForm(prev => ({ ...prev, description: html }))}
                  placeholder="Détaillez le programme d'enseignement général, les compétences cibles et les perspectives..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Sauvegarder les détails de catalog
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABS 3: Quiz & Examens */}
        {activeTab === "quizzes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Quiz list and stats */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-850">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Évaluations du cours</h3>
                  <button
                    onClick={() => setShowCreateQuizModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Créer
                  </button>
                </div>

                {courseQuizzes.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400">
                    <ClipboardCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs">Aucun quiz créé pour ce cours.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {courseQuizzes.map((quiz) => {
                      const questions = db.questions.filter(q => q.quizId === quiz.id);
                      const attempts = db.quizAttempts.filter(a => a.quizId === quiz.id);
                      const passedCount = attempts.filter(a => a.passed).length;
                      const active = selectedQuizId === quiz.id;

                      return (
                        <div
                          key={quiz.id}
                          onClick={() => setSelectedQuizId(quiz.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? "bg-teal-50/70 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-500 shadow-sm"
                              : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-800 hover:bg-zinc-100/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-xs text-zinc-850 dark:text-zinc-200">{quiz.title}</h4>
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1">
                                {questions.length} questions · Réussite à {quiz.passPercentage}%
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteQuizAction(quiz.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick attempts recap */}
                          {attempts.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-400">
                              <span>{attempts.length} tentatives</span>
                              <span className="text-emerald-600 font-semibold">{passedCount} réussites</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quiz attempts logs */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm pb-2 border-b border-zinc-150 dark:border-zinc-850">Historique des tentatives</h3>
                {selectedQuizId ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {db.quizAttempts.filter(a => a.quizId === selectedQuizId).length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-4">Aucune tentative enregistrée pour ce quiz.</p>
                    ) : (
                      db.quizAttempts.filter(a => a.quizId === selectedQuizId).reverse().map((attempt) => {
                        const student = db.users.find(u => u.id === attempt.studentId);
                        return (
                          <div key={attempt.id} className="flex items-center justify-between text-xs p-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{student?.name || "Apprenant"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400">{new Date(attempt.createdAt).toLocaleDateString("fr-FR")}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                attempt.passed
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-450"
                              }`}>
                                {attempt.score}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-450 text-center py-4">Sélectionnez un quiz pour voir son historique.</p>
                )}
              </div>
            </div>

            {/* Right Column: Questions detail editor */}
            <div className="lg:col-span-7">
              {selectedQuizId ? (
                (() => {
                  const activeQuiz = db.quizzes.find(q => q.id === selectedQuizId);
                  const questions = db.questions.filter(qn => qn.quizId === selectedQuizId);

                  return (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-white text-base">Questions du Quiz</h3>
                          <p className="text-zinc-400 text-xs mt-0.5">{activeQuiz?.title} · Seuil {activeQuiz?.passPercentage}%</p>
                        </div>
                        <button
                          onClick={() => setShowAddQuestionModal(true)}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-teal-500/10"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ajouter une question
                        </button>
                      </div>

                      {questions.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                          <HelpCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                          <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">Aucune question dans ce quiz</h4>
                          <p className="text-zinc-450 text-[11px] mt-1 mb-4">Cliquez sur le bouton pour ajouter votre première question.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((qn, qnIdx) => (
                            <div key={qn.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-150 dark:border-zinc-800/80">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-extrabold text-teal-650 dark:text-teal-400">
                                  Question {qnIdx + 1}
                                </span>
                                <button
                                  onClick={() => handleDeleteQuestionAction(qn.id)}
                                  className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-xs font-bold text-zinc-850 dark:text-zinc-250 mb-3">{qn.text}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {qn.choices.map((choice, choiceIdx) => {
                                  const isCorrect = choiceIdx === qn.correctIndex;
                                  return (
                                    <div
                                      key={choiceIdx}
                                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                        isCorrect
                                          ? "bg-emerald-50/70 border-emerald-350 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold"
                                          : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-850 text-zinc-650"
                                      }`}
                                    >
                                      <span>{choice}</span>
                                      {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-28 text-center text-zinc-400">
                  <ClipboardCheck className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Sélectionnez un Quiz</h4>
                  <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-1 max-w-xs mx-auto">
                    Choisissez ou créez un quiz dans la liste de gauche pour configurer ses questions et choix de réponses.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABS 4: Étudiants */}
        {activeTab === "students" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Inscriptions & Cohortes</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Visualisez les apprenants inscrits à cette formation.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10"
              >
                <UserPlus className="w-3.5 h-3.5" /> Enrôler un Étudiant
              </button>
            </div>

            {courseStudents.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">Aucun apprenant inscrit</h4>
                <p className="text-zinc-450 text-xs mt-1 mb-5">Inscrivez manuellement des étudiants pour qu'ils puissent démarrer la formation.</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-750 text-white text-xs font-semibold rounded-xl"
                >
                  Inscrire un premier étudiant
                </button>
              </div>
            ) : (
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-zinc-50 dark:bg-zinc-850 px-6 py-3 border-b border-zinc-150 dark:border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span className="col-span-5 md:col-span-4">Nom complet / Email</span>
                  <span className="col-span-4 md:col-span-3 text-center">Date d'inscription</span>
                  <span className="col-span-3 md:col-span-3 text-center">Progression</span>
                  <span className="hidden md:inline col-span-2 text-center">Statut</span>
                </div>
                <div className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {courseStudents.map((student) => {
                    const enr = courseEnrollments.find(e => e.studentId === student.id);
                    const progress = enr?.progressPercent || 0;
                    const date = enr?.joinedAt ? new Date(enr.joinedAt).toLocaleDateString("fr-FR") : "—";
                    const isActif = student.status === "Actif";

                    return (
                      <div
                        key={student.id}
                        className="grid grid-cols-12 px-6 py-4 items-center text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors"
                      >
                        <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold shrink-0">
                            {(student.name || "").split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{student.name}</p>
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 truncate">{student.email}</p>
                          </div>
                        </div>
                        <span className="col-span-4 md:col-span-3 text-center text-zinc-500">{date}</span>
                        <div className="col-span-3 md:col-span-3 flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden hidden sm:block shrink-0">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0 w-8 text-right">{progress}%</span>
                        </div>
                        <span className="hidden md:inline col-span-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            enr?.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450"
                              : enr?.status === "INACTIVE"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-450"
                          }`}>
                            {enr?.status === "ACTIVE" ? "Actif" : enr?.status === "INACTIVE" ? "En attente" : enr?.status || "—"}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABS 5: Prix du cours */}
        {activeTab === "price" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 max-w-xl mx-auto">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Tarification du cours</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Définissez le coût d'inscription de ce cours.</p>
              </div>
              {priceSavedMessage && (
                <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-250 dark:border-emerald-900/30">
                  <CheckCircle2 className="w-4 h-4" /> Enregistré !
                </span>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Prix d'accès (USD)</label>
                <div className="relative rounded-xl shadow-sm max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="number"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="pl-9 pr-4 py-2.5 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5">Définir le prix à 0 rendra le cours gratuit d'accès.</p>
              </div>

              {Number(coursePrice) > 0 && (
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowInstallments"
                      checked={allowInstallments}
                      onChange={(e) => setAllowInstallments(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-650 border-zinc-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="allowInstallments" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      Activer le paiement en plusieurs tranches
                    </label>
                  </div>

                  {allowInstallments && (
                    <div className="pl-7 space-y-3 animate-in slide-in-from-top-1 duration-200">
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-450 mb-1.5">Nombre de tranches</label>
                        <input
                          type="number"
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(Math.max(2, Number(e.target.value) || 2))}
                          min="2"
                          max="12"
                          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs w-28"
                        />
                      </div>
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-350">
                        Montant estimé par tranche :{" "}
                        <span className="font-extrabold text-teal-600">
                          {(parseFloat(coursePrice) / installmentsCount).toFixed(2)}$
                        </span>{" "}
                        / tranche (Total : {installmentsCount} mensualités/tranches).
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
                <button
                  onClick={handleSavePrice}
                  className="px-5 py-2.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-teal-500/10"
                >
                  Mettre à jour le tarif
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABS 6: Paramètres (Danger zone) */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Status update box */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base font-bold">Statut de diffusion</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Pilotez la visibilité de cette formation.</p>
                </div>
                {statusSavedMessage && (
                  <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-250 dark:border-emerald-900/30">
                    <CheckCircle2 className="w-4 h-4" /> Statut modifié !
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Choisir le statut</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "DRAFT", label: "Brouillon", desc: "Non visible" },
                      { id: "REVIEW", label: "En révision", desc: "En attente admin" },
                      { id: "PUBLISHED", label: "Publié", desc: "En ligne" },
                      { id: "ARCHIVED", label: "Archivé", desc: "Masqué aux nouveaux" },
                    ].map((statusOpt) => {
                      const selected = courseStatus === statusOpt.id;
                      return (
                        <div
                          key={statusOpt.id}
                          onClick={() => setCourseStatus(statusOpt.id as Course["status"])}
                          className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                            selected
                              ? "border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
                          }`}
                        >
                          <p className="text-xs font-bold">{statusOpt.label}</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5 font-normal">{statusOpt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
                  <button
                    onClick={handleSaveStatus}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    Appliquer le statut
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/30 dark:bg-red-950/10 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/30 p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Zone de danger (Danger Zone)</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                La suppression de ce cours est définitive. Cela effacera instantanément l'arborescence (chapitres, leçons, vidéos), les quiz associés ainsi que l'ensemble des inscriptions de vos étudiants.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleDeleteCourseAction}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-red-500/20"
                >
                  Supprimer définitivement ce cours
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Quiz */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Nouveau Quiz</h2>
              <p className="text-xs text-zinc-400 mt-1">Créez une évaluation sommative pour ce cours.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre du Quiz *</label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="Ex: Examen final - DeFi"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Seuil de réussite (%)</label>
                <input
                  type="number"
                  value={newQuizPassPercent}
                  onChange={(e) => setNewQuizPassPercent(e.target.value)}
                  placeholder="70"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateQuizModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={!newQuizTitle.trim()}
                className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Créer le quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Question */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddQuestionModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Nouvelle Question</h2>
              <p className="text-xs text-zinc-400 mt-1">Configurez l'énoncé et les options.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Énoncé de la question *</label>
                <textarea
                  required
                  rows={2}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Ex: Quelle clé permet de signer les transactions sortantes ?"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Options de réponses (remplir au moins 2)</label>
                <div className="space-y-2">
                  {newQChoices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 w-4">#{idx + 1}</span>
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const updated = [...newQChoices];
                          updated[idx] = e.target.value;
                          setNewQChoices(updated);
                        }}
                        placeholder={`Option de réponse ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Option correcte (index 0-indexé)</label>
                <select
                  value={newQCorrect}
                  onChange={(e) => setNewQCorrect(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                >
                  <option value="0">Option #1 (Correcte)</option>
                  <option value="1">Option #2 (Correcte)</option>
                  <option value="2">Option #3 (Correcte)</option>
                  <option value="3">Option #4 (Correcte)</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={!newQText.trim()}
                className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Enrôler / inviter étudiant par UUID */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-zinc-150 dark:border-zinc-855">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Inscrire par ID (UUID)</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {inviteSuccess ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-teal-500 animate-bounce" />
                <p className="font-bold text-zinc-900 dark:text-white">Invitation Envoyée !</p>
                <p className="text-xs text-zinc-500">L'étudiant a été invité. L'inscription apparaîtra en statut "En attente" jusqu'à validation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">UUID du compte étudiant *</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={inviteStudentId}
                      onChange={e => setInviteStudentId(e.target.value)}
                      placeholder="Ex: d3b07384-d113-4956-a5db-85d18d40798e"
                      className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      Rechercher
                    </button>
                  </div>
                </div>

                {searchError && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {searchedStudent && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-855 space-y-3 animate-in fade-in">
                    <p className="text-[10px] uppercase font-extrabold text-teal-650 tracking-wider">Compte Trouvé</p>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{searchedStudent.name}</p>
                      <p className="text-[11px] text-zinc-500">{searchedStudent.email}</p>
                    </div>
                    <button
                      onClick={handleInviteStudent}
                      className="w-full py-2.5 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Envoyer l'invitation (Statut Inactif)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
