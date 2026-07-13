"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Camera,
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
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import RichEditor from "@/components/editor/RichEditor";
import { BlockEditor } from "@/components/editor/BlockEditor";

// ─── Types locaux ─────────────────────────────────────────
type CourseStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: CourseStatus;
  category: string;
  level: string;
  instructor_id: string;
  allow_installments: boolean;
  installments_count: number;
}

interface SectionData {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
}

interface LessonData {
  id: string;
  section_id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  sort_order: number;
}

interface QuizData {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  pass_percentage: number;
}

interface QuestionData {
  id: string;
  quiz_id: string;
  text: string;
  choices: string[];
  correct_index: number;
}

interface EnrollmentData {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
}

type TabType = "programme" | "description" | "quizzes" | "students" | "price" | "settings";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  // ─── Core data ────────────────────────────────────────────
  const [course, setCourse] = useState<CourseData | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("programme");
  const editorRef = useRef<HTMLDivElement>(null);

  // ─── Programme tab states ─────────────────────────────────
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonToSection, setAddingLessonToSection] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("15");
  const [addingQuizToSection, setAddingQuizToSection] = useState<string | null>(null);
  const [newQuizTitleInline, setNewQuizTitleInline] = useState("");
  const [activeMenuSectionId, setActiveMenuSectionId] = useState<string | null>(null);
  const [lessonSavedMessage, setLessonSavedMessage] = useState(false);

  // AI Structure generator states
  const [showAiStructureModal, setShowAiStructureModal] = useState(false);
  const [aiStructurePrompt, setAiStructurePrompt] = useState("");
  const [numChaptersAi, setNumChaptersAi] = useState("3");
  const [generatingStructure, setGeneratingStructure] = useState(false);
  const [generatingLessonContent, setGeneratingLessonContent] = useState(false);

  // ─── Lesson form (right panel) ────────────────────────────
  const [lessonForm, setLessonForm] = useState({
    title: "",
    duration_minutes: 15,
    video_url: "",
    content: "",
    description: "",
  });

  // ─── Description tab states ───────────────────────────────
  const [descForm, setDescForm] = useState({
    title: "",
    category_id: "",
    level: "Débutant",
    description: "",
  });
  const [benefits, setBenefits] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [descSavedMessage, setDescSavedMessage] = useState(false);

  // ─── Homework states ──────────────────────────────────────
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [addingHomeworkToSection, setAddingHomeworkToSection] = useState<string | null>(null);
  const [newHomeworkTitle, setNewHomeworkTitle] = useState("");
  const [newHomeworkDeadline, setNewHomeworkDeadline] = useState("");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [homeworkForm, setHomeworkForm] = useState({
    title: "",
    description: "",
    deadline: "",
    file_url: ""
  });

  // ─── Quiz tab states ──────────────────────────────────────
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizPassPercent, setNewQuizPassPercent] = useState("70");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQText, setNewQText] = useState("");
  const [newQChoices, setNewQChoices] = useState(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState("0");

  // ─── Students tab states ──────────────────────────────────
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteFound, setInviteFound] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // ─── Price tab states ─────────────────────────────────────
  const [coursePrice, setCoursePrice] = useState("0");
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [priceSavedMessage, setPriceSavedMessage] = useState(false);

  // ─── Settings tab states ──────────────────────────────────
  const [statusSavedMessage, setStatusSavedMessage] = useState(false);

  // ─── Load all data from Supabase ──────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      // Course
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle();

      if (!courseData) {
        if (!silent) setLoading(false);
        return;
      }
      setCourse(courseData as unknown as CourseData);
      const cd = courseData as unknown as Record<string, unknown>;
      // Categories
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setCategories(catData || []);

      const levelMap: Record<string, string> = {
        'BEGINNER': 'Débutant',
        'INTERMEDIATE': 'Intermédiaire',
        'ADVANCED': 'Avancé',
        'EXPERT': 'Expert',
      };
      setDescForm({
        title: courseData.title || "",
        category_id: courseData.category_id || "",
        level: levelMap[courseData.level || ''] || courseData.level || "Débutant",
        description: courseData.description || "",
      });
      setBenefits((cd.benefits as string) || "");
      setThumbnailUrl((cd.thumbnail_url as string) || "");
      setCoursePrice(String(courseData.price || 0));
      setAllowInstallments(Boolean(cd.allow_installments));
      setInstallmentsCount(Number(cd.installments_count) || 2);

      // Sections
      const { data: sectionsData } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order");
      const sects = (sectionsData || []) as SectionData[];
      setSections(sects);
      setExpandedSections(new Set(sects.map((s) => s.id)));

      // Lessons
      if (sects.length > 0) {
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .in("section_id", sects.map((s) => s.id))
          .order("sort_order");
        setLessons((lessonsData || []) as LessonData[]);
      } else {
        setLessons([]);
      }

      // Quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("course_id", courseId);
      const qzs = (quizzesData || []) as QuizData[];
      setQuizzes(qzs);

      // Questions
      if (qzs.length > 0) {
        const { data: questionsData } = await supabase
          .from("questions")
          .select("*")
          .in("quiz_id", qzs.map((q) => q.id));
        setQuestions((questionsData || []) as QuestionData[]);
      } else {
        setQuestions([]);
      }

      // Enrollments with student profile
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("*, profiles!student_id(full_name, email)")
        .eq("course_id", courseId);
      setEnrollments((enrollmentsData || []) as EnrollmentData[]);

      // Homeworks
      const { data: hwData } = await (supabase as any)
        .from("homeworks")
        .select("*")
        .eq("course_id", courseId);
      setHomeworks(hwData || []);

    } catch (err) {
      console.error("[CourseBuilder] loadData error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load selected lesson into form — only when the user selects a different lesson,
  // not on every background reload (which would reset the form mid-edit).
  const prevSelectedLessonIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedLessonId) return;
    // Only re-populate form when the selected lesson changes
    if (selectedLessonId === prevSelectedLessonIdRef.current) return;
    prevSelectedLessonIdRef.current = selectedLessonId;
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        duration_minutes: lesson.duration_minutes,
        video_url: lesson.video_url || "",
        content: lesson.content || "",
        description: lesson.description || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLessonId]);

  // Scroll to editor ref on mobile when selected lesson changes
  useEffect(() => {
    if (selectedLessonId && typeof window !== "undefined" && window.innerWidth < 1024 && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedLessonId]);

  // ─── Helpers ──────────────────────────────────────────────
  const getLessons = (sectionId: string) =>
    lessons.filter((l) => l.section_id === sectionId).sort((a, b) => a.sort_order - b.sort_order);

  const getSectionQuizzes = (sectionId: string) =>
    quizzes.filter((q) => q.section_id === sectionId);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── SECTION CRUD ─────────────────────────────────────────
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      const lastSectionQuizzes = quizzes.filter((q) => q.section_id === lastSection.id);
      if (lastSectionQuizzes.length === 0) {
        alert(`Vous devez d'abord créer un Quiz à la fin du chapitre "${lastSection.title}" avant de pouvoir créer le chapitre suivant.`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: newSectionTitle.trim(), order: sections.length }),
      });
      if (res.ok) {
        setNewSectionTitle("");
        setShowNewSection(false);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleRenameSection = async (sectId: string) => {
    if (!editingSectionTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sectId, title: editingSectionTitle.trim() }),
      });
      if (res.ok) {
        setEditingSectionId(null);
        setEditingSectionTitle("");
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleDeleteSection = async (sectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette section et toutes ses leçons ? Action irréversible.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sections?id=${sectId}`, { method: "DELETE" });
      if (res.ok) {
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const moveSectionOrder = async (sectId: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = sections.findIndex((s) => s.id === sectId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = sections[idx];
    const target = sections[targetIdx];
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/sections", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: current.id, order: target.sort_order }) }),
        fetch("/api/sections", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: target.id, order: current.sort_order }) }),
      ]);
      await loadData(true);
    } finally { setSaving(false); }
  };

  const handleGenerateStructureAi = async () => {
    if (!aiStructurePrompt.trim()) return;
    setGeneratingStructure(true);
    try {
      const res = await fetch("/api/ai/course-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          prompt: aiStructurePrompt.trim(),
          numChapters: Number(numChaptersAi) || 3
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur de génération.");
      }

      setShowAiStructureModal(false);
      setAiStructurePrompt("");
      // Reload curriculum data silently
      loadData(true);
      alert("Structure de formation générée par l'IA avec succès !");
    } catch (err: any) {
      alert("Erreur lors de la génération de la structure : " + err.message);
    } finally {
      setGeneratingStructure(false);
    }
  };
  const handleGenerateLessonContentAi = async () => {
    if (!selectedLessonId) return;
    const defaultPrompt = `Leçon sur "${lessonForm.title}"` + (lessonForm.description ? `, description: ${lessonForm.description}` : "");
    const userPrompt = prompt("Sujet ou consignes spécifiques pour générer le contenu de la leçon :", defaultPrompt);
    
    if (userPrompt === null) return; // user cancelled
    if (!userPrompt.trim()) return;

    setGeneratingLessonContent(true);
    try {
      const res = await fetch("/api/ai/lesson-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la génération.");
      }

      const data = await res.json();
      if (data.html) {
        setLessonForm(prev => ({
          ...prev,
          content: data.html
        }));
        alert("Contenu de la leçon généré avec succès par l'IA ! (N'oubliez pas d'enregistrer la leçon)");
      }
    } catch (err: any) {
      alert("Erreur de génération : " + err.message);
    } finally {
      setGeneratingLessonContent(false);
    }
  };

  // ─── LESSON CRUD ──────────────────────────────────────────
  const handleAddLesson = async (sectionId: string) => {
    if (!newLessonTitle.trim()) return;
    const sectionLessons = getLessons(sectionId);
    setSaving(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          title: newLessonTitle.trim(),
          description: "",
          content: "",
          videoUrl: "",
          durationMin: Number(newLessonDuration) || 15,
          order: sectionLessons.length,
        }),
      });
      if (res.ok) {
        setNewLessonTitle("");
        setNewLessonDuration("15");
        setAddingLessonToSection(null);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleSaveLesson = async () => {
    if (!selectedLessonId || !lessonForm.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLessonId,
          title: lessonForm.title,
          description: lessonForm.description,
          content: lessonForm.content,
          videoUrl: lessonForm.video_url,
          durationMin: lessonForm.duration_minutes,
        }),
      });
      if (res.ok) {
        setLessonSavedMessage(true);
        setTimeout(() => setLessonSavedMessage(false), 3000);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette leçon ? Action définitive.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lessons?id=${lessonId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedLessonId === lessonId) setSelectedLessonId(null);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const moveLessonOrder = async (lessonId: string, direction: "up" | "down", sectionId: string) => {
    const list = getLessons(sectionId);
    const idx = list.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === list.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = list[idx];
    const target = list[targetIdx];
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/lessons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: current.id, order: target.sort_order }) }),
        fetch("/api/lessons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: target.id, order: current.sort_order }) }),
      ]);
      await loadData(true);
    } finally { setSaving(false); }
  };

  // ─── QUIZ CRUD ────────────────────────────────────────────
  const handleAddQuizInline = async (sectionId: string) => {
    if (!newQuizTitleInline.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, sectionId, title: newQuizTitleInline.trim(), passPercentage: 70 }),
      });
      if (res.ok) {
        setNewQuizTitleInline("");
        setAddingQuizToSection(null);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: newQuizTitle.trim(), passPercentage: Number(newQuizPassPercent) || 70 }),
      });
      if (res.ok) {
        setNewQuizTitle("");
        setNewQuizPassPercent("70");
        setShowCreateQuizModal(false);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Supprimer ce quiz et toutes ses questions ?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes?id=${quizId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedQuizId === quizId) setSelectedQuizId(null);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  // ─── QUESTION CRUD ────────────────────────────────────────
  const handleAddQuestion = async () => {
    if (!newQText.trim() || !selectedQuizId) return;
    const cleanChoices = newQChoices.filter((c) => c.trim() !== "");
    if (cleanChoices.length < 2) { alert("Au moins 2 options requises."); return; }
    const correctIdx = Number(newQCorrect);
    if (correctIdx >= cleanChoices.length) { alert("La bonne réponse est invalide."); return; }

    const quizQuestions = questions.filter((q) => q.quiz_id === selectedQuizId);
    if (quizQuestions.length >= 10) {
      alert("Erreur : Un quiz ne peut pas contenir plus de 10 questions (QCM).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: selectedQuizId, text: newQText.trim(), choices: cleanChoices, correctIndex: correctIdx }),
      });
      if (res.ok) {
        setNewQText("");
        setNewQChoices(["", "", "", ""]);
        setNewQCorrect("0");
        setShowAddQuestionModal(false);
        await loadData(true);
      } else {
        const err = await res.json();
        alert("Erreur : " + err.error);
      }
    } finally { setSaving(false); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/questions?id=${questionId}`, { method: "DELETE" });
      if (res.ok) { await loadData(true); }
      else { const err = await res.json(); alert("Erreur : " + err.error); }
    } finally { setSaving(false); }
  };

  // ─── COURSE UPDATE handlers ───────────────────────────────
  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descForm.title.trim()) return;
    setSaving(true);
    try {
      const slug = descForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const labelToLevel: Record<string, string> = {
        'Débutant': 'BEGINNER',
        'Intermédiaire': 'INTERMEDIATE',
        'Avancé': 'ADVANCED',
        'Expert': 'EXPERT',
      };
      const mappedLevel = labelToLevel[descForm.level] || descForm.level || 'BEGINNER';

      const updatePayload: any = {
        title: descForm.title,
        slug,
        category_id: descForm.category_id || null,
        level: mappedLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
        description: descForm.description,
        benefits: benefits || null,
        thumbnail_url: thumbnailUrl || null,
        updated_at: new Date().toISOString(),
      };

      let { error } = await (supabase as any)
        .from("courses")
        .update(updatePayload)
        .eq("id", courseId);

      // Graceful fallback if benefits column is missing in Supabase
      if (error && (error.message?.includes("benefits") || error.code === "PGRST205" || error.code === "PGRST211")) {
        console.warn("La colonne 'benefits' semble manquante dans Supabase. Tentative de sauvegarde sans ce champ...");
        delete updatePayload.benefits;
        const retryResult = await (supabase as any)
          .from("courses")
          .update(updatePayload)
          .eq("id", courseId);
        
        if (!retryResult.error) {
          alert("Sauvegarde réussie, mais les 'Bénéfices' n'ont pas pu être enregistrés car la base de données n'est pas à jour. Veuillez exécuter le script de migration (node scratch/run-migrations.js <mot_de_passe>).");
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      if (error) { alert("Erreur : " + error.message); return; }
      setDescForm({
        title: descForm.title,
        category_id: descForm.category_id,
        level: descForm.level,
        description: descForm.description,
      });
      setDescSavedMessage(true);
      setTimeout(() => setDescSavedMessage(false), 3000);
      await loadData(true);
    } finally { setSaving(false); }
  };

  const handleSavePrice = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("courses")
        .update({
          price: parseFloat(coursePrice) || 0,
          allow_installments: allowInstallments,
          installments_count: installmentsCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", courseId);
      if (error) { alert("Erreur : " + error.message); return; }
      setPriceSavedMessage(true);
      setTimeout(() => setPriceSavedMessage(false), 3000);
      await loadData(true);
    } finally { setSaving(false); }
  };

  const handleRequestReview = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("courses")
        .update({ status: "REVIEW", updated_at: new Date().toISOString() })
        .eq("id", courseId);
      if (error) { alert("Erreur : " + error.message); return; }
      setStatusSavedMessage(true);
      setTimeout(() => setStatusSavedMessage(false), 3000);
      await loadData(true);
    } finally { setSaving(false); }
  };

  const handleCancelReview = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("courses")
        .update({ status: "DRAFT", updated_at: new Date().toISOString() })
        .eq("id", courseId);
      if (error) { alert("Erreur : " + error.message); return; }
      setStatusSavedMessage(true);
      setTimeout(() => setStatusSavedMessage(false), 3000);
      await loadData(true);
    } finally { setSaving(false); }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("ATTENTION : Supprimer définitivement ce cours et tout son contenu ?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) { alert("Erreur : " + error.message); return; }
      router.push("/instructor/courses");
    } finally { setSaving(false); }
  };

  // ─── STUDENTS tab handlers ────────────────────────────────
  const handleSearchStudent = async () => {
    if (!inviteEmail.trim()) return;
    setInviteSearching(true);
    setInviteError("");
    setInviteFound(null);
    try {
      const term = inviteEmail.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
      
      const query = supabase
        .from("profiles")
        .select("id, full_name, email");
      
      const { data, error } = isUuid 
        ? await query.eq("id", term).maybeSingle()
        : await query.eq("email", term).maybeSingle();

      if (data) {
        setInviteFound(data);
      } else {
        setInviteError("Aucun compte trouvé avec cet email ou ID.");
      }
    } catch (err: any) {
      setInviteError("Erreur lors de la recherche : " + err.message);
    } finally { setInviteSearching(false); }
  };

  const handleInviteStudent = async () => {
    if (!inviteFound) return;
    const alreadyEnrolled = enrollments.some((e) => e.student_id === inviteFound.id);
    if (alreadyEnrolled) { setInviteError("Cet étudiant est déjà inscrit à ce cours."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/instructor/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: inviteFound.id,
          courseId: courseId,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setInviteError("Erreur : " + (resData.error || "Une erreur est survenue lors de l'inscription."));
        return;
      }

      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteFound(null);
        loadData(true);
      }, 2000);
    } catch (err: any) {
      setInviteError("Erreur : " + err.message);
    } finally { setSaving(false); }
  };

  // ─── Computed ─────────────────────────────────────────────
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((sum, l) => sum + l.duration_minutes, 0);
  const courseQuizzes = quizzes.filter((q) => !q.section_id);
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / enrollments.length)
    : 0;

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">

      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-lg animate-in slide-in-from-top-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement...
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link href="/instructor/courses" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => loadData(true)} className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer" title="Actualiser">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50">
            Espace Instructeur
          </span>
        </div>
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
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : course.status === "REVIEW"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400"
            }`}>
              {course.status === "PUBLISHED" ? "En ligne" : course.status === "DRAFT" ? "Brouillon" : course.status === "REVIEW" ? "En révision" : "Archivé"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white mt-3 leading-tight">{course.title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 flex items-center gap-4 flex-wrap">
            <span>{sections.length} Chapitre{sections.length > 1 ? "s" : ""}</span>
            <span>{totalLessons} Leçon{totalLessons > 1 ? "s" : ""}</span>
            <span>{totalDuration} min</span>
            <span>{enrollments.length} Étudiant{enrollments.length > 1 ? "s" : ""}</span>
          </p>
        </div>
        <div className="flex gap-4 self-start md:self-auto">
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-center min-w-[110px]">
            <p className="text-2xl font-extrabold text-teal-600">{avgProgress}%</p>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Prog. Moyenne</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-center min-w-[110px]">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{course.price > 0 ? `${course.price}$` : "Gratuit"}</p>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Tarif</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-1">
        {[
          { id: "programme", label: "Programme", icon: BookOpen },
          { id: "description", label: "Description", icon: Edit3 },
          { id: "quizzes", label: "Quiz", icon: ClipboardCheck },
          { id: "students", label: "Étudiants", icon: Users },
          { id: "price", label: "Prix", icon: DollarSign },
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

      {/* Tab Content */}
      <div className="mt-4">

        {/* ── TAB 1: Programme ── */}
        {activeTab === "programme" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Sections / Lessons tree */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Arborescence du cours</h3>
                  <span className="text-xs text-zinc-400">{sections.length} chapitre{sections.length > 1 ? "s" : ""}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiStructureModal(true)}
                  className="w-full py-2.5 bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/20 dark:hover:bg-teal-900/30 text-teal-650 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-teal-200/50 dark:border-teal-900/50 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Générer la structure avec l'IA
                </button>

                <div className="space-y-3">
                  {sections.map((section, idx) => {
                    const sectionLessons = getLessons(section.id);
                    const sectionQuizzes = getSectionQuizzes(section.id);
                    const isExpanded = expandedSections.has(section.id);
                    const isEditing = editingSectionId === section.id;
                    const totalDur = sectionLessons.reduce((s, l) => s + l.duration_minutes, 0);

                    return (
                      <div key={section.id} className="rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                        {/* Section header */}
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
                                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameSection(section.id); if (e.key === "Escape") setEditingSectionId(null); }}
                                />
                                <button onClick={() => handleRenameSection(section.id)} className="p-1 text-teal-600 hover:bg-teal-50 rounded">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingSectionId(null)} className="p-1 text-zinc-400 hover:bg-zinc-100 rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                {idx + 1}. {section.title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-zinc-400 mr-1">{totalDur}m</span>
                            <button onClick={() => { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }} className="p-1 text-zinc-400 hover:text-teal-600 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors" title="Renommer">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => moveSectionOrder(section.id, "up", e)} disabled={idx === 0} className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-md disabled:opacity-20">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => moveSectionOrder(section.id, "down", e)} disabled={idx === sections.length - 1} className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-md disabled:opacity-20">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => handleDeleteSection(section.id, e)} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-850 rounded-md transition-colors" title="Supprimer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons & Quizzes */}
                        {isExpanded && (
                          <div className="border-t border-zinc-150 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/40">
                            {sectionLessons.map((lesson, lessonIdx) => {
                              const active = selectedLessonId === lesson.id;
                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => { setSelectedLessonId(lesson.id); setSelectedHomeworkId(null); }}
                                  className={`flex items-center justify-between px-5 py-2.5 cursor-pointer transition-colors ${
                                    active
                                      ? "bg-teal-50/70 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500"
                                      : "hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 text-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {lesson.video_url ? (
                                      <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    )}
                                    <span className="text-xs truncate">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] text-zinc-400 mr-2 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> {lesson.duration_minutes}m
                                    </span>
                                    <button onClick={() => moveLessonOrder(lesson.id, "up", section.id)} disabled={lessonIdx === 0} className="p-0.5 text-zinc-450 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20">
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => moveLessonOrder(lesson.id, "down", section.id)} disabled={lessonIdx === sectionLessons.length - 1} className="p-0.5 text-zinc-450 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20">
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button onClick={(e) => handleDeleteLesson(lesson.id, e)} className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Section quizzes */}
                            {sectionQuizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                onClick={() => { setSelectedQuizId(quiz.id); setSelectedLessonId(null); setSelectedHomeworkId(null); setActiveTab("quizzes"); }}
                                className="flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="text-xs font-semibold truncate text-zinc-650 dark:text-zinc-350">Quiz : {quiz.title}</span>
                                </div>
                                <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">QCM</span>
                              </div>
                            ))}

                            {/* Section homeworks */}
                            {homeworks.filter((h) => h.section_id === section.id).map((hw) => (
                              <div
                                key={hw.id}
                                onClick={() => {
                                  setSelectedHomeworkId(hw.id);
                                  setSelectedLessonId(null);
                                  setSelectedQuizId(null);
                                  setHomeworkForm({
                                    title: hw.title || "",
                                    description: hw.description || "",
                                    deadline: hw.deadline ? hw.deadline.slice(0, 16) : "",
                                    file_url: hw.file_url || ""
                                  });
                                  setActiveTab("programme");
                                }}
                                className={`flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 transition-colors ${
                                  selectedHomeworkId === hw.id ? "bg-teal-50/70 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="text-xs truncate text-zinc-650 dark:text-zinc-350">Devoir : {hw.title}</span>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Supprimer ce devoir ?")) return;
                                    setSaving(true);
                                    try {
                                      const res = await fetch(`/api/homeworks?id=${hw.id}`, { method: "DELETE" });
                                      if (res.ok) {
                                        if (selectedHomeworkId === hw.id) setSelectedHomeworkId(null);
                                        await loadData(true);
                                      } else {
                                        const err = await res.json();
                                        alert("Erreur : " + err.error);
                                      }
                                    } finally { setSaving(false); }
                                  }}
                                  className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Inline Quiz Add */}
                            {addingQuizToSection === section.id ? (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={newQuizTitleInline}
                                  onChange={(e) => setNewQuizTitleInline(e.target.value)}
                                  placeholder="Nom du quiz"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === "Enter") handleAddQuizInline(section.id); }}
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleAddQuizInline(section.id)} className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">Créer</button>
                                  <button onClick={() => setAddingQuizToSection(null)} className="p-1.5 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : addingLessonToSection === section.id ? (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={newLessonTitle}
                                  onChange={(e) => setNewLessonTitle(e.target.value)}
                                  placeholder="Titre de la leçon"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === "Enter") handleAddLesson(section.id); }}
                                />
                                <div className="flex gap-2">
                                  <input type="number" value={newLessonDuration} onChange={(e) => setNewLessonDuration(e.target.value)} placeholder="Durée (min)" className="w-20 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" />
                                  <button onClick={() => handleAddLesson(section.id)} className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">Ajouter</button>
                                  <button onClick={() => setAddingLessonToSection(null)} className="p-1.5 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : addingHomeworkToSection === section.id ? (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={newHomeworkTitle}
                                  onChange={(e) => setNewHomeworkTitle(e.target.value)}
                                  placeholder="Titre du devoir"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                                  autoFocus
                                />
                                <input
                                  type="datetime-local"
                                  value={newHomeworkDeadline}
                                  onChange={(e) => setNewHomeworkDeadline(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 font-semibold"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!newHomeworkTitle.trim()) return;
                                      setSaving(true);
                                      try {
                                        const res = await fetch("/api/homeworks", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            courseId,
                                            sectionId: section.id,
                                            title: newHomeworkTitle.trim(),
                                            deadline: newHomeworkDeadline || null
                                          })
                                        });
                                        if (res.ok) {
                                          setNewHomeworkTitle("");
                                          setNewHomeworkDeadline("");
                                          setAddingHomeworkToSection(null);
                                          await loadData(true);
                                        } else {
                                          const err = await res.json();
                                          alert("Erreur : " + err.error);
                                        }
                                      } finally { setSaving(false); }
                                    }}
                                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Créer
                                  </button>
                                  <button onClick={() => setAddingHomeworkToSection(null)} className="p-1.5 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
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
                                  <Plus className="w-3.5 h-3.5" /> Ajouter...
                                </button>
                                {activeMenuSectionId === section.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuSectionId(null)} />
                                    <div className="absolute left-4 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 font-semibold text-xs text-zinc-750 dark:text-zinc-300">
                                      <button onClick={() => { setAddingLessonToSection(section.id); setAddingQuizToSection(null); setAddingHomeworkToSection(null); setActiveMenuSectionId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer">
                                        <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Leçon
                                      </button>
                                      <button onClick={() => { setAddingQuizToSection(section.id); setAddingLessonToSection(null); setAddingHomeworkToSection(null); setActiveMenuSectionId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer">
                                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Quiz de section
                                      </button>
                                      <button onClick={() => { setAddingHomeworkToSection(section.id); setAddingLessonToSection(null); setAddingQuizToSection(null); setActiveMenuSectionId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer">
                                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Devoir
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

                {/* Add Section */}
                {showNewSection ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-teal-350 dark:border-teal-850 p-4 flex flex-col gap-2 mt-4">
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Nom du nouveau chapitre"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddSection(); if (e.key === "Escape") setShowNewSection(false); }}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNewSection(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700">Annuler</button>
                      <button onClick={handleAddSection} disabled={saving} className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-50">
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

            {/* Right: Lesson editor panel */}
            <div className="lg:col-span-7" ref={editorRef}>
              {selectedLessonId ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">Édition de la Leçon</h3>
                      <p className="text-zinc-400 text-[11px] mt-0.5">Saisissez les contenus et paramétrez cette leçon.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre de la leçon *</label>
                      <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Durée estimée (minutes)</label>
                      <input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm((p) => ({ ...p, duration_minutes: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Lien Vidéo (YouTube, Vimeo, MP4)</label>
                    <input type="text" value={lessonForm.video_url} onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Description courte</label>
                    <textarea value={lessonForm.description} onChange={(e) => setLessonForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Résumé succinct de la leçon..." className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Contenu de la Leçon (Éditeur de Blocs)</label>
                      <button
                        type="button"
                        onClick={handleGenerateLessonContentAi}
                        disabled={generatingLessonContent}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {generatingLessonContent ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-650" />
                            <span>Génération...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-teal-650" />
                            <span>Rédiger avec l'IA</span>
                          </>
                        )}
                      </button>
                    </div>
                    <BlockEditor value={lessonForm.content} onChange={(html) => setLessonForm((p) => ({ ...p, content: html }))} />
                  </div>

                  {/* Save button — bottom of the editor */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    {lessonSavedMessage && (
                      <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                        <CheckCircle2 className="w-4 h-4" /> Sauvegardé !
                      </span>
                    )}
                    {!lessonSavedMessage && <div />}
                    <button
                      onClick={handleSaveLesson}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Enregistrer la leçon
                    </button>
                  </div>
                </div>
              ) : selectedHomeworkId ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">Édition du Devoir</h3>
                      <p className="text-zinc-450 text-[11px] mt-0.5">Saisissez les consignes et paramétrez ce devoir.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre du devoir *</label>
                      <input
                        type="text"
                        required
                        value={homeworkForm.title}
                        onChange={(e) => setHomeworkForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Date limite de remise</label>
                      <input
                        type="datetime-local"
                        value={homeworkForm.deadline}
                        onChange={(e) => setHomeworkForm((p) => ({ ...p, deadline: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-750 dark:text-zinc-350"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Fichier joint / Ressource (Max 5 Mo)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={homeworkForm.file_url}
                          onChange={(e) => setHomeworkForm((p) => ({ ...p, file_url: e.target.value }))}
                          placeholder="Collez l'URL du document ou chargez un fichier..."
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400"
                        />
                        <input
                          type="file"
                          id="homework-file-upload-editor"
                          accept=".pdf,.doc,.docx,.zip,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Le document est trop volumineux (Max 5 Mo).");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setHomeworkForm((p) => ({ ...p, file_url: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("homework-file-upload-editor")?.click()}
                          className="px-3.5 py-2 bg-zinc-105 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-205 dark:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                        >
                          Uploader
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Description complète / Consignes *</label>
                      <textarea
                        value={homeworkForm.description}
                        onChange={(e) => setHomeworkForm((p) => ({ ...p, description: e.target.value }))}
                        rows={6}
                        placeholder="Rédigez les détails du devoir demandé..."
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      onClick={async () => {
                        if (!homeworkForm.title.trim()) return;
                        setSaving(true);
                        try {
                          const res = await fetch("/api/homeworks", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: selectedHomeworkId,
                              title: homeworkForm.title,
                              description: homeworkForm.description,
                              fileUrl: homeworkForm.file_url,
                              deadline: homeworkForm.deadline || null
                            })
                          });
                          if (res.ok) {
                            alert("Devoir enregistré avec succès !");
                            await loadData(true);
                          } else {
                            const err = await res.json();
                            alert("Erreur : " + err.error);
                          }
                        } finally { setSaving(false); }
                      }}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Enregistrer le devoir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-28 text-center text-zinc-400">
                  <Play className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Sélectionnez un élément</h4>
                  <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-1 max-w-xs mx-auto">
                    Cliquez sur une leçon ou un devoir dans l'arborescence pour modifier son titre et ses consignes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Structure Generator Modal */}
        {showAiStructureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 text-teal-650 font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                <h3>Générer la Structure avec l'IA</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Sujet ou description du cours</label>
                  <textarea
                    value={aiStructurePrompt}
                    onChange={(e) => setAiStructurePrompt(e.target.value)}
                    rows={4}
                    placeholder="Ex: Formation complète sur React 19 et Next.js App Router, incluant les Server Actions et l'intégration de Supabase."
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs placeholder-zinc-400 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nombre de chapitres (sections) à générer</label>
                  <select
                    value={numChaptersAi}
                    onChange={(e) => setNumChaptersAi(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-750 dark:text-zinc-300 font-medium"
                  >
                    <option value="2">2 chapitres</option>
                    <option value="3">3 chapitres</option>
                    <option value="4">4 chapitres</option>
                    <option value="5">5 chapitres</option>
                    <option value="6">6 chapitres</option>
                    <option value="7">7 chapitres</option>
                    <option value="8">8 chapitres</option>
                    <option value="9">9 chapitres</option>
                    <option value="10">10 chapitres</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAiStructureModal(false); setAiStructurePrompt(""); }}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-700 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerateStructureAi}
                  disabled={generatingStructure || !aiStructurePrompt.trim()}
                  className="px-5 py-2.5 bg-teal-650 hover:bg-teal-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {generatingStructure ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Générer le programme
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Description ── */}
        {activeTab === "description" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Présentation publique</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Ces informations seront affichées sur la page publique d'inscription.</p>
              </div>
              {descSavedMessage && (
                <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                  <CheckCircle2 className="w-4 h-4" /> Sauvegardé !
                </span>
              )}
            </div>
            <form onSubmit={handleSaveDescription} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre du cours *</label>
                  <input required type="text" value={descForm.title} onChange={(e) => setDescForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Slug (URL publique)</label>
                  <input disabled type="text" value={descForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")} className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Thématique / Catégorie</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-left text-zinc-900 dark:text-white flex justify-between items-center cursor-pointer select-none"
                    >
                      <span className="truncate">
                        {categories.find((c) => c.id === descForm.category_id)?.name || "Sélectionnez une catégorie"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {categoryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setCategoryDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
                          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850">
                            <input
                              type="text"
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              placeholder="Rechercher une catégorie..."
                              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-850/50">
                            {categories.filter((c) =>
                              c.name.toLowerCase().includes(categorySearch.toLowerCase())
                            ).length === 0 ? (
                              <div className="px-4 py-3 text-xs text-zinc-400 text-center">Aucun résultat</div>
                            ) : (
                              categories
                                .filter((c) =>
                                  c.name.toLowerCase().includes(categorySearch.toLowerCase())
                                )
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setDescForm((prev) => ({ ...prev, category_id: c.id }));
                                      setCategoryDropdownOpen(false);
                                      setCategorySearch("");
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs transition-colors flex items-center justify-between ${
                                      descForm.category_id === c.id ? "text-teal-600 font-bold bg-teal-50/20 dark:bg-teal-900/10" : "text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    <span>{c.name}</span>
                                    {descForm.category_id === c.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Niveau cible</label>
                  <select value={descForm.level} onChange={(e) => setDescForm((p) => ({ ...p, level: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white">
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Cover image uploader */}
              <div className="bg-zinc-50 dark:bg-zinc-850/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Image de couverture du cours</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Couverture" className="w-40 h-24 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                  ) : (
                    <div className="w-40 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                      Pas d'image de couverture
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="cover-image-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1.5 * 1024 * 1024) {
                          alert("L'image est trop volumineuse. Veuillez choisir une image de moins de 1.5 Mo.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setThumbnailUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("cover-image-upload")?.click()}
                      className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-zinc-500" /> Charger une image
                    </button>
                    {thumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl("")}
                        className="text-xs text-red-500 hover:underline text-left font-medium cursor-pointer"
                      >
                        Supprimer la couverture
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Benefits Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Bénéfices du cours / À la fin du cours l'apprenant va bénéficier de
                </label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={3}
                  placeholder="Écrivez les compétences ou avantages que les étudiants obtiendront..."
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description complète</label>
                <RichEditor value={descForm.description} onChange={(html) => setDescForm((p) => ({ ...p, description: html }))} placeholder="Détaillez le programme, les compétences cibles et les perspectives..." />
              </div>
              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button type="submit" disabled={saving} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-50">
                  Sauvegarder les détails
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 3: Quiz & Examens ── */}
        {activeTab === "quizzes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Évaluations du cours</h3>
                  <button onClick={() => setShowCreateQuizModal(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer">
                    <Plus className="w-3 h-3" /> Créer
                  </button>
                </div>
                {quizzes.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400">
                    <ClipboardCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs">Aucun quiz créé pour ce cours.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {quizzes.map((quiz) => {
                      const quizQuestions = questions.filter((q) => q.quiz_id === quiz.id);
                      const active = selectedQuizId === quiz.id;
                      return (
                        <div
                          key={quiz.id}
                          onClick={() => setSelectedQuizId(quiz.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? "bg-teal-50/70 dark:bg-teal-950/20 border-teal-500"
                              : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-800 hover:bg-zinc-100/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-xs text-zinc-850 dark:text-zinc-200">{quiz.title}</h4>
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1">
                                {quizQuestions.length} question{quizQuestions.length > 1 ? "s" : ""} · Seuil {quiz.pass_percentage}%
                              </p>
                              {quiz.section_id && <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded mt-1 inline-block">Lié à une section</span>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id); }} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Questions editor */}
            <div className="lg:col-span-7">
              {selectedQuizId ? (() => {
                const activeQuiz = quizzes.find((q) => q.id === selectedQuizId);
                const quizQuestions = questions.filter((qn) => qn.quiz_id === selectedQuizId);
                return (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Questions du Quiz</h3>
                        <p className="text-zinc-400 text-xs mt-0.5">{activeQuiz?.title} · Seuil {activeQuiz?.pass_percentage}%</p>
                      </div>
                      <button onClick={() => setShowAddQuestionModal(true)} className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Ajouter une question
                      </button>
                    </div>
                    {quizQuestions.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <HelpCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">Aucune question dans ce quiz</h4>
                        <p className="text-zinc-450 text-[11px] mt-1 mb-4">Cliquez sur "Ajouter une question" pour commencer.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quizQuestions.map((qn, qnIdx) => (
                          <div key={qn.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-150 dark:border-zinc-800/80">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">Question {qnIdx + 1}</span>
                              <button onClick={() => handleDeleteQuestion(qn.id)} className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs font-bold text-zinc-850 dark:text-zinc-250 mb-3">{qn.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {qn.choices.map((choice, choiceIdx) => {
                                const isCorrect = choiceIdx === qn.correct_index;
                                return (
                                  <div key={choiceIdx} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${isCorrect ? "bg-emerald-50/70 border-emerald-350 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold" : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-850 text-zinc-650"}`}>
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
              })() : (
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-28 text-center text-zinc-400">
                  <ClipboardCheck className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Sélectionnez un Quiz</h4>
                  <p className="text-zinc-450 dark:text-zinc-500 text-xs mt-1 max-w-xs mx-auto">
                    Choisissez ou créez un quiz pour configurer ses questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: Étudiants ── */}
        {activeTab === "students" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Inscriptions & Cohortes</h3>
                <p className="text-zinc-400 text-xs mt-0.5">{enrollments.length} étudiant{enrollments.length > 1 ? "s" : ""} inscrits</p>
              </div>
              <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                <UserPlus className="w-3.5 h-3.5" /> Enrôler un Étudiant
              </button>
            </div>
            {enrollments.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">Aucun apprenant inscrit</h4>
                <p className="text-zinc-450 text-xs mt-1 mb-5">Inscrivez manuellement des étudiants pour qu'ils puissent démarrer la formation.</p>
                <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl">
                  Inscrire un premier étudiant
                </button>
              </div>
            ) : (
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-zinc-50 dark:bg-zinc-850 px-6 py-3 border-b border-zinc-150 dark:border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span className="col-span-5">Nom / Email</span>
                  <span className="col-span-3 text-center">Inscription</span>
                  <span className="col-span-2 text-center">Progression</span>
                  <span className="col-span-2 text-center">Statut</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {enrollments.map((enr) => {
                    const profile = (enr as any).profiles;
                    const name = profile?.full_name || "Apprenant";
                    const email = profile?.email || "";
                    const initials = name.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2).toUpperCase();
                    const date = enr.created_at ? new Date(enr.created_at).toLocaleDateString("fr-FR") : "—";
                    return (
                      <div key={enr.id} className="grid grid-cols-12 px-6 py-4 items-center text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold shrink-0">{initials}</div>
                          <div className="min-w-0 truncate">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{name}</p>
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 truncate">{email}</p>
                          </div>
                        </div>
                        <span className="col-span-3 text-center text-zinc-500">{date}</span>
                        <div className="col-span-2 flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${enr.progress_percent}%` }} />
                          </div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right w-8">{enr.progress_percent}%</span>
                        </div>
                        <span className="col-span-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            enr.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450"
                              : enr.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450"
                          }`}>
                            {enr.status === "ACTIVE" ? "Actif" : enr.status === "COMPLETED" ? "Terminé" : "En attente"}
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

        {/* ── TAB 5: Prix ── */}
        {activeTab === "price" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 max-w-xl mx-auto">
            <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Tarification du cours</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Définissez le coût d'inscription de ce cours.</p>
              </div>
              {priceSavedMessage && (
                <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
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
                  <input type="number" value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} placeholder="0" min="0" className="pl-9 pr-4 py-2.5 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5">Prix à 0 = cours gratuit.</p>
              </div>
              {Number(coursePrice) > 0 && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="allowInstallments" checked={allowInstallments} onChange={(e) => setAllowInstallments(e.target.checked)} className="w-4 h-4 rounded text-teal-600 border-zinc-300 focus:ring-teal-500 cursor-pointer" />
                    <label htmlFor="allowInstallments" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">Activer le paiement en plusieurs tranches</label>
                  </div>
                  {allowInstallments && (
                    <div className="pl-7 space-y-3 animate-in slide-in-from-top-1 duration-200">
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-450 mb-1.5">Nombre de tranches</label>
                        <input type="number" value={installmentsCount} onChange={(e) => setInstallmentsCount(Math.max(2, Number(e.target.value) || 2))} min="2" max="12" className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs w-28" />
                      </div>
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-350">
                        Montant estimé : <span className="font-extrabold text-teal-600">{(parseFloat(coursePrice) / installmentsCount).toFixed(2)}$</span> / tranche
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button onClick={handleSavePrice} disabled={saving} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50">
                  Mettre à jour le tarif
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Paramètres ── */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
              <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Statut de diffusion</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Pilotez la visibilité de cette formation.</p>
                </div>
                {statusSavedMessage && (
                  <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                    <CheckCircle2 className="w-4 h-4" /> Statut modifié !
                  </span>
                )}
              </div>
              <div className="space-y-6">
                {/* Stepper de progression du processus */}
                <div className="relative pt-4 pb-6">
                  {/* Ligne grise en arrière-plan */}
                  <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-zinc-150 dark:bg-zinc-800 -translate-y-1/2" />
                  
                  {/* Ligne de progression colorée */}
                  <div 
                    className="absolute top-1/2 left-6 h-0.5 bg-teal-500 -translate-y-1/2 transition-all duration-500" 
                    style={{
                      width: course.status === "PUBLISHED" ? "calc(100% - 3rem)" : course.status === "REVIEW" ? "50%" : "0%"
                    }}
                  />

                  {/* Étapes */}
                  <div className="relative z-10 flex justify-between px-2">
                    {[
                      { step: 1, label: "Brouillon", done: course.status === "REVIEW" || course.status === "PUBLISHED", isCurrent: course.status === "DRAFT" },
                      { step: 2, label: "En révision", done: course.status === "PUBLISHED", isCurrent: course.status === "REVIEW" },
                      { step: 3, label: "En ligne", done: course.status === "PUBLISHED", isCurrent: course.status === "PUBLISHED" }
                    ].map((s) => {
                      return (
                        <div key={s.step} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                            s.done
                              ? "bg-teal-500 border-teal-500 text-zinc-950"
                              : s.isCurrent
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-teal-500"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                          }`}>
                            {s.done ? "✓" : s.step}
                          </div>
                          <span className={`text-[10px] font-bold mt-2 ${s.isCurrent ? "text-teal-500" : "text-zinc-400 dark:text-zinc-500"}`}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Résumé textuel */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2 text-xs">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
                    Processus de validation :{" "}
                    <span className="text-teal-500">
                      {course.status === "PUBLISHED" ? "Approuvé & En ligne" : course.status === "REVIEW" ? "En attente d'examen" : course.status === "ARCHIVED" ? "Archivé" : "En cours d'édition"}
                    </span>
                  </h4>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {course.status === "DRAFT" && "Votre formation est en mode Brouillon. Complétez son programme et ses tarifs, puis soumettez-la pour qu'un administrateur valide son contenu et la mette en ligne."}
                    {course.status === "REVIEW" && "Votre formation a été soumise pour examen. L'équipe administrative étudie votre programme. Le cours sera mis en ligne dès validation."}
                    {course.status === "PUBLISHED" && "Félicitations ! Votre cours a été validé par l'administration et est officiellement ouvert aux inscriptions."}
                    {course.status === "ARCHIVED" && "Ce cours a été archivé et n'apparaît plus dans le catalogue public."}
                  </p>
                </div>

                {/* Bouton d'action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  {course.status === "DRAFT" && (
                    <button onClick={handleRequestReview} disabled={saving} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50">
                      Soumettre pour validation
                    </button>
                  )}
                  {course.status === "REVIEW" && (
                    <button onClick={handleCancelReview} disabled={saving} className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-850 hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-250 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50">
                      Annuler la demande de validation
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-red-50/30 dark:bg-red-950/10 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/30 p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Zone de danger</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                La suppression de ce cours est définitive. Cela effacera l'arborescence, les quiz et toutes les inscriptions.
              </p>
              <button onClick={handleDeleteCourse} disabled={saving} className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50">
                Supprimer définitivement ce cours
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Create Quiz ── */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Nouveau Quiz</h2>
                <p className="text-xs text-zinc-400 mt-1">Créez une évaluation finale pour ce cours.</p>
              </div>
              <button onClick={() => setShowCreateQuizModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre du Quiz *</label>
                <input type="text" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} placeholder="Ex: Examen final - DeFi" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Seuil de réussite (%)</label>
                <input type="number" value={newQuizPassPercent} onChange={(e) => setNewQuizPassPercent(e.target.value)} min="1" max="100" placeholder="70" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button onClick={() => setShowCreateQuizModal(false)} className="px-3.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">Annuler</button>
              <button onClick={handleCreateQuiz} disabled={!newQuizTitle.trim() || saving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer">
                Créer le quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Question ── */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddQuestionModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Nouvelle Question</h2>
                <p className="text-xs text-zinc-400 mt-1">Configurez l'énoncé et les options de réponses.</p>
              </div>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Énoncé de la question *</label>
                <textarea rows={2} value={newQText} onChange={(e) => setNewQText(e.target.value)} placeholder="Ex: Quelle clé permet de signer les transactions ?" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Options de réponses (min. 2)</label>
                <div className="space-y-2">
                  {newQChoices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 w-4">#{idx + 1}</span>
                      <input type="text" value={choice} onChange={(e) => { const updated = [...newQChoices]; updated[idx] = e.target.value; setNewQChoices(updated); }} placeholder={`Option ${idx + 1}`} className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Option correcte</label>
                <select value={newQCorrect} onChange={(e) => setNewQCorrect(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white">
                  <option value="0">Option #1 (Correcte)</option>
                  <option value="1">Option #2 (Correcte)</option>
                  <option value="2">Option #3 (Correcte)</option>
                  <option value="3">Option #4 (Correcte)</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button onClick={() => setShowAddQuestionModal(false)} className="px-3.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">Annuler</button>
              <button onClick={handleAddQuestion} disabled={!newQText.trim() || saving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer">Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Enrôler étudiant ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Inscrire par Email ou ID</h2>
              <button onClick={() => { setShowInviteModal(false); setInviteEmail(""); setInviteFound(null); setInviteError(""); }} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {inviteSuccess ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-teal-500 animate-bounce" />
                <p className="font-bold text-zinc-900 dark:text-white">Étudiant inscrit !</p>
                <p className="text-xs text-zinc-500">L'étudiant a accès au cours avec le statut ACTIF.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email ou ID de l'étudiant *</label>
                  <div className="flex gap-2">
                    <input type="text" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearchStudent(); }} placeholder="etudiant@email.com ou ID utilisateur..." className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 outline-none text-zinc-900 dark:text-white" />
                    <button type="button" onClick={handleSearchStudent} disabled={inviteSearching} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                      {inviteSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chercher"}
                    </button>
                  </div>
                </div>
                {inviteError && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}
                {inviteFound && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in fade-in">
                    <p className="text-[10px] uppercase font-extrabold text-teal-600 tracking-wider">Compte Trouvé</p>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{inviteFound.full_name}</p>
                      <p className="text-[11px] text-zinc-500">{inviteFound.email}</p>
                    </div>
                    <button onClick={handleInviteStudent} disabled={saving} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50">
                      Inscrire cet étudiant (Statut Actif)
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
