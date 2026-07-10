import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROVIDER_LABELS: Record<string, string> = {
  PAYPAL: "PayPal",
  MOBILE_MONEY: "Mobile Money",
  STRIPE: "Stripe / Carte",
  CRYPTO: "Cryptomonnaie",
  MANUAL: "Validation manuelle",
  MOKO_CARD: "Carte bancaire (Moko)",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { paymentId } = await params;

    // Fetch payment — must belong to the authenticated user
    const { data: payment, error: payError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, amount, currency, status, provider, method, provider_transaction_id, paid_at, created_at")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (payError || !payment) {
      return NextResponse.json({ error: "Paiement introuvable ou accès refusé." }, { status: 404 });
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch order items → course title
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("course_id, unit_price, final_price")
      .eq("order_id", payment.order_id);

    let itemLabel = "Formation";
    let itemDescription = "";
    let isInstructorInvoice = false;
    let academyName = "";
    let academyTagline = "";

    if (orderItems && orderItems.length > 0) {
      const firstItem = orderItems[0];
      const courseId = firstItem.course_id;

      const PLAN_MAP: Record<string, { label: string; desc: string }> = {
        "99999999-9999-9999-9999-999999990001": { label: "Abonnement Formateur — Plan BASE", desc: "Abonnement mensuel à la plateforme ANSELLA" },
        "99999999-9999-9999-9999-999999990002": { label: "Abonnement Formateur — Plan PRO", desc: "Abonnement mensuel à la plateforme ANSELLA" },
        "99999999-9999-9999-9999-999999990003": { label: "Abonnement Formateur — Plan MAX", desc: "Abonnement mensuel à la plateforme ANSELLA" },
      };

      if (courseId && PLAN_MAP[courseId]) {
        itemLabel = PLAN_MAP[courseId].label;
        itemDescription = PLAN_MAP[courseId].desc;
        isInstructorInvoice = true;
      } else if (courseId) {
        // Fetch course and its instructor's academy details
        const { data: course } = await supabaseAdmin
          .from("courses")
          .select("title, instructor_id")
          .eq("id", courseId)
          .maybeSingle();
        
        if (course) {
          itemLabel = course.title || "Formation";
          itemDescription = "Accès complet à la formation en ligne";
          
          if (course.instructor_id) {
            const { data: instructorProfile } = await supabaseAdmin
              .from("profiles")
              .select("academy_name, academy_tagline")
              .eq("id", course.instructor_id)
              .maybeSingle();
              
            if (instructorProfile?.academy_name) {
              academyName = instructorProfile.academy_name;
              academyTagline = instructorProfile.academy_tagline || "Académie de formation en ligne";
            }
          }
        }
        
        // Fallback to "Kuettu Crypto Academy" if no custom academy name is set for the instructor
        if (!academyName) {
          academyName = "Kuettu Crypto Academy";
          academyTagline = "Plateforme d'apprentissage spécialisée";
        }
      }
    }

    const invoicePrefix = isInstructorInvoice ? "ANS" : (academyName === "Kuettu Crypto Academy" ? "KCA" : "ANS");
    const invoiceNumber = `${invoicePrefix}-${payment.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(payment.paid_at || payment.created_at).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const providerLabel = PROVIDER_LABELS[payment.provider] || payment.provider || "—";
    const currency = payment.currency || "USD";
    const amount = Number(payment.amount).toFixed(2);
    const userName = profile?.full_name || user.email || "Client";
    const userEmail = profile?.email || user.email || "";

    // Generate clean HTML invoice (browser-printable as PDF)
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Facture ${invoiceNumber} — ${isInstructorInvoice ? 'ANSELLA' : academyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 40px;
      min-height: 100vh;
    }
    .invoice {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white;
      padding: 40px 48px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ansella-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .ansella-logo svg {
      width: 28px;
      height: 28px;
    }
    .ansella-logo span {
      background: linear-gradient(to right, #38bdf8, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .academy-info {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: #94a3b8;
    }
    .brand-tagline { font-size: 11px; color: #64748b; margin-top: 2px; }
    .invoice-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; text-align: right; }
    .invoice-number { font-size: 24px; font-weight: 800; color: white; text-align: right; margin-top: 4px; }
    .body { padding: 40px 48px; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-block label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
    }
    .meta-block p { font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.5; }
    .meta-block p.light { font-weight: 400; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      font-weight: 600;
      padding: 10px 16px;
      text-align: left;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    thead th:last-child { text-align: right; }
    tbody td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .item-title { font-weight: 600; color: #1e293b; }
    .item-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .totals { 
      border-top: 2px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 40px;
    }
    .total-row { display: flex; gap: 48px; font-size: 14px; color: #64748b; }
    .total-row.grand { 
      font-size: 18px; 
      font-weight: 800; 
      color: #0f172a;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
      margin-top: 4px;
    }
    .total-row .amount { min-width: 100px; text-align: right; }
    .total-row.grand .amount { color: #0ea5e9; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dcfce7;
      color: #166534;
      border-radius: 99px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 32px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 48px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer p { font-size: 11px; color: #94a3b8; }
    .tx-ref { font-size: 10px; color: #94a3b8; margin-top: 8px; }
    @media print {
      body { padding: 0; background: white; }
      .invoice { box-shadow: none; border-radius: 0; }
      .print-btn { display: none; }
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0ea5e9;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(14,165,233,0.3);
    }
    .print-btn:hover { background: #0284c7; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo-container">
        <div class="ansella-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="url(#logo-grad)" />
            <path d="M12 6L5 20H19L12 6Z" fill="#0f172a" />
            <path d="M12 10L8 18H16L12 10Z" fill="url(#logo-grad)" />
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#38bdf8" />
                <stop offset="1" stop-color="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          <span>ANSELLA</span>
        </div>
        ${!isInstructorInvoice ? `
        <div class="academy-info">
          <div class="brand-name">${academyName}</div>
          <div class="brand-tagline">${academyTagline}</div>
        </div>
        ` : ''}
      </div>
      <div>
        <div class="invoice-label">Facture N°</div>
        <div class="invoice-number">${invoiceNumber}</div>
      </div>
    </div>

    <div class="body">
      <div class="meta-grid">
        <div class="meta-block">
          <label>Facturé à</label>
          <p>${userName}</p>
          <p class="light">${userEmail}</p>
        </div>
        <div class="meta-block">
          <label>Informations de paiement</label>
          <p>Date : ${invoiceDate}</p>
          <p class="light">Mode : ${providerLabel}</p>
          ${payment.provider_transaction_id ? `<p class="light" style="font-size:11px;margin-top:4px">Réf. : ${payment.provider_transaction_id}</p>` : ""}
        </div>
      </div>

      <div class="badge">
        ✓ Paiement confirmé
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:60%">Description</th>
            <th>Quantité</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-title">${itemLabel}</div>
              ${itemDescription ? `<div class="item-desc">${itemDescription}</div>` : ""}
            </td>
            <td>1</td>
            <td>${amount} ${currency}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Sous-total</span>
          <span class="amount">${amount} ${currency}</span>
        </div>
        <div class="total-row">
          <span>TVA (0%)</span>
          <span class="amount">0,00 ${currency}</span>
        </div>
        <div class="total-row grand">
          <span>Total payé</span>
          <span class="amount">${amount} ${currency}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p>${isInstructorInvoice ? 'ANSELLA' : `${academyName} (ANSELLA)`} — info@ansella.app</p>
        <p>Ce document tient lieu de reçu officiel de paiement.</p>
      </div>
      <p style="font-size:12px;font-weight:600;color:#0ea5e9;">Merci de votre confiance 🚀</p>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Enregistrer PDF</button>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="facture-${invoiceNumber}.html"`,
      },
    });
  } catch (err: any) {
    console.error("[invoice] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne." }, { status: 500 });
  }
}
