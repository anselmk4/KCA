/**
 * Centralized Gemini & AI Assistant Engine for Ansella
 * Supports Gemini 1.5/2.0/2.5 Flash & Pro with automatic multi-model fallback
 * and deep thematic generators covering Business, Trading, Crypto, AI, Marketing, Coding, etc.
 */

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

export function isGeminiKeyValid(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.includes("your_gemini_api_key") &&
    !trimmed.includes("placeholder") &&
    trimmed.startsWith("AIza")
  );
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
  if (!apiKey || apiKey.trim() === "your_gemini_api_key" || !apiKey.trim().startsWith("AIza")) {
    return null;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
 * Categorizes a topic to generate specialized, context-rich content.
 */
type TopicCategory =
  | "ENTREPRENEURSHIP"
  | "TRADING_FINANCE"
  | "BLOCKCHAIN_CRYPTO"
  | "AI_DATA"
  | "MARKETING_SALES"
  | "DEVELOPMENT_CODE"
  | "PRODUCTIVITY_PERSONAL"
  | "GENERAL";

function detectCategory(prompt: string): TopicCategory {
  const p = prompt.toLowerCase();

  if (
    p.includes("entrepreneu") ||
    p.includes("business") ||
    p.includes("startup") ||
    p.includes("créer une entreprise") ||
    p.includes("projet") ||
    p.includes("gestion") ||
    p.includes("management") ||
    p.includes("leadership") ||
    p.includes("stratégie")
  ) {
    return "ENTREPRENEURSHIP";
  }

  if (
    p.includes("trading") ||
    p.includes("bourse") ||
    p.includes("forex") ||
    p.includes("scalping") ||
    p.includes("swing") ||
    p.includes("analyse technique") ||
    p.includes("chandeliers") ||
    p.includes("finance") ||
    p.includes("investissement")
  ) {
    return "TRADING_FINANCE";
  }

  if (
    p.includes("blockchain") ||
    p.includes("crypto") ||
    p.includes("bitcoin") ||
    p.includes("ethereum") ||
    p.includes("solana") ||
    p.includes("defi") ||
    p.includes("smart contract") ||
    p.includes("web3") ||
    p.includes("nft") ||
    p.includes("token")
  ) {
    return "BLOCKCHAIN_CRYPTO";
  }

  if (
    p.includes("ia") ||
    p.includes("intelligence artificielle") ||
    p.includes("machine learning") ||
    p.includes("deep learning") ||
    p.includes("chatgpt") ||
    p.includes("prompt") ||
    p.includes("data") ||
    p.includes("données")
  ) {
    return "AI_DATA";
  }

  if (
    p.includes("marketing") ||
    p.includes("vente") ||
    p.includes("copywriting") ||
    p.includes("acquisition") ||
    p.includes("publicité") ||
    p.includes("seo") ||
    p.includes("e-commerce") ||
    p.includes("réseaux sociaux")
  ) {
    return "MARKETING_SALES";
  }

  if (
    p.includes("code") ||
    p.includes("programmation") ||
    p.includes("javascript") ||
    p.includes("python") ||
    p.includes("react") ||
    p.includes("html") ||
    p.includes("css") ||
    p.includes("api") ||
    p.includes("développement") ||
    p.includes("solidity")
  ) {
    return "DEVELOPMENT_CODE";
  }

  if (
    p.includes("productivité") ||
    p.includes("temps") ||
    p.includes("organisation") ||
    p.includes("habitudes") ||
    p.includes("mindset") ||
    p.includes("motivation")
  ) {
    return "PRODUCTIVITY_PERSONAL";
  }

  return "GENERAL";
}

/**
 * Generates rich HTML lesson content tailored to the requested topic without generic coding snippets.
 */
export function generateSmartLessonHtml(topic: string): string {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();
  const category = detectCategory(cleanTopic);

  switch (category) {
    case "ENTREPRENEURSHIP":
      return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction et Enjeux : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>L'aventure entrepreneuriale et la maîtrise de <strong>${cleanTopic}</strong> constituent le moteur de l'innovation économique. Entreprendre ne consiste pas uniquement à créer une entité légale, c'est avant tout identifier un problème douloureux sur le marché et y apporter une solution viable et scalable.</p>
  <p>Dans ce module, nous explorerons les fondamentaux méthodologiques pour transformer une idée brute en proposition de valeur concrète et rentable.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>💡 Règle d'or de l'entrepreneur :</strong> « Tombez amoureux du problème de vos clients, pas de votre solution. » La validation marché prime sur tout le reste.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Les 4 Étapes Clés de la Démarche</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <ol class="list-decimal pl-5 space-y-2">
    <li><strong>Identification du Besoin (Pain Point) :</strong> Observer les frictions quotidiennes rencontrées par une cible bien définie.</li>
    <li><strong>Création du MVP (Minimum Viable Product) :</strong> Concevoir la version la plus simple de votre produit/service pour tester l'intérêt réel des utilisateurs.</li>
    <li><strong>Mesure &amp; Feedback :</strong> Récolter les avis des premiers clients (early adopters) et itérer rapidement sur votre offre.</li>
    <li><strong>Modèle Économique &amp; Monétisation :</strong> Définir clairement comment votre entreprise capte de la valeur (abonnements, ventes directes, commissions).</li>
  </ol>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Cas Pratique : Étude de Validation sur le Terrain</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Imaginons un projet centré sur <em>${cleanTopic}</em> :</p>
  <p>Avant d'investir des fonds importants, l'équipe réalise 20 entretiens qualitatifs auprès de prospects cibles. Résultat : 80% confirment perdre du temps sur cette tâche chaque semaine, et 60% sont prêts à précommander un service adapté. C'est le signal vert pour lancer le prototype !</p>
</div>

<div data-block-type="info" data-style="warning" class="my-4 p-4 rounded-2xl border text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
  <strong>⚠️ Piège à éviter :</strong> Ne dépensez pas des mois à perfectionner un produit dans votre bureau sans avoir confronté votre offre à de vrais clients payants dès la première semaine.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">4. Plan d'Action Immédiat</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Pour mettre en pratique cette leçon dès aujourd'hui :</p>
  <ul class="list-disc pl-5 space-y-1">
    <li>Rédigez votre proposition de valeur en une seule phrase percutante.</li>
    <li>Listez vos 3 principaux segments de clients potentiels.</li>
    <li>Passez au quiz d'évaluation pour valider votre assimilation des concepts.</li>
  </ul>
</div>`;

    case "TRADING_FINANCE":
      return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction au Marché : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Le trading et la finance de marché autour de <strong>${cleanTopic}</strong> requièrent une discipline rigoureuse, une méthode analytique éprouvée et une gestion stricte du risque.</p>
  <p>L'objectif d'un opérateur de marché n'est pas d'avoir raison à 100%, mais de maximiser ses gains lors des tendances favorables tout en coupant strictement ses pertes.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>📈 Principe Clé :</strong> Le Risk Management (gestion du risque) représente 80% du succès à long terme. Ne risquez jamais plus de 1% à 2% de votre capital total par position.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Méthodologie et Analyse Technique</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Pour bâtir une stratégie solide sur <strong>${cleanTopic}</strong>, appliquez la structure suivante :</p>
  <ul>
    <li><strong>Identification de la Tendance de Fond :</strong> Analyser les unités de temps supérieures (Daily / 4H) pour repérer la direction globale.</li>
    <li><strong>Zones de Liquidité &amp; Niveaux Clés :</strong> Tracer les supports, résistances et zones d'accumulation.</li>
    <li><strong>Signal d'Entrée &amp; Ratio Risk/Reward :</strong> N'entrer en position que si le ratio potentiel de gain sur risque est supérieur ou égal à 1:2.</li>
  </ul>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Exemple de Configuration de Trade</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Exemple de plan d'exécution :</p>
  <ul>
    <li><strong>Point d'Entrée :</strong> Rebond confirmé sur support majeur avec divergence haussière RSI.</li>
    <li><strong>Stop-Loss (Protection) :</strong> Positionné juste en dessous du dernier creux technique (invalidation du scénario).</li>
    <li><strong>Take-Profit (Objectifs) :</strong> Palier 1 à +3% (prise de 50% de bénéfices) et Palier 2 sur la résistance suivante.</li>
  </ul>
</div>

<div data-block-type="info" data-style="warning" class="my-4 p-4 rounded-2xl border text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
  <strong>⚠️ Avertissement :</strong> Évitez le sur-levier (over-leverage) et ne tradez jamais sous le coup de l'émotion (FOMO ou Revenge Trading).
</div>`;

    case "BLOCKCHAIN_CRYPTO":
      return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction et Décentralisation : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>La technologie Blockchain et les protocoles liés à <strong>${cleanTopic}</strong> révolutionnent la manière dont la valeur, la confiance et les données sont échangées à l'échelle mondiale sans intermédiaire central.</p>
  <p>Ce module détaille le fonctionnement sous-jacent, les garanties cryptographiques et les applications concrètes de cette technologie.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>🔐 Principe Fondamental :</strong> L'immutabilité et la transparence du registre distribué permettent de vérifier chaque transaction de façon autonome et inviolable.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Architecture et Fonctionnement du Protocole</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Comprendre <strong>${cleanTopic}</strong> implique de maîtriser trois composants essentiels :</p>
  <ul>
    <li><strong>Le Consensus :</strong> L'algorithme (PoW, PoS) qui permet aux nœuds du réseau de s'accorder sur l'état valide du registre.</li>
    <li><strong>La Cryptographie Asymétrique :</strong> L'utilisation de paires de clés publiques et privées garantissant la propriété exclusive des actifs.</li>
    <li><strong>Les Smart Contracts :</strong> Des programmes autonomes qui s'exécutent automatiquement lorsque des conditions prédéfinies sont remplies.</li>
  </ul>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Cas d'Usage et Applications Pratiques</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Parmi les applications concrètes dans l'écosystème :</p>
  <ul>
    <li><strong>Paiements transfrontaliers instantanés</strong> avec des frais minimes via stablecoins (USDC/USDT).</li>
    <li><strong>Finance Décentralisée (DeFi) :</strong> Prêts, emprunts et génération de rendements sans passer par une banque traditionnelle.</li>
    <li><strong>Traçabilité et Certification :</strong> Horodatage infalsifiable de diplômes, titres de propriété et chaînes d'approvisionnement.</li>
  </ul>
</div>

<div data-block-type="info" data-style="warning" class="my-4 p-4 rounded-2xl border text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
  <strong>⚠️ Règle de Sécurité :</strong> « Not your keys, not your coins ». Ne partagez jamais votre phrase de récupération (Seed Phrase / Clé privée) avec qui que ce soit.
</div>`;

    case "DEVELOPMENT_CODE":
      return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction Technique : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Dans ce module pratique dédié au développement de <strong>${cleanTopic}</strong>, vous allez apprendre à concevoir une architecture logicielle robuste, propre et maintenable.</p>
  <p>Nous couvrirons les concepts théoriques, l'organisation des modules et les bonnes pratiques de programmation indispensables en environnement de production.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>💻 Bonne Pratique :</strong> Favorisez la modularité, le typage strict et la séparation des responsabilités (Clean Code) pour faciliter l'évolution de votre codebase.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Structure et Implémentation Pas à Pas</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Voici un exemple structuré illustrant la logique de mise en œuvre :</p>
  <pre class="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto my-3"><code>// Exemple de structure appliquée à : ${cleanTopic}
export async function executeProcess(config: { enabled: boolean }) {
  if (!config.enabled) {
    throw new Error("Module désactivé");
  }

  // Traitement et validation des données
  const result = {
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    topic: "${cleanTopic}"
  };

  return result;
}</code></pre>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Tests, Validation et Optimisation</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Avant tout déploiement :</p>
  <ul>
    <li>Écrivez des tests unitaires pour valider les cas limites (Edge cases).</li>
    <li>Optimisez les requêtes asynchrones et la gestion du cache pour réduire le temps de réponse.</li>
    <li>Documentez vos fonctions publiques et endpoints d'API.</li>
  </ul>
</div>`;

    default:
      return `<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">1. Introduction et Objectifs : ${cleanTopic}</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Bienvenue dans cette leçon consacrée à <strong>${cleanTopic}</strong>. Dans ce chapitre, nous allons détailler les principes fondamentaux, les méthodologies de travail et les applications directes pour développer votre expertise.</p>
  <p>À la fin de cette leçon, vous aurez acquis une compréhension claire des enjeux et saurez comment appliquer ces connaissances dans vos projets.</p>
</div>

<div data-block-type="info" data-style="info" class="my-4 p-4 rounded-2xl border text-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
  <strong>🎯 Objectif Pédagogique :</strong> Assimiler les bases essentielles de <em>${cleanTopic}</em> et réussir l'évaluation de fin de module avec un score supérieur à 70%.
</div>

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">2. Concepts Clés et Méthodologie</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>Pour aborder efficacement cette thématique, nous structurons notre analyse en 3 piliers :</p>
  <ul>
    <li><strong>Le Contexte :</strong> Pourquoi cette notion est devenue incontournable dans le domaine.</li>
    <li><strong>La Méthode :</strong> Les étapes chronologiques pour structurer et exécuter votre démarche.</li>
    <li><strong>Les Résultats :</strong> Les indicateurs mesurables permettant d'évaluer le succès de votre approche.</li>
  </ul>
</div>

<hr data-block-type="separator" class="my-8 border-zinc-200 dark:border-zinc-800" />

<h2 data-block-type="title" data-level="2" class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-white">3. Étude de Cas et Recommandations Pratiques</h2>
<div data-block-type="text" class="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 my-3">
  <p>L'observation du terrain montre que les apprenants qui mettent immédiatement en pratique les notions enseignées obtiennent un taux de rétention de 75% supérieur à la simple lecture passive.</p>
  <p>Prenez des notes, testez les exemples et partagez vos retours avec votre formateur ou votre communauté.</p>
</div>

<div data-block-type="info" data-style="warning" class="my-4 p-4 rounded-2xl border text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
  <strong>💡 Conseil de l'instructeur :</strong> N'hésitez pas à relire les points essentiels avant de passer au quiz d'évaluation pour consolider vos acquis.
</div>`;
  }
}

/**
 * Generates a realistic, pedagogical quiz structure with multiple questions tailored to the topic.
 */
export function generateSmartQuiz(topic: string, count: number = 5, difficulty: string = "MOYEN") {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();
  const category = detectCategory(cleanTopic);

  let questionTemplates: Array<{
    text: string;
    explanation: string;
    options: Array<{ text: string; isCorrect: boolean; explanation: string }>;
  }> = [];

  if (category === "ENTREPRENEURSHIP") {
    questionTemplates = [
      {
        text: `Quelle est la première étape indispensable lors de la création d'un projet sur "${cleanTopic}" ?`,
        explanation: "La validation du besoin client avant toute dépense lourde est la clé pour éviter l'échec.",
        options: [
          { text: "Identifier un problème réel et valider l'intérêt auprès de clients potentiels", isCorrect: true, explanation: "Exact ! C'est la base de tout modèle entrepreneurial viable." },
          { text: "Louer immédiatement des bureaux coûteux", isCorrect: false, explanation: "Non, cela génère des charges fixes inutiles au démarrage." },
          { text: "Développer le produit complet pendant 1 an sans parler à aucun utilisateur", isCorrect: false, explanation: "Erreur fréquente appelée effet tunnel." },
          { text: "Dépenser tout son budget en campagnes publicitaires sans produit", isCorrect: false, explanation: "Incorrect et inefficace." },
        ],
      },
      {
        text: `Que désigne le concept de "MVP" (Minimum Viable Product) dans le cadre de "${cleanTopic}" ?`,
        explanation: "Le MVP permet de tester rapidement des hypothèses avec le minimum de ressources.",
        options: [
          { text: "La version la plus simple d'un produit permettant de tester le marché avec un coût minimal", isCorrect: true, explanation: "Bravo ! C'est la définition exacte selon la méthode Lean Startup." },
          { text: "Un produit parfait qui ne nécessite plus aucune amélioration future", isCorrect: false, explanation: "Faux, le MVP est voué à évoluer continuellement." },
          { text: "Une simple présentation PowerPoint sans aucune utilité réelle", isCorrect: false, explanation: "Non, un MVP doit apporter une valeur minimale concrète." },
          { text: "Le brevet juridique déposé avant d'avoir des clients", isCorrect: false, explanation: "Incorrect." },
        ],
      },
      {
        text: `Quel indicateur montre qu'une offre liée à "${cleanTopic}" atteint le "Product-Market Fit" ?`,
        explanation: "Le Product-Market Fit se caractérise par une forte rétention et une demande organique croissante.",
        options: [
          { text: "Les clients utilisent régulièrement le produit, le recommandent et sont prêts à payer", isCorrect: true, explanation: "Exact ! C'est le signal que l'offre répond parfaitement au besoin." },
          { text: "Avoir 10 000 likes sur une publication sans aucune vente", isCorrect: false, explanation: "Les métriques de vanité ne prouvent pas la viabilité d'un business." },
          { text: "Avoir un logo très esthétique", isCorrect: false, explanation: "Non lié au Product-Market Fit." },
          { text: "L'absence totale de concurrents sur le marché", isCorrect: false, explanation: "L'absence totale de concurrents indique souvent l'absence de marché." },
        ],
      },
      {
        text: `Face à des retours négatifs ou mitigés des premiers utilisateurs sur "${cleanTopic}", quelle attitude adopter ?`,
        explanation: "L'écoute active et la capacité d'adaptation (pivot) font le succès d'un entrepreneur.",
        options: [
          { text: "Analyser les critiques de manière constructive pour itérer et améliorer l'offre", isCorrect: true, explanation: "Excellente réponse ! L'itération rapide fait la différence." },
          { text: "Ignorer les clients en estimant qu'ils ne comprennent pas le génie de l'idée", isCorrect: false, explanation: "Attitude néfaste menant à l'échec." },
          { text: "Abandonner définitivement tout projet au premier obstacle", isCorrect: false, explanation: "Non, la résilience est essentielle." },
          { text: "Bloquer les utilisateurs qui formulent des remarques", isCorrect: false, explanation: "Inacceptable dans une relation commerciale." },
        ],
      },
    ];
  } else if (category === "TRADING_FINANCE") {
    questionTemplates = [
      {
        text: `Dans une stratégie appliquée à "${cleanTopic}", quelle règle de gestion du risque est primordiale ?`,
        explanation: "La préservation du capital est la règle numéro 1 de tout trader rentable.",
        options: [
          { text: "Définir systématiquement un Stop-Loss et ne pas risquer plus de 1% à 2% de son capital par trade", isCorrect: true, explanation: "Exactement ! Cela protège contre les séries de pertes." },
          { text: "Mettre tout son capital sur une seule position en levier maximal", isCorrect: false, explanation: "C'est du jeu de hasard pur qui mène à la liquidation." },
          { text: "Refuser de couper une position perdante en espérant un retournement", isCorrect: false, explanation: "Très dangereux, cause principale de perte de compte." },
          { text: "Trader uniquement sur les conseils d'anonymes sur les réseaux sociaux", isCorrect: false, explanation: "Absence totale de rigueur et de gestion de risque." },
        ],
      },
      {
        text: `Que représente le ratio Risk/Reward (Risque/Rendement) dans le contexte de "${cleanTopic}" ?`,
        explanation: "Un bon ratio garantit d'être rentable même avec un taux de réussite modéré.",
        options: [
          { text: "Le rapport entre la perte maximale acceptée et le gain potentiel espéré sur la position", isCorrect: true, explanation: "Correct ! Un ratio 1:2 ou 1:3 est généralement recommandé." },
          { text: "Le nombre total de trades effectués dans la journée", isCorrect: false, explanation: "Non, c'est le volume d'activité." },
          { text: "Le montant des commissions payées au courtier", isCorrect: false, explanation: "Incorrect." },
          { text: "Le pourcentage de batterie restant sur l'ordinateur", isCorrect: false, explanation: "Non pertinent." },
        ],
      },
    ];
  } else {
    questionTemplates = [
      {
        text: `Quel est l'objectif fondamental abordé dans "${cleanTopic}" ?`,
        explanation: `Comprendre le rôle central de ${cleanTopic} permet de structurer efficacement la suite de l'apprentissage.`,
        options: [
          { text: `Permettre une assimilation claire, méthodique et pratique des notions de ${cleanTopic}`, isCorrect: true, explanation: "Exact ! C'est la finalité pédagogique première." },
          { text: "Ignorer les étapes de validation initiale pour aller plus vite", isCorrect: false, explanation: "Incorrect, les fondations sont indispensables." },
          { text: "Remplacer l'apprentissage par de la simple théorie sans mise en pratique", isCorrect: false, explanation: "Faux, la pratique est essentielle." },
          { text: "Aucune de ces réponses", isCorrect: false, explanation: "La première option est correcte." },
        ],
      },
      {
        text: `Quelle est la meilleure approche recommandée pour réussir dans "${cleanTopic}" ?`,
        explanation: "La régularité et l'application des bonnes pratiques garantissent les meilleurs résultats.",
        options: [
          { text: "Appliquer chaque concept étape par étape avec des exercices pratiques réels", isCorrect: true, explanation: "Bravo ! C'est la méthode d'apprentissage la plus efficace." },
          { text: "Sauter les notions de base et commencer par les aspects les plus complexes", isCorrect: false, explanation: "Non recommandé, risque de confusion élevé." },
          { text: "Ne jamais réviser les notions précédentes", isCorrect: false, explanation: "Incorrect." },
          { text: "Attendre la fin de la formation sans jamais s'exercer", isCorrect: false, explanation: "Déconseillé." },
        ],
      },
      {
        text: `Quel bénéfice concret apporte la maîtrise de "${cleanTopic}" ?`,
        explanation: "La montée en compétences permet d'atteindre des résultats concrets et mesurables.",
        options: [
          { text: "Une autonomie accrue, une meilleure prise de décision et des résultats professionnels concrets", isCorrect: true, explanation: "Exactement ! C'est l'impact direct de la formation." },
          { text: "Une perte de temps sans avantage mesurable", isCorrect: false, explanation: "Faux, les compétences acquises sont valorisables." },
          { text: "L'obligation de tout recommencer à zéro", isCorrect: false, explanation: "Incorrect." },
          { text: "Une dépendance continue aux intermédiaires", isCorrect: false, explanation: "Non, la formation favorise l'autonomie." },
        ],
      },
    ];
  }

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
 * Generates a full course structure with modules and lessons tailored to the specific topic.
 */
export function generateSmartCourseStructure(topic: string, numChapters: number = 3) {
  const cleanTopic = topic.replace(/^["']|["']$/g, "").trim();
  const category = detectCategory(cleanTopic);
  const count = Math.min(Math.max(1, numChapters), 8);

  let defaultChapters: Array<{
    title: string;
    lessons: Array<{ title: string; duration_minutes: number }>;
  }> = [];

  if (category === "ENTREPRENEURSHIP") {
    defaultChapters = [
      {
        title: `Module 1 : Idéation et Validation du Marché (${cleanTopic})`,
        lessons: [
          { title: "Comprendre les besoins réels de vos clients cibles", duration_minutes: 15 },
          { title: "Étude concurrentielle et positionnement unique", duration_minutes: 20 },
          { title: "Formuler une proposition de valeur irrésistible", duration_minutes: 25 },
        ],
      },
      {
        title: `Module 2 : Création de l'Offre et Lancement du MVP`,
        lessons: [
          { title: "Concevoir votre produit minimum viable (MVP)", duration_minutes: 25 },
          { title: "Fixation des prix (Pricing) et modèle de revenus", duration_minutes: 20 },
          { title: "Obtenir vos 10 premiers clients payants", duration_minutes: 30 },
        ],
      },
      {
        title: `Module 3 : Stratégies de Croissance et Scaling`,
        lessons: [
          { title: "Mise en place des canaux d'acquisition client", duration_minutes: 25 },
          { title: "Optimisation de la rétention et satisfaction client", duration_minutes: 20 },
          { title: "Gestion financière, trésorerie et passage à l'échelle", duration_minutes: 30 },
        ],
      },
    ];
  } else if (category === "TRADING_FINANCE") {
    defaultChapters = [
      {
        title: `Module 1 : Fondations des Marchés et Analyse Technique`,
        lessons: [
          { title: "Structure du marché, chandeliers japonais et tendances", duration_minutes: 20 },
          { title: "Supports, résistances et zones de liquidité", duration_minutes: 25 },
          { title: "Les indicateurs clés : RSI, moyennes mobiles et volumes", duration_minutes: 20 },
        ],
      },
      {
        title: `Module 2 : Stratégies d'Entrée et Gestion du Risque`,
        lessons: [
          { title: "Calcul de taille de position et règle des 1%", duration_minutes: 25 },
          { title: "Placement chirurgical du Stop-Loss et Take-Profit", duration_minutes: 30 },
          { title: "Création de votre plan de trading écrit", duration_minutes: 25 },
        ],
      },
      {
        title: `Module 3 : Psychologie et Discipline du Trader`,
        lessons: [
          { title: "Maîtriser ses émotions face aux pertes et gains", duration_minutes: 20 },
          { title: "Tenir un journal de trading pour progresser", duration_minutes: 20 },
          { title: "Évaluation finale et plan d'action capitalisé", duration_minutes: 30 },
        ],
      },
    ];
  } else {
    defaultChapters = [
      {
        title: `Module 1 : Introduction et Fondations de ${cleanTopic}`,
        lessons: [
          { title: `Découverte et concepts clés sur ${cleanTopic}`, duration_minutes: 15 },
          { title: "Vocabulaire essentiel et cadre de travail", duration_minutes: 20 },
          { title: "Première mise en situation pratique", duration_minutes: 25 },
        ],
      },
      {
        title: `Module 2 : Méthodes Pratiques et Cas Concrets`,
        lessons: [
          { title: "Mise en œuvre détaillée étape par étape", duration_minutes: 30 },
          { title: "Analyse des pièges courants et bonnes pratiques", duration_minutes: 25 },
          { title: "Atelier guidé et résolution de cas réel", duration_minutes: 25 },
        ],
      },
      {
        title: `Module 3 : Maîtrise Avancée et Certification`,
        lessons: [
          { title: "Optimisation et perfectionnement des résultats", duration_minutes: 25 },
          { title: "Synthèse générale des acquis", duration_minutes: 20 },
          { title: "Préparation et passage de l'évaluation finale", duration_minutes: 30 },
        ],
      },
    ];
  }

  const result: any[] = [];
  for (let i = 0; i < count; i++) {
    if (defaultChapters[i]) {
      result.push(defaultChapters[i]);
    } else {
      result.push({
        title: `Module ${i + 1} : Approfondissement et Maîtrise (${cleanTopic})`,
        lessons: [
          { title: `Atelier pratique partie ${i + 1}.1`, duration_minutes: 20 },
          { title: `Cas d'application professionnelle partie ${i + 1}.2`, duration_minutes: 25 },
          { title: `Validation et synthèse des acquis`, duration_minutes: 15 },
        ],
      });
    }
  }

  return result;
}
