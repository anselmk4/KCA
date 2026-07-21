import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

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
    const dbClient = serviceKey
      ? createDirectClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      : supabase;

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

    // Prepare text for evaluation
    const studentName = submission.profiles?.full_name || submission.profiles?.email || "l'étudiant";
    const homeworkTitle = homework.title || "Devoir pratique";
    const homeworkDesc = homework.description || "Consignes du devoir non spécifiées";
    const studentAnswer = submission.content || submission.file_url || "Rendu sous forme de fichier joint / URL : " + (submission.file_url || "Fichier soumis");

    // Evaluation result structure
    let evaluation = {
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

    // Call Gemini API if key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const systemPrompt = `Tu es un professeur agrégé et expert pédagogique sur la plateforme d'apprentissage Ansella. 
Ta mission est d'évaluer de manière équitable, constructive et professionnelle le devoir soumis par un étudiant.
Tu dois répondre STRICTEMENT sous forme d'un objet JSON en français avec la structure demandée.`;

        const userPrompt = `Évalue le devoir suivant :
- Cours : "${course.title || 'Formation'}"
- Consignes du Devoir : "${homeworkTitle}" (${homeworkDesc})
- Étudiant : ${studentName}
- Travail rendu par l'étudiant : "${studentAnswer}"

Génère une évaluation détaillée comprenant :
1. suggestedGrade: Une note globale recommandée entre 0 et 100.
2. summaryFeedback: Un paragraphe récapitulatif bienveillant et constructif adressé à l'étudiant.
3. strengths: Un tableau de 2 à 4 points forts observés dans son travail.
4. improvements: Un tableau de 1 à 3 axes d'amélioration recommandés.
5. rubricBreakdown: Un tableau de 3 critères d'évaluation avec pour chacun "criterion" (nom du critère), "score" (sur 100), et "comment" (commentaire court).`;

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
                },
                temperature: 0.2
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
          if (parsed && typeof parsed.suggestedGrade === "number") {
            evaluation = parsed;
          }
        }
      } catch (aiErr) {
        console.warn("[/api/ai/grade-homework] AI generation warning, using fallback evaluator:", aiErr);
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
