import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { callGeminiApi, generateSmartCourseStructure } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, prompt } = body;
    let numChapters = body.numChapters || 3;

    if (!courseId || !prompt) {
      return NextResponse.json({ error: "courseId et prompt sont requis." }, { status: 400 });
    }

    if (typeof numChapters === "string") {
      numChapters = parseInt(numChapters, 10);
    }
    numChapters = Math.min(Math.max(1, numChapters || 3), 10);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clientToUse = serviceKey ? supabaseAdmin : supabase;

    // Verify course ownership
    const { data: course, error: courseError } = await clientToUse
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);

      const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
      const isPrivileged = roles.some(r =>
        ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN"].includes(r)
      );
      if (!isPrivileged) {
        return NextResponse.json({ error: "Non autorisé à modifier ce cours." }, { status: 403 });
      }
    }

    let structure: Array<{ title: string; lessons: Array<{ title: string; duration_minutes: number }> }> = [];

    try {
      const systemInstructionText = `Tu es un concepteur pédagogique de formation expert. Ton objectif est de concevoir une structure de cours équilibrée et cohérente en français sous forme d'un tableau JSON d'objets chapitres.`;

      const userPromptText = `Génère une structure de formation en français pour le sujet suivant : "${prompt}".
Tu dois générer exactement ${numChapters} chapitres.
Chaque chapitre doit avoir un titre pertinent et une liste de leçons avec un titre clair et une durée estimée en minutes (comprise entre 5 et 30 minutes).`;

      const responseSchema = {
        type: "ARRAY",
        description: "Tableau contenant la structure des chapitres du cours",
        items: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "Titre du chapitre",
            },
            lessons: {
              type: "ARRAY",
              description: "Liste des leçons contenues dans ce chapitre",
              items: {
                type: "OBJECT",
                properties: {
                  title: {
                    type: "STRING",
                    description: "Titre de la leçon",
                  },
                  duration_minutes: {
                    type: "INTEGER",
                    description: "Durée estimée de la leçon en minutes (entre 5 et 30)",
                  },
                },
                required: ["title", "duration_minutes"],
              },
            },
          },
          required: ["title", "lessons"],
        },
      };

      const rawAiText = await callGeminiApi({
        systemInstruction: systemInstructionText,
        userPrompt: userPromptText,
        responseSchema,
        temperature: 0.3,
      });

      if (rawAiText) {
        let cleanText = rawAiText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "").trim();
        }
        structure = JSON.parse(cleanText);
      }
    } catch (aiErr) {
      console.warn("[/api/ai/course-structure] Gemini fallback active:", aiErr);
    }

    if (!structure || !Array.isArray(structure) || structure.length === 0) {
      structure = generateSmartCourseStructure(prompt, numChapters);
    }

    // Insert structure into database
    const { data: existingSections } = await clientToUse
      .from("course_sections")
      .select("sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: false });

    let currentSectionOrder =
      existingSections && existingSections.length > 0 ? existingSections[0].sort_order + 1 : 0;

    for (const sec of structure) {
      // Create Section
      const { data: sectionData, error: secErr } = await clientToUse
        .from("course_sections")
        .insert({
          course_id: courseId,
          title: sec.title,
          sort_order: currentSectionOrder++,
        })
        .select()
        .single();

      if (secErr) throw secErr;

      // Create Lessons for this Section
      let currentLessonOrder = 0;
      for (const les of sec.lessons) {
        const { error: lesErr } = await clientToUse.from("lessons").insert({
          section_id: sectionData.id,
          title: les.title,
          duration_minutes: les.duration_minutes || 15,
          sort_order: currentLessonOrder++,
          description: `Leçon sur le sujet : ${les.title}`,
          content: `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">${les.title}</h2><div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3"><p>Bienvenue dans cette leçon dédiée à <strong>${les.title}</strong>.</p><p>Explorez les concepts clés de ce module et mettez en pratique les notions enseignées.</p></div>`,
          video_url: "",
        });

        if (lesErr) throw lesErr;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Structure de formation générée et insérée avec succès.",
      structure,
    });
  } catch (err: any) {
    console.error("[ai-course-structure] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la génération." },
      { status: 500 }
    );
  }
}
