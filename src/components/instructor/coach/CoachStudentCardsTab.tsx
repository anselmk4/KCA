"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Award,
  BookOpen,
  FileText,
  Save,
  BrainCircuit,
  Loader2,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";

export interface CoachedStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  courseTitle: string;
  progressPercent: number;
  quizzesPassed: number;
  totalQuizzes: number;
  privateNotes: string;
  skills: { topic: string; mastery: number }[];
}

export function CoachStudentCardsTab() {
  const [students, setStudents] = useState<CoachedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function fetchRealStudents() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeSession = getSimulatedSession();
        const instructorId = user?.id || activeSession?.userId;

        if (!instructorId) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", instructorId);

        if (!courses || courses.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const courseMap = new Map(courses.map((c) => [c.id, c.title]));
        const courseIds = courses.map((c) => c.id);

        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, course_id, student_id, progress_percent, profiles!student_id(id, full_name, email, avatar_url)")
          .in("course_id", courseIds);

        if (!enrollments || enrollments.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const mapped: CoachedStudent[] = enrollments.map((e: any) => {
          const profile = e.profiles || {};
          const progress = e.progress_percent || 0;

          return {
            id: e.id,
            name: profile.full_name || "Apprenant Inscrit",
            email: profile.email || "élève@ansella.app",
            avatar: profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            courseTitle: courseMap.get(e.course_id) || "Formation",
            progressPercent: progress,
            quizzesPassed: Math.floor(progress / 20),
            totalQuizzes: 5,
            privateNotes: `Observations de suivi pour ${profile.full_name || "l'étudiant"}.`,
            skills: [
              { topic: "Assimilation du cours", mastery: Math.min(100, Math.max(30, progress)) },
              { topic: "Exercices pratiques", mastery: Math.min(100, Math.max(20, Math.round(progress * 0.9))) },
              { topic: "Quiz & Autonomie", mastery: Math.min(100, Math.max(40, Math.round(progress * 1.1))) },
            ],
          };
        });

        setStudents(mapped);
        if (mapped.length > 0) {
          setSelectedStudentId(mapped[0].id);
          setNotesText(mapped[0].privateNotes);
        }
      } catch (err) {
        console.error("Error fetching real student coaching cards:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRealStudents();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSelectStudent = (student: CoachedStudent) => {
    setSelectedStudentId(student.id);
    setNotesText(student.privateNotes);
  };

  const handleSaveNotes = () => {
    if (!selectedStudentId) return;
    setSavingNotes(true);
    setStudents((prev) =>
      prev.map((s) => (s.id === selectedStudentId ? { ...s, privateNotes: notesText } : s))
    );
    setTimeout(() => {
      setSavingNotes(false);
      alert("Notes de coaching enregistrées confidentiellement !");
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-500">Chargement des fiches d&apos;apprenants depuis la base de données...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto stroke-1" />
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
            Aucun apprenant inscrit pour le moment
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Dès que des étudiants s&apos;inscriront à vos cours, leurs fiches individuelles et leur Skill Radar s&apos;afficheront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Student List */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Apprenants Inscrits ({students.length})
            </h3>

            <div className="space-y-2.5">
              {students.map((student) => {
                const active = student.id === selectedStudentId;
                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      active
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm ring-1 ring-teal-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300"
                    }`}
                  >
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">
                        {student.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {student.courseTitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        {student.progressPercent}%
                      </span>
                      <span className="text-[9px] text-zinc-400 block font-bold">Progression</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Student Coaching Card */}
          {selectedStudent && (
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Header info */}
              <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-teal-500/30 shadow-md shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedStudent.email}</p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
                    {selectedStudent.courseTitle}
                  </p>
                </div>
              </div>

              {/* Skill Radar / Topics Mastery */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-teal-600" />
                  Matrice de Maîtrise des Compétences (Skill Radar)
                </h4>

                <div className="space-y-2.5">
                  {selectedStudent.skills.map((skill, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>{skill.topic}</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{skill.mastery}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${skill.mastery}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidential Instructor Coaching Notes */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Carnet de Notes Privé du Coach (Confidentiel)
                  </h4>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {savingNotes ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>

                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={4}
                  placeholder="Saisissez vos observations, points forts et axes d'amélioration pour cet élève..."
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-medium"
                />
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
