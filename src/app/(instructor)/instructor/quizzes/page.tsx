"use client";

import { useEffect, useState } from "react";
import { getDB, saveDB, Database } from "@/lib/db";
import {
  ClipboardCheck,
  Plus,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const INSTRUCTOR_ID = "u3";

export default function InstructorQuizzesPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [search, setSearch] = useState("");

  // AI Quiz Generator state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("MOYEN");
  const [generatingQuiz, setGeneratingQuiz] = useState<boolean>(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);
  const [savingQuiz, setSavingQuiz] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  useEffect(() => {
    setDb(getDB());
  }, []);

  async function handleGenerateAiQuiz() {
    if (!topic.trim()) {
      alert("Veuillez saisir un sujet ou thème pour le quiz.");
      return;
    }
    setGeneratingQuiz(true);
    setGeneratedQuiz(null);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_UPGRADE_REQUIRED" || res.status === 403) {
          setShowUpgradeModal(true);
          setShowAiModal(false);
          return;
        }
        alert(data.error || "Erreur lors de la génération du quiz.");
        return;
      }
      setGeneratedQuiz(data.quiz);
    } catch (err: any) {
      alert(err.message || "Erreur de connexion.");
    } finally {
      setGeneratingQuiz(false);
    }
  }

  function handleSaveGeneratedQuiz() {
    if (!generatedQuiz || !db) return;
    setSavingQuiz(true);
    try {
      const myCourse = db.courses.find((c) => c.instructorId === INSTRUCTOR_ID) || db.courses[0];
      const newQuizId = `q_${Date.now()}`;
      const newQuiz = {
        id: newQuizId,
        courseId: myCourse ? myCourse.id : "c1",
        title: generatedQuiz.quizTitle,
        passPercentage: generatedQuiz.passPercentage || 70,
      };
      db.quizzes.push(newQuiz);

      // Insert questions
      if (Array.isArray(generatedQuiz.questions)) {
        generatedQuiz.questions.forEach((q: any, idx: number) => {
          db.questions.push({
            id: `question_${Date.now()}_${idx}`,
            quizId: newQuizId,
            questionText: q.questionText,
            explanation: q.explanation,
            options: q.options,
          } as any);
        });
      }

      saveDB(db);
      setDb({ ...db });
      alert("✨ Quiz IA créé et ajouté avec succès !");
      setShowAiModal(false);
      setGeneratedQuiz(null);
      setTopic("");
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde du quiz.");
    } finally {
      setSavingQuiz(false);
    }
  }

  if (!db) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const myCourseIds = db.courses.filter((c) => c.instructorId === INSTRUCTOR_ID).map((c) => c.id);
  const myQuizzes = db.quizzes.filter((q) => myCourseIds.includes(q.courseId));

  const filtered = myQuizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Quiz & Examens</h1>
          <p className="text-xs text-zinc-400 mt-1">Créez et gérez des évaluations interactives pour vos apprenants.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> ✨ Générer par l&apos;IA
          </button>
          <Link href="/instructor/quizzes/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors">
            <Plus className="w-4 h-4"/> Ajouter manuellement
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Rechercher un quiz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total quiz</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{myQuizzes.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total questions</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {db.questions.filter((q) => myQuizzes.map((mq) => mq.id).includes(q.quizId)).length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tentatives</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {db.quizAttempts.filter((a) => myQuizzes.map((mq) => mq.id).includes(a.quizId)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Aucun quiz trouvé
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {search
              ? "Aucun résultat pour votre recherche."
              : "Vos quiz apparaîtront ici une fois créés dans vos cours."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((quiz) => {
            const course = db.courses.find((c) => c.id === quiz.courseId);
            const questions = db.questions.filter((q) => q.quizId === quiz.id);
            const attempts = db.quizAttempts.filter((a) => a.quizId === quiz.id);
            const passedCount = attempts.filter((a) => a.passed).length;
            const avgScore =
              attempts.length > 0
                ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
                : 0;

            return (
              <div
                key={quiz.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Cours : {course?.title || "Inconnu"} · Seuil de réussite : {quiz.passPercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{questions.length}</p>
                      <p className="text-xs text-zinc-500">Questions</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{attempts.length}</p>
                      <p className="text-xs text-zinc-500">Tentatives</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-emerald-600">{passedCount}</p>
                      <p className="text-xs text-zinc-500">Réussites</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{avgScore}%</p>
                      <p className="text-xs text-zinc-500">Score moyen</p>
                    </div>
                  </div>

                  {/* Recent Attempts */}
                  {attempts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                        Dernières tentatives
                      </h4>
                      <div className="space-y-2">
                        {attempts.slice(-3).reverse().map((attempt) => {
                          const student = db.users.find((u) => u.id === attempt.studentId);
                          return (
                            <div
                              key={attempt.id}
                              className="flex items-center gap-3 text-sm"
                            >
                              {attempt.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              )}
                              <span className="text-zinc-900 dark:text-white font-medium flex-1 truncate">
                                {student?.name || "Étudiant"}
                              </span>
                              <span className="text-zinc-500 text-xs">
                                {attempt.score}% · {new Date(attempt.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Générateur IA de Quizz & Examens</h3>
                  <p className="text-xs text-zinc-400">Générez un quiz complet avec questions, choix et explications en 1 clic.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAiModal(false); setGeneratedQuiz(null); }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {!generatedQuiz ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Sujet / Thème de la formation
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fundamentals of Blockchain, Smart Contracts, Digital Marketing..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Nombre de questions
                    </label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value={5}>5 Questions (Express)</option>
                      <option value={10}>10 Questions (Standard)</option>
                      <option value={15}>15 Questions (Examen Approfondi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Niveau de difficulté
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="FACILE">Facile (Débutant)</option>
                      <option value="MOYEN">Moyen (Intermédiaire)</option>
                      <option value="EXPERT">Expert (Avancé)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleGenerateAiQuiz}
                    disabled={generatingQuiz}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : "✨ Lancer la Génération IA"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200">{generatedQuiz.quizTitle}</h4>
                    <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">{generatedQuiz.questions?.length || 0} questions générées par l&apos;IA</p>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 bg-teal-600 text-white rounded-full">
                    Seuil {generatedQuiz.passPercentage}%
                  </span>
                </div>

                {/* Question preview list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {generatedQuiz.questions?.map((q: any, i: number) => (
                    <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-zinc-900 dark:text-white">Q{i + 1}: {q.questionText}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 border-l-2 border-blue-500">
                        {q.options?.map((opt: any, optIdx: number) => (
                          <div key={optIdx} className={`p-1.5 rounded text-[11px] ${opt.isCorrect ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
                            {opt.isCorrect ? "✓ " : "• "}{opt.text}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-[10px] text-zinc-500 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setGeneratedQuiz(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Régénérer
                  </button>
                  <button
                    onClick={handleSaveGeneratedQuiz}
                    disabled={savingQuiz}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : "💾 Ajouter aux Quiz"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Upgrade Gating Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✨
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Générateur IA de Quizz & Examens
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                La génération automatique de questions, QCM et examens par l&apos;IA est réservée aux abonnés du <strong>Plan BASE (19$/mois)</strong> ou supérieur.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl text-left space-y-2">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Ce que comprend le Plan BASE :</p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li className="flex items-center gap-1.5">✓ Génération instantanée de QCM et examens</li>
                <li className="flex items-center gap-1.5">✓ Niveaux de difficulté ajustables (Facile, Moyen, Expert)</li>
                <li className="flex items-center gap-1.5">✓ Explications pédagogiques automatiques pour les étudiants</li>
              </ul>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Plus tard
              </button>
              <Link
                href="/instructor/billing"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform text-center"
              >
                Passer au Plan BASE (19$)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
