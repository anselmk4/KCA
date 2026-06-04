"use client";

import { useEffect, useState } from "react";
import { getDB, saveDB, Database, CourseSection, Lesson } from "@/lib/db";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Trash2,
  Edit3,
  Save,
  X,
  FileText,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CourseContentBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [db, setDb] = useState<Database | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonToSection, setAddingLessonToSection] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("15");

  useEffect(() => {
    const data = getDB();
    setDb(data);
    // Auto-expand all sections
    const sectionIds = data.sections.filter((s) => s.courseId === courseId).map((s) => s.id);
    setExpandedSections(new Set(sectionIds));
  }, [courseId]);

  if (!db) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Cours introuvable</h2>
        <Link href="/instructor/courses" className="text-teal-600 hover:underline text-sm">
          Retour aux cours
        </Link>
      </div>
    );
  }

  const sections = db.sections
    .filter((s) => s.courseId === courseId)
    .sort((a, b) => a.order - b.order);

  const getLessons = (sectionId: string) =>
    db.lessons.filter((l) => l.sectionId === sectionId).sort((a, b) => a.order - b.order);

  const totalLessons = sections.reduce((sum, s) => sum + getLessons(s.id).length, 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + getLessons(s.id).reduce((ls, l) => ls + l.durationMin, 0),
    0
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection: CourseSection = {
      id: `s_${Date.now()}`,
      courseId,
      title: newSectionTitle.trim(),
      order: sections.length + 1,
    };
    db.sections.push(newSection);
    saveDB(db);
    setDb({ ...db });
    setExpandedSections((prev) => new Set(prev).add(newSection.id));
    setNewSectionTitle("");
    setShowNewSection(false);
  };

  const handleDeleteSection = (sectionId: string) => {
    db.sections = db.sections.filter((s) => s.id !== sectionId);
    db.lessons = db.lessons.filter((l) => l.sectionId !== sectionId);
    saveDB(db);
    setDb({ ...db });
  };

  const handleRenameSectionSave = () => {
    if (!editingSectionId || !editingSectionTitle.trim()) return;
    const section = db.sections.find((s) => s.id === editingSectionId);
    if (section) {
      section.title = editingSectionTitle.trim();
      saveDB(db);
      setDb({ ...db });
    }
    setEditingSectionId(null);
  };

  const handleAddLesson = (sectionId: string) => {
    if (!newLessonTitle.trim()) return;
    const existingLessons = getLessons(sectionId);
    const newLesson: Lesson = {
      id: `l_${Date.now()}`,
      sectionId,
      title: newLessonTitle.trim(),
      description: "",
      content: "",
      videoUrl: "",
      durationMin: Math.max(parseInt(newLessonDuration) || 15, 5),
      order: existingLessons.length + 1,
    };
    db.lessons.push(newLesson);
    saveDB(db);
    setDb({ ...db });
    setNewLessonTitle("");
    setNewLessonDuration("15");
    setAddingLessonToSection(null);
  };

  const handleDeleteLesson = (lessonId: string) => {
    db.lessons = db.lessons.filter((l) => l.id !== lessonId);
    saveDB(db);
    setDb({ ...db });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Back + Header */}
      <div>
        <Link
          href="/instructor/courses"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux cours
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{course.title}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {sections.length} sections · {totalLessons} leçons · {totalDuration} min de contenu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                course.status === "PUBLISHED"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}
            >
              {course.status}
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const lessons = getLessons(section.id);
          const isExpanded = expandedSections.has(section.id);
          const sectionDuration = lessons.reduce((s, l) => s + l.durationMin, 0);

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              {/* Section Header */}
              <div
                className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {editingSectionId === section.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingSectionTitle}
                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameSectionSave()}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        autoFocus
                      />
                      <button onClick={handleRenameSectionSave} className="text-teal-600 hover:text-teal-700">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingSectionId(null)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                      Section {idx + 1}: {section.title}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 flex-shrink-0">
                  {lessons.length} leçon{lessons.length > 1 ? "s" : ""} · {sectionDuration} min
                </span>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setEditingSectionTitle(section.title);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-teal-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Renommer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-6 py-3 pl-16 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0"
                    >
                      <div className="w-8 h-8 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        {lesson.videoUrl ? (
                          <Video className="w-4 h-4 text-teal-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-teal-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-zinc-900 dark:text-white">{lesson.title}</span>
                      </div>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" /> {lesson.durationMin} min
                      </span>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Lesson Inline */}
                  {addingLessonToSection === section.id ? (
                    <div className="px-6 py-3 pl-16 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/30">
                      <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddLesson(section.id)}
                        placeholder="Titre de la leçon"
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={newLessonDuration}
                        onChange={(e) => setNewLessonDuration(e.target.value)}
                        placeholder="min"
                        min="1"
                        className="w-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        onClick={() => handleAddLesson(section.id)}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setAddingLessonToSection(null)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLessonToSection(section.id)}
                      className="w-full px-6 py-3 pl-16 text-left text-xs text-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter une leçon
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section */}
        {showNewSection ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 p-6 flex items-center gap-3">
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              placeholder="Titre de la section"
              className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              autoFocus
            />
            <button
              onClick={handleAddSection}
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Ajouter
            </button>
            <button onClick={() => setShowNewSection(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewSection(true)}
            className="w-full bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-sm text-zinc-500 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter une section
          </button>
        )}
      </div>
    </div>
  );
}
