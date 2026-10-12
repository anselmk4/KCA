import fs from "node:fs";
import path from "node:path";

// 1. Charger les variables d'environnement (.env.local puis .env)
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ansella Learning Platform <noreply@ansella.app>";

function getEmailTemplate(title, bodyContent) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .top-bar { height: 4px; background: #0d9488; }
    .content { padding: 32px; color: #374151; font-size: 15px; line-height: 1.65; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-bar"></div>
    <div class="content">
      ${bodyContent}
    </div>
  </div>
</body>
</html>
  `;
}

async function writeMockEmailFile(recipient, subject, html) {
  const outputDir = path.join(process.cwd(), "scratch", "sent-emails");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const cleanEmail = recipient.replace(/[^a-zA-Z0-9@.]/g, "_");
  const filename = `${Date.now()}_to_${cleanEmail}_announcement.html`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, html, "utf8");
  return filepath;
}

async function sendAnnouncement(email, name) {
  const subject = "🚀 Nouveauté Formateurs : Vendez vos E-books, Logiciels & Ressources sur ANSELLA !";
  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #ccfbf1; color: #0f766e; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #99f6e4;">
        🚀 Nouvelle Fonctionnalité Formateurs
      </span>
    </div>

    <h2>Vendez vos E-books, Logiciels & Ressources Numériques sur ANSELLA !</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Nous avons une excellente nouvelle pour vous ! Afin de décupler vos opportunités de monétisation, ANSELLA lance aujourd'hui la <strong>Boutique de Produits Digitaux</strong> pour tous les formateurs et créateurs certifiés.</p>
    
    <p>Désormais, <strong>au-delà de vos formations et cours traditionnels</strong>, vous pouvez publier et vendre immédiatement des ressources numériques téléchargeables :</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 20px 0; border-left: 5px solid #14b8a6;">
      <ul style="margin: 0; padding-left: 20px; color: #134e4a; font-size: 14px; line-height: 1.8;">
        <li>📖 <strong>E-books & Guides PDF :</strong> Livres électroniques, manuels complets, synthèses et guides méthodologiques.</li>
        <li>💻 <strong>Logiciels & Scripts (ZIP / Code) :</strong> Outils informatiques, scripts Python/JS, micro-logiciels, bots et snippets de code.</li>
        <li>🎨 <strong>Modèles & Templates :</strong> Workspaces Notion, templates Figma, fichiers Canva et feuilles de calcul Excel.</li>
        <li>🤖 <strong>Packs de Prompts & Datasets IA :</strong> Collections de prompts ChatGPT / Claude / Midjourney et bases de connaissances.</li>
      </ul>
    </div>

    <h3 style="color: #0f172a; font-size: 17px; margin-top: 24px; margin-bottom: 12px;">Pourquoi publier vos produits dès aujourd'hui ?</h3>
    <ul style="color: #475569; font-size: 14px; line-height: 1.7; padding-left: 20px;">
      <li>⚡ <strong>Paiement Panafricain Instantané :</strong> Vos acheteurs paient en un clic via Mobile Money (RDC, Congo-Brazzaville, Cameroun, Côte d'Ivoire, Sénégal, Bénin...) et Crypto.</li>
      <li>🏷️ <strong>Prix accessible (≤ 25$ max) :</strong> Le format idéal pour convertir un grand volume d'apprenants sans friction d'engagement long.</li>
      <li>🏪 <strong>Votre Vitrine Officielle :</strong> Vos produits sont automatiquement mis en avant sur votre boutique créateur personnelle et sur le catalogue public.</li>
      <li>🔒 <strong>Téléchargement instantané sécurisé :</strong> Les fichiers sont protégés et remis instantanément aux apprenants dès le paiement validé.</li>
    </ul>

    <div style="text-align: center; margin: 34px 0 20px 0;">
      <a href="https://ansella.app/instructor/courses" class="btn" style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); color: #ffffff !important; padding: 14px 30px; font-weight: 800; border-radius: 12px; text-decoration: none; display: inline-block;">
        Publier mon premier Produit Digital →
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">
      Pour commencer, rendez-vous dans votre espace dans l'onglet <strong>Mes Produits</strong> et cliquez sur <em>Nouveau Contenu &gt; Produit Digital</em>.
    </p>
  `;

  const html = getEmailTemplate(subject, body);
  const localPath = await writeMockEmailFile(email, subject, html);

  if (RESEND_KEY) {
    try {
      console.log(`[Resend API] Envoi en cours vers ${email}...`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: subject,
          html: html,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        console.log(`✓ [Resend SUCCESS] Délivré à ${email} (ID: ${data.id})`);
        return { success: true, resendId: data.id };
      } else {
        console.warn(`⚠️ [Resend Note] Réponse pour ${email}:`, data);
        return { success: false, error: data };
      }
    } catch (err) {
      console.error(`✗ [Resend Error] Erreur envoi vers ${email}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`✓ [Local Backup] Sauvegardé : ${localPath}`);
  }

  return { success: true, localOnly: true };
}

async function discoverInstructors() {
  const map = new Map();

  // 1. Liste socle des formateurs officiels de la plateforme
  const baseInstructors = [
    { name: "Ansel Makomo", email: "ansel@kuettu.com" },
    { name: "Anselme (Admin & Formateur)", email: "anselmk4@gmail.com" },
    { name: "Pr. Dieudonné Mwamba", email: "dieudonne.mwamba@ansella.app" },
    { name: "Amina Diallo", email: "amina.diallo@ansella.app" },
    { name: "Koffi Mensah", email: "koffi.mensah@ansella.app" },
  ];

  baseInstructors.forEach((i) => {
    map.set(i.email.toLowerCase().trim(), i);
  });

  // 2. Vérification Supabase dynamique si configuré
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && !sbUrl.includes("your-project.supabase.co")) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(sbUrl, sbKey);
      const { data: dbProfiles } = await supabase.from("profiles").select("id, full_name, email, role, plan");
      if (dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach((p) => {
          if (p.email && (p.role === "INSTRUCTOR" || (p.plan && p.plan !== "FREE"))) {
            map.set(p.email.toLowerCase().trim(), {
              name: p.full_name || "Formateur Ansella",
              email: p.email.toLowerCase().trim(),
            });
          }
        });
      }
    } catch (err) {
      console.log("[Détection Supabase]", err.message);
    }
  }

  // 3. Arguments ligne de commande (permet d'ajouter n'importe quelle adresse supplémentaire)
  const args = process.argv.slice(2);
  args.forEach((arg) => {
    const rawEmails = arg.split(/[,;\s]+/);
    rawEmails.forEach((e) => {
      const clean = e.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        map.set(clean, {
          name: clean.split("@")[0],
          email: clean,
        });
      }
    });
  });

  return Array.from(map.values());
}

async function run() {
  console.log("===============================================================");
  console.log("   DIFFUSION ANSELLA : TOUS LES FORMATEURS DE LA PLATEFORME    ");
  console.log("===============================================================");
  console.log(`Expéditeur : ${FROM_EMAIL}`);
  console.log(`Clé Resend active : ${RESEND_KEY ? "Oui (" + RESEND_KEY.substring(0, 7) + "...)" : "Non"}\n`);

  const instructors = await discoverInstructors();
  console.log(`📋 Total formateurs ciblés : ${instructors.length}`);
  instructors.forEach((i, idx) => {
    console.log(`   ${idx + 1}. ${i.name} <${i.email}>`);
  });
  console.log("");

  let successCount = 0;
  for (const inst of instructors) {
    const res = await sendAnnouncement(inst.email, inst.name);
    if (res.success) successCount++;
  }

  console.log("\n===============================================================");
  console.log(`✓ Campagne terminée : ${successCount}/${instructors.length} emails envoyés avec succès !`);
  console.log("===============================================================");
}

run();
