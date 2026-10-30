import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateDigitalProductToken } from "@/lib/digital-product-token";
import { sendDigitalProductDeliveryEmail } from "@/lib/email";
import { getPawaPayDepositStatus } from "@/lib/pawapay";

export const dynamic = "force-dynamic";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const resendRateLimit = new Map<string, RateLimitEntry>();

/**
 * Endpoint permettant de réexpédier par e-mail les liens de téléchargement
 * de produits numériques suite à un achat validé.
 * - Aucune donnée sensible ni lien signé n'est retourné dans le JSON si l'appelant n'est pas authentifié en tant que propriétaire.
 * - Exige une correspondance exacte sur l'adresse e-mail complète.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-real-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "client";
    const now = Date.now();
    const entry = resendRateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
      resendRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count += 1;
      if (entry.count > 10) {
        return NextResponse.json(
          { error: "Trop de demandes. Veuillez patienter une minute avant de réessayer." },
          { status: 429 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = String(body.email || body.query || "").trim().toLowerCase();

    if (!rawEmail || !/^[^@\s,()]+@[^@\s,()]+\.[^@\s,()]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "Veuillez renseigner une adresse e-mail complète et valide." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    const isAuthenticatedOwner =
      Boolean(sessionUser?.email) && sessionUser!.email!.trim().toLowerCase() === rawEmail;

    const admin = getSupabaseAdmin();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://ansella.app";

    // 1. Charger les produits digitaux
    const { data: allProducts } = await (admin as any)
      .from("digital_products")
      .select("id, title, price, file_name, file_url, author_id");
    const productsList = allProducts || [];

    // 2. Rechercher le profil par correspondance exacte sur l'email (sans injection .or)
    const candidateUserIds = new Set<string>();
    let customerName = rawEmail.split("@")[0];

    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", rawEmail)
      .maybeSingle();

    if (profile?.id) {
      candidateUserIds.add(profile.id);
      if (profile.full_name) customerName = profile.full_name;
    }

    // 3. Rechercher les paiements digitaux correspondant exactement à cet email ou user_id
    const { data: digitalPayments } = await (admin as any)
      .from("payments")
      .select("id, amount, method, status, user_id, created_at")
      .ilike("method", "%DIGITAL_PRODUCT%")
      .order("created_at", { ascending: false })
      .limit(300);

    const matchingPayments: any[] = [];
    const encodedEmail = encodeURIComponent(rawEmail);

    if (digitalPayments && digitalPayments.length > 0) {
      for (const pay of digitalPayments) {
        const rawMethod = String(pay.method || "").toLowerCase();
        const parts = rawMethod.split("::");
        let methodEmail = "";
        try {
          methodEmail = decodeURIComponent(parts[3] || "").trim().toLowerCase();
        } catch {
          methodEmail = (parts[3] || "").trim().toLowerCase();
        }

        const isExactEmailMatch =
          methodEmail === rawEmail ||
          rawMethod.endsWith(`::${encodedEmail}`) ||
          (pay.user_id && candidateUserIds.has(pay.user_id));

        if (!isExactEmailMatch) continue;

        if (pay.user_id) candidateUserIds.add(pay.user_id);

        if (pay.status === "PENDING" && pay.id) {
          try {
            const pawaCheck = await getPawaPayDepositStatus(pay.id);
            if (pawaCheck.success && pawaCheck.status === "COMPLETED") {
              pay.status = "PAID";
              await (admin as any)
                .from("payments")
                .update({ status: "PAID", updated_at: new Date().toISOString() })
                .eq("id", pay.id);
            }
          } catch {
            // non bloquant
          }
        }

        if (pay.status === "PAID" || pay.status === "COMPLETED") {
          matchingPayments.push(pay);
        }
      }
    }

    // 4. Charger les achats dans digital_product_purchases
    const { data: allPurchases } = await (admin as any)
      .from("digital_product_purchases")
      .select(
        "id, product_id, user_id, price_paid, payment_method, payment_status, transaction_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    const verifiedPurchases: any[] = [];
    if (allPurchases && allPurchases.length > 0) {
      for (const pur of allPurchases) {
        const userIdStr = String(pur.user_id || "").toLowerCase();
        const isUserMatch = candidateUserIds.has(pur.user_id);
        const isExactGuestIdMatch =
          userIdStr === `email_${encodedEmail}` || userIdStr === rawEmail;
        const isTxMatch = matchingPayments.some(
          (p) => p.id === pur.transaction_id || p.id === pur.id
        );

        if (isUserMatch || isExactGuestIdMatch || isTxMatch) {
          if (pur.payment_status === "COMPLETED" || pur.payment_status === "PAID") {
            verifiedPurchases.push(pur);
          }
        }
      }
    }

    const downloadLinks: Array<{
      title: string;
      downloadUrl: string;
      orderNumber: string;
      price: number;
    }> = [];
    const sentProductIds = new Set<string>();

    // 5. Générer les liens et les envoyer par e-mail à l'acheteur
    for (const pur of verifiedPurchases) {
      const targetProductId = pur.product_id;
      const product = productsList.find((p: any) => p.id === targetProductId);
      if (!product || sentProductIds.has(targetProductId)) continue;

      sentProductIds.add(targetProductId);

      const token = generateDigitalProductToken(targetProductId, pur.id, rawEmail, 168);
      const dlUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${targetProductId}/download?token=${token}`;

      downloadLinks.push({
        title: product.title || "Livre Numérique",
        downloadUrl: dlUrl,
        orderNumber: `DP-${String(pur.transaction_id || pur.id).substring(0, 8).toUpperCase()}`,
        price: Number(pur.price_paid || product.price || 0),
      });

      try {
        await sendDigitalProductDeliveryEmail(
          rawEmail,
          customerName,
          product.title || "Livre Numérique",
          dlUrl,
          `REC-${String(pur.id).substring(0, 8).toUpperCase()}`,
          Number(pur.price_paid || product.price || 0)
        );
      } catch {}
    }

    // 6. Rattrapage des paiements validés sans ligne dans digital_product_purchases
    for (const pay of matchingPayments) {
      const parts = String(pay.method || "").split("::");
      if (parts[1] === "DIGITAL_PRODUCT" && parts[2]) {
        const productId = parts[2];
        if (sentProductIds.has(productId)) continue;

        const product = productsList.find((p: any) => p.id === productId);
        if (!product) continue;

        sentProductIds.add(productId);
        const purchaseId = pay.id;

        try {
          await (admin as any).from("digital_product_purchases").upsert(
            {
              id: purchaseId,
              product_id: productId,
              user_id: pay.user_id,
              price_paid: pay.amount,
              payment_method: "pawapay",
              payment_status: "COMPLETED",
              transaction_id: pay.id,
              created_at: new Date().toISOString(),
            },
            { onConflict: "product_id,user_id" }
          );
        } catch {}

        const token = generateDigitalProductToken(productId, purchaseId, rawEmail, 168);
        const dlUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${token}`;

        downloadLinks.push({
          title: product.title || "Livre Numérique",
          downloadUrl: dlUrl,
          orderNumber: `DP-${String(pay.id).substring(0, 8).toUpperCase()}`,
          price: Number(pay.amount || product.price || 0),
        });

        try {
          await sendDigitalProductDeliveryEmail(
            rawEmail,
            customerName,
            product.title || "Livre Numérique",
            dlUrl,
            `REC-${String(pay.id).substring(0, 8).toUpperCase()}`,
            Number(pay.amount || product.price || 0)
          );
        } catch {}
      }
    }

    if (downloadLinks.length === 0) {
      return NextResponse.json({
        success: false,
        message:
          "Si un achat validé est associé à cette adresse e-mail, un lien d'accès sécurisé vous a été envoyé.",
      });
    }

    // Ne retourner les liens directs dans le corps JSON que si l'utilisateur est authentifié avec cet email
    if (isAuthenticatedOwner) {
      return NextResponse.json({
        success: true,
        message:
          "Votre achat a été authentifié avec succès ! Votre lien de téléchargement est disponible ci-dessous et une copie a été envoyée par e-mail.",
        downloadLinks,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Un e-mail contenant vos liens de téléchargement sécurisés vient d'être envoyé à ${rawEmail}. Veuillez vérifier votre boîte de réception (ainsi que vos courriers indésirables).`,
    });
  } catch (error: any) {
    console.error("[resend-access] Critical error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de vos liens d'accès." },
      { status: 500 }
    );
  }
}
