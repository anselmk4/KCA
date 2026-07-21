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
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .header p {
      color: #ccfbf1;
      margin: 5px 0 0 0;
      font-size: 13px;
      font-weight: 500;
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
      padding: 12px 26px;
      background-color: #0f766e;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 10px;
      margin-top: 15px;
      text-align: center;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(15, 118, 110, 0.2);
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .invoice-table th {
      text-align: left;
      padding: 10px 8px;
      background-color: #f3f4f6;
      font-size: 12px;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
        <p>L'apprentissage & l'enseignement en toute liberté</p>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Ansella Inc. Tous droits réservés.<br>
        Plateforme éducative certifiante globale.<br>
        <a href="mailto:support@ansella.app" style="color: #0f766e; text-decoration: none; font-weight: 600;">Contactez le Support Ansella</a>
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

/**
 * 1. Notification de paiement d'un formateur (Versement / Payout effectué)
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
    <h2 style="margin-top: 0; color: #111827;">Votre versement a été effectué avec succès ! 💰</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Nous vous informons que votre demande de versement de commissions a été validée et exécutée avec succès.</p>

    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 5px solid #10b981;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Montant versé :</strong> <span style="font-size: 18px; font-weight: 800; color: #047857;">$${amount.toFixed(2)} USD</span></p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #047857;"><strong>Moyen de paiement :</strong> ${paymentMethod}</p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #047857;"><strong>Référence de transaction :</strong> ${reference}</p>
      <p style="margin: 0; font-size: 12px; color: #059669;"><strong>Date de transfert :</strong> ${dateStr}</p>
    </div>

    <p>Les fonds sont désormais disponibles sur votre compte récepteur. Merci pour votre contribution et la qualité de vos enseignements sur la plateforme ANSELLA.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/earnings" class="btn" style="background-color: #059669;">Consulter mes revenus</a>
    </div>
  `;
  await sendEmail(instructorEmail, `💰 Versement effectué : $${amount.toFixed(2)} USD transférés`, body);
}

/**
 * 2. Reçu de transaction détaillé pour l'apprenant
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
    <h2 style="margin-top: 0; color: #111827;">Reçu de transaction confirmée 💳</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Votre paiement a été traité et votre commande est officiellement confirmée.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">N° d'Ordre : <strong style="color: #0f172a;">${orderNumber}</strong></p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Moyen de paiement : <strong style="color: #0f172a;">${paymentMethod}</strong></p>
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
            <strong style="color: #0f766e;">${courseTitle}</strong><br>
            <span style="font-size: 12px; color: #64748b;">Accès complet et illimité à la formation certifiante</span>
          </td>
          <td style="text-align: right; font-weight: 700;">${displayAmount}</td>
        </tr>
        <tr class="total-row">
          <td>Total payé</td>
          <td style="text-align: right; color: #0f766e;">${displayAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses" class="btn">Accéder immédiatement à ma formation</a>
    </div>
  `;
  await sendEmail(studentEmail, `Reçu de paiement Ansella #${orderNumber}`, body);
}

/**
 * 3. Notification de déblocage d'un cours par un apprenant
 */
export async function sendStudentCourseUnlockedEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  courseId: string
) {
  const body = `
    <h2 style="margin-top: 0; color: #111827;">Votre formation est maintenant débloquée ! 🎓</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Bonne nouvelle ! Votre accès à la formation certifiante <strong>"${courseTitle}"</strong> vient d'être débloqué avec succès.</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
      <span style="font-size: 32px;">🔓</span>
      <h3 style="margin: 10px 0 5px 0; color: #15803d;">Accès Déverrouillé</h3>
      <p style="margin: 0; font-size: 13px; color: #166534;">Vous pouvez désormais visionner les leçons vidéo, télécharger les ressources et passer vos évaluations.</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/dashboard/courses/${courseId}" class="btn" style="background-color: #16a34a;">Commencer à apprendre</a>
    </div>
  `;
  await sendEmail(studentEmail, `🎓 Accès débloqué : ${courseTitle}`, body);
}

/**
 * 4. Alerte Quota 10 apprenants pour Formateur Plan FREE (Incitation Upgrade)
 */
export async function sendInstructorFreeQuotaWarningEmail(
  instructorEmail: string,
  instructorName: string,
  studentCount: number
) {
  const body = `
    <h2 style="margin-top: 0; color: #111827;">Félicitations pour vos ${studentCount} étudiants ! 🚀</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>Votre académie prend de l'ampleur ! Vous avez atteint <strong>${studentCount} étudiants inscrits</strong> sur votre compte gratuit Plan FREE.</p>

    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 5px solid #f97316;">
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
      <a href="https://ansella.app/instructor/billing" class="btn" style="background-color: #ea580c;">Passer au Plan Supérieur</a>
    </div>
  `;
  await sendEmail(instructorEmail, `🚀 Cap des 10 étudiants atteint ! Débloquez le potentiel de votre académie`, body);
}

/**
 * 5. Rappel d'expiration de souscription Formateur (3 jours avant ou Jour J)
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
    <h2 style="margin-top: 0; color: #111827;">${titleText}</h2>
    <p>Bonjour <strong>${instructorName}</strong>,</p>
    <p>${
      isUrgent
        ? `Votre forfait formateur <strong>Plan ${planName}</strong> est arrivé à son terme. Sans renouvellement, votre compte est rétrogradé au plan gratuit et vos cours supplémentaires passeront en brouillon.`
        : `Votre forfait formateur <strong>Plan ${planName}</strong> arrive bientôt à échéance (dans ${daysRemaining} jours).`
    }</p>

    <div style="background-color: ${isUrgent ? '#fef2f2' : '#fefce8'}; border: 1px solid ${isUrgent ? '#fecaca' : '#fef08a'}; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 5px solid ${isUrgent ? '#ef4444' : '#eab308'};">
      <p style="margin: 0 0 5px 0; font-size: 14px; color: ${isUrgent ? '#991b1b' : '#854d0e'};"><strong>Plan actuel :</strong> Plan ${planName}</p>
      <p style="margin: 0; font-size: 13px; color: ${isUrgent ? '#7f1d1d' : '#713f12'};">
        Renouvelez dès maintenant pour conserver vos avantages, vos cours publiés actifs et vos taux de commission réduits.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://ansella.app/instructor/billing" class="btn" style="background-color: ${isUrgent ? '#dc2626' : '#d97706'};">Renouveler mon abonnement</a>
    </div>
  `;
  await sendEmail(instructorEmail, titleText, body);
}
