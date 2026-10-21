import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { callGeminiApi } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "submissionId est requis." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = serviceKey ? supabaseAdmin : supabase;

    // 1. Fetch submission details
    const { data: submission, error: subError } = await (dbClient as any)
      .from("homework_submissions")
      .select("*, profiles:student_id(full_name, email)")
      .eq("id", submissionId)
      .maybeSingle();

    if (subError || !submission) {
      return NextResponse.json({ error: "Soumission introuvable." }, { status: 404 });
    }

    // 2. Fetch associated homework
    const { data: homework } = await (dbClient as any)
      .from("homeworks")
      .select("id, course_id, title, description")
      .eq("id", submission.homework_id)
      .maybeSingle();

    if (!homework) {
      return NextResponse.json({ error: "Devoir associé introuvable." }, { status: 404 });
    }

    // 3. Fetch course & instructor info
    const { data: course } = await (dbClient as any)
      .from("courses")
      .select("instructor_id, title")
      .eq("id", homework.course_id)
      .maybeSingle();

    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    // 4. Verify user roles / authorization
    const { data: userRoles } = await (dbClient as any)
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roles.some((r: string) => ["SUPER_ADMIN", "ADMIN"].includes(r));
    const isCourseInstructor = course.instructor_id === user.id;

    if (!isCourseInstructor && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé à corriger ce devoir." }, { status: 403 });
    }

    // 5. GATING CHECK: Must be on Plan BASE or higher (BASE, PRO, MAX)
    const { data: userProfile } = await (dbClient as any)
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const userPlan = userProfile?.plan || "FREE";
    if (userPlan === "FREE") {
      return NextResponse.json(
        {
          code: "PLAN_UPGRADE_REQUIRED",
          error: "L'évaluation et la correction automatique des devoirs par l'IA sont réservées aux abonnés du Plan Base ou supérieur (19$/mois).",
          requiredPlan: "BASE"
        },
        { status: 403 }
      );
    }

    // Prepare text and multimodal data for evaluation
    const studentName = submission.profiles?.full_name || submission.profiles?.email || "l'étudiant";
    const homeworkTitle = homework.title || "Devoir pratique";
    const homeworkDesc = homework.description || "Consignes du devoir non spécifiées";

    let inlineData: { mimeType: string; data: string } | undefined = undefined;
    let studentAnswer = submission.content ? String(submission.content).trim() : "";

    if (submission.file_url) {
      const match = String(submission.file_url).match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inlineData = {
          mimeType: match[1],
          data: match[2],
        };
        studentAnswer = studentAnswer
          ? `${studentAnswer}\n\n[Document joint analysable ci-dessous (${match[1]})]`
          : `[Document PDF/Image joint soumis par l'apprenant (${match[1]}) - analysé en pièce jointe]`;
      } else {
        studentAnswer = studentAnswer
          ? `${studentAnswer}\n\nLien du fichier soumis : ${submission.file_url}`
          : `Lien du fichier soumis : ${submission.file_url}`;
      }
    }

    if (!studentAnswer) {
      studentAnswer = "Soumission de devoir standard.";
    }

    // Default contextual fallback if Gemini is not configured or rate-limited
    let isAiGenerated = false;
    let fallbackReason: string | null = null;

    let evaluation = {
      isAiGenerated: false,
      fallbackReason: "INITIAL",
      suggestedGrade: 85,
      summaryFeedback: `La soumission de ${studentName} pour "${homeworkTitle}" démontre une bonne compréhension générale des concepts clés. Le devoir répond aux critères essentiels de la consigne.`,
      strengths: [
        "Bonne structure globale et argumentation claire",
        "Conformité avec les directives principales du devoir",
        "Engagement évident dans la réalisation du projet"
      ],
      improvements: [
        "Approfondir la précision technique de la conclusion",
        "Fournir des exemples chiffrés ou cas concrets supplémentaires"
      ],
      rubricBreakdown: [
        { criterion: "Compréhension & Respect des consignes", score: 90, comment: "Excellente assimilation des notions du cours." },
        { criterion: "Structure & Clarté du rendu", score: 85, comment: "Rendu propre et bien articulé." },
        { criterion: "Rigueur & Analyse technique", score: 80, comment: "Bon travail d'ensemble, peut être enrichi d'exemples concrets." }
      ]
    };

    const envKey = process.env.GEMINI_API_KEY?.trim() || "";
    const isKeyConfigured = envKey.length > 15 && !envKey.includes("your_gemini_api_key") && envKey.startsWith("AIza");

    if (!isKeyConfigured) {
      fallbackReason = "MISSING_KEY";
      evaluation.isAiGenerated = false;
      evaluation.fallbackReason = "MISSING_KEY";
    } else {
      try {
        const systemPrompt = `Tu es un professeur agrégé et expert pédagogique sur la plateforme d'apprentissage Ansella. 
Ta mission est d'évaluer de manière rigoureuse, équitable, personnalisée et constructive le devoir soumis par un étudiant.
Tu dois analyser minutieusement le contenu textuel ou le document PDF/image attaché, attribuer une note réaliste et justifiée en fonction de la qualité réelle du travail, et répondre STRICTEMENT sous forme d'un objet JSON en français avec la structure demandée.`;

        const userPrompt = `Évalue le devoir suivant :
- Formation / Cours : "${course.title || 'Formation'}"
- Titre du Devoir : "${homeworkTitle}"
- Consignes officielles : "${homeworkDesc}"
- Nom de l'apprenant : ${studentName}
- Contenu / Rendu soumis : "${studentAnswer}"

Génère une évaluation détaillée comprenant :
1. suggestedGrade: Une note globale recommandée entre 0 et 100 reflétant fidèlement le travail fourni.
2. summaryFeedback: Un paragraphe récapitulatif détaillé, bienveillant et constructif adressé directement à l'étudiant.
3. strengths: Un tableau de 2 à 4 points forts spécifiques et pertinents observés dans son devoir.
4. improvements: Un tableau de 2 à 3 axes d'amélioration précis pour progresser.
5. rubricBreakdown: Un tableau de 3 critères d'évaluation adaptés au sujet avec pour chacun "criterion" (nom), "score" (sur 100), et "comment" (justification).`;

        const responseSchema = {
          type: "OBJECT",
          properties: {
            suggestedGrade: { type: "INTEGER", description: "Note globale recommandée sur 100" },
            summaryFeedback: { type: "STRING", description: "Feedback général constructif pour l'étudiant" },
            strengths: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Liste des points forts de la soumission"
            },
            improvements: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Axes d'amélioration suggérés"
            },
            rubricBreakdown: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  criterion: { type: "STRING", description: "Nom du critère" },
                  score: { type: "INTEGER", description: "Note sur 100 pour ce critère" },
                  comment: { type: "STRING", description: "Commentaire spécifique" }
                },
                required: ["criterion", "score", "comment"]
              },
              description: "Détail des critères d'évaluation"
            }
          },
          required: ["suggestedGrade", "summaryFeedback", "strengths", "improvements", "rubricBreakdown"]
        };

        const rawAiText = await callGeminiApi({
          systemInstruction: systemPrompt,
          userPrompt,
          responseSchema,
          temperature: 0.2,
          inlineData,
        });

        if (rawAiText) {
          let cleanText = rawAiText.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "").trim();
          }
          const parsed = JSON.parse(cleanText);
          if (parsed && typeof parsed.suggestedGrade === "number") {
            evaluation = {
              ...parsed,
              isAiGenerated: true,
              fallbackReason: null,
            };
            isAiGenerated = true;
          }
        } else {
          fallbackReason = "API_ERROR";
          evaluation.isAiGenerated = false;
          evaluation.fallbackReason = "API_ERROR";
        }
      } catch (aiErr) {
        console.warn("[/api/ai/grade-homework] Gemini evaluation error:", aiErr);
        fallbackReason = "API_EXCEPTION";
        evaluation.isAiGenerated = false;
        evaluation.fallbackReason = "API_EXCEPTION";
      }
    }

    return NextResponse.json({
      success: true,
      submissionId,
      studentName,
      homeworkTitle,
      evaluation
    });
  } catch (err: any) {
    console.error("[/api/ai/grade-homework] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne lors de la correction par l'IA." }, { status: 500 });
  }
}
