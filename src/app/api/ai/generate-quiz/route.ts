import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { callGeminiApi, generateSmartQuiz } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { topic, courseId, sectionId, numQuestions = 5, difficulty = "MOYEN", saveToDb = false } = body;

    if (!topic && !courseId) {
      return NextResponse.json({ error: "Un sujet (topic) ou un ID de cours (courseId) est requis." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = serviceKey ? supabaseAdmin : supabase;

    // 1. Check user roles / permissions
    const { data: userRoles } = await (dbClient as any)
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];

    // Check course ownership if courseId provided
    let isCourseOwner = false;
    let targetTopic = topic || "Évaluation de connaissances";
    let targetCourseId = courseId || null;

    if (courseId) {
      const { data: course } = await (dbClient as any)
        .from("courses")
        .select("id, title, description, instructor_id")
        .eq("id", courseId)
        .maybeSingle();

      if (course) {
        if (course.instructor_id === user.id) {
          isCourseOwner = true;
        }
        if (!topic) {
          targetTopic = `${course.title} - ${course.description || ""}`.trim();
        }
      }
    }

    const isAuthorized =
      isCourseOwner ||
      roles.some((r: string) =>
        ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(r)
      );

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle instructeur requis." }, { status: 403 });
    }

    const count = Math.min(Math.max(1, parseInt(numQuestions as any) || 5), 15);

    // Initial smart fallback quiz
    let generatedQuiz = generateSmartQuiz(targetTopic, count, difficulty);

    // Call Gemini API
    try {
      const systemPrompt = `Tu es un concepteur pédagogique expert spécialisé dans la création d'évaluations et de quizz en français pour Ansella.
Ta mission est de générer une série de questions à choix multiples (QCM) pertinentes, claires et éducatives sur le sujet demandé.
Réponds STRICTEMENT sous forme d'un objet JSON en français avec la structure demandée.`;

      const userPrompt = `Génère un quiz d'évaluation complet :
- Sujet : "${targetTopic}"
- Niveau de difficulté : ${difficulty}
- Nombre de questions : ${count}

Chaque question doit comporter :
1. questionText: Le libellé exact de la question.
2. explanation: Une courte explication pédagogique globale.
3. options: Un tableau de 4 choix avec pour chacun "text" (libellé du choix), "isCorrect" (boolean, exactement 1 VRAI par question), et "explanation" (explication du choix).

Structure JSON globale :
{
  "quizTitle": "Titre captivant du Quiz",
  "passPercentage": 70,
  "questions": [ ... ]
}`;

      const responseSchema = {
        type: "OBJECT",
        properties: {
          quizTitle: { type: "STRING", description: "Titre du Quiz" },
          passPercentage: { type: "INTEGER", description: "Seuil de réussite recommandé (%)" },
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                questionText: { type: "STRING", description: "Libellé de la question" },
                explanation: { type: "STRING", description: "Explication pédagogique globale" },
                options: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING", description: "Libellé de l'option" },
                      isCorrect: { type: "BOOLEAN", description: "Vrai si c'est la bonne réponse" },
                      explanation: { type: "STRING", description: "Pourquoi ce choix est vrai/faux" },
                    },
                    required: ["text", "isCorrect", "explanation"],
                  },
                },
              },
              required: ["questionText", "explanation", "options"],
            },
          },
        },
        required: ["quizTitle", "passPercentage", "questions"],
      };

      const rawAiText = await callGeminiApi({
        systemInstruction: systemPrompt,
        userPrompt,
        responseSchema,
        temperature: 0.3,
      });

      if (rawAiText) {
        let cleanText = rawAiText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "").trim();
        }
        const parsed = JSON.parse(cleanText);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          generatedQuiz = parsed;
        }
      }
    } catch (aiErr) {
      console.warn("[/api/ai/generate-quiz] Gemini AI fallback active:", aiErr);
    }

    // Save to DB if saveToDb is true and targetCourseId is provided
    let createdQuizId = null;
    if (saveToDb && targetCourseId) {
      const { data: newQuiz, error: quizInsertErr } = await (dbClient as any)
        .from("quizzes")
        .insert({
          course_id: targetCourseId,
          section_id: sectionId || null,
          title: generatedQuiz.quizTitle || `Quiz - ${targetTopic.slice(0, 30)}`,
          pass_percentage: generatedQuiz.passPercentage || 70,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (quizInsertErr) {
        console.error("[/api/ai/generate-quiz] quizInsertErr:", quizInsertErr);
        return NextResponse.json(
          { error: "Erreur lors de la création du Quiz dans la base de données: " + quizInsertErr.message },
          { status: 400 }
        );
      }

      if (newQuiz && newQuiz.id) {
        createdQuizId = newQuiz.id;

        // Insert questions using exact DB schema columns
        for (const q of generatedQuiz.questions) {
          const choices: string[] = Array.isArray(q.options)
            ? q.options.map((opt: any) => (typeof opt === "string" ? opt : (opt.text || opt.label || "")))
            : ["Option A", "Option B", "Option C", "Option D"];

          let correctIndex = 0;
          if (Array.isArray(q.options)) {
            const idx = q.options.findIndex((opt: any) => typeof opt === "object" && Boolean(opt.isCorrect));
            if (idx >= 0) correctIndex = idx;
          }

          const questionText = q.questionText || (q as any).text || "Question d'évaluation";

          const { error: qErr } = await (dbClient as any).from("questions").insert({
            quiz_id: newQuiz.id,
            text: questionText,
            choices,
            correct_index: correctIndex,
          });

          if (qErr) {
            console.error("[/api/ai/generate-quiz] question insert error:", qErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      quiz: generatedQuiz,
      savedQuizId: createdQuizId,
    });
  } catch (err: any) {
    console.error("[/api/ai/generate-quiz] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération du quiz par l'IA." },
      { status: 500 }
    );
  }
}
