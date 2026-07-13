import fs from "node:fs";
import path from "node:path";

// A beautiful, premium HTML email wrapper for Ansella
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
      background-color: #f4f5f7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #f4f5f7;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #0f766e; /* Teal 700 */
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .header p {
      color: #ccfbf1;
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 30px 24px;
      color: #374151;
      line-height: 1.6;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0f766e;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 8px;
      margin-top: 15px;
      text-align: center;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .invoice-table th {
      text-align: left;
      padding: 8px;
      background-color: #f3f4f6;
      font-size: 12px;
      color: #4b5563;
      text-transform: uppercase;
    }
    .invoice-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
    }
    .invoice-table .total-row td {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #e5e7eb;
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ANSELLA</h1>
        <p>L'apprentissage en toute liberté</p>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Ansella. Tous droits réservés.<br>
        Besoin d'aide ? <a href="mailto:support@ansella.app" style="color: #0f766e; text-decoration: none;">Contactez le support</a>
      </div>
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

  // 1. Console Log
  console.log(`\n======================================================`);
  console.log(`[SEND EMAIL]`);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY PREVIEW: ${bodyContent.replace(/<[^>]*>/g, "").substring(0, 150)}...`);
  console.log(`======================================================\n`);

  // 2. Write to files in scratch folder for user inspection
  await writeMockEmailFile(to, subject, html);
}

// --- Specific Email Helpers ---

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
    <h2 style="margin-top: 0; color: #111827;">Merci pour votre achat ! 🧾</h2>
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Nous vous remercions de votre confiance. Votre paiement de <strong>${amount.toFixed(2)}$</strong> a été validé avec succès. Vous trouverez ci-dessous le détail de votre facture.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #6b7280;">Facture n° : <strong>${orderNumber}</strong></p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Date : <strong>${dateStr}</strong></p>
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
            <strong>${itemTitle}</strong><br>
            <span style="font-size: 12px; color: #6b7280;">${itemDesc}</span>
          </td>
          <td style="text-align: right; font-weight: 600;">${amount.toFixed(2)}$</td>
        </tr>
        <tr class="total-row">
          <td>Total réglé</td>
          <td style="text-align: right; color: #0f766e;">${amount.toFixed(2)}$</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses" class="btn">Accéder à mes cours</a>
    </div>
  `;
  await sendEmail(to, `Facture Ansella #${orderNumber}`, body);
}

export async function sendInstructorCoursePurchasedEmail(
  instructorEmail: string,
  instructorName: string,
  studentName: string,
  courseTitle: string,
  amount: number
) {
  const body = `
    <h2 style="margin-top: 0; color: #111827;">Nouvel achat de cours ! 💸</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Bonne nouvelle ! L'apprenant <strong>${studentName}</strong> vient de s'inscrire à votre cours :</p>
    
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0; font-weight: bold; border-left: 4px solid #0f766e;">
      ${courseTitle}
    </div>

    <p>Montant de la transaction : <strong>${amount.toFixed(2)}$</strong>.</p>
    <p>Vos commissions et statistiques ont été mises à jour dans votre tableau de bord instructeur.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/earnings" class="btn">Consulter mes revenus</a>
    </div>
  `;
  await sendEmail(instructorEmail, `Nouvelle inscription à votre cours : ${courseTitle}`, body);
}

export async function sendInstructorCourseValidatedEmail(
  instructorEmail: string,
  instructorName: string,
  courseTitle: string
) {
  const body = `
    <h2 style="margin-top: 0; color: #111827;">Votre cours a été validé ! 🎉</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Notre équipe académique a validé votre cours :</p>
    
    <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px 0; font-weight: bold; border-left: 4px solid #10b981; color: #065f46;">
      ${courseTitle}
    </div>

    <p>Félicitations ! Votre cours est maintenant disponible à la vente et visible sur le catalogue public de la plateforme pour tous les apprenants.</p>

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
    <h2 style="margin-top: 0; color: #111827;">Session Live démarrée ! 🎥</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Une session de cours en direct vient d'être lancée pour votre formation <strong>${courseTitle}</strong> :</p>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6; color: #1e3a8a;">
      <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 15px;">${sessionTitle}</p>
      <p style="margin: 0; font-size: 13px; color: #4b5563;">Date de session : ${sessionTime}</p>
    </div>

    <p>Rejoignez immédiatement vos formateurs et collègues de promotion via le lien ci-dessous :</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${sessionLink || "https://ansella.app/dashboard/courses"}" class="btn" style="background-color: #3b82f6;">Rejoindre le Live</a>
    </div>
  `;
  await sendEmail(studentEmail, `🔴 Ansella Live : ${sessionTitle}`, body);
}
