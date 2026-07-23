import fs from "node:fs";
import path from "node:path";

/**
 * Standardized Premium HTML email wrapper matching Ansella's official brand design
 */
function getEmailTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #f3f4f6;
      padding: 40px 20px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e5e7eb;
    }
    .top-bar {
      height: 6px;
      background: linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
    }
    .logo-container {
      padding: 32px 36px 16px 36px;
    }
    .content {
      padding: 0 36px 32px 36px;
      color: #374151;
      line-height: 1.65;
      font-size: 15px;
    }
    .content h2 {
      color: #111827;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-top: 10px;
      margin-bottom: 16px;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #4b5563;
    }
    .card-footer {
      background-color: #f8fafc;
      padding: 22px 36px;
      border-top: 1px solid #f1f5f9;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .outer-footer {
      max-width: 580px;
      margin: 28px auto 0 auto;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .outer-footer strong {
      color: #64748b;
    }
    .btn {
      display: inline-block;
      padding: 13px 30px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      border-radius: 12px;
      margin: 20px 0 10px 0;
      text-align: center;
      font-size: 15px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
      transition: all 0.2s ease;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .invoice-table th {
      text-align: left;
      padding: 10px 12px;
      background-color: #f8fafc;
      font-size: 12px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .invoice-table .total-row td {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #e2e8f0;
      border-bottom: none;
      color: #1e1b4b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="top-bar"></div>
      
      <div class="logo-container">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-family: serif; font-size: 30px; font-weight: bold; color: #b8860b; line-height: 1;">A</span>
            </td>
            <td style="vertical-align: middle; padding-left: 8px;">
              <span style="font-size: 16px; font-weight: 700; color: #1e293b; letter-spacing: 0.25em;">ANSELLA</span>
            </td>
          </tr>
        </table>
      </div>

      <div class="content">
        ${bodyContent}
      </div>

      <div class="card-footer">
        Si vous n'avez pas demandé cette notification, vous pouvez ignorer cet e-mail en toute sécurité. Notre équipe de support reste à votre disposition.
      </div>
    </div>

    <div class="outer-footer">
      <div style="margin-bottom: 6px;">
        <span style="font-family: serif; font-size: 18px; font-weight: bold; color: #b8860b;">A</span>
        <span style="font-size: 11px; font-weight: 700; color: #475569; letter-spacing: 0.25em; margin-left: 4px;">ANSELLA</span>
      </div>
      <div><strong>Ansella App.</strong></div>
      <div>© ${new Date().getFullYear()} Kuettu Corporation SARL. Tous droits réservés.</div>
      <div style="margin-top: 4px;">Vous recevez cet e-mail car vous êtes inscrit sur <a href="https://ansella.app" style="color: #6366f1; text-decoration: none;">https://ansella.app</a></div>
    </div>
  </div>
</body>
</html>
  `;
}

// Log and save mock email for debugging/testing
async function writeMockEmailFile(recipient: string, subject: string, html: string) {
  try {
    const outputDir = path.join(process.cwd(), "scratch", "sent-emails");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const cleanEmail = recipient.replace(/[^a-zA-Z0-9@.]/g, "_");
    const cleanSubject = subject.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
    const filename = `${Date.now()}_to_${cleanEmail}_${cleanSubject.substring(0, 30)}.html`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, html, "utf8");
    console.log(`[Email Mock] Email saved to: file:///${filepath.replace(/\\/g, "/")}`);
  } catch (err) {
    console.error("[Email Mock] Failed to save mock email file:", err);
  }
}

export async function sendEmail(to: string, subject: string, bodyContent: string) {
  const html = getEmailTemplate(subject, bodyContent);

  // 1. Console Log for local tracking
  console.log(`\n======================================================`);
  console.log(`[SEND EMAIL]`);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY PREVIEW: ${bodyContent.replace(/<[^>]*>/g, "").substring(0, 150)}...`);
  console.log(`======================================================\n`);

  // 2. Local File Logging for Debugging
  await writeMockEmailFile(to, subject, html);

  // 3. Multi-Provider Production Email Dispatching
  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_API_TOKEN || process.env.EMAIL_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;

  // A. Resend API (Recommended for Next.js / Vercel)
  if (resendKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "Ansella Academy <notifications@ansella.app>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[sendEmail] Successfully dispatched email via Resend to ${to} (ID: ${data.id})`);
        return { success: true, provider: "Resend", id: data.id };
      } else {
        console.error("[sendEmail] Resend API error:", data);
      }
    } catch (err: any) {
      console.error("[sendEmail] Failed to send email via Resend:", err?.message || err);
    }
  }

  // B. Brevo / Sendinblue API
  if (brevoKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "notifications@ansella.app";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Ansella Academy", email: fromEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[sendEmail] Successfully dispatched email via Brevo to ${to}`);
        return { success: true, provider: "Brevo" };
      } else {
        console.error("[sendEmail] Brevo API error:", data);
      }
    } catch (err: any) {
      console.error("[sendEmail] Failed to send email via Brevo:", err?.message || err);
    }
  }

  // C. SendGrid API
  if (sendgridKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "notifications@ansella.app";
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: "Ansella Academy" },
          subject: subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      if (res.ok) {
        console.log(`[sendEmail] Successfully dispatched email via SendGrid to ${to}`);
        return { success: true, provider: "SendGrid" };
      } else {
        const errText = await res.text();
        console.error("[sendEmail] SendGrid API error:", errText);
      }
    } catch (err: any) {
      console.error("[sendEmail] Failed to send email via SendGrid:", err?.message || err);
    }
  }

  // D. Postmark API
  if (postmarkToken) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "notifications@ansella.app";
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": postmarkToken,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          From: fromEmail,
          To: to,
          Subject: subject,
          HtmlBody: html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[sendEmail] Successfully dispatched email via Postmark to ${to}`);
        return { success: true, provider: "Postmark" };
      } else {
        console.error("[sendEmail] Postmark API error:", data);
      }
    } catch (err: any) {
      console.error("[sendEmail] Failed to send email via Postmark:", err?.message || err);
    }
  }

  // E. Email Webhook Gateway
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      if (res.ok) {
        console.log(`[sendEmail] Successfully dispatched email via Webhook to ${to}`);
        return { success: true, provider: "Webhook" };
      }
    } catch (err: any) {
      console.error("[sendEmail] Failed to send email via Webhook:", err?.message || err);
    }
  }

  return { success: true, provider: "Mock/Log" };
}

// --- Standardized Email Templates ---

export async function sendInvoiceEmail(
  to: string,
  fullName: string,
  orderNumber: string,
  amount: number,
  itemTitle: string,
  itemDesc: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    <h2>Merci pour votre achat ! 🧾</h2>
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Nous vous remercions de votre confiance. Votre paiement de <strong>$${amount.toFixed(2)} USD</strong> a été validé avec succès. Vous trouverez ci-dessous le détail de votre commande.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #64748b;">N° Facture : <strong style="color: #0f172a;">${orderNumber}</strong></p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">Date : <strong style="color: #0f172a;">${dateStr}</strong></p>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="color: #1e1b4b;">${itemTitle}</strong><br>
            <span style="font-size: 12px; color: #64748b;">${itemDesc}</span>
          </td>
          <td style="text-align: right; font-weight: 600;">$${amount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total réglé</td>
          <td style="text-align: right; color: #4f46e5;">$${amount.toFixed(2)} USD</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses" class="btn">Accéder à mes cours</a>
    </div>
  `;
  await sendEmail(to, `Facture Ansella #${orderNumber}`, body);
}

/**
 * Facture de souscription de Plan Formateur (BASE, PRO, MAX)
 */
export async function sendInstructorPlanInvoiceEmail(
  instructorEmail: string,
  instructorName: string,
  orderNumber: string,
  amount: number,
  planName: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    <h2>Facture de souscription Formateur 🧾</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Félicitations pour l'activation de votre abonnement Formateur <strong>Plan ${planName}</strong>. Votre paiement a été traité et votre facture est officiellement disponible.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">N° Facture : <strong style="color: #0f172a;">${orderNumber}</strong></p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Forfait : <strong style="color: #4f46e5;">Plan Formateur ${planName}</strong></p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">Date d'émission : <strong style="color: #0f172a;">${dateStr}</strong></p>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description du service</th>
          <th style="text-align: right;">Montant Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="color: #1e1b4b;">Abonnement Mensuel Plan ${planName}</strong><br>
            <span style="font-size: 12px; color: #64748b;">Accès illimité aux fonctionnalités avancées d'enseignement & publication</span>
          </td>
          <td style="text-align: right; font-weight: 700;">$${amount.toFixed(2)} USD</td>
        </tr>
        <tr class="total-row">
          <td>Total réglé</td>
          <td style="text-align: right; color: #4f46e5;">$${amount.toFixed(2)} USD</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor" class="btn">Accéder à mon Espace Formateur</a>
    </div>
  `;
  await sendEmail(instructorEmail, `Facture Abonnement Formateur #${orderNumber}`, body);
}

export async function sendInstructorCoursePurchasedEmail(
  instructorEmail: string,
  instructorName: string,
  studentName: string,
  courseTitle: string,
  amount: number
) {
  const body = `
    <h2>Nouvelle inscription à votre cours ! 💸</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Bonne nouvelle ! L'apprenant <strong>${studentName}</strong> vient de s'inscrire à votre formation :</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; font-weight: bold; border-left: 4px solid #4f46e5; color: #1e1b4b;">
      ${courseTitle}
    </div>

    <p>Montant brut de la transaction : <strong>$${amount.toFixed(2)} USD</strong>.</p>
    <p>Vos commissions et vos statistiques d'étudiants ont été immédiatement mises à jour sur votre espace formateur.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/earnings" class="btn">Consulter mes revenus</a>
    </div>
  `;
  await sendEmail(instructorEmail, `Nouvelle inscription à votre cours : ${courseTitle}`, body);
}

/**
 * Notification au Formateur quand un Apprenant termine un Cours, Chapitre ou Quiz
 */
export async function sendInstructorStudentProgressEmail(
  instructorEmail: string,
  instructorName: string,
  studentName: string,
  courseTitle: string,
  itemType: "COURSE" | "CHAPTER" | "QUIZ",
  itemTitle: string,
  score?: number
) {
  let actionText = "";
  let icon = "🎯";
  if (itemType === "COURSE") {
    actionText = `a **entièrement terminé** votre formation **"${courseTitle}"** ! 🎉`;
    icon = "🏆";
  } else if (itemType === "QUIZ") {
    actionText = `a réussi l'évaluation **"${itemTitle}"** (Score: ${score !== undefined ? `${score}%` : 'Validé'}).`;
    icon = "📝";
  } else {
    actionText = `a terminé le chapitre **"${itemTitle}"** dans la formation **"${courseTitle}"**.`;
    icon = "📚";
  }

  const body = `
    <h2>Progression d'un étudiant ! ${icon}</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>L'apprenant <strong>${studentName}</strong> ${actionText}</p>

    <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 4px solid #4f46e5;">
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #1e1b4b;"><strong>Étudiant :</strong> ${studentName}</p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #3730a3;"><strong>Formation :</strong> ${courseTitle}</p>
      <p style="margin: 0; font-size: 13px; color: #3730a3;"><strong>Étape franchie :</strong> ${itemTitle} ${score !== undefined ? `(${score}%)` : ''}</p>
    </div>

    <p>Vous pouvez suivre la progression complète de l'ensemble de vos étudiants sur votre tableau de bord.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/students" class="btn">Suivre mes étudiants</a>
    </div>
  `;
  await sendEmail(instructorEmail, `${icon} ${studentName} a progressé dans ${courseTitle}`, body);
}

export async function sendInstructorCourseValidatedEmail(
  instructorEmail: string,
  instructorName: string,
  courseTitle: string
) {
  const body = `
    <h2>Votre cours a été validé ! 🎉</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Notre équipe académique a validé et publié votre cours :</p>
    
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin: 20px 0; font-weight: bold; border-left: 4px solid #16a34a; color: #14532d;">
      ${courseTitle}
    </div>

    <p>Félicitations ! Votre cours est désormais accessible sur le catalogue public Ansella et prêt à recevoir ses premiers étudiants.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/courses" class="btn">Gérer mon cours</a>
    </div>
  `;
  await sendEmail(instructorEmail, `Félicitations ! Votre cours "${courseTitle}" a été validé`, body);
}

export async function sendLiveSessionNotificationEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  sessionTitle: string,
  sessionTime: string,
  sessionLink: string
) {
  const body = `
    <h2>Session Live en direct ! 🎥</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Votre formateur vient de lancer une session de cours en direct pour la formation <strong>${courseTitle}</strong> :</p>
    
    <div style="background-color: #eef2ff; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #4f46e5; color: #1e1b4b;">
      <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 15px;">${sessionTitle}</p>
      <p style="margin: 0; font-size: 13px; color: #475569;">Horaire de la session : ${sessionTime}</p>
    </div>

    <p>Rejoignez directement votre formateur et vos collègues de promotion via le bouton ci-dessous :</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${sessionLink || "https://ansella.app/dashboard/courses"}" class="btn">Rejoindre le Live</a>
    </div>
  `;
  await sendEmail(studentEmail, `🔴 Session Live en direct : ${sessionTitle}`, body);
}

/**
 * Notification à l'Apprenant pour le Déblocage & Délivrance de son Certificat
 */
export async function sendStudentCertificateIssuedEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  certificateNumber: string,
  certificateUrl?: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    <h2>Votre Certificat Officiel est débloqué ! 🏅</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Toutes nos félicitations ! Ayant validé avec succès l'ensemble des modules et évaluations de la formation <strong>"${courseTitle}"</strong>, votre **Certificat Officiel de Réussite ANSELLA** est débloqué et disponible.</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center; border-left: 5px solid #16a34a;">
      <span style="font-size: 42px;">🏆</span>
      <h3 style="margin: 12px 0 6px 0; color: #15803d; font-size: 18px;">Certificat d'Excellence</h3>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534;">Délivré le ${dateStr}</p>
      <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: bold;">Code de vérification unique : ${certificateNumber}</p>
    </div>

    <p>Ce certificat atteste officiellement de vos compétences et peut être directement téléchargé en PDF et partagé sur votre profil LinkedIn.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${certificateUrl || `https://ansella.app/dashboard/certificates`}" class="btn" style="background-color: #16a34a;">Télécharger mon Certificat PDF</a>
    </div>
  `;
  await sendEmail(studentEmail, `🏆 Votre Certificat Officiel Ansella : ${courseTitle}`, body);
}

/**
 * Notification de paiement d'un formateur (Versement / Payout effectué)
 */
export async function sendInstructorPayoutCompletedEmail(
  instructorEmail: string,
  instructorName: string,
  amount: number,
  paymentMethod: string,
  reference: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const body = `
    <h2>Votre versement a été effectué avec succès ! 💰</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Nous vous informons que votre demande de versement de commissions a été validée et transférée avec succès.</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 4px solid #16a34a;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #14532d;"><strong>Montant versé :</strong> <span style="font-size: 18px; font-weight: 800; color: #15803d;">$${amount.toFixed(2)} USD</span></p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #166534;"><strong>Moyen de versement :</strong> ${paymentMethod}</p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #166534;"><strong>Référence de transaction :</strong> ${reference}</p>
      <p style="margin: 0; font-size: 12px; color: #15803d;"><strong>Date de transfert :</strong> ${dateStr}</p>
    </div>

    <p>Les fonds sont désormais crédités sur votre compte récepteur. Merci pour la qualité de vos formations et votre confiance en la plateforme ANSELLA.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/earnings" class="btn">Consulter mes revenus</a>
    </div>
  `;
  await sendEmail(instructorEmail, `💰 Versement effectué : $${amount.toFixed(2)} USD transférés`, body);
}

/**
 * Notification au Formateur en cas de rejet/refus de sa demande de versement
 */
export async function sendInstructorPayoutRejectedEmail(
  instructorEmail: string,
  instructorName: string,
  amount: number,
  reason: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const body = `
    <h2>Mise à jour concernant votre demande de versement ⚠️</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Nous vous informons que votre demande de versement d'un montant de <strong>$${amount.toFixed(2)} USD</strong> n'a pas pu être traitée.</p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #991b1b;"><strong>Montant de la demande :</strong> $${amount.toFixed(2)} USD</p>
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #991b1b;"><strong>Motif du rejet :</strong> ${reason}</p>
      <p style="margin: 0; font-size: 12px; color: #7f1d1d;"><strong>Date du rejet :</strong> ${dateStr}</p>
    </div>

    <p>Les fonds sont conservés sur votre solde disponible. Veuillez vérifier et mettre à jour vos coordonnées Mobile Money (opérateur, monnaie ou numéro) depuis votre espace formateur avant de soumettre une nouvelle demande.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/earnings" class="btn" style="background-color: #ef4444;">Consulter mon compte et mes revenus</a>
    </div>
  `;
  await sendEmail(instructorEmail, `⚠️ Information concernant votre demande de retrait de $${amount.toFixed(2)} USD`, body);
}

/**
 * Reçu de transaction détaillé pour l'apprenant
 */
export async function sendStudentTransactionReceiptEmail(
  studentEmail: string,
  studentName: string,
  orderNumber: string,
  amount: number,
  currency: string,
  courseTitle: string,
  paymentMethod: string
) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const displayAmount = currency.toUpperCase() === "CDF" ? `${amount.toLocaleString("fr-FR")} FC` : `$${amount.toFixed(2)} USD`;

  const body = `
    <h2>Reçu de transaction confirmée 💳</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Votre paiement a été traité avec succès et votre inscription est officiellement enregistrée.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">N° d'Ordre : <strong style="color: #0f172a;">${orderNumber}</strong></p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Mode de règlement : <strong style="color: #0f172a;">${paymentMethod}</strong></p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">Date : <strong style="color: #0f172a;">${dateStr}</strong></p>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Formation commandée</th>
          <th style="text-align: right;">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="color: #1e1b4b;">${courseTitle}</strong><br>
            <span style="font-size: 12px; color: #64748b;">Accès complet et illimité à la formation certifiante</span>
          </td>
          <td style="text-align: right; font-weight: 700;">${displayAmount}</td>
        </tr>
        <tr class="total-row">
          <td>Total payé</td>
          <td style="text-align: right; color: #4f46e5;">${displayAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses" class="btn">Accéder à ma formation</a>
    </div>
  `;
  await sendEmail(studentEmail, `Reçu de paiement Ansella #${orderNumber}`, body);
}

/**
 * Notification de déblocage d'un cours par un apprenant
 */
export async function sendStudentCourseUnlockedEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  courseId: string
) {
  const body = `
    <h2>Votre formation est maintenant débloquée ! 🎓</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Félicitations ! Votre accès à la formation certifiante <strong>"${courseTitle}"</strong> vient d'être activé et débloqué.</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <span style="font-size: 32px;">🔓</span>
      <h3 style="margin: 10px 0 5px 0; color: #15803d;">Accès Déverrouillé</h3>
      <p style="margin: 0; font-size: 13px; color: #166534;">Vous pouvez désormais visionner l'intégralité des modules, télécharger les ressources et valider votre certificat.</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses/${courseId}" class="btn">Commencer l'apprentissage</a>
    </div>
  `;
  await sendEmail(studentEmail, `🎓 Accès débloqué : ${courseTitle}`, body);
}

/**
 * Alerte Quota 10 apprenants pour Formateur Plan FREE (Incitation Upgrade)
 */
export async function sendInstructorFreeQuotaWarningEmail(
  instructorEmail: string,
  instructorName: string,
  studentCount: number
) {
  const body = `
    <h2>Félicitations pour vos ${studentCount} étudiants ! 🚀</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Votre académie prend de l'ampleur ! Vous avez atteint le cap de <strong>${studentCount} étudiants inscrits</strong> sur votre compte gratuit Plan FREE.</p>

    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
      <h3 style="margin: 0 0 8px 0; color: #c2410c;">⚠️ Vous approchez de la limite du Plan Gratuit</h3>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #9a3412;">
        Le plan FREE est limité pour l'accueil de nouveaux apprenants et prélève des frais de commission de 20%. Pour accueillir un nombre illimité d'étudiants, publier plusieurs formations et réduire vos frais à 0%, passez au plan supérieur !
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #7c2d12;">
        <li>Accès illimité aux étudiants</li>
        <li>Publications de cours multiples</li>
        <li>Taux de commission préférentiel (jusqu'à 0%)</li>
        <li>Support prioritaire & Certificats personnalisés</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/billing" class="btn">Passer au Plan Supérieur</a>
    </div>
  `;
  await sendEmail(instructorEmail, `🚀 Cap des 10 étudiants atteint ! Débloquez le potentiel de votre académie`, body);
}

/**
 * Rappel d'expiration de souscription Formateur (3 jours avant ou Jour J)
 */
export async function sendInstructorSubscriptionExpiryReminderEmail(
  instructorEmail: string,
  instructorName: string,
  planName: string,
  daysRemaining: number
) {
  const isUrgent = daysRemaining <= 0;
  const titleText = isUrgent
    ? `Votre abonnement Plan ${planName} a expiré ! ⚠️`
    : `Rappel : Votre abonnement Plan ${planName} expire dans ${daysRemaining} jours ⏳`;

  const body = `
    <h2>${titleText}</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>${
      isUrgent
        ? `Votre forfait formateur <strong>Plan ${planName}</strong> est arrivé à son terme. Sans renouvellement, votre compte est rétrogradé au plan gratuit et vos cours supplémentaires passeront en brouillon.`
        : `Votre forfait formateur <strong>Plan ${planName}</strong> arrive bientôt à échéance (dans ${daysRemaining} jours).`
    }</p>

    <div style="background-color: ${isUrgent ? '#fef2f2' : '#fefce8'}; border: 1px solid ${isUrgent ? '#fecaca' : '#fef08a'}; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 4px solid ${isUrgent ? '#ef4444' : '#eab308'};">
      <p style="margin: 0 0 5px 0; font-size: 14px; color: ${isUrgent ? '#991b1b' : '#854d0e'};"><strong>Plan actuel :</strong> Plan ${planName}</p>
      <p style="margin: 0; font-size: 13px; color: ${isUrgent ? '#7f1d1d' : '#713f12'};">
        Renouvelez dès maintenant pour conserver vos avantages, vos cours publiés actifs et vos taux de commission réduits.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/billing" class="btn">Renouveler mon abonnement</a>
    </div>
  `;
  await sendEmail(instructorEmail, titleText, body);
}
