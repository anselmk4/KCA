import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    const isAuthorized = roles.some((r: string) => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle instructeur requis." }, { status: 403 });
    }

    // Determine target course topic
    let targetTopic = topic || "Évaluation de connaissances";
    let targetCourseId = courseId || null;

    if (courseId && !topic) {
      const { data: course } = await (dbClient as any)
        .from("courses")
        .select("title, description")
        .eq("id", courseId)
        .maybeSingle();
      if (course) {
        targetTopic = `${course.title} - ${course.description || ''}`;
      }
    }

    const count = Math.min(Math.max(1, parseInt(numQuestions as any) || 5), 15);

    // Fallback Quiz structure
    let generatedQuiz = {
      quizTitle: `Quiz d'Évaluation : ${targetTopic.slice(0, 40)}`,
      passPercentage: 70,
      questions: [
        {
          questionText: `Quel est l'objectif principal abordé dans "${targetTopic.slice(0, 30)}..." ?`,
          explanation: "Cette notion est fondamentale pour maîtriser l'ensemble du module.",
          options: [
            { text: "Comprendre les principes théoriques et pratiques de base", isCorrect: true, explanation: "Exact ! C'est le fondement de la leçon." },
            { text: "Ignorer les étapes de validation initiale", isCorrect: false, explanation: "Incorrect. La validation est indispensable." },
            { text: "Remplacer l'apprentissage par de la simple théorie sans application", isCorrect: false, explanation: "Incorrect." },
            { text: "Aucune de ces réponses", isCorrect: false, explanation: "La première option est correcte." }
          ]
        },
        {
          questionText: "Quelle est la meilleure pratique recommandée pour réussir ce chapitre ?",
          explanation: "La régularité et la mise en pratique sont clés.",
          options: [
            { text: "Appliquer chaque concept avec des exercices pratiques", isCorrect: true, explanation: "Excellente réponse !" },
            { text: "Sauter les leçons fondamentales", isCorrect: false, explanation: "Non recommandé." },
            { text: "Ne jamais réviser les notions précédentes", isCorrect: false, explanation: "Incorrect." },
            { text: "Attendre la fin de la formation pour pratiquer", isCorrect: false, explanation: "Il vaut mieux pratiquer au fur et à mesure." }
          ]
        }
      ]
    };

    // Call Gemini API if Key is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
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

        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
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
                                explanation: { type: "STRING", description: "Pourquoi ce choix est vrai/faux" }
                              },
                              required: ["text", "isCorrect", "explanation"]
                            }
                          }
                        },
                        required: ["questionText", "explanation", "options"]
                      }
                    }
                  },
                  required: ["quizTitle", "passPercentage", "questions"]
                },
                temperature: 0.3
              }
            })
          }
        );

        if (aiResponse.ok) {
          const resData = await aiResponse.json();
          let rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          rawText = rawText.trim();
          if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "").trim();
          }
          const parsed = JSON.parse(rawText);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            generatedQuiz = parsed;
          }
        }
      } catch (aiErr) {
        console.warn("[/api/ai/generate-quiz] AI generation warning, using fallback evaluator:", aiErr);
      }
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
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (quizInsertErr) {
        console.error("[/api/ai/generate-quiz] quizInsertErr:", quizInsertErr);
        return NextResponse.json({ error: "Erreur lors de la création du Quiz dans la base de données: " + quizInsertErr.message }, { status: 400 });
      }

      if (newQuiz && newQuiz.id) {
        createdQuizId = newQuiz.id;

        // Insert questions using exact DB schema columns: quiz_id, text, choices (string[]), correct_index (number)
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
            correct_index: correctIndex
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
      savedQuizId: createdQuizId
    });
  } catch (err: any) {
    console.error("[/api/ai/generate-quiz] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la génération du quiz par l'IA." }, { status: 500 });
  }
}
