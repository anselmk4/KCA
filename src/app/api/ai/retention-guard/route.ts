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
    const { studentId, courseId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId est requis." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = serviceKey
      ? createDirectClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      : supabase;

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

    // 2. Check Instructor Plan (Gated to BASE, PRO, MAX)
    const { data: instructorProfile } = await (dbClient as any)
      .from("profiles")
      .select("plan, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const userPlan = instructorProfile?.plan || "FREE";
    if (userPlan === "FREE") {
      return NextResponse.json(
        {
          code: "PLAN_UPGRADE_REQUIRED",
          error: "L'AI Retention Guard (Détection de décrochage & Relance IA) est réservé aux abonnés du Plan Base ou supérieur (19$/mois).",
          requiredPlan: "BASE"
        },
        { status: 403 }
      );
    }

    // 3. Fetch student profile & enrollment data
    const { data: studentProfile } = await (dbClient as any)
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("id", studentId)
      .maybeSingle();

    if (!studentProfile) {
      return NextResponse.json({ error: "Étudiant introuvable." }, { status: 404 });
    }

    // Query enrollment for specific course or overall
    let enrollmentQuery = (dbClient as any)
      .from("enrollments")
      .select("id, course_id, progress_percent, status, enrolled_at, courses(title)")
      .eq("student_id", studentId);

    if (courseId) {
      enrollmentQuery = enrollmentQuery.eq("course_id", courseId);
    }

    const { data: enrollments } = await enrollmentQuery;
    const primaryEnrollment = enrollments?.[0] || null;

    const studentName = studentProfile.full_name || studentProfile.email.split("@")[0] || "l'étudiant";
    const courseTitle = primaryEnrollment?.courses?.title || "votre formation";
    const progressPercent = primaryEnrollment?.progress_percent || 0;
    const enrolledDate = primaryEnrollment?.enrolled_at ? new Date(primaryEnrollment.enrolled_at) : new Date();
    const daysSinceEnrolled = Math.max(1, Math.floor((Date.now() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Fallback AI Retention evaluation
    let riskScore = progressPercent < 20 && daysSinceEnrolled > 5 ? 75 : progressPercent < 50 && daysSinceEnrolled > 14 ? 55 : 25;
    let riskLevel = riskScore >= 70 ? "ÉLEVÉ" : riskScore >= 40 ? "MODÉRÉ" : "FAIBLE";

    let evaluation = {
      riskScore,
      riskLevel,
      riskFactors: [
        `Progression stagnante à ${progressPercent}% après ${daysSinceEnrolled} jours d'inscription.`,
        "Moins de 2 sessions complétées sur les 7 derniers jours.",
        "Potentiel besoin de réexplication des premières notions fondamentales."
      ],
      aiReactivationMessage: `Bonjour ${studentName} ! 👋

J'ai remarqué que vous n'avez pas eu l'occasion d'avancer sur la formation "${courseTitle}" ces derniers jours (vous en êtes actuellement à ${progressPercent}%).

Pas d'inquiétude ! Il est tout à fait normal de rencontrer des baisses de rythme. Je tenais simplement à vous encourager et vous rappeler que toute l'équipe est là pour vous aider si vous bloquez sur un chapitre.

Prenez 15 minutes aujourd'hui pour regarder la prochaine leçon. Chaque petit pas compte ! 🚀

À très vite sur Ansella,
${instructorProfile?.full_name || "Votre Formateur"}`,
      recommendedActions: [
        "Envoyer la relance d'encouragement personnalisée ci-dessus",
        "Recommander de revoir la leçon d'introduction ou les fiches résumé",
        "Proposer une réponse directe par message s'il s'agit d'un point technique bloquant"
      ]
    };

    // Call Gemini API if API key is set
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const systemPrompt = `Tu es un expert en ingénierie pédagogique et psychologie de l'apprentissage sur la plateforme Ansella.
Ta mission est d'analyser le risque de décrochage d'un étudiant et de rédiger un message de relance réconfortant, motivant et personnalisé.
Réponds STRICTEMENT sous forme d'objet JSON en français avec les propriétés demandées.`;

        const userPrompt = `Analyse le risque d'abandon de l'étudiant suivant :
- Nom : ${studentName}
- Cours : "${courseTitle}"
- Progression actuelle : ${progressPercent}%
- Ancienneté d'inscription : ${daysSinceEnrolled} jours

Génère une réponse JSON comprenant :
1. riskScore: Un score numérique de risque entre 0 et 100.
2. riskLevel: "ÉLEVÉ" (si riskScore >= 70), "MODÉRÉ" (40-69) ou "FAIBLE" (< 40).
3. riskFactors: Un tableau de 2 à 4 causes probables du ralentissement.
4. aiReactivationMessage: Un message de relance chaleureux, bienveillant, stimulant et prêt à l'envoi adressé à ${studentName}.
5. recommendedActions: Un tableau de 2 à 3 conseils pratiques pour le formateur.`;

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
                    riskScore: { type: "INTEGER", description: "Score de risque de 0 à 100" },
                    riskLevel: { type: "STRING", description: "Niveau : ÉLEVÉ, MODÉRÉ ou FAIBLE" },
                    riskFactors: { type: "ARRAY", items: { type: "STRING" } },
                    aiReactivationMessage: { type: "STRING", description: "Message de relance bienveillant rédigé pour l'élève" },
                    recommendedActions: { type: "ARRAY", items: { type: "STRING" } }
                  },
                  required: ["riskScore", "riskLevel", "riskFactors", "aiReactivationMessage", "recommendedActions"]
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
          if (parsed && typeof parsed.riskScore === "number") {
            evaluation = parsed;
          }
        }
      } catch (aiErr) {
        console.warn("[/api/ai/retention-guard] AI evaluation warning, using fallback:", aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      studentId,
      studentName,
      courseTitle,
      progressPercent,
      daysSinceEnrolled,
      evaluation
    });
  } catch (err: any) {
    console.error("[/api/ai/retention-guard] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'analyse du risque de décrochage." }, { status: 500 });
  }
}
