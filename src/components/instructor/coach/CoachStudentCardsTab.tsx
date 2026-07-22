"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Save,
  Star,
  BrainCircuit,
  MessageSquare,
} from "lucide-react";

interface CoachedStudent {
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

const MOCK_STUDENTS: CoachedStudent[] = [
  {
    id: "s1",
    name: "Thomas Dubois",
    email: "thomas.dubois@email.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    courseTitle: "Masterclass IA & Web3 Automation",
    progressPercent: 65,
    quizzesPassed: 3,
    totalQuizzes: 5,
    privateNotes: "Thomas avance bien sur la logique IA mais a besoin de renforcer la gestion des erreurs d'API dans les Webhooks.",
    skills: [
      { topic: "Logique IA & Prompts", mastery: 85 },
      { topic: "Webhooks & API", mastery: 40 },
      { topic: "Base de Données Vectorielles", mastery: 70 },
    ],
  },
  {
    id: "s2",
    name: "Amélie Morel",
    email: "amelie.m@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    courseTitle: "Bourse & Trading Crypto Algorithmique",
    progressPercent: 88,
    quizzesPassed: 4,
    totalQuizzes: 4,
    privateNotes: "Excellente maîtrise du Backtesting. Prête pour le module avancé de trading haute fréquence.",
    skills: [
      { topic: "Backtesting & Ratios", mastery: 92 },
      { topic: "Algorithmes Python", mastery: 85 },
      { topic: "Gestion du Risque", mastery: 90 },
    ],
  },
];

export function CoachStudentCardsTab() {
  const [students, setStudents] = useState<CoachedStudent[]>(MOCK_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("s1");
  const [notesText, setNotesText] = useState(MOCK_STUDENTS[0].privateNotes);
  const [savingNotes, setSavingNotes] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleSelectStudent = (student: CoachedStudent) => {
    setSelectedStudentId(student.id);
    setNotesText(student.privateNotes);
  };

  const handleSaveNotes = () => {
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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Student List */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            Liste des Apprenants Accompagnés
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
              Matrice de Maîtrise des Compétences
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

      </div>

    </div>
  );
}
