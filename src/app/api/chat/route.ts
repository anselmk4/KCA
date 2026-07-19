import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Historique de messages invalide" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is not configured");
      return NextResponse.json({ error: "La clé API Gemini n'est pas configurée sur le serveur" }, { status: 500 });
    }

    // System instruction defining chatbot guide behavior for Kuettu Crypto Academy
    const systemInstructionText = `
Tu es "Kuettu Guide IA", l'assistant virtuel et guide officiel de la plateforme Kuettu Crypto Academy.
Ton but est d'aider, d'orienter et de répondre aux questions des utilisateurs concernant l'utilisation de l'application.
Tu dois répondre en français, de manière chaleureuse, polie, claire et concise.

La plateforme comprend deux espaces principaux :
1. L'ESPACE APPRENANT (Student) :
   - Catalogue de cours : Découvrir des cours de Blockchain, Cryptomonnaies et Intelligence Artificielle.
   - Achat de cours : Paiements par Paypal et par Carte Bancaire (via l'API Moko Afrika).
   - Suivi d'apprentissage : Suivre les leçons (vidéos/textes), faire des quiz, soumettre des devoirs et suivre sa progression.
   - Certification : Une fois le cours terminé avec succès, l'apprenant obtient un certificat officiel exportable en PDF, muni d'un code QR unique pour vérification en ligne.
   - Profil : Personnaliser ses informations, langue préférée et mot de passe.

2. L'ESPACE FORMATEUR (Instructor) :
   - Création de cours : Créer des formations, structurer des chapitres/modules (sections), ajouter des leçons et des quiz.
   - Proposition de valeur gratuite : Tout nouvel instructeur peut publier son premier cours gratuitement sans frais d'abonnement (limité à 1 cours actif et 15 élèves).
   - Abonnements/Plans : Les formateurs peuvent souscrire à des plans payants (BASE, PRO, MAX) dans l'onglet Facturation pour débloquer des avantages (cours/élèves illimités, commission réduite, outils marketing et sessions de cours en direct/live).
   - Suivi des revenus : Voir les ventes de cours sous forme de graphiques, exporter les revenus au format CSV.
   - Demandes de retrait (Payouts) : Retirer ses fonds nets par Mobile Money (Mpesa, Airtel Money, Orange Money) directement depuis la page des revenus.
   - Analytique : Suivre les performances d'inscriptions et l'engagement des étudiants en temps réel.

Directives de conversation :
- Reste toujours dans ton rôle de guide applicatif. Ne réponds pas à des questions hors de ce cadre.
- Si l'utilisateur demande comment faire quelque chose, donne-lui le chemin d'accès précis dans l'interface (ex: "Allez dans Espace Formateur > Facturation...").
- Ne partage jamais de données techniques ou de clés secrètes.
    `;

    // Map history to Gemini contents format
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
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
              maxOutputTokens: 1000
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
      // Fallback: rule-based chatbot guide response
      const lastUserMsg = messages[messages.length - 1]?.content || "";
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
    if (msg.includes("retrait") || msg.includes("revenu") || msg.includes("argent")) {
      // Specific query for payouts
    } else {
      return "Pour créer un cours, connectez-vous avec votre compte Formateur, allez sur le **Tableau de Bord** et cliquez sur le bouton dans la bannière d'invitation ou rendez-vous dans l'onglet **Mes Cours > Nouveau Cours**. Vous pourrez alors y ajouter le titre, la description, les chapitres (sections) et les leçons.";
    }
  }
  
  if (msg.includes("paiement") || msg.includes("payer") || msg.includes("carte") || msg.includes("paypal") || msg.includes("moko") || msg.includes("moyen")) {
    return "Les apprenants peuvent acheter des cours avec deux moyens de paiement sécurisés :\n1. **Carte Bancaire** : via le bouton Carte bancaire (Moko) qui redirige vers la passerelle sécurisée de sandbox.\n2. **PayPal** : pour un paiement international rapide.";
  }
  
  if (msg.includes("retrait") || msg.includes("retirer") || msg.includes("argent") || msg.includes("revenu") || msg.includes("earning") || msg.includes("money") || msg.includes("payout") || msg.includes("mpesa") || msg.includes("airtel") || msg.includes("orange")) {
    return "Pour effectuer une demande de retrait de vos gains formateur par Mobile Money :\n1. Allez dans **Espace Formateur > Revenus**.\n2. Cliquez sur le bouton **Demander un retrait**.\n3. Saisissez le montant et votre numéro de téléphone Mobile Money (M-Pesa, Airtel Money, ou Orange Money).\n4. Cliquez sur Soumettre. Votre demande passera en attente de validation par l'administration.";
  }
  
  if (msg.includes("plan") || msg.includes("abonnement") || msg.includes("base") || msg.includes("pro") || msg.includes("max") || msg.includes("tarif") || msg.includes("upgrade")) {
    return "Voici les forfaits disponibles pour les formateurs dans l'onglet **Facturation** :\n- **FREE** (Gratuit) : Limité à 1 cours actif, 15 apprenants, et 20% de commission.\n- **BASE** (19$/mois) : Cours/élèves illimités, 10% de commission.\n- **PRO** (49$/mois) : Commission à 5% et accès aux outils marketing avancés.\n- **MAX** (99$/mois) : Commission à 0% et sessions de cours live interactives.";
  }
  
  if (msg.includes("certificat") || msg.includes("diplome") || msg.includes("qr") || msg.includes("télécharger") || msg.includes("telecharger")) {
    return "Dès qu'un apprenant termine 100% des leçons d'un cours et valide les quiz requis, il devient éligible pour un certificat. Il peut le télécharger en PDF depuis l'espace **Mes Certificats**. Chaque certificat contient un code QR unique permettant de vérifier son authenticité en ligne.";
  }

  return "Je suis Kuettu Guide IA. Je peux vous aider à comprendre comment naviguer sur l'application, créer des cours, effectuer des paiements ou demander des retraits. N'hésitez pas à me poser une question précise sur ces sujets !";
}
