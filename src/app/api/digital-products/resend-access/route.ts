import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateDigitalProductToken } from "@/lib/digital-product-token";
import { sendDigitalProductDeliveryEmail } from "@/lib/email";
import { getPawaPayDepositStatus } from "@/lib/pawapay";

export const dynamic = "force-dynamic";

/**
 * Endpoint public ultra-robuste permettant de réexpédier les liens de téléchargement
 * aux clients ayant acheté un produit numérique (inscrit ou invité).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInputEmail = (body.email || "").trim();

    if (!rawInputEmail || !rawInputEmail.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez fournir une adresse e-mail valide." },
        { status: 400 }
      );
    }

    const cleanEmail = rawInputEmail.toLowerCase();
    const [localPart, domainPart] = cleanEmail.split("@");

    // Construire les variantes possibles (gestion tolérante des fautes de frappe de domaine ex: yahoo vs gmail)
    const emailVariants = new Set<string>([cleanEmail]);
    if (domainPart.includes("yahoo")) {
      emailVariants.add(`${localPart}@gmail.com`);
    } else if (domainPart.includes("gmail")) {
      emailVariants.add(`${localPart}@yahoo.fr`);
      emailVariants.add(`${localPart}@yahoo.com`);
    }

    const admin = getSupabaseAdmin();
    let sentCount = 0;
    const sentProductIds = new Set<string>();
    const matchedOriginalEmails = new Set<string>();

    // 1. Recherche de profils associés (exact ou par nom d'utilisateur)
    const { data: matchedProfiles } = await (admin as any)
      .from("profiles")
      .select("id, full_name, email")
      .or(`email.ilike.${cleanEmail},email.ilike.${localPart}@%`);

    const candidateUserIds = new Set<string>();
    let customerName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

    if (matchedProfiles && matchedProfiles.length > 0) {
      for (const p of matchedProfiles) {
        if (p.id) candidateUserIds.add(p.id);
        if (p.full_name) customerName = p.full_name;
        if (p.email) matchedOriginalEmails.add(p.email.toLowerCase());
      }
    }

    // 2. Recherche tolérante dans les paiements (PawaPay Mobile Money, PayPal, etc.)
    // On extrait les paiements de type DIGITAL_PRODUCT récents pour analyse en mémoire
    const { data: digitalPayments } = await (admin as any)
      .from("payments")
      .select("id, amount, method, status, user_id, failure_reason, created_at")
      .ilike("method", "%DIGITAL_PRODUCT%")
      .order("created_at", { ascending: false })
      .limit(300);

    const matchingPayments: any[] = [];

    if (digitalPayments && digitalPayments.length > 0) {
      for (const pay of digitalPayments) {
        const rawMethod = (pay.method || "").toLowerCase();
        let decodedMethod = "";
        try {
          decodedMethod = decodeURIComponent(rawMethod);
        } catch {
          decodedMethod = rawMethod;
        }

        // Vérifier si la méthode de paiement contient l'adresse email ou le préfixe
        let isMatch = false;
        let matchedEmailFound = "";

        for (const variant of emailVariants) {
          if (decodedMethod.includes(variant) || rawMethod.includes(encodeURIComponent(variant))) {
            isMatch = true;
            matchedEmailFound = variant;
            break;
          }
        }

        // Tolérance : si même préfixe d'email (ex: kmushombe@...)
        if (!isMatch && localPart.length >= 4 && decodedMethod.includes(`${localPart}@`)) {
          isMatch = true;
          const extractedEmail = decodedMethod.split("::")[3] || "";
          if (extractedEmail.includes("@")) {
            matchedEmailFound = extractedEmail.toLowerCase();
          }
        }

        if (isMatch) {
          if (matchedEmailFound) matchedOriginalEmails.add(matchedEmailFound);
          if (pay.user_id) candidateUserIds.add(pay.user_id);

          // Si le paiement était encore marqué PENDING, vérifier l'état en direct auprès de PawaPay
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
            } catch (pawaErr) {
              console.warn("[resend-access] Live PawaPay check warning:", pawaErr);
            }
          }

          if (pay.status === "PAID" || pay.status === "COMPLETED") {
            matchingPayments.push(pay);
          }
        }
      }
    }

    // 3. Recherche dans digital_product_purchases
    const { data: allPurchases } = await (admin as any)
      .from("digital_product_purchases")
      .select(`
        id,
        product_id,
        user_id,
        price_paid,
        payment_method,
        payment_status,
        transaction_id,
        created_at,
        digital_products:product_id (
          id,
          title,
          price,
          profiles:author_id (
            full_name,
            academy_name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    const verifiedPurchases: any[] = [];

    if (allPurchases && allPurchases.length > 0) {
      for (const pur of allPurchases) {
        const userIdStr = String(pur.user_id || "").toLowerCase();
        const txIdStr = String(pur.transaction_id || "").toLowerCase();

        const isUserMatch = candidateUserIds.has(pur.user_id);
        const isEmailInUserId =
          userIdStr.includes(cleanEmail) ||
          (localPart.length >= 4 && userIdStr.includes(localPart));
        const isTxMatch = matchingPayments.some(
          (p) => p.id === pur.transaction_id || p.id === pur.id
        );

        if (isUserMatch || isEmailInUserId || isTxMatch) {
          if (pur.payment_status === "COMPLETED" || pur.payment_status === "PAID") {
            verifiedPurchases.push(pur);
          }
        }
      }
    }

    // 4. Traiter les achats trouvés via digital_product_purchases
    for (const pur of verifiedPurchases) {
      const product = pur.digital_products;
      if (!product || sentProductIds.has(pur.product_id)) continue;

      sentProductIds.add(pur.product_id);
      const authorName =
        product.profiles?.full_name || product.profiles?.academy_name || "Auteur certifié";

      const token = generateDigitalProductToken(
        pur.product_id,
        pur.id,
        cleanEmail,
        168 // 7 jours
      );
      const downloadUrl = `/api/digital-products/${pur.product_id}/download?token=${token}`;

      // Envoyer à l'adresse saisie par le client
      try {
        await sendDigitalProductDeliveryEmail(
          cleanEmail,
          customerName,
          product.title || "Livre Numérique",
          downloadUrl,
          `REC-${pur.id.substring(0, 8).toUpperCase()}`,
          Number(pur.price_paid || product.price || 0),
          authorName
        );
        sentCount++;
      } catch (mailErr) {
        console.error("[resend-access] Error sending email to cleanEmail:", mailErr);
      }

      // Si l'achat avait été fait avec un autre email (ex: gmail), envoyer aussi une copie à cet email
      for (const origEmail of matchedOriginalEmails) {
        if (origEmail && origEmail !== cleanEmail) {
          try {
            await sendDigitalProductDeliveryEmail(
              origEmail,
              customerName,
              product.title || "Livre Numérique",
              downloadUrl,
              `REC-${pur.id.substring(0, 8).toUpperCase()}`,
              Number(pur.price_paid || product.price || 0),
              authorName
            );
          } catch {
            // non bloquant
          }
        }
      }
    }

    // 5. Traiter les paiements validés pour lesquels la ligne digital_product_purchases manquerait
    for (const pay of matchingPayments) {
      const parts = (pay.method || "").split("::");
      if (parts[1] === "DIGITAL_PRODUCT" && parts[2]) {
        const productId = parts[2];
        if (sentProductIds.has(productId)) continue;

        const { data: product } = await (admin as any)
          .from("digital_products")
          .select(`
            id,
            title,
            price,
            profiles:author_id (
              full_name,
              academy_name
            )
          `)
          .eq("id", productId)
          .maybeSingle();

        if (!product) continue;

        let purchaseId = pay.id;
        try {
          const { data: createdPur } = await (admin as any)
            .from("digital_product_purchases")
            .upsert(
              {
                id: purchaseId,
                product_id: productId,
                user_id: pay.user_id,
                price_paid: pay.amount,
                payment_method: "pawapay",
                payment_status: "COMPLETED",
                transaction_id: pay.id,
                created_at: new Date().toISOString(),
              } as any,
              { onConflict: "product_id,user_id" }
            )
            .select("id")
            .maybeSingle();

          if (createdPur?.id) purchaseId = createdPur.id;
        } catch {
          // non bloquant
        }

        sentProductIds.add(productId);
        const authorName =
          product.profiles?.full_name || product.profiles?.academy_name || "Auteur certifié";

        const token = generateDigitalProductToken(
          productId,
          purchaseId,
          cleanEmail,
          168 // 7 jours
        );
        const downloadUrl = `/api/digital-products/${productId}/download?token=${token}`;

        try {
          await sendDigitalProductDeliveryEmail(
            cleanEmail,
            customerName,
            product.title || "Livre Numérique",
            downloadUrl,
            `REC-${pay.id.substring(0, 8).toUpperCase()}`,
            Number(pay.amount || product.price || 0),
            authorName
          );
          sentCount++;
        } catch (mailErr) {
          console.error("[resend-access] Error sending email from payments fallback:", mailErr);
        }

        for (const origEmail of matchedOriginalEmails) {
          if (origEmail && origEmail !== cleanEmail) {
            try {
              await sendDigitalProductDeliveryEmail(
                origEmail,
                customerName,
                product.title || "Livre Numérique",
                downloadUrl,
                `REC-${pay.id.substring(0, 8).toUpperCase()}`,
                Number(pay.amount || product.price || 0),
                authorName
              );
            } catch {
              // non bloquant
            }
          }
        }
      }
    }

    if (sentCount === 0) {
      return NextResponse.json({
        success: false,
        message: `Aucun achat validé n'a été trouvé pour l'adresse ${cleanEmail}. Si vous avez utilisé une autre adresse e-mail lors de votre paiement (ex : Gmail au lieu de Yahoo), merci d'essayer avec cette dernière ou de contacter notre support.`,
      });
    }

    const note =
      matchedOriginalEmails.size > 0 && ![...matchedOriginalEmails].includes(cleanEmail)
        ? ` (Achat initialement associé à ${[...matchedOriginalEmails].join(", ")})`
        : "";

    return NextResponse.json({
      success: true,
      message: `Succès ! Vos liens de téléchargement sécurisés viennent d'être expédiés à ${cleanEmail}${note}. Veuillez consulter votre boîte de réception.`,
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
