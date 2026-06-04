"use client";

import { useEffect, useState } from "react";
import { getDB, Database } from "@/lib/db";
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
} from "lucide-react";
import Link from "next/link";

const INSTRUCTOR_ID = "u3";

export default function InstructorQuizzesPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDb(getDB());
  }, []);

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
          <div className="mt-2">
            <Link href="/instructor/quizzes/create" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
              <Plus className="w-4 h-4"/> Ajouter un quiz
            </Link>
          </div>
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
    </div>
  );
}
