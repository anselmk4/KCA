import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateDigitalProductToken } from "@/lib/digital-product-token";
import { sendDigitalProductDeliveryEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Endpoint public permettant à un acheteur (inscrit ou invité) de demander la réexpédition
 * de ses liens de téléchargement de produits numériques vers son adresse e-mail.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez fournir une adresse e-mail valide." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    let sentCount = 0;
    const sentProductIds = new Set<string>();

    // 1. Chercher si un profil utilisateur existe avec cet email
    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email)
      .maybeSingle();

    const customerName = profile?.full_name || email.split("@")[0] || "Client";

    // 2. Recherche A : Achats rattachés à un user_id existant
    if (profile?.id) {
      const { data: userPurchases } = await (admin as any)
        .from("digital_product_purchases")
        .select(`
          id,
          product_id,
          price_paid,
          digital_products:product_id (
            id,
            title,
            profiles:author_id (
              full_name,
              academy_name
            )
          )
        `)
        .eq("user_id", profile.id)
        .eq("payment_status", "COMPLETED");

      if (userPurchases && userPurchases.length > 0) {
        for (const pur of userPurchases) {
          const product = pur.digital_products;
          if (!product || sentProductIds.has(pur.product_id)) continue;

          sentProductIds.add(pur.product_id);
          const authorName =
            product.profiles?.full_name || product.profiles?.academy_name || "Auteur certifié";

          const token = generateDigitalProductToken(
            pur.product_id,
            pur.id,
            email,
            168 // 7 jours
          );
          const downloadUrl = `/api/digital-products/${pur.product_id}/download?token=${token}`;

          try {
            await sendDigitalProductDeliveryEmail(
              email,
              customerName,
              product.title || "Livre Numérique",
              downloadUrl,
              `REC-${pur.id.substring(0, 8).toUpperCase()}`,
              Number(pur.price_paid || 0),
              authorName
            );
            sentCount++;
          } catch (mailErr) {
            console.error("[resend-access] Error sending email for registered purchase:", mailErr);
          }
        }
      }
    }

    // 3. Recherche B : Achats invités payés via PawaPay Mobile Money (stockés dans table payments)
    const encodedEmail = encodeURIComponent(email);
    const { data: momoPayments } = await (admin as any)
      .from("payments")
      .select("id, amount, method, status, user_id")
      .eq("status", "PAID")
      .ilike("method", `%${encodedEmail}%`);

    if (momoPayments && momoPayments.length > 0) {
      for (const pay of momoPayments) {
        // Format method: carrier::DIGITAL_PRODUCT::productId::email
        const parts = (pay.method || "").split("::");
        if (parts[1] === "DIGITAL_PRODUCT" && parts[2]) {
          const productId = parts[2];
          if (sentProductIds.has(productId)) continue;

          // Récupérer le produit
          const { data: product } = await (admin as any)
            .from("digital_products")
            .select(`
              id,
              title,
              profiles:author_id (
                full_name,
                academy_name
              )
            `)
            .eq("id", productId)
            .maybeSingle();

          if (!product) continue;

          // S'assurer qu'une ligne d'achat existe
          let purchaseId = pay.id;
          const { data: purRow } = await (admin as any)
            .from("digital_product_purchases")
            .select("id")
            .eq("product_id", productId)
            .eq("user_id", pay.user_id)
            .maybeSingle();

          if (purRow?.id) {
            purchaseId = purRow.id;
          } else {
            // Créer la ligne si manquante
            const { data: createdPur } = await (admin as any)
              .from("digital_product_purchases")
              .upsert({
                id: purchaseId,
                product_id: productId,
                user_id: pay.user_id,
                price_paid: pay.amount,
                payment_method: "pawapay",
                payment_status: "COMPLETED",
                transaction_id: pay.id,
                created_at: new Date().toISOString(),
              } as any, { onConflict: "product_id,user_id" })
              .select("id")
              .maybeSingle();

            if (createdPur?.id) purchaseId = createdPur.id;
          }

          sentProductIds.add(productId);
          const authorName =
            product.profiles?.full_name || product.profiles?.academy_name || "Auteur certifié";

          const token = generateDigitalProductToken(
            productId,
            purchaseId,
            email,
            168 // 7 jours
          );
          const downloadUrl = `/api/digital-products/${productId}/download?token=${token}`;

          try {
            await sendDigitalProductDeliveryEmail(
              email,
              customerName,
              product.title || "Livre Numérique",
              downloadUrl,
              `REC-${pay.id.substring(0, 8).toUpperCase()}`,
              Number(pay.amount || 0),
              authorName
            );
            sentCount++;
          } catch (mailErr) {
            console.error("[resend-access] Error sending email for guest payment:", mailErr);
          }
        }
      }
    }

    if (sentCount === 0) {
      return NextResponse.json({
        success: false,
        message:
          "Aucun achat validé n'a été trouvé pour cette adresse e-mail. Veuillez vérifier l'orthographe de votre email ou contacter notre support.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Succès ! ${sentCount} lien(s) de téléchargement sécurisé(s) vienne(nt) d'être expédié(s) à ${email}.`,
      sentCount,
    });
  } catch (error: any) {
    console.error("[resend-access] Critical error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de vos liens d'accès." },
      { status: 500 }
    );
  }
}
