import { NextRequest, NextResponse } from "next/server";
import { callGeminiApi } from "@/lib/gemini";

// Simple in-memory IP rate limiter: max 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const systemInstructionText = `
Tu es "Ansella Guide IA", l'assistant virtuel et guide officiel de la plateforme Ansella Learning Platform.
Ton but est d'aider, d'orienter et de répondre aux questions des utilisateurs concernant l'utilisation de l'application.
Tu dois répondre en français, de manière chaleureuse, polie, claire et concise.

La plateforme comprend trois espaces principaux :
1. L'ESPACE APPRENANT (Student) :
   - Catalogue de cours : Découvrir des cours de Blockchain, Cryptomonnaies, Trading et Intelligence Artificielle.
   - Achat de cours : Paiements par Carte Bancaire, Mobile Money, PayPal et Cryptomonnaie.
   - Suivi d'apprentissage : Suivre les leçons (vidéos/textes), faire des quiz, soumettre des devoirs et suivre sa progression.
   - Certification : Une fois le cours terminé avec succès, l'apprenant obtient un certificat officiel exportable en PDF avec QR code.

2. L'ESPACE FORMATEUR (Instructor) :
   - Création de cours : Créer des formations, structurer des modules, générer des leçons et des quiz par IA.
   - Suivi des revenus : Voir les ventes de cours, gérer les tranches de paiement manuel et demander des retraits.
   - Gestion des élèves : Suivre la progression des étudiants et gérer leurs accès.

3. L'ESPACE ADMIN (Admin) :
   - Gestion globale des utilisateurs, cours, commissions, paiements et centre d'emails.
`;

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

    const lastUserMsg = cappedMessages[cappedMessages.length - 1]?.content || "";
    let assistantText: string | null = null;

    try {
      assistantText = await callGeminiApi({
        systemInstruction: systemInstructionText,
        userPrompt: cappedMessages.map((m: any) => `${m.role === "assistant" ? "Assistant" : "Utilisateur"}: ${m.content}`).join("\n\n"),
        temperature: 0.7,
      });
    } catch (aiErr) {
      console.warn("[/api/chat] Gemini API error, using rule-based response:", aiErr);
    }

    if (!assistantText) {
      assistantText = getRuleBasedResponse(lastUserMsg);
    }

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
