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
        const genPrompt = `Génère un contenu de cours pédagogique et détaillé en français au format HTML pour le sujet suivant: "${prompt}".
Tu dois obligatoirement utiliser et imbriquer les balises HTML spécifiques suivantes pour structurer ton contenu afin qu'il soit compatible avec notre éditeur de blocs:

1. Titres : <h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">Mon Titre</h2>
2. Paragraphes/Texte : <div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3"><p>Mon contenu textuel ici, avec du code en ligne <code>code</code> ou du code block si besoin.</p></div>
3. Blocs d'informations (Callouts) : <div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-250 text-blue-800 dark:text-blue-400">Conseil/Avertissement...</div> (styles possibles dans data-style: info, warning, danger, success)
4. Séparateur : <hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

Génère un contenu riche avec au moins un titre (h2), 2 ou 3 paragraphes détaillés (div text) et un bloc d'information (div info).
Ne retourne aucune balise de code markdown \`\`\`html, retourne directement le code HTML brut.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: genPrompt }] }]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          generatedHtml = textResult.replace(/```html/g, "").replace(/```/g, "").trim();
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
