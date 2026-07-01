import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, prompt, numChapters } = body;

    if (!courseId || !prompt) {
      return NextResponse.json({ error: "courseId et prompt sont requis." }, { status: 400 });
    }

    // Verify course ownership
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      // Check if admin
      const { data: userRoles } = await supabaseAdmin
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);

      const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
      const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));
      if (!isAdmin) {
        return NextResponse.json({ error: "Non autorisé à modifier ce cours." }, { status: 403 });
      }
    }

    let structure: Array<{ title: string; lessons: Array<{ title: string; duration_minutes: number }> }> = [];

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      // Execute call to Gemini API
      try {
        const genPrompt = `Génère une structure de formation en français au format JSON pour le sujet suivant: "${prompt}".
Génère exactement ${numChapters || 3} chapitres.
Chaque chapitre doit avoir un titre et une liste de leçons avec un titre et une durée estimée en minutes (entre 5 et 30 minutes).
Retourne uniquement le tableau JSON brut, sans balises de code markdown comme \`\`\`json, sans explications.
Exemple:
[
  {
    "title": "Nom du chapitre",
    "lessons": [
      { "title": "Nom de la leçon", "duration_minutes": 15 }
    ]
  }
]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: genPrompt }] }]
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const resData = await response.json();
        const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Clean markdown backticks if returned
        const jsonString = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
        structure = JSON.parse(jsonString);
      } catch (err: any) {
        console.error("Gemini API call failed, falling back to simulated generation:", err);
      }
    }

    // Fallback/Simulated structure generation if Gemini key is missing or failed
    if (!structure || structure.length === 0) {
      const lowerPrompt = prompt.toLowerCase();
      const count = numChapters || 3;

      if (lowerPrompt.includes("react") || lowerPrompt.includes("next") || lowerPrompt.includes("web") || lowerPrompt.includes("javascript")) {
        structure = [
          {
            title: "Introduction et Configuration du Projet",
            lessons: [
              { title: "Bienvenue et objectifs de la formation", duration_minutes: 10 },
              { title: "Configuration de l'environnement de développement", duration_minutes: 15 },
              { title: "Création du premier projet et structure des dossiers", duration_minutes: 20 }
            ]
          },
          {
            title: "Concepts Fondamentaux et Architecture",
            lessons: [
              { title: "Comprendre les composants et le cycle de vie", duration_minutes: 25 },
              { title: "Gestion de l'état local et des props", duration_minutes: 20 },
              { title: "Rendu conditionnel et listes dynamiques", duration_minutes: 15 }
            ]
          },
          {
            title: "Routage, API et Déploiement",
            lessons: [
              { title: "Mise en place du routage dynamique", duration_minutes: 20 },
              { title: "Consommation d'API et fetch de données", duration_minutes: 30 },
              { title: "Optimisation de production et déploiement final", duration_minutes: 25 }
            ]
          }
        ];
      } else if (lowerPrompt.includes("blockchain") || lowerPrompt.includes("crypto") || lowerPrompt.includes("smart contract") || lowerPrompt.includes("solidity")) {
        structure = [
          {
            title: "Fondations de la Blockchain et Cryptographie",
            lessons: [
              { title: "Histoire et fonctionnement des registres distribués", duration_minutes: 15 },
              { title: "Mécanismes de consensus (Proof of Work vs Proof of Stake)", duration_minutes: 20 },
              { title: "Cryptographie asymétrique et adresses de portefeuille", duration_minutes: 20 }
            ]
          },
          {
            title: "Développement de Smart Contracts avec Solidity",
            lessons: [
              { title: "Syntaxe de base de Solidity et variables", duration_minutes: 25 },
              { title: "Fonctions, modificateurs et visibilité des variables", duration_minutes: 30 },
              { title: "Gestion des événements et des structures de données", duration_minutes: 25 }
            ]
          },
          {
            title: "Déploiement et Intégration DApp",
            lessons: [
              { title: "Compilation et déploiement sur les réseaux de test", duration_minutes: 20 },
              { title: "Connexion de l'application avec Ethers.js", duration_minutes: 30 },
              { title: "Sécurité des smart contracts et audits de base", duration_minutes: 25 }
            ]
          }
        ];
      } else if (lowerPrompt.includes("ia") || lowerPrompt.includes("intelligence artificielle") || lowerPrompt.includes("machine learning") || lowerPrompt.includes("python")) {
        structure = [
          {
            title: "Introduction à l'Intelligence Artificielle",
            lessons: [
              { title: "Définitions et sous-domaines de l'IA moderne", duration_minutes: 12 },
              { title: "Configuration de Google Colab et bibliothèques clés", duration_minutes: 18 },
              { title: "Préparation des données avec Pandas et NumPy", duration_minutes: 25 }
            ]
          },
          {
            title: "Modèles Prédictifs et Machine Learning",
            lessons: [
              { title: "Régression linéaire et classification supervisée", duration_minutes: 20 },
              { title: "Entraînement, évaluation et validation croisée", duration_minutes: 25 },
              { title: "Algorithme des k plus proches voisins et arbres de décision", duration_minutes: 25 }
            ]
          },
          {
            title: "Réseaux de Neurones et Deep Learning",
            lessons: [
              { title: "Introduction aux réseaux de neurones artificiels", duration_minutes: 30 },
              { title: "Apprentissage par transfert et modèles pré-entraînés", duration_minutes: 28 },
              { title: "Intégration d'API d'IA (Gemini / OpenAI)", duration_minutes: 25 }
            ]
          }
        ];
      } else {
        // General default template
        structure = [
          {
            title: `Introduction à : ${prompt}`,
            lessons: [
              { title: `Les bases indispensables sur ${prompt}`, duration_minutes: 15 },
              { title: "Terminologie et vocabulaire clé", duration_minutes: 10 }
            ]
          },
          {
            title: "Méthodologies et Pratique",
            lessons: [
              { title: "Mise en situation et exercices pratiques", duration_minutes: 25 },
              { title: "Erreurs courantes à éviter", duration_minutes: 20 }
            ]
          },
          {
            title: "Cas Réels et Clôture",
            lessons: [
              { title: "Étude de cas concret et démonstration", duration_minutes: 30 },
              { title: "Quiz de validation et étapes suivantes", duration_minutes: 15 }
            ]
          }
        ];
      }

      // Slice structure if numChapters is different
      structure = structure.slice(0, count);
    }

    // Insert structure into database
    // Get current sections order to append at the end
    const { data: existingSections } = await supabaseAdmin
      .from("course_sections")
      .select("sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: false });

    let currentSectionOrder = existingSections && existingSections.length > 0 ? existingSections[0].sort_order + 1 : 0;

    for (const sec of structure) {
      // Create Section
      const { data: sectionData, error: secErr } = await supabaseAdmin
        .from("course_sections")
        .insert({
          course_id: courseId,
          title: sec.title,
          sort_order: currentSectionOrder++
        })
        .select()
        .single();

      if (secErr) throw secErr;

      // Create Lessons for this Section
      let currentLessonOrder = 0;
      for (const les of sec.lessons) {
        const { error: lesErr } = await supabaseAdmin
          .from("lessons")
          .insert({
            section_id: sectionData.id,
            title: les.title,
            duration_minutes: les.duration_minutes,
            sort_order: currentLessonOrder++,
            description: `Leçon générée par l'assistant IA sur le sujet : ${les.title}`,
            content: `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">${les.title}</h2><div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-150 my-3"><p>Bienvenue dans cette leçon. Dans ce chapitre, nous allons approfondir le sujet suivant : <strong>${les.title}</strong>.</p><p>Veuillez modifier ce texte ou utiliser l'assistant de génération de contenu pour compléter cette leçon.</p></div>`,
            video_url: ""
          });

        if (lesErr) throw lesErr;
      }
    }

    return NextResponse.json({ success: true, message: "Structure de formation générée et insérée avec succès." });
  } catch (err: any) {
    console.error("[ai-course-structure] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la génération." }, { status: 500 });
  }
}
