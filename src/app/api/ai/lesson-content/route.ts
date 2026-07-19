import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Le prompt de génération est obligatoire." }, { status: 400 });
    }

    let generatedHtml = "";

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const systemInstructionText = `Tu es un rédacteur pédagogique expert en blockchain, cryptomonnaies, finance décentralisée et intelligence artificielle. Ton objectif est de générer un contenu de cours de haute qualité, structuré en français sous forme de blocs HTML.
Tu dois retourner UNIQUEMENT le code HTML brut, sans commentaires, sans explications préliminaires, et surtout SANS balises de code Markdown (comme \`\`\`html ou \`\`\`).
Tu devez utiliser exclusivement les structures de balises HTML suivantes (compatibles avec notre éditeur de blocs) :
1. Titres : <h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">Titre de section</h2> (ou data-level="3" pour h3).
2. Texte : <div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3"><p>Contenu textuel, paragraphe 1.</p><p>Paragraphe 2, avec du texte en <strong>gras</strong>, en <em>italique</em> ou du code en ligne <code>mon_code</code>.</p></div>
3. Blocs d'info/Callouts : <div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-250 text-blue-800 dark:text-blue-400"><strong>Note :</strong> Message...</div> (styles autorisés dans data-style: info, warning, danger, success).
4. Séparateurs : <hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />
5. Code Blocks : dans une div text, tu peux inclure des exemples de code dans une balise <pre class="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-xs overflow-x-auto"><code>...</code></pre>.`;

        const userPromptText = `Génère une leçon riche, complète et pédagogique pour le sujet suivant : "${prompt}".
Assure-toi d'inclure au moins 2 sections (avec h2), plusieurs paragraphes de texte riches et explicatifs (div text), des exemples concrets ou blocs de code si pertinent, et au moins un bloc d'information (div info, style success ou warning).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPromptText }] }],
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            generationConfig: {
              temperature: 0.3,
              topP: 0.95
            }
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          generatedHtml = textResult
            .replace(/^```(?:html)?\s*/i, "")
            .replace(/```$/m, "")
            .trim();
        } else {
          const errText = await response.text();
          console.error(`Gemini API returned status ${response.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Gemini lesson generator failed, falling back to template:", err);
      }
    }

    if (!generatedHtml) {
      // Fallback local generated content template
      generatedHtml = `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">Leçon : ${prompt}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3">
  <p>Ce contenu a été généré automatiquement par l'assistant pour le sujet : <strong>${prompt}</strong>.</p>
  <p>Pour approfondir ce sujet, il convient de comprendre les principes théoriques de base, d'analyser les cas pratiques d'utilisation dans l'industrie, et de mettre en œuvre des exemples concrets de programmation ou d'évaluation.</p>
</div>
<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-250 text-blue-800 dark:text-blue-400">
  <strong>Note de l'IA :</strong> Vous pouvez double-cliquer sur n'importe quel bloc ci-dessous pour le personnaliser ou ajouter de nouveaux modules (vidéos, PDF, liens) dans l'éditeur.
</div>
<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3">
  <p>Voici un exemple pratique pour illustrer cette notion :</p>
  <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-xs overflow-x-auto"><code>// Exemple d'implémentation
const initConcept = () => {
  console.log("Démonstration de : ${prompt}");
};</code></pre>
</div>`;
    }

    return NextResponse.json({ html: generatedHtml });
  } catch (err: any) {
    console.error("[ai-lesson-content] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la génération du contenu." }, { status: 500 });
  }
}
