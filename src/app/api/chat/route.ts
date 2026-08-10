import { NextRequest, NextResponse } from "next/server";

// Simple in-memory IP rate limiter: max 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate limit check
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de requêtes envoyées à l'assistant. Veuillez patienter une minute avant de réessayer." },
        { status: 429 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Historique de messages invalide" }, { status: 400 });
    }

    // Limit history length to prevent huge token consumption
    const cappedMessages = messages.slice(-10);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key is not configured, using rule-based guide fallback");
      const lastUserMsg = cappedMessages[cappedMessages.length - 1]?.content || "";
      const text = getRuleBasedResponse(lastUserMsg);
      return NextResponse.json({ text });
    }

    // System instruction defining chatbot guide behavior for Kuettu Crypto Academy
    const systemInstructionText = `
Tu es "Kuettu Guide IA", l'assistant virtuel et guide officiel de la plateforme Kuettu Crypto Academy.
Ton but est d'aider, d'orienter et de répondre aux questions des utilisateurs concernant l'utilisation de l'application.
Tu dois répondre en français, de manière chaleureuse, polie, claire et concise.

La plateforme comprend deux espaces principaux :
1. L'ESPACE APPRENANT (Student) :
   - Catalogue de cours : Découvrir des cours de Blockchain, Cryptomonnaies et Intelligence Artificielle.
   - Achat de cours : Paiements par Paypal, Carte Bancaire et Cryptomonnaie.
   - Suivi d'apprentissage : Suivre les leçons (vidéos/textes), faire des quiz, soumettre des devoirs et suivre sa progression.
   - Certification : Une fois le cours terminé avec succès, l'apprenant obtient un certificat officiel exportable en PDF, muni d'un code QR unique pour vérification en ligne.
   - Profil : Personnaliser ses informations, langue préférée et mot de passe.

2. L'ESPACE FORMATEUR (Instructor) :
   - Création de cours : Créer des formations, structurer des chapitres/modules (sections), ajouter des leçons et des quiz.
   - Proposition de valeur gratuite : Tout nouvel instructeur peut publier son premier cours gratuitement sans frais d'abonnement.
   - Abonnements/Plans : Les formateurs peuvent souscrire à des plans payants (BASE, PRO, MAX) dans l'onglet Facturation pour débloquer des avantages.
   - Suivi des revenus : Voir les ventes de cours sous forme de graphiques, exporter les revenus au format CSV.
   - Demandes de retrait (Payouts) : Retirer ses fonds nets par Mobile Money.
   - Analytique : Suivre les performances d'inscriptions et l'engagement des étudiants en temps réel.

Directives de conversation :
- Reste toujours dans ton rôle de guide applicatif. Ne réponds pas à des questions hors de ce cadre.
- Si l'utilisateur demande comment faire quelque chose, donne-lui le chemin d'accès précis dans l'interface.
- Ne partage jamais de données techniques internes ou de clés secrètes.
    `;

    // Map history to Gemini contents format
    const contents = cappedMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1000) }]
    }));

    let response;
    let fallbackNeeded = false;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn("Gemini API access denied or error:", errText);
        fallbackNeeded = true;
      }
    } catch (fetchErr) {
      console.warn("Gemini fetch error, activating local guide fallback:", fetchErr);
      fallbackNeeded = true;
    }

    if (fallbackNeeded || !response) {
      const lastUserMsg = cappedMessages[cappedMessages.length - 1]?.content || "";
      const text = getRuleBasedResponse(lastUserMsg);
      return NextResponse.json({ text });
    }

    const resData = await response.json();
    const assistantText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse.";

    return NextResponse.json({ text: assistantText });

  } catch (err: any) {
    console.error("Error in /api/chat handler:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne de traitement" }, { status: 500 });
  }
}

function getRuleBasedResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes("créer") || msg.includes("creer") || msg.includes("création") || msg.includes("creation") || msg.includes("cours")) {
    if (!msg.includes("retrait") && !msg.includes("revenu") && !msg.includes("argent")) {
      return "Pour créer un cours, connectez-vous avec votre compte Formateur, allez sur le **Tableau de Bord** et cliquez sur **Mes Cours > Nouveau Cours**. Vous pourrez alors y ajouter le titre, la description, les modules et les leçons.";
    }
  }
  
  if (msg.includes("paiement") || msg.includes("payer") || msg.includes("carte") || msg.includes("paypal") || msg.includes("moko") || msg.includes("moyen")) {
    return "Les apprenants peuvent acheter des cours avec plusieurs moyens de paiement sécurisés :\n1. **Carte Bancaire** / **Mobile Money**\n2. **PayPal**\n3. **Cryptomonnaie** (USDC Solana & Bitcoin).";
  }
  
  if (msg.includes("retrait") || msg.includes("retirer") || msg.includes("argent") || msg.includes("revenu") || msg.includes("earning") || msg.includes("money") || msg.includes("payout") || msg.includes("mpesa") || msg.includes("airtel") || msg.includes("orange")) {
    return "Pour effectuer une demande de retrait de vos gains formateur :\n1. Allez dans **Espace Formateur > Revenus**.\n2. Cliquez sur le bouton **Demander un retrait**.\n3. Saisissez le montant et votre numéro Mobile Money.\n4. Cliquez sur Soumettre.";
  }
  
  if (msg.includes("plan") || msg.includes("abonnement") || msg.includes("base") || msg.includes("pro") || msg.includes("max") || msg.includes("tarif") || msg.includes("upgrade")) {
    return "Voici les forfaits formateur disponibles dans l'onglet **Facturation** :\n- **FREE** (Gratuit) : 1 cours actif, 15 apprenants, 20% commission.\n- **BASE** (19$/mois) : Cours/élèves illimités, 10% commission.\n- **PRO** (49$/mois) : Commission à 5% et outils marketing.\n- **MAX** (99$/mois) : Commission à 0% et sessions live.";
  }
  
  if (msg.includes("certificat") || msg.includes("diplome") || msg.includes("qr") || msg.includes("télécharger") || msg.includes("telecharger")) {
    return "Dès qu'un apprenant valide toutes les leçons et les quiz requis, il peut télécharger son certificat officiel en PDF avec code QR de vérification depuis **Mes Certificats**.";
  }

  return "Je suis Kuettu Guide IA. Je peux vous aider à naviguer sur la plateforme, créer des cours, effectuer des paiements ou demander des retraits. Posez-moi votre question !";
}
