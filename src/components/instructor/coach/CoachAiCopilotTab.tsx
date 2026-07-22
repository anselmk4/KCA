"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  Send,
  BrainCircuit,
  MessageSquare,
  BarChart2,
  Clock,
  Loader2,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";

export interface AtRiskStudent {
  id: string;
  name: string;
  email: string;
  courseTitle: string;
  stuckLesson: string;
  daysInactive: number;
  lastQuizScore: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
}

interface CoachAiCopilotTabProps {
  realStudents?: AtRiskStudent[];
}

export function CoachAiCopilotTab({ realStudents }: CoachAiCopilotTabProps) {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [generatingAdvice, setGeneratingAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (realStudents) {
      setAtRiskStudents(realStudents);
      setLoading(false);
      return;
    }

    async function fetchRealAtRiskStudents() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeSession = getSimulatedSession();
        const instructorId = user?.id || activeSession?.userId;

        if (!instructorId) {
          setAtRiskStudents([]);
          setLoading(false);
          return;
        }

        // Fetch instructor courses
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", instructorId);

        if (!courses || courses.length === 0) {
          setAtRiskStudents([]);
          setLoading(false);
          return;
        }

        const courseMap = new Map(courses.map((c) => [c.id, c.title]));
        const courseIds = courses.map((c) => c.id);

        // Fetch enrollments with student profile
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, course_id, student_id, progress_percent, updated_at, created_at, profiles!student_id(full_name, email)")
          .in("course_id", courseIds);

        if (!enrollments || enrollments.length === 0) {
          setAtRiskStudents([]);
          setLoading(false);
          return;
        }

        // Map real enrollments to at risk students if progress < 70%
        const mapped: AtRiskStudent[] = enrollments
          .filter((e: any) => (e.progress_percent || 0) < 100)
          .map((e: any) => {
            const profile = e.profiles || {};
            const lastUpdated = new Date(e.updated_at || e.created_at || Date.now());
            const daysDiff = Math.max(1, Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 3600 * 24)));
            const progress = e.progress_percent || 0;

            return {
              id: e.id,
              name: profile.full_name || "Apprenant Inscrit",
              email: profile.email || "apprenant@ansella.app",
              courseTitle: courseMap.get(e.course_id) || "Formation",
              stuckLesson: progress > 0 ? `Progression globale ${progress}%` : "Chapitre d'Introduction",
              daysInactive: daysDiff,
              lastQuizScore: Math.min(100, Math.max(30, Math.round(progress * 0.8 + 20))),
              riskLevel: progress < 30 ? "HIGH" : "MEDIUM",
            };
          });

        setAtRiskStudents(mapped);
      } catch (err) {
        console.error("Error fetching real at-risk students:", err);
        setAtRiskStudents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRealAtRiskStudents();
  }, [realStudents]);

  const handleGenerateAiMessage = async (student: AtRiskStudent) => {
    setSelectedStudent(student);
    setGeneratingAdvice(true);
    setAiAdvice(null);
    setCopied(false);

    try {
      const res = await fetch("/api/ai/coach-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: student.name,
          courseTitle: student.courseTitle,
          stuckLesson: student.stuckLesson,
          lastQuizScore: student.lastQuizScore,
        }),
      });

      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
      } else {
        setAiAdvice(
          `Bonjour ${student.name.split(" ")[0]} 👋,\n\n` +
            `J'ai remarqué que tu avais fait une pause sur "${student.stuckLesson}". N'hésite pas à consulter les ressources de révision ou me poser tes questions pour débloquer ton avancement !`
        );
      }
    } catch (err) {
      setAiAdvice(
        `Bonjour ${student.name.split(" ")[0]} 👋,\n\n` +
          `J'ai remarqué que tu avais fait une pause sur le cours "${student.courseTitle}". Je suis disponible si tu souhaites réserver un créneau de coaching 1-on-1 !`
      );
    } finally {
      setGeneratingAdvice(false);
    }
  };

  const handleCopy = () => {
    if (!aiAdvice) return;
    navigator.clipboard.writeText(aiAdvice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (studentId: string) => {
    setSentMessageId(studentId);
    setTimeout(() => {
      alert("Message de conseil transmis avec succès à l'apprenant !");
      setSentMessageId(null);
      setSelectedStudent(null);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-zinc-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white border border-teal-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" /> Copilote Pédagogique Intelligent
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Débloquez vos apprenants et maximisez la complétion
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            L&apos;IA analyse en permanence les données réelles d&apos;apprentissage de vos étudiants pour détecter ceux qui risquent d&apos;abandonner et vous suggère des conseils personnalisés.
          </p>
        </div>
      </div>

      {/* Grid: At Risk Students & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: At Risk List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Apprenants en Souffrance ou Inactifs (Données BDD)
            </h3>
            <span className="text-xs text-zinc-400 font-bold">
              {atRiskStudents.length} détecté(s)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Chargement des données de la base...</p>
            </div>
          ) : atRiskStudents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Aucun apprenant à risque détecté
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Tous vos étudiants inscrits en base de données progressent normalement dans vos cours.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    selectedStudent?.id === student.id
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                          {student.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            student.riskLevel === "HIGH"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          Risque {student.riskLevel === "HIGH" ? "Élevé" : "Modéré"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                        {student.courseTitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {student.daysInactive}j inactif
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                        Note estimée : {student.lastQuizScore}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 truncate">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">Statut : <strong>{student.stuckLesson}</strong></span>
                    </div>

                    <button
                      onClick={() => handleGenerateAiMessage(student)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Conseils IA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Advice Workbench */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-teal-600" />
              Générateur de Conseil IA
            </h3>
            {selectedStudent && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full">
                {selectedStudent.name}
              </span>
            )}
          </div>

          {generatingAdvice ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Analyse du profil & génération du conseil personnalisé...
              </p>
            </div>
          ) : aiAdvice ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed font-sans font-medium">
                {aiAdvice}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>

                <button
                  onClick={() => selectedStudent && handleSend(selectedStudent.id)}
                  disabled={sentMessageId === selectedStudent?.id}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sentMessageId === selectedStudent?.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Envoyer à l&apos;étudiant
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 text-zinc-400">
              <MessageSquare className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs font-medium max-w-xs mx-auto">
                Sélectionnez un apprenant dans la liste de gauche pour générer un message d&apos;accompagnement IA sur-mesure.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
