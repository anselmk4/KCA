import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { callGeminiApi, generateSmartLessonHtml } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Le prompt de génération est obligatoire." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = serviceKey ? supabaseAdmin : supabase;

    // Check user roles / permissions
    const { data: userRoles } = await (dbClient as any)
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isInstructorOrAdmin = roles.some((r: string) =>
      ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(r)
    );

    // Also check profiles
    const { data: userProfile } = await (dbClient as any)
      .from("profiles")
      .select("plan, role")
      .eq("id", user.id)
      .maybeSingle();

    const isAuthorized =
      isInstructorOrAdmin ||
      userProfile?.role === "INSTRUCTOR" ||
      userProfile?.role === "ADMIN" ||
      userProfile?.plan !== "FREE";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "La génération de leçons par IA est réservée aux formateurs et administrateurs." },
        { status: 403 }
      );
    }

    let generatedHtml = "";

    try {
      const systemInstructionText = `Tu es un rédacteur pédagogique expert en blockchain, cryptomonnaies, finance décentralisée, programmation et intelligence artificielle pour Ansella. Ton objectif est de générer un contenu de cours de haute qualité, structuré en français sous forme de blocs HTML.
Tu dois retourner UNIQUEMENT le code HTML brut, sans commentaires, sans explications préliminaires, et surtout SANS balises de code Markdown (comme \`\`\`html ou \`\`\`).
Tu dois utiliser exclusivement les structures de balises HTML suivantes (compatibles avec notre éditeur de blocs) :
1. Titres : <h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">Titre de section</h2> (ou data-level="3" pour h3).
2. Texte : <div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3"><p>Contenu textuel, paragraphe 1.</p><p>Paragraphe 2, avec du texte en <strong>gras</strong>, en <em>italique</em> ou du code en ligne <code>mon_code</code>.</p></div>
3. Blocs d'info/Callouts : <div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"><strong>Note :</strong> Message...</div> (styles autorisés dans data-style: info, warning, danger, success).
4. Séparateurs : <hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />
5. Code Blocks : dans une div text, tu peux inclure des exemples de code dans une balise <pre class="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs overflow-x-auto my-3"><code>...</code></pre>.`;

      const userPromptText = `Génère une leçon riche, complète, immersive et pédagogique pour le sujet suivant : "${prompt.trim()}".
Assure-toi d'inclure au moins 3 sections (avec h2), plusieurs paragraphes de texte riches et explicatifs (div text), des exemples concrets ou blocs de code si pertinent, et au moins un bloc d'information (div info, style success, info ou warning).`;

      const rawAiText = await callGeminiApi({
        systemInstruction: systemInstructionText,
        userPrompt: userPromptText,
        temperature: 0.3,
      });

      if (rawAiText) {
        generatedHtml = rawAiText
          .replace(/^```(?:html)?\s*/i, "")
          .replace(/```$/m, "")
          .trim();
      }
    } catch (aiErr) {
      console.warn("[/api/ai/lesson-content] Gemini AI fallback active:", aiErr);
    }

    if (!generatedHtml) {
      generatedHtml = generateSmartLessonHtml(prompt.trim());
    }

    return NextResponse.json({ html: generatedHtml });
  } catch (err: any) {
    console.error("[ai-lesson-content] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la génération du contenu." },
      { status: 500 }
    );
  }
}
