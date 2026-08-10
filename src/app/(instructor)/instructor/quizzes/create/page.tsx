"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDB, saveDB, Database, Quiz } from "@/lib/db";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Zod schema for validation
const quizSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  passPercentage: z
    .number()
    .min(0, "Le seuil ne peut être négatif")
    .max(100, "Le seuil ne peut dépasser 100"),
});

type QuizForm = z.infer<typeof quizSchema>;

export default function QuizCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: { title: "", passPercentage: 70 },
  });

  const onSubmit = async (data: QuizForm) => {
    try {
      const db = getDB();
      // Associate quiz with the first instructor's course for demo purposes
      const instructorId = "u3"; // Hard‑coded instructor (current user)
      const course = db.courses.find((c) => c.instructorId === instructorId);
      if (!course) {
        setError("Aucun cours trouvé pour l’instructeur.");
        return;
      }
      const newQuiz: Quiz = {
        id: `q_${Date.now()}`,
        courseId: course.id,
        title: data.title.trim(),
        passPercentage: data.passPercentage,
      };
      db.quizzes.push(newQuiz);
      saveDB(db);
      router.push("/instructor/quizzes");
    } catch (e) {
      setError("Échec de la création du quiz.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/instructor/quizzes" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Créer un nouveau quiz
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
      >
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Titre du quiz
          </label>
          <input
            type="text"
            {...register("title")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
              errors.title ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Seuil de réussite (%)
          </label>
          <input
            type="number"
            {...register("passPercentage", { valueAsNumber: true })}
            min={0}
            max={100}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
              errors.passPercentage ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
            }`}
          />
          {errors.passPercentage && (
            <p className="mt-1 text-xs text-red-600">{errors.passPercentage.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Créer le quiz
        </button>
      </form>
    </div>
  );
}
