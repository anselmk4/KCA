/**
 * Centralized Gemini & AI Assistant Engine for Ansella
 * Supports Gemini 1.5/2.0/2.5 Flash & Pro with automatic multi-model fallback
 * and rich algorithmic content generation when API keys are unavailable.
 */

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

export function isGeminiKeyValid(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.includes("your_gemini_api_key") && !trimmed.includes("placeholder");
}

/**
 * Executes a Gemini API call with automatic model failover.
 */
export async function callGeminiApi({
  systemInstruction,
  userPrompt,
  responseSchema,
  temperature = 0.4,
}: {
  systemInstruction?: string;
  userPrompt: string;
  responseSchema?: any;
  temperature?: number;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isGeminiKeyValid(apiKey)) {
    return null;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (responseSchema) {
        payload.generationConfig.responseMimeType = "application/json";
        payload.generationConfig.responseSchema = responseSchema;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === "string" && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini API ${model}] status ${response.status}:`, errText.slice(0, 200));
      }
    } catch (err) {
      console.warn(`[Gemini API ${model}] network error:`, err);
    }
  }

  return null;
}

/**
 * Generates rich HTML lesson content tailored to the requested topic.
 */
export function generateSmartLessonHtml(topic: string): string {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();

  return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction et Objectifs : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Bienvenue dans cette leçon dédiée à <strong>${cleanTopic}</strong>. Dans ce module d'apprentissage immersif, vous allez explorer les concepts fondamentaux, les architectures sous-jacentes et les cas pratiques indispensables pour maîtriser cette thématique.</p>
  <p>À l'issue de cette leçon, vous serez en mesure de comprendre les mécanismes clés, d'identifier les meilleures pratiques de mise en œuvre et d'appliquer ces notions directement dans vos projets ou examens de certification.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>💡 Point Clé à Retenir :</strong> La maîtrise de <em>${cleanTopic}</em> repose sur la compréhension combinée des protocoles théoriques et de leur mise en œuvre pratique sur le terrain.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Principes Fondamentaux et Fonctionnement</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Pour appréhender efficacement <strong>${cleanTopic}</strong>, examinons les trois piliers essentiels :</p>
  <ul>
    <li><strong>Structure &amp; Fondations :</strong> L'organisation rigoureuse des données et la gestion des flux d'exécution.</li>
    <li><strong>Sécurité &amp; Résilience :</strong> Les protocoles de validation, d'intégrité et de consensus assurant la fiabilité du système.</li>
    <li><strong>Interopérabilité &amp; Scalabilité :</strong> La capacité à s'intégrer harmonieusement avec d'autres technologies et écosystèmes.</li>
  </ul>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Exemple Pratique et Cas d'Usage Réel</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Voici un exemple concret d'implémentation et d'analyse technique appliqué à <strong>${cleanTopic}</strong> :</p>
  <pre class="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto my-3"><code>// Exemple de structure appliquée à : ${cleanTopic}
const initializeModule = async () => {
  console.log("Démarrage du processus : ${cleanTopic}");
  const status = { verified: true, timestamp: Date.now() };
  return status;
};

// Exécution et validation
initializeModule().then(res => console.log("Statut d'exécution:", res));</code></pre>
</div>

<div data-block-type="info" data-style="warning" class="my-4 p-4 rounded-2xl border text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
  <strong>⚠️ Attention :</strong> Veillez à toujours tester vos configurations dans un environnement sécurisé (testnet / sandbox) avant tout déploiement en production.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">4. Synthèse et Prochaines Étapes</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Vous maîtrisez désormais les bases fondamentales de <strong>${cleanTopic}</strong>. Prenez le temps de réviser les notions abordées, puis passez au quiz d'évaluation pour valider vos acquis et débloquer les chapitres suivants de votre formation.</p>
</div>`;
}

/**
 * Generates a realistic, pedagogical quiz structure with multiple questions.
 */
export function generateSmartQuiz(topic: string, count: number = 5, difficulty: string = "MOYEN") {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();

  const questionTemplates = [
    {
      text: `Quel est l'objectif principal de "${cleanTopic}" ?`,
      explanation: `Comprendre le rôle central de ${cleanTopic} permet de structurer efficacement la suite de l'apprentissage.`,
      options: [
        { text: `Permettre une gestion fiable, performante et sécurisée des processus liés à ${cleanTopic}`, isCorrect: true, explanation: "Exact ! C'est la fonction première et essentielle." },
        { text: "Remplacer entièrement les protocoles fondamentaux sans phase de transition", isCorrect: false, explanation: "Incorrect, la compatibilité et la transition restent indispensables." },
        { text: "Désactiver les sécurités réseau pour accélérer les transactions", isCorrect: false, explanation: "Faux, la sécurité est une exigence absolue." },
        { text: "Aucune de ces réponses", isCorrect: false, explanation: "La première réponse est la bonne définition." },
      ],
    },
    {
      text: `Dans le cadre de "${cleanTopic}", quelle est la meilleure pratique recommandée ?`,
      explanation: "L'application continue des standards de sécurité et de modularité garantit la pérennité du système.",
      options: [
        { text: "Effectuer des tests unitaires et des validations systématiques avant mise en production", isCorrect: true, explanation: "Bravo ! Les tests réguliers évitent les failles critiques." },
        { text: "Ignorer la documentation technique pour gagner du temps", isCorrect: false, explanation: "Très risqué et déconseillé." },
        { text: "Déployer sans vérifier les paramètres d'environnement", isCorrect: false, explanation: "Incorrect, cela crée des vulnérabilités majeures." },
        { text: "Utiliser des clés d'accès partagées en clair", isCorrect: false, explanation: "Dangereux et contraire aux règles élémentaires." },
      ],
    },
    {
      text: `Quel avantage majeur apporte l'utilisation de "${cleanTopic}" dans un écosystème moderne ?`,
      explanation: "L'optimisation des flux et la traçabilité sont des bénéfices directs de cette approche.",
      options: [
        { text: "Une plus grande transparence, automatisation et réduction des erreurs humaines", isCorrect: true, explanation: "Correct ! C'est un gain d'efficacité déterminant." },
        { text: "Une augmentation inutile de la complexité sans gain mesurable", isCorrect: false, explanation: "Faux, les gains de productivité et de fiabilité sont réels." },
        { text: "L'obligation d'utiliser un matériel obsolète", isCorrect: false, explanation: "Non, ces technologies sont conçues pour des environnements modernes." },
        { text: "La suppression de toute possibilité de mise à jour", isCorrect: false, explanation: "Incorrect, la flexibilité fait partie des atouts." },
      ],
    },
    {
      text: `Comment réagir face à une anomalie ou un comportement inattendu lié à "${cleanTopic}" ?`,
      explanation: "L'analyse méthodique des logs et le respect des procédures de diagnostic permettent une résolution rapide.",
      options: [
        { text: "Consulter les logs d'exécution, analyser les erreurs et appliquer les correctifs ciblés", isCorrect: true, explanation: "Excellente réponse ! L'analyse méthodique est la clé." },
        { text: "Supprimer immédiatement toutes les bases de données", isCorrect: false, explanation: "Non, cela causerait une perte de données irréversible." },
        { text: "Ignorer l'alerte tant que le système ne s'arrête pas", isCorrect: false, explanation: "Mauvaise pratique pouvant aggraver le problème." },
        { text: "Désactiver les modules de surveillance", isCorrect: false, explanation: "Incorrect." },
      ],
    },
    {
      text: `Quel est l'impact de "${cleanTopic}" sur l'expérience des apprenants et utilisateurs finaux ?`,
      explanation: "La clarté, l'ergonomie et la rapidité d'exécution renforcent la satisfaction et la fidélisation.",
      options: [
        { text: "Une expérience fluide, engageante et directement orientée vers la réussite des objectifs", isCorrect: true, explanation: "Tout à fait ! C'est le cœur de l'approche pédagogique." },
        { text: "Un ralentissement généralisé sans avantage perceptible", isCorrect: false, explanation: "Faux." },
        { text: "L'inaccessibilité de la plateforme", isCorrect: false, explanation: "Incorrect." },
        { text: "Une confusion accrue pour les débutants", isCorrect: false, explanation: "Incorrect, la pédagogie vise justement la clarté." },
      ],
    },
  ];

  const actualCount = Math.min(Math.max(1, count), 15);
  const questions: any[] = [];

  for (let i = 0; i < actualCount; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    const qNum = i + 1;
    questions.push({
      questionText: `Question ${qNum} : ${template.text}`,
      explanation: template.explanation,
      options: template.options,
    });
  }

  return {
    quizTitle: `Évaluation : ${cleanTopic.slice(0, 50)} (${difficulty})`,
    passPercentage: 70,
    questions,
  };
}

/**
 * Generates a full course structure with modules and lessons.
 */
export function generateSmartCourseStructure(topic: string, numChapters: number = 3) {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();
  const count = Math.min(Math.max(1, numChapters), 8);

  const defaultChapters = [
    {
      title: `Module 1 : Fondations et Concepts Clés de ${cleanTopic}`,
      lessons: [
        { title: `Introduction générale à ${cleanTopic}`, duration_minutes: 15 },
        { title: "Historique, enjeux et opportunités du marché", duration_minutes: 20 },
        { title: "Vocabulaire essentiel et principes de fonctionnement", duration_minutes: 25 },
      ],
    },
    {
      title: `Module 2 : Méthodologies, Outils et Mise en Pratique`,
      lessons: [
        { title: `Configuration de l'environnement de travail`, duration_minutes: 20 },
        { title: `Guide étape par étape appliqué à ${cleanTopic}`, duration_minutes: 30 },
        { title: "Études de cas réels et analyse des pièges à éviter", duration_minutes: 25 },
      ],
    },
    {
      title: `Module 3 : Stratégies Avancées et Perspectives d'Avenir`,
      lessons: [
        { title: `Optimisation des performances et meilleures pratiques`, duration_minutes: 25 },
        { title: "Sécurité avancée, conformité et pérennité", duration_minutes: 20 },
        { title: "Synthèse générale et préparation à la certification", duration_minutes: 30 },
      ],
    },
    {
      title: `Module 4 : Atelier Pratique et Projet Final`,
      lessons: [
        { title: "Cahier des charges du projet de fin de formation", duration_minutes: 20 },
        { title: "Développement et intégration pas à pas", duration_minutes: 45 },
        { title: "Revue de code, tests et soutenance finale", duration_minutes: 30 },
      ],
    },
  ];

  const result: any[] = [];
  for (let i = 0; i < count; i++) {
    if (defaultChapters[i]) {
      result.push(defaultChapters[i]);
    } else {
      result.push({
        title: `Module ${i + 1} : Approfondissement Expert sur ${cleanTopic}`,
        lessons: [
          { title: `Atelier pratique partie ${i + 1}.1`, duration_minutes: 20 },
          { title: `Cas d'usage professionnel partie ${i + 1}.2`, duration_minutes: 25 },
          { title: `Évaluation et validation des acquis`, duration_minutes: 15 },
        ],
      });
    }
  }

  return result;
}
